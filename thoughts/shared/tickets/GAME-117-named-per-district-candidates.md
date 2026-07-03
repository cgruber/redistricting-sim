---
id: GAME-117
title: Named per-district candidates (outcomes read as people)
area: game, model, simulation, UX
status: open
created: 2026-07-02
---

## Summary

A district seat is won by a **named candidate**, not an abstract party. Author a candidate name per
`(district, party)` so results read as people winning seats ("Sakura took D1, Chun-Li took D2 for the
Ryu Party") — which also makes multi-seat party wins read correctly (one person can't hold two seats).
This is the keystone for the home-base independent model (GAME-118): an independent is just a candidate
that exists in one district. Design of record:
`thoughts/shared/plans/2026-07-02-district-candidates-and-independents.md`.

## Current State

- `election.ts` computes a district `winner: PartyId`; `panels.ts`/`mapRenderer.ts` display the party
  name/abbreviation (+ color badge). No candidate concept.
- Party is `{ id, name, abbreviation, color? }` (`model/scenario.ts`); no per-district candidate.

## Goals / Acceptance Criteria

- [ ] Additive, OPTIONAL candidate authoring in the scenario schema — a per-`(district, party)` name
      (decide shape: a `candidates` map or per-party `candidates: { <districtId>: <name> }`). Loader
      validates strings; absent → no candidate.
- [ ] The result card (`panels.ts`) and precinct/result surfaces show the **winning candidate name**
      (Party) when authored; **fall back to the party name** when not — so every existing scenario and
      all 2-party scenarios are visually unchanged.
- [ ] Candidate names are escaped before innerHTML (GAME-103); no injection via authored names.
- [ ] Behavior-preserving: no change to who WINS (candidates are display only, tied to the party's
      per-district result); only the label changes when authored.

## Test Coverage

- [ ] Loader test: candidate names parse when present; absent → fallback; non-string rejected.
- [ ] Render/unit: a district win with an authored candidate shows "Candidate (Party)"; without → party
      name; escaping verified.
- [ ] Existing scenarios (no candidates authored) render identically (regression).

## References

- Design: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md`
- `model/scenario.ts`, `model/loader.ts`, `simulation/election.ts`, `render/panels.ts`, `render/mapRenderer.ts`
- Blocks: GAME-118 (independent), GAME-120/121 (tutorials)
