#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")

/**
 * release.main.kts — Build and deploy the game.
 *
 * Subcommands:
 *   prepare  [--version <v>]
 *       Build deployable artifact; stage it in .deploy_pkg/<version>/.
 *       On main (or empty commit atop main): semver, auto-bumped or explicit.
 *       On any other branch: vTEST-<commitid>; no tag created.
 *       Passing an explicit semver when not on main is an error.
 *       Emits the version string to stdout for capture by callers.
 *
 *   deploy  --env <dev|staging|production>  [--version <v>]
 *       Read staged artifact from .deploy_pkg/<version>/ and deploy to the
 *       target environment. If --version is omitted, uses the sole prepared
 *       version or errors if zero or multiple exist.
 *       Does NOT delete .deploy_pkg/<version>/ — artifact is kept so you can
 *       deploy the same build to multiple environments.
 *
 *       vTEST-* builds may ONLY be deployed to dev; staging and production
 *       require a semver release built from main.
 *
 *   Environments:
 *     dev        → /dev/ folder in web_deploy branch → dev.pastthepost.gg
 *     staging    → /staging/ folder in web_deploy branch → staging.pastthepost.gg
 *     production → root of web_deploy branch → pastthepost.gg
 *
 * Examples:
 *   ./release.main.kts -- prepare
 *   ./release.main.kts -- deploy --env staging
 *
 *   VERSION=$(./release.main.kts -- prepare)
 *   ./release.main.kts -- deploy --env staging --version "$VERSION"
 *   ./release.main.kts -- deploy --env production --version "$VERSION"
 *
 *   # Branch build to dev:
 *   VERSION=$(./release.main.kts -- prepare)
 *   ./release.main.kts -- deploy --env dev --version "$VERSION"
 *
 *   # Explicit semver on main only:
 *   ./release.main.kts -- prepare --version v0.1.0
 *   ./release.main.kts -- deploy --env production --version v0.1.0
 */

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.core.subcommands
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.options.required
import java.io.File
import java.net.URI
import java.time.Instant
import java.util.zip.ZipInputStream

// ─── Locate game/ directory ───────────────────────────────────────────────────

val cwd = File(System.getProperty("user.dir"))
val gameDir: File = when {
    File(cwd, "web/BUILD.bazel").exists() -> cwd
    File(cwd, "game/web/BUILD.bazel").exists() -> File(cwd, "game")
    else -> {
        System.err.println("ERROR: Run from game/ or repo root (could not find web/BUILD.bazel).")
        kotlin.system.exitProcess(1)
    }
}

val deployPkgDir = File(gameDir, ".deploy_pkg")
val bazelBinZip = File(gameDir, "bazel-bin/web/deployable.zip")
val mapper = jacksonObjectMapper()

// ─── Shell helpers ────────────────────────────────────────────────────────────

/** Capture stdout+stderr from a command; fail on non-zero exit. */
fun sh(vararg cmd: String, dir: File = gameDir): String {
    val pb = ProcessBuilder(*cmd).redirectErrorStream(true).directory(dir)
    val proc = pb.start()
    val out = proc.inputStream.bufferedReader().readText().trim()
    val exit = proc.waitFor()
    if (exit != 0) {
        System.err.println("ERROR: Command failed (exit $exit): ${cmd.joinToString(" ")}")
        if (out.isNotBlank()) System.err.println(out)
        kotlin.system.exitProcess(exit)
    }
    return out
}

/** Try a command; return output + exit code without failing. */
fun trysh(vararg cmd: String, dir: File = gameDir): Pair<String, Int> {
    val pb = ProcessBuilder(*cmd).redirectErrorStream(true).directory(dir)
    val proc = pb.start()
    val out = proc.inputStream.bufferedReader().readText().trim()
    return out to proc.waitFor()
}

/** Run a command with inherited I/O (live terminal output). Fails on non-zero exit. */
fun shLive(vararg cmd: String, dir: File = gameDir) {
    val exit = ProcessBuilder(*cmd).inheritIO().directory(dir).start().waitFor()
    if (exit != 0) {
        System.err.println("ERROR: Command failed (exit $exit): ${cmd.joinToString(" ")}")
        kotlin.system.exitProcess(exit)
    }
}

fun err(msg: String): Nothing {
    System.err.println("ERROR: $msg")
    kotlin.system.exitProcess(1)
}

