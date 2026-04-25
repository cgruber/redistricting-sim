<!--COMPRESSED v1; source:2026-04-25-project-build-hygiene.md-->
§META
date:2026-04-25 researcher:claude+cgruber commit:485258c137d6 branch:main
repo:cgruber/redistricting-sim
topic:Project build hygiene — hermetic builds, idempotent setup, environment management
tags:build,bazel,ci,tooling,hygiene,setup,playwright,pnpm
status:living — add lessons as v1 progresses; promote to infra proposal post-v1

§SUMMARY
Lessons from Sprint 1 setup. Running record to shape into infra-level proposal after v1.

§PRINCIPLE1 — separate what build system owns from what it doesn't
Bazel owns: language toolchains (rules_ts→tsc, rules_rust→Rust+wasm32, rules_rust_wasm_bindgen→wasm-bindgen), compile, test, package — all fetched via bzlmod; no system rustup|wasm-pack|tsc needed
Setup script owns: node_modules/ (Playwright sh_test wrapper needs host-fs) + Playwright browser binaries (~/.cache/ms-playwright/)
Rule: check MODULE.bazel first; if a Bazel rule can manage it→put it there; setup script is last resort

§PRINCIPLE2 — setup scripts must be idempotent
pnpm install --frozen-lockfile → verifies node_modules vs pnpm-lock.yaml; exits fast if current
pnpm exec playwright install chromium → skips download if correct version already in cache
Consequence: same script for developer onboarding + CI (CI installs system prereqs first, then ./setup.sh)
Rule: every step → "what if run twice?"; if not no-op (or safe), rethink

§PRINCIPLE3 — version-lock tool invocations not just dependencies
Failure mode: setup.sh installs browsers for lock-file Playwright version; e2e_test.sh calls npx playwright→resolves different version→"Executable doesn't exist" or silent divergence
Fix: both scripts use pnpm exec playwright; resolves node_modules/.bin/ (always lock-file version)
Rule: use pnpm exec <tool> wherever version must match lock file; npx only for one-off non-lock tools

§PRINCIPLE4 — prerequisite checks: fail fast + actionable
Pattern:
  MISSING=()
  if ! command -v pnpm >/dev/null 2>&1; then MISSING+=("pnpm (>= 8) — ..."); fi
  [[ ${#MISSING[@]} -gt 0 ]] && { for item in "${MISSING[@]}"; do red "  - $item"; done; exit 1; }
Check: system prereqs script cannot install (node,pnpm,python3,bazel)
Don't check: Bazel-managed toolchains (Rust,TS,wasm-bindgen) — not prereqs; Bazel fetches on first build
Include install command in error message
AVOID: $(cmd) inside MISSING+=() strings — runs at array-population time; fails on Linux/CI without that tool

§PRINCIPLE5 — CI-hostile output
ANSI guard:
  green() { if [[ -t 1 ]]; then printf '\033[0;32m%s\033[0m\n' "$*"; else printf '%s\n' "$*"; fi; }
Other CI-hostile patterns to avoid:
  interactive prompts → provide --non-interactive flag
  relative paths assuming CWD → anchor with SCRIPT_DIR via BASH_SOURCE[0]
  hardcoded absolute tool paths → use command -v or extend PATH + document why

§PRINCIPLE6 — one setup script per workspace
Don't split into install-deps.sh | install-browsers.sh | etc. — single idempotent setup.sh is simpler to call from CI
Right split = between workspaces (each gets its own setup.sh); bazel manages everything within

§OPEN
- CI caching strategy for ~/.cache/ms-playwright/ + node_modules/ between runs?
- Playwright browser cache version-keying in CI after Playwright upgrade?
- Multiple workspaces: per-workspace setup.sh or root orchestrator? (lean: per-workspace for isolation)
- bazelisk-as-bazel check: currently in game/setup.sh; may move to global setup as project grows
