---
id: GAME-016
title: Scenario intro — narrative slides before map editing
area: game, content
status: resolved
created: 2026-04-26
github_issue: 70
---

## Summary

Before the player reaches the map editor, they need context: who they're playing as, what region they're drawing, what they're trying to achieve, and any mechanic notes specific to this scenario. The vision calls for a slide-based intro sequence. This ticket implements that screen and wires it into the game flow so the player always lands on the intro before editing begins.

## Current State

The app loads directly into the map editor with no preamble. The scenario format has no `intro` field. Players have no narrative context for why they are drawing districts or what success looks like.

## Goals / Acceptance Criteria

- [ ] `ScenarioIntro` type added to `scenario.ts`: array of slides, each with title, body text, and optional flavor image reference
- [ ] `Scenario` type gains `intro: ScenarioIntro` field (required)
- [ ] `loadScenario` validates `intro` is present and non-empty
- [ ] Intro screen renders slides with Next / Previous navigation and a "Start Drawing" button on the final slide
- [ ] "Start Drawing" transitions to the map editor
- [ ] Tutorial scenario JSON updated with a 2–3 slide intro (context, objective, mechanic hint)
- [ ] Intro screen is skippable (keyboard shortcut or skip button) for returning players

## Test Coverage

- [ ] Unit: `loadScenario` rejects scenario missing `intro`; accepts valid intro array
- [ ] e2e: intro screen visible on load before map editor
- [ ] e2e: "Start Drawing" (or skip) reveals map editor
- [ ] e2e: slide navigation (Next/Previous) updates displayed content

## References

- Vision §SCENARIO_INTRO, §LOOP
- `game/web/src/model/scenario.ts` — types to extend
- `game/web/src/model/loader.ts` — validation to extend
- `game/web/index.html` + `src/main.ts` — UI entry point
- Independent of GAME-015 and GAME-017; can be implemented in parallel
