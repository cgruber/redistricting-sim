---
id: GAME-021
title: "Multi-scenario manifest: load all scenarios and drive select screen from it"
area: game, progression
status: resolved
created: 2026-04-26
github_issue: 89
---

## Summary

The scenario manifest in `main.ts` is currently hard-coded to a single entry — the one
scenario that was fetched at startup. To support S5's 2–4 playable scenarios, the manifest
needs to be a static list of all known scenarios (IDs + titles), with each scenario's JSON
fetched on demand when the player selects it. The select screen should show all manifest
entries with correct locked/unlocked/completed states.

## Current State

```typescript
const SCENARIO_MANIFEST: Array<{ id: string; title: string }> = [
    { id: scenario.id, title: scenario.title },
];
```

One entry, populated from the single pre-fetched scenario. The select screen can only ever
show one card regardless of how many scenario JSON files exist in `/scenarios/`.

## Goals / Acceptance Criteria

- [ ] `SCENARIO_MANIFEST` is a static list in source (not derived from a runtime fetch); each
      entry has at minimum `{ id, title }`
- [ ] At startup, the app fetches only the first unlocked scenario JSON (or the active one
      if a returning player selects one); other scenario JSONs are fetched on demand
- [ ] Select screen shows all manifest entries: completed, next-unlocked, and locked-ahead cards
- [ ] Sequential unlock still works: scenario N unlocks after N-1 is marked completed
- [ ] "Play Again" for a completed scenario fetches and loads that scenario's JSON correctly
- [ ] Adding a new scenario to the manifest requires only: (1) add JSON to `scenarios/`, (2)
      add one entry to the manifest list — no other code changes

## Test Coverage

- [ ] E2e: with two completed scenarios seeded in localStorage, select screen shows 3 cards
      (2 completed, 1 unlocked)
- [ ] E2e: clicking the second scenario card loads that scenario's intro screen and map
- [ ] E2e: third card is locked (not clickable / shows lock state) when only first is completed

## References

- `game/web/src/main.ts` — SCENARIO_MANIFEST definition and select screen rendering
- `game/web/src/model/progress.ts` — loadProgress, isCompleted, markCompleted
- `game/scenarios/` — scenario JSON files
- Sprint roadmap: S5 scope
