#!/usr/bin/env bash
# setup.sh — Idempotent workspace setup for game/.
#
# Handles the two things Bazel does NOT manage automatically:
#   1. npm dependencies in node_modules/ (used by the Playwright sh_test wrapper)
#   2. Playwright browser binaries (~/.cache/ms-playwright/)
#
# Bazel manages its own toolchains (TypeScript, Rust, wasm-bindgen) via bzlmod.
# You do not need rustup, wasm-pack, or a system TypeScript install.
#
# Prerequisites (not installed by this script — must already be on PATH):
#   node    >= 18
#   pnpm    >= 9
#   python3 (any recent version — used by e2e_test.sh's http.server)
#   bazel   (bazelisk wired as bazel)
#
# Usage:
#   ./setup.sh          # from any directory
#   bash game/setup.sh  # from repo root

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "${SCRIPT_DIR}"

# ── Colour helpers ────────────────────────────────────────────────────────────
green()  { if [[ -t 1 ]]; then printf '\033[0;32m%s\033[0m\n' "$*"; else printf '%s\n' "$*"; fi; }
yellow() { if [[ -t 1 ]]; then printf '\033[0;33m%s\033[0m\n' "$*"; else printf '%s\n' "$*"; fi; }
red()    { if [[ -t 1 ]]; then printf '\033[0;31m%s\033[0m\n' "$*"; else printf '%s\n' "$*"; fi; }

# ── Prerequisite checks ───────────────────────────────────────────────────────
# These are system-level tools the script cannot install.  Fail fast with an
# actionable message rather than a cryptic error mid-run.

MISSING=()

if ! command -v node >/dev/null 2>&1; then
  MISSING+=("node (>= 18) — install via nvm, Homebrew, or system package manager")
fi
if ! command -v pnpm >/dev/null 2>&1; then
  MISSING+=("pnpm (>= 9) — install via 'npm install -g pnpm@9' or 'brew install pnpm'")
fi
if ! command -v python3 >/dev/null 2>&1; then
  MISSING+=("python3 — required by the e2e test HTTP server")
fi
if ! command -v bazel >/dev/null 2>&1; then
  MISSING+=("bazel — install via bazelisk: 'brew install bazelisk' then wire as bazel on PATH")
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
  red "setup.sh: missing prerequisites:"
  for item in "${MISSING[@]}"; do
    red "  - ${item}"
  done
  exit 1
fi

# ── Step 1: npm dependencies ──────────────────────────────────────────────────
# pnpm install is idempotent: it verifies node_modules against pnpm-lock.yaml
# and exits quickly if everything is up to date.

yellow "==> pnpm install"
pnpm install --frozen-lockfile
green "    node_modules up to date"

# ── Step 2: Playwright browser binaries ───────────────────────────────────────
# Playwright installs browser binaries to ~/.cache/ms-playwright/.
# This is machine-global (one install covers all workspaces/checkouts).
# 'playwright install' is idempotent: it skips browsers already at the right version.
#
# We use pnpm exec to run the locally-installed playwright (version-locked via
# pnpm-lock.yaml) rather than a global or npx-fetched version.

yellow "==> playwright install chromium"
pnpm exec playwright install chromium
green "    Playwright Chromium ready"

# ── Done ──────────────────────────────────────────────────────────────────────
green ""
green "Setup complete. To build and test:"
green "  bazel build //..."
green "  bazel test //..."
green ""
green "To serve the app locally:"
green "  ./serve.sh"
