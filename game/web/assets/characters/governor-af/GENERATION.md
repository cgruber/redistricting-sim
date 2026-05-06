# Generation Log: governor-af

## Stamped version
AF-3 — first Grok image edit of AF-2

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)
- Editing: Grok (`grok-imagine-image` via `gen-assets.main.kts edit`)

## Style reference
`tools/image-style-spec.md` — Fallout/Vault Boy flat cartoon, bold outlines, cel-shading

## Character brief
Asian female governor. Dark suit, tie, US-flag lapel pin. Three poses on one sheet:
neutral (arms at sides), approving (thumbs-up), disapproving (thumbs-down).

## Iteration history
- AF-1: Grok generation from style spec. Correct style, thumbs-down hand backwards.
- AF-2: New generation with v3 spec refinements. Same hand issue.
- AF-3 (stamped): First Grok edit of AF-2 — minimal change but cleanest result.
- AF-4: Full regen attempt. Thumbs-down still wrong, thumbs-up degraded to 3 fingers.
- AF-5, AF-6: Further edit attempts with rotational framing language and BM reference image.
  All corrupted the thumbs-up or returned near-identical images. Abandoned.
- Final (stamped): AF-3 base with hand anatomy corrected in Photopea using `hand-af.png`
  (BM-3 hand crop, skin-remapped to AF tone, alpha-matted via `tools/recolor-hand.main.kts`).

## Effective prompt iterations (thumbsdown)
- v1–v4: Generic "fix the thumbs-down hand" — no meaningful change from model.
- v5: "Rotate 180 degrees along the wrist axis from the thumbs-up" — worked for WM, not AF.
- v6: Added "hand should take on the skin tone of the character" — no improvement.
- v7: Used cropped BM-3 hand as `--reference-image` — model blended postures, not useful.

## What worked
- Keeping AF-3 as base despite imperfect hand — later edits only made things worse.
- Programmatic skin remapping (per-channel alpha estimation) produced usable `hand-af.png`.
- Photopea: eyedropper + eraser + free transform for precise manual placement.

## What didn't
- Gemini edit changed the face entirely — abandoned immediately.
- Grok multi-image edit with full BM sheet caused character face blending.
- Flat pixel-paste compositing (Java AWT) looked off due to arm-size variance between variants.
- Six edit iterations could not reliably fix a single hand without corrupting other poses.
  Conclusion: AI text-prompted editing cannot do surgical per-pixel fixes on this art style.
