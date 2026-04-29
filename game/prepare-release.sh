#!/usr/bin/env bash
# prepare-release.sh — Build artifact and create version tag.
#
# Usage:
#   ./prepare-release.sh [<version-tag>]
#
# If no version-tag is provided, auto-bumps the patch version from the most recent tag.
# Builds deployable zip via Bazel, creates and pushes a version tag, and reports
# the artifact location for deployment scripts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Helper: extract numeric version from tag (e.g., v0.0.7 -> 0.0.7)
extract_version() {
  echo "$1" | sed 's/^v//'
}

# Helper: remove pre-release suffix (e.g., 0.0.7-licensed-to-kill -> 0.0.7)
strip_prerelease() {
  echo "$1" | cut -d'-' -f1
}

# Helper: increment patch version (e.g., 0.0.7 -> 0.0.8)
increment_patch() {
  local version="$1"
  local major_minor=$(echo "$version" | cut -d'.' -f1-2)
  local patch=$(echo "$version" | cut -d'.' -f3)
  patch=$((patch + 1))
  echo "${major_minor}.${patch}"
}

# Determine version tag
if [[ $# -eq 1 ]]; then
  VERSION_TAG="$1"
else
  # Auto-bump: find latest tag, strip pre-release, increment patch
  LATEST_TAG=$(jj tag list | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sort -V | tail -1)
  if [[ -z "$LATEST_TAG" ]]; then
    echo "ERROR: No existing tags found. Specify a version: ./prepare-release.sh v0.0.1" >&2
    exit 1
  fi
  BASE_VERSION=$(strip_prerelease "$(extract_version "$LATEST_TAG")")
  NEXT_VERSION=$(increment_patch "$BASE_VERSION")
  VERSION_TAG="v${NEXT_VERSION}"
fi

echo "Preparing release: ${VERSION_TAG}"
echo ""

# Step 1: Build deployable zip via Bazel
echo "Step 1: Building deployable zip..."
cd "${SCRIPT_DIR}"
bazel build //web:deployable 2>&1 | tail -3
DEPLOYABLE_ZIP="${SCRIPT_DIR}/bazel-bin/web/deployable.zip"

if [[ ! -f "${DEPLOYABLE_ZIP}" ]]; then
  echo "ERROR: Build failed — artifact not found at ${DEPLOYABLE_ZIP}" >&2
  exit 1
fi
echo "  ✓ Artifact ready: ${DEPLOYABLE_ZIP}"
echo ""

# Step 2: Create and push version tag
echo "Step 2: Creating and pushing tag ${VERSION_TAG}..."
jj tag set "${VERSION_TAG}" -r main
echo "  ✓ Tag created: ${VERSION_TAG}"

# Push tag using jj git push (not git push directly)
cd "${SCRIPT_DIR}/.."
jj git push -r "${VERSION_TAG}" 2>&1 | tail -3
echo "  ✓ Tag pushed to remote"
echo ""

# Report success
echo "Release prepared!"
echo "  Version: ${VERSION_TAG}"
echo "  Artifact: ${DEPLOYABLE_ZIP}"
echo "  Next steps:"
echo "    - Staging: cd game && ./deploy-staging.sh"
echo "    - Production: cd game && ./deploy-prod.sh"
