# SPIKE-001: Game Tech Stack Proof-of-Concept — Report

**Date:** 2026-04-23
**Stack:** TypeScript + Vite + D3.js v7 + Zustand v5 + zundo v2
**Status:** Complete — all AC manually verified

---

## What Was Built

A fully working redistricting simulator prototype:

- 56-cell flat-top hexagonal grid (7 columns × 8 rows) rendered as SVG polygons via D3
- Procedurally generated map with Gaussian mixture population distribution and sinusoidal
  partisan lean gradient
- Brush-stroke precinct painting: mouse-down + drag assigns precincts immediately with
  live visual feedback; stroke committed as a single undo step on mouse-up
- Two-phase boundary feedback: dashed preview overlay shows where boundary will land
  during drag; solid white boundary lines snap to final position on commit
- 4 assignable districts with live boundary rendering (white edges between adjacent
  precincts assigned to different districts)
- Population density choropleth: district colors darkened via HSL lightness encoding
  (darker shade = denser precinct); cached min/max computed once at construction
- Partisan lean toggle: button switches between district view and a diverging blue-red
  scale (d3.interpolateRdBu) showing per-precinct D/R lean independent of assignments
- Hover info: delegated mousemove on SVG container shows precinct ID, district,
  population, and dominant party lean in the status bar
- Election simulation runs after each edit: plurality winner per district, vote-share
  breakdown, margin, population — displayed in a sidebar results panel
- Undo/redo via zundo temporal store (single-stroke granularity) — manually verified
- `npm install && npm start` → working browser page; fully static, no server

---

## What Worked Well

**Vite:** Near-instant dev server startup (~85ms). Zero-config for TypeScript + ESM.
Excellent DX for this kind of spike.

**D3 data join pattern:** The `selection.data(data).join(enter, update, exit)` pattern
worked cleanly for the hex grid, boundary lines, and boundary preview. Keeping D3 as
the sole DOM owner (no React) kept the code simple.

**Zustand + zundo:** Clean state model. Zustand's `set()` pattern works well with
immutable Map cloning. zundo integrates smoothly via the `temporal()` wrapper — note:
"temporal" here means time-travel (undo/redo) and has no relation to the Temporal
workflow engine or the TC39 Temporal API. The `equality` callback correctly prevents
redundant history entries when only `activeDistrict` changes.

**Two-phase visual model:** Separating "visual-only DOM mutation during drag" from
"store commit on mouseup" gives responsive painting with clean single-step undo.
The same pattern applies to boundary preview: `previewBorderGroup` (dashed, top layer)
shows where the boundary will land; `borderGroup` (solid, bottom layer) shows
committed state. The layers are independent SVG groups, so they never conflict.

**Gaussian mixture for population + sinusoidal partisan lean:** Both approaches
produced convincingly varied spatial data with near-zero implementation cost. Density
choropleth via HSL lightness was immediately readable; the diverging lean view proved
out `d3.interpolateRdBu` for future data-layer work.

