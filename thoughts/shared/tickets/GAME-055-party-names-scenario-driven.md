---
id: GAME-055
title: Party names should come from scenario data, not hardcoded labels
area: game, content
status: open
created: 2026-05-01
---

## Summary

Party names are currently hardcoded as "Red Party" and "Blue Party" (in `PARTY_LABELS`
in `types.ts`) and "Blue X% · Red Y%" in `panels.ts`. Scenarios use fictional party
names — Ken/Ryu in tutorial, Cat Party/Dog Party in scenario-009, etc. — but these
names never appear in the UI. Players see "Blue Party wins" instead of "Ken wins",
breaking immersion and making the results panel confusing.

## Current State

- `PARTY_LABELS` in `types.ts` has hardcoded: `{ R: "Red Party", D: "Blue Party", L: "Libertarian", G: "Green", I: "Independent" }`
- `panels.ts` `renderResults()` uses `PARTY_LABELS[r.winner]` for winner badges
- `panels.ts` also hardcodes `"Blue ${dPct}% · Red ${rPct}%"` in vote-details text
- Scenario JSON has `parties` field with per-scenario party names (e.g. `"D": "Ken"`)

## Goals / Acceptance Criteria

- [ ] `renderResults()` and any other panel that shows party names accepts scenario
  party name data and displays scenario-specific names (e.g. "Ken +12%" not "Blue Party +12%")
- [ ] Vote details line (`"Blue X% · Red Y%"`) uses scenario party names
- [ ] Winner badge on result screen uses scenario party names
- [ ] Fallback to generic names (Red/Blue) if scenario has no party name data
- [ ] `PARTY_LABELS` in `types.ts` remains as the fallback default only

## Test Coverage

- [ ] Unit test: `renderResults()` displays scenario-supplied party names when provided
- [ ] Unit test: `renderResults()` falls back to PARTY_LABELS when no names supplied
- [ ] e2e test: tutorial-001 winner badge shows "Ken" or "Ryu" (or scenario's actual names)

## References

- `game/web/src/model/types.ts` — `PARTY_LABELS`
- `game/web/src/render/panels.ts` — `renderResults()`
- `game/web/src/model/scenario.ts` — check for `parties` field in scenario JSON schema
- `game/web/scenarios/tutorial-001.json` — example with named parties
