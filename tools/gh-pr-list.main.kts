#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.0")

/**
 * gh-pr-list
 *
 * Lists pull requests for a GitHub repo with a concise summary per PR:
 * number, title, author, branch, draft status, review decision, and CI state.
 * Shells out to `gh pr list --json` — requires `gh auth login` first.
 *
 * Usage:
 *   kotlin gh-pr-list.main.kts -- [options]
 *   kotlin gh-pr-list.main.kts -- --owner myorg --repo myrepo
 *   kotlin gh-pr-list.main.kts -- --state all --limit 50
 *   kotlin gh-pr-list.main.kts -- --author octocat
 *
 * Flags:
 *   --owner   GitHub owner/org (default: geekinasuit)
 *   --repo    GitHub repository name (default: infra)
 *   --state   Filter by state: open|closed|merged|all (default: open)
 *   --limit   Max PRs to return (default: 30)
 *   --author  Filter by GitHub login (optional)
 */

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.int
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import java.time.Instant
import java.time.temporal.ChronoUnit

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

fun ciSummary(checks: JsonNode): String {
    if (checks.size() == 0) return "no checks"
    val passing = checks.count { it["conclusion"]?.asText() == "SUCCESS" }
    val failing = checks.count { it["conclusion"]?.asText() in listOf("FAILURE", "ERROR", "TIMED_OUT") }
    val pending = checks.count { check ->
        val status = check["status"]?.asText() ?: ""
        val state  = check["state"]?.asText() ?: ""
        val conclusion = check["conclusion"]
        status in listOf("IN_PROGRESS", "QUEUED", "WAITING") ||
        state in listOf("PENDING", "EXPECTED") ||
        (conclusion != null && conclusion.isNull)
    }
    return buildString {
        if (failing > 0) append("${failing} FAILING  ")
        if (pending > 0) append("${pending} pending  ")
        append("${passing} passing")
    }.trim()
}

fun age(createdAt: String): String {
    val created = Instant.parse(createdAt)
    val now = Instant.now()
    val days = ChronoUnit.DAYS.between(created, now)
    val hours = ChronoUnit.HOURS.between(created, now)
    return when {
        days >= 1  -> "${days}d ago"
        hours >= 1 -> "${hours}h ago"
        else       -> "just now"
    }
}

class GhPrList : CliktCommand(
    name = "gh-pr-list",
    help = "List pull requests with review decision and CI status"
) {
    val owner  by option("--owner",  help = "GitHub owner/org").default("geekinasuit")
    val repo   by option("--repo",   help = "GitHub repo name").default("infra")
    val state  by option("--state",  help = "PR state: open|closed|merged|all").default("open")
    val limit  by option("--limit",  help = "Max results").int().default(30)
    val author by option("--author", help = "Filter by GitHub login")

    val mapper = jacksonObjectMapper()

    override fun run() {
        val fields = listOf(
            "number", "title", "state", "isDraft", "author",
            "headRefName", "baseRefName", "url", "createdAt",
            "reviewDecision", "statusCheckRollup", "labels"
        ).joinToString(",")

        val cmd = mutableListOf(
            "gh", "pr", "list",
            "--repo", "$owner/$repo",
            "--state", state,
            "--limit", "$limit",
            "--json", fields
        )
        author?.let { cmd += listOf("--author", it) }

        val raw = sh(*cmd.toTypedArray())
        val prs = mapper.readTree(raw)

        if (prs.size() == 0) {
            println("No PRs found (state=$state, repo=$owner/$repo${author?.let { ", author=$it" } ?: ""})")
            return
        }

        println("PRs for $owner/$repo  [state=$state]")
        println("─".repeat(72))

        prs.forEach { pr ->
            val number        = pr["number"].asInt()
            val title         = pr["title"].asText()
            val isDraft       = pr["isDraft"].asBoolean()
            val login         = pr.at("/author/login").asText()
            val head          = pr["headRefName"].asText()
            val base          = pr["baseRefName"].asText()
            val url           = pr["url"].asText()
            val createdAt     = pr["createdAt"].asText()
            val reviewDecision = pr["reviewDecision"]?.asText()?.takeIf { it.isNotBlank() } ?: "NONE"
            val labels        = pr["labels"]?.map { it["name"].asText() } ?: emptyList<String>()
            val checks        = pr["statusCheckRollup"] ?: mapper.createArrayNode()

            val draftTag = if (isDraft) " [DRAFT]" else ""
            val labelTag = if (labels.isNotEmpty()) "labels: ${labels.joinToString(", ")}" else ""

            println("PR #$number$draftTag — $title")
            println("  author:   $login  (${age(createdAt)})")
            println("  branch:   $head → $base")
            println("  review:   $reviewDecision")
            println("  CI:       ${ciSummary(checks)}")
            if (labelTag.isNotEmpty()) println("  $labelTag")
            println("  $url")
            println()
        }
    }
}

GhPrList().main(args)
