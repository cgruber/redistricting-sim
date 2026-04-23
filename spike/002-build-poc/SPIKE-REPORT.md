# SPIKE-002: Harmonized Bazel Build PoC — Report

**Date:** 2026-04-23
**Stack:** Bazel 9.1.0 + bzlmod + rules_rust 0.70.0 + rules_rust_wasm_bindgen 0.70.0 +
aspect_rules_ts 3.8.8 + aspect_rules_js 2.9.2 + rules_nodejs 6.7.4
**Status:** Complete — all AC verified

---

## What Was Built

- TypeScript (`main.ts`) compiled to `main.js` by `ts_project` (aspect_rules_ts 3.8.8)
  with a Bazel-managed TypeScript 5.6.2 toolchain — no npm/pnpm install required
- Rust `add(a: u32, b: u32) -> u32` function compiled to WASM via `rust_wasm_bindgen`
  (no-modules target) — 3 native Rust unit tests pass via `//rust:calc_test`
- `index.html` loads the wasm-bindgen no-modules glue, initializes the WASM binary,
  then injects `main.js`; TypeScript calls `wasm_bindgen.add(2, 3)` and displays `5`
- `bazel run //:serve` assembles all outputs into a flat directory and serves on port 8080
- `bazel build //...` and `bazel test //...` both pass cleanly (2 test targets)

---

## Bazel Rules Versions Used

| Module | Version | Stability notes |
|---|---|---|
| `rules_rust` | 0.70.0 | Bazel 9.x explicitly listed; stable |
| `rules_rust_wasm_bindgen` | 0.70.0 | Matches rules_rust; no BCR version mismatch |
| `aspect_rules_ts` | 3.8.8 | Current stable; Bazel 9.x compatible |
| `aspect_rules_js` | 2.9.2 | Latest 2.x line; compatibility_level=1 |
| `rules_nodejs` | 6.7.4 | **Must be explicitly declared** (see friction below) |
| `rules_shell` | 0.6.1 | Needed for `sh_binary` (no longer builtin in bzlmod) |
| `platforms` | 1.0.0 | Needed for `@platforms//cpu:wasm32` constraint |

---

## What Worked Well

**Rust + wasm-bindgen integration:** Once the `platforms` dep was declared, the
`rust_wasm_bindgen` rule worked completely out of the box. The wasm-bindgen dep comes from
`@rules_rust_wasm_bindgen//3rdparty:wasm_bindgen` — no Cargo.toml needed. The `calc`
library (pure Rust, no WASM deps) and the `wasm_entry` binary (wraps calc for WASM) follow
a clean separation: native tests run on the library, WASM tests would run on the binding.

**Hermetic TypeScript toolchain:** `rules_ts_ext.deps(ts_version = "5.6.2")` +
`use_repo(rules_ts_ext, "npm_typescript")` downloads TypeScript at the exact version
specified and registers it as a Bazel toolchain. No `npm install`, no `pnpm`, no
`node_modules` in source control. The TypeScript compiler is fully Bazel-managed.

**Zero npm/pnpm for the core build:** The entire build — TypeScript + Rust + WASM — runs
with only `bazel build //...`. No separate package manager step.

**`rust_wasm_bindgen` output:** The rule produces `{name}.js`, `{name}.d.ts`, and
`{name}_bg.wasm` in `bazel-bin/rust/{name}/`. The generated TypeScript declarations and the
wasm-bindgen 0.2.x no-modules JS glue both worked correctly.

**Incremental builds:** After cold start, `bazel build //...` completes in ~2 seconds from
the disk cache. The separation of Rust (native test), Rust (WASM binary), and TypeScript
into distinct targets means only affected targets rebuild on change.

---

## What Was Harder Than Expected

**`rules_nodejs` must be explicitly overridden to 6.7.4:**
`aspect_rules_js` 2.9.2 declares `rules_nodejs >= 6.3.3`. The minimum (6.3.3) has a broken
`toolchain.bzl` that uses the `CcInfo` builtin symbol, which was removed in Bazel 9.x.
Fix: declare `bazel_dep(name = "rules_nodejs", version = "6.7.4")` in MODULE.bazel to
force MVS to the patched version that loads `CcInfo` from `@rules_cc`.
This is **setup friction** (one-time per project), not ongoing friction.

**`platforms` must be declared explicitly:**
`@platforms//cpu:wasm32` is used in `target_compatible_with` on the Rust WASM binary.
Without a `bazel_dep(name = "platforms", version = "1.0.0")` in MODULE.bazel, Bazel
cannot resolve `@platforms`. This was a simple missing dep, caught immediately by the
error message.

**`sh_binary` no longer builtin in bzlmod:**
In Bazel 9.x + bzlmod, `sh_binary` requires `load("@rules_shell//shell:sh_binary.bzl",
"sh_binary")`. The load path is `//shell:sh_binary.bzl` (not `//shell:defs.bzl` — there
is no `defs.bzl` in rules_shell 0.6.1). Minor but easy to trip on.

