#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.squareup.moshi:moshi-kotlin:1.15.0")
@file:DependsOn("com.squareup.okhttp3:okhttp:4.12.0")

/**
 * gen-sprites
 *
 * Generates SVG character sprites for "Past the Post" via AI model API.
 * Supports Gemini and Grok providers; modular interface for future providers.
 *
 * Character types and star states are loaded from a JSON spec file
 * (default: tools/sprite-spec.json). Edit that file to add new types or states
 * without touching this script.
 *
 * Reads the DESIGN-009 consistency spec from the repo to embed in every prompt.
 * Writes one SVG per (character-type × star-state) to:
 *   game/web/assets/characters/{type}/{state}.svg  (or --output-dir override)
 *
 * Credential resolution order (first match wins):
 *   1. --api-key flag
 *   2. --gemini-api-key / --grok-api-key flag  (or GEMINI_API_KEY / GROK_API_KEY env var)
 *   3. --credentials-file flag (JSON oauth or plain text — auto-detected)
 *   4. Auto-detected: ~/.gemini/oauth_creds.json  (Gemini only; gemini-cli format)
 *
 * Usage:
 *   gen-sprites.main.kts -- --provider gemini                      # auto-detect creds
 *   gen-sprites.main.kts -- --provider gemini --api-key $KEY
 *   gen-sprites.main.kts -- --provider gemini --credentials-file ~/my-key.txt
 *   gen-sprites.main.kts -- --provider grok   --api-key $GROK_KEY
 *   gen-sprites.main.kts -- --type partisan-boss --state three-star --dry-run
 *   gen-sprites.main.kts -- --list-types
 *   gen-sprites.main.kts -- --list-states
 *
 * Flags:
 *   --provider          gemini | grok (default: gemini)
 *   --api-key           Raw API key (any provider)
 *   --gemini-api-key    Gemini API key (or GEMINI_API_KEY env var)
 *   --grok-api-key      Grok API key (or GROK_API_KEY env var)
 *   --credentials-file  Path to credentials file (JSON oauth or plain text key)
 *   --model             Model override (default: gemini-2.5-flash or grok-3)
 *   --characters-file   Path to sprite-spec.json (default: tools/sprite-spec.json)
 *   --type              Limit to one character type ID (repeatable; default: all)
 *   --state             Limit to one star state ID (repeatable; default: all)
 *   --output-dir        Root directory for output SVGs (default: game/web/assets/characters)
 *   --spec-file         Path to DESIGN-009 consistency spec (default: auto-detect)
 *   --overwrite         Overwrite existing SVG files (default: skip if present)
 *   --dry-run           Print prompts without calling API
 *   --list-types        Print available character types and exit
 *   --list-states       Print available star states and exit
 */

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.flag
import com.github.ajalt.clikt.parameters.options.multiple
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.choice
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

// ---------------------------------------------------------------------------
// Domain model — loaded from sprite-spec.json, not hard-coded
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = false)
data class CharacterType(
    val id: String,
    val displayName: String,
    val role: String,
    val palette: String,
    val silhouetteNotes: String,
)

@JsonClass(generateAdapter = false)
data class StarState(
    val id: String,
    val stars: Int,
    val label: String,
    val poseGuide: String,
)

@JsonClass(generateAdapter = false)
data class SpriteSpec(
    val characterTypes: List<CharacterType>,
    val starStates: List<StarState>,
)

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

sealed class Credential {
    /** Raw API key — sent as x-goog-api-key (Gemini) or Authorization: Bearer (Grok). */
    data class ApiKey(val key: String) : Credential()
    /** OAuth access token — sent as Authorization: Bearer regardless of provider. */
    data class BearerToken(val token: String) : Credential()
}

fun expandHome(path: String): Path =
    Paths.get(path.replaceFirst("~", System.getProperty("user.home")))

/**
 * Parse a credential file. Two formats supported:
 *   - JSON with "access_token" field (gemini-cli oauth format) → BearerToken
 *   - Plain text key/token                                     → ApiKey
 */
fun parseCredentialFile(path: Path): Credential {
    val content = Files.readString(path).trim()
    return try {
        @Suppress("UNCHECKED_CAST")
        val map = jsonAny.fromJson(content) as? Map<String, Any?>
        val token = (map?.get("access_token") as? String)?.takeIf { it.isNotBlank() }
        if (token != null) Credential.BearerToken(token) else Credential.ApiKey(content)
    } catch (_: Exception) {
        Credential.ApiKey(content)
    }
}

