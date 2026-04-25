#!/usr/bin/env bash
# e2e_test.sh — Bazel sh_test wrapper for Playwright behavioral tests.
#
# This script:
#   1. Assembles Bazel-built artifacts (bundle.js, WASM files, index.html)
#      into a temp directory using Bazel runfiles.
#   2. Starts python3 -m http.server on port 58173.
#   3. Runs npx playwright test against that server.
#   4. Kills the server on exit (pass or fail).
#
# Port 58173 is distinct from the dev serve port (58080) to avoid conflicts.
# There is no Vite dev server in this project — the app is statically served.
#
# Runfiles layout (module name "redistricting_sim" from MODULE.bazel).
# Bazel ≥ 7 uses canonical name _main for the current repo; we try both.
#   $RUNFILES_DIR/_main/web/bundle.js          (Bazel ≥ 7)
#   $RUNFILES_DIR/redistricting_sim/web/bundle.js  (older Bazel)
#   $RUNFILES_DIR/_main/scenarios/tutorial-001.json
#   $RUNFILES_DIR/_main/rust/wasm_calc_bindgen/wasm_calc_bindgen.js

set -euo pipefail

# ── Runfiles resolution ───────────────────────────────────────────────────────
# Bazel test runner sets RUNFILES_DIR. java_binary shell wrapper sets
# JAVA_RUNFILES. Check both for robustness (per project convention).
RUNFILES="${RUNFILES_DIR:-${JAVA_RUNFILES:-}}"
if [[ -z "${RUNFILES}" ]]; then
  echo "ERROR: neither RUNFILES_DIR nor JAVA_RUNFILES is set" >&2
  exit 1
fi

MODULE="redistricting_sim"
# Bazel ≥ 7 uses the canonical name (_main) for the current repo instead of
# the module name (redistricting_sim). Check both; prefer the explicit name.
if [[ -d "${RUNFILES}/${MODULE}" ]]; then
  RUNFILES_MOD="${RUNFILES}/${MODULE}"
elif [[ -d "${RUNFILES}/_main" ]]; then
  RUNFILES_MOD="${RUNFILES}/_main"
else
  echo "ERROR: runfiles module dir not found (tried ${MODULE} and _main under ${RUNFILES})" >&2
  exit 1
fi
WEB_BUNDLE="${RUNFILES_MOD}/web/bundle.js"
WEB_HTML="${RUNFILES_MOD}/web/index.html"
WASM_JS="${RUNFILES_MOD}/rust/wasm_calc_bindgen/wasm_calc_bindgen.js"
WASM_BG="${RUNFILES_MOD}/rust/wasm_calc_bindgen/wasm_calc_bindgen_bg.wasm"
SCENARIOS_DIR="${RUNFILES_MOD}/scenarios"

# ── Verify all required artifacts exist ──────────────────────────────────────
for f in "${WEB_BUNDLE}" "${WEB_HTML}" "${WASM_JS}" "${WASM_BG}"; do
  if [[ ! -f "${f}" ]]; then
    echo "ERROR: required artifact not found: ${f}" >&2
    echo "  RUNFILES_MOD=${RUNFILES_MOD}" >&2
    echo "  RUNFILES_DIR=${RUNFILES_DIR:-<unset>}" >&2
    echo "  JAVA_RUNFILES=${JAVA_RUNFILES:-<unset>}" >&2
    exit 1
  fi
done

# ── Assemble serve directory ──────────────────────────────────────────────────
SERVE_DIR="$(mktemp -d)"
cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${SERVE_DIR}"
}
trap cleanup EXIT

cp "${WEB_HTML}"   "${SERVE_DIR}/index.html"
cp "${WEB_BUNDLE}" "${SERVE_DIR}/bundle.js"
cp "${WASM_JS}"    "${SERVE_DIR}/wasm_calc_bindgen.js"
cp "${WASM_BG}"    "${SERVE_DIR}/wasm_calc_bindgen_bg.wasm"

# Scenario JSON files (fetched at runtime by the app)
if [[ -d "${SCENARIOS_DIR}" ]]; then
  mkdir -p "${SERVE_DIR}/scenarios"
  cp "${SCENARIOS_DIR}/"*.json "${SERVE_DIR}/scenarios/"
fi

# ── Start HTTP server ─────────────────────────────────────────────────────────
PORT=58173
python3 -m http.server "${PORT}" --directory "${SERVE_DIR}" >/dev/null 2>&1 &
SERVER_PID=$!

# Wait for the server to be ready (up to 10 seconds)
SERVER_READY=0
for i in $(seq 1 20); do
  if python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/')" 2>/dev/null; then
    SERVER_READY=1
    break
  fi
  sleep 0.5
done
if [[ "${SERVER_READY}" -eq 0 ]]; then
  echo "ERROR: HTTP server on port ${PORT} did not become ready after 10 seconds" >&2
  exit 1
fi

# ── Resolve workspace root (for playwright.config.ts) ────────────────────────
# Playwright config is at game/web/playwright.config.ts.
# BUILD_WORKSPACE_DIRECTORY is set when running via `bazel run`, but for
# `bazel test` we need to find the workspace root another way.
# The script lives at game/web/e2e_test.sh; under runfiles it's at:
#   $RUNFILES/redistricting_sim/web/e2e_test.sh
# The workspace root (game/) is the parent of web/ in the source tree.
# We resolve it relative to the script's real location in the source tree,
# falling back to BUILD_WORKSPACE_DIRECTORY if set.
WORKSPACE_DIR="${BUILD_WORKSPACE_DIRECTORY:-}"
if [[ -z "${WORKSPACE_DIR}" ]]; then
  # Derive from script path: the script is in $WORKSPACE/web/, so go two levels
  # up from its runfiles location to get the workspace root.
  # Note: use cd+pwd -P instead of readlink -f (macOS BSD readlink lacks -f).
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  WORKSPACE_DIR="$(dirname "${SCRIPT_DIR}")"
fi

PLAYWRIGHT_CONFIG="${WORKSPACE_DIR}/web/playwright.config.ts"
if [[ ! -f "${PLAYWRIGHT_CONFIG}" ]]; then
  echo "ERROR: playwright.config.ts not found at ${PLAYWRIGHT_CONFIG}" >&2
  exit 1
fi

# ── Run Playwright ────────────────────────────────────────────────────────────
# Bazel test runner may strip the user's PATH (e.g. /opt/homebrew/bin absent).
# Extend PATH with common node/npm locations so npx is accessible.
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"
cd "${WORKSPACE_DIR}"
npx playwright test --config "web/playwright.config.ts"
exit $?
