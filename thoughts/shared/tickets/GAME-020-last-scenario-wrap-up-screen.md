---
id: GAME-020
title: "Last scenario: wrap-up screen / completion animation after all scenarios finished"
area: game, UX
status: resolved
created: 2026-04-26
---

## Summary

When the player completes the final scenario in the manifest, clicking "Next Scenario"
currently leads to the scenario select screen — which shows all scenarios as completed
and no clear next action. This is a dead end. The game needs a wrap-up experience:
a congratulations screen, short summary of what the player learned, and a clear
"you finished the game" moment. A placeholder animation or static screen is acceptable
for v1; the full Test-sequence animation (S7) is a separate ticket.

## Current State

- After passing the last scenario, `btnNextScenario` fires `showScenarioSelect()`
- The select screen renders all scenarios as "Completed" with "Play Again" buttons
- No wrap-up screen, no end-game state, no closure for the player
- The scenario manifest is currently one entry (tutorial-002); this matters more as
  scenarios 2–N are added

## Goals / Acceptance Criteria

- [ ] Detect when the player has completed the last scenario in SCENARIO_MANIFEST
- [ ] Instead of showing the select screen, show a wrap-up/congratulations screen with:
      - A "You've completed all scenarios" heading
      - Brief closing text (written to match game tone — fictional region framing)
      - A "Play Again" button (restarts from scenario select) and optionally a
        "Share" or "About" link
- [ ] The wrap-up screen is distinct from the pass/fail result screen
- [ ] If more scenarios exist (i.e., the completed scenario is not the last), behaviour
      is unchanged (select screen as before)
- [ ] e2e test: seed localStorage with all-but-last completed, complete the last scenario,
      assert wrap-up screen is shown (not select screen)

## Test Coverage

- One Playwright e2e test: seed progress, force-pass the last scenario, assert wrap-up
  screen visible and "Next Scenario" / select screen not shown

## References

- `game/web/src/main.ts` — `btnNextScenario` click handler (line ~436)
- `game/web/src/main.ts` — `SCENARIO_MANIFEST` and `showScenarioSelect()`
- Related S7 work: Test-sequence animation (separate ticket, not a dependency here)
- GAME-018 (progression, select screen) — resolved PR #77
