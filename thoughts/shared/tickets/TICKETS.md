# Tickets

Canonical summary of all open and resolved work items. Individual ticket files in this directory contain full detail. This file is the index — do not duplicate ticket content here, and do not maintain ticket inventories elsewhere (AGENTS.md, research docs, etc. should reference this file instead).

## How This Works with GitHub Issues

Ticket files are the source of truth. GitHub Issues are created when starting work on a ticket (not before, not at PR-open time):

```bash
kotlin /opt/geekinasuit/agents/tools/gh-ticket.main.kts -- create <ticket-path>
```

Reference issues from PRs with `see #N` — never `fixes #N` or `closes #N`. Issues are always closed manually once the full Definition of Done is met.

A GitHub Action (see `CI-001-github-action-ticket-close-sync.md`) will act as a safety net for cases where the PR didn't include the ticket update. That action is permitted to commit directly to `main` for bookkeeping-only changes — a narrow, explicit exception that applies to the GitHub Actions bot only. Agents must go through a branch and PR even for ticket bookkeeping.

---

## What Makes a Good Ticket

A ticket is done when both the **feature** and its **tests** are merged. Test coverage is not optional — it is part of the Definition of Done on every ticket.

### Required sections

| Section | What goes here |
|---|---|
| **Summary** | One paragraph: what, why, scope boundary |
| **Current State** | What exists today; what gap this ticket closes |
| **Goals / Acceptance Criteria** | Checkboxes for every behavioral requirement |
| **Test Coverage** | Explicit test AC items (see below) |
| **References** | File paths, related tickets, prior research |

### Test Coverage AC — what to include

Every ticket that touches logic or UI must include a **Test Coverage** section with acceptance criteria items. These are DoD requirements, not suggestions.

**Pure functions / domain logic** (no DOM, no D3):
- Unit test each distinct behavior: happy path, edge cases, error cases
- Pattern: hand-rolled TAP runner in `*_test.ts`, run via `js_test` in BUILD.bazel
- Examples: population deviation calculation, BFS contiguity, loader validation

**UI interactions / behavioral flows**:
- One Playwright e2e test per named interaction (button click, hover, paint, etc.)
- Assert visible DOM outcomes: text changes, element visibility, attribute values
- Pattern: `e2e/sprint<N>.spec.ts` or `e2e/<feature>.spec.ts`
- Examples: button label changes, sidebar content updates, reset flow

**What to skip** (explicitly note in ticket if skipping):
- Tests that require browser-internal APIs unavailable in Playwright headless (e.g. WebGL readback)
- Tests for rendering pixel-accuracy (use visual regression tools separately)
- d3 internals or scroll/touch gesture simulation (note as out-of-scope, not forgotten)

### Workflow note

Follow the TDD intent from `thoughts/shared/research/2026-04-21-multi-agent-tdd-workflow.md`:
tests should be written alongside or before implementation, not as a backfill. When creating a ticket, write the test AC before starting the implementation. When opening a PR, tests must be included — a PR with implementation but no tests is incomplete.

---

## Ticket ID Categories

| Prefix | Meaning |
|---|---|
| `KT-NNN` | Kotlin implementation work (dormant — Kotlin removed) |
| `DB-NNN` | Database schema, migrations, and cross-language DB tooling |
| `BUILD-NNN` | Build system and tooling (Bazel, bzlmod, rules) |
| `CI-NNN` | CI, automation, and testing infrastructure |
| `OPT-NNN` | Performance optimization |
| `AGENT-NNN` | Agentic workflow and agent tooling changes |
| `SPIKE-NNN` | Time-boxed proof-of-concept investigations |
| `LEGAL-NNN` | Legal, content liability, and compliance research |
| `DIST-NNN` | Distribution, deployment, and platform research |
| `DESIGN-NNN` | Game design, UX, and ergonomics research |
| `GAME-NNN` | Game implementation work (rendering, simulation, content, game loop) |

---

## Open

