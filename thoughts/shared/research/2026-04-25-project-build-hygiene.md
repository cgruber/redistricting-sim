---
date: 2026-04-25
researcher: claude + cgruber
git_commit: 485258c137d6
branch: main
repository: cgruber/redistricting-sim
topic: Project build hygiene — hermetic builds, idempotent setup, environment management
tags: build, bazel, ci, tooling, hygiene, setup, playwright, pnpm
status: living — add lessons as v1 progresses; promote to infra proposal post-v1
last_updated: 2026-04-25
last_updated_by: claude
---

# Project Build Hygiene: Hermetic Builds, Idempotent Setup, Environment Management

Lessons learned from Sprint 1 setup of `redistricting-sim`. Intended as a running record
of principles and decisions that work well, so they can be shaped into an infra-level
proposal after v1 ships.

---

## Principle 1: Separate what the build system owns from what it doesn't

**The split:**
- **Build system (Bazel) owns everything it can**: language toolchains (TypeScript via `rules_ts`,
  Rust via `rules_rust`, wasm-bindgen via `rules_rust_wasm_bindgen`), compilation, linking,
  test running, artifact packaging. These are downloaded and pinned via bzlmod — no system
  `rustup`, `wasm-pack`, or global TypeScript install needed.
- **Setup script owns the rest**: things the build system cannot manage because they are
  outside its sandbox — `node_modules/` (the Playwright test runner wrapper needs these on the
  host filesystem) and Playwright browser binaries (installed machine-globally to
  `~/.cache/ms-playwright/`).

**Why this matters:**
Conflating the two creates either an over-broad setup script (that duplicates what Bazel handles)
or an over-reliant build (that assumes system toolchains are pre-installed at matching versions).
The clean split means: `bazel build //...` and `bazel test //...` are reproducible anywhere
that has `bazel` on PATH, without any other per-language prerequisites.

**Decision**: Check `MODULE.bazel` first when evaluating whether a dependency goes in the
setup script. If a Bazel rule can manage it, put it there; setup script is the last resort.

---

## Principle 2: Setup scripts must be idempotent

`game/setup.sh` can be run repeatedly without side effects:
- `pnpm install --frozen-lockfile` verifies `node_modules/` against `pnpm-lock.yaml` and exits
  quickly if everything is already current.
- `pnpm exec playwright install chromium` checks whether the Playwright-version-matched Chromium
  binary already exists in `~/.cache/ms-playwright/` and skips download if so.

**Consequence for CI:** The same script is usable for both developer onboarding and CI setup.
CI only needs to install the system prerequisites (node, pnpm, python3, bazel) before calling
`./setup.sh`. No separate CI-specific setup path.

**Rule**: Every step in a setup script should be testable with "what happens if I run this twice?"
If the second run is not a no-op (or at least safe), rethink the step.

---

## Principle 3: Version-lock tool invocations, not just dependencies

When multiple entry points can invoke the same tool (e.g. `setup.sh` installing Playwright
browsers, `e2e_test.sh` running Playwright tests), they must both resolve to the same binary.

**The failure mode**: `setup.sh` installs browsers for the version pinned in `pnpm-lock.yaml`.
`e2e_test.sh` calls `npx playwright test`, which can resolve a *different* Playwright version
from the npm registry — "Executable doesn't exist" errors, or silent behavioral divergence.

**Fix applied**: Both scripts use `pnpm exec playwright ...`. `pnpm exec` resolves from
`node_modules/.bin/`, which is always the version pinned in `pnpm-lock.yaml`.

**Rule**: Use `pnpm exec <tool>` (or the equivalent for your package manager) anywhere you
invoke a tool that should match the lock file version. Reserve `npx` only for one-off uses
of tools not in your lock file.

---

## Principle 4: Prerequisite checks should fail fast and be actionable

Setup scripts that assume prerequisites exist and fail mid-run with cryptic errors waste
developer time. Better pattern:

```bash
MISSING=()
if ! command -v pnpm >/dev/null 2>&1; then
  MISSING+=("pnpm (>= 8) — install via 'npm install -g pnpm' or 'brew install pnpm'")
fi
# ... more checks ...
if [[ ${#MISSING[@]} -gt 0 ]]; then
  for item in "${MISSING[@]}"; do red "  - ${item}"; done
  exit 1
fi
```

**Notes on what to check:**
- Check system prerequisites the script *cannot* install (node, pnpm, python3, bazel).
- Do NOT check things the build system manages (Rust, TypeScript, wasm-bindgen) — they are
  not prerequisites; Bazel fetches them on first build.
- Include the install command in the error message — "install via X" takes 10 seconds to write
  and saves the developer a web search.

**Avoid command substitution in error message strings.** `$(brew --prefix)` inside a
`MISSING+=()` element runs at array-population time, which fails on Linux/CI where brew is absent.
Use a static string instead.

---

## Principle 5: CI-hostile output patterns

Avoid ANSI escape codes in scripts that run in CI without guarding on terminal detection:

```bash
# Bad — unconditional ANSI
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }

# Good — CI gets plain text, terminals get colour
green() { if [[ -t 1 ]]; then printf '\033[0;32m%s\033[0m\n' "$*"; else printf '%s\n' "$*"; fi; }
```

Other CI-hostile patterns to avoid:
- Interactive prompts (`read -p`): always provide a `--yes` / `--non-interactive` flag.
- Relative paths that assume a working directory: anchor with `SCRIPT_DIR` via `BASH_SOURCE[0]`.
- Hardcoded absolute paths to local tools (e.g. `/opt/homebrew/bin/pnpm`): use `command -v`
  to locate them, or extend PATH explicitly and document why.

---

## Principle 6: One setup script, not many

Resist the temptation to split setup across multiple scripts (`install-deps.sh`,
`install-browsers.sh`, `check-prereqs.sh`). A single `setup.sh` that is idempotent is
easier to reason about, easier to call from CI, and easier to document.

The right split is *between projects*, not *within a project*: each workspace (e.g. `game/`)
has its own `setup.sh`. `bazel` manages everything else.

---

## Open Questions / Future Lessons

- How should CI be structured to call `game/setup.sh`? What caching strategy for
  `~/.cache/ms-playwright/` and `node_modules/` between CI runs?
- Does the Playwright browser binary cache need to be version-keyed in CI (to avoid a stale
  cache after a Playwright upgrade)?
- For future workspaces beyond `game/`: does each get its own `setup.sh`, or does a
  root-level `setup.sh` orchestrate them? (Lean toward per-workspace for isolation.)
- Does `bazelisk` as `bazel` need to be in the setup script's prerequisite check at the
  workspace level? Currently yes in `game/setup.sh`, but this may move to a global setup
  script as the project grows.
