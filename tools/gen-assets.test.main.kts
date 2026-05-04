#!/usr/bin/env kotlin

// NOTE: Kotlin scripts cannot import each other. Logic under test is duplicated
// here from gen-assets.main.kts. The right long-term fix is to extract shared
// logic to a .kt lib that both scripts depend on.
//
// IMPORTANT: All testable logic lives in `object Logic`. Top-level functions in
// .kts files are instance methods of the generated script class; static test
// classes cannot reference them without an outer instance.

@file:Repository("https://repo1.maven.org/maven2/")
@file:DependsOn("org.junit.jupiter:junit-jupiter-api:5.11.0")
@file:DependsOn("org.junit.jupiter:junit-jupiter-engine:5.11.0")
@file:DependsOn("org.junit.platform:junit-platform-launcher:1.11.0")
@file:DependsOn("com.squareup.moshi:moshi-kotlin:1.15.0")

import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import org.junit.platform.engine.discovery.DiscoverySelectors.selectClass
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder
import org.junit.platform.launcher.core.LauncherFactory
import org.junit.platform.launcher.listeners.SummaryGeneratingListener
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.Base64

// ---------------------------------------------------------------------------
// Duplicated from gen-assets.main.kts
// ---------------------------------------------------------------------------

@JsonClass(generateAdapter = false)
data class CharacterType(val id: String, val displayName: String, val role: String, val palette: String, val silhouetteNotes: String)

@JsonClass(generateAdapter = false)
data class StarState(val id: String, val stars: Int, val label: String, val poseGuide: String)

@JsonClass(generateAdapter = false)
data class SpriteSpec(val characterTypes: List<CharacterType>, val starStates: List<StarState>)

sealed class Credential {
    data class ApiKey(val key: String) : Credential()
    data class BearerToken(val token: String) : Credential()
}

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

object Logic {
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val jsonAny = moshi.adapter(Any::class.java)
    val specAdapter = moshi.adapter(SpriteSpec::class.java)

    fun Any?.nav(key: String): Any? = (this as? Map<*, *>)?.get(key)
    fun Any?.nav(index: Int): Any? = (this as? List<*>)?.getOrNull(index)

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
            val path = Paths.get(credFileFlag)
            if (!Files.exists(path)) error("Credentials file not found: $path")
            return parseCredentialFile(path)
        }
        for (rawPath in autoSearchPaths) {
            val path = Paths.get(rawPath)
            if (Files.exists(path)) return parseCredentialFile(path)
        }
        error("No credentials found for provider '$provider'.")
    }

    fun loadSpriteSpec(json: String): SpriteSpec =
        specAdapter.fromJson(json) ?: error("Failed to parse sprite spec")

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

    fun outputPath(outputDir: String, typeId: String, stateId: String, ext: String, n: Int, count: Int): Path {
        val filename = if (count == 1) "$stateId.$ext" else "$stateId-$n.$ext"
        return Paths.get(outputDir, typeId, filename)
    }
}

// ---------------------------------------------------------------------------
// Tests — SVG sprites
// ---------------------------------------------------------------------------

class SvgExtractionTest {
    private val svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n  <circle cx=\"100\" cy=\"100\" r=\"50\"/>\n</svg>"

    @Test fun `extracts SVG from svg-fenced block`()   { assertEquals(svg, Logic.extractSvg("```svg\n$svg\n```")) }
    @Test fun `extracts SVG from xml-fenced block`()   { assertEquals(svg, Logic.extractSvg("```xml\n$svg\n```")) }
    @Test fun `extracts SVG from plain-fenced block`() { assertEquals(svg, Logic.extractSvg("```\n$svg\n```")) }
    @Test fun `extracts bare SVG with no fence`() {
        val result = Logic.extractSvg("preamble\n$svg\ntrailing")
        assertTrue(result.startsWith("<svg") && result.endsWith("</svg>"))
    }
    @Test fun `throws on response with no SVG`()  { assertThrows<IllegalStateException> { Logic.extractSvg("no svg here") } }
    @Test fun `throws on empty string`()           { assertThrows<IllegalStateException> { Logic.extractSvg("") } }
    @Test fun `extracted SVG has no fence markers`() { assertFalse(Logic.extractSvg("```svg\n$svg\n```").contains("```")) }
}

class SpritePromptContentTest {
    private val type  = CharacterType("partisan-boss", "Partisan Boss", "hires player", "gold/red", "wide shoulders")
    private val state = StarState("three-star", 3, "Three-star (ecstatic)", "arms raised high")
    private val prompt by lazy { Logic.buildSpritePrompt(type, state) }

