# Generation Log: party

## Stamped version
group-v6

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)

## Style reference
`/tmp/redistricting-style.md` — match reference character style
Reference image: `game/web/assets/characters/governor-wm/sheet.png`

## Character brief
Three party operatives as a group cluster, waist-up, legs hidden by a fluttering magenta
(#FF00FF) rally banner reading "PARTY" in white block letters with black outline.
- Left: white male, navy suit, magenta tie, dark hair
- Center: dark brown skin male, charcoal blazer, campaign sign (magenta border), magenta pennant pin
- Right: white female, burgundy blazer, bright red hair, magenta ribbon pin

Three poses: neutral (sign upright), approve (sign raised, fist pumps), disapprove (sign drooping, slumped).

## Known issues
- Some mouth expressions are inconsistent between panels — needs manual post-edit.
- Sign holder shifts slightly between panels (WM vs BM). Minor — acceptable at game scale.

## Iteration history
- group-v1: Three characters but label text at bottom, wrong demographics (all dark-haired white people).
- group-v2: Fixed demographics and pennant. Prompt too long on first try.
- group-v3: Position anchoring improved but still generating pairs, not trios.
- group-v4: Row layout framing — still only rendering 2 per panel.
- group-v5: Added flat PARTY banner — finally got all 3 per panel consistently.
- group-v6 (stamped): Fluttering banner looks great. 3 per panel. Expressions improved. Mouths need manual fix.

## Reference images
Individual operatives (pre-group, great quality) saved in `party-ref/`:
- `party-ref/party-wm-ref.png` — white male with phone
- `party-ref/party-bf-ref.png` — black female with sign
- `party-ref/party-wf-ref.png` — white female with phone

## Spec file
`/tmp/redistricting-party-group-v6.json`
