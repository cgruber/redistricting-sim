<!--COMPRESSED v1; source:2026-05-05-character-art-generation-learnings.md-->
§META
date:2026-05-05 researcher:cgruber+claude-sonnet-4-6 commit:25ee38aceb1f
branch:governor-character-sheets repo:redistricting-sim
topic:AI character art — prompting patterns, provider specialization, surgical editing limits
tags:gen-assets,grok,gemini,character-art,image-generation,image-editing,skin-tone,compositing
status:active last_updated:2026-05-05

§ABBREV
ga=gen-assets.main.kts grok=grok-2-image gem=gemini-2.5-flash

§PROVIDERS
| Task | Provider | Notes |
|---|---|---|
| Generation | Grok | reliable style; follows spec |
| Editing | Grok | broad changes ok; surgical unreliable |
| Description/analysis | Gemini | good for analyzing refs |
| Image editing | Gemini | AVOID — rewrites entire image incl faces |
Both APIs: guided regeneration NOT true inpainting; faces can change per pass; passes compound degradation

§GENERATION_STRATEGY
character-sheet: all poses in one generation → style/skin/clothing consistency; single poses stitched = inconsistent
version ceiling: stamp best result by v2-v3; each pass risks degradation; track monotonically (WM-1,WM-2,WM-3)
demographic naming: always explicit suffix (governor-wm, not governor); no default demographic

§PROMPTING
generation (Grok):
  paste full tools/image-style-spec.md; don't summarize
  "three poses on single horizontal sheet: neutral(arms at sides), approving(thumbs-up), disapproving(thumbs-down)"
  name clothing+accessories+demographic concretely

editing (Grok):
  use --instruction-file; never $() substitution
  lock non-targets: "Keep everything else identical: face, hair, body, clothing, all other poses"
  hand orientation → physical terms:
    works: "knuckles facing viewer, thumb pointing down on left side of fist, back of hand visible"
    works sometimes: "rotated 180° along wrist axis from thumbs-up"
    fails: "fix the thumbs-down" | "rotate the hand"
  include skin note if editing arm/hand: "hand must take on the skin tone of the character"

don't work:
  vague fix instructions → near-identical output
  full sheet as reference image → face blending between characters
  Gemini edit for any surgical fix

§REFERENCE_IMAGES
multi-image Grok edit: crop to relevant region only (no face, no other character)
full-sheet reference → blends characters; hand-only crop = correct unit
sips crop: --cropOffset Y X -c H W [Y before X — counterintuitive]

§SURGICAL_FIXES
programmatic (Java AWT): paste+recolor from another variant
  limitation: arm proportions differ between variants → misalignment
  useful for: bg removal, skin swatch, reference crop generation

skin-white blend alpha (correct approach):
  NOT min-channel (wrong for colored pixels)
  per-channel solve: alpha_c = (255 - px_c) / (255 - skin_c)
  if all channel-alphas consistent (spread<0.3, in [0,1]) → skin-white blend → remap at computed alpha
  else → min-channel un-premultiply (works for outlines)

manual (Photopea):
  unlock layer → load ref hand as layer (make-transparent.main.kts first)
  Cmd+T free transform → rotate/position; E eraser; I eyedropper; [/] brush size
  Layer→Matting→Defringe 1-2px for edge halos
  export PNG → copy to repo

§TOOLING
| Script | Purpose |
|---|---|
| $ga edit | image-to-image via Grok or Gemini |
| $ga describe | analyze ref images via Gemini vision |
| tools/composite-hand.main.kts | paste+recolor hand crop onto sheet |
| tools/make-transparent.main.kts | white bg removal → ARGB PNG |
| tools/recolor-hand.main.kts | skin remap with proper alpha matting |

§OPEN_QUESTIONS
mask-based inpainting API (Stability AI?) for true inpainting — would fix surgical editing limit
canonical hand crop per gesture with normalized angle/scale for reliable compositing
character sheet spec: request arm extended vs bent — easier to correct in future edits
