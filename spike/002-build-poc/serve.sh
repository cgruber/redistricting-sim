#!/usr/bin/env bash
# Assembles built artifacts and serves them on localhost:8080.
# Run via: bazel run //:serve   (from spike/002-build-poc/)
set -euo pipefail

PORT="${PORT:-8080}"

# $BUILD_WORKSPACE_DIRECTORY is set by `bazel run` to the workspace root
# (i.e. spike/002-build-poc/). bazel-bin is a symlink from there.
WS="${BUILD_WORKSPACE_DIRECTORY}"
BIN="${WS}/bazel-bin"
DIST="${BIN}/_serve_dist"

mkdir -p "${DIST}"
cp -f "${BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen.js"       "${DIST}/"
cp -f "${BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen_bg.wasm"  "${DIST}/"
cp -f "${BIN}/web/src/main.js"                                   "${DIST}/"
cp -f "${WS}/web/index.html"                   "${DIST}/"

echo "Serving spike-002 at http://localhost:${PORT}"
echo "Open http://localhost:${PORT} to verify: '2 + 3 = 5' should appear."
exec python3 -m http.server "${PORT}" --directory "${DIST}"
