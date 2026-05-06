---
date: 2026-05-05
researcher: cgruber + claude-sonnet-4-6
git_commit: 25ee38aceb1f
branch: governor-character-sheets
repository: redistricting-sim
topic: AI character art generation — prompting patterns, provider specialization, surgical editing limits
tags: [gen-assets, grok, gemini, character-art, image-generation, image-editing, skin-tone, compositing]
status: active
last_updated: 2026-05-05
last_updated_by: claude-sonnet-4-6
---

# Character Art Generation Learnings

Accumulated from generating governor-wm, governor-bm, and governor-af.
Intended as a living reference for future character types (instigators, brokers, etc.).

---

## Provider Specialization

| Task | Provider | Notes |
|---|---|---|
| Initial generation | Grok (`grok-2-image`) | Reliable style consistency; follows style spec well |
| Editing / fixing | Grok (`grok-2-image`) | Works for broad pose changes; unreliable for surgical fixes |
| Image description / analysis | Gemini (`gemini-2.5-flash`) | Good for analyzing reference images |
| Image editing | Gemini (`gemini-2.5-flash-image`) | **Avoid** — rewrites the entire image including faces |

**Key insight**: Both Grok and Gemini edit APIs do guided regeneration, NOT true inpainting.
The model re-generates the whole image informed by your instruction. This means:
- Faces can change between edit passes
- You cannot reliably fix one element without risking others
- Multiple edit passes compound degradation risk

---

## Generation Strategy

### Character sheet approach (all poses in one generation)
Generate all poses (neutral / approve / disapprove) as a single sheet rather than separately.
This ensures style, proportions, skin tone, and clothing are consistent across poses.
Single-pose generations stitched together look off even with identical prompts.

### Iterative editing ceiling
Beyond 2–3 edit passes, quality degrades. Track versions monotonically (WM-1, WM-2, WM-3).
Stop and stamp the best result; don't chase perfection through endless edits.
AF hit AF-6 before we accepted AF-3 as the base — earlier stamping would have saved time.

### Demographic naming
All character type IDs use explicit demographic suffixes: `governor-wm`, `governor-bm`, `governor-af`.
Never use a bare name as a default demographic (no `governor` → `governor-wm`).

---

## Prompting Patterns

### What works for Grok generation
- Reference `tools/image-style-spec.md` as the baseline — paste it in full, don't summarize.
- Specify character sheet layout explicitly: "three poses on a single horizontal sheet."
- Name each pose and its gesture: "neutral (arms at sides), approving (thumbs-up), disapproving (thumbs-down)."
- Describe clothing, accessories, and demographic characteristics concretely.

### What works for Grok editing
- Use `--instruction-file` flag — never shell `$()` substitution for multi-line prompts.
- Be explicit about what NOT to change: "Keep everything else identical: face, hair, body, clothing, all other poses."
- For hand/gesture fixes, describe orientation in physical terms:
  - **Works**: "knuckles facing viewer, thumb pointing down on the left side of the fist, back of hand visible"
  - **Doesn't work**: "fix the thumbs-down" or "rotate the hand"
  - **Works for some**: "rotated 180 degrees along the axis of the wrist from the thumbs-up gesture"
- Include skin tone instruction if doing any hand/arm edit: "The hand must take on the skin tone of the character."

### What doesn't work
- "Fix [element]" without explicit physical description — model returns near-identical image.
- Passing the full character sheet as a reference image for multi-image edits — causes face blending between characters.
- Gemini edit for any surgical fix — rewrites the whole image.

---

## Reference Images for Multi-Image Edits

Grok supports `--reference-image` in the edit subcommand.
If using a reference to guide a specific element:
- **Crop to only the relevant region** — no face, no other character elements.
- The model merges visual elements from all input images; a full sheet reference will blend characters.
- A clean hand crop (arm + hand + sleeve only, white background stripped) is the right unit.

Crop procedure (macOS `sips`):
```
sips <sheet.png> --cropOffset <Y> <X> -c <H> <W> --out <crop.png>
# Note: sips takes Y (height offset) before X (width offset) — opposite of intuition
```

---

## Surgical Fixes: Programmatic vs Manual

When AI editing cannot reliably fix a single element:

### Programmatic compositing (Java AWT / Kotlin)
Paste a correct element from one variant onto another, recoloring skin pixels.
**Limitation**: arm proportions and angles differ between demographic variants even at the same
sheet coordinates — pasted hands look misaligned.
**When useful**: background removal, skin tone swatching, generating reference crops.

**Skin-white blend detection** (for proper alpha matting):
Don't use min-channel alpha estimation for colored skin pixels — it gives wrong results.
Instead, solve for alpha per channel assuming `pixel = alpha * skin + (1-alpha) * white`:
```
alpha_c = (255 - pixel_c) / (255 - skin_c)
```
If all three channel alphas are consistent (spread < 0.3) and in [0, 1], the pixel is a
skin-white blend — remap to target skin at the computed alpha.
For non-skin pixels (outlines, suit), fall back to min-channel un-premultiplication.

### Manual editing (Photopea)
For surgical fixes where AI and programmatic approaches both fail:
1. Open the sheet; unlock the layer (right-click → Layer from Background).
2. Load the reference hand as a second layer (use `tools/make-transparent.main.kts` first).
3. Use Free Transform (Cmd+T) to position and rotate.
4. Use Eraser (E) + `[` / `]` for brush size to clean up edges.
5. Use Eyedropper (I) to sample character skin tone before painting.
6. Layer → Matting → Defringe (1–2px) to clean edge halos.
7. Export as PNG, copy to repo.

**Key Photopea shortcut summary**: E=eraser, I=eyedropper, Cmd+T=free transform,
`[`/`]`=brush size, right-click canvas=brush size slider.

---

## Tooling Built This Session

| Script | Location | Purpose |
|---|---|---|
| `gen-assets.main.kts edit` | `tools/` | Image-to-image editing via Grok or Gemini |
| `gen-assets.main.kts describe` | `tools/` | Analyze reference images via Gemini vision |
| `composite-hand.main.kts` | `tools/` | Paste + recolor a hand crop onto a character sheet |
| `make-transparent.main.kts` | `tools/` | Remove white background, output ARGB PNG |
| `recolor-hand.main.kts` | `tools/` | Skin-tone remap with proper alpha matting |

---

## Open Questions / Future Work

- Is there a free or low-cost mask-based inpainting API (e.g. Stability AI) that does true inpainting?
  True inpainting would fix the surgical editing limitation and avoid needing Photopea for every variant.
- Can we establish a "canonical hand crop" per gesture that can be programmatically composited
  more reliably if we normalize arm angle and scale first?
- Should the character sheet spec evolve to request the hand in a position that's easier to correct
  (e.g., arm extended rather than bent at the elbow)?
