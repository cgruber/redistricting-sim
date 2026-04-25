---
id: DIST-001
title: Steam deployment research — educational free program and achievements
area: distribution
status: open
created: 2026-04-24
---

## Summary

Before committing to a distribution strategy, research Steam's options for
educational/free games, including whether the Steam free-to-play / educational
program is viable, what the achievements API looks like, and how Steam compares
to a web-based distribution approach for this project's goals.

## Current State

No distribution decision has been made. The game is being built as a browser
application (TypeScript + Vite). Steam is a possible deployment target but has
not been evaluated.

## Goals / Acceptance Criteria

- [ ] Determine whether Steam's educational / free game program applies and what
      its requirements are.
- [ ] Understand the Steam achievements API: integration complexity, supported
      platforms, any restrictions.
- [ ] Evaluate web-first vs. Steam-first vs. both: what do educational games
      typically choose, and what are the tradeoffs for discoverability, reach,
      and maintenance cost?
- [ ] Summarize recommendation with reasoning. No implementation required.

## References

- Game vision: `thoughts/shared/vision/game-vision.compressed.md`
- Scenario data format: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
  (optional criteria / achievements system is related — see DESIGN-001)
- DESIGN-001: Achievement/star system (game ergonomics side of same question)
