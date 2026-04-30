---
id: GAME-030
title: Main menu, campaign model, and navigation overhaul
area: game, UX, architecture
status: open
created: 2026-04-27
---

## Summary

Replace the current scenario-select-as-home-screen with a proper main menu,
campaign model, and layered navigation. The game should feel like a real game
with a title screen, not a scenario picker that doubles as everything.

This is the parent design document. Implementation is broken into five
sub-tickets: GAME-047 through GAME-051.

## Current State

The scenario select screen serves as the home screen — it's the first thing
returning players see. There is no title screen, no campaign concept, no
settings, and the "About" and "Reset Campaign" buttons are tacked on.
Scenarios are hardcoded in SCENARIO_MANIFEST.

## Design

### Campaign Model

A campaign is a named, ordered collection of scenarios. Two campaigns ship
with v1:

- **Tutorial** — `tutorial-001` and `tutorial-002`; introduces map mechanics
  before presenting the full scenario set
- **Educational** — all nine main scenarios (001–009); the core game

Campaign data structure:
```typescript
interface Campaign {
  id: string;
  title: string;
  description: string;
  scenarioIds: string[];
}
```

Campaign completion tracked per-campaign in localStorage. Unlock logic
(sequential progression) applies within each campaign independently.

### Main Menu Screen
- Full-screen with game art/logo ("Past the Post")
- Vertical menu:
  - **Continue** (visible only when a campaign is in progress)
  - **New Campaign**
  - **About** (opens existing about page)
  - **Load** (greyed out — post-v1)
  - **Settings** (greyed out — post-v1)

### Campaign Select Screen
- Shows both campaigns with progress indicator (N/M scenarios complete)
- Back button returns to main menu
- Clicking a campaign opens the scenario select screen for that campaign

### Scenario Select Screen
- No longer the home screen — accessed through a campaign
- Scenario list generated from the campaign's `scenarioIds`
- Back button returns to campaign select (not main menu)

### In-Game Navigation
- The "← Scenarios" button becomes a submenu:
  - "Return to Scenarios" (back to scenario select within current campaign)
  - "Return to Main Menu"

## Sub-tickets (implementation)

Intended delivery order (each builds on the previous):

| Ticket | Scope | Depends on |
|---|---|---|
| GAME-047 | Campaign data model + authored campaign definitions | — |
| GAME-048 | Campaign-driven scenario select (routing + data wiring) | GAME-047 |
| GAME-050 | Main menu / title screen | GAME-047, GAME-048 |
| GAME-049 | Campaign select screen | GAME-047, GAME-048, GAME-050 |
| GAME-051 | In-game navigation cleanup | GAME-048, GAME-049, GAME-050 |

GAME-050 ships before GAME-049 so the campaign select Back button has a real
destination. The Continue button in GAME-050 requires per-campaign last-played
tracking; GAME-047 must persist a `lastCampaignId` key in localStorage, or
GAME-050 should soften Continue to navigate to campaign select rather than the
most-recently-played campaign's scenario list.

## References

- Game vision §MENU: "New Game | Continue | Custom Level | Settings | About"
- GAME-029 — about page (already implemented; move into main menu navigation)
- GAME-018 — scenario select + progression (refactored, not replaced)
- `game/web/src/main.ts` — current SCENARIO_MANIFEST and routing