// ─── Working-copy detection ───────────────────────────────────────────────────

data class WorkingCopy(
    val changeId: String,
    val commitId: String,
    val onMain: Boolean,
) {
    val isTestBuild get() = !onMain
}

fun detectWorkingCopy(): WorkingCopy {
    val changeId    = sh("jj", "log", "--no-graph", "-r", "@",    "-T", "change_id.short(12)")
    val mainChange  = sh("jj", "log", "--no-graph", "-r", "main", "-T", "change_id.short(12)")
    val commitId    = sh("jj", "log", "--no-graph", "-r", "@",    "-T", "commit_id.short(12)")
    val isEmpty     = sh("jj", "log", "--no-graph", "-r", "@",    "-T", "empty") == "true"
    val parentChange = trysh("jj", "log", "--no-graph", "-r", "@-", "-T", "change_id.short(12)").first

    val onMain = changeId == mainChange || (isEmpty && parentChange == mainChange)
    return WorkingCopy(changeId = changeId, commitId = commitId, onMain = onMain)
}

// ─── Version helpers ──────────────────────────────────────────────────────────

val SEMVER_RE = Regex("""^v\d+\.\d+\.\d+""")

fun isSemver(v: String) = SEMVER_RE.containsMatchIn(v)

fun autoSemverBump(): String {
    val tagLine = Regex("""v(\d+)\.(\d+)\.(\d+)""")
    val max = sh("jj", "tag", "list")
        .lines()
        .mapNotNull { tagLine.find(it) }
        .map { Triple(it.groupValues[1].toInt(), it.groupValues[2].toInt(), it.groupValues[3].toInt()) }
        .maxWithOrNull(compareBy({ it.first }, { it.second }, { it.third }))
        ?: err("No existing semver tags found. Specify --version explicitly: --version v0.0.1")
    return "v${max.first}.${max.second}.${max.third + 1}"
}

// ─── Staged artifact metadata ─────────────────────────────────────────────────

data class PrepareMetadata(
    val version: String,
    val changeId: String,
    val commitId: String,
    val isTestBuild: Boolean,
    val preparedAt: String,
)

data class DeployMetadata(
    val version: String,
    val commit: String,
    val environment: String,
    val timestamp: String,
)

// ─── Zip extraction ───────────────────────────────────────────────────────────

fun extractZip(zipFile: File, destDir: File) {
    ZipInputStream(zipFile.inputStream().buffered()).use { zis ->
        var entry = zis.nextEntry
        while (entry != null) {
            val target = File(destDir, entry.name)
            if (entry.isDirectory) {
                target.mkdirs()
            } else {
                target.parentFile?.mkdirs()
                target.outputStream().buffered().use { zis.copyTo(it) }
            }
            zis.closeEntry()
            entry = zis.nextEntry
        }
    }
}

// ─── Resolve staged version ───────────────────────────────────────────────────

fun resolveVersion(versionArg: String?): String {
    if (versionArg != null) return versionArg
    val prepared = (deployPkgDir.listFiles() ?: emptyArray<File>())
        .filter { it.isDirectory && File(it, "prepare-metadata.json").exists() }
    return when (prepared.size) {
        0 -> err("No staged releases in .deploy_pkg/. Run 'prepare' first.")
        1 -> prepared.first().name
        else -> err(
            "Multiple staged releases found — specify --version:\n" +
            prepared.joinToString("\n") { "  ${it.name}" }
        )
    }
}

// ─── prepare ─────────────────────────────────────────────────────────────────