**SVG event delegation:** Registering all mouse events as a single delegated listener
on the SVG container (not per-element via D3's `.on()`) is critical. D3's `.on()`
re-registers handlers on every `render()` call; when a handler re-registers while
the cursor is already over an element, the event does not re-fire. Delegation avoids
this entirely and also simplifies hover/brush interaction tracking.

**TypeScript strict mode:** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
caught real potential issues. Worth the friction.

---

## What Was Harder Than Expected

**Zustand v5 + zundo React dependency:** Zustand v5's main entry (`zustand`) imports
React even for vanilla usage. zundo's internal imports also use the main entry. Fix:
Vite `resolve.alias` redirects all `zustand` imports (including from node_modules) to
`zustand/vanilla`. This must be in `vite.config.ts`, not just in source imports — if
source imports use `zustand/vanilla` directly, the alias redirects them to
`zustand/vanilla/vanilla` and resolution fails.

**SVG sizing in flex context:** `height: 100%` on an SVG inside a flex child does not
resolve reliably. Fix: `position: absolute; inset: 0` on the SVG with
`position: relative` on the container. This is the standard approach for SVG that
needs to fill an arbitrary container.

**D3 TypeScript types with `exactOptionalPropertyTypes`:**
`this.svg.append("g")` returns `Selection<SVGGElement, unknown, null, undefined>` (not
`…SVGSVGElement…`) because D3's typings propagate the document-level null context
through `select(element)`. Required a type alias to explain the choice.

**zundo `partialize` generic typing:**
Getting `partialize` and `equality` generics to align without error requires either a
full type annotation or skipping `partialize` entirely. Chose to skip — full state
snapshots are fine for 56 precincts. Note for production: switch to diff-based
snapshots via zundo's `diff` option if state grows large.

**clearHover/fill interaction with in-progress paint:**
When `clearHover()` restored fill color from the store, it overwrote in-progress
visual-only paint applied during drag. Fix: hover handling must never touch fill —
only stroke and opacity. Hover never changes fill; it only needs to restore what
it changed.

---

## Open Questions for GES/ARCH

1. **Boundary rendering performance:** Re-computes all boundary segments on every render
   call — O(n·6) per frame. For ~500+ precincts, pre-index edges and only recompute
   segments adjacent to changed precincts. Needs ARCH decision on caching strategy.

2. **AssignmentMap as `Map<id, DistrictId | null>`:** Complicates serialisation
   (LocalStorage/IndexedDB) and zundo snapshots (Map is not JSON-serialisable).
   Production should use `number[]` indexed by precinct id — O(1) lookup, trivial
   JSON, clean zundo diffs.

3. **zundo snapshot depth:** Default keeps all history in memory. Recommend `limit: 100`
   as a production default; ARCH to validate.

4. **Precinct count and rendering performance:** 56 precincts render instantly. At 300+,
   SVG path join re-renders may need optimisation (requestAnimationFrame batching).
   Recommend a follow-on render-performance spike before committing to SVG at scale.

5. **Brush interaction on mobile:** Current model uses mousedown/mousemove/mouseup.
   Touch events are separate. If mobile is in scope, interaction needs rethinking.

6. **Boundary glow and district labels:** Both are achievable with this stack, no new
   libraries: SVG `feGaussianBlur` filter on the boundary group creates a glow/falloff
   effect; district centroid labels use `d3.selectAll("text.label").data(districts)`
   with centroid = mean of assigned precinct centers. Validated as feasible patterns
   for production, deferred from this spike.

---

## Recommended Stack Adjustments

The core stack (TypeScript + Vite + D3 + Zustand) is **validated**. No major changes
recommended. Specific refinements for production:

- **Replace `Map<id, DistrictId>` with `number[]` indexed by precinct id** for O(1)
  lookup, trivial JSON serialisation, and clean zundo diffs.
- **Add `limit: 100` to zundo options** to bound memory usage.
- **Consider React for the sidebar/controls** while keeping D3 for the map SVG.
  Pure D3 DOM manipulation for UI controls is ergonomically poor at scale; React + D3
  split ownership is the recommended pattern for larger UIs.
- **Biome is the right formatter/linter choice.** Fast, single-config, catches real
  issues. Keep it.
- **No Bazel integration yet** — SPIKE-002 handles this.

---

## Map Generator Approach Used

**Population distribution:** Gaussian mixture model with 2–3 randomly-placed epicenters.
Each precinct's population is `sum(weight × exp(-d²/2σ²))` over epicenters, where `d`
is Euclidean distance in hex-grid space. Scaled to 500–8000.

**Partisan lean:** Three overlapping sinusoidal waves at random angles, frequencies,
and phases (low-frequency, 0.15–0.5 cycles per hex unit), summed and normalised to
[0, 1]. Produces spatially coherent lean field with smooth transitions; no urban/rural
assumptions hardcoded.

**Rationale:** Both are "informed simple" — defensible, fast to compute, sufficient for
educational gameplay, easy to parameterise per scenario.
