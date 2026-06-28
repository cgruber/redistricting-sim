#!/usr/bin/env bash
#
# GAME-108 CI guard: the deploy (game/release.main.kts) patches index.html by EXACT
# string replacement against fixed anchors:
#   - bundle cache-bust: `s.src = "bundle.js";`            (release.main.kts ~line 393)
#   - app-version meta:  `<meta name="app-version" content="">`     (~line 408)
#   - app-environment:   `<meta name="app-environment" content="">` (~line 416)
# release.main.kts is NOT exercised by `bazel test`. If a routine index.html reformat
# (no formatter today, see GAME-107) changes any anchor, the patch silently fails — and
# release.main.kts now hard-errors at deploy time. This test makes that failure surface
# in CI instead of at deploy time: if an anchor is gone, CI goes red.
#
# Keep these literals in sync with the .replace(...) anchors in release.main.kts.
#
# Portable to macOS bash 3.2 (the Bazel sandbox may use system bash). Runfiles entries
# are symlinks; use `grep -F --` for fixed-string matching since the anchors contain
# `"`, `.`, `=`.
set -eu

# Locate game/web in runfiles (Bazel >= 7 uses the _main canonical repo name; fall back).
WEB_DIR=""
for base in "${RUNFILES_DIR:-}/_main" "${RUNFILES_DIR:-}" "${TEST_SRCDIR:-}/_main" "${TEST_SRCDIR:-}"; do
  if [ -n "$base" ] && [ -d "$base/game/web" ]; then
    WEB_DIR="$base/game/web"
    break
  fi
done

if [ -z "$WEB_DIR" ]; then
  echo "ERROR: could not locate game/web in runfiles (RUNFILES_DIR='${RUNFILES_DIR:-}', TEST_SRCDIR='${TEST_SRCDIR:-}')" >&2
  exit 2
fi

INDEX_HTML="$WEB_DIR/index.html"
if [ ! -f "$INDEX_HTML" ]; then
  echo "ERROR: index.html not found at $INDEX_HTML — data deps likely missing." >&2
  exit 2
fi

# Exact anchor strings release.main.kts greps for. Keep in sync with release.main.kts.
ANCHOR_BUNDLE='s.src = "bundle.js";'
ANCHOR_VERSION='<meta name="app-version" content="">'
ANCHOR_ENV='<meta name="app-environment" content="">'

missing=0
check_anchor() {
  literal="$1"
  if grep -F -- "$literal" "$INDEX_HTML" >/dev/null; then
    echo "  ok   anchor present: $literal"
  else
    echo "  FAIL anchor MISSING: $literal" >&2
    missing=$((missing + 1))
  fi
}

echo "Checking release.main.kts patch anchors in $INDEX_HTML ..."
check_anchor "$ANCHOR_BUNDLE"
check_anchor "$ANCHOR_VERSION"
check_anchor "$ANCHOR_ENV"

if [ "$missing" -gt 0 ]; then
  echo >&2
  echo "ERROR: $missing index.html patch anchor(s) missing." >&2
  echo "game/release.main.kts patches index.html by exact-string replacement against these" >&2
  echo "anchors. A missing anchor means the deploy can no longer cache-bust the bundle or fill" >&2
  echo "the version/environment meta tags (and now hard-errors at deploy time)." >&2
  echo "Fix: restore the exact strings in game/web/index.html, OR update both the .replace(...)" >&2
  echo "anchors in game/release.main.kts AND the literals in this test to match." >&2
  exit 1
fi

echo "All index.html patch anchors present."
