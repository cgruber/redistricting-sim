#!/usr/bin/env kotlin
import java.awt.BasicStroke
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

val assetsDir = File(args.getOrElse(0) { "game/web/assets/characters" })
val outDir = File(args.getOrElse(1) { "/tmp/cutline-guides" })
outDir.mkdirs()

val sheets = assetsDir.listFiles()!!
    .filter { it.isDirectory }
    .mapNotNull { dir -> File(dir, "sheet.png").takeIf { it.exists() }?.let { dir.name to it } }
    .sortedBy { it.first }

for ((name, file) in sheets) {
    val img = ImageIO.read(file)
    val w = img.width
    val h = img.height
    val out = BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB)
    val g = out.createGraphics()
    g.drawImage(img, 0, 0, null)

    g.color = Color(255, 0, 0, 180)
    g.stroke = BasicStroke(3f)
    g.drawLine(w / 3, 0, w / 3, h)
    g.drawLine(2 * w / 3, 0, 2 * w / 3, h)

    g.color = Color(255, 0, 0, 220)
    g.font = g.font.deriveFont(20f)
    g.drawString("CUT", w / 3 - 30, 24)
    g.drawString("CUT", 2 * w / 3 - 30, 24)
    g.drawString("${w}x${h}  cuts at ${w/3} and ${2*w/3}", 8, h - 8)

    g.dispose()
    val outFile = File(outDir, "$name-cutlines.png")
    ImageIO.write(out, "PNG", outFile)
    println("$name: ${w}x${h}  cuts at ${w/3} / ${2*w/3}  → ${outFile.name}")
}
println("\nAll guides written to ${outDir.absolutePath}")
