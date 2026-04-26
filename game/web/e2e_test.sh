#!/usr/bin/env bash
# e2e_test.sh — Bazel sh_test wrapper for Playwright behavioral tests.
#
# This script:
#   1. Assembles Bazel-built artifacts (bundle.js, WASM files, index.html)
#      into a temp directory using Bazel runfiles.
#   2. Starts python3 -m http.server on port 58173.
#   3. Runs pnpm exec playwright test against that server.
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

# ── Resolve workspace root ────────────────────────────────────────────────────
# @playwright/test and its transitive deps are declared as Bazel data deps via
# //:node_modules/@playwright/test, ensuring the cache key includes playwright's
# version.  At runtime we use the physical node_modules installed by setup.sh
# so that the playwright runner and spec files share a single module instance —
# a prerequisite for playwright's internal test registry to work.
#
# We locate the workspace root (game/) via a single readlink on the declared
# runfiles symlink for playwright.config.ts.  This is a one-hop resolution that
# lands in the current workspace's source tree; it never escapes to a stale
# workspace the way recursive BASH_SOURCE symlink-following can.
PLAYWRIGHT_CONFIG_LINK="${RUNFILES_MOD}/web/playwright.config.ts"
if [[ ! -L "${PLAYWRIGHT_CONFIG_LINK}" ]]; then
  echo "ERROR: playwright.config.ts not found as a runfiles symlink: ${PLAYWRIGHT_CONFIG_LINK}" >&2
  exit 1
fi
# Single readlink (not -f): resolves one symlink hop to the real source file.
PLAYWRIGHT_CONFIG_REAL="$(readlink "${PLAYWRIGHT_CONFIG_LINK}")"
WORKSPACE_DIR="$(dirname "$(dirname "${PLAYWRIGHT_CONFIG_REAL}")")"

PLAYWRIGHT_BIN="${WORKSPACE_DIR}/node_modules/.bin/playwright"
if [[ ! -f "${PLAYWRIGHT_BIN}" ]]; then
  echo "ERROR: node_modules/.bin/playwright not found at ${PLAYWRIGHT_BIN}" >&2
  echo "  Run: cd game && ./setup.sh" >&2
  exit 1
fi

# ── Run Playwright ────────────────────────────────────────────────────────────
# Bazel test runner may strip the user's PATH (e.g. /opt/homebrew/bin absent).
# Extend PATH so node is reachable.
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

# Bazel's test runner redirects $HOME to a sandbox temp dir for test isolation.
# Playwright looks for its managed Chromium under $HOME/Library/Caches/ms-playwright
# (macOS) or $HOME/.cache/ms-playwright (Linux), which resolves to the fake HOME.
# Override PLAYWRIGHT_BROWSERS_PATH with the real user's cache.
# ~$(id -un) expands via the OS password database, bypassing the $HOME variable.
REAL_HOME="$(eval echo "~$(id -un)")"
export PLAYWRIGHT_BROWSERS_PATH="${REAL_HOME}/Library/Caches/ms-playwright"

cd "${WORKSPACE_DIR}"
"${PLAYWRIGHT_BIN}" test --config "web/playwright.config.ts"
exit $?
