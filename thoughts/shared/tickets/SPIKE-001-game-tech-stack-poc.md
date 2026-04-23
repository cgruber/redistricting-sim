---
id: SPIKE-001
title: Game tech stack proof-of-concept
area: frontend, game, architecture
status: open
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

## jj Discipline (CRITICAL for parallel spike work)

This spike runs in parallel with SPIKE-002 (build system). To avoid conflicts:

1. Before starting, confirm the working copy (@) is on a fresh change descended from
   main: `jj log`
2. Create a dedicated jj workspace for this spike:
   `jj workspace add ../redistricting-sim-spike-001`
   Work exclusively in that workspace directory.
3. All commits in this spike's change stack touch only `spike/001-game-poc/**`.
4. Create bookmark: `jj bookmark create spike/001-game-poc -r @`
5. Push and open PR only when **all acceptance criteria are met and `SPIKE-REPORT.md` is written**.

**Commit workflow during the spike:** commit after each logical chunk; run `npm test`
before each commit; squash small fixes into the relevant commit freely. No PR during
active execution — one PR at completion covers the whole spike.

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

Spike is done when all acceptance criteria are checked and a short written report is
added to `spike/001-game-poc/SPIKE-REPORT.md` covering:
- What worked well
- What was harder than expected
- Any open questions for GES/ARCH
- Recommended adjustments to the planned stack (if any)
