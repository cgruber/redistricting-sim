---
id: GAME-120
title: Rebuild tutorial-005 as the multi-party tutorial
area: game, content, UX
status: open
created: 2026-07-02
---

## Summary

Rebuild the tutorial-005 draft (shipped debug-only in GAME-112 PR2) into a proper **multi-party**
tutorial: a third (and maybe fourth) **party** that contests every district, leans hung on real
geography (GAME-119) rather than the artificial three q-bands, and outcomes shown as named candidates
(GAME-117). This teaches the multi-party *mechanic* — how a concentrated third party can win seats and
how the lines decide how many. Design of record:
`thoughts/shared/plans/2026-07-02-district-candidates-and-independents.md`.

## Current State

- The GAME-112 PR2 draft (`game/scenarios/tutorial-005.*`) uses three artificial q-bands (west Ken /
  core Ryu / east "Dhalsim"), and its "independent" Dhalsim behaves as a party at the ballot layer.
- Multiparty rendering (all-party card, plurality lean with strength shading, per-precinct breakdown)
  already shipped in GAME-112 PR2 and is model-agnostic.

## Goals / Acceptance Criteria

- [ ] Replace the q-bands with **feature-anchored** leans (GAME-119): urban core / smaller city /
      riverside / rural bases, so the geography reads organically.
- [ ] The third (and optional fourth) bloc is a **party** (contests every district) — not an
      independent; a genuine multi-way where the lines decide how many seats each wins.
- [ ] Outcomes show **named candidates** per district (GAME-117); Street-Fighter-universe cast, party
      candidates aligned to their party.
- [ ] Legal-map gates only (district_count + population_balance + contiguity), no seat goal — a
      mechanics tutorial (political-effect scenarios are later real content).
- [ ] Debug-gated (GAME-115) until the tutorial set is promoted; smoke e2e (loads + renders, no errors).

## Test Coverage

- [ ] Smoke e2e: the rebuilt tutorial-005 loads via the debug campaign and renders (extends the
      existing `e2e/tutorial-005-multiparty.spec.ts`).
- [ ] Generated JSON verified: each party holds a plurality where intended; a legal 3-way map exists.

## References

- Design: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md`
- `game/scenarios/tutorial-005.spec.yaml`, `pipeline/generate-scenario.ts`
- Depends: GAME-117 (candidates), GAME-119 (feature zones). Sibling: GAME-121 (independent tutorial)
