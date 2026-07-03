---
date: 2026-07-02
author: Claude (Opus 4.8) + Christian Jackson-Gruber
ticket: GAME-112 (PR 2 of 2)
status: approved — building for serve-local eyeball
---

# GAME-112 PR 2 — the 3-party `tutorial-005` demo: design

## Goal / Context

The visible acceptance target for GAME-112: a scenario with a real third bloc, to exercise the
now-multiparty-capable engine (GAME-043 runtime, GAME-116 N-party generator, GAME-112 PR-1 two-party
metrics) and prove multiparty end-to-end. Housed in the debug campaign (GAME-115), so it ships gated
behind `&debug` and is not discoverable by normal players.

**Reframe (user, 2026-07-02):** not a generic "third party" but a **locally popular Independent** —
same N-party stronghold mechanic, themed as a real local figure. Letting the Independent actually win
a seat *if the player concentrates her base* is desirable (emergent from line-drawing, not hard-coded);
"not enough to win" is dropped.

## The scenario — clone of tutorial-003 "Reading the Vote"

Same map (radius-5 Hawthorn Bend, river, central city), same pedagogy family (Lean view + result
panel; legal-map gates `district_count` + `population_balance` + contiguity; **no seat goal**). New:
**East Hollow has its own champion, the Independent "Ada Hollis"** (gold `#f0c040`, palette slot 3).

Zones (GAME-116 weight model — primary `ken` gets base+jitter, remainder split by weight):
- **west** (`q_lte -1`): Ken country — `{ ken: 0.60, ryu: 0.35, hollis: 0.05 }`.
- **east / the Hollow** (`q_gte 2`): Hollis stronghold — `{ ken: 0.25, ryu: 0.25, hollis: 0.50 }`
  → Hollis ≈ 0.50, wins those precincts.
- **center** (default): Ken/Ryu tossup, light Hollis — `{ ken: 0.45, ryu: 0.45, hollis: 0.10 }`.

**Pedagogy:** keep the Hollow together → Hollis contends/wins that district; crack it across districts
→ her support dilutes. The packing/cracking lesson applied to an independent — "the lines decide,"
which is exactly T3's point, now with a third force. Whether she wins is emergent from the carve.

## Visibility — BOTH card + map (the rendering work)

A non-winning third bloc shows up NOWHERE in today's 2-party UI (result card lists only party1/party2;
Lean view is a party2−party1 PuOr gradient). Two changes:

1. **Result card (`render/panels.ts`):** list EVERY scenario party's share (not just top-two), with a
   proportional multi-segment vote bar in each party's color. For a 2-party scenario this must look
   the same as today (two segments, same order). The winner badge already uses the winner's authored
   color (handles a Hollis win).
2. **Lean map (`render/mapRenderer.ts`):** add a **plurality-coloring rule for 3+ party scenarios** —
   each precinct painted its plurality party's authored color (Hollis's gold stronghold shows on the
   map). **2-party scenarios keep the existing PuOr gradient unchanged** (so T1–T4 + the 8 educational
   scenarios don't shift — the regression guard). Rule keys off `parties.length > 2`.

## Wire-up + metrics

- The debug campaign (GAME-115) already points at `tutorial-005`; generating the JSON makes it
  playable under `&debug`.
- Metrics are correct already (GAME-112 PR-1 two-party normalization); this scenario has no
  EG/mean-median goal anyway.

## Build steps

1. `game/scenarios/tutorial-005.spec.yaml` (this clone) → generate
   `game/scenarios/tutorial-005.json` via `bazel run //game/web/src/pipeline:generate_scenario`.
2. `panels.ts` all-party result card + unit/regression coverage (2-party card unchanged).
3. `mapRenderer.ts` plurality-coloring for 3+ parties (2-party gradient unchanged).
4. `bazel test //game/...` green; add e2e as feasible (debug campaign → tutorial-005 loads, renders).
5. **Push, then serve-local EYEBALL by the user before merge** (visual PR — never auto-merge).

## Risks

- **2-party render regression** — the card + lean changes MUST be byte-identical for 2-party scenarios;
  guard with existing e2e (T1–T4, educational) + explicit 2-party assertions.
- **Independent win edge cases** — a Hollis district win exercises the third-party-win metric branch
  (GAME-112 PR-1 flagged it untested); this scenario is its coverage.
- **Scope** — keep it to the demo + the two render changes; no metric/turnout changes.

## References

- `game/scenarios/tutorial-003.spec.yaml` (clone base), `game/web/src/pipeline/generate-scenario.ts`
- `game/web/src/render/panels.ts`, `game/web/src/render/mapRenderer.ts`
- `game/web/src/model/campaigns.ts` (debug campaign → tutorial-005), GAME-116 demographics stage
- Related: GAME-112 PR 1 (#322), GAME-116 (#320), GAME-115 (#321), GAME-043 (#318/#319)
