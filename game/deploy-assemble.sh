#!/usr/bin/env bash
# deploy-assemble.sh — Build and assemble all game artifacts into a deploy directory.
#
# Usage:
#   ./deploy-assemble.sh [OUTPUT_DIR]
#
# If OUTPUT_DIR is not specified, defaults to _deploy_out/ in the game/ directory.
# The output directory is suitable for static hosting (GH Pages, Netlify, Porkbun, etc.).
#
# This script:
#   1. Runs bazel build for the app bundle, WASM, HTML, and CSS
#   2. Copies all artifacts + scenario JSON into the output directory
#   3. The output is a flat static site ready to serve

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "${SCRIPT_DIR}"

OUTPUT_DIR="${1:-${SCRIPT_DIR}/_deploy_out}"

echo "Building game artifacts..."
bazel build //web:app //web:html //rust:wasm_calc_bindgen 2>&1

BAZEL_BIN="${SCRIPT_DIR}/bazel-bin"

echo "Assembling deploy to ${OUTPUT_DIR}..."
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}/scenarios"

# HTML + CSS (from source)
cp web/index.html "${OUTPUT_DIR}/"
cp web/styles.css "${OUTPUT_DIR}/"

# JS bundle (from Bazel build)
cp "${BAZEL_BIN}/web/bundle.js" "${OUTPUT_DIR}/"

# WASM (from Bazel build)
cp "${BAZEL_BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen.js" "${OUTPUT_DIR}/"
cp "${BAZEL_BIN}/rust/wasm_calc_bindgen/wasm_calc_bindgen_bg.wasm" "${OUTPUT_DIR}/"

# Scenario JSON (from source)
cp scenarios/*.json "${OUTPUT_DIR}/scenarios/"

echo "Deploy assembled: $(find "${OUTPUT_DIR}" -type f | wc -l | tr -d ' ') files"
echo "  $(du -sh "${OUTPUT_DIR}" | cut -f1) total"