fun resolveCredential(
    provider: String,
    apiKeyFlag: String?,
    providerKeyFlag: String?,
    credFileFlag: String?,
    autoSearchPaths: List<String>,
): Credential {
    val rawKey = apiKeyFlag ?: providerKeyFlag
    if (rawKey != null) return Credential.ApiKey(rawKey)

    if (credFileFlag != null) {
        val path = expandHome(credFileFlag)
        if (!Files.exists(path)) error("Credentials file not found: $path")
        return parseCredentialFile(path)
    }

    for (rawPath in autoSearchPaths) {
        val path = expandHome(rawPath)
        if (Files.exists(path)) return parseCredentialFile(path)
    }

    error(
        "No credentials found for provider '$provider'. " +
        "Use --api-key, --credentials-file, or set ${provider.uppercase()}_API_KEY."
    )
}

// ---------------------------------------------------------------------------
// JSON + HTTP (Moshi + OkHttp)
// ---------------------------------------------------------------------------

private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
private val jsonAny = moshi.adapter(Any::class.java)
private val specAdapter = moshi.adapter(SpriteSpec::class.java)

fun toJson(value: Any): String = jsonAny.toJson(value)

@Suppress("UNCHECKED_CAST")
fun Any?.nav(key: String): Any? = (this as? Map<*, *>)?.get(key)
@Suppress("UNCHECKED_CAST")
fun Any?.nav(index: Int): Any? = (this as? List<*>)?.getOrNull(index)

private val httpClient = OkHttpClient()
private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

