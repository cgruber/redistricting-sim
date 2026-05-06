#!/usr/bin/env kotlin
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val input  = args.getOrNull(0) ?: error("Usage: make-transparent.main.kts <input.png> <output.png>")
val output = args.getOrNull(1) ?: error("Usage: make-transparent.main.kts <input.png> <output.png>")

val src = ImageIO.read(File(input))
val out = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)

for (y in 0 until src.height) {
    for (x in 0 until src.width) {
        val px = src.getRGB(x, y)
        val r = (px shr 16) and 0xFF
        val g = (px shr 8)  and 0xFF
        val b =  px         and 0xFF
        out.setRGB(x, y, if (r > 235 && g > 235 && b > 235) 0x00FFFFFF else (0xFF shl 24) or (px and 0xFFFFFF))
    }
}

ImageIO.write(out, "PNG", File(output))
println("Saved: $output")
