#!/usr/bin/env kotlin
/**
 * Removes the background of a character sprite by flood-filling from all edge pixels.
 *
 * Only exterior pixels connected to the image boundary are made transparent.
 * Interior whites (teeth, eyes, highlights) are left untouched because they're
 * not reachable from the edges through the near-white region.
 *
 * De-matting: edge pixels were composited against a white background, so their
 * RGB contains white contamination. After computing alpha from luminance, the
 * foreground color is recovered by inverting the compositing formula:
 *   composited = fg * a + 255 * (1 - a)  →  fg = (composited - 255 * (1 - a)) / a
 * This strips white from the RGB so the edges are dark (outline color) with correct
 * alpha rather than whitish, eliminating the halo when rendered on a dark background.
 */
import java.awt.image.BufferedImage
import java.io.File
import java.util.ArrayDeque
import javax.imageio.ImageIO
import kotlin.math.roundToInt

val input  = args.getOrNull(0) ?: error("Usage: flood-transparent.main.kts <input.png> <output.png> [threshold]")
val output = args.getOrNull(1) ?: error("Usage: flood-transparent.main.kts <input.png> <output.png> [threshold]")
// BFS spreads through pixels where min(r,g,b) >= threshold (near-white). Default 180.
val threshold = args.getOrNull(2)?.toInt() ?: 180

val src = ImageIO.read(File(input))
val W = src.width
val H = src.height

val out = BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB)

// Copy source into ARGB output (fully opaque to start)
for (y in 0 until H) for (x in 0 until W) {
    out.setRGB(x, y, (0xFF shl 24) or (src.getRGB(x, y) and 0xFFFFFF))
}

fun isNearWhite(px: Int): Boolean {
    val r = (px shr 16) and 0xFF
    val g = (px shr 8)  and 0xFF
    val b =  px         and 0xFF
    return r >= threshold && g >= threshold && b >= threshold
}

// BFS flood fill from all four edges
val visited = Array(H) { BooleanArray(W) }
val queue   = ArrayDeque<Int>()

fun enqueue(x: Int, y: Int) {
    if (x < 0 || x >= W || y < 0 || y >= H || visited[y][x]) return
    if (!isNearWhite(src.getRGB(x, y))) return
    visited[y][x] = true
    queue.add(y * W + x)
}

for (x in 0 until W) { enqueue(x, 0); enqueue(x, H - 1) }
for (y in 0 until H) { enqueue(0, y); enqueue(W - 1, y) }

while (queue.isNotEmpty()) {
    val idx = queue.poll()
    val x = idx % W
    val y = idx / W
    enqueue(x - 1, y); enqueue(x + 1, y)
    enqueue(x, y - 1); enqueue(x, y + 1)
}

// Apply transparency with de-matting for visited (exterior) pixels.
//
// Step 1: alpha from luminance — pure white → 0, dark outline → 255.
// Step 2: recover foreground RGB by inverting the white-background compositing:
//   composited = fg * a + 255 * (1 - a)  →  fg = (composited - 255 + 255*a) / a
// This eliminates the white contamination that causes a halo on dark backgrounds.
var madeTransparent = 0
for (y in 0 until H) {
    for (x in 0 until W) {
        if (visited[y][x]) {
            val px    = src.getRGB(x, y)
            val r     = (px shr 16) and 0xFF
            val g     = (px shr 8)  and 0xFF
            val b     =  px         and 0xFF
            val lum   = (r + g + b) / 3
            val alpha = (255 - lum).coerceAtLeast(0)
            if (alpha == 0) {
                out.setRGB(x, y, 0)
            } else {
                val a    = alpha / 255.0
                val fgR  = ((r - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                val fgG  = ((g - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                val fgB  = ((b - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                out.setRGB(x, y, (alpha shl 24) or (fgR shl 16) or (fgG shl 8) or fgB)
            }
            madeTransparent++
        }
    }
}

ImageIO.write(out, "PNG", File(output))
println("Saved: $output  (${W}×${H}, $madeTransparent px made transparent/semi-transparent)")