| File | Area | Summary |
|---|---|---|
| `BUILD-003-ts-rules-spawn-strategy-research.md` | build, typescript | Research optimal spawn_strategy config for aspect_rules_ts on macOS (darwin-sandbox + multi-target packages) |
| `BUILD-004-playwright-bzl-macro.md` | build, testing | Playwright sh_test macro: proper Bazel rule for virtual store path resolution, replacing ad-hoc readlink discovery |
| `BUILD-008-switch-ci-to-pnpm.md` | build, ci | Switch CI from npm ci to pnpm --frozen-lockfile; remove package-lock.json |
| `BUILD-009-content-hash-bundle.md` | build, deployment | Content-hashed bundle filenames (`bundle-[hash].js`) for proper CDN cache invalidation on deploy; replaces query-string kludge in release.main.kts |
| `CI-001-github-action-ticket-close-sync.md` | automation, github, tickets | GitHub Action safety net: sync ticket state when issue is closed without a PR ticket update |
| `DIST-001-steam-deployment-research.md` | distribution, platform | Research Steam free/educational program, achievements API, web-vs-Steam tradeoffs |
| `AGENT-003-infra-pr-review-bot-comment-handling.md` | agentic workflow, infra | Propose bot comment handling (Copilot, CodeQL) to infra pr-review-cycle workflow |
| `DESIGN-004-legend-layout.md` | design, UX | Move legend to horizontal strip above map; free sidebar space for data panels |
| `DESIGN-005-population-dot-density-overlay.md` | design, rendering | Population dot density overlay: dot count per precinct proportional to population; hue-aware dot color; colorblind-safe palette |
| `DESIGN-006-zoom-adaptive-dot-density.md` | design, rendering | Zoom-adaptive dot density scaling + person glyph threshold (refinement on DESIGN-005, possibly post-v1) |
| `DESIGN-007-dimensional-dot-map-demographic-overlay.md` | design, rendering | Dimensional dot map: demographic dimension switching (Option B adaptive encoding) + sorted placement toggle |
| `GAME-056-playtest-feedback.md` | game, content, UX | Capture and act on playtest feedback — scenario balance and UX |
| `GAME-057-scenario-randomization.md` | game, content, replayability | Per-session ±5% population/lean offsets seeded per session; e2e tests remain deterministic |
| `GAME-058-manual-playability-test-thresholds.md` | game, content, QA | Manual playthrough of scenarios 007 and 008 to verify tightened thresholds (GAME-031) feel right |
| `GAME-030-main-menu-and-campaigns.md` | game, UX, architecture | Main menu, campaign model, campaign select, layered navigation; replaces scenario-select-as-home |
| `DESIGN-008-geographic-features.md` | design, rendering | Geographic features (lakes=aqua+wave, mountains=grey+hatch) as decorative non-precinct tiles; blocks contiguity |
| `GAME-042-break-up-main.md` | game, code-quality | Break up main.ts god module into testable units (scenarioSelect, resultScreen, introFlow) |
| `GAME-043-unify-type-systems.md` | game, code-quality | Unify spike and scenario type systems; retire adapter.ts and types.ts spike layer |
| `GAME-046-panels-unit-tests.md` | game, testing | Unit tests for render/panels.ts (deferred): jsdom or extract-pure-helpers approach |
| `GAME-053-electoral-outcome-visual-diff.md` | game, UX | Electoral outcome comparison (player map vs baseline) on result screen; placeholder |
| `GAME-065-character-sprite-art-refinement.md` | game, art, content | Quality fixes for known issues (judge eye, party mouth, legislator thumb); broker PNG production (stretch); not a blocker for GAME-062 |
| `GAME-070-audio-settings.md` | game, UX, audio | Audio settings panel (main menu Settings item): master volume slider, mute toggle, localStorage persistence; coordinates with GAME-062 result-screen toggle |
| `GAME-071-audio-character-assignment.md` | game, audio, content | Per-scenario character/audio inventory; audio clip selection per type; timing calibration; stub resolution |
| `GAME-072-optional-criterion-neutral-audio.md` | game, audio | Neutral/meh audio clip for optional criteria that fail — party-disapprove is too strong for a missed bonus |
| `GAME-074-criteria-only-validity-model.md` | game, architecture | Collapse dual validity/criteria system; population_balance gains tolerance field; contiguity becomes opt-in criterion; remove isMapSubmittable/buildValidityRows/mapIsValid |
| `DESIGN-012-tutorial-overlay-ux.md` | design, UX, tutorial | Tutorial overlay UX spec: step sequencing model, highlight mechanics, input-pause semantics, skip/persist, tutorial-001 step script |
| `DESIGN-013-vra-scenario-design.md` | design, content | VRA scenario design: "The 55% Problem" (Bethune-Hill dual-failure zone) and proxy-only redistricting post-Callais |
| `DESIGN-014-nonpartisan-content-framing.md` | design, content | Non-partisan content guidelines: source standards, narrative language, naming conventions, about-page audit; prerequisite for VRA scenario authoring |
| `DESIGN-015-information-density-redesign.md` | design, UX | Layout redesign for 5+ districts: evaluate map overlays, HUD strip, tabbed sidebar; specify where GAME-080 demographic stat lives; DESIGN-004 fate |
| `GAME-076-tutorial-001-walkthrough.md` | game, UX, tutorial | Tutorial-001 guided walkthrough: overlay engine + 9-step script (district select → paint → undo/redo → UI tour → submit) |
| `GAME-077-tutorial-002-guided-mode.md` | game, UX, tutorial | Tutorial-002 guided mode: advanced feature walkthrough (criteria panel, demographic overlay, goal orientation) |
| `GAME-078-vra-scenarios-implementation.md` | game, content | Implement VRA scenarios: Scenario A + Scenario B; terrain features; proxy-data mechanic; hides race demographics; result-screen reveal |
| `GAME-079-scenario-002-playability-tuning.md` | game, content | Tighten scenario-002 — trivially-easy first educational campaign scenario requires genuine engagement |
| `GAME-080-district-demographic-rollup.md` | game, UX | Live per-district demographic stat derived from criteria (majority_minority → show % of target group); compact line under district button; updates on paint |
| `GAME-081-information-density-implementation.md` | game, UX | Implement DESIGN-015 layout: district state visible at 5+ districts without scrolling; integrates GAME-080 stat placement |
| `GAME-082-terrain-visual-treatment-refinement.md` | game, rendering, UX | Visual-tuning pass over GAME-075 terrain layer: thicker rivers, more prominent coast/lakeside edges, foothill rendering pickup, internal-lake validation |
| `GAME-083-unassigned-precinct-visual-feedback.md` | game, rendering, UX | Unassigned precincts need a distinct neutral fill (white→dark-grey range); currently indistinguishable from assigned ones |
| `GAME-084-map-generation-pipeline.md` | game, tooling | Spec-driven staged pipeline (terrain→population→demographics→assembler); single scenario JSON format throughout; requires loader validation split |
| `GAME-092-scenario-map-editor.md` | game, tooling, UX | Visual editor to hand-tweak generated scenarios — click hex edges for rivers, place terrain tiles, export to JSON. Motivated by hand-injecting scenario-002's river via jq. Design-first |
| `GAME-094-result-screen-overflow-epilogue-panel.md` | game, UX | Result screen overflows the viewport (no scroll) once the epilogue is added — even on desktop. Preferred fix: move epilogue to a second "Continue →" panel after the reveal. Keep usable on smaller screens |
| `GAME-090-settlement-density-realism.md` | game, tooling | Settlement density realism follow-ons: leapfrog/exurban developments, sharper plateau edge, easier non-circular cores. Plateau profile + big urban/rural ratio already landed in GAME-088 |
---

