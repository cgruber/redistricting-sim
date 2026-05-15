# Generation Log: legislator-wm

## Stamped version
v7

## Provider / model
- Generation: Grok (`grok-imagine-image` via `gen-assets.main.kts images`)

## Style reference
`/tmp/redistricting-style.md` — match reference character style
Reference image: `game/web/assets/characters/governor-wm/sheet.png`

## Character brief
White male state legislator. Dark charcoal suit, red tie, gold lapel badge. Older man —
late 60s, grey receding hair, jowls, age lines. Holds a rolled parchment scroll (red ribbon).
Three poses: neutral (scroll at side), approve (thumbs up, scroll at side),
disapprove (thumbs down, scroll at side).

## Known issues
- Thumbs-down thumb geometry is slightly imperfect — may benefit from manual post-edit.

## Iteration history
- wm-v1: Good style match but too young, scroll doubles in neutral, disapprove mirrored.
- wm-v2: Aged up correctly, scroll still hanging in disapprove (folded arms pose).
- wm-v3: Switched to thumbs down. Mirrored disapprove and double-scroll returned.
- wm-v4: Fixed mirroring and double-scroll. Thumbs-down thumb pointing through fist center.
- wm-v5: Explicit thumb geometry — scroll dropped from right hand in disapprove.
- wm-v6: Back to v4 base — character grew too large, out of bounds.
- wm-v7 (stamped): v4 base with targeted thumbs-down fix. Best achievable — thumb reads clearly downward.

## Spec file
`/tmp/redistricting-legislator-wm-v7.json`
