#!/usr/bin/env bash
# deploy.sh — Deploy a release to staging or production.
#
# Usage:
#   ./deploy.sh <environment> <version-tag>
#
# Environment: staging | prod
# Version tag: must exist locally and on remote (created by prepare_release.sh)
#
# Examples:
#   ./deploy.sh staging v0.0.5
#   ./deploy.sh prod v0.0.5

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <environment> <version-tag>" >&2
  echo "Environment: staging | prod" >&2
  echo "Example: $0 staging v0.0.5" >&2
  exit 1
fi

ENVIRONMENT="$1"
VERSION_TAG="$2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"

# Configure environment-specific variables
case "${ENVIRONMENT}" in
  staging)
    DEPLOY_WORKSPACE_DIR="${SCRIPT_DIR}/.deploy_staging"
    DEPLOY_BOOKMARK="web_deploy"
    DEPLOY_LOCATION="staging"
    DEPLOY_URL="https://staging.pastthepost.gg"
    ;;
  prod)
    DEPLOY_WORKSPACE_DIR="${SCRIPT_DIR}/.deploy_prod"
    DEPLOY_BOOKMARK="web_deploy"
    DEPLOY_LOCATION="."
    DEPLOY_URL="https://pastthepost.gg"
    ;;
  *)
    echo "ERROR: Unknown environment '${ENVIRONMENT}'" >&2
    echo "Must be 'staging' or 'prod'" >&2
    exit 1
    ;;
esac

# Step 1: Verify version tag exists (locally and on remote)
echo "Verifying version tag: ${VERSION_TAG}"
if ! jj log -r "tags(${VERSION_TAG})" &>/dev/null; then
  echo "ERROR: Tag '${VERSION_TAG}' does not exist locally" >&2
  echo "  Create it first with: ./prepare_release.sh ${VERSION_TAG}" >&2
  exit 1
fi

TAG_COMMIT="$(jj log --no-graph -r "tags(${VERSION_TAG})" -T 'commit_id.short(12)')"
echo "  ✓ Tag ${VERSION_TAG} points to commit: ${TAG_COMMIT}"

# Fetch to ensure we have latest remote state
jj git fetch &>/dev/null || true

# Check what version is currently deployed (local bookmark)
if jj log -r "${DEPLOY_BOOKMARK}" &>/dev/null 2>&1; then
  CURRENT_DEPLOYED_VERSION=$(jj log -r "${DEPLOY_BOOKMARK}" --no-graph -T 'description' 2>/dev/null | sed -n "s/^${ENVIRONMENT}: \([^ ]*\).*/\1/p" || echo "")
  if [[ -n "${CURRENT_DEPLOYED_VERSION}" ]] && [[ "${CURRENT_DEPLOYED_VERSION}" == "${VERSION_TAG}" ]]; then
    echo "ERROR: Version ${VERSION_TAG} is already deployed to ${ENVIRONMENT}" >&2
    echo "  Current deployment: ${CURRENT_DEPLOYED_VERSION}" >&2
    echo "  To deploy a new version, use: ./prepare_release.sh" >&2
    exit 1
  fi
  if [[ -n "${CURRENT_DEPLOYED_VERSION}" ]]; then
    echo "Currently deployed: ${CURRENT_DEPLOYED_VERSION}"
  fi
fi

# Step 2: Check for existing deploy workspace (prevents concurrent deploys)
if [[ -d "${DEPLOY_WORKSPACE_DIR}" ]]; then
  echo "ERROR: Deploy workspace already exists at ${DEPLOY_WORKSPACE_DIR}" >&2
  echo "  This indicates a deploy may be in progress or needs cleanup." >&2
  echo "  If safe to clean up, use: jj workspace forget .deploy_${ENVIRONMENT}" >&2
  exit 1
fi

# Step 3: Build deployable zip via Bazel
echo "Building deployable zip..."
cd "${REPO_ROOT}"
bazel build //web:deployable 2>&1 | tail -3
DEPLOYABLE_ZIP="${REPO_ROOT}/bazel-bin/web/deployable.zip"

