#!/usr/bin/env bash
# prepare_release.sh — Build, tag, and prepare a release for deployment.
#
# Usage:
#   ./prepare_release.sh [<version-tag>]
#
# If no tag is specified, auto-bumps the patch version from the most recent tag.
# Examples:
#   ./prepare_release.sh v1.2.3         # Build and tag as v1.2.3
#   ./prepare_release.sh                # Auto-bump (e.g., v1.2.3 → v1.2.4)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"

# Determine version tag
if [[ $# -gt 0 ]]; then
  VERSION_TAG="$1"
else
  # Auto-bump from most recent tag
  LATEST_TAG=$(jj tag list 2>/dev/null | head -1 | awk '{print $1}' || echo "v0.0.0")

  # Parse version and increment patch
  if [[ "${LATEST_TAG}" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
    MAJOR="${BASH_REMATCH[1]}"
    MINOR="${BASH_REMATCH[2]}"
    PATCH="${BASH_REMATCH[3]}"
    PATCH=$((PATCH + 1))
    VERSION_TAG="v${MAJOR}.${MINOR}.${PATCH}"
  else
    VERSION_TAG="v0.0.1"
  fi

  echo "Auto-bumped version: ${LATEST_TAG} → ${VERSION_TAG}"
fi

echo "Preparing release: ${VERSION_TAG}"

# Step 1: Build deployable artifact
echo "Building deployable zip..."
cd "${REPO_ROOT}"
bazel build //web:deployable 2>&1 | tail -3
DEPLOYABLE_ZIP="${REPO_ROOT}/bazel-bin/web/deployable.zip"

if [[ ! -f "${DEPLOYABLE_ZIP}" ]]; then
  echo "ERROR: Build failed—no deployable zip found" >&2
  exit 1
fi

# Step 2: Get current commit hash (what we're building)
BUILD_COMMIT="$(jj log --no-graph -r @ -T 'commit_id.short(12)')"
echo "Build commit: ${BUILD_COMMIT}"

# Step 3: Create tag locally
echo "Creating tag ${VERSION_TAG}..."
jj tag set "${VERSION_TAG}" -r "@"

# Step 4: Push tag to remote
echo "Pushing tag to remote..."
git push origin "${VERSION_TAG}" 2>&1 | grep -v "^To " || true

echo ""
echo "✓ Release prepared: ${VERSION_TAG}"
echo "  Build commit: ${BUILD_COMMIT}"
echo ""
echo "Next steps:"
echo "  1. Deploy to staging: ./deploy_staging.sh ${VERSION_TAG}"
echo "  2. Verify staging works"
echo "  3. Deploy to prod: ./deploy_prod.sh ${VERSION_TAG}"
