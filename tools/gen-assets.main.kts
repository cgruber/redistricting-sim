#!/usr/bin/env kotlin
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")
@file:DependsOn("com.squareup.moshi:moshi-kotlin:1.15.0")
@file:DependsOn("com.squareup.okhttp3:okhttp:4.12.0")

/**
 * gen-assets
 *
 * Generates game character assets via AI APIs. Two subcommands:
 *
 *   gen-assets sprites   — SVG sprites via chat API (Gemini or Grok)
 *   gen-assets images    — PNG reference images via image API (Gemini Imagen or Grok)
 *
 * Verified working models (as of 2026-05-04):
 *   sprites/gemini:  gemini-2.5-pro
 *   sprites/grok:    grok-3
 *   images/gemini:   imagen-4.0-generate-001
 *   images/grok:     grok-imagine-image, grok-imagine-image-pro
 *
 * Character types and animation states are loaded from sprite-spec.json.
 * Outputs one file per (type × state). Run with --list-types / --list-states
 * to inspect the spec without generating anything.
 *
 * Credential resolution order (first match wins):
 *   1. --api-key flag
 *   2. --gemini-api-key / --grok-api-key (or GEMINI_API_KEY / GROK_API_KEY env)
 *   3. --credentials-file (JSON oauth or plain text — auto-detected)
 *   4. Auto: ~/.config/gen-sprites/keys/{provider}  (kept from gen-sprites for backward compat)
 *   5. Auto: ~/.gemini/oauth_creds.json  (Gemini only)
 *
 * Usage:
 *   gen-assets.main.kts sprites
 *   gen-assets.main.kts sprites --provider grok
 *   gen-assets.main.kts sprites --type partisan-boss --state three-star --dry-run
 *   gen-assets.main.kts images
 *   gen-assets.main.kts images --provider grok --model grok-imagine-image-pro
 *   gen-assets.main.kts images --type partisan-boss --count 3
 *   gen-assets.main.kts sprites --list-types
 *
 * Shared flags (both subcommands):
 *   --provider          gemini | grok (default: gemini)
 *   --api-key           Raw API key (any provider)
 *   --gemini-api-key    Gemini key (or GEMINI_API_KEY env)
 *   --grok-api-key      Grok key (or GROK_API_KEY env)
 *   --credentials-file  Credentials file (JSON oauth or plain text)
 *   --model             Model override (default: command + provider specific)
 *   --characters-file   sprite-spec.json path (default: tools/sprite-spec.json)
 *   --type              Limit to type ID (repeatable)
 *   --state             Limit to state ID (repeatable)
 *   --output-dir        Output root (default: command-specific)
 *   --overwrite         Overwrite existing files
 *   --dry-run           Print prompt without calling API
 *   --list-types        Print types and exit
 *   --list-states       Print states and exit
 *
 * sprites-only flags:
 *   --spec-file         DESIGN-009 consistency spec (auto-detected by default)
 *
 * images-only flags:
 *   --style-file        Art style spec file (auto-detect or built-in Vault Boy spec)
 *   --count             Images per (type × state) combination (default: 1)
 */

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.core.NoOpCliktCommand
import com.github.ajalt.clikt.core.subcommands
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.defaultLazy
import com.github.ajalt.clikt.parameters.options.flag
import com.github.ajalt.clikt.parameters.options.multiple
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.choice
import com.github.ajalt.clikt.parameters.types.int
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
import java.util.Base64
import java.util.concurrent.TimeUnit

// ---------------------------------------------------------------------------
// Domain model
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
    data class ApiKey(val key: String) : Credential()
    data class BearerToken(val token: String) : Credential()
}

fun expandHome(path: String): Path =
    Paths.get(path.replaceFirst("~", System.getProperty("user.home")))

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
// JSON + HTTP
// ---------------------------------------------------------------------------

private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
val jsonAny = moshi.adapter(Any::class.java)
private val specAdapter = moshi.adapter(SpriteSpec::class.java)

fun toJson(value: Any): String = jsonAny.toJson(value)

@Suppress("UNCHECKED_CAST")
fun Any?.nav(key: String): Any? = (this as? Map<*, *>)?.get(key)
@Suppress("UNCHECKED_CAST")
fun Any?.nav(index: Int): Any? = (this as? List<*>)?.getOrNull(index)

