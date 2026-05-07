#!/usr/bin/env bash
# Run this script to replace placeholder files with real audio clips.
#
# Prerequisites: curl, ffmpeg (for OGG conversion from downloaded MP3/WAV)
#
# IMPORTANT: Before running, verify the license of each VERIFY-tagged clip
# by visiting the URL in INVENTORY.md. If a clip is CC-BY (not CC0), add
# the attribution to a CREDITS.md file alongside INVENTORY.md.
#
# Usage: bash download-clips.sh
# Run from: game/web/assets/audio/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Downloading audio clips for instigator reaction sounds..."
echo "Note: VERIFY-tagged clips may require license check before use."
echo ""

# ---------------------------------------------------------------------------
# CC0 CONFIRMED CLIPS
# These are confirmed public domain / CC0. No attribution required.
# ---------------------------------------------------------------------------

echo "=== CC0 Confirmed ==="

# reform-arbiter-zero-star: "Buzzer sounds (Wrong answer / Error)" by Breviceps
# Source: https://freesound.org/people/Breviceps/sounds/493163/
# License: CC0 (confirmed)
# Note: Freesound requires a (free) account to download directly; use their API
# or download manually and place as reform-arbiter-zero-star.mp3 / .ogg
echo "reform-arbiter-zero-star: Download manually from:"
echo "  https://freesound.org/people/Breviceps/sounds/493163/"
echo "  Save as: reform-arbiter-zero-star.mp3 and reform-arbiter-zero-star.ogg"
echo ""

# neutral-admin-one-star + bipartisan-broker-zero-star: "Normal click" by Breviceps
# Source: https://freesound.org/people/Breviceps/sounds/448086/
# License: CC0 (confirmed, part of pack 25371)
echo "neutral-admin-one-star + bipartisan-broker-zero-star: Download manually from:"
echo "  https://freesound.org/people/Breviceps/sounds/448086/"
echo "  Save as: neutral-admin-one-star.mp3 + .ogg"
echo "  Copy to: bipartisan-broker-zero-star.mp3 + .ogg"
echo ""

# legal-authority-one-star: "Gavel, 1 blow" by BigSoundBank
# Source: https://bigsoundbank.com/gavel-1-blow-s1588.html
# License: public domain / CC0 equivalent (BigSoundBank release terms)
# BigSoundBank provides direct download links in WAV format
echo "=== Attempting direct download: legal-authority-one-star (gavel) ==="
GAVEL_WAV="/tmp/gavel-1-blow.wav"
curl -L -o "$GAVEL_WAV" \
  "https://bigsoundbank.com/UPLOAD/wav/1588.wav" \
  --fail --silent --show-error || {
    echo "WARNING: Direct download failed. Visit https://bigsoundbank.com/gavel-1-blow-s1588.html"
    echo "  Download manually and convert to MP3+OGG"
  }

if [ -f "$GAVEL_WAV" ] && [ -s "$GAVEL_WAV" ]; then
  echo "Converting gavel WAV to MP3 and OGG..."
  ffmpeg -y -i "$GAVEL_WAV" -t 1.5 -ar 44100 -ac 2 -ab 128k \
    legal-authority-one-star.mp3 2>/dev/null
  ffmpeg -y -i "$GAVEL_WAV" -t 1.5 -ar 44100 -ac 2 -aq 4 \
    legal-authority-one-star.ogg 2>/dev/null
  echo "legal-authority-one-star.mp3 + .ogg written."
  rm -f "$GAVEL_WAV"
fi

echo ""
# ---------------------------------------------------------------------------
# VERIFY-TAGGED CLIPS (check license before using)
# These may be CC-BY 3.0. If so, add attribution to CREDITS.md.
# ---------------------------------------------------------------------------

echo "=== VERIFY-tagged (check license on Freesound page first) ==="
echo ""
echo "partisan-boss-three-star: visit https://freesound.org/people/el_boss/sounds/677858/"
echo "partisan-boss-two-star:   visit https://freesound.org/people/FunWithSound/sounds/456966/"
echo "reform-arbiter-three-star: visit https://freesound.org/people/FunWithSound/sounds/456969/"
echo "reform-arbiter-two-star:  visit https://freesound.org/people/hypocore/sounds/164088/"
echo ""
echo "After verifying license:"
echo "  If CC0: download directly, convert to MP3+OGG, place here."
echo "  If CC-BY: download, convert, add attribution line to CREDITS.md"
echo ""

# ---------------------------------------------------------------------------
# AI-GENERATE SLOTS (11 slots — no CC0 source found)
# ---------------------------------------------------------------------------

echo "=== AI-GENERATE slots (manual step) ==="
echo ""
echo "The following 12 slots require AI audio generation."
echo "Recommended tools: ElevenLabs Sound Effects (https://elevenlabs.io/sound-effects)"
echo "  or Grok Audio, or similar."
echo ""
echo "Slots and prompts:"
echo ""
echo "  partisan-boss-one-star:"
echo "    Prompt: 'flat close enough brass sting, short 2-note unresolved phrase, 0.7 seconds'"
echo ""
echo "  partisan-boss-zero-star:"
echo "    Prompt: 'sad trombone wah wah 4-note descending deflation, 1.2 seconds, game show fail'"
echo ""
echo "  legal-authority-three-star:"
echo "    Prompt: 'formal wooden gavel strike then ascending 2-note bell chime, 1.0 second'"
echo ""
echo "  legal-authority-two-star:"
echo "    Prompt: 'single clear bell chime, measured, warm sustain, 0.6 seconds'"
echo ""
echo "  legal-authority-zero-star:"
echo "    Prompt: 'gavel strike followed by descending 2-note minor tone, austere feel, 1.0 second'"
echo ""
echo "  bipartisan-broker-three-star:"
echo "    Prompt: 'warm celebratory major chord piano strum, bright, reverb, 1.0 second'"
echo ""
echo "  bipartisan-broker-two-star:"
echo "    Prompt: 'mild positive piano major chord, lighter velocity, 0.7 seconds'"
echo ""
echo "  bipartisan-broker-one-star:"
echo "    Prompt: 'subdued uncertain piano suspended chord, minor or sus2, muted, 0.7 seconds'"
echo ""
echo "  reform-arbiter-one-star:"
echo "    Prompt: 'quiet acknowledgment marimba single note, brief sustain, 0.5 seconds'"
echo ""
echo "  neutral-admin-three-star:"
echo "    Prompt: 'warm affirming bell ding, bright fundamental, short decay, 0.5 seconds'"
echo ""
echo "  neutral-admin-two-star:"
echo "    Prompt: 'soft approving wood-block click, light, 0.3 seconds'"
echo ""
echo "  neutral-admin-zero-star:"
echo "    Prompt: 'flat dull click, no musical character, brief, 0.3 seconds'"
echo ""
echo "After generating each clip:"
echo "  1. Trim to target duration with ffmpeg or Audacity"
echo "  2. Export as MP3 (128 kbps) and OGG (quality 4)"
echo "  3. Place in this directory with the correct filename"
echo ""
echo "Done. Remaining placeholder files are zero-byte stubs."
