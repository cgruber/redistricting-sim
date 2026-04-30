---
id: GAME-047
title: Campaign data model + authored campaign definitions
area: game, architecture
status: open
created: 2026-04-29
---

## Summary

Introduce a `Campaign` TypeScript type, author the two v1 campaign definitions
(Tutorial and Educational), and wire them into the app as a static registry.
This is the foundation for GAME-048 through GAME-051. No UI changes here —
purely data model and authored content.

## Current State

Scenarios are referenced directly via `SCENARIO_MANIFEST` in `main.ts`. There
is no campaign concept. Scenarios must be accessed through the manifest; there
is no grouping or ordering layer above individual scenarios.

## Goals / Acceptance Criteria

- [ ] `Campaign` interface defined in a new `game/web/src/model/campaigns.ts`:
  ```typescript
  interface Campaign {
    id: string;
    title: string;
    description: string;
    scenarioIds: string[];
  }
  ```
- [ ] Two campaign definitions authored:
  - `tutorial` — title "Tutorial", scenarioIds `["tutorial-001", "tutorial-002"]`
  - `educational` — title "Educational Campaign", scenarioIds `["001", "002", "003", "004", "005", "006", "007", "008", "009"]`
- [ ] `CAMPAIGN_REGISTRY: Campaign[]` exported from `campaigns.ts` (ordered: tutorial first)
- [ ] `getCampaign(id: string): Campaign | undefined` helper exported
- [ ] `saveLastPlayedScenario(scenarioId: string): void` and
  `loadLastPlayedScenario(): string | null` helpers exported from `campaigns.ts`
  (thin wrappers over localStorage key `"lastPlayedScenarioId"`); called by the
  scenario entry path so Continue on the main menu knows where to resume
- [ ] `campaigns_lib` Bazel target added to `model/BUILD.bazel`
- [ ] `app_typecheck_lib` in `web/BUILD.bazel` updated to include `campaigns_lib`

## Test Coverage

- [ ] Unit test file `game/web/src/model/campaigns_test.ts`:
  - CAMPAIGN_REGISTRY contains exactly 2 campaigns
  - tutorial campaign has exactly 2 scenario IDs
  - educational campaign has exactly 9 scenario IDs
  - getCampaign("tutorial") returns the tutorial campaign
  - getCampaign("educational") returns the educational campaign
  - getCampaign("nonexistent") returns undefined
  - saveLastPlayedScenario("001") → loadLastPlayedScenario() returns "001"
  - loadLastPlayedScenario() returns null when localStorage is empty
- [ ] `campaigns_test` js_test target in `model/BUILD.bazel`

## References

- `game/web/src/main.ts` — SCENARIO_MANIFEST (source of scenario IDs)
- `thoughts/shared/tickets/GAME-030-main-menu-and-campaigns.md` — parent design doc
- `game/web/src/testing/test_runner.ts` — TAP runner for unit tests
