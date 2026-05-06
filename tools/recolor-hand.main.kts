#!/usr/bin/env kotlin
/**
 * recolor-hand — remap BM hand crop skin tone to WM/AF and remove white background
 *
 * Prerequisites — produce the hand crop with sips (Y before X in --cropOffset):
 *   sips game/web/assets/characters/governor-bm/sheet.png \
 *     --cropOffset 367 870 -c 183 167 --out /tmp/bm-hand-crop.png
 *
 * Outputs to ~/Downloads/: hand-wm.png, hand-af.png, hand-bm.png (ref, no recolor)
 * BM skin reference: sampled at crop(60,80) = #A16549
 * WM target: #F9BA8E (sampled from governor-wm sheet at 220,180)
 * AF target: #FFC5A5 (sampled from governor-af sheet at 220,140)
 *
 * To adjust targets, edit the three recolor() calls at the bottom.
 */

import java.awt.image.BufferedImage
import java.io.File
import javax.imageio.ImageIO

// BM source skin sampled at hand(60,80)
val bmR = 161; val bmG = 101; val bmB = 73

// For a pixel that is alpha*BM_skin + (1-alpha)*white:
//   alpha_c = (255 - pixel_c) / (255 - bm_c)
// If all three channel-alphas are consistent (low spread) and in [0,1],
// the pixel is a skin-white blend — remap to target skin at that alpha.
// Otherwise fall through to min-channel white-matte removal for outlines/other.

fun processPixel(px: Int, targetR: Int, targetG: Int, targetB: Int): Int {
    val r = (px shr 16) and 0xFF
    val g = (px shr 8)  and 0xFF
    val b =  px         and 0xFF

    // Hard white → transparent
    if (r > 235 && g > 235 && b > 235) return 0x00000000

    // Skin-white blend detection
    val aR = (255.0 - r) / (255.0 - bmR)   // div by 94
    val aG = (255.0 - g) / (255.0 - bmG)   // div by 154
    val aB = (255.0 - b) / (255.0 - bmB)   // div by 182
    val inRange = aR in -0.05..1.15 && aG in -0.05..1.15 && aB in -0.05..1.15
    val spread  = if (inRange) maxOf(aR, aG, aB) - minOf(aR, aG, aB) else 1.0
    if (inRange && spread < 0.30) {
        val alpha = ((aR + aG + aB) / 3.0).coerceIn(0.0, 1.0)
        if (alpha < 0.02) return 0x00000000
        val a8 = (alpha * 255).toInt().coerceIn(0, 255)
        return (a8 shl 24) or (targetR shl 16) or (targetG shl 8) or targetB
    }

    // Non-skin pixels (outlines, suit, sleeve): remove white matte via min-channel
    val minCh = minOf(r, g, b)
    val alpha  = 1.0 - minCh / 255.0
    if (alpha < 0.02) return 0x00000000
    val a8 = (alpha * 255).toInt().coerceIn(0, 255)
    val uR = ((r - (1.0 - alpha) * 255) / alpha).toInt().coerceIn(0, 255)
    val uG = ((g - (1.0 - alpha) * 255) / alpha).toInt().coerceIn(0, 255)
    val uB = ((b - (1.0 - alpha) * 255) / alpha).toInt().coerceIn(0, 255)
    return (a8 shl 24) or (uR shl 16) or (uG shl 8) or uB
}

fun recolor(src: BufferedImage, targetR: Int, targetG: Int, targetB: Int): BufferedImage {
    val out = BufferedImage(src.width, src.height, BufferedImage.TYPE_INT_ARGB)
    for (y in 0 until src.height) {
        for (x in 0 until src.width) {
            out.setRGB(x, y, processPixel(src.getRGB(x, y), targetR, targetG, targetB))
        }
    }
    return out
}

val src = ImageIO.read(File("/tmp/bm-hand-crop.png"))
val home = System.getProperty("user.home")

// WM skin: #F9BA8E
recolor(src, 249, 186, 142).also { ImageIO.write(it, "PNG", File("$home/Downloads/hand-wm.png")) }
println("Saved: ~/Downloads/hand-wm.png")

// AF skin: #FFC5A5
recolor(src, 255, 197, 165).also { ImageIO.write(it, "PNG", File("$home/Downloads/hand-af.png")) }
println("Saved: ~/Downloads/hand-af.png")

// BM original skin (transparency only, for reference)
recolor(src, bmR, bmG, bmB).also { ImageIO.write(it, "PNG", File("$home/Downloads/hand-bm.png")) }
println("Saved: ~/Downloads/hand-bm.png")
