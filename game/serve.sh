#!/usr/bin/env bash
set -euo pipefail

# bazel run sets BUILD_WORKSPACE_DIRECTORY to the workspace root (game/).
DIST="${BUILD_WORKSPACE_DIRECTORY}/_serve_dist"
BAZEL_BIN="${BUILD_WORKSPACE_DIRECTORY}/bazel-bin"

rm -rf "${DIST}"
mkdir -p "${DIST}"

# WASM binding outputs: {name}.js, {name}_bg.wasm (no-modules target)
cp "${BAZEL_BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen.js" "${DIST}/"
cp "${BAZEL_BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen_bg.wasm" "${DIST}/"

# esbuild bundle (TypeScript + npm deps bundled into a single file)
cp "${BAZEL_BIN}/web/bundle.js" "${DIST}/"

# HTML entry point (served from source)
cp "${BUILD_WORKSPACE_DIRECTORY}/web/index.html" "${DIST}/"

echo "Serving on http://localhost:58080 (Ctrl-C to stop)"
cd "${DIST}" && python3 -m http.server 58080
