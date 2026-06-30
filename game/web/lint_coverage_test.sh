#!/usr/bin/env bash
#
# GAME-111 backstop: keep the Biome lint gate's per-subpackage coverage from
# eroding. Every game/web/src subpackage surfaces its *.ts to //game/web:lint_test
# via a :lint_sources filegroup (Bazel glob does not cross package boundaries). A
# new subpackage that forgets to add one would be unlinted, and a violation there
# would not invalidate the gate's cache (silent stale PASS).
#
# This asserts that every subpackage the unwired-tests backstop already enumerates
# (via :test_sources_for_meta in //game/web:unwired_tests_test) is ALSO wired into
# lint_test (via :lint_sources). So the two enumerations cannot drift: if you add
# src/<pkg>/ with tests and wire it for the test backstop but forget lint, this
# fails naming <pkg>.
#
# LIMIT (irreducible): a brand-new subpackage referenced by NEITHER backstop is
# invisible to both — Bazel can't enumerate an un-referenced package from a hermetic
# test (genquery `scope` rejects `//game/web/src/...`). The per-package filegroup
# convention + code review remain the first line of defense.
#
# Run via: bazel test //game/web:lint_coverage_test
set -eu

# Locate game/web in runfiles (mirror unwired_tests_test.sh).
WEB_DIR=""
for base in "${RUNFILES_DIR:-}/_main" "${RUNFILES_DIR:-}" "${TEST_SRCDIR:-}/_main" "${TEST_SRCDIR:-}"; do
  if [ -n "$base" ] && [ -f "$base/game/web/BUILD.bazel" ]; then
    WEB_DIR="$base/game/web"
    break
  fi
done
if [ -z "$WEB_DIR" ]; then
  echo "ERROR: could not locate game/web/BUILD.bazel in runfiles (RUNFILES_DIR='${RUNFILES_DIR:-}', TEST_SRCDIR='${TEST_SRCDIR:-}')" >&2
  exit 2
fi
BUILD="$WEB_DIR/BUILD.bazel"

# Subpackages wired into the lint gate, and into the unwired-tests backstop.
# `:lint_sources` only ever appears in lint_test's data; `:test_sources_for_meta`
# only in unwired_tests_test's data — so a file-wide grep yields each referenced set.
lint_pkgs="$(grep -oE '//game/web/src/[A-Za-z0-9_-]+:lint_sources' "$BUILD" \
  | sed -E 's#//game/web/src/##; s#:lint_sources##' | sort -u)"
test_pkgs="$(grep -oE '//game/web/src/[A-Za-z0-9_-]+:test_sources_for_meta' "$BUILD" \
  | sed -E 's#//game/web/src/##; s#:test_sources_for_meta##' | sort -u)"

if [ -z "$lint_pkgs" ]; then
  echo "ERROR: found no :lint_sources references in $BUILD — lint_test wiring missing or moved." >&2
  exit 2
fi

# Every test-enumerated subpackage must also be lint-wired.
missing=""
for p in $test_pkgs; do
  if ! printf '%s\n' $lint_pkgs | grep -qx "$p"; then
    missing="$missing $p"
  fi
done

if [ -n "$missing" ]; then
  echo "FAIL: subpackage(s) wired for tests but NOT for lint:$missing" >&2
  echo "Each game/web/src subpackage must expose a :lint_sources filegroup AND be" >&2
  echo "listed in //game/web:lint_test's \`data\`. Add for each above:" >&2
  for p in $missing; do
    echo "  \"//game/web/src/$p:lint_sources\"," >&2
  done
  exit 1
fi

lint_n="$(printf '%s\n' $lint_pkgs | grep -c .)"
test_n="$(printf '%s\n' $test_pkgs | grep -c .)"
echo "OK: all $test_n test-enumerated subpackage(s) are lint-wired ($lint_n lint-wired total)."