private val httpClient = OkHttpClient.Builder()
    .readTimeout(120, TimeUnit.SECONDS)
    .build()
private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

fun httpPost(url: String, headers: Map<String, String>, jsonBody: String): String {
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
// Response decoders (pure — accept parsed Any?, not raw JSON)
// ---------------------------------------------------------------------------

fun decodeGeminiImageResponse(parsed: Any?): ByteArray {
    val b64 = parsed.nav("predictions").nav(0).nav("bytesBase64Encoded") as? String
        ?: error("No bytesBase64Encoded in Gemini Imagen response. " +
                 "predictions[0]: ${parsed.nav("predictions").nav(0)}")
    return Base64.getDecoder().decode(b64)
}

fun decodeGrokImageResponse(parsed: Any?): ByteArray {
    val b64 = parsed.nav("data").nav(0).nav("b64_json") as? String
        ?: error("No b64_json in Grok image response. data[0]: ${parsed.nav("data").nav(0)}")
    return Base64.getDecoder().decode(b64)
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
// Provider interfaces + implementations
// ---------------------------------------------------------------------------

interface SpriteProvider {
    val name: String
    fun generate(systemPrompt: String, userPrompt: String): String
}

interface ImageProvider {
    val name: String
    fun generate(prompt: String): ByteArray
}

class GeminiSpriteProvider(private val credential: Credential, private val model: String) : SpriteProvider {
    override val name = "gemini/$model"
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

class GrokSpriteProvider(private val credential: Credential, private val model: String) : SpriteProvider {
    override val name = "grok/$model"
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

class GeminiImagenProvider(
    private val credential: Credential,
    private val model: String,
    private val aspectRatio: String = "1:1",
) : ImageProvider {
    override val name = "gemini/$model"
    override fun generate(prompt: String): ByteArray {
        val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:predict"
        val auth: Map<String, String> = when (credential) {
            is Credential.ApiKey      -> mapOf("x-goog-api-key" to credential.key)
            is Credential.BearerToken -> mapOf("Authorization"  to "Bearer ${credential.token}")
        }
        val raw = httpPost(url, auth, toJson(mapOf(
            "instances"  to listOf(mapOf("prompt" to prompt)),
            "parameters" to mapOf("sampleCount" to 1, "aspectRatio" to aspectRatio),
        )))
        return decodeGeminiImageResponse(jsonAny.fromJson(raw))
    }
}

class GrokImageProvider(private val credential: Credential, private val model: String) : ImageProvider {
    override val name = "grok/$model"
    override fun generate(prompt: String): ByteArray {
        val bearer = when (credential) {
            is Credential.ApiKey      -> credential.key
            is Credential.BearerToken -> credential.token
        }
        val raw = httpPost(
            "https://api.x.ai/v1/images/generations",
            mapOf("Authorization" to "Bearer $bearer"),
            toJson(mapOf(
                "model" to model, "prompt" to prompt, "n" to 1, "response_format" to "b64_json",
            ))
        )
        return decodeGrokImageResponse(jsonAny.fromJson(raw))
    }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

fun buildSystemPrompt(specSection: String): String = """
You are an SVG illustration artist producing character sprites for a browser strategy game
called "Past the Post" — an educational gerrymandering simulator.

Your work is clean, precise, and well-proportioned. Think high-quality vector game art or
editorial illustration — naturalistic forms with carefully shaped bezier curves, not crude
blobs or clip-art approximations. Every path should look intentional and considered.

Core rules:
  • Flat fills only — no gradients, no drop shadows, no filters, no blur
  • Use smooth, accurate bezier curves that follow natural forms
  • Outlines give shapes definition; interior strokes add structure and detail
  • Proportions matter: heads, bodies, limbs should look right relative to each other

The following consistency specification applies to every sprite in this set.
Consistency across sprites is critical — a character must be recognisable across all states.

$specSection

Output the SVG inside a markdown fenced code block:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ...
</svg>
```
Respond with ONLY the code block — no prose, no explanation.
""".trimIndent()

fun buildSpritePrompt(type: CharacterType, state: StarState): String = """
Generate one SVG sprite for the following character + state combination.

CHARACTER TYPE: ${type.displayName}
  Role: ${type.role}
  Palette: ${type.palette}
  Silhouette notes: ${type.silhouetteNotes}

STATE: ${state.label}
  Pose guide: ${state.poseGuide}

Technical requirements (all mandatory):
  • viewBox="0 0 200 200"; no width/height attributes; transparent background
  • Subject fills the viewBox naturally; upright characters: head near y=20–40, feet near y=175–195
  • Flat fills only — no gradients, no drop shadows, no filters
  • Primary outline stroke-width 2–3; interior detail stroke-width 1–2
  • Maximum 4 fill colours per subject (plus shared outline #1a1a2e)
  • Bezier curves must accurately follow natural forms — no crude quadratic blobs
  • @keyframes idle-bob — subtle vertical bob ≤4 px, 0.6–1.0 s, ease-in-out, infinite
    Apply via class="character" on a <g> wrapping all elements
  • Self-contained; no external references (no <use href="..."/>, no xlink)
  • Target file size: under 15 KB

Same type across all states must share the same costume and silhouette.
Only pose and expression change between states.
""".trimIndent()

val DEFAULT_IMAGE_STYLE = """
Vault Boy / 1950s mascot style. Think Fallout Vault Boy, retro game token, or mid-century advertising mascot.

Style rules:
- Oversized round head relative to small body — this exaggeration is intentional and essential
- Bold consistent outlines (thick crisp edges)
- Flat fills only — no gradients, no shadows, no textures
- Maximum 5 flat colours plus black outline
- Faces are expressive and readable: large eyes, clear mouth shape, strong brow
- Limbs are simple rounded tubes; hands are mitten-style (no detailed fingers)
- The character must look intentionally designed, not accidentally crude
- Consistent line weight throughout reads as professional; inconsistent reads as childish
- White background
""".trimIndent()

fun buildImagePrompt(type: CharacterType, state: StarState, styleSpec: String): String = """
$styleSpec

CHARACTER: ${type.displayName}
  Role: ${type.role}
  Colour palette: ${type.palette}
  Physical form: ${type.silhouetteNotes}

POSE / STATE: ${state.label}
  ${state.poseGuide}

Render the full body. White background. Character centred, standing upright.
""".trimIndent()

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

fun loadSpriteSpec(path: String?): SpriteSpec {
    val resolved: Path = when {
        path != null -> Paths.get(path)
        else         -> listOf("tools/sprite-spec.json").map(Paths::get)
            .firstOrNull(Files::exists)
            ?: error("Could not find sprite-spec.json. Pass --characters-file <path>.")
    }
    return specAdapter.fromJson(Files.readString(resolved))
        ?: error("Failed to parse spec: $resolved")
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

fun loadStyleSpec(styleFile: String?): String {
    val path: Path? = when {
        styleFile != null -> Paths.get(styleFile)
        else -> listOf(
            "tools/image-style-spec.md",
            "thoughts/shared/research/2026-05-02-design-009-character-reaction-visual-style.md",
        ).map(Paths::get).firstOrNull(Files::exists)
    }
    if (path == null) return DEFAULT_IMAGE_STYLE
    val text = Files.readString(path)
    val idx = text.indexOf("## AI Art Generation")
    return if (idx >= 0) text.substring(idx) else text
}

fun outputPath(outputDir: String, typeId: String, stateId: String, ext: String, n: Int, count: Int): Path {
    val filename = if (count == 1) "$stateId.$ext" else "$stateId-$n.$ext"
    return Paths.get(outputDir, typeId, filename)
}

// ---------------------------------------------------------------------------
// Base command (shared flags + helpers)
// ---------------------------------------------------------------------------

abstract class BaseGenCommand(
    name: String,
    help: String,
    private val defaultOutputDir: String,
    private val defaultGeminiModel: String,
    private val defaultGrokModel: String,
) : CliktCommand(name = name, help = help) {

    val providerName by option("--provider", help = "AI provider: gemini or grok")
        .choice("gemini", "grok").default("gemini")

    val apiKeyOpt    by option("--api-key",         help = "Raw API key (any provider)")
    val geminiApiKey by option("--gemini-api-key",   help = "Gemini API key", envvar = "GEMINI_API_KEY")
    val grokApiKey   by option("--grok-api-key",     help = "Grok API key",   envvar = "GROK_API_KEY")
    val credFile     by option("--credentials-file", help = "Credentials file (JSON oauth or plain text)")

    val model          by option("--model",           help = "Model override (default: provider-specific)")
    val charactersFile by option("--characters-file", help = "sprite-spec.json path (default: tools/sprite-spec.json)")

    val typeFilter  by option("--type",  help = "Generate only this type ID (repeatable)").multiple()
    val stateFilter by option("--state", help = "Generate only this state ID (repeatable)").multiple()

    val outputDir by option("--output-dir", help = "Output root").defaultLazy { defaultOutputDir }

    val overwrite  by option("--overwrite",   help = "Overwrite existing files").flag()
    val dryRun     by option("--dry-run",     help = "Print prompt without calling API").flag()
    val listTypes  by option("--list-types",  help = "Print available character types and exit").flag()
    val listStates by option("--list-states", help = "Print available star states and exit").flag()

    protected fun credential(): Credential = resolveCredential(
        provider        = providerName,
        apiKeyFlag      = apiKeyOpt,
        providerKeyFlag = if (providerName == "gemini") geminiApiKey else grokApiKey,
        credFileFlag    = credFile,
        autoSearchPaths = buildList {
            add("~/.config/gen-sprites/keys/$providerName")
            if (providerName == "gemini") add("~/.gemini/oauth_creds.json")
        },
    )

    protected fun effectiveModel(): String = model ?: if (providerName == "gemini") defaultGeminiModel else defaultGrokModel

    protected fun filteredSpec(spec: SpriteSpec): Pair<List<CharacterType>, List<StarState>> {
        val types  = if (typeFilter.isEmpty())  spec.characterTypes else spec.characterTypes.filter { it.id in typeFilter }
        val states = if (stateFilter.isEmpty()) spec.starStates     else spec.starStates.filter     { it.id in stateFilter }
        return types to states
    }

    protected fun printList(spec: SpriteSpec) {
        if (listTypes) {
            echo("Available character types (from ${charactersFile ?: "tools/sprite-spec.json"}):")
            spec.characterTypes.forEach { echo("  ${it.id.padEnd(22)} ${it.displayName} — ${it.role}") }
        }
        if (listStates) {
            echo("Available star states (from ${charactersFile ?: "tools/sprite-spec.json"}):")
            spec.starStates.forEach { echo("  ${it.id.padEnd(12)} ${it.label}") }
        }
    }
}

// ---------------------------------------------------------------------------
// sprites subcommand
// ---------------------------------------------------------------------------

class SpritesCommand : BaseGenCommand(
    name              = "sprites",
    help              = "Generate SVG sprites via chat API (Gemini or Grok)",
    defaultOutputDir  = "game/web/assets/characters",
    defaultGeminiModel = "gemini-2.5-pro",
    defaultGrokModel  = "grok-3",
) {
    val specFile by option("--spec-file", help = "DESIGN-009 consistency spec (auto-detected by default)")

    override fun run() {
        val spec = loadSpriteSpec(charactersFile)
        if (listTypes || listStates) { printList(spec); return }

        val (types, states) = filteredSpec(spec)
        if (types.isEmpty())  { echo("No matching types — run --list-types.",   err = true); return }
        if (states.isEmpty()) { echo("No matching states — run --list-states.", err = true); return }

        val specSection  = loadSpecSection(specFile)
        val systemPrompt = buildSystemPrompt(specSection)
        val provider     = if (dryRun) null else run {
            val cred = credential()
            when (providerName) {
                "gemini" -> GeminiSpriteProvider(cred, effectiveModel())
                "grok"   -> GrokSpriteProvider(cred,   effectiveModel())
                else     -> error("Unknown provider: $providerName")
            }
        }

        echo("${if (dryRun) "DRY RUN" else "Generating"}: ${types.size} type(s) × ${states.size} state(s) = ${types.size * states.size} sprite(s)")
        if (!dryRun) echo("  provider: ${provider!!.name}  output: $outputDir")
        echo()

        var generated = 0; var skipped = 0; var errors = 0

        for (type in types) {
            for (state in states) {
                val outPath = outputPath(outputDir, type.id, state.id, "svg", 1, 1)
                if (!dryRun && !overwrite && Files.exists(outPath)) {
                    echo("  SKIP    ${type.id}/${state.id}.svg  (exists; use --overwrite)"); skipped++; continue
                }
                val userPrompt = buildSpritePrompt(type, state)
                if (dryRun) {
                    echo("=== ${type.id} / ${state.id} ===\n--- SYSTEM (${systemPrompt.length} chars) ---")
                    echo(systemPrompt)
                    echo("--- USER (${userPrompt.length} chars) ---")
                    echo(userPrompt); echo(); generated++; continue
                }
                echo("  GEN     ${type.id}/${state.id}.svg  [${provider!!.name}] ...")
                try {
                    val svg = extractSvg(provider.generate(systemPrompt, userPrompt))
                    Files.createDirectories(outPath.parent)
                    Files.writeString(outPath, svg)
                    echo("  OK      $outPath  (${"%.1f".format(svg.length / 1024.0)} KB)")
                    generated++
                } catch (e: Exception) {
                    echo("  ERROR   ${type.id}/${state.id}: ${e.message}", err = true); errors++
                }
            }
        }
        echo(); echo("Done: $generated generated, $skipped skipped, $errors error(s).")
        if (errors > 0) throw SystemExit(1)
    }
}

// ---------------------------------------------------------------------------
// images subcommand
// ---------------------------------------------------------------------------

class ImagesCommand : BaseGenCommand(
    name               = "images",
    help               = "Generate PNG reference images via image generation API (Gemini Imagen or Grok)",
    defaultOutputDir   = "/tmp/gen-images",
    defaultGeminiModel = "imagen-4.0-generate-001",
    defaultGrokModel   = "grok-imagine-image",
) {
    val styleFile by option("--style-file", help = "Art style spec file (auto-detect or built-in Vault Boy spec)")
    val count     by option("--count", help = "Images per (type × state) combination (default: 1)").int().default(1)

    override fun run() {
        val spec = loadSpriteSpec(charactersFile)
        if (listTypes || listStates) { printList(spec); return }

        val (types, states) = filteredSpec(spec)
        if (types.isEmpty())  { echo("No matching types — run --list-types.",   err = true); return }
        if (states.isEmpty()) { echo("No matching states — run --list-states.", err = true); return }

        val styleSpec = loadStyleSpec(styleFile)
        val provider  = if (dryRun) null else run {
            val cred = credential()
            when (providerName) {
                "gemini" -> GeminiImagenProvider(cred, effectiveModel())
                "grok"   -> GrokImageProvider(cred,   effectiveModel())
                else     -> error("Unknown provider: $providerName")
            }
        }

        val total = types.size * states.size * count
        echo("${if (dryRun) "DRY RUN" else "Generating"}: ${types.size} type(s) × ${states.size} state(s) × $count = $total image(s)")
        if (!dryRun) echo("  provider: ${provider!!.name}  output: $outputDir")
        echo()

        var generated = 0; var skipped = 0; var errors = 0

        for (type in types) {
            for (state in states) {
                val prompt = buildImagePrompt(type, state, styleSpec)
                if (dryRun) {
                    echo("=== ${type.id} / ${state.id} ===\n--- PROMPT (${prompt.length} chars) ---")
                    echo(prompt); echo(); generated += count; continue
                }
                for (n in 1..count) {
                    val outPath = outputPath(outputDir, type.id, state.id, "png", n, count)
                    if (!overwrite && Files.exists(outPath)) {
                        echo("  SKIP    ${outPath.fileName}  (exists; use --overwrite)"); skipped++; continue
                    }
                    echo("  GEN     ${type.id}/${outPath.fileName}  [${provider!!.name}] ...")
                    try {
                        val bytes = provider.generate(prompt)
                        Files.createDirectories(outPath.parent)
                        Files.write(outPath, bytes)
                        echo("  OK      $outPath  (${"%.1f".format(bytes.size / 1024.0)} KB)")
                        generated++
                    } catch (e: Exception) {
                        echo("  ERROR   ${type.id}/${outPath.fileName}: ${e.message}", err = true); errors++
                    }
                }
            }
        }
        echo(); echo("Done: $generated generated, $skipped skipped, $errors error(s).")
        if (errors > 0) throw SystemExit(1)
    }
}

// ---------------------------------------------------------------------------
// Root command + entry point
// ---------------------------------------------------------------------------

class SystemExit(val code: Int) : Exception()

try {
    NoOpCliktCommand(name = "gen-assets")
        .subcommands(SpritesCommand(), ImagesCommand())
        .main(args)
} catch (e: SystemExit) {
    System.exit(e.code)
}
