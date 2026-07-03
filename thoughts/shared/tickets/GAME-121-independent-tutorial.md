---
id: GAME-121
title: Independent tutorial (home-base independent mechanic)
area: game, content, UX
status: open
created: 2026-07-02
---

## Summary

A new tutorial that teaches the **independent** mechanic specifically (distinct from the multi-party
tutorial, GAME-120): a locally-popular independent on the ballot only in their **home** district, whom
the player can elect by keeping their base together or defeat by cracking it / drawing the home into
hostile turf. Built on the home-base independent model (GAME-118) + named candidates (GAME-117) —
e.g. Dhalsim done right. Design of record:
`thoughts/shared/plans/2026-07-02-district-candidates-and-independents.md`.

## Current State

- No independent-specific scenario exists; GAME-118 delivers the engine model + the home pin.
- The multiparty rendering (all-party card, plurality lean, breakdown) is already shipped.

## Goals / Acceptance Criteria

- [ ] **Scenario identity:** a NEW scenario `tutorial-006` (GAME-120 keeps/repurposes `tutorial-005`
      for the multi-party tutorial; the independent tutorial is its own scenario) — spec + generated
      JSON + a `CAMPAIGN_ONLY_SCENARIOS` entry + the debug campaign's `scenarioIds`.
- [ ] A scenario with one home-base independent (GAME-118): a home precinct + a concentrated regional
      base, two major parties, feature-anchored leans (GAME-119).
- [ ] The lesson is legible: with a natural district around the home the independent wins; crack the
      base or draw the home into a party stronghold and they lose. Narrative frames lean-vs-ballot
      ("beloved nearby, but only on the ballot at home").
- [ ] Named candidates (GAME-117); home pin visible; debug-gated (GAME-115) until promotion.
- [ ] A legal map exists where the independent wins their home seat, and one where they don't
      (both reachable by the player's draw).

## Test Coverage

- [ ] Smoke e2e: loads via the debug campaign, renders the home pin + lean, no page errors.
- [ ] Generated JSON verified: the independent leads their home base; the home precinct is marked.

## References

- Design: `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md`
- Depends: GAME-118 (independent model), GAME-117 (candidates), GAME-119 (feature zones). Sibling: GAME-120
