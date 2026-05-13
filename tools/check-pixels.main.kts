#!/usr/bin/env kotlin
/**
 * check-pixels.main.kts — inspect ARGB values at specific coordinates in a PNG.
 *
 * Usage: check-pixels.main.kts <image.png> x1,y1 [x2,y2 ...]
 */
import java.io.File
import javax.imageio.ImageIO

val path = args.getOrNull(0) ?: error("Usage: check-pixels.main.kts <image.png> x1,y1 ...")
val img  = ImageIO.read(File(path)) ?: error("Cannot read image: $path")

args.drop(1).forEach { s ->
    val parts = s.split(",")
    require(parts.size == 2) { "Expected x,y — got: $s" }
    val x  = parts[0].toInt()
    val y  = parts[1].toInt()
    val px = img.getRGB(x, y)
    val a  = (px ushr 24) and 0xFF
    val r  = (px shr 16)  and 0xFF
    val g  = (px shr 8)   and 0xFF
    val b  =  px          and 0xFF
    val label = when {
        a == 0                           -> "TRANSPARENT"
        r == 255 && g == 255 && b == 255 -> "WHITE"
        else                             -> "rgb($r,$g,$b) a=$a"
    }
    println("($x,$y) → $label")
}
