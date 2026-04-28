---
id: GAME-029
title: About page — educational framing, designer intent, resource links
area: game, UX
status: open
created: 2026-04-27
---

## Summary

The game needs an About page providing educational context: what the game is,
why it exists, the non-partisan stance, and links to diverse resources on
redistricting. Without this, the game has no framing — a player encounters
mechanics with no context for why they matter.

## Current State

No about page exists. The game vision (§MENU) specifies: "About page: states
educational intent; names designer+non-partisan intent; links to diverse
resources (academic, journalistic, multiple political perspectives)."

## Goals / Acceptance Criteria

- [ ] About page accessible from scenario select screen (button/link)
- [ ] Content: game title, educational purpose, non-partisan intent, designer credit
- [ ] Links section: 2-3 external resources on redistricting (diverse perspectives)
- [ ] Visual style consistent with existing dark HUD chrome
- [ ] Back/close button returns to previous screen
- [ ] e2e test: about link visible on select screen; clicking it shows about content

## Test Coverage

- [ ] e2e: about link on select screen → about page visible with expected content

## References

- Game vision §MENU, §NEUTRALITY
- `thoughts/shared/decisions/2026-04-27-game-name.md` — game named "Past the Post"
