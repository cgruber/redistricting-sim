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
 *   deploy  --env <dev|beta|staging|production>  [--version <v>]
 *       Read staged artifact from .deploy_pkg/<version>/ and deploy to the
 *       target environment. If --version is omitted, uses the sole prepared
 *       version or errors if zero or multiple exist.
 *       Does NOT delete .deploy_pkg/<version>/ — artifact is kept so you can
 *       deploy the same build to multiple environments.
 *
 *       vTEST-* builds may ONLY be deployed to dev; beta, staging, and production
 *       require a semver release built from main.
 *
 *   Environments:
 *     dev        → /dev/ folder in web_deploy branch → dev.pastthepost.gg
 *     beta       → /beta/ folder in web_deploy branch → beta.pastthepost.gg
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
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.options.required
import java.io.File
import java.net.URI
import java.time.Instant
import java.util.zip.ZipInputStream

// ─── Locate game/ directory ───────────────────────────────────────────────────

val cwd = File(System.getProperty("user.dir"))
// Locate game/ (npm, playwright, .deploy_pkg live there) and the repo root
// (MODULE.bazel lives there; bazel-bin is created there).
val gameDir: File = when {
    File(cwd, "web/BUILD.bazel").exists() -> cwd
    File(cwd, "game/web/BUILD.bazel").exists() -> File(cwd, "game")
    else -> {
        System.err.println("ERROR: Run from game/ or repo root (could not find game/web/BUILD.bazel).")
        kotlin.system.exitProcess(1)
    }
}
val repoRoot: File = if (File(gameDir, "MODULE.bazel").exists()) gameDir else gameDir.parentFile

