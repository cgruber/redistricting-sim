<!--COMPRESSED v1; source:AGENTS.md-->
§META
layer:repo scope:redistricting-sim

§ABBREV
ts=thoughts/shared
opt=/opt/geekinasuit/agents int=$opt/internal pub=$opt/public

§PURPOSE
Educational simulator: gerrymandering dynamics, district-boundary effects on electoral outcomes.
Stack TBD via parallel spikes — working direction: TypeScript browser game, SVG/D3 map rendering,
client-side election simulation. See $ts/vision/game-vision.compressed.md for full scope.

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
spike/001-game-poc/   SPIKE-001: game tech stack proof-of-concept (TypeScript/npm) — independent source root
spike/002-build-poc/  SPIKE-002: harmonized Bazel build proof-of-concept — independent source root

before non-trivial impl: check $ts/vision/ + $ts/tickets/TICKETS.md + $ts/research/ for prior work

SPIKE ISOLATION: work directly in main repo checkout; touch ONLY spike/NNN-name/**; no other repo files; no jj workspaces
SPIKE COMMANDS: use names (npm,bazel,node) not absolute paths; all tooling must be on PATH
SPIKE COMMIT WORKFLOW:
  during: commit after each logical chunk; run build+tests before commit; squash fixes freely; no PR
  at completion: all AC met + SPIKE-REPORT.md written → one PR → full critique cycle → merge
SPIKE CHECKPOINTING: maintain PROGRESS.md in spike dir; update+commit with each chunk
  format: working-dir(absolute path inside repo e.g. .../redistricting-sim/spike/NNN-name/) | status | AC checklist(next-up bolded) | decisions(non-obvious only) | blockers
  resuming agent: read ticket → PROGRESS.md → jj log; continue from Next up
  keep under 30 lines; skip anything evident from ticket or code

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

§TESTING
prefer unit tests first; pure domain functions need no infrastructure
prefer fakes|stubs over mock frameworks; mocks couple to impl; fakes test behavior
integration tests: cover use-case scenarios(happy path,edge cases,error paths); not coverage metrics

§RESEARCH
research docs: $ts/research/ | YYYY-MM-DD-<description>.md + .compressed.md companion; always produce both
frontmatter: date researcher git_commit branch repository topic tags status last_updated last_updated_by

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