    @Test fun `contains character display name`()  { assertTrue(prompt.contains("Partisan Boss")) }
    @Test fun `contains state label`()             { assertTrue(prompt.contains("Three-star")) }
    @Test fun `contains viewBox requirement`()     { assertTrue(prompt.contains("viewBox=\"0 0 200 200\"")) }
    @Test fun `contains idle-bob requirement`()    { assertTrue(prompt.contains("idle-bob")) }
    @Test fun `contains file size limit`()         { assertTrue(prompt.contains("15 KB")) }
    @Test fun `contains outline colour`()          { assertTrue(prompt.contains("#1a1a2e")) }
    @Test fun `contains head placement`()          { assertTrue(prompt.contains("y=20–40")) }
    @Test fun `contains feet placement`()          { assertTrue(prompt.contains("y=175–195")) }
}

class SystemPromptContentTest {
    private val spec = "## AI Art Generation\n- viewBox 0 0 200 200\n- Flat fills only"

    @Test fun `embeds spec section verbatim`()  { assertTrue(Logic.buildSystemPrompt(spec).contains(spec)) }
    @Test fun `instructs fenced SVG output`()   { assertTrue(Logic.buildSystemPrompt(spec).contains("```")) }
    @Test fun `mentions bezier curves`()        { assertTrue(Logic.buildSystemPrompt(spec).contains("bezier")) }
}

// ---------------------------------------------------------------------------
// Tests — image generation
// ---------------------------------------------------------------------------

class GeminiImageDecodingTest {
    private val sampleBytes = byteArrayOf(0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    private val sampleB64   = Base64.getEncoder().encodeToString(sampleBytes)

    private fun mockParsed(b64: String?): Any =
        mapOf("predictions" to listOf(mapOf("bytesBase64Encoded" to b64, "mimeType" to "image/png")))

    @Test fun `decodes base64 to correct bytes`()     { assertArrayEquals(sampleBytes, Logic.decodeGeminiImageResponse(mockParsed(sampleB64))) }
    @Test fun `throws when predictions missing`()     { assertThrows<IllegalStateException> { Logic.decodeGeminiImageResponse(mapOf<String, Any>()) } }
    @Test fun `throws when predictions empty`()       { assertThrows<IllegalStateException> { Logic.decodeGeminiImageResponse(mapOf("predictions" to emptyList<Any>())) } }
    @Test fun `throws when bytesBase64Encoded null`() { assertThrows<IllegalStateException> { Logic.decodeGeminiImageResponse(mockParsed(null)) } }
    @Test fun `throws on null input`()                { assertThrows<IllegalStateException> { Logic.decodeGeminiImageResponse(null) } }
}

class GrokImageDecodingTest {
    private val sampleBytes = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0xFF.toByte(), 0xE0.toByte())
    private val sampleB64   = Base64.getEncoder().encodeToString(sampleBytes)

    private fun mockParsed(b64: String?): Any =
        mapOf("data" to listOf(mapOf("b64_json" to b64)))

    @Test fun `decodes base64 to correct bytes`()  { assertArrayEquals(sampleBytes, Logic.decodeGrokImageResponse(mockParsed(sampleB64))) }
    @Test fun `throws when data missing`()         { assertThrows<IllegalStateException> { Logic.decodeGrokImageResponse(mapOf<String, Any>()) } }
    @Test fun `throws when data empty`()           { assertThrows<IllegalStateException> { Logic.decodeGrokImageResponse(mapOf("data" to emptyList<Any>())) } }
    @Test fun `throws when b64_json null`()        { assertThrows<IllegalStateException> { Logic.decodeGrokImageResponse(mockParsed(null)) } }
    @Test fun `throws on null input`()             { assertThrows<IllegalStateException> { Logic.decodeGrokImageResponse(null) } }
}

class ImagePromptContentTest {
    private val type  = CharacterType("partisan-boss", "Partisan Boss", "hires player", "gold suit; red tie", "oversized round head")
    private val state = StarState("thumbs-up", 3, "Thumbs up (ecstatic)", "arm raised, big grin")
    private val style = "Bold outlines, flat fills, Vault Boy style"
    private val prompt by lazy { Logic.buildImagePrompt(type, state, style) }

    @Test fun `contains character display name`()  { assertTrue(prompt.contains("Partisan Boss")) }
    @Test fun `contains state label`()             { assertTrue(prompt.contains("Thumbs up")) }
    @Test fun `contains palette`()                 { assertTrue(prompt.contains("gold suit")) }
    @Test fun `contains silhouette notes`()        { assertTrue(prompt.contains("oversized round head")) }
    @Test fun `contains pose guide`()              { assertTrue(prompt.contains("arm raised")) }
    @Test fun `contains role`()                    { assertTrue(prompt.contains("hires player")) }
    @Test fun `embeds style spec`()                { assertTrue(prompt.contains(style)) }
    @Test fun `mentions white background`()        { assertTrue(prompt.contains("White background")) }
}