val deployPkgDir = File(gameDir, ".deploy_pkg")
val bazelBinZip = File(repoRoot, "bazel-bin/game/web/deployable.zip")
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
        shLive("bazel", "build", "//game/web:deployable", dir = repoRoot)
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
    help = "Deploy a staged artifact from .deploy_pkg/<version>/ to dev, beta, staging, or production."
) {
    val env by option("--env", help = "Target environment: dev, beta, staging, or production").required()
    val versionOpt by option("--version", help = "Version to deploy (default: sole staged version)")

    override fun run() {
        if (env != "dev" && env != "beta" && env != "staging" && env != "production")
            err("--env must be 'dev', 'beta', 'staging', or 'production', got: $env")

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
            "beta"    -> "https://beta.pastthepost.gg/deployment-metadata.json"
            "staging" -> "https://staging.pastthepost.gg/deployment-metadata.json"
            else      -> "https://pastthepost.gg/deployment-metadata.json"
        }

        // Skip already-deployed guard for test builds.
        //
        // We read the per-env deployment-metadata.json committed on web_deploy (each deploy
        // writes one into its env's subdir — dev/beta/staging/<file>, production at root; see
        // Step 3 below), NOT the tip commit description. Scraping the tip's "$env: $version"
        // line was wrong: each deploy commits only its own env line, so staging→beta→staging
        // found no staging match on the tip and re-deployed. The committed metadata file is the
        // durable per-env record and is unaffected by other envs deploying in between.
        //
        // Assumes `jj file show` (modern jj; was `jj cat`) — this repo is modern jj. A nonzero
        // exit / blank / unparseable result is treated as "not yet deployed → proceed" so the
        // FIRST deploy to an env (no file yet) is never blocked.
        if (!isTestBuild) {
            val metaPath = if (env == "production") "deployment-metadata.json" else "$env/deployment-metadata.json"
            // Run from repoRoot, not the default gameDir: `jj file show` resolves the fileset
            // path relative to cwd, and the metadata files live at the web_deploy tree ROOT
            // (e.g. <root>/beta/deployment-metadata.json). From game/ the path never resolves
            // (exit 1), which would fail-open and silently re-deploy every time.
            val (body, exit) = trysh("jj", "file", "show", "-r", "web_deploy", metaPath, dir = repoRoot)
            val deployedVersion = if (exit == 0 && body.isNotBlank()) {
                try {
                    mapper.readValue<DeployMetadata>(body).version
                } catch (_: Exception) {
                    ""
                }
            } else ""
            if (deployedVersion == version) {
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
                "dev", "beta", "staging" -> {
                    val sub = File(workspaceDir, env)
                    sub.deleteRecursively()
                    sub.mkdirs()
                    sub
                }
                else -> {
                    // Production: clear root but preserve the dev/, beta/, and staging/ subdirectories.
                    workspaceDir.listFiles()
                        ?.filter { it.name != ".jj" && it.name != "staging" && it.name != "beta" && it.name != "dev" }
                        ?.forEach { it.deleteRecursively() }
                    workspaceDir
                }
            }
            extractZip(stagedZip, deployRoot)

            // Patch index.html:
            //  1. Version query string on bundle.js so browsers bypass stale cache.
            //  2. Fill app-version / app-environment meta tags so JS can read them
            //     synchronously without an extra network fetch (avoids 404 console errors
            //     in environments that don't have deployment-metadata.json).
            // (BUILD-009 tracks the proper content-hash solution.)
            // A missing index.html is itself a "silently ship broken" failure mode —
            // the artifact is unusable without it. Fail loud rather than deploy nothing.
            val indexHtml = File(deployRoot, "index.html")
            if (!indexHtml.exists())
                err("index.html missing from extracted artifact at $indexHtml — cannot deploy.")

            run {
                var html = indexHtml.readText()

                // Each patch is by EXACT string replacement against an anchor in index.html.
                // A failed match means the anchor moved/changed (e.g. an index.html reformat,
                // see GAME-107) — the deploy would otherwise ship a stale bundle (no ?v=) or
                // empty version/environment meta. Treat any failed match as a HARD error so we
                // never silently ship a broken index.html. (game/web/release_patch_anchors_test.sh
                // guards these anchors in CI; keep that test and these literals in sync.)
                val bundlePatched = html.replace(
                    """s.src = "bundle.js";""",
                    """s.src = "bundle.js?v=$version";"""
                )
                if (bundlePatched == html)
                    err("bundle cache-bust patch had no effect — 's.src = \"bundle.js\";' not found in index.html. " +
                        "An index.html reformat likely broke the anchor; fix index.html or update release.main.kts.")
                html = bundlePatched

                val versionMetaPatched = html.replace(
                    """<meta name="app-version" content="">""",
                    """<meta name="app-version" content="$version">"""
                )
                if (versionMetaPatched == html)
                    err("app-version meta patch had no effect — '<meta name=\"app-version\" content=\"\">' not found in index.html. " +
                        "An index.html reformat likely broke the anchor; fix index.html or update release.main.kts.")
                html = versionMetaPatched

                val envMetaPatched = html.replace(
                    """<meta name="app-environment" content="">""",
                    """<meta name="app-environment" content="$env">"""
                )
                if (envMetaPatched == html)
                    err("app-environment meta patch had no effect — '<meta name=\"app-environment\" content=\"\">' not found in index.html. " +
                        "An index.html reformat likely broke the anchor; fix index.html or update release.main.kts.")
                html = envMetaPatched

                indexHtml.writeText(html)

                // Post-write assertion: read the file back from disk and confirm every patched
                // string is present. Belt-and-suspenders against a future patch-logic change that
                // silently drops a substitution. Asserts the PATCHED values, not the anchors.
                val written = indexHtml.readText()
                val expected = listOf(
                    """s.src = "bundle.js?v=$version";""",
                    """<meta name="app-version" content="$version">""",
                    """<meta name="app-environment" content="$env">""",
                )
                val missing = expected.filterNot { written.contains(it) }
                if (missing.isNotEmpty())
                    err("post-write verification of index.html failed — expected patched string(s) absent:\n" +
                        missing.joinToString("\n") { "  $it" })
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
                    "beta"    -> "https://beta.pastthepost.gg"
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

// ─── serve ────────────────────────────────────────────────────────────────────

class Serve : CliktCommand(
    name = "serve",
    help = "Build artifact, extract it locally, and serve it on localhost."
) {
    val port by option("--port", help = "HTTP port (default: 58080)").default("58080")

    override fun run() {
        val wc = detectWorkingCopy()
        val version = if (wc.onMain) {
            trysh("jj", "tag", "list").first
                .lines().lastOrNull { it.trim().startsWith("v") }?.trim()
                ?: "vTEST-${wc.commitId}"
        } else {
            "vTEST-${wc.commitId}"
        }

        System.err.println("Building $version for local serve ...")
        shLive("bazel", "build", "//game/web:deployable", dir = repoRoot)
        if (!bazelBinZip.exists()) err("Artifact not found at $bazelBinZip after build.")

        val serveDir = File(gameDir, ".local_serve/$version")
        if (serveDir.exists()) serveDir.deleteRecursively()
        serveDir.mkdirs()

        System.err.println("Extracting to ${serveDir.absolutePath} ...")
        extractZip(bazelBinZip, serveDir)

        // Patch index.html: inject version + environment so the in-game badge works.
        val indexHtml = File(serveDir, "index.html")
        if (indexHtml.exists()) {
            var html = indexHtml.readText()
            html = html.replace(
                """s.src = "bundle.js";""",
                """s.src = "bundle.js?v=$version";"""
            )
            html = html.replace(
                """<meta name="app-version" content="">""",
                """<meta name="app-version" content="$version">"""
            )
            html = html.replace(
                """<meta name="app-environment" content="">""",
                """<meta name="app-environment" content="local">"""
            )
            indexHtml.writeText(html)
        }

        System.err.println("Serving $version at http://localhost:$port  (Ctrl-C to stop)")
        shLive("python3", "-m", "http.server", port, "--directory", serveDir.absolutePath)
    }
}

// ─── Root command ─────────────────────────────────────────────────────────────

class Release : CliktCommand(
    name = "release",
    help = "Build and deploy the game.",
    invokeWithoutSubcommand = false,
) {
    init { subcommands(Prepare(), Deploy(), Serve()) }
    override fun run() = Unit
}

Release().main(args)
