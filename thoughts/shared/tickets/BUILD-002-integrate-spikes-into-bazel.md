---
id: BUILD-002
title: Integrate spike prototypes into a single Bazel build graph
area: build, tooling, architecture
status: resolved
created: 2026-04-24
---

## Summary

Merge the SPIKE-001 game prototype (TypeScript/Vite/D3/Zustand) and SPIKE-002 Bazel PoC
(rules_rust + rules_ts + Rust→WASM) into a single, unified source root under `game/` with
a single `bazel build //...` that produces the game. This is the first production-quality
build step — it establishes the `game/` directory as the canonical source root for all
subsequent game development.

## Goals / Acceptance Criteria

- [x] `game/` directory created as a new Bazel workspace (`game/MODULE.bazel`) descended
      from the SPIKE-002 build patterns (no WORKSPACE file; bzlmod only)
- [x] TypeScript source migrated from `spike/001-game-poc/src/` into `game/web/src/`
      compiled by `ts_project` (aspect_rules_ts 3.x); `bazel build //web/...` succeeds
- [x] Rust `calc` library and WASM binding migrated from `spike/002-build-poc/rust/` into
      `game/rust/`; `bazel build //rust/...` succeeds
- [x] TypeScript calls Rust/WASM function at runtime (end-to-end integration verified in
      browser; not just build-time type-check)
- [x] `bazel test //...` passes all migrated tests (Rust unit tests + TypeScript type-check)
- [x] `bazel run //:serve` (or equivalent) serves the game locally; hex map renders; election
      simulation runs; WASM add function called from TypeScript
- [x] WASM type import pattern resolved: `no-modules` + ambient-declare confirmed as v1
      standard; documented in BUILD-NOTES.md
- [x] `game/` is hermetic: all tools come from Bazel-managed toolchains; only exception is
      `python3 -m http.server` in serve.sh (dev convenience, not a build dep); documented
- [x] `game/BUILD-NOTES.md` documents version overrides, hermeticity assessment, WASM
      type import decision, and how to run

## Out of Scope

- Vite dev server (replaced by Bazel serve target; Vite config can be removed or kept for
  local dev if it doesn't complicate the build graph)
- New game features or scenarios (this ticket is build-only)
- Production bundling / minification
- CI integration (separate CI ticket)
- Mobile targets
- Removing the `spike/` directories (they stay as historical reference)

## Background

SPIKE-001 (`spike/001-game-poc/`) proved the TypeScript + D3.js + Zustand game mechanics:
hex-grid map generation, SVG rendering, election simulation, boundary editing, undo/redo.
Stack validated; go recommendation given.

SPIKE-002 (`spike/002-build-poc/`) proved the Bazel build: TypeScript compiled by rules_ts,
Rust compiled to WASM via rules_rust_wasm_bindgen, TypeScript calling WASM at runtime.
Go recommendation given. Key configuration decisions documented in SPIKE-002 SPIKE-REPORT.md.

This ticket brings them together. The spike source roots (`spike/001-game-poc/` and
`spike/002-build-poc/`) are read-only references — do not modify them.

## Key Build Decisions Inherited from SPIKE-002

- Bazel 9.1.0 + bzlmod (no WORKSPACE); run all Bazel commands from `game/`
- `rules_rust 0.70.0` + `rules_rust_wasm_bindgen 0.70.0`
- `aspect_rules_ts 3.8.8` + `aspect_rules_js 2.9.2` + `rules_nodejs 6.7.4` (explicit, fixes CcInfo on Bazel 9.x)
- `rules_shell 0.6.1` for `sh_binary`
- `platforms 1.0.0` for `@platforms//cpu:wasm32`
- `.bazelrc` must include: `common --@aspect_rules_ts//ts:default_to_tsc_transpiler`
- `tsconfig.json` must NOT have `outDir` or `rootDir` (ts_project manages via CLI flags)
- TypeScript version: 5.6.2 (fetched by `rules_ts_ext.deps(ts_version = "5.6.2")`)
- Rust edition: 2021; `versions = ["1.85.0"]`; `extra_target_triples = ["wasm32-unknown-unknown"]`

## WASM Type Import Open Question

SPIKE-002 used `target = "no-modules"` with an ambient TypeScript declaration:
```ts
declare const wasm_bindgen: { add(a: number, b: number): number; };
```

For production the preferred path is `target = "web"` (ES modules) which generates proper
`.d.ts` + `.js` files importable by TypeScript. The pattern for making Bazel-generated `.d.ts`
available as `deps` in `ts_project` is not yet confirmed.

**Decision options for this ticket:**
1. Confirm `no-modules` + ambient declare as v1 standard (simpler; unblocks integration now;
   known limitation documented)
2. Prove the `web` target + generated `.d.ts` import pattern (better long-term; more work now)

Recommendation: attempt (2) first; fall back to (1) with documented rationale if (2)
requires ongoing-friction workarounds (per SPIKE-002 fallback policy).

## Working Directory

`game/` — new, independent source root. Treat it like SPIKE-002 treated `spike/002-build-poc/`:
Bazel workspace rooted at `game/MODULE.bazel`, all Bazel commands run from `game/`.

## jj Discipline

Work directly in main repo checkout. All files in `game/**` only.

1. Before starting: `jj log` — confirm `@` is a fresh empty change descended from main.
   If not: `jj new main`.
2. Create bookmark before first push: `jj bookmark create build/game-bazel-integration -r @`
3. Commit after each logical chunk; run `bazel test //...` before each commit.
4. PR when all acceptance criteria met and `game/BUILD-NOTES.md` written.

## Definition of Done

1. All acceptance criteria above are checked.
2. `game/BUILD-NOTES.md` written covering:
   - Final MODULE.bazel dependency versions and any version overrides
   - Hermeticity assessment (what's hermetic, what requires host tools)
   - WASM type import decision and rationale
   - How to run: build, test, serve from a fresh checkout
3. `PROGRESS.md` updated to `Status: Complete` in the working branch.
4. PR opened, critiqued, and merged to main.

## References

- `spike/002-build-poc/SPIKE-REPORT.md` — build configuration decisions + open questions
- `spike/001-game-poc/SPIKE-REPORT.md` — game stack decisions
- `spike/002-build-poc/MODULE.bazel` — reference MODULE.bazel
- `spike/002-build-poc/rust/BUILD.bazel` — reference rust targets
- `spike/002-build-poc/web/BUILD.bazel` — reference web targets
