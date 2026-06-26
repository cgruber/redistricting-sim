#!/usr/bin/env kotlin
/**
 * show-seed-points.main.kts — overlay crosshair markers on a PNG at given coordinates.
 *
 * Usage: show-seed-points.main.kts <input.png> <output.png> x1,y1 [x2,y2 ...]
 *
 * Each marker is an orange crosshair + circle with a label showing coordinates
 * and the original pixel's RGB value.
 */
import java.awt.BasicStroke
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val input  = args.getOrNull(0) ?: error("Usage: show-seed-points.main.kts <input.png> <output.png> x1,y1 ...")
val output = args.getOrNull(1) ?: error("Usage: show-seed-points.main.kts <input.png> <output.png> x1,y1 ...")

val points = args.drop(2).map { s ->
    val parts = s.split(",")
    require(parts.size == 2) { "Expected x,y — got: $s" }
    parts[0].toInt() to parts[1].toInt()
}

val src = ImageIO.read(File(input)) ?: error("Cannot read image: $input")
val out = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)
val g   = out.createGraphics()
g.drawImage(src, 0, 0, null)

for ((x, y) in points) {
    val px = src.getRGB(x, y)
    val r  = (px shr 16) and 0xFF
    val gv = (px shr 8)  and 0xFF
    val b  =  px         and 0xFF
    g.color  = Color(255, 80, 0, 220)
    g.stroke = BasicStroke(4f)
    g.drawLine(x - 50, y, x + 50, y)
    g.drawLine(x, y - 50, x, y + 50)
    g.drawOval(x - 20, y - 20, 40, 40)
    g.color = Color(255, 80, 0, 255)
    g.font  = g.font.deriveFont(20f)
    g.drawString("($x,$y) rgb($r,$gv,$b)", x + 24, y + 8)
}

g.dispose()
ImageIO.write(out, "PNG", File(output))
println("Written ${points.size} seed points → $output")
