#!/usr/bin/env bash
# serve-local.sh — extract the pre-built deployable zip and serve it locally.
# Usage: bazel run //game:serve-local
#
# bazel run pre-builds //game/web:deployable as a data dep, then sets
# BUILD_WORKSPACE_DIRECTORY to the workspace root.  We read the zip from
# bazel-bin — no nested bazel invocation needed.

set -euo pipefail

PORT="${PORT:-58080}"

# bazel run sets BUILD_WORKSPACE_DIRECTORY to the workspace root (repo root).
ZIP="${BUILD_WORKSPACE_DIRECTORY}/bazel-bin/game/web/deployable.zip"
if [[ ! -f "${ZIP}" ]]; then
  echo "ERROR: deployable.zip not found at ${ZIP}" >&2
  echo "  Run via 'bazel run //game:serve-local' so Bazel pre-builds the zip." >&2
  exit 1
fi

# ── Version from working copy ─────────────────────────────────────────────────
COMMIT=$(jj log --no-graph -r @ -T 'commit_id.short(12)' \
         --repository "${BUILD_WORKSPACE_DIRECTORY}" 2>/dev/null || echo "unknown")
VERSION="vTEST-${COMMIT}"

# ── Extract ───────────────────────────────────────────────────────────────────
SERVE_DIR="$(mktemp -d)"
SERVER_PID=""
cleanup() {
  [[ -n "${SERVER_PID}" ]] && kill "${SERVER_PID}" 2>/dev/null || true
  rm -rf "${SERVE_DIR}"
}
trap cleanup EXIT

python3 -c "
import zipfile, sys
zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])
" "${ZIP}" "${SERVE_DIR}"

# ── Patch index.html (version badge + cache-bust) ─────────────────────────────
INDEX="${SERVE_DIR}/index.html"
if [[ -f "${INDEX}" ]]; then
  sed -i '' \
    -e "s|s.src = \"bundle.js\";|s.src = \"bundle.js?v=${VERSION}\";|g" \
    -e "s|<meta name=\"app-version\" content=\"\">|<meta name=\"app-version\" content=\"${VERSION}\">|g" \
    -e "s|<meta name=\"app-environment\" content=\"\">|<meta name=\"app-environment\" content=\"local\">|g" \
    "${INDEX}"
fi

# ── Serve ─────────────────────────────────────────────────────────────────────
URL="http://localhost:${PORT}"
echo "Serving ${VERSION} at ${URL}  (Ctrl-C to stop)"

python3 -m http.server "${PORT}" --directory "${SERVE_DIR}" &
SERVER_PID=$!

# Wait for the server to be ready, then open a browser.
for i in $(seq 1 20); do
  if python3 -c "import urllib.request; urllib.request.urlopen('${URL}/')" 2>/dev/null; then
    open "${URL}"
    break
  fi
  sleep 0.3
done

wait "${SERVER_PID}"
