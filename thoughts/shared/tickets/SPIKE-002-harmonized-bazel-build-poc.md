---
id: SPIKE-002
title: Harmonized Bazel build proof-of-concept
area: build, tooling, architecture
status: complete
created: 2026-04-23
---

## Summary

Validate that the game's eventual tech stack (TypeScript frontend + optional Rust→WASM
kernel) can be built, tested, and served from a single Bazel build graph. This spike
proves the build system — it does not implement game logic.

The output is a minimal working project that can be built entirely with `bazel build //...`
and served with `bazel run //spike/002-build-poc:serve` (or equivalent).

## Goals / Acceptance Criteria

- [ ] A TypeScript "hello world" web page, compiled by `rules_ts` (aspectbuild), served
      by a simple Bazel-runnable file server
- [ ] A Rust function compiled to WASM via `wasm-bindgen` / `wasm-pack`, callable from
      the TypeScript page (function may be trivial: e.g. `add(a: u32, b: u32) -> u32`)
- [ ] The TypeScript page calls the Rust/WASM function and displays the result
- [ ] `bazel build //spike/002-build-poc/...` builds all targets with no errors
- [ ] `bazel test //spike/002-build-poc/...` runs at least one test (TypeScript unit test or
      Rust unit test) with no failures
- [ ] A brief `MODULE.bazel` scoped to `spike/002-build-poc/` only (or the repo root if
      required by Bazel), using bzlmod exclusively — no WORKSPACE file

## Out of Scope for This Spike

- Any game logic
- Integration with `spike/001-game-poc/` (that comes after both spikes complete)
- Production-quality build configuration (caching, remote execution, CI)
- Mobile or cross-platform targets

## Bazel Preference and Fallback Threshold

**Strong preference for Bazel.** Give it a genuine, thorough attempt before considering
fallback. When friction is encountered, first classify it:

- **Setup friction (one-time cost):** complex `MODULE.bazel` wiring, toolchain registration,
  first-run cache population. This is absorbable — it pays for itself in every subsequent
  build. Do not trigger fallback for setup friction alone.
- **Ongoing friction (recurring cost):** workarounds that must be maintained every time a
  new target is added, Bazel bugs that regularly resurface, build graph clutter required
  to paper over a fundamental gap in the rules. This is the real signal to reconsider.

**Hybrid is also a valid outcome.** Both `rules_ts` and `rules_rust` consume a native
lockfile (`package-lock.json` / `Cargo.lock`) and translate it into a Bazel-managed
dependency graph — Bazel owns the fetch and build, but the lockfile is generated and
updated with native tooling (`npm install --package-lock-only` / `cargo update`). A result
where Bazel orchestrates the full build graph via translated lockfiles is the intended
design, not a compromise — document the setup steps and evaluate repeatability.

**Fallback (only if ongoing friction is severe):**

- **Rust → WASM:** `cargo` + `wasm-pack` directly (not Bazel-managed)
- **TypeScript:** `yarn` / `npm` + standard bundler (Vite or esbuild)
- **Integration:** a `Makefile` with explicit targets for build, test, and serve
- **Hermeticity:** not guaranteed; mitigated by version pinning, `cargo.lock`, `package-lock.json`,
  and documentation of host-tool requirements

The SPIKE-REPORT.md must classify any friction encountered (setup vs. ongoing), state
whether fallback was triggered and why, and give a clear go/no-go on Bazel adoption.
A fallback outcome is valid — but it should be a considered decision, not a first response
to setup difficulty.

## Working Directory

`spike/002-build-poc/` — this is a completely independent source root with its own
`MODULE.bazel`, toolchain configuration, and build graph. Do not modify files outside
`spike/002-build-poc/`.

Bazel structure note: Bazel requires `MODULE.bazel` at the workspace root. Place it
at `spike/002-build-poc/MODULE.bazel` and run all Bazel commands from within that
directory (`cd spike/002-build-poc && bazel build //...`). This keeps the spike
fully self-contained and avoids touching the repo root.

## jj Discipline

Work directly in the main repo checkout. All spike files live under `spike/002-build-poc/`
inside the repo — do not create sibling directories or jj workspaces.

1. Before starting: `jj log` — confirm `@` is a fresh empty change descended from main.
   If not, run `jj new main` to start one.
2. All commits touch only `spike/002-build-poc/**` — no other repo files.
3. Create a bookmark before your first push:
   `jj bookmark create spike/002-build-poc -r @`