class DefaultImageStyleTest {
    @Test fun `mentions Vault Boy`()       { assertTrue(DEFAULT_IMAGE_STYLE.contains("Vault Boy")) }
    @Test fun `mentions flat fills`()      { assertTrue(DEFAULT_IMAGE_STYLE.contains("Flat fills")) }
    @Test fun `mentions oversized head`()  { assertTrue(DEFAULT_IMAGE_STYLE.contains("Oversized round head")) }
    @Test fun `is not blank`()             { assertTrue(DEFAULT_IMAGE_STYLE.isNotBlank()) }
}

// ---------------------------------------------------------------------------
// Tests — output paths
// ---------------------------------------------------------------------------

class OutputPathTest {
    @Test fun `single count uses plain filename with extension`() {
        val p = Logic.outputPath("/tmp/out", "partisan-boss", "idle", "png", 1, 1)
        assertEquals("idle.png", p.fileName.toString())
        assertTrue(p.toString().contains("partisan-boss"))
    }
    @Test fun `multi count appends number`() {
        assertEquals("idle-1.png", Logic.outputPath("/tmp/out", "t", "idle", "png", 1, 3).fileName.toString())
        assertEquals("idle-2.png", Logic.outputPath("/tmp/out", "t", "idle", "png", 2, 3).fileName.toString())
    }
    @Test fun `svg extension works`() {
        val p = Logic.outputPath("/tmp/out", "governor", "three-star", "svg", 1, 1)
        assertEquals("three-star.svg", p.fileName.toString())
    }
    @Test fun `path includes type directory`() {
        val p = Logic.outputPath("/tmp/out", "governor", "three-star", "svg", 1, 1)
        assertTrue(p.toString().contains("governor"))
    }
}

// ---------------------------------------------------------------------------
// Tests — credentials
// ---------------------------------------------------------------------------

class CredentialFileParsingTest {
    @TempDir lateinit var tmp: Path

    @Test fun `plain text file yields ApiKey`() {
        val f = tmp.resolve("key.txt").also { Files.writeString(it, "my-api-key\n") }
        assertEquals(Credential.ApiKey("my-api-key"), Logic.parseCredentialFile(f))
    }
    @Test fun `plain text file is trimmed`() {
        val f = tmp.resolve("key.txt").also { Files.writeString(it, "  trimmed  \n") }
        assertEquals(Credential.ApiKey("trimmed"), Logic.parseCredentialFile(f))
    }
    @Test fun `gemini oauth JSON yields BearerToken`() {
        val f = tmp.resolve("oauth.json").also {
            Files.writeString(it, """{"access_token":"ya29.abc","token_type":"Bearer"}""")
        }
        assertEquals(Credential.BearerToken("ya29.abc"), Logic.parseCredentialFile(f))
    }
    @Test fun `JSON without access_token falls back to ApiKey`() {
        val json = """{"some_other_field":"value"}"""
        val f = tmp.resolve("other.json").also { Files.writeString(it, json) }
        assertEquals(Credential.ApiKey(json), Logic.parseCredentialFile(f))
    }
    @Test fun `blank access_token falls back to ApiKey`() {
        val json = """{"access_token":"   "}"""
        val f = tmp.resolve("blank.json").also { Files.writeString(it, json) }
        assertEquals(Credential.ApiKey(json), Logic.parseCredentialFile(f))
    }
}

class CredentialResolutionTest {
    @TempDir lateinit var tmp: Path

    private fun keyFile(name: String, content: String) =
        tmp.resolve(name).also { Files.writeString(it, content) }.toString()

