---
date: 2026-06-27
researcher: Claude (Opus 4.8, multi-agent review) + Christian Jackson-Gruber
git_commit: 3c3c3a68492c
branch: HEAD (post #297)
repository: cgruber/redistricting-sim
topic: Whole-codebase quality review of the TypeScript game (game/web)
tags: [quality, architecture, testing, security, typescript, refactoring, a11y, review]
status: complete
last_updated: 2026-06-27
last_updated_by: Claude
---

# Codebase Quality Review — redistricting-sim (game/web)

## Method

Read-only quality pass over `game/web` (~9.5k lines source, ~6k lines colocated
tests). Ten parallel dimension reviewers (architecture/SOLID, test sufficiency,
security, idiomatic TS, DRY, tooling/build, state, simulation correctness, a11y,
error-handling) each ran with: the project's known-intentional conventions as a
DO-NOT-FLAG list, a verbatim standing-adversarial de-biasing block (surface ≥2
unlisted concerns, re-read from a hostile angle, attack the validation), and a
web/TS-specific failure-mode checklist. Each dimension's findings then went
through an **adversarial verifier** that opened the cited file/line and kept a
finding only if it was factually accurate AND a real defect (not taste fighting a
legitimate convention). **43 findings survived verification.** The
highest-leverage findings were then independently re-confirmed by hand, and a
grok-4 external model gave a decorrelated second opinion on the decomposition of
the three god-files.

**Baseline:** `bazel test //game/...` is **green — 39/39 targets pass**, typecheck
included. Every finding below is a latent or maintainability defect; none break
the current build. `tsconfig` is strict (`strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitReturns`). There is **no
ESLint/Biome/Prettier and no lint/format gate anywhere** in `game/` — the
strict compiler is the only static check.

**What's genuinely good (so the report is calibrated):** the domain core is
clean and well-isolated — `simulation/{election,evaluate,validity}`, the
pipeline stages, and the loader's invariant checks all have real, edge-case-aware
unit tests; no `enum`s (consistent union literals); zero `@ts-ignore`; only three
`as unknown as` casts; branded ID types; careful `noUncheckedIndexedAccess`
handling. The problems are concentrated in the three god-files, the untested UI
layer, and the absence of a linter — not spread through the domain logic.

---

## The 7 themes that matter most

### Theme 1 — The safety-critical loader is duplicated and accepts malformed numbers
*loader.ts, runtime-types.ts, population-stage.ts*

`loader.ts` (1629 lines) gates every scenario the game loads, and
`loadScenario = validateScenarioComplete(parseScenario(json))` runs **both**
validators on every production load (`loader.ts:1628`). The
terrain/river/group-schema/uniqueness logic is reimplemented twice —
`validateStructural` (`loader.ts:1115-1471`, partial-data path) and
`validateScenarioInvariants` (`loader.ts:538-937`, complete-data path) — with the
terrain/river blocks near byte-identical (`807-936` vs `1366-1470`). A rule
changed in one copy silently diverges the parse-time and gameplay paths, with no
test catching it.

Worse, the core numeric guard `requireNumber` (`runtime-types.ts:28-31`) is
`typeof`-only, so `NaN`/`Infinity`/negative all pass. A `NaN` share **defeats the
very `Math.abs(sum - 1) > EPSILON` sum-invariant meant to catch malformed
demographics** (NaN > EPSILON is false → the check passes), and a corrupt
`total_population` makes `pluralityWinner` (`election.ts:26-32`) silently return a
plausible-but-wrong `'R'` win instead of erroring. Loader tests are
in-distribution only (no `NaN`/`Infinity`/negative fixtures) and structurally
cannot catch this. Population generation (`population-stage.ts:381,399`) never
floors at 0, making negative populations reachable in principle.

### Theme 2 — Win/lose correctness logic is stranded in an untested controller, with a leaky renderer boundary
*main.ts, mapRenderer.ts*

`main.ts` (1621 lines) is the only behavioral file with **no testable seam**, yet
it owns the central game output: `computeStarCount` / `buildValidityRows`
(`main.ts:840-882`), `overallPass` / `maxStars` (`main.ts:1040-1088`). e2e drives
this through the real store and cannot independently verify the star/validity
arithmetic. The verdict text/state logic is duplicated (`revealVerdict`
`1139-1162` vs `syncOverallVerdict` `1212-1237`) and **already differs in one
branch**. The result-screen reveal relies on a 3-site implicit cancellation
protocol over shared mutable timer state (`main.ts:1107-1110, 1245-1289,
1411-1458, 1513-1518`). Separately, `SvgMapRenderer` breaks its stated swappable,
store-read-only contract by writing `#precinct-info` innerHTML and binding a
`document` keydown directly (`mapRenderer.ts:968-984, 1133-1161`) instead of using
the constructor-injection pattern it already uses for `paintStroke` /
`setActiveDistrict` (`mapRenderer.ts:350-355`).

### Theme 3 — Client-side injection surface: unescaped scenario strings into innerHTML
*panels.ts, mapRenderer.ts, main.ts, index.html*

Scenario-derived free-form text reaches `innerHTML` sinks unescaped where the
safe `textContent` pattern (used by `renderDistrictButtons`) deliberately
avoids it: `panels.ts:28-40` (party/winner labels) and the high-frequency hover
sink `mapRenderer.ts:1149-1160` (precinct / county / group names, all through
`requireString` which is type-only). The CSP backstop is undermined: `script-src`
includes `data:` (`index.html:10`, only to satisfy the importmap react shim),
letting any injection point load arbitrary script. `showLoadError` interpolates
error text into innerHTML with an inline `onclick` (`main.ts:444-453`).

**Not a live XSS today** — scenarios are same-origin, team-authored static assets
fetched from `./scenarios/<manifest-id>.json` with the id constrained to a
hardcoded manifest. But the moment any less-trusted text (a user-named save, an
imported scenario, an echoed query param — all on the documented roadmap) flows
through these sinks, it is an execution vector. **One shared `escapeHtml()` /
createElement helper closes all four.**

### Theme 4 — Accessibility is broken for keyboard and screen-reader users
*main.ts, index.html, overlay.ts*

`grep '.focus('` across `game/web/src` returns **zero hits** — focus is never
moved on any screen/modal transition (`main.ts:366, 692, 1471, 1585`), a WCAG
2.4.3 violation; the a11y suite misses it because `a11y.spec.ts:55` pre-focuses
elements itself. Full-screen overlays carry no `role="dialog"`/`aria-modal` and
nothing makes the underlying content inert (`index.html:75,93,104,137`): a
keyboard user tabbing the result screen **falls through into the live editor and
can paint precincts or re-submit behind the modal**. The tutorial input-lock is
`pointer-events`-only (`overlay.ts:369-374`) so keyboard bypasses the freeze. Plus
a `role="list"` with non-listitem children (`index.html:68`) and a hardcoded
"1–5" key-range label on scenarios that ship 2–4 districts (`index.html:200`).

### Theme 5 — Single-source-of-truth drift in domain constants and logic
*election.ts, types.ts, styles.css, mapRenderer.ts, adapter.ts*

The party set `{R,D,L,G,I}` is redefined in 5+ disconnected places
(`election.ts:17` et al.) and the copies **already drift** — `mapRenderer.ts:1137`
orders D before R. An array literal that omits a party type-checks fine but
silently drops it from winner/margin math. `PARTY_COLORS` hex is hardcoded a
second time in `styles.css:420` against the authoritative `types.ts:171-173`,
producing side-by-side visual drift. District-color fallback diverges (`#2a2a3e`
vs `#888`) with no `MAX_DISTRICTS` guard, so a 6th district would render as
"unassigned." Most user-visible: **the tie-break direction is inconsistent** — the
live election favors R (`election.ts:25-33`, strict `>`) while the displayed
precinct/district winner favors D (`adapter.ts:126`, `>=`) — a direct
contradiction in a game about who-wins-where, with **both rules cemented by
opposing test assertions** (`adapter_test.ts:162` vs `evaluate_test.ts:210`).

### Theme 6 — The test infrastructure can pass green while broken
*test_runner.ts, BUILD.bazel, loader_integration_test.ts, evaluate.ts*

The harness exit status depends on a manual `summarize()` call as the last line
of all 21 test files (`test_runner.ts:16-26, 107-115`) — `test()` catches and does
**not** rethrow, and there is no `process.on('exit')` hook, so dropping that line
in a merge makes real failures exit **green**. No backstop catches an unwired
`_test.ts`: a new colocated test passes locally but CI never runs it. The
integration test iterates a hardcoded 12-scenario table instead of globbing
(`loader_integration_test.ts:43-90`) — the "generator emits ALL scenarios"
philosophy guarantees future content silently escapes validation.
`evaluateCriteria` has no exhaustiveness guard (`evaluate.ts:187-326`,
assignment-style switch with no `default`/never-assertion) — adding a 10th
`Criterion` variant compiles and yields a silent `passed=false` verdict, which
neither `noImplicitReturns` nor `noFallthroughCasesInSwitch` can catch. Plus
untested branches (`safe_seats`/`competitive_seats` boundaries, `getCriterionIcon`)
and a vestigial test data-dep on dead `generator.ts`.

### Theme 7 — Unhappy paths and build/deploy fail silently (+ no linter/formatter baseline)
*index.html, main.ts, gameStore.ts, release.main.kts, package.json*

The WASM init promise has **no `.catch()`** (`index.html:291-299`): the entire
game is hard-gated behind a kernel **nothing in `src` ever calls** (verified: zero
`wasm_bindgen` references), so a `.wasm` load failure yields a permanently blank
page with no error. Scenario fetch shows a blank dead-zone with no loading
indicator or timeout (`main.ts:458-468`). WIP save/restore **drops null
precincts** (`main.ts:542-543`, `gameStore.ts:111-118`), defeating the
all-precincts-assigned win-gate; stale WIP restores into regenerated scenarios
unchecked (`main.ts:526-536`); zundo keeps full snapshots with a header comment
that is literally wrong (`gameStore.ts:5,63-132`), and undo reverts the active
district (invisible to its own assignment-only test).

On the build side, deploy index.html patches **warn-but-don't-error**
(`release.main.kts:383-413`) — a routine reformat silently ships broken
cache-busting while the deploy reports success; the idempotency guard scrapes
only the tip commit; the genrule would misfile a future `assets/*.json`; a stale
`pnpm-lock.yaml` invites divergent install resolution.

**Meta:** with no linter/formatter, the residual type-safety gaps are exactly the
class the compiler *can't* catch — non-null assertions on optional fields
(`assembler.ts:12-59`), missing exhaustiveness, and the duplicated literals of
Theme 5. A lint + format gate is the systemic backstop for that whole class — and
a format gate is also what makes the reformat-breaks-deploy hazard impossible.

---

## Top 10 highest-leverage fixes (recommended order)

Ordered by leverage — a one-line fix that turns a **silent** failure into a
**loud** one, on a path everything depends on, outranks a high-severity refactor.

1. **Make the test harness fail loud.** Register
   `process.on('exit', () => { if (_failed > 0) process.exitCode = 1; })` in
   `test_runner.ts`. *Until this lands, every test in the repo is untrustworthy —
   a dropped `summarize()` exits green.* One line, highest leverage.
2. **Harden `requireNumber`** (`runtime-types.ts:28-31`): `if (!Number.isFinite(v))
   throw`; add range checks (`total_population >= 0`, shares `0..1`); floor
   population in `population-stage.ts`; add the adversarial loader-test cases that
   fail today. *Closes the NaN-passes-the-sum-check hole on the file that gates
   every scenario.*
3. **Add an exhaustiveness guard to `evaluateCriteria`** (`evaluate.ts`):
   `default: { const _x: never = c; throw … }` + a shared `assertNever` helper.
   Turns "added a Criterion variant → silent false verdict" into a compile error.
4. **Give WASM a `.catch()` and decouple `bundle.js` — or delete it**
   (`index.html:291-299`). Nothing calls `wasm_bindgen`; either render a visible
   "Failed to start" overlay and load `bundle.js` in both `.then`/`.catch`, or
   remove the script tags and the `//game/rust` dep entirely.
5. **Fix focus management and overlay modality** (`main.ts` transitions;
   `index.html` overlays). Move focus into each newly-shown region; mark overlays
   `role="dialog" aria-modal="true"` and set editor roots `inert` while shown. Add
   an e2e that does NOT pre-focus.
6. **Centralize escaping across innerHTML sinks** (`panels.ts:28-40`,
   `mapRenderer.ts:1149-1160`, `main.ts:444-453`) with one `escapeHtml()` /
   createElement helper; remove `data:` from `script-src` via a same-origin stub
   module. *One fix, four findings.*
7. **Reconcile the tie-break contradiction and single-source the party set.**
   Extract one `winnerOf(share)` helper used by both `election.ts` and
   `adapter.ts`; export `ALL_PARTIES`/`PartyKey` from `types.ts` and import
   everywhere. *The D-vs-R tie contradiction is a user-visible correctness bug in
   the core mechanic.*
8. **Move win/star logic into the tested layer** (`computeStarCount` /
   `buildValidityRows` → `simulation/verdict.ts` as pure functions with a
   `_test.ts`); extract one `applyVerdictUI(…)` so the normal and debug-replay
   paths can't diverge. **(Grok recommends doing this restructuring first — see
   below.)**
