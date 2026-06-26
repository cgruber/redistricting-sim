# Generation Log: judge-lm

## Stamped version
v4

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)

## Style reference
`/tmp/redistricting-style.md` — match reference character style
Reference image: `game/web/assets/characters/governor-wm/sheet.png`

## Character brief
Latino male federal judge. Full black judicial robes, white collar band. Seated behind
a raised dark wooden bench. Dark hair with greying at the temples, slightly receding —
short professional cut. Warm medium tan skin tone (#c8956c). Male facial features.
Three poses: neutral (gavel resting on bench, left hand relaxed open on bench),
approve (gavel struck down, "APPROVED!" green stamp overlay),
disapprove (gavel struck down, "DENIED!" red stamp overlay).

## Known issues
None.

## Iteration history
- lm-v1: Good proportions, but approve expression too aggressive. Legs bleeding through bench.
- lm-v2: Solid bench (no leg bleed). Left hand fist issue resolved. Skin went yellow-green.
- lm-v3: Same prompt retry — skin still yellow-green.
- lm-v4 (stamped): Explicit skin tone hex (#c8956c) fixed the green. Correct expressions and bench.

## Spec file
`/tmp/redistricting-judge-lm-v4.json`