**`aspect_rules_ts` 3.x transpiler selection is mandatory:**
In 2.x, `ts_project` defaulted to tsc. In 3.x, the transpiler must be explicitly selected.
The simplest fix: add `common --@aspect_rules_ts//ts:default_to_tsc_transpiler` to
`.bazelrc`. This avoids setting `transpiler = "tsc"` on every `ts_project` rule.

**`tsconfig.json` must NOT have `outDir` or `rootDir`:**
`ts_project` copies the tsconfig to `bazel-bin/` and invokes tsc from there. If the
tsconfig has `"outDir": "."`, tsc automatically excludes the output directory (= bazel-bin
package dir) from its `include` scan. Since the source files are symlinked into bazel-bin
before compilation, they fall inside the excluded dir and tsc sees "No inputs found".
Fix: omit `outDir` and `rootDir` from the user tsconfig entirely — `ts_project` passes
`--rootDir` and `--outDir` as CLI flags.
This is **setup friction** (one-time per tsconfig), but the error message is cryptic enough
to warrant documenting.

---

## Hermeticity Assessment

| Item | Status |
|---|---|
| TypeScript compiler | Hermetic — fetched by `rules_ts_ext.deps(ts_version = ...)` |
| Rust toolchain (native) | Hermetic — `rust.toolchain(versions = ["1.85.0"])` |
| Rust toolchain (wasm32) | Hermetic — `extra_target_triples = ["wasm32-unknown-unknown"]` |
| wasm-bindgen CLI | Hermetic — built from source by `rules_rust_wasm_bindgen` |
| `serve.sh` HTTP server | **Not hermetic** — calls host `python3 -m http.server`. Acceptable for a dev-only serve target; production would use a Bazel-managed http server binary. |
| Node.js runtime | Hermetic — `rules_nodejs 6.7.4` + `aspect_rules_js` provides via toolchain |

---

## Friction Classification

**Setup friction (one-time):**
- Declaring `rules_nodejs 6.7.4` explicitly for Bazel 9.x compatibility
- Declaring `platforms 1.0.0` for wasm32 constraint
- Adding `default_to_tsc_transpiler` to .bazelrc
- Removing `outDir`/`rootDir` from tsconfig.json

**Ongoing friction (recurring):**
- None observed. The build graph is clean once set up. No workarounds needed per-target.

---

## Build Time

| Scenario | Time |
|---|---|
| First cold run (all toolchains fetched from network) | ~90s |
| After disk cache populated | ~2s |
| Incremental (single Rust file change) | ~5s (Rust compile) |
| Incremental (single TS file change) | <1s (cached ts toolchain) |

---

## Open Questions for BUILD / ARCH

1. **wasm-bindgen target type**: Used `no-modules` (global `wasm_bindgen` object) for the
   simplest HTML integration. Production will want `web` (ES modules) for tree-shaking and
   proper module semantics. Needs `ts_project` to import from the generated `.js` with the
   generated `.d.ts` in scope — pattern to work out in a follow-on.

2. **TypeScript importing wasm-bindgen types**: With `no-modules`, TypeScript uses an
   ambient `declare const wasm_bindgen: {...}`. With `web` target, TypeScript would import
   from the generated `{name}.js` and use the generated `{name}.d.ts`. The clean path for
   making Bazel-generated `.d.ts` files available as `deps` in `ts_project` is not yet
   confirmed — needs a follow-on PoC.

3. **aspect_rules_ts 3.x + aspect_rules_js 3.x**: The 3.x versions of both aspect modules
   were recently released (3.0.3 at time of spike). They have `compatibility_level = 1` but
   different internal APIs. A future version bump from 2.9.2 to 3.x should be validated —
   especially whether `rules_nodejs 6.7.4` is still needed or if 3.x resolves this.

4. **serve target hermeticity**: For production, the serve target should use a
   Bazel-managed HTTP server binary (e.g., `devserver` from aspect_rules_js, or a compiled
   Go/Rust server). The current `python3 -m http.server` is host-dependent.

5. **wasm32 dummy CC toolchain**: The `target_compatible_with = ["@platforms//cpu:wasm32"]`
   + `rust_wasm_bindgen` pattern worked without manually registering the dummy CC wasm32
   toolchain (mentioned in some docs). This may be auto-registered by
   `rules_rust_wasm_bindgen` in 0.70.0 — confirm if issues arise on other platforms.

---

## Go/No-Go Recommendation

**Go.** The Bazel build stack for TypeScript + Rust/WASM is validated:
- `bazel build //...` produces all artifacts hermetically
- `bazel test //...` runs all tests
- No ongoing friction (all friction was one-time setup)
- Build times are excellent after cold start
- The architecture scales cleanly: separate packages for `rust/` and `web/` with clear deps

Adopt this setup for the full game build. The main follow-on before production wiring is
resolving the TypeScript → WASM type import pattern (open question #2 above).