private fun httpPost(url: String, headers: Map<String, String>, jsonBody: String): String {
    val req = Request.Builder()
        .url(url)
        .apply { headers.forEach { (k, v) -> header(k, v) } }
        .post(jsonBody.toRequestBody(JSON_MEDIA))
        .build()
    val resp = httpClient.newCall(req).execute()
    val body = resp.body?.string() ?: ""
    if (!resp.isSuccessful) error("HTTP ${resp.code}:\n${body.take(800)}")
    return body
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

interface SpriteProvider {
    val name: String
    fun generate(systemPrompt: String, userPrompt: String): String
}

// ---------------------------------------------------------------------------
// Gemini provider
// ---------------------------------------------------------------------------

class GeminiProvider(
    private val credential: Credential,
    private val model: String = "gemini-2.5-flash",
) : SpriteProvider {
    override val name = "gemini"

    override fun generate(systemPrompt: String, userPrompt: String): String {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent"
        val auth: Map<String, String> = when (credential) {
            is Credential.ApiKey      -> mapOf("x-goog-api-key" to credential.key)
            is Credential.BearerToken -> mapOf("Authorization"  to "Bearer ${credential.token}")
        }
        val raw = httpPost(url, auth, toJson(mapOf(
            "system_instruction" to mapOf("parts" to listOf(mapOf("text" to systemPrompt))),
            "contents"           to listOf(mapOf("role" to "user", "parts" to listOf(mapOf("text" to userPrompt)))),
            "generationConfig"   to mapOf("temperature" to 1.0, "maxOutputTokens" to 8192),
        )))
        val parsed = jsonAny.fromJson(raw)
        val candidate = parsed.nav("candidates").nav(0)
            ?: error("Gemini returned no candidates. Raw: ${raw.take(500)}")
        val content = candidate.nav("content")
            ?: error("Gemini candidate has no content (finishReason: ${candidate.nav("finishReason")}). Raw: ${raw.take(500)}")
        return content.nav("parts").nav(0).nav("text") as? String
            ?: error("Gemini text missing. Raw: ${raw.take(500)}")
    }
}

// ---------------------------------------------------------------------------
// Grok provider (xAI — OpenAI-compatible)
// ---------------------------------------------------------------------------

class GrokProvider(
    private val credential: Credential,
    private val model: String = "grok-3",
) : SpriteProvider {
    override val name = "grok"

    override fun generate(systemPrompt: String, userPrompt: String): String {
        val bearer = when (credential) {
            is Credential.ApiKey      -> credential.key
            is Credential.BearerToken -> credential.token
        }
        val raw = httpPost("https://api.x.ai/v1/chat/completions",
            mapOf("Authorization" to "Bearer $bearer"),
            toJson(mapOf(
                "model"       to model,
                "messages"    to listOf(
                    mapOf("role" to "system", "content" to systemPrompt),
                    mapOf("role" to "user",   "content" to userPrompt),
                ),
                "temperature" to 0.8,
                "max_tokens"  to 8192,
            ))
        )
        val parsed = jsonAny.fromJson(raw)
        val choice = parsed.nav("choices").nav(0)
            ?: error("Grok returned no choices. Raw: ${raw.take(500)}")
        return choice.nav("message").nav("content") as? String
            ?: error("Grok content missing. Raw: ${raw.take(500)}")
    }
}

// ---------------------------------------------------------------------------
// SVG extraction
// ---------------------------------------------------------------------------

fun extractSvg(raw: String): String {
    val fenced = Regex(
        "```(?:svg|xml)?[ \t]*\\r?\\n(<svg[\\s\\S]*?</svg>)[ \t]*\\r?\\n```",
        RegexOption.IGNORE_CASE,
    ).find(raw)
    if (fenced != null) return fenced.groupValues[1].trim()

    val bare = Regex("<svg[\\s\\S]*?</svg>", RegexOption.IGNORE_CASE).find(raw)
    if (bare != null) return bare.value.trim()

    error("No SVG found in model output. First 500 chars:\n${raw.take(500)}")
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

fun buildSystemPrompt(specSection: String): String = """
You are an SVG character artist producing sprites for a browser strategy game called
"Past the Post" — an educational gerrymandering simulator.

You produce clean, minimal, political-cartoon / board-game-token style SVG art.

The following consistency specification MUST be followed for every file you produce.
Consistency across the full set of 20 sprites is more important than perfection of
any individual file.

$specSection

Output the SVG inside a markdown fenced code block:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ...
</svg>
```
Respond with ONLY the code block — no prose, no explanation.
""".trimIndent()

fun buildUserPrompt(type: CharacterType, state: StarState): String = """
Generate one SVG sprite for the following character + state combination.

CHARACTER TYPE: ${type.displayName}
  Role: ${type.role}
  Palette: ${type.palette}
  Silhouette notes: ${type.silhouetteNotes}

STATE: ${state.label}
  Pose guide: ${state.poseGuide}

Technical requirements (all mandatory):
  • viewBox="0 0 200 200"; no width/height attributes; transparent background
  • Character centred horizontally; head near y=30, feet near y=190
  • Flat fills only — no gradients, no drop shadows, no filters
  • Primary outline stroke-width 2–3; interior detail stroke-width 1–2
  • Maximum 3 fill colours per character (plus shared outline #1a1a2e)
  • @keyframes idle-bob — subtle vertical bob ≤4 px, 0.6–1.0 s, ease-in-out, infinite
    Apply via class="character" on a <g> wrapping all elements
  • Self-contained; no external references (no <use href="..."/>, no xlink)
  • Target file size: under 15 KB

Remember: same type across all 4 states must share the same costume and silhouette.
Only pose and expression change between states.
""".trimIndent()

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

fun loadSpriteSpec(path: String?): SpriteSpec {
    val resolved: Path = when {
        path != null -> Paths.get(path)
        else -> listOf("tools/sprite-spec.json").map(Paths::get)
            .firstOrNull(Files::exists)
            ?: error("Could not find sprite-spec.json. Pass --characters-file <path>.")
    }
    return specAdapter.fromJson(Files.readString(resolved))
        ?: error("Failed to parse sprite spec: $resolved")
}

fun loadSpecSection(specFile: String?): String {
    val path: Path = when {
        specFile != null -> Paths.get(specFile)
        else -> listOf(
            "thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md",
            "thoughts/shared/tickets/DESIGN-009-character-reaction-visual-style.md",
        ).map(Paths::get).firstOrNull(Files::exists)
            ?: error("Could not auto-detect DESIGN-009 spec. Pass --spec-file <path>.")
    }
    val text = Files.readString(path)
    val idx = text.indexOf("## AI Art Generation")
    return if (idx >= 0) text.substring(idx) else text
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

class GenSprites : CliktCommand(
    name = "gen-sprites",
    help = "Generate SVG character sprites via AI model API (Gemini or Grok)",
) {
    val providerName by option("--provider", help = "AI provider: gemini or grok")
        .choice("gemini", "grok").default("gemini")

    val apiKeyOpt    by option("--api-key",          help = "Raw API key (any provider)")
    val geminiApiKey by option("--gemini-api-key",    help = "Gemini API key", envvar = "GEMINI_API_KEY")
    val grokApiKey   by option("--grok-api-key",      help = "Grok API key",   envvar = "GROK_API_KEY")
    val credFile     by option("--credentials-file",  help = "Credentials file (JSON oauth or plain text key)")

    val model          by option("--model",          help = "Model override (default: gemini-2.5-flash or grok-3)")
    val charactersFile by option("--characters-file", help = "Path to sprite-spec.json (default: tools/sprite-spec.json)")

    val typeFilter  by option("--type",  help = "Generate only this type ID (repeatable)").multiple()
    val stateFilter by option("--state", help = "Generate only this state ID (repeatable)").multiple()

    val outputDir by option("--output-dir", help = "Root directory for output SVGs")
        .default("game/web/assets/characters")

    val specFile  by option("--spec-file",   help = "Path to DESIGN-009 consistency spec (auto-detected by default)")
    val overwrite by option("--overwrite",   help = "Overwrite existing SVG files").flag()
    val dryRun    by option("--dry-run",     help = "Print prompts; do not call API").flag()
    val listTypes  by option("--list-types",  help = "Print available character types and exit").flag()
    val listStates by option("--list-states", help = "Print available star states and exit").flag()

    override fun run() {
        val spec = loadSpriteSpec(charactersFile)

        if (listTypes) {
            echo("Available character types (from ${charactersFile ?: "tools/sprite-spec.json"}):")
            spec.characterTypes.forEach { echo("  ${it.id.padEnd(22)} ${it.displayName} — ${it.role}") }
            return
        }
        if (listStates) {
            echo("Available star states (from ${charactersFile ?: "tools/sprite-spec.json"}):")
            spec.starStates.forEach { echo("  ${it.id.padEnd(12)} ${it.label}") }
            return
        }

        val types  = if (typeFilter.isEmpty())  spec.characterTypes else spec.characterTypes.filter { it.id in typeFilter }
        val states = if (stateFilter.isEmpty()) spec.starStates     else spec.starStates.filter     { it.id in stateFilter }

        if (types.isEmpty())  { echo("No matching types — run --list-types.",   err = true); return }
        if (states.isEmpty()) { echo("No matching states — run --list-states.", err = true); return }

        val specSection  = loadSpecSection(specFile)
        val systemPrompt = buildSystemPrompt(specSection)
        val provider     = if (dryRun) null else buildProvider()

        val total = types.size * states.size
        echo("${if (dryRun) "DRY RUN" else "Generating"}: ${types.size} type(s) × ${states.size} state(s) = $total sprite(s)")
        echo()

        var generated = 0; var skipped = 0; var errors = 0

        for (type in types) {
            for (state in states) {
                val outPath = Paths.get(outputDir, type.id, "${state.id}.svg")

                if (!dryRun && !overwrite && Files.exists(outPath)) {
                    echo("  SKIP    ${type.id}/${state.id}.svg  (exists; use --overwrite to replace)")
                    skipped++; continue
                }

                val userPrompt = buildUserPrompt(type, state)

                if (dryRun) {
                    echo("=== ${type.id} / ${state.id} ===")
                    echo("--- SYSTEM PROMPT (${systemPrompt.length} chars) ---")
                    echo(systemPrompt)
                    echo("--- USER PROMPT (${userPrompt.length} chars) ---")
                    echo(userPrompt)
                    echo(); generated++; continue
                }

                echo("  GEN     ${type.id}/${state.id}.svg  [${providerName}/${model ?: "default"}] ...")
                try {
                    val svg = extractSvg(provider!!.generate(systemPrompt, userPrompt))
                    Files.createDirectories(outPath.parent)
                    Files.writeString(outPath, svg)
                    echo("  OK      $outPath  (${"%.1f".format(svg.length / 1024.0)} KB)")
                    generated++
                } catch (e: Exception) {
                    echo("  ERROR   ${type.id}/${state.id}: ${e.message}", err = true)
                    errors++
                }
            }
        }

        echo()
        echo("Done: $generated generated, $skipped skipped, $errors error(s).")
        if (errors > 0) throw SystemExit(1)
    }

    private fun buildProvider(): SpriteProvider {
        val credential = resolveCredential(
            provider        = providerName,
            apiKeyFlag      = apiKeyOpt,
            providerKeyFlag = if (providerName == "gemini") geminiApiKey else grokApiKey,
            credFileFlag    = credFile,
            autoSearchPaths = when (providerName) {
                "gemini" -> listOf("~/.gemini/oauth_creds.json")
                else     -> emptyList()
            },
        )
        return when (providerName) {
            "gemini" -> GeminiProvider(credential, model ?: "gemini-2.5-flash")
            "grok"   -> GrokProvider(credential,   model ?: "grok-3")
            else     -> error("Unknown provider: $providerName")
        }
    }
}

class SystemExit(val code: Int) : Exception()

try {
    GenSprites().main(args)
} catch (e: SystemExit) {
    System.exit(e.code)
}
