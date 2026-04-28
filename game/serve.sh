#!/usr/bin/env bash
set -euo pipefail

PORT=58080
OLD_PID=$(lsof -ti :"${PORT}" 2>/dev/null || true)
if [[ -n "${OLD_PID}" ]]; then
  echo "Stopping previous server (pid ${OLD_PID})…"
  kill "${OLD_PID}"
  while lsof -i :"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; do sleep 0.2; done
fi

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

# HTML entry point + CSS (served from source)
cp "${BUILD_WORKSPACE_DIRECTORY}/web/index.html" "${DIST}/"
cp "${BUILD_WORKSPACE_DIRECTORY}/web/styles.css" "${DIST}/"

# Scenario JSON files (fetched at runtime; not bundled by esbuild)
mkdir -p "${DIST}/scenarios"
cp "${BUILD_WORKSPACE_DIRECTORY}/scenarios/"*.json "${DIST}/scenarios/"

echo "Serving on http://localhost:${PORT} (Ctrl-C to stop)"
cd "${DIST}" && python3 -m http.server "${PORT}"
