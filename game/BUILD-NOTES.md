# BUILD-NOTES: game/ Bazel Workspace

## How to build and run

```sh
cd game/
bazel build //...      # build everything
bazel test //...       # run all tests (Rust unit + TypeScript type-check)
bazel run //:serve     # serve at http://localhost:8080
```

## Dependency versions (MODULE.bazel)

| Module | Version | Notes |
|---|---|---|
| bazel_skylib | 1.8.2 | |
| aspect_rules_ts | 3.8.8 | ts_project for type-checking |
| aspect_rules_esbuild | 0.21.0 | bundling; patched for Bazel 9.x |
| aspect_rules_js | 2.9.2 | npm_translate_lock (pnpm lockfile) |
| rules_nodejs | 6.7.4 | explicit override; aspect_rules_js carries 6.3.3 min; 6.7.4 fixes CcInfo removal in Bazel 9.x |
| rules_rust | 0.70.0 | |
| rules_rust_wasm_bindgen | 0.70.0 | |
| TypeScript (via rules_ts_ext) | 5.6.2 | |
| Rust toolchain | 1.85.0 | edition 2021; native + wasm32-unknown-unknown |

npm deps (d3 ^7.9.0, zustand ^5.0.3, zundo ^2.3.0) via pnpm lockfile.

## Hermeticity assessment

All tools (TypeScript compiler, esbuild, Rust toolchain) are fetched and managed by
Bazel — no host npm, pnpm, or rustup required at build time. `pnpm-lock.yaml` is
checked into the repo; `npx --yes pnpm@9 install --lockfile-only` regenerates it
without a global pnpm install.

`python3 -m http.server` in `serve.sh` is a dev convenience; it uses the host
Python. Not a build dependency.

## WASM type import pattern (v1 decision)

Uses wasm-bindgen `no-modules` target, which exposes a global `wasm_bindgen` object.
Type annotation in TypeScript is a `declare const`:

```typescript
declare const wasm_bindgen: { add(a: number, b: number): number };
```

The HTML loads the WASM glue script synchronously, initializes the WASM binary async,
then injects `bundle.js` as an ES module after WASM is ready. This avoids top-level
await in the bundle and works with any browser that supports ES2022 modules.

The `web` wasm-bindgen target (which generates proper `.d.ts` typings and an ES
module) is deferred to a future ticket when the WASM surface grows.

## Key non-obvious wiring decisions

**esbuild Bazel 9.x patch** — `aspect_rules_esbuild` 0.21.0 uses
`incompatible_use_toolchain_transition = True`, which was removed in Bazel 9.x.
Fixed via `single_version_override` + `patches/aspect_rules_esbuild_bazel9.patch`.

**zustand/vanilla subpath** — zustand 5.x's default entry point imports React.
The game uses zustand's vanilla store (no React). Importing from `zustand/vanilla`
avoids the React dependency. `react` and `react-dom` are also marked `external` in
the esbuild rule as a belt-and-suspenders guard.

**ts_project + esbuild separation** — `ts_project` provides type checking; `esbuild`
provides the browser bundle. `ts_project` does not produce a browser-ready artifact
(bare npm specifiers are not resolved). This is the standard aspect_rules_ts pattern.

**pnpm v9 onlyBuiltDependencies** — pnpm v9 requires explicit
`"pnpm": {"onlyBuiltDependencies": [...]}` in `package.json` or it rejects the
lockfile during `npm_translate_lock`. Set to `[]` since no build scripts are needed.
