# SPIKE-001: Game Tech Stack Proof-of-Concept — Report

**Date:** 2026-04-23
**Stack:** TypeScript + Vite + D3.js v7 + Zustand v5 + zundo v2

---

## What Was Built

A fully working redistricting simulator prototype:

- 56-cell flat-top hexagonal grid (7 columns × 8 rows) rendered as SVG polygons via D3
- Procedurally generated map with Gaussian mixture population distribution and sinusoidal
  partisan lean gradient
- Brush-stroke precinct painting: mouse-down + drag assigns precincts to the district
  where the stroke began; stroke committed as a single undo step on mouse-up
- 4 assignable districts with live boundary rendering (white edges between adjacent
  precincts assigned to different districts)
- Election simulation runs after each edit: plurality winner per district, vote-share
  breakdown, margin, population — displayed in a sidebar results panel
- Undo/redo via zundo temporal store (single-stroke granularity)
- `npm install && npm start` → working browser page; fully static, no server

---

## What Worked Well

**Vite:** Near-instant dev server startup (84ms). Zero-config for TypeScript + ESM.
Excellent DX for this kind of spike.

**D3 data join pattern:** The `selection.data(data).join(enter, update, exit)` pattern
worked cleanly for the hex grid and boundary lines. Keeping D3 as the sole DOM owner
(no React) kept the code simple. Typed selections required some care but are achievable.

**Zustand + zundo:** Clean state model. Zustand's `set()` pattern works well with
immutable Map cloning. zundo integrates smoothly via the `temporal()` wrapper; the
`equality` callback correctly prevents redundant history entries when only `activeDistrict`
changes.

**Gaussian mixture for population:** Two or three Gaussian epicenters (exp(-d²/2σ²))
produce convincingly varied population density with near-zero implementation cost. Dense
urban cores, sparse periphery, optional secondary cluster — all emerge naturally. This
is the right approach for synthetic map generation in a game context.

**Sinusoidal partisan lean:** Three overlapping sine waves at random angles and low
frequencies produce a spatially coherent lean field with no urban/rural assumptions baked
in. The resulting map has regions that lean strongly in each direction with smooth
transitions — which is exactly what the educational scenarios need.

**TypeScript strict mode:** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
caught real potential issues (array bounds, optional property handling). Worth the
friction.

---

## What Was Harder Than Expected

**D3 TypeScript types with `exactOptionalPropertyTypes`:**
The type of `this.svg.append("g")` is
`Selection<SVGGElement, unknown, null, undefined>` (not `…SVGSVGElement…`) because D3's
typings propagate the document-level null context through `select(element)`. This required
a type alias comment explaining the choice rather than fighting the types. The underlying
issue is that D3's TypeScript types were designed before strict mode was common; they use
`null` as a union member in `PElement` rather than distinguishing "called from document"
vs "called from element".

**zundo `partialize` generic typing:**
The `partialize` option in zundo v2 has a complex generic constraint
(`ZundoOptions<TState, PartialTState>`) where `PartialTState` must be the return type of
`partialize` AND the type parameter of `equality`. Getting both to align without error
required either (a) a full type annotation or (b) skipping `partialize` and letting
zundo snapshot full state. Chose (b) — full state snapshots are fine for a spike. Note
for production: if state gets large (hundreds of precincts × history depth), switch to
diff-based snapshots using zundo's `diff` option.

**Map-to-Map equality in Zustand:**
JavaScript `Map` reference equality is the default, so without a custom `equality`
function in zundo, every `set()` call (including `setActiveDistrict`) would push to undo
history. Required custom deep equality over the assignments Map.

---

## Open Questions for GES/ARCH

1. **Boundary rendering performance:** The current approach re-computes all boundary
   segments on every render call. For ~50 precincts this is fast; for ~500+ precincts
   (production target), this becomes O(n·6) per frame. A smarter approach: pre-index
   edges and only recompute segments adjacent to changed precincts. Needs ARCH decision
   on caching strategy.

2. **AssignmentMap as `Map<id, DistrictId | null>`:** Using a JS `Map` for assignments
   works cleanly but complicates serialisation (for LocalStorage/IndexedDB save state)
   and zundo snapshots (Map is not JSON-serialisable). Production should use a plain
   `Record<number, DistrictId | null>` or a typed array. GES to confirm save state format
   before locking the schema.

3. **zundo snapshot depth:** Default zundo keeps all history in memory. For a game with
   hundreds of precincts and potentially long sessions, a history limit (`limit: 50`) or
   diff-based approach is needed. Recommend `limit: 100` as a production default; ARCH
   to validate.

4. **Precinct count and rendering performance:** 56 precincts render instantly. The vision
   targets "hundreds" of precincts. At 300+, SVG path join re-renders may need
   optimisation (key comparison, requestAnimationFrame batching). Needs a follow-on
   render-performance spike before committing to SVG at production scale.

5. **Brush interaction on mobile:** The current brush uses `mousedown`/`mousemove`/
   `mouseup`. Touch events are separate. If mobile is ever in scope, the interaction model
   needs rethinking (brush vs tap-to-assign vs lasso).

---

## Recommended Stack Adjustments

The core stack (TypeScript + Vite + D3 + Zustand) is **validated**. No major changes
recommended. Specific refinements for production:

- **Replace `Map<id, DistrictId>` with `number[]` indexed by precinct id** for O(1)
  lookup, trivial JSON serialisation, and clean zundo diffs.
- **Add `limit: 100` to zundo options** to bound memory usage.
- **Consider React for the sidebar/controls** (results panel, district selector) while
  keeping D3 for the map SVG. Pure D3 DOM manipulation for UI controls is ergonomically
  poor at scale; React + D3 split ownership is the recommended pattern for larger UIs.
- **Biome is the right formatter/linter choice.** Fast, single-config, catches real issues.
  Keep it.
- **No Bazel integration yet** — SPIKE-002 handles this. The npm project is fully
  independent as intended.

---

## Map Generator Approach Used

**Population distribution:** Gaussian mixture model with 2–3 randomly-placed epicenters.
Each precinct's population is computed as a sum of weighted Gaussian contributions
(`weight × exp(-d²/2σ²)`) from each epicenter, where `d` is the Euclidean distance in
hex-grid space. This produces dense urban cores with sparse periphery and optional
secondary clusters — the standard synthetic-geography approach used in redistricting
research and game procedural generation. Scaled to population range 500–8000.

**Partisan lean:** Three overlapping sinusoidal waves at random angles, frequencies, and
phases (all low-frequency, 0.15–0.5 cycles per hex unit). Combined via summation and
normalised to [0, 1]. This produces a spatially coherent lean field where nearby precincts
are correlated without hardcoding urban/rural assumptions or referencing real geography.
Minor parties (L, G, I) receive small random allocations per precinct; R and D share the
remainder proportional to the lean field.

**Rationale:** Both choices are "informed simple" — defensible, fast to compute,
sufficient for educational gameplay, and easy to parameterise per scenario.
