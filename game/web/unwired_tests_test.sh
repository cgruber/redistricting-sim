#!/usr/bin/env bash
#
# GAME-109 backstop: fail when a colocated `*_test.ts` source exists with no
# corresponding `js_test` target wiring it up.
#
# Each unit test in game/web is a hand-authored `ts_project` + `js_test` pair
# (the explicit per-target convention — kept on purpose). The risk this guards:
# an author adds `foo_test.ts` but forgets to add the `js_test`. It compiles into
# nothing, never runs, and `bazel test //...` stays green — a silent coverage gap.
#
# Mechanism: for every `src/**/*_test.ts` we can see in runfiles, check that its
# `js_test` entry_point (`<name>_test.js`) appears as a quoted string in some
# BUILD.bazel file. (js_test entry_points reference the .js, so a wired test
# always has its `<name>_test.js` literal in a BUILD file.) Any test file whose
# entry_point literal is absent from every BUILD file is reported as UNWIRED.
#
# This is a BACKSTOP, not a macro: it does not generate or replace the explicit
# targets — it only asserts they exist.
#
# IMPORTANT for new packages: glob does not cross package boundaries, so each
# subpackage under game/web/src opts in by declaring a `:test_sources_for_meta`
# filegroup (globbing its *_test.ts + BUILD.bazel) and adding it to this test's
# `data` in //game/web:BUILD.bazel. If you add a NEW subpackage (its own
# BUILD.bazel) with colocated tests, you MUST register its filegroup here too —
# otherwise its tests are invisible to this backstop (the same erosion this
# guards against). The five current subpackages (model/simulation/store/audio/
# pipeline) plus the root package's own src/*_test.ts are wired.
#
# Notes:
#   - Portable to macOS bash 3.2 (no `mapfile`): the Bazel sandbox may use the
#     system bash, which predates `mapfile`/`readarray`.
#   - Runfiles entries are symlinks, so all `find` calls use `-L` to follow them.
#
# Run via: bazel test //game/web:unwired_tests_test
set -eu

# Locate the game/web source tree inside runfiles. Bazel >= 7 uses the _main
# canonical repo name; fall back to the bare runfiles root.
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

# Gather all BUILD.bazel files under game/web into one searchable blob (-L: the
# runfiles entries are symlinks).
BUILD_BLOB="$(find -L "$WEB_DIR" -name 'BUILD.bazel' -type f -exec cat {} +)"
BUILD_COUNT="$(find -L "$WEB_DIR" -name 'BUILD.bazel' -type f | wc -l | tr -d ' ')"

if [ "$BUILD_COUNT" -eq 0 ]; then
  echo "ERROR: no BUILD.bazel files found under $WEB_DIR — data deps likely missing." >&2
  exit 2
fi

# Count test files first; a vacuous (zero-file) run is itself a failure.
TEST_COUNT="$(find -L "$WEB_DIR/src" -name '*_test.ts' -type f | wc -l | tr -d ' ')"
if [ "$TEST_COUNT" -eq 0 ]; then
  echo "ERROR: no *_test.ts files found under $WEB_DIR/src — data deps likely missing." >&2
  echo "The meta-test must see the test sources to validate them; this is itself a failure." >&2
  exit 2
fi

echo "Checking $TEST_COUNT test file(s) against $BUILD_COUNT BUILD file(s)..."

unwired=""
unwired_count=0
# Feed the file list via a here-doc (runs the loop in the *current* shell, so the
# counters survive — unlike a pipe, which would run the body in a subshell).
while IFS= read -r tf; do
  [ -n "$tf" ] || continue
  base="$(basename "$tf")"          # e.g. loader_integration_test.ts
  entry="${base%.ts}.js"            # e.g. loader_integration_test.js
  # A wired test has its js entry_point quoted in some BUILD file. Anchor the
  # basename on BOTH sides so it must be a whole path component, not a suffix:
  #   - left: a `"` (bare entry_point) or `/` (directory-prefixed, e.g.
  #     "src/criterion-icons_test.js") — never a name char like `-`.
  #   - right: the closing `"`.
  # Without the left anchor, a short entry like `stage_test.js"` would falsely
  # match the longer wired `"population-stage_test.js"` (suffix collision), so an
  # unwired `stage_test.ts` would slip through — the exact gap this backstop
  # exists to catch. `.` is escaped for the regex.
  entry_re="${entry//./\\.}"        # loader_integration_test\.js
  if printf '%s' "$BUILD_BLOB" | grep -qE "[\"/]${entry_re}\""; then
    echo "  ok   $base  ->  wired ($entry found)"
  else
    echo "  FAIL $base  ->  NO js_test entry_point '$entry' in any BUILD.bazel"
    unwired="$unwired $base"
    unwired_count=$((unwired_count + 1))
  fi
done <<EOF
$(find -L "$WEB_DIR/src" -name '*_test.ts' -type f | sort)
EOF

if [ "$unwired_count" -gt 0 ]; then
  echo >&2
  echo "ERROR: $unwired_count test file(s) are NOT wired to a js_test target:" >&2
  for u in $unwired; do
    echo "  - $u  (add a ts_project + js_test pair; the js_test entry_point must be \"${u%.ts}.js\")" >&2
  done
  echo >&2
  echo "Each src/**/*_test.ts must have a corresponding js_test so it actually runs." >&2
  exit 1
fi

echo "All $TEST_COUNT test file(s) are wired to a js_test target."