class Prepare : CliktCommand(
    name = "prepare",
    help = "Build artifact and stage it in .deploy_pkg/<version>/. Emits version to stdout."
) {
    val versionOpt by option("--version", help = "Explicit version tag (semver; main only)")

    override fun run() {
        val wc = detectWorkingCopy()

        val version = when {
            versionOpt != null -> {
                if (!isSemver(versionOpt!!))
                    err("--version must be semver (e.g. v0.1.0), got: $versionOpt")
                if (wc.isTestBuild)
                    err(
                        "Semver version tags can only be created from main.\n" +
                        "  Current commit ${wc.commitId} is not on main.\n" +
                        "  Merge your branch first, or omit --version for a test build."
                    )
                versionOpt!!
            }
            wc.onMain -> autoSemverBump()
            else -> "vTEST-${wc.commitId}"
        }

        System.err.println("Preparing release: $version")
        if (wc.isTestBuild) System.err.println("  (test build — no tag will be created)")
        System.err.println()

        // Build
        System.err.println("Step 1: Building deployable artifact...")
        shLive("bazel", "build", "//web:deployable")
        if (!bazelBinZip.exists()) err("Artifact not found at $bazelBinZip after build.")
        System.err.println()

        // Stage
        val pkgDir = File(deployPkgDir, version)
        if (pkgDir.exists()) pkgDir.deleteRecursively()
        pkgDir.mkdirs()

        System.err.println("Step 2: Staging artifact to .deploy_pkg/$version/ ...")
        val stagedZip = File(pkgDir, "artifact.zip")
        bazelBinZip.copyTo(stagedZip, overwrite = true)

        val meta = PrepareMetadata(
            version = version,
            changeId = wc.changeId,
            commitId = wc.commitId,
            isTestBuild = wc.isTestBuild,
            preparedAt = Instant.now().toString(),
        )
        mapper.writerWithDefaultPrettyPrinter()
            .writeValue(File(pkgDir, "prepare-metadata.json"), meta)
        System.err.println("  ✓ Staged")
        System.err.println()

        // Tag (main builds only)
        if (!wc.isTestBuild) {
            System.err.println("Step 3: Creating and pushing tag $version ...")
            sh("jj", "tag", "set", version, "-r", "main")
            sh("jj", "git", "push", "-r", version)
            System.err.println("  ✓ Tag created and pushed")
            System.err.println()
        }

        System.err.println("Release prepared!")
        System.err.println("  Version:  $version")
        System.err.println("  Artifact: ${stagedZip.absolutePath}")
        System.err.println("  Deploy:   ./release.main.kts -- deploy --env staging --version $version")

        // Version to stdout for capture
        println(version)
    }
}

// ─── deploy ──────────────────────────────────────────────────────────────────

