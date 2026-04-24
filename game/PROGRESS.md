working-dir: /Users/cgruber/Projects/github/cgruber/redistricting-sim/game/
status: Complete — all ACs met; ready to commit and PR
AC:
  [x] game/ Bazel workspace (MODULE.bazel, bzlmod only)
  [x] TypeScript migrated to game/web/src/; bazel build //web/... succeeds
  [x] Rust migrated to game/rust/; bazel build //rust/... succeeds
  [x] TypeScript calls WASM at runtime (end-to-end verified in browser)
  [x] bazel test //... passes (Rust unit tests + TypeScript type-check)
  [x] bazel run //:serve serves the game; hex map renders; WASM diagnostic shown
  [x] WASM type import pattern documented (no-modules; declare const in main.ts)
  [x] game/ hermetic assessment documented (BUILD-NOTES.md)
decisions:
  esbuild bundling (aspect_rules_esbuild): needed to resolve bare npm imports in browser
  no-modules WASM target: continue v1 standard; web target + .d.ts import deferred
  pnpm-lock.yaml generated via npx pnpm@9 (no global pnpm install)
  ts_project for type-checking, esbuild for bundling (standard aspect pattern)
  zustand/vanilla subpath: zustand 5.x main entry pulls React; vanilla avoids it
  react/react-dom marked external in esbuild: belt-and-suspenders guard
  esbuild Bazel 9.x patch: removes incompatible_use_toolchain_transition
blockers: none