9. **De-duplicate the loader validation core** (`loader.ts`). See the
   internal-vs-grok tradeoff below — this is the one fix where the *approach* is a
   real decision, not just execution.
10. **Make deploy patches and unwired tests fail CI** (`release.main.kts:383-413`
    warn → `err()`+`exitProcess(1)` + a post-write assertion; a meta-test globbing
    `src/**/*_test.ts` for a matching `js_test`). **Then wire a linter (ESLint or
    Biome) + formatter gate** — there is none today — which subsumes the
    non-null-assertion and literal-drift classes and makes the deploy reformat
    hazard impossible.

*The WIP-save null-dropping bug and the rest of Theme 7 are real but scoped to
the save path; fix in the next pass.*

---

## External second opinion (grok-4) — decorrelated, non-gating

Verify before acting (diverse models → diverse false positives). The decorrelator
agreed with the internal review on B and C and **sharpened A**:

- **Loader (A): prefer single-pass-after-normalization over predicate
  extraction.** The internal review's "extract shared predicates called by both
  paths" is locally correct but *keeps the partial/complete split alive, and
  therefore keeps the drift risk alive*. The deeper fix is to make the model a
  single normalized representation (optionals filled with explicit defaults /
  unions narrowed at parse time) and validate **once**; the "complete" path then
  disappears and the byte-identical terrain/river blocks collapse to one
  unguarded pass. The two-pass design only buys (1) slightly earlier structural
  errors and (2) "missing field" vs "bad value" distinction — neither justifies
  the maintenance cost when the invariants are identical.
  **Tradeoff for the report:** predicate-extraction is lower-risk and incremental
  (keeps current control flow); normalize-then-validate-once is architecturally
  superior but a larger change touching `adapter.ts` and the runtime types. The
  recommendation is normalize-once if the loader is going to keep growing;
  predicate-extraction as the minimum if not.
