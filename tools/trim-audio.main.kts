#!/usr/bin/env kotlin
/**
 * Trims an audio file to a specified duration and writes AIFF output.
 * Uses javax.sound.sampled — no external dependencies required.
 *
 * Usage: trim-audio.main.kts <input.aiff> <output.aiff> <duration_seconds>
 *
 * Input must be AIFF or WAV (PCM). For MP3 input, first convert to AIFF via
 * avconvert or ffmpeg, then trim. Output is always AIFF PCM_SIGNED 16-bit.
 * Convert to MP3/OGG downstream with ffmpeg.
 */
import javax.sound.sampled.*
import java.io.File

if (args.size < 3) {
    System.err.println("Usage: trim-audio.main.kts <input.aiff> <output.aiff> <duration_seconds>")
    System.exit(1)
}

val input = File(args[0])
val output = File(args[1])
val durationSec = args[2].toDouble()

val raw = AudioSystem.getAudioInputStream(input)
val targetFormat = AudioFormat(
    AudioFormat.Encoding.PCM_SIGNED,
    raw.format.sampleRate,
    16,
    raw.format.channels,
    raw.format.channels * 2,
    raw.format.sampleRate,
    false
)
val pcm = AudioSystem.getAudioInputStream(targetFormat, raw)

val framesToRead = (durationSec * targetFormat.sampleRate).toLong()
val bytesPerFrame = targetFormat.frameSize.toLong()
val totalBytes = (framesToRead * bytesPerFrame).toInt()

val buf = ByteArray(totalBytes)
var bytesRead = 0
while (bytesRead < totalBytes) {
    val n = pcm.read(buf, bytesRead, totalBytes - bytesRead)
    if (n < 0) break
    bytesRead += n
}
pcm.close()

val framesRead = bytesRead.toLong() / bytesPerFrame
val outStream = AudioInputStream(buf.inputStream(), targetFormat, framesRead)
AudioSystem.write(outStream, AudioFileFormat.Type.AIFF, output)

val actualSec = framesRead.toDouble() / targetFormat.sampleRate
println("Trimmed: ${input.name} → ${output.name}  (${String.format("%.3f", actualSec)}s, $bytesRead bytes)")
