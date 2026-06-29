<!--COMPRESSED v1; source:AGENTS.md-->
§META
layer:repo scope:redistricting-sim

§ABBREV
ts=thoughts/shared
opt=/opt/geekinasuit/agents int=$opt/internal pub=$opt/public

§PURPOSE
Educational simulator: gerrymandering dynamics, district-boundary effects on electoral outcomes.
Stack: TypeScript browser game, SVG/D3 map rendering, client-side election simulation, Bazel build
(validated via early spikes, since removed — impl in game/). See $ts/vision/game-vision.compressed.md for full scope.

§DOCS
$ts/ docs have two forms: <name>.md(human) + <name>.compressed.md(token-efficient,lossless)
compressed: §SECTION markers + §ABBREV table; all §ABBREV refs use $abr format; definition left-sides bare

§SUBAGENTS
always include working directory in subagent prompt — eliminates navigation errors + wrong-place failures

§NOINLINE [NON-OPTIONAL]
FORBIDDEN in any Bash tool call:
  heredocs: cmd << 'EOF'...EOF
  inline multi-line strings: -m "line1\nline2" or -F body="text with `backticks`"
  command substitution: cmd $(other_cmd)
  any string containing backticks|---| asterisks passed as a shell argument
REQUIRED pattern — no exceptions:
  write body/prompt/message → /tmp/<repo>-<branch>-<purpose>.md via Write tool
  reference by path: --body-file /tmp/... | -F body=@/tmp/... | Agent prompt:"Read instructions from /tmp/..."
unique tmp names: include repo+purpose+context; never /tmp/pr-body.md — collides
THIS RULE APPLIES TO SUBAGENTS TOO

§LAYOUT
$ts/vision/     game vision+design docs — READ FIRST; anchors everything
$ts/research/   read before implementing
$ts/tickets/    TICKETS.md index + ticket files; check before starting new work
$ts/plans/      implementation plans
$ts/handoffs/   session handoff documents
game/web/   the game: TypeScript app(src/), e2e tests, Bazel build
game/       rust/(wasm), scenarios/, release.main.kts + deploy tooling

before non-trivial impl: check $ts/vision/ + $ts/tickets/TICKETS.md + $ts/research/ for prior work

SPIKES: complete + REMOVED (SPIKE-001 TS/npm game stack, SPIKE-002 Bazel build — validated the stack; impl now in game/; dead spike code deleted, in git history). reports preserved: $ts/research/spike-001-game-poc-report.md + spike-002-build-poc-report.md
future spike(if ever): own spike/NNN-*/ independent root(no cross-repo imports); on-PATH cmds by name; lightweight commits during; one PR + full review cycle at completion

§PR
task-list-completed CI check scans ALL checkboxes — PR description AND every comment (inline included).
ANY unchecked `- [ ]` blocks merge permanently; check does NOT time out.
critique agents often post `- [ ]` items; once fixed, edit comment via gh api PATCH to `- [x]`.
  gh api repos/<org>/<repo>/pulls/comments/<id> -X PATCH -F body=@/tmp/...
exclude from blocking: add N/A|POST-MERGE|OPTIONAL keyword to the checkbox line.

§TICKETS
TICKETS.md=canonical index; do NOT maintain ticket inventories elsewhere
any ticket file create|modify|resolve|delete → update TICKETS.md in same op

ID categories (sequential within each):
  KT = Kotlin (dormant — Kotlin removed)
  DB = database schema, migrations, tooling
  BUILD = build system+tooling
  CI = CI, automation, testing infrastructure
  OPT = performance optimization
  AGENT = agentic workflow+tooling changes
  SPIKE = time-boxed proof-of-concept investigations
  LEGAL = legal, content liability, compliance research
  DIST = distribution, deployment, platform research
  DESIGN = game design, UX, ergonomics research
  GAME = game implementation (rendering, simulation, content, game loop)
check TICKETS.md Open+Resolved sections for highest existing ID in category before creating new ticket; files deleted on resolve but IDs stay in index permanently — filesystem check alone causes collisions

ticket file conventions:
  filename: <ID>-<kebab>.md in $ts/tickets/
  frontmatter: id title area status(open|resolved) created; optional: github_issue:N
  required sections: Summary, Current State|Resolution, Goals|acceptance criteria, References
  resolved ONLY when ALL work complete

GitHub Issues:
  create when starting work on ticket(not before, not at PR-open)
    kotlin $opt/tools/gh-ticket.main.kts -- create <ticket-path>
  PR ref: "see #N" — NEVER fixes|closes; close manually at full DoD

§PROCESS [MANDATORY READ — especially after context compaction]
sprint-based + TDD-informed workflow; two docs govern planning+execution:
1. sprint roadmap: $ts/plans/2026-04-25-sprint-roadmap.compressed.md
   checkpoint-based(not time-boxed); current sprint scope+backlog+blocking questions
   updated at sprint close(outcomes)+start(scope); check before starting work
2. TDD workflow: $ts/research/2026-04-21-multi-agent-tdd-workflow.compressed.md
   tests alongside/before impl; every ticket includes test AC as DoD; PRs w/o tests=incomplete
READ BOTH on every context load; after compaction process context is lost

§TESTING
prefer unit tests first; pure domain functions need no infrastructure
prefer fakes|stubs over mock frameworks; mocks couple to impl; fakes test behavior
integration tests: cover use-case scenarios(happy path,edge cases,error paths); not coverage metrics

§RESEARCH
research docs: $ts/research/ | YYYY-MM-DD-<description>.md + .compressed.md companion; always produce both
frontmatter: date researcher git_commit branch repository topic tags status last_updated last_updated_by

§DEPLOY
tool: ALWAYS invoke `game/release.main.kts -- <cmd>` from REPO ROOT (never `./release.main.kts`, never cd game/ — one form so the permission allowlist matches; the `--` separates kotlin args from script args). Avoid trailing `| tail`; capture via `> /tmp/out` if needed.

environments: dev=dev.pastthepost.gg beta=beta.pastthepost.gg staging=staging.pastthepost.gg production=pastthepost.gg
vTEST-* builds: ONLY to dev; beta/staging/production require a semver release (main)
production: NEVER deploy without explicit user sign-off (every time). NOTE prod currently serves the Coming Soon splash; the game runs on beta until launch
deploy auto-detects the sole staged version — OMIT --version (pass it only if several are staged)

dev (vTEST) build — on a branch:
  game/release.main.kts -- prepare                   # vTEST-<commitid>; no tag
  game/release.main.kts -- deploy --env dev

release deploy (on main):
  game/release.main.kts -- prepare                   # auto-bumps semver; creates+pushes tag
  game/release.main.kts -- deploy --env beta         # or --env staging
  # production only AFTER explicit user approval:
  game/release.main.kts -- deploy --env production

§CHAIN Bootstrap — execute exactly one branch (stop after match):
when {
  $int/AGENTS.compressed.md exists → read+follow; exit chain
  $int/AGENTS.md exists → read+follow; exit chain
  $pub/AGENTS.compressed.md exists → read+follow; exit chain
  $pub/AGENTS.md exists → read+follow; exit chain
  ~/.geekinasuit/agents/public/AGENTS.compressed.md exists → read+follow; exit chain
  ~/.geekinasuit/agents/public/AGENTS.md exists → read+follow; exit chain
  else → skip; bootstrap complete
}
