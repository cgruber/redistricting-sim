#!/usr/bin/env bash
# lint_test.sh — Bazel sh_test wrapper for the Biome lint + format gate (GAME-107).
#
# This script:
#   1. Resolves the game/ workspace dir from Bazel runfiles (one readlink hop on
#      the declared biome.jsonc symlink — same trick e2e_test.sh uses for
#      playwright.config.ts).
#   2. Runs the physical `node_modules/.bin/biome ci game/web` over the source
#      tree. `biome ci` is the no-write CI mode: it checks BOTH formatting and the
#      enabled lint rules and exits nonzero on ANY violation.
#   3. Exits with biome's status, so a format or lint violation fails the gate.
#
# Why the physical binary (mirror of e2e_test.sh): biome is installed by
# `./setup.sh` (npm ci, from package-lock.json) into game/node_modules/.bin/biome,
# exactly like playwright. The Bazel npm repo is translated from pnpm-lock.yaml
# (which intentionally lags package-lock.json — see setup.sh), so there is no
# //game:node_modules/@biomejs/biome target to depend on. We invoke the physical
# binary directly, the same way e2e_test.sh runs node_modules/.bin/playwright.
#
# local = True + no-sandbox: biome runs outside the Bazel sandbox against the real
# node_modules. The linted SOURCE FILES are declared as `data` deps so that
# editing in a violation invalidates the cache and re-runs this test (without
# that, Bazel would serve a stale PASS — a silent gate hole).
#
# One-time setup outside Bazel:
#   cd game && ./setup.sh
#
# Run via: bazel test //game/web:lint_test

set -euo pipefail

# ── Runfiles resolution ───────────────────────────────────────────────────────
# Bazel test runner sets RUNFILES_DIR. Check JAVA_RUNFILES too (project convention).
RUNFILES="${RUNFILES_DIR:-${JAVA_RUNFILES:-${TEST_SRCDIR:-}}}"
if [[ -z "${RUNFILES}" ]]; then
  echo "ERROR: neither RUNFILES_DIR, JAVA_RUNFILES nor TEST_SRCDIR is set" >&2
  exit 1
fi

MODULE="redistricting_sim"
# Bazel ≥ 7 uses the canonical name (_main) for the current repo instead of the
# module name. Check both; prefer the explicit name.
if [[ -d "${RUNFILES}/${MODULE}" ]]; then
  RUNFILES_MOD="${RUNFILES}/${MODULE}"
elif [[ -d "${RUNFILES}/_main" ]]; then
  RUNFILES_MOD="${RUNFILES}/_main"
else
  echo "ERROR: runfiles module dir not found (tried ${MODULE} and _main under ${RUNFILES})" >&2
  exit 1
fi

# ── Resolve game/ directory (node_modules + biome live there) ─────────────────
# We locate game/web/ via a single readlink on the declared runfiles symlink for
# biome.jsonc. This one-hop resolution lands in the current workspace's source
# tree; it never escapes to a stale workspace the way recursive symlink-following
# can. (Same approach as e2e_test.sh's playwright.config.ts resolution.)
BIOME_CONFIG_LINK="${RUNFILES_MOD}/game/web/biome.jsonc"
if [[ ! -L "${BIOME_CONFIG_LINK}" && ! -f "${BIOME_CONFIG_LINK}" ]]; then
  echo "ERROR: biome.jsonc not found in runfiles: ${BIOME_CONFIG_LINK}" >&2
  exit 1
fi
# Single readlink (not -f): resolves one symlink hop to the real source file.
if [[ -L "${BIOME_CONFIG_LINK}" ]]; then
  BIOME_CONFIG_REAL="$(readlink "${BIOME_CONFIG_LINK}")"
else
  BIOME_CONFIG_REAL="${BIOME_CONFIG_LINK}"
fi
# biome.jsonc lives at game/web/biome.jsonc; go up two dirs to game/.
WEB_DIR="$(dirname "${BIOME_CONFIG_REAL}")"
GAME_DIR="$(dirname "${WEB_DIR}")"

BIOME_BIN="${GAME_DIR}/node_modules/.bin/biome"
if [[ ! -f "${BIOME_BIN}" && ! -L "${BIOME_BIN}" ]]; then
  echo "ERROR: node_modules/.bin/biome not found at ${BIOME_BIN}" >&2
  echo "  Run: cd game && ./setup.sh" >&2
  exit 1
fi

# ── Run Biome CI (format + lint, no writes) ───────────────────────────────────
# Bazel's test runner may strip the user's PATH (e.g. /opt/homebrew/bin absent).
# Extend PATH so node is reachable (biome's launcher shim is a node script).
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

cd "${WEB_DIR}"
echo "Running: biome ci . (cwd=${WEB_DIR})"
"${BIOME_BIN}" ci .
exit $?
