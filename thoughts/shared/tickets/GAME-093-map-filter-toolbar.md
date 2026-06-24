---
id: GAME-093
title: Map view filter toolbar — right-side icon buttons (draft, placeholder icons)
area: game, UX
status: resolved
created: 2026-06-23
---

## Summary

Draft of a vertical icon-button toolbar down the right side of the map (over the map,
beside the info panel) for the map view filters, replacing the ad-hoc header toggle
buttons as the primary surface. Icons are PLACEHOLDERS — real asset generation +
comparison is a later pass.

## Resolution (draft)

- New `#map-filters` toolbar absolutely positioned top-right inside `#map-container`,
  **grouped by axis** so orthogonal controls are visually separated:
  - **Section 1 — precinct coloring** (radio, `aria-checked`): districts | partisan lean
    (mutually exclusive — the fill can only show one dataset).
  - **Section 2 — overlays** (toggle, `aria-pressed`): county borders (independent).
  - A `role="separator"` divider between sections. Scales: a future precinct-type
    coloring joins §1; City limits joins §2 and becomes either-or with County there.
- Placeholder inline-SVG icons (4-square grid / split disc / dashed square) + `title`
  hover-text on every button.
- **Removed the obviated header buttons** (`btn-view-toggle`, `btn-county-toggle`); the
  toolbar is now authoritative (`applyViewMode` / `applyCounty` in main.ts). a11y,
  sprint1, and sprint2 e2e migrated onto the toolbar.
- e2e (sprint2): toolbar present + defaults; coloring is mutually exclusive; county
  overlay toggles independently with the layer in the DOM and no console errors.

## Follow-ups (deferred)

- [ ] Real icons (asset generation + comparison).
- [ ] Add overlays/colorings as they land: City limits (either-or with County in §2),
      precinct-type/topology (§1 coloring or its own group).
- [ ] DESIGN-015 (information-density redesign) — fold the toolbar into that layout.

## References

- `game/web/index.html` (#map-filters), `game/web/styles.css`, `game/web/src/main.ts`.
- Relates to DESIGN-015 (information density), GAME-080/081 (HUD).
