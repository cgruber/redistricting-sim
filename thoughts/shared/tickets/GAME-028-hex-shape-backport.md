---
id: GAME-028
title: Backport hex-of-hexes map shape to scenarios 002–006
area: game, content
status: open
created: 2026-04-27
---

## Summary

Scenarios 002–006 use rectangular grid generators producing rhomboid/parallelogram
map shapes. Once GAME-027 establishes the hex-of-hexes pattern in scenarios 007–009,
backport that shape to all earlier scenarios. Requires regenerating scenario JSON files,
rewriting e2e winnability tests (precinct indices change), and updating generators.

## Scenarios to retrofit

| Scenario | Grid | Precincts | Target shape |
|---|---|---|---|
| tutorial-001 | 6×5 = 30 | 30 | hex R=3 (37) — or keep small for tutorial |
| tutorial-002 | ~14×14 = 196 | 196 | hex R=8 (217) or R=7 (169) |
| scenario-002 | 8×12 = 96 | 96 | hex R=5 (91) or R=6 (127, subset) |
| scenario-003 | 10×12 = 120 | 120 | hex R=6 (127) |
| scenario-004 | 10×12 = 120 | 120 | hex R=6 (127) |
| scenario-005 | 10×12 = 120 | 120 | hex R=6 (127) |
| scenario-006 | 10×12 = 120 | 120 | hex R=6 (127) |

## Goals / Acceptance Criteria

- [ ] All generators updated to hex-of-hexes coordinate generation
- [ ] All scenario JSON files regenerated
- [ ] All e2e winnability tests updated with new precinct coordinate logic
- [ ] `bazel test //web:e2e_test` passes after all changes
- [ ] Maps render as recognizable hexagonal/circular shapes in browser

## Notes

- Tutorial-001 is a guided walkthrough with specific named precincts in narrative text —
  verify narrative still makes sense after coordinate change
- Winnability tests that use specific precinct indices (paintPrecinct by id) need to be
  rewritten to use hex-coordinate-aware index lookup or paintStroke API
- Do this after GAME-027 is merged so the pattern is established and stable

## References

- GAME-027 — hex-of-hexes for new scenarios (implement first)
- DESIGN-008 — geographic features (implement after shape is stable)
