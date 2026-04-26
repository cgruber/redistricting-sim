---
id: GAME-008
title: Accessibility pass — color blindness, keyboard navigation, screen reader support
area: game, accessibility
status: open
created: 2026-04-25
---

## Summary

The game has no accessibility provisions. Before public release (and ideally
before Sprint 4 playability work), the core interaction loop should be usable
by players who rely on keyboard navigation, screen readers, or have color vision
deficiencies. This ticket covers the full v1 accessibility pass.

## Current State

- All interaction is mouse-only (paint strokes use mousedown/mousemove/mouseup).
- District colors (`DISTRICT_COLORS`) and the RdBu lean palette are not
  color-blind safe (red/green are in the extended palette; RdBu is particularly
  problematic for deuteranopia).
- No ARIA labels on SVG elements or control buttons.
- No keyboard navigation for precinct assignment.
- No `prefers-reduced-motion` handling.

## Goals / Acceptance Criteria

### Color blindness
- [ ] Audit current district palette (`DISTRICT_COLORS`) and lean palette
  against the three main deficiency types (deuteranopia, protanopia, tritanopia)
  using a tool such as Coblis or Sim Daltonism.
- [ ] Replace or supplement with a color-blind-safe palette for district colors
  (e.g. Wong 2011 or Okabe-Ito 8-color set).
- [ ] Evaluate lean view: RdBu is problematic for red-green blindness.
  Consider a blue-orange diverging palette (e.g. PRGn or a custom blue/orange pair).
- [ ] Document chosen palettes in `types.ts` with source citations.

### Screen reader support
- [ ] Add `role`, `aria-label`, and `aria-describedby` attributes to the SVG map
  and key precinct paths (at minimum: the SVG element and a summary region).
- [ ] Ensure district buttons (`#district-buttons`) and control buttons
  (`#btn-undo`, `#btn-redo`, `#btn-view-toggle`) have descriptive labels.
- [ ] Add a live region (`aria-live`) for election results so screen readers
  announce updates when districts change.
- [ ] Test with macOS VoiceOver and (if feasible) NVDA/JAWS.

### Keyboard navigation
- [ ] Tab order covers district buttons, undo/redo, view toggle.
- [ ] Research and sketch a keyboard approach for precinct assignment
  (e.g. arrow-key navigation between precincts + Space to assign). This is
  complex; a basic scheme is acceptable for v1; full keyboard painting can
  be post-v1.
- [ ] `prefers-reduced-motion`: suppress or replace any CSS transitions added
  in future sprints.

### Focus and contrast
- [ ] Verify contrast ratios for button text against background meet WCAG 2.1 AA
  (4.5:1 for normal text, 3:1 for large text / UI components).
- [ ] Ensure focus rings are visible on all interactive elements (not suppressed
  by `outline: none` without replacement).

## Notes

- Target standard: **WCAG 2.1 AA** as a baseline.
- Color palette changes should be coordinated with DESIGN-003 (districts view
  color encoding) — both touch `DISTRICT_COLORS`.
- Keyboard painting is the hardest part; a "select precinct + assign" model
  (arrow keys + number keys for district) is likely more feasible than
  replicating continuous brush painting.
- Playwright tests for accessibility: `axe-playwright` or `@axe-core/playwright`
  can automate WCAG audits and should be added to the e2e suite as part of this
  ticket.

## Sprint slot

Not sprint-assigned. Target: before Sprint 4 (playability), since color/palette
decisions affect scenario authoring. Color-blind palette work is the highest
priority sub-item.

## References

- `game/web/src/model/types.ts` — `DISTRICT_COLORS`, `PARTY_COLORS`
- `game/web/src/render/mapRenderer.ts` — `hexFill()`, SVG element construction
- `game/web/index.html` — button markup
- DESIGN-003 — districts view color encoding (coordinate palette changes)
- Wong (2011) color-blind-safe palette: https://www.nature.com/articles/nmeth.1618
- Okabe-Ito palette: https://jfly.uni-koeln.de/color/
