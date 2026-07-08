---
id: GAME-128
title: Educational campaign shown as "coming soon" on campaign-select (beta gating)
area: game (UX, content)
status: resolved
created: 2026-07-08
---

## Summary

For the beta launch the six-rung tutorial ladder is ready, but the educational arc
(scenario-002…009) is still being authored/tuned (GAME-123 realism pass; the VRA/Callais
scenario-005 arc). Show the "Educational Campaign" on campaign-select as a non-interactive
**"coming soon"** placeholder so beta ships with the tutorial live and the educational campaign
visibly pending — rather than either hiding it outright or shipping a half-tuned campaign as
playable.

Owner request (verbatim): *"make the Educational Campaign unselectable, and without scenarios
count — just instead have 'coming soon' in italics there … We have the tutorial, and that's good
to say beta."*

## Resolution

Resolved 2026-07-08. Added a `comingSoon?: boolean` to the `Campaign` interface
(`model/campaigns.ts`), mirroring the existing `debugOnly` flag, and set it on the `educational`
campaign. `showCampaignSelect` (`main.ts`) now renders a `comingSoon` campaign as a
non-interactive placeholder:

- no `role="button"`, no `tabindex`, no click/keydown navigation → **unselectable**, and kept
  out of the keyboard tab order;
- `aria-disabled="true"` for assistive tech;
- an italic **"coming soon"** (`.campaign-coming-soon`) in place of the
  `N / M scenarios complete` count;
- dimmed (`opacity: 0.6`) with the hover lift/border removed (`styles.css`).

The educational scenarios still ship in the bundle and remain reachable via a direct
`?campaign=educational` link — this gates *menu discovery*, not the build (same philosophy as
`debugOnly`). Flipping `comingSoon` off (or authoring the arc) restores the normal selectable card
with its progress count.

**Tests:** `campaigns_test` (educational is `comingSoon`, tutorial is not); rewrote the
`campaign-select` e2e "clicking Educational navigates" case → now asserts the educational card
shows "coming soon", carries `aria-disabled`, hides the scenario count, and a click does **not**
navigate to `?campaign=educational`. The "both campaign titles render", "two cards with/without
&debug", and "Tutorial shows 0 / 6" cases still hold. `bazel test //game/...` 47/47.
Preview-verified on serve-local (Tutorial selectable; Educational dimmed with an italic
"coming soon", no count, `aria-disabled`, not focusable). PR #336.

## Goals / acceptance criteria

- [x] Educational Campaign card is unselectable (no navigation, not focusable, `aria-disabled`).
- [x] Scenario count replaced by an italic "coming soon".
- [x] Card visually reads as non-interactive (dimmed, no hover affordance).
- [x] Educational scenarios still resolve via a direct `?campaign=educational` link (gating, not removal).
- [x] Unit + e2e coverage; full local `bazel test //game/...` green.

## References

- `game/web/src/model/campaigns.ts`, `game/web/src/main.ts`, `game/web/styles.css`
- `game/web/src/model/campaigns_test.ts`, `game/web/e2e/campaign-select.spec.ts`
- GAME-115 — `debugOnly` gating (the pattern this mirrors)
- GAME-123 — educational-scenario realism tuning (part of what "coming soon" is waiting on)
- Enables the beta launch with the tutorial ladder live.
