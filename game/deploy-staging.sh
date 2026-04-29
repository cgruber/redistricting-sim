#!/usr/bin/env bash
# deploy-staging.sh — Build and deploy to staging (web_deploy branch).
#
# Usage:
#   ./deploy-staging.sh <version-tag>
#
# Workflow:
#   1. Verify version tag exists locally and on remote
#   2. Check if .deploy_staging exists (error if it does — deploy in progress)
#   3. Build release artifact via Bazel
#   4. Create .deploy_staging workspace
#   5. Create new commit on top of web_deploy
#   6. Write deployment-metadata.json with version tag, commit ID, and timestamp
#   7. Extract release artifact into staging/ folder
#   8. Commit the changes
#   9. Move web_deploy bookmark to the new commit
#   10. Push to remote
#   11. Verify the push by checking staging website
#   12. Clean up the workspace

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <version-tag>" >&2
  echo "Example: $0 v1.2.3" >&2
  exit 1
fi

VERSION_TAG="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"
DEPLOY_STAGING_DIR="${SCRIPT_DIR}/.deploy_staging"

# Step 1: Verify version tag exists locally and on remote
echo "Verifying version tag: ${VERSION_TAG}"
if ! jj log -r "tag(${VERSION_TAG})" &>/dev/null; then
  echo "ERROR: Tag '${VERSION_TAG}' does not exist locally" >&2
  exit 1
fi

if ! jj git fetch &>/dev/null || ! git ls-remote origin "refs/tags/${VERSION_TAG}" &>/dev/null; then
  echo "ERROR: Tag '${VERSION_TAG}' has not been pushed to remote" >&2
  exit 1
fi

TAG_COMMIT="$(jj log --no-graph -r "tag(${VERSION_TAG})" -T 'commit_id.short(12)')"
echo "  ✓ Tag ${VERSION_TAG} points to commit: ${TAG_COMMIT}"

# Step 2: Check for existing deploy workspace (prevents concurrent deploys)
if [[ -d "${DEPLOY_STAGING_DIR}" ]]; then
  echo "ERROR: Deploy workspace already exists at ${DEPLOY_STAGING_DIR}" >&2
  echo "  This indicates a deploy may be in progress or needs cleanup." >&2
  echo "  If safe to clean up, use: jj workspace forget .deploy_staging" >&2
  exit 1
fi

# Step 3: Build deployable zip via Bazel
echo "Building deployable zip..."
cd "${REPO_ROOT}"
bazel build //web:deployable 2>&1 | tail -3
DEPLOYABLE_ZIP="${REPO_ROOT}/bazel-bin/web/deployable.zip"

# Step 4: Create deploy workspace
echo "Creating deploy workspace at ${DEPLOY_STAGING_DIR}..."
jj workspace add "${DEPLOY_STAGING_DIR}"

# Step 5: Enter workspace and create new commit on top of web_deploy
cd "${DEPLOY_STAGING_DIR}"
echo "Creating new commit on top of web_deploy..."
jj new web_deploy

# Step 6: Write deployment metadata (version tag, commit ID, and timestamp)
echo "Writing deployment metadata..."
TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
mkdir -p staging
cat > staging/deployment-metadata.json <<EOF
{
  "version": "${VERSION_TAG}",
  "commit_id": "${TAG_COMMIT}",
  "deployed_at": "${TIMESTAMP}"
}
EOF

# Step 7: Extract release artifact into staging folder
echo "Extracting release artifact..."
unzip -q "${DEPLOYABLE_ZIP}" -d staging

# Step 8: Commit the changes
echo "Committing staging deploy..."
jj commit -m "staging: ${VERSION_TAG} (${TAG_COMMIT})" 2>&1

# Step 9: Move web_deploy bookmark to this commit (from root workspace)
echo "Setting web_deploy bookmark..."
cd "${REPO_ROOT}"
jj bookmark set web_deploy -r "@-.deploy_staging" --allow-backwards 2>&1

# Step 10: Push to remote
echo "Pushing web_deploy..."
jj git push -b web_deploy 2>&1

# Step 11: Verify the deployment
echo "Verifying deployment..."
DEPLOYED_VERSION=$(curl -s https://staging.pastthepost.gg/deployment-metadata.json | jq -r '.version' 2>/dev/null || echo "")
DEPLOYED_COMMIT=$(curl -s https://staging.pastthepost.gg/deployment-metadata.json | jq -r '.commit_id' 2>/dev/null || echo "")

if [[ "${DEPLOYED_VERSION}" != "${VERSION_TAG}" ]] || [[ "${DEPLOYED_COMMIT}" != "${TAG_COMMIT}" ]]; then
  echo "ERROR: Deployment verification failed" >&2
  echo "  Expected version: ${VERSION_TAG}" >&2
  echo "  Deployed version: ${DEPLOYED_VERSION}" >&2
  echo "  Expected commit: ${TAG_COMMIT}" >&2
  echo "  Deployed commit: ${DEPLOYED_COMMIT}" >&2
  exit 1
fi

# Step 12: Clean up workspace
echo "Cleaning up workspace..."
cd "${REPO_ROOT}"
jj workspace forget .deploy_staging
rm -rf "${DEPLOY_STAGING_DIR}"

echo ""
echo "✓ Deployed to staging"
echo "  Version: ${VERSION_TAG}"
echo "  Commit: ${TAG_COMMIT}"
echo "  Deployed at: ${TIMESTAMP}"
echo "  URL: https://staging.pastthepost.gg"
