#!/usr/bin/env bash
# deploy-staging.sh — Build and deploy to staging (web_deploy branch /staging/).
#
# Usage:
#   ./deploy-staging.sh [DEPLOY_WORKSPACE_DIR]
#
# Assembles build artifacts into /staging/ subdirectory of the web_deploy branch,
# commits, and pushes. Porkbun serves staging.pastthepost.gg from /staging/.
#
# Prerequisites:
#   - jj workspace "redistricting_sim_deploy" must exist
#   - The workspace must be reachable from the main repo

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOY_DIR="${1:-${REPO_ROOT}/../redistricting_sim_deploy}"

if [[ ! -d "${DEPLOY_DIR}/.jj" ]]; then
  echo "ERROR: Deploy workspace not found at ${DEPLOY_DIR}" >&2
  echo "  Create it with: jj workspace add ../redistricting_sim_deploy" >&2
  exit 1
fi

# Step 1: Build and assemble
STAGING_DIR="${SCRIPT_DIR}/_deploy_out"
"${SCRIPT_DIR}/deploy-assemble.sh" "${STAGING_DIR}"

# Step 2: Copy to deploy workspace /staging/ (preserve .jj and root files)
echo "Copying to ${DEPLOY_DIR}/staging/..."
rm -rf "${DEPLOY_DIR}/staging"
mkdir -p "${DEPLOY_DIR}/staging"
cp -R "${STAGING_DIR}/"* "${DEPLOY_DIR}/staging/"

# Step 3: Commit from the deploy workspace directory
echo "Committing staging deploy..."
MAIN_HASH="$(cd "${REPO_ROOT}" && jj log --no-graph -r main -T 'commit_id.short(12)')"
cd "${DEPLOY_DIR}"
jj describe -m "staging: ${MAIN_HASH}" 2>&1
jj new 2>&1

# Step 4: Set bookmark and push (from main repo where bookmarks live)
cd "${REPO_ROOT}"
jj bookmark set web_deploy -r "redistricting_sim_deploy@-" 2>&1
echo "Pushing web_deploy..."
jj git push -b web_deploy 2>&1

echo ""
echo "✓ Deployed to staging"
echo "  Main commit: ${MAIN_HASH}"
echo "  URL: https://staging.pastthepost.gg"
