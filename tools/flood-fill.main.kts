#!/usr/bin/env kotlin
/**
 * flood-fill.main.kts — remove near-white background pixels by making them transparent.
 *
 * Modes (combinable):
 *   --seed x,y  : BFS from a specific pixel. Repeatable.
 *   --edge      : BFS from all four image borders (exterior background only)
 *   (no flags)  : defaults to --edge
 *
 * --tolerance  Per-channel max distance from (255,255,255) treated as background.
 *              Default 75. Increase if fringe pixels persist; decrease if colours are eaten.
 *
 * De-matting: recovers foreground colour from white-composited pixels using:
 *   fg = (composited - 255*(1-a)) / a   where  a = (255 - luminance) / 255
 */
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.flag
import com.github.ajalt.clikt.parameters.options.multiple
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.options.required
import com.github.ajalt.clikt.parameters.types.int
import java.awt.image.BufferedImage
import java.io.File
import java.util.ArrayDeque
import javax.imageio.ImageIO
import kotlin.math.roundToInt

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

    fun fill(img: BufferedImage, seeds: List<Pair<Int, Int>>, tolerance: Int): Int {
        val W       = img.width
        val H       = img.height
        val visited = Array(H) { BooleanArray(W) }
        val queue   = ArrayDeque<Int>()

        fun enqueue(x: Int, y: Int) {
            if (x < 0 || y < 0 || x >= W || y >= H || visited[y][x]) return
            val px = img.getRGB(x, y)
            val a  = (px ushr 24) and 0xff
            if (a < 128) return  // already transparent — don't spread further
            val r  = (px ushr 16) and 0xff
            val g  = (px ushr 8)  and 0xff
            val b  =  px          and 0xff
            if (!isBackground(r, g, b, tolerance)) return
            visited[y][x] = true
            queue.add(y * W + x)
        }

        for ((sx, sy) in seeds) enqueue(sx, sy)

        var filled = 0
        while (queue.isNotEmpty()) {
            val idx = queue.poll()
            val x = idx % W
            val y = idx / W
            val px = img.getRGB(x, y)
            val r  = (px ushr 16) and 0xff
            val g  = (px ushr 8)  and 0xff
            val b  =  px          and 0xff
            img.setRGB(x, y, demat(r, g, b))
            filled++
            enqueue(x - 1, y); enqueue(x + 1, y)
            enqueue(x, y - 1); enqueue(x, y + 1)
        }
        return filled
    }
}

class FloodFill : CliktCommand(
    name = "flood-fill",
    help = "Remove near-white background by flood-filling to transparent.\n\n" +
           "With no flags, defaults to edge mode (fills from all four borders).\n" +
           "--seed and --edge can be combined to fill from edges plus specific pixels."
) {
    val input     by option("--input",     help = "Source PNG path").required()
    val output    by option("--output",    help = "Destination PNG path").required()
    val seedArgs  by option("--seed",      help = "Seed pixel as x,y. Repeatable.").multiple()
    val edgeMode  by option("--edge",      help = "Also seed from all four image borders").flag()
    val tolerance by option("--tolerance", help = "Per-channel distance from white (default 75)").int().default(75)

    override fun run() {
        val src = ImageIO.read(File(input)) ?: error("Cannot read image: $input")

        val img = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)
        val gc  = img.createGraphics()
        gc.drawImage(src, 0, 0, null)
        gc.dispose()

        val W = img.width
        val H = img.height

        val useEdge = edgeMode || seedArgs.isEmpty()

        val seeds = mutableListOf<Pair<Int, Int>>()
        if (useEdge) {
            for (x in 0 until W) { seeds += x to 0; seeds += x to H - 1 }
            for (y in 0 until H) { seeds += 0 to y; seeds += W - 1 to y }
        }
        for (s in seedArgs) {
            val parts = s.split(",")
            require(parts.size == 2) { "Seed must be x,y — got: $s" }
            seeds += parts[0].trim().toInt() to parts[1].trim().toInt()
        }

        val filled = FloodLogic.fill(img, seeds, tolerance)
        ImageIO.write(img, "PNG", File(output))
        val modes = buildList {
            if (useEdge) add("edge")
            if (seedArgs.isNotEmpty()) add("${seedArgs.size} explicit seed(s)")
        }.joinToString(" + ")
        println("Filled $filled pixels [$modes] → $output")
    }
}

FloodFill().main(args)
