#!/usr/bin/env bash
# deploy-prod.sh — Promote staging to production (web_deploy branch root).
#
# Usage:
#   ./deploy-prod.sh
#
# Copies /staging/ contents to the root of the web_deploy branch, commits,
# and pushes. Porkbun serves pastthepost.org from the root.
#
# Prerequisites:
#   - Staging must have been deployed first via ./deploy-staging.sh
#   - jj workspace at .deploy/ must exist

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${SCRIPT_DIR}/.deploy"

if [[ ! -d "${DEPLOY_DIR}/.jj" ]]; then
  echo "ERROR: Deploy workspace not found at ${DEPLOY_DIR}" >&2
  exit 1
fi

if [[ ! -d "${DEPLOY_DIR}/staging" ]]; then
  echo "ERROR: No staging deploy found at ${DEPLOY_DIR}/staging/" >&2
  echo "  Run deploy-staging.sh first." >&2
  exit 1
fi

# Step 1: Copy staging → root (preserve .jj and staging/)
echo "Promoting staging to production..."
find "${DEPLOY_DIR}" -maxdepth 1 -not -name ".jj" -not -name "staging" -not -name "." -exec rm -rf {} +
cp -R "${DEPLOY_DIR}/staging/"* "${DEPLOY_DIR}/"

# Step 2: Commit
echo "Committing production deploy..."
MAIN_HASH="$(jj log --no-graph -r main -T 'commit_id.short(12)')"
cd "${DEPLOY_DIR}"
jj describe -m "production: ${MAIN_HASH}" 2>&1
jj new 2>&1

# Step 3: Set bookmark and push (from game dir where bookmarks live)
cd "${SCRIPT_DIR}"
jj bookmark set web_deploy -r ".deploy@-" 2>&1
echo "Pushing web_deploy..."
jj git push -b web_deploy 2>&1

echo ""
echo "✓ Deployed to production"
echo "  Main commit: ${MAIN_HASH}"
echo "  URL: https://pastthepost.org"
