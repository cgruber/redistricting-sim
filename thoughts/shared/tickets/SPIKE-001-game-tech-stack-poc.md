---
id: SPIKE-001
title: Game tech stack proof-of-concept
area: frontend, game, architecture
status: complete
created: 2026-04-23
---

## Summary

Validate the TypeScript + SVG/D3 + Zustand stack for the redistricting game through a
minimal working prototype. This spike answers: does this approach feel right to build
and play? It is not production code — correctness and polish are out of scope.

## Goals / Acceptance Criteria

- [ ] A fictional region of ~50 precincts rendered as SVG polygons, defined in a
      GeoJSON-like format stored as a static JSON file
- [ ] Precincts are paintable into districts using a brush stroke (mouse down +
      drag assigns precincts to the district where the stroke began)
- [ ] At least 2 districts; district boundaries visible as edges between assigned precincts
- [ ] A simple election simulation runs after each edit: each precinct has a partisan
      vote-share percentage; district winner = majority party; results displayed as text
- [ ] Undo/redo of at least one brush stroke (Zustand + zustand-travel or equivalent)
- [ ] `npm install && npm start` brings up a working browser page
- [ ] No server — fully static/client-side

## Out of Scope for This Spike

- Production quality, error handling, accessibility
- Validity indicators (population balance, contiguity)
- Animations or test sequence
- More than ~50 precincts
- Any Bazel integration (see SPIKE-002)

## Working Directory

`spike/001-game-poc/` — this is a completely independent source root. It has its own
`package.json`, `tsconfig.json`, and toolchain. Do not modify any files outside
`spike/001-game-poc/`. Do not import from or depend on anything outside this directory.

## jj Discipline

Work directly in the main repo checkout. All spike files live under `spike/001-game-poc/`
inside the repo — do not create sibling directories or jj workspaces.

1. Before starting: `jj log` — confirm `@` is a fresh empty change descended from main.
   If not, run `jj new main` to start one.
2. All commits touch only `spike/001-game-poc/**` — no other repo files.
3. Create a bookmark before your first push:
   `jj bookmark create spike/001-game-poc -r @`
4. Push and open PR only when **all acceptance criteria are met and `SPIKE-REPORT.md` is written**.

**Commit workflow during the spike:** commit after each logical chunk; run `npm test`
before each commit; squash small fixes freely. No PR during active execution — one PR
at completion covers the whole spike.

## Map Generation

The spike region must be procedurally generated — do not hand-author 50 precincts.
The generator itself is part of the spike deliverable.

**Geometry:** Regular hexagonal grid (e.g. 7×8 offset grid ≈ 50 cells). Hex grids give
natural 6-neighbor adjacency without the artificial look of a square grid. Adjacency can
be derived directly from grid coordinates at generation time and stored in the precinct
data (no need to compute it at runtime).

**Population distribution:** Place 1–3 epicenters at fixed or randomly chosen grid
positions. Each precinct's population is the sum of contributions from each epicenter,
with contribution falling off with distance. This produces realistic clustering —
dense urban cores, sparse periphery, occasional secondary clusters — without requiring
real geographic data.

**Partisan lean:** Assign a lean that has geographic coherence — nearby precincts should
have correlated lean, not independent noise. A smooth random field (e.g. low-frequency
noise or a 2D sinusoidal gradient) mapped to party share works well. Do **not** hardcode
real-world urban/rural stereotypes; this is a fictional region.

**Before implementing the generator:**

1. Create `PROGRESS.md` from the template in AGENTS.md (see Spike Checkpointing).
2. Spin up a Domain Researcher subagent to investigate:
   - State-of-the-art or widely-used approaches for cheaply simulating realistic
     population distribution snapshots (Gaussian mixture? gravity model? something else
     in the redistricting or synthetic-geography literature?)
   - Whether redistricting research uses established parameterizations for synthetic
     partisan geographic distributions
3. The researcher returns findings as text. Write a one-paragraph summary into
   `PROGRESS.md`'s Decisions section before coding the generator.

The goal is "informed simple" — pick a defensible approach, not the most sophisticated
one. The generator is a means to an end; the spike is about the game stack.

## Precinct Data Format

The spike's static JSON file should prototype the structure that production will use.
Design it with this in mind — spike format can be looser, but should prove the shape.

