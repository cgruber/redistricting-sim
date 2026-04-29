#!/usr/bin/env bash
# deploy.sh — Deploy to staging or production (web_deploy branch).
#
# Usage:
#   ./deploy.sh <staging|production> [<version>]
#
# Creates environment-specific workspace, extracts artifact, commits, pushes,
# verifies deployment, then cleans up workspace.
#
# Extracts artifact into the appropriate directory:
#   staging: .deploy_staging/ (served as staging.pastthepost.gg)
#   production: .deploy_prod/ (served as pastthepost.gg)

set -euo pipefail

if [[ $# -lt 1 ]] || [[ $# -gt 2 ]]; then
  echo "Usage: $0 <staging|production> [<version>]" >&2
  exit 1
fi

ENVIRONMENT="$1"
VERSION="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOYABLE_ZIP="${SCRIPT_DIR}/bazel-bin/web/deployable.zip"

# Validate environment and set workspace/directory names
case "${ENVIRONMENT}" in
  staging)
    DEPLOY_WORKSPACE=".deploy_staging"
    DEPLOY_DIR="${SCRIPT_DIR}/${DEPLOY_WORKSPACE}"
    VERIFY_URL="https://staging.pastthepost.gg/deployment-metadata.json"
    ;;
  production)
    DEPLOY_WORKSPACE=".deploy_prod"
    DEPLOY_DIR="${SCRIPT_DIR}/${DEPLOY_WORKSPACE}"
    VERIFY_URL="https://pastthepost.gg/deployment-metadata.json"
    ;;
  *)
    echo "ERROR: Unknown environment '${ENVIRONMENT}'. Use 'staging' or 'production'." >&2
    exit 1
    ;;
esac

if [[ ! -f "${DEPLOYABLE_ZIP}" ]]; then
  echo "ERROR: Artifact not found at ${DEPLOYABLE_ZIP}" >&2
  echo "  Run prepare-release.sh first." >&2
  exit 1
fi

# Get main commit hash for reference
MAIN_HASH="$(jj log --no-graph -r main -T 'commit_id.short(12)')"

# If version not provided, look up the tag for this commit
if [[ -z "${VERSION}" ]]; then
  VERSION=$(jj tag list | grep -E "^[^ ]+" -o | while read tag; do
    if jj log -r "${tag}" --no-graph -T 'commit_id.short(12)' 2>/dev/null | grep -q "^${MAIN_HASH}$"; then
      echo "${tag}"
      exit 0
    fi
  done)

  if [[ -z "${VERSION}" ]]; then
    echo "ERROR: No version tag found for commit ${MAIN_HASH}" >&2
    echo "  Run prepare-release.sh first, or pass version as second argument." >&2
    exit 1
  fi
fi

# Get the commit hash of the version tag
TAG_HASH="$(jj log -r "${VERSION}" --no-graph -T 'commit_id.short(12)' 2>/dev/null || echo "${MAIN_HASH}")"

# Check if already deployed at this version
DEPLOYED_VERSION=$(jj log -r web_deploy --no-graph -T 'description' 2>/dev/null | head -1 | grep -oE 'version: [^ ]+' | cut -d' ' -f2 || echo '')

if [[ "${DEPLOYED_VERSION}" == "${VERSION}" ]]; then
  echo "⚠ Version ${VERSION} already deployed to ${ENVIRONMENT}. Skipping re-deployment." >&2
  exit 0
fi

echo "Deploying to ${ENVIRONMENT}..."
echo ""

# Step 1: Create deployment workspace
echo "Step 1: Creating deployment workspace..."
if [[ -d "${DEPLOY_DIR}" ]]; then
  echo "ERROR: Deployment workspace already exists at ${DEPLOY_DIR}" >&2
  echo "  Clean up manually: rm -rf ${DEPLOY_DIR}" >&2
  exit 1
fi