4. Push and open PR only when **all acceptance criteria are met and `SPIKE-REPORT.md` is written**.

**Commit workflow during the spike:** commit after each logical chunk; run
`bazel test //...` (or fallback equivalent) before each commit; squash small fixes
freely. No PR during active execution — one PR at completion covers the whole spike.

## Reference: polyglot Exemplar

The `polyglot` monorepo at `../../geekinasuit/polyglot/` (relative to this repo) is
an exemplar for Bazel + Kotlin + Rust builds. Read it for patterns; do not write to it.

Relevant polyglot paths to study:
- `polyglot/MODULE.bazel` — bzlmod dependency setup including Rust rules
- `polyglot/rust/` — Rust build targets; `BUILD.bazel` + source structure
- `polyglot/kotlin/BUILD.bazel` — `java_binary` + `runtime_deps` pattern
- `polyglot/util/kt_jvm_proto.bzl` — custom macro pattern (may be useful for WASM)
- `polyglot/.bazelrc` — `--config=ci` setup, disk cache config

The polyglot repo has Rust building in Bazel. Use that as the starting point for the
Rust→WASM target; the WASM-specific toolchain additions are the new territory to prove.

## Bazel Quality Standards (agent guidance)

When writing Bazel BUILD files and MODULE.bazel for this spike:

**bzlmod only** — `MODULE.bazel` is the only dependency management mechanism.
No `WORKSPACE` file. No `http_archive`. Everything via `bazel_dep()`.

**rules_ts (aspectbuild)** — use the aspectbuild TypeScript rules:
```
bazel_dep(name = "aspect_rules_ts", version = "...")
```
The repo owner knows the aspectbuild maintainers; these rules are production-grade.
Use `ts_project()` for TypeScript compilation. Avoid `genrule` workarounds.

**rules_rust** — use the official `rules_rust`:
```
bazel_dep(name = "rules_rust", version = "...")
```
For WASM targets, use `rust_wasm_bindgen()` (part of rules_rust). Consult the
rules_rust WASM documentation and the polyglot exemplar.

**Hermetic builds** — all tools (TypeScript compiler, wasm-pack, node) must come from
Bazel-managed toolchains, not from the host PATH. If a tool requires the host PATH,
that is a finding to report.

**Minimal targets** — do not add targets without a clear reason. Package-pinning
`BUILD.bazel` files (empty or near-empty) at directory roots are intentional.

**Never commit generated code** — WASM bindings generated by `wasm-bindgen` and
TypeScript outputs are derived at build time. Add them to `.gitignore`.

**Target naming** — follow the convention: source targets lowercase-with-hyphens,
test targets `*_test`. Keep names descriptive.

## Rust Quality Standards (agent guidance)

When writing Rust code for this spike:

**Edition** — use Rust 2021 edition (`edition = "2021"` in `Cargo.toml` / BUILD target).

**Warnings as errors in CI** — add `#![deny(warnings)]` to library roots, or configure
via Bazel's `rustc_flags`.

**wasm-bindgen discipline**:
- Keep the Rust/JS boundary coarse-grained: pass primitives and typed arrays, not
  object graphs. This is the primary pitfall of `wasm-bindgen` — ownership transfer
  of complex types causes hard-to-debug runtime panics.
- Annotate every public WASM-exported function with `#[wasm_bindgen]` explicitly.
- Add `wasm_bindgen_test` crate for browser-side unit tests (optional for spike but
  document if the testing path is clear).

**No `unwrap()` in WASM exports** — panics in WASM produce opaque errors. Use
`Result<T, JsValue>` returns and propagate errors explicitly.

**Formatting** — `rustfmt` on all Rust files before commit:
```bash
rustfmt <changed-files>   # or: cargo fmt
```

## Definition of Done

Spike is done when all acceptance criteria are checked and:

1. `spike/002-build-poc/SPIKE-REPORT.md` is written covering:
   - Which Bazel rules versions were used and whether they were stable
   - Any hermeticity gaps found (tools from host PATH, generated files not gitignored, etc.)
   - Friction classification: what was setup friction (one-time) vs. ongoing friction
   - Build time for a clean build (baseline for future optimisation)
   - Any open questions for the BUILD specialist or ARCH
   - Go/no-go recommendation for adopting this build setup for the full game

2. `spike/002-build-poc/PROGRESS.md` is updated to `Status: Complete` with all criteria
   checked — this is the clean handoff signal for the coordinating agent.