class Deploy : CliktCommand(
    name = "deploy",
    help = "Deploy a staged artifact from .deploy_pkg/<version>/ to dev, staging, or production."
) {
    val env by option("--env", help = "Target environment: dev, staging, or production").required()
    val versionOpt by option("--version", help = "Version to deploy (default: sole staged version)")

    override fun run() {
        if (env != "dev" && env != "staging" && env != "production")
            err("--env must be 'dev', 'staging', or 'production', got: $env")

        val version = resolveVersion(versionOpt)
        val pkgDir = File(deployPkgDir, version)
        val stagedZip = File(pkgDir, "artifact.zip")
        val metaFile = File(pkgDir, "prepare-metadata.json")

        if (!pkgDir.exists()) err("No staged release for '$version'. Run 'prepare' first.")
        if (!stagedZip.exists()) err("Artifact missing: $stagedZip")
        if (!metaFile.exists()) err("Metadata missing: $metaFile")

        val meta: PrepareMetadata = mapper.readValue(metaFile)
        val isTestBuild = meta.isTestBuild

        // vTEST builds may only go to dev — never to staging or production.
        if (isTestBuild && env != "dev")
            err(
                "Test builds (vTEST-*) can only be deployed to 'dev', not '$env'.\n" +
                "  To deploy to $env, build from main (a semver release).\n" +
                "  To test this build: ./release.main.kts -- deploy --env dev --version $version"
            )

        val workspaceName = ".deploy_$env"
        val workspaceDir = File(gameDir, workspaceName)
        val verifyUrl = when (env) {
            "dev"     -> "https://dev.pastthepost.gg/deployment-metadata.json"
            "staging" -> "https://staging.pastthepost.gg/deployment-metadata.json"
            else      -> "https://pastthepost.gg/deployment-metadata.json"
        }

        // Skip already-deployed guard for test builds
        if (!isTestBuild) {
            val (log) = trysh("jj", "log", "-r", "web_deploy", "--no-graph", "-T", "description")
            val deployed = Regex("$env: ([^ ]+)").find(log)?.groupValues?.get(1) ?: ""
            if (deployed == version) {
                System.err.println("⚠ $version already deployed to $env. Skipping.")
                return
            }
        }

        if (workspaceDir.exists())
            err(
                "Workspace directory already exists: $workspaceDir\n" +
                "  Clean up: rm -rf $workspaceDir && jj workspace forget $workspaceName"
            )

        System.err.println("Deploying $version to $env ...")
        System.err.println()

        var workspaceCreated = false
        try {
            System.err.println("Step 1: Creating deployment workspace ...")
            sh("jj", "workspace", "add", workspaceName)
            workspaceCreated = true

            System.err.println("Step 2: Starting commit on web_deploy ...")
            sh("jj", "new", "web_deploy", dir = workspaceDir)

            System.err.println("Step 3: Extracting artifact ...")
            val deployRoot = when (env) {
                "dev", "staging" -> {
                    val sub = File(workspaceDir, env)
                    sub.deleteRecursively()
                    sub.mkdirs()
                    sub
                }
                else -> {
                    // Production: clear root but preserve the dev/ and staging/ subdirectories.
                    workspaceDir.listFiles()
                        ?.filter { it.name != ".jj" && it.name != "staging" && it.name != "dev" }
                        ?.forEach { it.deleteRecursively() }
                    workspaceDir
                }
            }
            extractZip(stagedZip, deployRoot)

            // Patch index.html: add version query string to bundle.js src so browsers
            // treat each deploy as a unique resource and bypass stale cache entries.
            // (BUILD-009 tracks the proper content-hash solution.)
            val indexHtml = File(deployRoot, "index.html")
            if (indexHtml.exists()) {
                val original = indexHtml.readText()
                val patched = original.replace(
                    """s.src = "bundle.js";""",
                    """s.src = "bundle.js?v=$version";"""
                )
                if (patched == original) {
                    System.err.println("⚠ WARNING: cache-bust patch had no effect — 's.src = \"bundle.js\";' not found in index.html")
                    System.err.println("  Browsers may serve a stale bundle. Check index.html and update release.main.kts.")
                } else {
                    indexHtml.writeText(patched)
                }
            }

            val deployMeta = DeployMetadata(
                version = version,
                commit = meta.commitId,
                environment = env,
                timestamp = Instant.now().toString(),
            )
            mapper.writerWithDefaultPrettyPrinter()
                .writeValue(File(deployRoot, "deployment-metadata.json"), deployMeta)
            System.err.println("  ✓ Extracted")

            System.err.println("Step 4: Committing ...")
            sh("jj", "commit", "-m", "$env: $version (${meta.commitId})", dir = workspaceDir)
            sh("jj", "bookmark", "set", "web_deploy", "-r", "@-", dir = workspaceDir)

            System.err.println("Step 5: Pushing web_deploy ...")
            sh("jj", "git", "push", "-b", "web_deploy")
            System.err.println("  ✓ Pushed")

            // Verify
            System.err.println("\n⏳ Verifying deployment (polling $verifyUrl) ...")
            val deadline = System.currentTimeMillis() + 120_000L
            var verified = false

            while (System.currentTimeMillis() < deadline) {
                try {
                    val conn = URI(verifyUrl).toURL().openConnection()
                    conn.connectTimeout = 5_000
                    conn.readTimeout = 5_000
                    val body = conn.getInputStream().bufferedReader().readText()
                    val live: DeployMetadata = mapper.readValue(body)
                    if (live.version == version && live.commit == meta.commitId && live.environment == env) {
                        verified = true
                        break
                    }
                } catch (_: Exception) {}
                Thread.sleep(5_000)
            }

            if (verified) {
                val url = when (env) {
                    "dev"     -> "https://dev.pastthepost.gg"
                    "staging" -> "https://staging.pastthepost.gg"
                    else      -> "https://pastthepost.gg"
                }
                System.err.println("✓ Deployed to $env")
                System.err.println("  Version: $version (${meta.commitId})")
                System.err.println("  URL:     $url")
            } else {
                System.err.println("⚠ Verification timed out — push succeeded but hosting may still be syncing.")
                System.err.println("  Check $verifyUrl manually.")
            }

        } finally {
            if (workspaceCreated) {
                System.err.println("\nCleaning up workspace ...")
                trysh("jj", "workspace", "forget", workspaceName)
                workspaceDir.deleteRecursively()
            }
        }
    }
}

// ─── Root command ─────────────────────────────────────────────────────────────

class Release : CliktCommand(
    name = "release",
    help = "Build and deploy the game.",
    invokeWithoutSubcommand = false,
) {
    init { subcommands(Prepare(), Deploy()) }
    override fun run() = Unit
}

Release().main(args)
