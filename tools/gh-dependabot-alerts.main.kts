#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")

/**
 * gh-dependabot-alerts
 *
 * Lists Dependabot vulnerability alerts for a GitHub repository: severity,
 * package (ecosystem), the manifest that pulls it in, the advisory summary,
 * the vulnerable range + first patched version, and the alert URL. Sorted
 * highest-severity first.
 *
 * This wraps `gh api repos/<owner>/<repo>/dependabot/alerts` so the call is a
 * reviewed, permitted tool rather than an ad-hoc `gh api` invocation. Requires
 * `gh auth login` with a token that can read the repo's security alerts
 * (repo admin, or org member with security-events read).
 *
 * Usage:
 *   tools/gh-dependabot-alerts.main.kts
 *   tools/gh-dependabot-alerts.main.kts --state all --severity high
 *   tools/gh-dependabot-alerts.main.kts --owner cgruber --repo redistricting-sim
 *
 * Flags (listing):
 *   --owner      GitHub owner/org (default: cgruber)
 *   --repo       GitHub repo name (default: redistricting-sim)
 *   --state      Alert state: open | dismissed | fixed | auto_dismissed | all (default: open)
 *   --severity   Filter by severity: critical | high | medium | low (default: all)
 *   --ecosystem  Filter by ecosystem: npm | pip | maven | … (default: all)
 *
 * Flags (dismissing — a reviewed write, no raw gh PATCH needed):
 *   --dismiss N  Alert number(s) to dismiss (repeatable). Switches to dismiss mode.
 *   --reason R   Dismiss reason: fix_started | inaccurate | no_bandwidth | not_used |
 *                tolerable_risk (default: not_used)
 *   --comment C  Optional note recorded with the dismissal
 *
 * Example:
 *   tools/gh-dependabot-alerts.main.kts --dismiss 2 --dismiss 3 --reason not_used \
 *     --comment "spike/001-game-poc is a frozen POC illustration, not deployed"
 */

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.multiple
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.int
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

fun sh(vararg command: String): String {
    val proc = ProcessBuilder(*command).redirectErrorStream(true).start()
    val output = proc.inputStream.bufferedReader().readText()
    val exit = proc.waitFor()
    if (exit != 0) {
        System.err.println("Command failed (exit $exit): ${command.joinToString(" ")}\n$output")
        kotlin.system.exitProcess(exit)
    }
    return output
}

