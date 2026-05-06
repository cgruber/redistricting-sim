#!/usr/bin/env kotlin
/**
 * composite-hand — paste a recoloured hand crop onto a character sheet
 *
 * NOTE: This script was developed during the governor character art session but was NOT used
 * for the final shipped assets — arm-size and angle variance between demographic variants made
 * flat pixel-paste compositing look misaligned. Manual Photopea editing was used instead.
 * Kept as reference tooling; may be useful if arm posture is normalized across variants.
 *
 * Usage:
 *   composite-hand.main.kts -- \
 *     --sheet   /path/to/sheet.png        (sheet to fix)
 *     --hand    /tmp/bm-hand-crop.png     (correct hand crop)
 *     --output  /tmp/out/sheet.png
 *     --x       920                       (paste left edge in sheet coords)
 *     --y       330                       (paste top edge in sheet coords)
 *     --skin-x-hand  80                   (x in hand crop to sample BM skin)
 *     --skin-y-hand  150                  (y in hand crop to sample BM skin)
 *     --skin-x-sheet 180                  (x in sheet to sample AF skin)
 *     --skin-y-sheet 130                  (y in sheet to sample AF skin)
 *     --threshold    80.0                 (colour-distance threshold for skin remap)
 *     --sample-only                       (print sampled colours and exit; no output written)
 */

import java.awt.AlphaComposite
import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO
import kotlin.math.sqrt

fun rgb(px: Int) = Triple((px shr 16) and 0xFF, (px shr 8) and 0xFF, px and 0xFF)
fun brightness(px: Int): Double { val (r,g,b) = rgb(px); return 0.299*r + 0.587*g + 0.114*b }
fun dist(a: Int, b: Int): Double {
    val (r1,g1,b1) = rgb(a); val (r2,g2,b2) = rgb(b)
    val dr=(r1-r2).toDouble(); val dg=(g1-g2).toDouble(); val db=(b1-b2).toDouble()
    return sqrt(dr*dr+dg*dg+db*db)
}

// --- arg parsing ---
val argMap = mutableMapOf<String, String>()
var i = 0
while (i < args.size) {
    if (args[i].startsWith("--") && i+1 < args.size && !args[i+1].startsWith("--")) {
        argMap[args[i].removePrefix("--")] = args[i+1]; i += 2
    } else { if (args[i].startsWith("--")) argMap[args[i].removePrefix("--")] = "true"; i++ }
}

val sheetPath    = argMap["sheet"]   ?: error("--sheet required")
val handPath     = argMap["hand"]    ?: error("--hand required")
val outputPath   = argMap["output"]  ?: "/tmp/composite-out/sheet.png"
val pasteX       = argMap["x"]?.toInt()            ?: 920
val pasteY       = argMap["y"]?.toInt()            ?: 330
val skinXHand    = argMap["skin-x-hand"]?.toInt()  ?: 80
val skinYHand    = argMap["skin-y-hand"]?.toInt()  ?: 150
val skinXSheet   = argMap["skin-x-sheet"]?.toInt() ?: 180
val skinYSheet   = argMap["skin-y-sheet"]?.toInt() ?: 130
val threshold    = argMap["threshold"]?.toDouble() ?: 80.0
val sampleOnly   = argMap["sample-only"] == "true"

val sheet = ImageIO.read(File(sheetPath))
val hand  = ImageIO.read(File(handPath))

// --- sample skin tones ---
val bmSkin = hand.getRGB(skinXHand, skinYHand)
val afSkin = sheet.getRGB(skinXSheet, skinYSheet)
val (bmR,bmG,bmB) = rgb(bmSkin)
val (afR,afG,afB) = rgb(afSkin)
println("BM skin @ hand($skinXHand,$skinYHand): #${"%06X".format(bmSkin and 0xFFFFFF)} r=$bmR g=$bmG b=$bmB  brightness=${"%.1f".format(brightness(bmSkin))}")
println("AF skin @ sheet($skinXSheet,$skinYSheet): #${"%06X".format(afSkin and 0xFFFFFF)} r=$afR g=$afG b=$afB  brightness=${"%.1f".format(brightness(afSkin))}")
println("Hand crop size: ${hand.width}×${hand.height}  Paste at: ($pasteX, $pasteY)")
if (sampleOnly) { println("--sample-only: exiting."); System.exit(0) }

// --- remap hand crop colours ---
val remapped = BufferedImage(hand.width, hand.height, BufferedImage.TYPE_INT_ARGB)
val bmBright = brightness(bmSkin)
for (y in 0 until hand.height) {
    for (x in 0 until hand.width) {
        val px = hand.getRGB(x, y)
        val (r,g,b) = rgb(px)
        val bright = brightness(px)
        val newPx: Int = when {
            // Near-white background → transparent
            r > 235 && g > 235 && b > 235 -> 0x00FFFFFF
            // Very dark outline → keep, fully opaque
            bright < 45 -> (0xFF shl 24) or (px and 0xFFFFFF)
            // Skin-like colour → remap proportionally to AF skin
            dist(px, bmSkin) < threshold -> {
                val ratio = if (bmBright > 0) bright / bmBright else 1.0
                val nr = (afR * ratio).toInt().coerceIn(0, 255)
                val ng = (afG * ratio).toInt().coerceIn(0, 255)
                val nb = (afB * ratio).toInt().coerceIn(0, 255)
                (0xFF shl 24) or (nr shl 16) or (ng shl 8) or nb
            }
            // Everything else (suit, sleeve) → keep, fully opaque
            else -> (0xFF shl 24) or (px and 0xFFFFFF)
        }
        remapped.setRGB(x, y, newPx)
    }
}

// --- composite onto sheet ---
val out = BufferedImage(sheet.width, sheet.height, BufferedImage.TYPE_INT_ARGB)
val g2d = out.createGraphics()
g2d.drawImage(sheet, 0, 0, null)
g2d.composite = AlphaComposite.getInstance(AlphaComposite.SRC_OVER)
g2d.drawImage(remapped, pasteX, pasteY, null)
g2d.dispose()

File(outputPath).parentFile?.mkdirs()
ImageIO.write(out, "PNG", File(outputPath))
println("Saved: $outputPath")
