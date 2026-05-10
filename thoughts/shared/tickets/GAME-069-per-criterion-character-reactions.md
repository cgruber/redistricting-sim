---
id: GAME-069
title: Per-criterion character reactions on result screen
area: game
status: resolved
created: 2026-05-07
---

## Summary

Replace the single top-level instigator sprite on the result screen with per-criterion character reactions. Each criterion row shows a small character slot that starts neutral (during CHECKING) and cross-fades to approve or disapprove on verdict reveal. The governor sprite is wired up immediately at row scale; all other character types use a checkbox placeholder until DESIGN-011 delivers their sprites.

## Design

Each criterion in a scenario definition gains a `character` field. The scenario itself declares `instigator_character` (the roster type that plays the instigator role in this scenario). At render time, `character: "instigator"` resolves through `instigator_character`.

### Schema additions

**Scenario level:**
```json
{
  "instigator_character": "party"
}
```

**Per criterion:**
```json
{
  "id": "dem-seats-3",
  "type": "partisan:dem-seats",
  "character": "instigator",
  "party_id": "party_a"
}
```

`party_id` is only required when `character` (resolved) is `"party"` — it selects the party palette for skinning.

### Character types

| Key | Sprite | Placeholder until sprite ready |
|---|---|---|
| `governor` | `character-governor.png` — **wire up now** | — |
| `commissioner` | `character-commissioner.png` | Checkbox placeholder |
| `party` | `character-party.png` (color-skinned) | Checkbox placeholder |
| `judge` | `character-judge.png` | Checkbox placeholder |
| `legislator` | `character-legislator.png` | Checkbox placeholder |

### Placeholder visual

When no sprite is available for a character type, render a fixed-size box (same dimensions as the row-scale character slot):
- Neutral: empty checkbox outline (muted border, no fill)
- Approve: checkbox with green checkmark (✓)
- Disapprove: checkbox with red X

SVG inline; transitions the same way sprites do (opacity cross-fade neutral → verdict).

### Row-scale sizing

Characters at row scale should be noticeably smaller than the current top-level sprite (200px tall). Target ~64px tall. The governor sprite sheet uses CSS `background-size` / `background-position` for pose selection — same approach applies at row scale.

### Top-level instigator

Remove the `#result-reaction` top-level character block. All character feedback is per-row. The verdict header (`#result-verdict`, `#result-subtitle`) remains.

## Acceptance Criteria

- [ ] `Scenario` type gains `instigator_character: CharacterType` field
- [ ] `SuccessCriterion` type gains `character: CharacterType | "instigator"` field and optional `party_id` field
- [ ] All existing scenario JSON files updated with `instigator_character` and per-criterion `character` assignments
- [ ] Governor sprite renders correctly at row scale (64px tall, correct pose offsets)
- [ ] All non-governor character types render the checkbox placeholder (neutral/approve/disapprove states)
- [ ] Placeholder cross-fades on the same timing as the governor sprite (opacity transition, same as GAME-066)
- [ ] Top-level `#result-reaction` instigator block removed
- [ ] `prefers-reduced-motion` fast path works correctly with per-row characters
- [ ] E2E tests cover: governor sprite at row scale present; placeholder present for non-governor type; verdict states correct
- [ ] No regressions in existing result screen / reveal timing tests

## References

- DESIGN-011 — character roster and sprite design (blocks replacing placeholders with real sprites)
- GAME-060 — character sprite assets
- GAME-066 — result screen dramatic reveal (per-row reveal timing)
- GAME-068 — sequential reveal pacing (chain timing this builds on)
