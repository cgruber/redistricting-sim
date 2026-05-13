#!/usr/bin/env kotlin
/**
 * normalize-magenta — replace near-magenta/hot-pink pixels with pure #FF00FF
 *
 * Grok generates "magenta" as hot pink (R≈250, G≈0, B≈130) rather than true
 * magenta (R=255, G=0, B=255). This breaks party-color tinting which looks for
 * pure #FF00FF. Run this before transparency fill.
 *
 * Usage:
 *   ./normalize-magenta.main.kts <input.png> <output.png> [tolerance]
 *
 * tolerance: max per-channel distance from the target hot-pink center to qualify
 *            for replacement. Default 80. Increase if some magenta is missed.
 */
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val input  = args.getOrNull(0) ?: error("Usage: normalize-magenta.main.kts <input.png> <output.png> [tolerance]")
val output = args.getOrNull(1) ?: error("Usage: normalize-magenta.main.kts <input.png> <output.png> [tolerance]")
val tol    = args.getOrNull(2)?.let { it.toIntOrNull() ?: error("tolerance must be an integer, got: $it") } ?: 80

val src = ImageIO.read(File(input))
val out = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)

// Detected hot-pink center from sampling: R≈250, G≈0, B≈130
// Criteria: high R, low G, mid-range B (distinguishes from true blue or true magenta)
fun isHotPink(r: Int, g: Int, b: Int): Boolean {
    val dr = r - 250; val dg = g - 0; val db = b - 130
    return Math.sqrt((dr*dr + dg*dg + db*db).toDouble()) < tol
}

var count = 0
for (y in 0 until src.height) {
    for (x in 0 until src.width) {
        val px = src.getRGB(x, y)
        val a = (px ushr 24) and 0xFF
        if (a == 0) {
            // Fully transparent pixel — preserve as-is, do not recolor.
            out.setRGB(x, y, px)
            continue
        }
        val r = (px shr 16) and 0xFF
        val g = (px shr 8)  and 0xFF
        val b =  px         and 0xFF
        if (isHotPink(r, g, b)) {
            out.setRGB(x, y, (0xFF shl 24) or 0xFF00FF)
            count++
        } else {
            // Preserve original alpha; replace only the RGB channels.
            out.setRGB(x, y, (a shl 24) or (px and 0xFFFFFF))
        }
    }
}

ImageIO.write(out, "PNG", File(output))
println("Normalized $count pixels → $output")
