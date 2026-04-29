#!/usr/bin/env bash
# deploy-staging.sh — Build and deploy to staging (web_deploy branch /staging/).
#
# Usage:
#   ./deploy-staging.sh
#
# Builds deployable zip via Bazel, extracts into /staging/ subdirectory of the
# web_deploy branch, commits, and pushes. Porkbun serves staging.pastthepost.gg
# from /staging/.
#
# Prerequisites:
#   - jj workspace at .deploy/ must exist
#   - Initialize with: jj workspace add .deploy (run once from game/)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/.deploy"

if [[ ! -d "${DEPLOY_DIR}/.jj" ]]; then
  echo "ERROR: Deploy workspace not found at ${DEPLOY_DIR}" >&2
  echo "  Initialize with: jj workspace add .deploy" >&2
  exit 1
fi

# Step 1: Build deployable zip via Bazel
echo "Building deployable zip..."
cd "${SCRIPT_DIR}"
bazel build //web:deployable 2>&1 | tail -3
DEPLOYABLE_ZIP="$(pwd)/bazel-bin/web/deployable.zip"

# Step 2: Prepare deploy workspace with staging files
echo "Preparing deploy workspace..."
MAIN_HASH="$(jj log --no-graph -r main -T 'commit_id.short(12)')"

cd "${DEPLOY_DIR}"
# Create new commit on top of current contents
jj new web_deploy 2>&1 | tail -1
# Extract deployable into staging/
rm -rf staging
mkdir -p staging
unzip -q "${SCRIPT_DIR}/bazel-bin/web/deployable.zip" -d staging

# Step 3: Commit and push from the deploy workspace
echo "Committing staging deploy..."
jj commit -m "staging: ${MAIN_HASH}" 2>&1 | tail -1

# Set bookmark to point to the commit we just made (parent of current empty working copy)
jj bookmark set web_deploy -r "@-" --allow-backwards 2>&1

echo "Pushing web_deploy..."
cd "${SCRIPT_DIR}"
jj git push -b web_deploy 2>&1 | tail -3

echo ""
echo "✓ Deployed to staging"
echo "  Main commit: ${MAIN_HASH}"
echo "  URL: https://staging.pastthepost.gg"
