---
id: GAME-105
title: Accessibility pass — focus management, dialog/modal semantics, keyboard-safe locks
area: game, accessibility, UX
status: open
created: 2026-06-27
---

## Summary

The app is broken for keyboard and screen-reader users on its core navigation model. From the
2026-06-27 quality review (top-10 #5, Theme 4) — two `high` findings plus supporting nits.

## Current State

- **Focus never moves on transitions.** `grep '.focus('` across `game/web/src` returns zero
  hits; every screen change is `classList.remove("hidden")` (`main.ts:366,332,692,1471,1585,
  1599`). After Submit, focus stays on the now-hidden Submit button; a keyboard user lands on
  a dead element and a screen reader announces nothing (WCAG 2.4.3). The a11y suite misses it
  because `a11y.spec.ts:55` pre-focuses elements itself.
- **Overlays aren't dialogs and aren't focus-trapped.** `#about-screen`, `#wip-warning-modal`,
  `#result-screen`, `#wrap-up-screen` (`index.html:75,93,104,137`) have no `role="dialog"`,
  no `aria-modal`, and nothing makes the underlying content inert. For result/wrap-up the
  editor stays live behind the overlay (`showEditor` sets `#app-header`/`#main` visible and
  the reveals never hide them), so a keyboard user tabs into the live editor and can paint
  precincts (via the SVG keydown handler) or re-submit behind the modal. `#nav-back-menu`
  declares `role="menu"` but never focuses the first item or wires arrow-key roving.
- **Tutorial lock is pointer-events-only** (`overlay.ts:369-374`, `.tutorial-paused` =
  `pointer-events:none`). The `#map-svg` keydown handler stays live and `tabindex="0"`
  remains, so a keyboard user paints during a frozen step, desyncing the guided script.
- **`role="list"` with non-listitem children** (`index.html:68`; cards lack `role="listitem"`).
- **Hardcoded "1–5" key-range label** (`index.html:200`, `mapRenderer.ts:1388`) while
  assignment is gated by `districtCount` (2–4 on most shipped scenarios).

## Goals / Acceptance Criteria

- [ ] On each screen/modal transition, move focus into the newly-shown region (e.g. `#result-verdict` with `tabindex="-1"`, or the first actionable control; `showEditor` → `#map-svg`; menu → first enabled nav button).
- [ ] Each overlay gets `role="dialog" aria-modal="true"` + `aria-label`/`labelledby`; while shown, the editor roots (`#app-header`, `#main`) are `inert` (or `aria-hidden` + tabindex management); restore on close.
- [ ] Tutorial lock uses `inert` on editor roots (re-enabling the highlighted/paint targets) or toggles `tabindex="-1"` + disables paint buttons on non-paint steps — keyboard can no longer paint during a frozen step.
- [ ] `#nav-back-menu` focuses its first `menuitem` on open and supports ArrowUp/ArrowDown roving.
- [ ] `renderScenarioCards()` sets `role="listitem"` on each card (or drop `role="list"`).
- [ ] Key-range labels are built from `districtCount` (`number keys 1–${districtCount}`).

## Test Coverage

- [ ] e2e that does **not** pre-focus: click Submit, assert `document.activeElement` is inside `#result-screen`; assert tabbing from the result screen cannot reach `#map-svg`/district buttons.
- [ ] e2e (keyboard path): tab into `#map-svg` during a non-paint tutorial step and assert no assignment occurs.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 4)
- `game/web/src/main.ts`, `game/web/index.html`, `game/web/src/tutorial/overlay.ts`, `game/web/src/render/mapRenderer.ts`, `game/web/e2e/a11y.spec.ts`