jj workspace add "${DEPLOY_WORKSPACE}" 2>&1 | grep -v "^Warning:" | head -3
cd "${DEPLOY_DIR}"

# Step 2: Create new commit and extract artifact
echo "Step 2: Preparing deployment..."
jj new web_deploy 2>&1 | tail -1

# Step 3: Extract artifact to appropriate location
echo "Step 3: Extracting artifact..."

if [[ "${ENVIRONMENT}" == "staging" ]]; then
  # Staging: extract to .deploy_staging/
  rm -rf staging
  mkdir -p staging
  unzip -q -o "${DEPLOYABLE_ZIP}" -d staging
else
  # Production: extract to .deploy_prod/ root
  mkdir -p temp-extract
  unzip -q -o "${DEPLOYABLE_ZIP}" -d temp-extract
  cp -R temp-extract/* ./
  rm -rf temp-extract
fi

# Step 4: Create deployment metadata
echo "Step 4: Creating deployment metadata..."
TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

if [[ "${ENVIRONMENT}" == "staging" ]]; then
  METADATA_FILE="${DEPLOY_DIR}/staging/deployment-metadata.json"
else
  METADATA_FILE="${DEPLOY_DIR}/deployment-metadata.json"
fi

cat > "${METADATA_FILE}" <<EOF
{
  "version": "${VERSION}",
  "commit": "${TAG_HASH}",
  "environment": "${ENVIRONMENT}",
  "timestamp": "${TIMESTAMP}"
}
EOF

# Step 5: Commit and push
echo "Step 5: Committing and pushing..."
jj commit -m "${ENVIRONMENT}: ${VERSION} (${TAG_HASH})" 2>&1 | tail -1

# Set bookmark to point to the commit we just made
jj bookmark set web_deploy -r "@-" 2>&1 | grep -v "^$" || true

echo "Pushing web_deploy..."
cd "${SCRIPT_DIR}"
jj git push -b web_deploy 2>&1 | tail -3

# Step 6: Verify deployment
echo ""
echo "⏳ Verifying deployment (polling ${VERIFY_URL})..."
TIMEOUT=120
INTERVAL=5
ELAPSED=0

while [[ ${ELAPSED} -lt ${TIMEOUT} ]]; do
  RESPONSE=$(curl -s "${VERIFY_URL}" 2>/dev/null || echo "")

  # Verify all non-ephemeral fields match
  if echo "${RESPONSE}" | grep -q "\"version\": \"${VERSION}\"" && \
     echo "${RESPONSE}" | grep -q "\"commit\": \"${TAG_HASH}\"" && \
     echo "${RESPONSE}" | grep -q "\"environment\": \"${ENVIRONMENT}\""; then
    echo "✓ Deployed to ${ENVIRONMENT}"
    echo "  Version: ${VERSION} (${TAG_HASH})"
    echo "  Timestamp: ${TIMESTAMP}"
    if [[ "${ENVIRONMENT}" == "staging" ]]; then
      echo "  URL: https://staging.pastthepost.gg"
    else
      echo "  URL: https://pastthepost.gg"
    fi

    # Step 7: Clean up workspace
    echo ""
    echo "Cleaning up workspace..."
    cd "${SCRIPT_DIR}"
    jj workspace forget "${DEPLOY_WORKSPACE}" 2>&1 | tail -1
    rm -rf "${DEPLOY_DIR}"

    exit 0
  fi

  sleep ${INTERVAL}
  ELAPSED=$((ELAPSED + INTERVAL))
done

# Verification failed - clean up and exit with error
echo "⚠ Deployment verification timed out after ${TIMEOUT}s."
echo "  The deployment was pushed, but the hosting may still be syncing."
echo "  Check ${VERIFY_URL} manually to confirm."
echo ""
echo "Cleaning up workspace..."
cd "${SCRIPT_DIR}"
jj workspace forget "${DEPLOY_WORKSPACE}" 2>&1 | tail -1
rm -rf "${DEPLOY_DIR}"

exit 1