    @Test fun `api-key flag takes highest priority`() {
        assertEquals(Credential.ApiKey("flag"), Logic.resolveCredential("gemini", "flag", "other", null, emptyList()))
    }
    @Test fun `provider key flag used when api-key absent`() {
        assertEquals(Credential.ApiKey("prov"), Logic.resolveCredential("gemini", null, "prov", null, emptyList()))
    }
    @Test fun `credentials file used when no key flag`() {
        val path = keyFile("key.txt", "file-key")
        assertEquals(Credential.ApiKey("file-key"), Logic.resolveCredential("gemini", null, null, path, emptyList()))
    }
    @Test fun `oauth credentials file yields BearerToken`() {
        val path = keyFile("oauth.json", """{"access_token":"ya29.tok"}""")
        assertEquals(Credential.BearerToken("ya29.tok"), Logic.resolveCredential("gemini", null, null, path, emptyList()))
    }
    @Test fun `auto-search path used as last resort`() {
        val path = keyFile("auto.txt", "auto-key")
        assertEquals(Credential.ApiKey("auto-key"), Logic.resolveCredential("gemini", null, null, null, listOf(path)))
    }
    @Test fun `first matching auto-search path wins`() {
        val p1 = keyFile("first.txt", "key-first")
        val p2 = keyFile("second.txt", "key-second")
        assertEquals(Credential.ApiKey("key-first"), Logic.resolveCredential("gemini", null, null, null, listOf(p1, p2)))
    }
    @Test fun `non-existent auto-search paths are skipped`() {
        val path = keyFile("real.txt", "real-key")
        assertEquals(Credential.ApiKey("real-key"), Logic.resolveCredential("gemini", null, null, null, listOf("/no/such/file", path)))
    }
    @Test fun `missing credentials file throws with path in message`() {
        val ex = assertThrows<IllegalStateException> { Logic.resolveCredential("gemini", null, null, "/nonexistent.txt", emptyList()) }
        assertTrue(ex.message!!.contains("/nonexistent.txt"))
    }
    @Test fun `no credentials at all throws with provider name`() {
        val ex = assertThrows<IllegalStateException> { Logic.resolveCredential("grok", null, null, null, emptyList()) }
        assertTrue(ex.message!!.contains("grok"))
    }
}

// ---------------------------------------------------------------------------
// Tests — spec parsing
// ---------------------------------------------------------------------------

class SpriteSpecParsingTest {
    private val minimalSpec = """
        {
          "characterTypes": [
            {"id":"partisan-boss","displayName":"Partisan Boss","role":"role","palette":"palette","silhouetteNotes":"notes"}
          ],
          "starStates": [
            {"id":"three-star","stars":3,"label":"Three-star (ecstatic)","poseGuide":"arms up"}
          ]
        }
    """.trimIndent()

    @Test fun `parses character type fields`() {
        val spec = Logic.loadSpriteSpec(minimalSpec)
        assertEquals(1, spec.characterTypes.size)
        assertEquals("partisan-boss", spec.characterTypes[0].id)
        assertEquals("Partisan Boss", spec.characterTypes[0].displayName)
    }
    @Test fun `parses star state fields`() {
        val spec = Logic.loadSpriteSpec(minimalSpec)
        assertEquals(1, spec.starStates.size)
        assertEquals("three-star", spec.starStates[0].id)
        assertEquals(3, spec.starStates[0].stars)
    }
    @Test fun `actual sprite-spec json is valid and complete`() {
        val path = Paths.get("tools/sprite-spec.json")
        assertTrue(Files.exists(path), "tools/sprite-spec.json must exist")
        val spec = Logic.loadSpriteSpec(Files.readString(path))
        assertEquals(5, spec.characterTypes.size, "Expected 5 character types")
        assertEquals(4, spec.starStates.size,     "Expected 4 star states")
        val typeIds  = spec.characterTypes.map { it.id }.toSet()
        val stateIds = spec.starStates.map { it.id }.toSet()
        assertTrue("partisan-boss" in typeIds)
        assertTrue("three-star"   in stateIds)
        spec.characterTypes.forEach { t ->
            assertTrue(t.palette.isNotBlank(),         "${t.id}: blank palette")
            assertTrue(t.silhouetteNotes.isNotBlank(), "${t.id}: blank silhouetteNotes")
        }
        assertEquals(setOf(0, 1, 2, 3), spec.starStates.map { it.stars }.toSet())
    }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

val request = LauncherDiscoveryRequestBuilder.request()
    .selectors(
        selectClass(SvgExtractionTest::class.java),
        selectClass(SpritePromptContentTest::class.java),
        selectClass(SystemPromptContentTest::class.java),
        selectClass(GeminiImageDecodingTest::class.java),
        selectClass(GrokImageDecodingTest::class.java),
        selectClass(ImagePromptContentTest::class.java),
        selectClass(DefaultImageStyleTest::class.java),
        selectClass(OutputPathTest::class.java),
        selectClass(CredentialFileParsingTest::class.java),
        selectClass(CredentialResolutionTest::class.java),
        selectClass(SpriteSpecParsingTest::class.java),
    )
    .build()

val listener = SummaryGeneratingListener()
LauncherFactory.create().execute(request, listener)

val summary = listener.summary
println(
    "\n${summary.testsSucceededCount}/${summary.testsStartedCount} tests passed" +
    if (summary.testsFailedCount > 0L) ", ${summary.testsFailedCount} FAILED" else ""
)
summary.failures.forEach { f ->
    println("  FAIL: ${f.testIdentifier.displayName}")
    println("        ${f.exception.message}")
}

if (summary.testsFailedCount > 0L) {
    System.err.println("Test run failed.")
    System.exit(1)
}
