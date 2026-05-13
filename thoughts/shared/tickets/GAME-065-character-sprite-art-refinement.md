---
id: GAME-065
title: Character sprite art refinement — quality iteration on produced sheets
area: game, art, content
status: open
created: 2026-05-04
last_updated: 2026-05-13
---

## Summary

Quality iteration pass on the character sprite sheets produced in GAME-060. Known
minor issues are documented in each character's `GENERATION.md`. This ticket covers
targeted fixes (manual post-edit or regeneration) and optional broker PNG initial
production (stretch, scenario-006 instigator).

This ticket is not a blocker for GAME-062. The known issues are all minor and
acceptable at game display scale (~84–100px height). GAME-062 wiring can proceed
in parallel; art fixes can ship after.

## Current State

All 5 character types have stamped PNG sheets. Known issues:

| Type | Variant | Issue | Severity |
|---|---|---|---|
| Governor | all | None | — |
| Commissioner | all | None | — |
| Judge | generic | Neutral pose: slight eye shine asymmetry (right eye slightly darker) | Minor |
| Judge | lm, naf | None noted | — |
| Legislator | wm | Thumbs-down thumb geometry slightly imperfect | Minor |
| Legislator | wf | Pants rendering slightly odd; thumbs-down thumb imperfect (same as wm) | Minor |
| Legislator | bm | None | — |
| Party | group | Some mouth expressions inconsistent between panels; manual post-edit needed | Minor |

## Goals / Acceptance Criteria

### Quality fixes
- [ ] Judge (generic) neutral pose: eye shine asymmetry fixed (Photopea or regenerate)
- [ ] Legislator (wm + wf) thumbs-down pose: thumb geometry improved if feasible
- [ ] Legislator (wf) pants: post-edit if visible at display size
- [ ] Party: mouth expression inconsistency addressed (manual post-edit)
- [ ] All fixed sheets reviewed at display size (≈84–100px) on dark background
- [ ] `ALT-TEXT.md` updated if any visual descriptions change

### Broker initial production (stretch — scenario-006 instigator)
- [ ] 9 broker PNG images generated via `gen-assets.main.kts`
      (3 demographic variants × 3 evaluation states per `tools/sprite-spec.json`)
- [ ] Images committed to `game/web/assets/characters/broker-*/sheet.png`

## References

- `game/web/assets/characters/*/GENERATION.md` — generation logs with known issues per variant
- `game/web/assets/characters/ALT-TEXT.md` — accessibility descriptions
- `tools/sprite-spec.json` — broker variants spec
- `tools/gen-assets.main.kts` — image generation pipeline
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — downstream consumer
