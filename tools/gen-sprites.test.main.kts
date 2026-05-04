#!/usr/bin/env kotlin

// NOTE: Kotlin scripts cannot import each other. Logic under test is duplicated
// here from gen-sprites.main.kts. The right long-term fix is to extract shared
// logic to a .kt lib that both scripts depend on.
//
// IMPORTANT: Logic under test must live in an `object`, not as top-level functions.
// Top-level functions in .kts files are instance methods of the generated script
// class; test classes (static nested classes) cannot reference them without the
// outer instance, causing JUnit to silently skip all tests in such classes.

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

// ---------------------------------------------------------------------------
// Duplicated from gen-sprites.main.kts
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

object Logic {
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val jsonAny = moshi.adapter(Any::class.java)
    val specAdapter = moshi.adapter(SpriteSpec::class.java)

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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

class SvgExtractionTest {
    private val minimalSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\">\n  <circle cx=\"100\" cy=\"100\" r=\"50\"/>\n</svg>"

    @Test fun `extracts SVG from svg-fenced code block`()   { assertEquals(minimalSvg, Logic.extractSvg("```svg\n$minimalSvg\n```")) }
    @Test fun `extracts SVG from xml-fenced code block`()   { assertEquals(minimalSvg, Logic.extractSvg("```xml\n$minimalSvg\n```")) }
    @Test fun `extracts SVG from plain-fenced code block`() { assertEquals(minimalSvg, Logic.extractSvg("```\n$minimalSvg\n```")) }

    @Test fun `extracts bare SVG with no fence`() {
        val result = Logic.extractSvg("preamble\n$minimalSvg\ntrailing")
        assertTrue(result.startsWith("<svg") && result.endsWith("</svg>"))
    }

    @Test fun `throws on response with no SVG`()  { assertThrows<IllegalStateException> { Logic.extractSvg("no svg here") } }
    @Test fun `throws on empty string`()           { assertThrows<IllegalStateException> { Logic.extractSvg("") } }

    @Test fun `extracted SVG does not contain fence markers`() {
        assertFalse(Logic.extractSvg("```svg\n$minimalSvg\n```").contains("```"))
    }
}

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
        val ex = assertThrows<IllegalStateException> {
            Logic.resolveCredential("gemini", null, null, "/nonexistent.txt", emptyList())
        }
        assertTrue(ex.message!!.contains("/nonexistent.txt"))
    }

    @Test fun `no credentials at all throws with provider name`() {
        val ex = assertThrows<IllegalStateException> {
            Logic.resolveCredential("grok", null, null, null, emptyList())
        }
        assertTrue(ex.message!!.contains("grok"))
    }
}

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
        val ct = spec.characterTypes[0]
        assertEquals("partisan-boss", ct.id)
        assertEquals("Partisan Boss", ct.displayName)
        assertEquals("role", ct.role)
    }

    @Test fun `parses star state fields`() {
        val spec = Logic.loadSpriteSpec(minimalSpec)
        assertEquals(1, spec.starStates.size)
        val ss = spec.starStates[0]
        assertEquals("three-star", ss.id)
        assertEquals(3, ss.stars)
        assertEquals("arms up", ss.poseGuide)
    }

    @Test fun `parses multiple types and states`() {
        val json = """
        {
          "characterTypes": [
            {"id":"t1","displayName":"T1","role":"r","palette":"p","silhouetteNotes":"s"},
            {"id":"t2","displayName":"T2","role":"r","palette":"p","silhouetteNotes":"s"}
          ],
          "starStates": [
            {"id":"three-star","stars":3,"label":"Three-star","poseGuide":"up"},
            {"id":"zero-star","stars":0,"label":"Zero-star","poseGuide":"down"}
          ]
        }
        """.trimIndent()
        val spec = Logic.loadSpriteSpec(json)
        assertEquals(2, spec.characterTypes.size)
        assertEquals(2, spec.starStates.size)
    }

    @Test fun `actual sprite-spec json is valid and complete`() {
        val path = Paths.get("tools/sprite-spec.json")
        assertTrue(Files.exists(path), "tools/sprite-spec.json must exist")
        val spec = Logic.loadSpriteSpec(Files.readString(path))
        assertEquals(5, spec.characterTypes.size, "Expected 5 character types")
        assertEquals(4, spec.starStates.size,     "Expected 4 star states")
        val typeIds  = spec.characterTypes.map { it.id }.toSet()
        val stateIds = spec.starStates.map { it.id }.toSet()
        assertAll(
            { assertTrue("partisan-boss"     in typeIds) },
            { assertTrue("legal-authority"   in typeIds) },
            { assertTrue("bipartisan-broker" in typeIds) },
            { assertTrue("reform-arbiter"    in typeIds) },
            { assertTrue("neutral-admin"     in typeIds) },
            { assertTrue("three-star" in stateIds) },
            { assertTrue("two-star"   in stateIds) },
            { assertTrue("one-star"   in stateIds) },
            { assertTrue("zero-star"  in stateIds) },
        )
        assertEquals(setOf(0, 1, 2, 3), spec.starStates.map { it.stars }.toSet())
        spec.characterTypes.forEach { t ->
            assertTrue(t.displayName.isNotBlank(), "${t.id}: blank displayName")
            assertTrue(t.role.isNotBlank(),        "${t.id}: blank role")
            assertTrue(t.palette.isNotBlank(),     "${t.id}: blank palette")
        }
    }
}

class UserPromptContentTest {
    private val type  = CharacterType("partisan-boss", "Partisan Boss", "hires player", "gold/red", "wide shoulders")
    private val state = StarState("three-star", 3, "Three-star (ecstatic)", "arms raised high")
    private val prompt by lazy { Logic.buildUserPrompt(type, state) }

    @Test fun `contains character display name`() { assertTrue(prompt.contains("Partisan Boss")) }
    @Test fun `contains state label`()             { assertTrue(prompt.contains("Three-star")) }
    @Test fun `contains viewBox requirement`()     { assertTrue(prompt.contains("viewBox=\"0 0 200 200\"")) }
    @Test fun `contains idle-bob requirement`()    { assertTrue(prompt.contains("idle-bob")) }
    @Test fun `contains file size limit`()         { assertTrue(prompt.contains("15 KB")) }
    @Test fun `contains outline colour`()          { assertTrue(prompt.contains("#1a1a2e")) }
    @Test fun `contains head placement`()          { assertTrue(prompt.contains("y=30")) }
    @Test fun `contains feet placement`()          { assertTrue(prompt.contains("y=190")) }
}

class SystemPromptContentTest {
    private val spec = "## AI Art Generation\n- viewBox 0 0 200 200\n- Flat fills only"

    @Test fun `embeds spec section verbatim`()      { assertTrue(Logic.buildSystemPrompt(spec).contains(spec)) }
    @Test fun `instructs fenced SVG output`()        { assertTrue(Logic.buildSystemPrompt(spec).contains("```")) }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

val request = LauncherDiscoveryRequestBuilder.request()
    .selectors(
        selectClass(SvgExtractionTest::class.java),
        selectClass(CredentialFileParsingTest::class.java),
        selectClass(CredentialResolutionTest::class.java),
        selectClass(SpriteSpecParsingTest::class.java),
        selectClass(UserPromptContentTest::class.java),
        selectClass(SystemPromptContentTest::class.java),
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
