#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")

/**
 * gh-pr-checks
 *
 * Lists individual CI check statuses for a GitHub PR: check name, status,
 * conclusion, and URL. Useful for diagnosing which specific checks are
 * pending, failing, or stuck (e.g. task-list-completed finishes in seconds
 * — if still pending it will never go green without intervention).
 * Shells out to `gh api` — requires `gh auth login` first.
 *
 * Usage:
 *   gh-pr-checks.main.kts -- --pr <N>
 *   gh-pr-checks.main.kts -- --pr <N> --owner myorg --repo myrepo
 *
 * Flags:
 *   --pr      PR number (required)
 *   --owner   GitHub owner/org (default: geekinasuit)
 *   --repo    GitHub repository name (default: infra)
 */

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.options.required
import com.github.ajalt.clikt.parameters.types.int
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

class GhPrChecks : CliktCommand(
    name = "gh-pr-checks",
    help = "List individual CI check statuses for a GitHub PR"
) {
    val pr    by option("--pr",    help = "PR number (required)").int().required()
    val owner by option("--owner", help = "GitHub owner/org").default("geekinasuit")
    val repo  by option("--repo",  help = "GitHub repo name").default("infra")

    val mapper = jacksonObjectMapper()

    override fun run() {
        val sha = sh("gh", "api", "repos/$owner/$repo/pulls/$pr", "--jq", ".head.sha").trim()

        val raw = sh("gh", "api", "repos/$owner/$repo/commits/$sha/check-runs",
            "--paginate", "--jq", ".check_runs[]")

        // gh api --jq outputs one JSON object per line when paginating
        val checks = raw.lines()
            .filter { it.isNotBlank() }
            .map { mapper.readTree(it) }

        if (checks.isEmpty()) {
            println("No checks found for PR #$pr (sha=$sha)")
            return
        }

        val passing = checks.count { it["conclusion"]?.asText() == "success" }
        val failing = checks.count { it["conclusion"]?.asText() in listOf("failure", "error", "timed_out", "action_required") }
        val pending = checks.count {
            val status = it["status"]?.asText() ?: ""
            val conclusion = it["conclusion"]
            status in listOf("in_progress", "queued", "waiting") ||
            (conclusion != null && conclusion.isNull)
        }
        val skipped = checks.count { it["conclusion"]?.asText() in listOf("skipped", "neutral", "cancelled") }

        println("PR #$pr checks  (sha=${sha.take(8)})  — $passing passing, $failing failing, $pending pending, $skipped skipped")
        println("─".repeat(72))

        checks.sortedWith(compareBy(
            { conclusionOrder(it["conclusion"]?.asText()) },
            { it["name"]?.asText() ?: "" }
        )).forEach { check ->
            val name       = check["name"]?.asText() ?: "unknown"
            val status     = check["status"]?.asText() ?: "unknown"
            val conclusion = check["conclusion"]?.takeIf { !it.isNull }?.asText()
            val url        = check["html_url"]?.asText() ?: check["details_url"]?.asText() ?: ""
            val badge      = badge(status, conclusion)
            println("  $badge  $name")
            if (url.isNotBlank()) println("       $url")
        }
    }

    private fun conclusionOrder(conclusion: String?): Int = when (conclusion) {
        "failure", "error", "timed_out" -> 0
        null                            -> 1  // pending / in-progress
        "success"                       -> 2
        else                            -> 3  // skipped / neutral / action_required
    }

    private fun badge(status: String, conclusion: String?): String = when {
        conclusion == "success"                                    -> "PASS   "
        conclusion in listOf("failure", "error")                  -> "FAIL   "
        conclusion == "timed_out"                                  -> "TIMEOUT"
        conclusion == "action_required"                            -> "ACTION "
        conclusion in listOf("skipped", "neutral", "cancelled")   -> "SKIP   "
        status in listOf("in_progress", "queued", "waiting")      -> "PENDING"
        else                                                       -> "?      "
    }
}

GhPrChecks().main(args)