- **Verdict (B):** agrees with the move, and adds — treat verdict as a pure
  *projection* of `evaluate` + `validity` and remove the inline verdict logic from
  the controller entirely, not just the pure part.
- **Renderer (C):** the injection fix is correct and minimal; no deeper smell.
- **Two risks the internal pass under-weighted:** (1) `main.ts` is the *real* god
  object — moving two functions doesn't fix the IIFE that couples DOM events,
  store subscriptions, renderer lifecycle, and zundo history; that's the seam a
  future Canvas renderer or scenario-import will fight. (2) zundo full-snapshot
  history is coupled to the raw store shape — a normalization change or a new
  validity field silently changes undo memory and serialization with no seam.
- **Sequencing:** do **B (verdict extraction) first** — pure logic, ~zero
  regression risk, and it shrinks the later `main.ts` cleanup; A and C touch
  shared mutable paths and should follow.

---

## Completeness critic — what this review did NOT cover

1. **Is the political-science math itself correct?** Every one of the 43 findings
   audits "does the code do what it intends," none audit "is the intent correct."
   For an *educational* sim, the load-bearing question is whether the
   **efficiency-gap formula, mean-median calculation, and seat-allocation logic**
   are faithful teaching models. The findings only check that the arithmetic runs
   (NaN-safety, tie-consistency, thresholds) — a subtly-wrong efficiency-gap
   denominator would pass every test here and still mis-teach. **Needs a
   domain-expert review against reference definitions, separate from code
   review.**