# Step 4: Create deploy workspace
echo "Creating deploy workspace at ${DEPLOY_WORKSPACE_DIR}..."
jj workspace add "${DEPLOY_WORKSPACE_DIR}"

# Step 5: Enter workspace and create new commit on top of bookmark
cd "${DEPLOY_WORKSPACE_DIR}"
echo "Creating new commit on top of ${DEPLOY_BOOKMARK}..."
jj new "${DEPLOY_BOOKMARK}"

# Step 6: Write deployment metadata (version tag, commit ID, and timestamp)
echo "Writing deployment metadata..."
TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
mkdir -p "${DEPLOY_LOCATION}"
cat > "${DEPLOY_LOCATION}/deployment-metadata.json" <<EOF
{
  "version": "${VERSION_TAG}",
  "commit_id": "${TAG_COMMIT}",
  "deployed_at": "${TIMESTAMP}"
}
EOF

# Step 7: Extract release artifact into deploy location
echo "Extracting release artifact..."
unzip -q -o "${DEPLOYABLE_ZIP}" -d "${DEPLOY_LOCATION}"

# Step 8: Commit the deployment (with built artifacts and metadata)
echo "Committing ${ENVIRONMENT} deploy..."
jj commit -m "${ENVIRONMENT}: ${VERSION_TAG} (${TAG_COMMIT})" 2>&1
DEPLOY_COMMIT="$(jj log --no-graph -r "@-" -T 'commit_id.short(12)')"

# Step 9: Move bookmark to the deployment commit (from root workspace)
echo "Setting ${DEPLOY_BOOKMARK} bookmark..."
cd "${REPO_ROOT}"
jj bookmark set "${DEPLOY_BOOKMARK}" -r "${DEPLOY_COMMIT}" --allow-backwards 2>&1
echo "Pushing ${DEPLOY_BOOKMARK}..."
jj git push -b "${DEPLOY_BOOKMARK}" 2>&1

# Step 10: Verify the deployment (with polling for hosting sync delay)
echo "Verifying deployment (polling for up to 120 seconds)..."
VERIFICATION_TIMEOUT=120
VERIFICATION_START=$(date +%s)
VERIFIED=false

while [[ $(($(date +%s) - VERIFICATION_START)) -lt $VERIFICATION_TIMEOUT ]]; do
  DEPLOYED_VERSION=$(curl -s "${DEPLOY_URL}/deployment-metadata.json" | jq -r '.version' 2>/dev/null || echo "")
  DEPLOYED_COMMIT=$(curl -s "${DEPLOY_URL}/deployment-metadata.json" | jq -r '.commit_id' 2>/dev/null || echo "")

  if [[ "${DEPLOYED_VERSION}" == "${VERSION_TAG}" ]] && [[ "${DEPLOYED_COMMIT}" == "${TAG_COMMIT}" ]]; then
    VERIFIED=true
    echo "  ✓ Deployment verified"
    break
  fi

  sleep 5
done

if [[ "${VERIFIED}" != "true" ]]; then
  echo "ERROR: Deployment verification failed after ${VERIFICATION_TIMEOUT} seconds" >&2
  echo "  Expected version: ${VERSION_TAG}" >&2
  echo "  Deployed version: ${DEPLOYED_VERSION}" >&2
  echo "  Expected commit: ${TAG_COMMIT}" >&2
  echo "  Deployed commit: ${DEPLOYED_COMMIT}" >&2
  exit 1
fi

# Step 11: Clean up workspace
echo "Cleaning up workspace..."
cd "${REPO_ROOT}"
jj workspace forget ".deploy_${ENVIRONMENT}"
rm -rf "${DEPLOY_WORKSPACE_DIR}"

echo ""
echo "✓ Deployed to ${ENVIRONMENT}"
echo "  Version: ${VERSION_TAG}"
echo "  Commit: ${TAG_COMMIT}"
echo "  Deployed at: ${TIMESTAMP}"
echo "  URL: ${DEPLOY_URL}"
