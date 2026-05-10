#!/usr/bin/env kotlin
/**
 * flood-fill-alpha.main.kts — flood-fill near-white pixels to transparent
 * starting from a given seed pixel, using BFS.
 *
 * Usage:
 *   ./flood-fill-alpha.main.kts --input <in.png> --output <out.png> \
 *                               --x <col> --y <row> [--tolerance <0-255>]
 *
 * --tolerance  Max per-channel distance from (255,255,255) to treat as
 *              background. Default 30. Increase if fringe pixels persist;
 *              decrease if character colours are eaten.
 */
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.options.required
import com.github.ajalt.clikt.parameters.types.int
import java.awt.image.BufferedImage
import java.io.File
import java.util.ArrayDeque
import javax.imageio.ImageIO
import kotlin.math.roundToInt

class FloodFillAlpha : CliktCommand(
    name = "flood-fill-alpha",
    help = "Flood-fill near-white pixels to transparent, starting from a seed pixel."
) {
    val input  by option("--input",  help = "Source PNG path").required()
    val output by option("--output", help = "Destination PNG path").required()
    val seedX  by option("--x",      help = "Seed pixel column (0-based)").int().required()
    val seedY  by option("--y",      help = "Seed pixel row (0-based)").int().required()
    val tol    by option("--tolerance", help = "Per-channel distance from white (default 30)").int().default(30)

    override fun run() {
        val src = ImageIO.read(File(input))
            ?: error("Cannot read image: $input")

        // Work on an ARGB copy so we can write alpha.
        val img = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)
        val g = img.createGraphics()
        g.drawImage(src, 0, 0, null)
        g.dispose()

        val w = img.width
        val h = img.height

        fun isBackground(rgb: Int): Boolean {
            val a = (rgb ushr 24) and 0xff
            if (a < 128) return false         // already transparent — skip, don't re-enqueue
            val r = (rgb ushr 16) and 0xff
            val g = (rgb ushr 8)  and 0xff
            val b =  rgb          and 0xff
            return r >= (255 - tol) && g >= (255 - tol) && b >= (255 - tol)
        }

        val visited = Array(h) { BooleanArray(w) }
        val queue   = ArrayDeque<Int>()

        fun enqueue(x: Int, y: Int) {
            if (x < 0 || y < 0 || x >= w || y >= h) return
            if (visited[y][x]) return
            if (!isBackground(img.getRGB(x, y))) return
            visited[y][x] = true
            queue.add(y * w + x)
        }

        enqueue(seedX, seedY)

        var filled = 0
        while (queue.isNotEmpty()) {
            val idx = queue.poll()
            val px = idx % w
            val py = idx / w
            // De-matting: recover foreground color and alpha from white-composited pixel,
            // same formula as flood-transparent.main.kts.
            val rgb  = img.getRGB(px, py)
            val r    = (rgb ushr 16) and 0xff
            val g    = (rgb ushr 8)  and 0xff
            val b    =  rgb          and 0xff
            val lum  = (r + g + b) / 3
            val alpha = (255 - lum).coerceAtLeast(0)
            if (alpha == 0) {
                img.setRGB(px, py, 0x00000000)
            } else {
                val a   = alpha / 255.0
                val fgR = ((r - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                val fgG = ((g - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                val fgB = ((b - 255.0 * (1.0 - a)) / a).roundToInt().coerceIn(0, 255)
                img.setRGB(px, py, (alpha shl 24) or (fgR shl 16) or (fgG shl 8) or fgB)
            }
            filled++
            enqueue(px - 1, py)
            enqueue(px + 1, py)
            enqueue(px, py - 1)
            enqueue(px, py + 1)
        }

        ImageIO.write(img, "PNG", File(output))
        println("Filled $filled pixels → $output")
    }
}

FloodFillAlpha().main(args)
