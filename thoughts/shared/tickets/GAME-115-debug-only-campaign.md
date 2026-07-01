---
id: GAME-115
title: Debug-only campaign (dev harness for test/demo scenarios)
area: game, UX, tooling
status: open
created: 2026-06-30
---

## Summary

Add a campaign that only appears in the campaign-select UI when debug mode is active, so
test/demonstration scenarios (e.g. the 3-party `tutorial-005` multiparty demo) can live in the
repo and be reachable by developers without shipping them to normal players. Motivated by the
GAME-043/112 multiparty work, which needs a place to house its demonstration scenario.

## Current State

- Campaigns are a static `CAMPAIGN_REGISTRY` in `model/campaigns.ts` (`tutorial`, `educational`);
  the campaign-select screen (`main.ts` ~398) renders a card per campaign.
- **Debug propagation already works:** `?debug` is stored in `sessionStorage` (`DEBUG_KEY`,
  `main.ts:219-237`) and `debugActive` reads it, so debug persists across every navigation in a
  tab session even though the URL param is dropped. No propagation work needed.
- `CAMPAIGN_ONLY_SCENARIOS` (`main.ts:73`) already lists scenarios reachable via campaign but
  hidden from the fallback all-scenarios list.

## Goals / Acceptance Criteria

- [ ] Add an optional `debugOnly?: boolean` to the `Campaign` interface; the campaign-select
      render skips `debugOnly` campaigns unless `debugActive`.
- [ ] Add a `debug` campaign (`debugOnly: true`, title e.g. "Debug (dev)") to `CAMPAIGN_REGISTRY`,
      pointing at the demo scenario(s) (initially `tutorial-005` once it exists).
- [ ] Its scenarios are in `CAMPAIGN_ONLY_SCENARIOS` so they never appear in the all-scenarios
      fallback list.
- [ ] With `&debug` (or debug active in the tab), the debug campaign appears in campaign-select and
      is playable; without debug, it is absent from the UI. (Direct `?campaign=debug` links may still
      resolve for developers — acceptable; the scenario is not otherwise discoverable.)
- [ ] The debug campaign + its scenarios are present in the deployable bundle but gated (this is a
      gating feature, not a build-exclusion — matches "only shows up if &debug").

## Test Coverage

- [ ] e2e: campaign-select WITHOUT debug does not show the debug campaign; WITH `&debug` it does.
- [ ] (Optional) a debug-propagation assertion: navigate with `&debug`, then to a URL without it,
      confirm debug features (or the debug campaign) remain active in the same tab session.

## References

- `game/web/src/model/campaigns.ts`, `game/web/src/main.ts` (debug handling ~219-237; campaign-select ~383-433; CAMPAIGN_ONLY_SCENARIOS ~73)
- Related: GAME-112 (multiparty — houses its 3-party demo here), GAME-116 (generator N-party), GAME-043
