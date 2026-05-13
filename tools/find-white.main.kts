#!/usr/bin/env kotlin
/**
 * find-white.main.kts — locate near-white opaque pixels in a PNG.
 *
 * Default: print total count + up to 40 sample coordinates.
 * --spatial: bucket into 50px grid and show clusters sorted by density.
 * --threshold: minimum per-channel value for "near white" (default 240).
 */
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.arguments.argument
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.flag
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.int
import java.io.File
import javax.imageio.ImageIO

object FindWhiteLogic {
    fun isNearWhite(r: Int, g: Int, b: Int, a: Int, threshold: Int): Boolean =
        a > 0 && r >= threshold && g >= threshold && b >= threshold

    fun bucketKey(x: Int, y: Int, size: Int = 50): String {
        val gx = x / size * size
        val gy = y / size * size
        return "($gx-${gx + size}, $gy-${gy + size})"
    }
}

class FindWhite : CliktCommand(
    name = "find-white",
    help = "Find near-white opaque pixels in a PNG image."
) {
    val imagePath by argument("IMAGE", help = "Path to PNG image")
    val threshold by option("--threshold", help = "Min per-channel value for near-white (default 240)").int().default(240)
    val spatial   by option("--spatial",   help = "Show 50px grid distribution instead of sample coords").flag()

    override fun run() {
        val img = ImageIO.read(File(imagePath)) ?: error("Cannot read image: $imagePath")
        val W   = img.width
        val H   = img.height

        var count = 0
        val samples = mutableListOf<Pair<Int, Int>>()
        val grid    = HashMap<String, Int>()

        for (y in 0 until H) {
            for (x in 0 until W) {
                val px = img.getRGB(x, y)
                val a  = (px ushr 24) and 0xFF
                val r  = (px shr 16)  and 0xFF
                val g  = (px shr 8)   and 0xFF
                val b  =  px          and 0xFF
                if (FindWhiteLogic.isNearWhite(r, g, b, a, threshold)) {
                    count++
                    if (!spatial && samples.size < 40) samples.add(x to y)
                    if (spatial) {
                        val key = FindWhiteLogic.bucketKey(x, y)
                        grid[key] = (grid[key] ?: 0) + 1
                    }
                }
            }
        }

        println("Total near-white opaque pixels (threshold=$threshold): $count in ${W}×${H}")
        if (spatial) {
            println("50px grid distribution:")
            grid.entries.sortedByDescending { it.value }.forEach { (k, v) -> println("  $k → $v px") }
        } else {
            println("Sample locations (up to 40):")
            samples.forEach { (x, y) -> println("  ($x,$y)") }
        }
    }
}

FindWhite().main(args)