2. **Performance at classroom scale.** No finding profiles per-precinct SVG node
   count or the full-snapshot undo history on low-end school hardware.
3. **Dead/unwired code as a dimension.** Dead WASM and dead `generator.ts` were
   each caught incidentally; their co-occurrence suggests a deliberate
   import-graph-vs-actual-imports sweep would surface more.
4. **Content correctness.** No check of scenario prose accuracy, reading level, or
   the factual framing of the educational content.

---

## Triage

**Fix now (one-line / low-risk, high leverage — a tight first PR):**
test-harness exit hook (1); `requireNumber` finiteness + loader adversarial tests
(2); `evaluateCriteria` exhaustiveness + `assertNever` (3); WASM `.catch()` or
removal (4). These are small, independently verifiable, and turn silent failures
loud.

**File tickets (real work, scoped):** focus/overlay a11y pass (5) — likely a
GAME ticket with its own e2e; escaping helper + CSP `data:` removal (6); tie-break
+ party-set single-sourcing (7); verdict extraction to `simulation/verdict.ts`
(8, grok says do first among refactors); loader de-duplication (9, decide
predicate-extraction vs normalize-once); deploy hard-fail + lint/format gate (10);
WIP-save null-drop correctness bug; the larger `main.ts` god-controller
decomposition (grok's risk #1).

**Leave as-is / low priority:** the dead-`generator.ts` data-dep, the genrule
`*.json` misfile guard, the stale `pnpm-lock.yaml`, the `role="list"` listitem and
"1–5" label nits — real but cosmetic/latent; sweep them when touching those files.

**Recommended separate effort (not code review):** a domain-expert audit of the
gerrymandering metrics against reference definitions (completeness-critic #1).

---

## Appendix — all 43 verified findings

Severity rollup: **6 distinct highs (7 finding rows — the loader-duplication
high is listed under both Architecture and DRY), ~18 medium, ~18 low.** Grouped
by dimension; each was opened-and-confirmed by an adversarial verifier
(severities already de-inflated). The two `high` structural claims that carry the
report — the loader dual-validation duplication and the WIP null-drop dataflow —
were additionally re-confirmed by hand against source.

### Architecture & SOLID
- **high** Two parallel scenario-invariant implementations can silently drift — `loader.ts:538-937` vs `1115-1466`
- **med** Win/star correctness logic stranded in untested controller — `main.ts:840-882, 1040-1088`
- **med** `SvgMapRenderer` breaks its swappable/store-read-only contract (`#precinct-info` innerHTML + document keydown) — `mapRenderer.ts:968-984, 1133-1161`
- **med** Result-screen reveal: shared mutable timer/handler state across 3 reset paths, implicit protocol — `main.ts:1107-1110, 1245-1289, 1411-1458, 1513-1518`

### Test sufficiency & organization
- **med** `safe_seats`/`competitive_seats` criterion branches: no unit test (boundary/rounding gap) — `evaluate.ts:229-246`, `evaluate_test.ts`
- **med** Integration test iterates a hardcoded scenario table, not the globbed files — `loader_integration_test.ts:43-90`
- **med** Harness exit status depends on a manual `summarize()`; a forgotten call exits green — `test_runner.ts:16-26, 107-115`
- **med** No backstop catches an unwired `_test.ts` — `*/BUILD.bazel`
- **low** `getCriterionIcon` pure + branchy, no test, no icon/type exhaustiveness guard — `criterion-icons.ts:102-111`
- **low** `adapter_test` carries a vestigial `generator_lib` data dep; `generator.ts` is dead — `model/BUILD.bazel:178`

### Security (client-side, narrow scope)
- **med** Scenario-JSON party/winner strings → unescaped innerHTML (latent stored XSS) — `panels.ts:28-40`
- **med** Precinct/county/group names → unescaped hover innerHTML — `mapRenderer.ts:1149-1160`
- **med** CSP `script-src` includes `data:` — defeats CSP as an HTML-injection backstop — `index.html:10`

### Idiomatic TypeScript & type safety
- **med** `evaluateCriteria` switch has no exhaustiveness guard — `evaluate.ts:187-326`
- **low** `assembler.mapCriterion` uses non-null assertions on an all-optional `CriterionSpec` — `assembler.ts:12-59`
- **low** `requireNumber` accepts Infinity/NaN; `total_population` never finiteness-checked — `runtime-types.ts:28-31`

### DRY / duplication
- **high** Scenario invariant + terrain/river blocks duplicated across the two validators — `loader.ts:538-937, 1115-1471` *(same root as the Architecture high)*
- **med** Party set `{R,D,L,G,I}` redefined in 5+ places, one with inverted D,R order — `election.ts:17`, `mapRenderer.ts:1137`
- **med** `PARTY_COLORS` hex hardcoded again in `styles.css` (silent drift) — `styles.css:420`
- **low** Verdict text/state logic duplicated between `revealVerdict` and `syncOverallVerdict` — `main.ts:1139-1162, 1212-1237`
- **low** Divergent district-color fallback (`#2a2a3e` vs `#888`), no `MAX_DISTRICTS` guard — `mapRenderer.ts:1259,1281` / `panels.ts`
- **low** Hex polygon path built inline instead of via `hexPolygonPath` helper — `mapRenderer.ts:540-541`

### Tooling / build / deploy
- **med** Deploy index.html patches fail silently (warn, not error) — `release.main.kts:383-413`
- **low** Deploy idempotency guard only inspects the `web_deploy` tip commit — `release.main.kts:328-335`
- **low** Genrule basename case will misfile future `assets/*.json` into `scenarios/` — `web/BUILD.bazel:172-185`
- **low** Stale `pnpm-lock.yaml` committed alongside canonical `package-lock.json` — `game/pnpm-lock.yaml`
- *(meta)* No ESLint/Biome/Prettier or lint/format gate anywhere in `game/`

### State management & runtime
- **high** WIP save/restore drops unassigned (null) precincts, defeating the all-assigned gate — `main.ts:542-543`, `gameStore.ts:111-118`, `validity.ts:43-46`
- **low** Undo silently reverts the active district (snapshot carries it, equality gate ignores it) — `gameStore.ts:120-130, 68-70`
- **low** zundo retains full snapshots, no `partialize`/`limit`; header comment misdescribes it as diffs — `gameStore.ts:5, 63-132`
- **low** Undo test asserts only assignments, so it can't catch the activeDistrict-revert — `gameStore_test.ts:190-201`

### Simulation & domain correctness
- **low** Population pipeline never clamps `total_population` >= 0 (reachable in principle) — `population-stage.ts:381,399`
- **med** Tie-break direction inconsistent: live election favors R, displayed winner favors D — `election.ts:25-33` vs `adapter.ts:126`

### Accessibility & DOM/UX
- **high** Focus is never moved on screen/modal transitions (zero `.focus()` in src) — `main.ts:366,332,692,1471,1585,1599`
- **high** Full-screen overlays aren't dialogs and aren't focus-trapped (tab into live editor behind the modal) — `index.html:75,93,104,137`
- **med** Tutorial input-lock is pointer-events-only — keyboard bypasses the freeze — `overlay.ts:369-374`
- **low** `role="list"` container with non-listitem children — `index.html:68`
- **low** Keyboard label hardcodes "1–5" but districtCount varies (2–4) — `index.html:200`, `mapRenderer.ts:1339,1388`

### Error handling / robustness
- **high** WASM init promise has no `.catch()`; failure → permanently blank page (and WASM is unused) — `index.html:291-299`
- **high** Loader accepts NaN/Infinity/negative; NaN silently passes the sum invariants — `runtime-types.ts:28-31`, `loader.ts:599,617,1223,1255`
- **med** Stale WIP restored without validating assignments/activeDistrict against the loaded scenario — `main.ts:526-536`
- **med** Scenario fetch shows a blank page with no loading indicator or timeout — `main.ts:458-468`
- **low** Validation/error text interpolated into innerHTML without escaping (inline onclick) — `main.ts:444-453`
- **low** Loader tests are in-distribution only; can't catch the NaN/Infinity/negative hole — `loader_test.ts`