class GhDependabotAlerts : CliktCommand(
    name = "gh-dependabot-alerts",
    help = "List Dependabot vulnerability alerts for a GitHub repository"
) {
    val owner     by option("--owner",     help = "GitHub owner/org").default("cgruber")
    val repo      by option("--repo",      help = "GitHub repo name").default("redistricting-sim")
    val state     by option("--state",     help = "open | dismissed | fixed | auto_dismissed | all").default("open")
    val severity  by option("--severity",  help = "critical | high | medium | low (default: all)").default("")
    val ecosystem by option("--ecosystem", help = "npm | pip | maven | … (default: all)").default("")
    val dismiss   by option("--dismiss",   help = "alert number to dismiss (repeatable)").int().multiple()
    val reason    by option("--reason",    help = "dismiss reason").default("not_used")
    val comment   by option("--comment",   help = "note recorded with the dismissal").default("")

    val mapper = jacksonObjectMapper()

    private val dismissReasons = setOf("fix_started", "inaccurate", "no_bandwidth", "not_used", "tolerable_risk")

    override fun run() {
        if (dismiss.isNotEmpty()) {
            dismissAlerts()
            return
        }
        listAlerts()
    }

    private fun dismissAlerts() {
        if (reason !in dismissReasons) {
            System.err.println("Invalid --reason '$reason'. Must be one of: ${dismissReasons.sorted().joinToString(", ")}")
            kotlin.system.exitProcess(2)
        }
        for (n in dismiss) {
            val cmd = mutableListOf(
                "gh", "api", "-X", "PATCH", "repos/$owner/$repo/dependabot/alerts/$n",
                "-f", "state=dismissed", "-f", "dismissed_reason=$reason",
            )
            if (comment.isNotBlank()) cmd += listOf("-f", "dismissed_comment=$comment")
            cmd += listOf("--jq", "{number, state, dismissed_reason, package: .dependency.package.name}")
            val res = sh(*cmd.toTypedArray()).trim()
            println("dismissed #$n ($reason): $res")
        }
    }

    private fun listAlerts() {
        // Build the gh api call. The Dependabot alerts API takes state/severity/ecosystem
        // as QUERY params on a GET. We append them to the URL path directly rather than via
        // `-f key=value` — `-f` flips `gh api` to a POST, which 404s on this GET-only route.
        val params = mutableListOf<String>()
        if (state != "all")         params += "state=$state"
        if (severity.isNotBlank())  params += "severity=$severity"
        if (ecosystem.isNotBlank()) params += "ecosystem=$ecosystem"
        params += "per_page=100"
        val path = "repos/$owner/$repo/dependabot/alerts?" + params.joinToString("&")

        // gh api --jq emits one JSON object per line when paginating.
        val alerts = sh("gh", "api", path, "--paginate", "--jq", ".[]").lines()
            .filter { it.isNotBlank() }
            .map { mapper.readTree(it) }

        val scope = buildString {
            append("state=$state")
            if (severity.isNotBlank()) append(", severity=$severity")
            if (ecosystem.isNotBlank()) append(", ecosystem=$ecosystem")
        }

        if (alerts.isEmpty()) {
            println("No Dependabot alerts for $owner/$repo ($scope).")
            return
        }

        val counts = alerts.groupingBy { sev(it) }.eachCount()
        val summary = listOf("critical", "high", "medium", "low")
            .filter { counts.containsKey(it) }
            .joinToString(", ") { "${counts[it]} $it" }
        println("$owner/$repo Dependabot alerts ($scope) — ${alerts.size} total: $summary")
        println("─".repeat(76))

        alerts.sortedWith(compareBy({ severityOrder(sev(it)) }, { pkgName(it) }))
            .forEach { a ->
                val vuln = a["security_vulnerability"]
                val adv = a["security_advisory"]
                val range = vuln?.get("vulnerable_version_range")?.asText() ?: "?"
                val patched = vuln?.get("first_patched_version")?.get("identifier")?.asText() ?: "none yet"
                val manifest = a["dependency"]?.get("manifest_path")?.asText() ?: "?"
                val ghsa = adv?.get("ghsa_id")?.asText() ?: ""
                val summaryText = adv?.get("summary")?.asText() ?: ""
                val url = a["html_url"]?.asText() ?: ""
                val stateText = a["state"]?.asText() ?: ""
                val badge = sev(a).uppercase().padEnd(8)

                println("  $badge #${a["number"]?.asText() ?: "?"}  ${pkgName(a)}  [$stateText]")
                println("       $summaryText")
                println("       manifest:    $manifest")
                println("       vulnerable:  $range   →   patched: $patched")
                if (ghsa.isNotBlank()) println("       advisory:    $ghsa")
                if (url.isNotBlank()) println("       $url")
                println()
            }
    }

    private fun sev(a: JsonNode): String =
        a["security_advisory"]?.get("severity")?.asText()?.lowercase() ?: "unknown"

    private fun pkgName(a: JsonNode): String {
        val dep = a["dependency"]?.get("package")
        val eco = dep?.get("ecosystem")?.asText() ?: "?"
        val name = dep?.get("name")?.asText() ?: "?"
        return "$eco:$name"
    }

    private fun severityOrder(s: String): Int = when (s) {
        "critical" -> 0
        "high"     -> 1
        "medium"   -> 2
        "low"      -> 3
        else       -> 4
    }
}

GhDependabotAlerts().main(args)
