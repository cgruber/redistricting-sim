#!/usr/bin/env kotlin
// NOTE: Kotlin scripts cannot import each other. Logic under test is duplicated
// here from the production scripts. All testable logic lives in object blocks.
// See the corresponding *.main.kts files for the canonical implementations.

@file:Repository("https://repo1.maven.org/maven2/")
@file:DependsOn("org.junit.jupiter:junit-jupiter-api:5.11.0")
@file:DependsOn("org.junit.jupiter:junit-jupiter-engine:5.11.0")
@file:DependsOn("org.junit.platform:junit-platform-launcher:1.11.0")

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.platform.engine.discovery.DiscoverySelectors.selectClass
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder
import org.junit.platform.launcher.core.LauncherFactory
import org.junit.platform.launcher.listeners.SummaryGeneratingListener
import kotlin.math.roundToInt

// ---------------------------------------------------------------------------
// Duplicated from flood-fill.main.kts
// ---------------------------------------------------------------------------

object FloodLogic {
    fun isBackground(r: Int, g: Int, b: Int, tolerance: Int): Boolean {
        val threshold = 255 - tolerance
        return r >= threshold && g >= threshold && b >= threshold
    }

    fun demat(r: Int, g: Int, b: Int): Int {
        val lum   = (r + g + b) / 3
        val alpha = (255 - lum).coerceAtLeast(0)
        if (alpha == 0) return 0x00000000
        val a    = alpha / 255.0
        val fgR  = ((r - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
        val fgG  = ((g - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
        val fgB  = ((b - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
        return (alpha shl 24) or (fgR shl 16) or (fgG shl 8) or fgB
    }
}

// ---------------------------------------------------------------------------
// Duplicated from find-white.main.kts
// ---------------------------------------------------------------------------

object FindWhiteLogic {
    fun isNearWhite(r: Int, g: Int, b: Int, a: Int, threshold: Int): Boolean =
        a > 0 && r >= threshold && g >= threshold && b >= threshold

    fun bucketKey(x: Int, y: Int, size: Int = 50): String {
        val gx = x / size * size
        val gy = y / size * size
        return "($gx-${gx + size}, $gy-${gy + size})"
    }
}

// ---------------------------------------------------------------------------
// Duplicated from sample-colors.main.kts
// ---------------------------------------------------------------------------

object SampleColorsLogic {
    fun matchesFilter(r: Int, g: Int, b: Int, minR: Int, maxG: Int, minB: Int): Boolean =
        r > minR && g < maxG && b > minB

    fun bucketKey(r: Int, g: Int, b: Int, step: Int = 10): String =
        "(${r / step * step},${g / step * step},${b / step * step})"
}

// ---------------------------------------------------------------------------
// Tests — FloodLogic.isBackground
// ---------------------------------------------------------------------------

class FloodIsBackgroundTest {
    @Test fun `pure white is background at zero tolerance`()    { assertTrue(FloodLogic.isBackground(255, 255, 255, 0)) }
    @Test fun `pure white is background at tolerance 75`()      { assertTrue(FloodLogic.isBackground(255, 255, 255, 75)) }
    @Test fun `pure black is not background`()                  { assertFalse(FloodLogic.isBackground(0, 0, 0, 75)) }
    @Test fun `near-white within tolerance is background`()     { assertTrue(FloodLogic.isBackground(200, 200, 200, 75)) }  // threshold=180
    @Test fun `pixel below threshold in red is not background`(){ assertFalse(FloodLogic.isBackground(150, 200, 200, 75)) }
    @Test fun `all three channels must meet threshold`()        { assertFalse(FloodLogic.isBackground(255, 255, 100, 75)) }
    @Test fun `tolerance zero requires exact white`()           { assertFalse(FloodLogic.isBackground(254, 255, 255, 0)) }
    @Test fun `tolerance 255 treats all pixels as background`() { assertTrue(FloodLogic.isBackground(0, 0, 0, 255)) }
    @Test fun `pixel exactly at threshold passes`()             { assertTrue(FloodLogic.isBackground(180, 180, 180, 75)) }
    @Test fun `pixel one below threshold fails`()               { assertFalse(FloodLogic.isBackground(179, 180, 180, 75)) }
}

// ---------------------------------------------------------------------------
// Tests — FloodLogic.demat
// ---------------------------------------------------------------------------

class FloodDematTest {
    @Test fun `pure white produces fully transparent`() {
        assertEquals(0x00000000, FloodLogic.demat(255, 255, 255))
    }
    @Test fun `pure black produces fully opaque black`() {
        val result = FloodLogic.demat(0, 0, 0)
        assertEquals(255, (result ushr 24) and 0xFF)
    }
    @Test fun `mid-grey has alpha proportional to darkness`() {
        // lum = 128 → alpha = 255 - 128 = 127
        val result = FloodLogic.demat(128, 128, 128)
        assertEquals(127, (result ushr 24) and 0xFF)
    }
    @Test fun `alpha is always in range 0 to 255`() {
        for (v in listOf(0, 64, 128, 200, 254, 255)) {
            val alpha = (FloodLogic.demat(v, v, v) ushr 24) and 0xFF
            assertTrue(alpha in 0..255, "alpha=$alpha out of range for v=$v")
        }
    }
    @Test fun `RGB components are always in valid range`() {
        listOf(Triple(50, 100, 75), Triple(100, 200, 150), Triple(0, 128, 64)).forEach { (r, g, b) ->
            val px = FloodLogic.demat(r, g, b)
            val pr = (px shr 16) and 0xFF
            val pg = (px shr 8)  and 0xFF
            val pb =  px         and 0xFF
            assertTrue(pr in 0..255 && pg in 0..255 && pb in 0..255, "Out of range for demat($r,$g,$b)")
        }
    }
    @Test fun `identical RGB channels produce identical output channels`() {
        val px = FloodLogic.demat(100, 100, 100)
        val r  = (px shr 16) and 0xFF
        val g  = (px shr 8)  and 0xFF
        val b  =  px         and 0xFF
        assertEquals(r, g)
        assertEquals(g, b)
    }
}

// ---------------------------------------------------------------------------
// Tests — FindWhiteLogic.isNearWhite
// ---------------------------------------------------------------------------

class FindWhiteIsNearWhiteTest {
    @Test fun `pure white opaque pixel is near-white`()              { assertTrue(FindWhiteLogic.isNearWhite(255, 255, 255, 255, 240)) }
    @Test fun `transparent pixel is never near-white`()              { assertFalse(FindWhiteLogic.isNearWhite(255, 255, 255, 0, 240)) }
    @Test fun `pixel below threshold in green is not near-white`()   { assertFalse(FindWhiteLogic.isNearWhite(255, 100, 255, 255, 240)) }
    @Test fun `pixel exactly at threshold is near-white`()           { assertTrue(FindWhiteLogic.isNearWhite(240, 240, 240, 255, 240)) }
    @Test fun `pixel one below threshold is not near-white`()        { assertFalse(FindWhiteLogic.isNearWhite(239, 240, 240, 255, 240)) }
    @Test fun `threshold 0 accepts all opaque pixels`()              { assertTrue(FindWhiteLogic.isNearWhite(0, 0, 0, 255, 0)) }
    @Test fun `semi-transparent pixel with alpha gt 0 counts`()      { assertTrue(FindWhiteLogic.isNearWhite(255, 255, 255, 1, 240)) }
}

// ---------------------------------------------------------------------------
// Tests — FindWhiteLogic.bucketKey
// ---------------------------------------------------------------------------

class FindWhiteBucketKeyTest {
    @Test fun `pixel at origin is in first bucket`()                { assertEquals("(0-50, 0-50)", FindWhiteLogic.bucketKey(0, 0)) }
    @Test fun `pixel at 49,49 is still in first bucket`()           { assertEquals("(0-50, 0-50)", FindWhiteLogic.bucketKey(49, 49)) }
    @Test fun `pixel at 50,0 starts second x-bucket`()              { assertEquals("(50-100, 0-50)", FindWhiteLogic.bucketKey(50, 0)) }
    @Test fun `pixel at 100,100 is in third bucket both axes`()     { assertEquals("(100-150, 100-150)", FindWhiteLogic.bucketKey(100, 100)) }
    @Test fun `custom bucket size is applied`()                      { assertEquals("(0-100, 0-100)", FindWhiteLogic.bucketKey(50, 50, 100)) }
    @Test fun `pixels in same bucket return same key`() {
        assertEquals(FindWhiteLogic.bucketKey(10, 20), FindWhiteLogic.bucketKey(49, 49))
    }
    @Test fun `adjacent bucket pixels return different keys`() {
        assertNotEquals(FindWhiteLogic.bucketKey(49, 0), FindWhiteLogic.bucketKey(50, 0))
    }
}

// ---------------------------------------------------------------------------
// Tests — SampleColorsLogic.matchesFilter
// ---------------------------------------------------------------------------

class SampleColorsMatchesFilterTest {
    @Test fun `magenta-ish pixel passes default filter`() {
        assertTrue(SampleColorsLogic.matchesFilter(200, 100, 180, 180, 150, 100))
    }
    @Test fun `red at boundary fails (requires strictly greater)`() {
        assertFalse(SampleColorsLogic.matchesFilter(180, 100, 180, 180, 150, 100))
    }
    @Test fun `green at boundary fails (requires strictly less)`() {
        assertFalse(SampleColorsLogic.matchesFilter(200, 150, 180, 180, 150, 100))
    }
    @Test fun `blue at boundary fails (requires strictly greater)`() {
        assertFalse(SampleColorsLogic.matchesFilter(200, 100, 100, 180, 150, 100))
    }
    @Test fun `all channels one past boundary pass`() {
        assertTrue(SampleColorsLogic.matchesFilter(181, 149, 101, 180, 150, 100))
    }
    @Test fun `pure white fails magenta filter`() {
        assertFalse(SampleColorsLogic.matchesFilter(255, 255, 255, 180, 150, 100))
    }
}

// ---------------------------------------------------------------------------
// Tests — SampleColorsLogic.bucketKey
// ---------------------------------------------------------------------------

class SampleColorsBucketKeyTest {
    @Test fun `exact multiples of step map cleanly`() {
        assertEquals("(180,100,110)", SampleColorsLogic.bucketKey(180, 100, 110))
    }
    @Test fun `values within a step land in same bucket`() {
        assertEquals(SampleColorsLogic.bucketKey(181, 105, 113), SampleColorsLogic.bucketKey(189, 109, 119))
    }
    @Test fun `step boundary starts a new bucket`() {
        assertNotEquals(SampleColorsLogic.bucketKey(189, 109, 119), SampleColorsLogic.bucketKey(190, 110, 120))
    }
    @Test fun `custom step is applied`() {
        assertEquals("(100,0,0)", SampleColorsLogic.bucketKey(120, 75, 30, 100))
    }
    @Test fun `zero values produce zero bucket`() {
        assertEquals("(0,0,0)", SampleColorsLogic.bucketKey(0, 0, 9))
    }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

val request = LauncherDiscoveryRequestBuilder.request()
    .selectors(
        selectClass(FloodIsBackgroundTest::class.java),
        selectClass(FloodDematTest::class.java),
        selectClass(FindWhiteIsNearWhiteTest::class.java),
        selectClass(FindWhiteBucketKeyTest::class.java),
        selectClass(SampleColorsMatchesFilterTest::class.java),
        selectClass(SampleColorsBucketKeyTest::class.java),
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
