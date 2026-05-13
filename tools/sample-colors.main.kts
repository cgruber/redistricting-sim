#!/usr/bin/env kotlin
/**
 * sample-colors.main.kts — find pixels matching a colour filter and report the most common.
 *
 * Defaults to pinkish/magenta (high R, low-mid G, high B).
 * Adjust --min-r, --max-g, --min-b to target other colour ranges.
 */
@file:DependsOn("com.github.ajalt.clikt:clikt-jvm:4.4.0")

import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.arguments.argument
import com.github.ajalt.clikt.parameters.options.default
import com.github.ajalt.clikt.parameters.options.option
import com.github.ajalt.clikt.parameters.types.int
import java.io.File
import javax.imageio.ImageIO

object SampleColorsLogic {
    fun matchesFilter(r: Int, g: Int, b: Int, minR: Int, maxG: Int, minB: Int): Boolean =
        r > minR && g < maxG && b > minB

    fun bucketKey(r: Int, g: Int, b: Int, step: Int = 10): String =
        "(${r / step * step},${g / step * step},${b / step * step})"
}

class SampleColors : CliktCommand(
    name = "sample-colors",
    help = "Find pixels matching a colour filter in a PNG; report the most common buckets."
) {
    val imagePath by argument("IMAGE", help = "Path to PNG image")
    val minR      by option("--min-r", help = "Minimum red channel (default 180)").int().default(180)
    val maxG      by option("--max-g", help = "Maximum green channel (default 150)").int().default(150)
    val minB      by option("--min-b", help = "Minimum blue channel (default 100)").int().default(100)
    val topN      by option("--top",   help = "Show top N colour buckets (default 20)").int().default(20)

    override fun run() {
        val img = ImageIO.read(File(imagePath)) ?: error("Cannot read image: $imagePath")
        val W   = img.width
        val H   = img.height

        val buckets = HashMap<String, Int>()
        var total   = 0

        for (y in 0 until H) {
            for (x in 0 until W) {
                val px = img.getRGB(x, y)
                val r  = (px shr 16) and 0xFF
                val g  = (px shr 8)  and 0xFF
                val b  =  px         and 0xFF
                if (SampleColorsLogic.matchesFilter(r, g, b, minR, maxG, minB)) {
                    total++
                    val key = SampleColorsLogic.bucketKey(r, g, b)
                    buckets[key] = (buckets[key] ?: 0) + 1
                }
            }
        }

        println("Most common pixels matching (r>$minR, g<$maxG, b>$minB) in $imagePath (${W}×${H}):")
        buckets.entries.sortedByDescending { it.value }.take(topN).forEach { (k, v) -> println("  $k × $v") }
        println("\nTotal matching pixels: $total")
    }
}

SampleColors().main(args)