## Resolved

| Summary | Resolution |
|---|---|
| GAME-091: scenario-002 teaching narrative | Rewrote scenario-002 intro to teach votes≠seats + packing (old text was stale for the new field); added `narrative.epilogue` (schema→assembler→loader→result screen) — a teaching debrief revealed on a win explaining packing/cracking neutrally. e2e asserts the debrief shows |
| GAME-089: population-aware county stage | Replaced geometric `county_labels` with a population-aware flood-fill county stage (`county-stage.ts`); named model presets seat_and_hinterland / city_county / split_metro; counties wrap pop centers, borders bias to troughs/rivers; county display names plumbed to the precinct-info panel; darker/shorter-dash border overlay; county_id stays cosmetic. scenario-002 migrated to `counties:` block (city + west + east). Unit tests + e2e green |
| GAME-088: coherent population field | Added opt-in field-shaping to the population stage: gradient, neighbour-smoothing, pow-contrast, normalize-to-target, plus a `plateau` settlement profile (flat core + sharp edge vs gaussian). scenario-002 reworked to a 3-cluster, ~12x urban/rural field with a non-circular city core; scenario-002 winnability e2e re-solved (pack dense east-core Ryu → Ken 3-1). Also fixed precinct-info lean showing real party names. Unit + e2e tests pass |
| BUILD-010: release.main.kts missing clikt import | Added `import com.github.ajalt.clikt.parameters.options.default`; the `Serve` subcommand's `.default()` call broke compilation of the whole script (prepare/deploy/serve all failed). Verified via dev deploy of GAME-088 |
| GAME-087: terrain-aware population stage | `populateScenario` rewritten with terrain suitability (lakeside 1.4×/riverside 1.3×/coastal 0.9×/mountain 0.5×), Gaussian settlement bumps, and all anchor types (center, cardinal, feature, exact coords); scenario-002 updated with Clearwater City + East Mills settlements; peaks tuned to keep e2e district balance within ±5% of mean; all 10 ACs met; merged PR #265 |
| GAME-041: split loader.ts | `runtime-types.ts` extracted (requireString etc.); `validateScenarioInvariants()` named function in loader.ts; cartesianProduct at module level; all 8 model tests pass; no behavior change |
| GAME-086: lake rendering | `lakeside: boolean` derived in adapter from lake-tile adjacency; lake intrusion fill (smooth profile, `#4dd0e1`, depth 5px) rendered in `renderTerrainEdges` with corner caps; river stroke unified with lake colour; tutorial-003 lake tile moved to centre (-1,1); 6 lakeside precincts; e2e + unit tests; merged PR #253 |
| GAME-085: composable terrain annotations | `Precinct.terrain` and `has_internal_lake` removed from types/loader/adapter/scenario; coast/foothill/lakeside/riverside derived as independent booleans from tile adjacency; `renderTerrainEdges` handles all four simultaneously; scenario JSON cleaned; unit + e2e tests; merged PR #253 |
| GAME-075: terrain implementation | DESIGN-008 fully implemented across 4 PRs: schema + loader (#241), renderer with tile/river/edge-stroke/internal-lake layers (#242), contiguity BFS reading passableNeighbors (#243), scenario-010 "Two Banks, One River" demo + e2e tests (#244); population-gradient generator deferred to GAME-078 per the ticket's authorized off-ramp |
| GAME-073: deferred verdict banner + star count reveal | Verdict hidden until all criteria revealed; stars animate in; tada/womp-womp audio; layout preservation (visibility:hidden + min-height); merged PRs #236 #237 |
| GAME-062: character reaction system | CHAR_POSES measured for all 1408×768 sheets; commissioner/judge/legislator/party wired in buildCharSlotChildren(); demographic selection reads scenario.character_demographics; placeholder SVG retained as unknown-type fallback; e2e tests for commissioner sprite + aria-labels; broker/scenario-006 deferred to GAME-065 |
| GAME-061: audio clips | 12 real clips active (governor/commissioner/legislator gender-keyed, judge/party gender-neutral), all −16 LUFS; stubs for neutral variants + party-disapprove deferred to GAME-071 fine-tuning |
| GAME-060: character sprite assets | commissioner/judge/legislator/party PNG sheets produced with demographic variants (1408×768, 3-state); old SVG placeholders deleted |
| DESIGN-011: per-criterion character roster | commissioner/judge/legislator/party PNG sheets produced with demographic variants; criterion→character mapping in scenario format; old SVG placeholders deleted |
| GAME-069: per-criterion character reactions | Per-row .rc-char slots with governor sprite + SVG placeholders; schema + scenario data; GOV_SHEET fix; merged PR #215 |
| GAME-068: result reveal pacing | True sequential reveal (1 row at a time), dedicated Skip button; merged PR #214 |
| GAME-067: asset URL versioning + env badge | Asset ?v= versioning via deployment-metadata.json + dev/staging badge; merged PR #212 |
| GAME-064: audio playback infrastructure | AudioPlayer module: preload, play, mute toggle, autoplay policy, localStorage persistence; merged PR #194 |
| GAME-063: asset pipeline | Directory structure + Bazel integration for SVG + audio delivery; deployable inclusion; merged PR #192 |
| GAME-059: submit-on-invalid maps | Removed validity gate from Submit button; invalid maps now reach result screen; Fix-It path replaces Next Scenario; merged PR #196 |
| GAME-066: result screen dramatic reveal | Per-criterion SVG icons, sequential reveal, binary instigator cross-fade, prefers-reduced-motion fast path; merged PR #213 |
| DESIGN-010: result screen dramatic reveal | Per-criterion icons (flat SVG set, 24/36px, criterion-icons.ts), suspense timing (400ms stagger, 1.2s CHECKING hold, click-to-skip), binary instigator pose (approve=1-3★/disapprove=0★, waiting.svg neutral pre-reveal, foot-anchored CSS); research doc finalized 2026-05-07 |
| DESIGN-009: character reaction visual style | Inline SVG + CSS animation decided; 5 instigator types × 4 star states; consistency spec for AI generation; audio tone per type; research doc finalized |
| GAME-052: animated criteria reveal | CSS criterionReveal keyframe (opacity+translateY), 120ms stagger, click-to-skip, 🎉/💔 reaction; 4 e2e tests; merged PR #189 |
| GAME-031: gameplay critique followup | Tightened pop tolerance (007/008: 10%→5%); compactness 007: 0.40→0.50; randomization→GAME-057; others deferred or rejected |
| DESIGN-001: achievement/star system research | Variable per-criterion stars: 1 base + 1 per optional criterion; no format change needed; fixed-3 rejected; research doc written 2026-05-02 |
| GAME-055: scenario-driven party names | `renderResults()` accepts partyLabels param; scenario party names (Ken/Ryu, Cat/Dog) shown in results panel; fallback to "Party 1"/"Party 2"; 2 e2e tests; merged PR #180 |
| GAME-008: full accessibility pass | Okabe-Ito CVD-safe district palette, PuOr lean view, aligned party colors, keyboard precinct nav (arrow+number keys), focus rings, prefers-reduced-motion, 6 e2e a11y tests; merged PR #177, deployed v0.0.13 |
| LEGAL-001: content risk assessment | Low risk for v1; all pre-authored content, fictional entities, educational framing; disclaimers added to about page + Valle Verde; authoring tool deferred to post-v1 review |
| GAME-006: scenario compression | HTTP gzip sufficient for v1; no code changes needed; .scenarioz deferred to community scenarios |
| GAME-038: extract panel renderers | render/panels.ts created with renderResults, renderLegend, renderDistrictButtons, renderValidityPanel; mapRenderer.ts reduced by ~115 lines; main.ts import updated |
| GAME-039: extract hex geometry | hex-geometry.ts created with hexToPixel, hexCorners, mapBounds, HEX_DIRECTIONS; generator.ts re-exports from it; adapter.ts + mapRenderer.ts updated; hex_geometry_lib added to model BUILD |
| GAME-044: hex-geometry unit tests | 11 unit tests for hexToPixel, hexCorners, HEX_DIRECTIONS, mapBounds; hex_geometry_test Bazel target in model/BUILD.bazel; merged PR #153 |
| GAME-054: remove legacy scenario select | ?campaign=bogus+?view=scenarios+unknown ?s=+locked (no campaign) all redirect to main menu; ?s= in campaign→show campaign select; backUrl updated; 89 e2e tests pass; merged PR #172 |
| GAME-051: in-game navigation cleanup | ← Scenarios replaced with submenu trigger; Return to Scenarios (campaign only) + Return to Main Menu; no-campaign shows flat ← Main Menu button; Escape+outside-click close; 6 e2e tests; 102 total pass |
| GAME-049: campaign select screen | ?view=campaigns→campaign cards with progress indicators; click→?campaign=<id>; Back→main menu; tabindex+keydown a11y; 6 e2e tests; merged PR #169 |
| GAME-050: main menu / title screen | Continue/New Campaign/About/Load+Settings(disabled); routing /→main menu; 9 e2e tests; merged PR #165 |
| GAME-048: campaign-driven scenario select | ?campaign= URL param filtering + Back button + input sanitization + cache-bust warn; 5 e2e tests; merged PR #162 |
| GAME-047: campaign data model | Campaign interface + CAMPAIGN_REGISTRY + getCampaign() + save/loadLastPlayedScenario(); Tutorial (2 scenarios) + Educational (8 scenarios); 13 unit tests; merged PR #159 |
| GAME-045: gameStore unit tests | 13 unit tests for initial state, setActiveDistrict, paintPrecinct, paintStroke, resetToInitial, restoreAssignments, undo via zundo; store/BUILD.bazel package created; react added as devDep; merged PR #153 |
| BUILD-007: shared TAP test runner | test_runner.ts extracted to game/web/src/testing/; 9 exports (test, assertEqual, assertClose, assertNull, assertNotNull, assertTrue, assertFalse, assertDeepEqual, assertThrows, summarize); boilerplate eliminated from 4 existing test files |
| GAME-033: opLabel dedup | Single OP_LABEL module-level const in evaluate.ts replaces 4 inline copies; evaluate_test passes with no behavior change |
| GAME-034: error panel dedup | showLoadError(bodyHtml, errorMsg) helper in main.ts replaces 2 identical insertAdjacentHTML blocks; both error paths preserved |
| GAME-040: mapRenderer magic numbers | 22 named static readonly constants extracted (opacities, zoom step, lightness coefficients, fallback dims, dash patterns); no behavior change; typecheck passes |
| GAME-037: adapter unit tests | 12 tests for scenarioToSpike: precinct count, party weights, multi-group pop-weighting, neighbor wiring, district assignments, null assignments, districtCount |
| GAME-036: WIP persistence unit tests | 11 tests in separate progress_wip_test.ts with in-memory localStorage shim; round-trip, null cases, clear; all pass |
| GAME-035: election unit tests | 10 unit tests for runElection + simulateDistrict; exported simulateDistrict; js_test target added; all pass |
| GAME-032: loader error handling | User-visible error screen with scenario ID, error message, and back button; replaces blank page on validation/fetch failures |
| BUILD-006: extract inline styles | Inline `<style>` block extracted to styles.css; `'unsafe-inline'` remains in style-src for HTML element inline styles; serve + e2e updated |
| BUILD-005: CSP meta tag | CSP added; script-src/style-src include 'unsafe-inline' temporarily (inline scripts + styles); title updated to Past the Post |
| GAME-029: about page | All AC met; educational framing, non-partisan stance, resource links; merged PR #108 |
| GAME-028: hex-of-hexes backport | All AC met; scenarios 002-006 + tutorial-002 converted to hex-of-hexes; generators + JSON + readable e2e tests; merged PR #114 |
| GAME-027: hex-of-hexes map shape | All AC met; scenarios 007-009 hex-of-hexes R=6 (127 precincts); generators + JSON + 9 e2e tests; dynamic party adapter fix; merged PR #104 |
| GAME-020: wrap-up screen | All AC met; congratulations screen after completing final scenario; merged PR #107 |
| GAME-007: player progress persistence | All AC met; WIP save/resume + completion tracking; localStorage; merged (prior session) |
| DESIGN-003: districts view color encoding | Superseded — flat fills decided; population density → DESIGN-005 + DESIGN-006 |
| GAME-026: Valle Verde (VRA / majority-minority) | All AC met; 120-precinct Valle Verde scenario; group_schema + ethnicity dimension; 3 e2e tests; merged PR #102 |
| GAME-025: cracking the opposition | All AC met; 120-precinct Lakeview scenario; merged PR #97 |
| GAME-024: packing problem | All AC met; 120-precinct Riverport scenario; merged PR #97 |
| GAME-023: give the governor a win | All AC met; 96-precinct Clearwater scenario; merged PR #97 |
| GAME-022: missing evaluators | All AC met; efficiency_gap (wasted-vote), mean_median, majority_minority implemented; 22/22 unit tests; 39/39 e2e pass; merged PR #92 |
| GAME-021: multi-scenario manifest | All AC met; static manifest + URL routing (?s=id); select screen shows all entries; on-demand JSON fetch; 39/39 e2e tests pass; merged PR #90 |
| GAME-019: tutorial-002 winnability + e2e solve test | All AC met; county-aligned initial assignments (north→d1, central→d2, south→d3); painting p071–p075 (indices 70–74) solves the map; 39th e2e test verifies end-to-end pass; merged PR #83 |
| GAME-014: Scale tutorial scenario | All AC met; 196-precinct tutorial-002 scenario (3 counties, 4 districts); merged PR #79 |
| GAME-018: Progression | All AC met; scenario select screen + localStorage completion + AbortController intro; 18 unit tests + 5 e2e tests; merged PR #77 |
| GAME-017: Evaluation phase | All AC met; Submit button + evaluateCriteria + pass/fail screen; 15 unit tests + 5 e2e tests; merged PR #74 |
| GAME-016: Scenario intro slides | All AC met; full-screen slide intro from scenario.narrative; Next/Prev/Start Drawing/Skip/Escape; 6 e2e tests; merged PR #71 |
| GAME-015: Success criteria in scenario format | Already implemented: types, loader, validation, 3 criteria in tutorial-001.json — resolved on discovery |
| GAME-013: Reset-to-initial district assignments | All AC met; reset button + confirm flow + undo/redo clear; e2e tests; merged PR #63 |
| GAME-012: County border overlay toggle | All AC met; county-borders SVG layer inside zoom group; toggle button; e2e tests; merged PR #61 |
| GAME-011: Precinct info panel — hover tooltip in sidebar | All AC met; hover shows precinct detail, mouseout restores placeholder; e2e tests; merged PR #59 |
| GAME-010: Map validity panel | All AC met; population balance ±%, unassigned count, BFS contiguity; unit + e2e tests; merged PR #65 |
| GAME-009: Viewport pan and zoom | All AC met; d3.zoom() on zoom-layer group; keyboard shortcut 0 to reset; e2e tests; merged PR #55 |
| DESIGN-002: View toggle button label convention | All AC met; label shows destination mode; cycles districts↔lean; e2e tests; merged PR #57 |
| GAME-003: Author tutorial scenario JSON | All AC met; 30-precinct Kalanoa/Westford scenario; proposal + full JSON; merged PR #37 |
| CI-002: Playwright behavioral test harness | All AC met; Phase 1 smoke test (PR #38) + Phase 2 five behavioral tests (PR #50); Sprint 1 close condition satisfied |
| GAME-005: Sprint 1 integration — render scenario from JSON | All AC met; adapter + async store init + serve.sh wiring; Sprint 1 demo complete; merged PR #38 |
| GAME-001: Define scenario TypeScript types from spec | All AC met; branded types + full Scenario interface; merged PR #33 |
| GAME-002: Scenario JSON loader and validator | All AC met; loadScenario + all 13 invariants + 33 unit tests; merged PR #34 |
| GAME-004: Extract MapRenderer interface | All AC met; MapRenderer interface + SvgMapRenderer rename; merged PR #33 |
| AGENT-002: Add kotlin tools to pr-review-cycle critique/response prompts | Infra workflow already updated; local override deleted — infra workflow is canonical |
| BUILD-002: Integrate spikes into game/ Bazel workspace | Unified game/ workspace: TypeScript+D3+Zustand+Rust/WASM; all AC met; bazel build/test/run verified; merged PR #16 |
| SPIKE-001: Game tech stack PoC | TypeScript+Vite+D3.js+Zustand hex-grid prototype complete; all AC met; SPIKE-REPORT.md written; go recommendation — merged PR #11 |
| SPIKE-002: Harmonized Bazel build PoC | Bazel 9.1+bzlmod+rules_rust+rules_ts TypeScript+Rust/WASM build complete; all AC met; SPIKE-REPORT.md written; go recommendation — merged PR #13 |
| AGENT-001: $abr convention in compressed docs | Applied $-prefix to all §ABBREV key references in game-vision.compressed.md and agent-team-design.compressed.md; merged PR #2 |
| KT-001, KT-003, KT-004: Kotlin gRPC service work | Superseded — Kotlin service removed from repo; game will be a TypeScript browser app |
| BUILD-001: grpc-kotlin bzlmod migration | Superseded — Kotlin and Bazel removed; build system being re-evaluated via SPIKE-002 |
| CI-003: gRPC readiness probe for integration tests | Superseded — Kotlin service and gRPC removed |
| KT-007: DB-backed bracket config | Implemented then removed with Kotlin service |
| KT-002: Dagger 2 DI via dagger-grpc | Implemented then removed with Kotlin service |
| KT-005: JOOQ codegen | Implemented then removed with Kotlin service |
| KT-006: Database adapter layer | Implemented then removed with Kotlin service |
| DB-001: Schema migrations and tooling | Implemented then removed with Kotlin service |
| Machine-specific cache config in repo `.bazelrc` | Resolved directly; then `.bazelrc` removed with Bazel |
| Buildkite CI pipeline | Implemented; then stripped to placeholder pending stack decision |
