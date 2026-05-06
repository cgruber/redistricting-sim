# Generation Log: governor-wm

## Stamped version
WM-3 — Grok image edit of WM-2

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)
- Editing: Grok (`grok-imagine-image` via `gen-assets.main.kts edit`)

## Style reference
`tools/image-style-spec.md` — Fallout/Vault Boy flat cartoon, bold outlines, cel-shading

## Character brief
White male governor. Dark suit, tie, US-flag lapel pin. Three poses on one sheet:
neutral (arms at sides), approving (thumbs-up), disapproving (thumbs-down).

## Iteration history
- WM-1: Grok generation from style spec. Correct style, thumbs-down hand backwards (thumb on wrong side).
- WM-2: New generation with v3 spec refinements. Same hand issue.
- WM-3 (stamped): Grok edit of WM-2 with explicit hand orientation language. Thumbs-down partially corrected via Grok edit; final hand anatomy fixed manually in Photopea using BM-3 hand crop as reference layer.

## Effective edit prompt (WM-3)
See `tools/image-style-spec.md` base, plus: three-pose character sheet layout;
thumbs-down described as "knuckles facing viewer, thumb pointing down on the left side
of the fist, back of hand visible — NOT a thumbs-up rotated, a distinct downward gesture."

## What worked
- All-three-poses-in-one-sheet generation ensures style consistency across poses.
- Explicit knuckle/thumb direction language in Grok edit prompts.
- Photopea final touch with transparent-background reference layer for precision.

## What didn't
- First edit passes without explicit orientation language returned near-identical images.
- Gemini edit rewrote the face and changed expression — abandoned for editing tasks.