**Required fields per precinct:**

- `id` — unique identifier (integer or short string)
- `neighbors` — adjacency list of neighbor IDs (prefer adjacency over raw coordinates if
  using an abstract grid; use coordinates if doing real geographic projection)
- `partyShare` — partisan vote-share as floats (0.0–1.0), keys: `R`, `D`, `L`, `G`, `I`
  (Republican, Democrat, Libertarian, Green, Independent); must sum to 1.0
- `previousResult` — simulated prior election winner (`R` | `D` | `L` | `G` | `I`) and
  margin (e.g. `{ winner: "D", margin: 0.07 }`)
- `demographics` — at least one additional demographic breakdown to prove multi-property
  modeling; use sex/gender for the spike: `{ male: 0.49, female: 0.49, nonbinary: 0.02 }`

**Production considerations** (for the SPIKE-REPORT.md to comment on):
- IDs should stay compact (integer preferred)
- Percentages as floats (0.0–1.0) rather than integers save a parse step and prevent
  off-by-one rounding when summing
- Adjacency list is sufficient for contiguity checks without needing full polygon topology

**Agent latitude:** if the simulation model needs additional fields (population count,
area, historical partisan lean, etc.) propose them in the data format before committing
to the schema — the spike is the right time to surface missing properties.

## Tech Stack to Use

- TypeScript (strict mode)
- Vite as dev server / bundler (fastest path to `npm start`)
- D3.js for SVG rendering and GeoJSON path projection
- Zustand for state management
- zustand-travel or zundo for undo/redo
- No React required for this spike (D3 can own the DOM); add React only if it feels necessary

## TypeScript Quality Standards (agent guidance)

When writing TypeScript for this spike, follow these standards:

**Compiler settings** — `tsconfig.json` must include:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**No `any`** — use `unknown` where the type is genuinely unknown and narrow it. Never
use `any` as a shortcut. If a D3 or external type is imprecise, use a type assertion
with a comment explaining why.

**Module structure** — separate concerns into distinct modules from the start:
- `src/model/` — pure data types (Precinct, District, GameState, SimulationResult)
- `src/simulation/` — election computation (pure functions, no DOM, no D3)
- `src/render/` — D3 SVG rendering (reads state, does not mutate it)
- `src/store/` — Zustand store and undo/redo wiring

**D3 idiomatic patterns**:
- Use the data join pattern (`selection.data(data).join(...)`) not manual append loops
- Bind data to DOM nodes; let D3 manage enter/update/exit
- Keep D3 selections typed: `d3.Selection<SVGPathElement, PrecinctFeature, SVGGElement, unknown>`
- Avoid mixing D3 DOM manipulation with React (if React is added)

**Zustand idiomatic patterns**:
- Define the store with a typed interface; no implicit `any` in `set()`
- Use slices if state grows beyond 5-6 fields
- Mutations only inside `set()` callbacks — never mutate state objects directly
- For undo/redo: wrap with zustand-travel; pass precinct assignment arrays as diffs,
  not full state snapshots

**Formatting** — use Biome (faster than ESLint+Prettier, single config):
```bash
npm install --save-dev @biomejs/biome
npx biome format --write .
```
Run before every commit. Formatting-only commits are valid standalone PRs.

**No mixing concerns** — simulation functions must be pure (no side effects, no DOM
access). They take a GameState and return a SimulationResult. This makes them trivially
testable and easy to move to WASM later if needed.

## Reference Architecture

Study the `dra2020` GitHub organization (https://github.com/dra2020) — particularly
`dra-types` (type definitions) and `dra-analytics` (partisan metrics). Their separation
of analytics from rendering is the pattern to follow.

The game vision is at `thoughts/shared/vision/game-vision.compressed.md`.

## Definition of Done

Spike is done when all acceptance criteria are checked and:

1. `spike/001-game-poc/SPIKE-REPORT.md` is written covering:
   - What worked well
   - What was harder than expected
   - Any open questions for GES/ARCH
   - Recommended adjustments to the planned stack (if any)
   - Map generator: which population distribution approach was used and why

2. `spike/001-game-poc/PROGRESS.md` is updated to `Status: Complete` with all criteria
   checked — this is the clean handoff signal for the coordinating agent.
