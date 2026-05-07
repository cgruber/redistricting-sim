# Generation Log: governor-bm

## Stamped version
BM-3 — Grok image edit of BM-2

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)
- Editing: Grok (`grok-imagine-image` via `gen-assets.main.kts edit`)

## Style reference
`tools/image-style-spec.md` — Fallout/Vault Boy flat cartoon, bold outlines, cel-shading

## Character brief
Black/brown male governor. Dark suit, tie, US-flag lapel pin. Three poses on one sheet:
neutral (arms at sides), approving (thumbs-up), disapproving (thumbs-down).

## Iteration history
- BM-1: Grok generation from style spec. Correct style, thumbs-down hand backwards.
- BM-2: New generation with v3 spec refinements. Same hand issue.
- BM-3 (stamped): Grok edit of BM-2. Thumbs-down corrected on first edit attempt.
  BM-3's hand used as the reference crop for WM and AF programmatic compositing attempts,
  and as the Photopea reference layer for manual fixes.

## What worked
- First Grok edit pass corrected the hand without degrading other poses.
- BM-3 hand crop (x=870, y=367, 167×183px from sheet) made a clean reference asset.

## What didn't
- Initial crop at x=920, y=330 missed the knuckles — had to shift left and trim top/right.
- Passing the full BM-3 sheet as a multi-image reference to Grok caused face blending into AF edits.
  Fix: crop to hand-only (no face visible) before using as reference.
