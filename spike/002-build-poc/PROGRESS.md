working-dir: /Users/cgruber/Projects/github/cgruber/redistricting-sim/spike/002-build-poc/
status: Complete — all AC verified
AC:
  [x] TypeScript hello world compiled by rules_ts (aspectbuild), served by file server
  [x] Rust fn compiled to WASM via wasm-bindgen (rust_wasm_bindgen 0.70.0)
  [x] TypeScript page calls Rust/WASM function and displays result
  [x] bazel build //... passes (run from spike/002-build-poc/)
  [x] bazel test //... passes — 2 tests: //rust:calc_test + //web:app_typecheck_test
  [x] MODULE.bazel with bzlmod only (no WORKSPACE)
decisions:
  rules_rust 0.70.0 + rules_rust_wasm_bindgen 0.70.0 (Bazel 9.x compatible)
  aspect_rules_ts 3.8.8 + aspect_rules_js 2.9.2 (same compatibility_level=1)
  rules_nodejs 6.7.4 explicit dep (fixes CcInfo removal in Bazel 9.x)
  rules_shell 0.6.1 for sh_binary (no longer builtin in bzlmod)
  TypeScript via rules_ts_ext.deps() — no npm/pnpm install needed
  wasm-bindgen from @rules_rust_wasm_bindgen//3rdparty:wasm_bindgen — no Cargo.toml
  target="no-modules" wasm_bindgen (global wasm_bindgen object, simplest HTML integration)
  tsconfig must NOT have outDir/rootDir (ts_project manages via CLI flags)
  .bazelrc: default_to_tsc_transpiler (aspect_rules_ts 3.x mandatory transpiler selection)
friction-found:
  setup: rules_nodejs version override, platforms dep, tsconfig outDir/rootDir removal,
         .bazelrc transpiler flag, sh_binary load path — all one-time, none ongoing
blockers: none
