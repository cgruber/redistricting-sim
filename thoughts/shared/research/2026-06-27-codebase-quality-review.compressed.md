<!--COMPRESSED v1; source:2026-06-27-codebase-quality-review.md-->
§META
date:2026-06-27 researcher:Claude(Opus4.8 multi-agent)+cgruber commit:3c3c3a68492c branch:HEAD(post#297)
repo:cgruber/redistricting-sim topic:whole-codebase quality review of game/web TS
tags:[quality,architecture,testing,security,typescript,refactoring,a11y,review] status:complete

§ABBREV
L=loader.ts M=main.ts MR=mapRenderer.ts RT=runtime-types.ts E=evaluate.ts EL=election.ts GS=gameStore.ts TR=test_runner.ts IX=index.html REL=release.main.kts

§METHOD
read-only pass game/web(~9.5k src,~6k colocated tests). 10 parallel dimension finders(arch/SOLID,tests,security,idiomatic-TS,DRY,tooling,state,sim-correctness,a11y,errors) each given: DO-NOT-FLAG conventions + verbatim standing-adversarial debias block + web/TS failure-mode checklist. per-dimension adversarial verifier opened each cited line, kept finding only if factually accurate AND real defect(not taste vs convention)→43 confirmed. top findings hand-reconfirmed; grok-4 external 2nd opinion on god-file decomposition.
BASELINE: bazel test //game/... GREEN 39/39(typecheck incl). all findings latent/maintainability; none break build. tsconfig strict(strict,noUncheckedIndexedAccess,exactOptionalPropertyTypes,noImplicitReturns). NO eslint/biome/prettier/lint-format-gate anywhere in game/.
GOOD(calibration): domain core clean+tested(sim/{election,evaluate,validity},pipeline,loader invariants); no enums; zero @ts-ignore; 3 `as unknown as`; branded IDs. problems concentrated in 3 god-files + untested UI layer + no linter.

§THEMES (7)
T1 safety-critical loader duplicated + accepts malformed numbers: loadScenario=validateScenarioComplete(parseScenario)→BOTH run every load($L:1628). validateStructural($L:1115-1471 partial,if!==undefined guards) vs validateScenarioInvariants($L:538-937 complete) reimplement same invariants; terrain/river blocks near byte-identical(807-936 vs 1366-1470). rule changed in one→silent divergence,no test. requireNumber($RT:28-31) typeof-only→NaN/Infinity/neg pass; NaN share defeats Math.abs(sum-1)>EPS invariant(NaN>EPS=false→passes); corrupt total_population→pluralityWinner($EL:26-32) silent wrong 'R'. loader tests in-distribution only. population-stage:381,399 never floors pop>=0.
T2 win/lose logic stranded in untested controller + leaky renderer: $M(1621) only behavioral file w/ no test seam, owns computeStarCount/buildValidityRows($M:840-882),overallPass/maxStars(1040-1088). verdict UI dup(revealVerdict 1139-1162 vs syncOverallVerdict 1212-1237,already differ 1 branch). reveal=3-site implicit cancel protocol over shared mutable timers(1107-1110,1245-1289,1411-1458,1513-1518). SvgMapRenderer breaks stated swappable/read-only contract: writes #precinct-info innerHTML + binds document keydown($MR:968-984,1133-1161) instead of ctor-injection it already uses(paintStroke/setActiveDistrict $MR:350-355).
T3 injection surface: scenario strings→unescaped innerHTML where textContent pattern exists: panels.ts:28-40, hover sink $MR:1149-1160(precinct/county/group via requireString type-only). CSP script-src has data:($IX:10,react-shim)→any injection loads arbitrary script. showLoadError inline onclick+innerHTML($M:444-453). NOT live XSS(scenarios same-origin team-authored, id vs hardcoded manifest) but roadmap import/user-save arms it. ONE escapeHtml/createElement helper closes all 4.
T4 a11y broken for keyboard+SR: grep '.focus(' in src=ZERO→focus never moved on transitions($M:366,692,1471,1585) WCAG2.4.3; a11y.spec.ts:55 pre-focuses so misses it. overlays no role=dialog/aria-modal/inert($IX:75,93,104,137)→tab into LIVE editor behind result modal,can paint/resubmit. tutorial lock pointer-events-only($overlay:369-374)→keyboard bypasses. role=list w/o listitem($IX:68). "1-5" label but districtCount 2-4($IX:200).
T5 single-source drift: party set{R,D,L,G,I} in 5+ places($EL:17 etc),$MR:1137 orders D,R inverted→omitting a party type-checks but drops it from math. PARTY_COLORS hex re-hardcoded styles.css:420 vs authoritative types.ts:171-173. district-color fallback #2a2a3e vs #888,no MAX_DISTRICTS→6th district renders as "unassigned". MOST VISIBLE: tie-break inconsistent — live election favors R($EL:25-33 strict>) vs displayed winner favors D(adapter.ts:126 >=), BOTH cemented by opposing tests(adapter_test:162 vs evaluate_test:210).
T6 test infra can pass green while broken: exit depends on manual summarize() last line of 21 files($TR:16-26,107-115); test() catches+no rethrow,no process.on('exit')→dropped call=green. no backstop for unwired _test.ts. integration test hardcoded 12-scenario table not glob(loader_integration_test:43-90). evaluateCriteria no exhaustiveness($E:187-326 assignment-switch,no default/never)→10th Criterion variant→silent passed=false,uncatchable by noImplicitReturns/noFallthrough. untested safe_seats/competitive_seats boundaries, getCriterionIcon; vestigial generator_lib dep(dead generator.ts).
T7 unhappy paths + build/deploy fail silently + no linter: WASM init NO .catch()($IX:291-299), whole game gated behind kernel nothing in src calls(zero wasm_bindgen refs)→.wasm fail=blank page. scenario fetch blank dead-zone,no spinner/timeout($M:458-468). WIP save drops null precincts($M:542-543,$GS:111-118)→defeats all-assigned gate; stale WIP restores into regenerated scenario unchecked($M:526-536); zundo full snapshots,header comment literally wrong($GS:5,63-132),undo reverts activeDistrict(invisible to its test). deploy patches warn-not-error($REL:383-413)→reformat ships broken cache-bust+exit0; idempotency guard scrapes tip commit only; genrule misfiles future assets/*.json; stale pnpm-lock.yaml. META: no linter→residual type gaps are compiler-uncatchable class(non-null assertions assembler:12-59, exhaustiveness, T5 literal drift); lint+format gate is the systemic backstop + kills reformat-deploy hazard.

§TOP10 (leverage order; silent→loud one-liner on critical path > high-sev refactor)
1 harness fail-loud: process.on('exit',()=>{if(_failed>0)process.exitCode=1}) in $TR. until then every test untrustworthy.
2 harden requireNumber($RT:28-31): !Number.isFinite throw + range(pop>=0,shares 0..1) + floor pop population-stage + adversarial loader tests.
3 evaluateCriteria exhaustiveness($E): default{const _x:never=c;throw} + assertNever helper.
4 WASM .catch() + decouple bundle.js, OR delete(unused; remove //game/rust dep)($IX:291-299).
5 focus mgmt + overlay modality: move focus into shown region; role=dialog aria-modal + editor roots inert; e2e that does NOT pre-focus.
6 central escapeHtml/createElement(panels:28-40,$MR:1149-1160,$M:444-453) + remove data: from script-src via same-origin stub. 1 fix 4 findings.
7 reconcile tie-break + single-source party set: winnerOf(share) helper for $EL+adapter; export ALL_PARTIES/PartyKey from types.ts.
8 move computeStarCount/buildValidityRows→simulation/verdict.ts(pure+test); one applyVerdictUI. [GROK: do this restructuring FIRST]
9 de-dup loader validation core — approach is a real decision(see §GROK).
10 deploy hard-fail(warn→err+exitProcess(1)+post-write assert) + meta-test glob _test.ts→js_test; THEN wire eslint/biome+formatter gate(none today).
(WIP-null-drop + rest of T7 = next pass.)

§GROK (grok-4 external, non-gating, verify-before-acting)
agreed B+C, sharpened A:
- A: predicate-extraction locally-correct but KEEPS partial/complete split alive→keeps drift risk. better=single normalized model(optionals defaulted/narrowed at parse)+validate ONCE; complete-path disappears,terrain blocks collapse. two-pass only buys earlier structural errors + missing-vs-bad-value distinction; not worth maint cost. TRADEOFF: predicate-extraction=lower-risk incremental; normalize-once=architecturally superior, larger(touches adapter+runtime types). recommend normalize-once if loader keeps growing, else predicate-extraction as minimum.
- B: agree move; ALSO treat verdict as pure projection of evaluate+validity, remove inline verdict from controller entirely(not just pure part).
- C: injection fix correct+minimal, no deeper smell.
- under-weighted risks: (1) $M is the REAL god object — moving 2 fns doesn't fix IIFE coupling DOM events+store subs+renderer lifecycle+zundo; seam a Canvas renderer/import will fight. (2) zundo full-snapshot coupled to raw store shape→normalization/new validity field silently changes undo memory+serialization,no seam.
- sequencing: do B FIRST(pure,~0 regression,shrinks later $M cleanup); A+C touch shared mutable paths,follow.

§COMPLETENESS-CRITIC (NOT covered)
1 IS THE POLI-SCI MATH CORRECT? all 43 audit "code does what it intends",none "intent correct". efficiency-gap formula/mean-median/seat-allocation faithfulness untested(findings only check arithmetic runs). NEEDS domain-expert review vs reference defs, separate from code review.
2 perf at classroom scale(SVG node count, full-snapshot undo on low-end hw) unprofiled.
3 dead/unwired code as a dimension(dead WASM + dead generator.ts caught incidentally→import-graph sweep would find more).
4 content correctness(scenario prose accuracy/reading-level/framing) unchecked.

§TRIAGE
FIX-NOW(1-line/low-risk first PR): harness exit hook(1); requireNumber finiteness+loader adversarial tests(2); evaluateCriteria exhaustiveness+assertNever(3); WASM .catch()/removal(4).
FILE-TICKETS: focus/overlay a11y(5,own e2e); escape helper+CSP data:(6); tie-break+party single-source(7); verdict→simulation/verdict.ts(8,grok:first among refactors); loader de-dup(9,decide predicate vs normalize-once); deploy hard-fail+lint/format gate(10); WIP-null-drop correctness bug; larger $M god-controller decomposition(grok risk#1).
LEAVE/LOW: dead generator_lib dep, genrule json-misfile guard, stale pnpm-lock, role=list listitem, "1-5" label — cosmetic/latent, sweep when touching.
SEPARATE EFFORT(not code review): domain-expert audit of gerrymandering metrics vs reference defs.

§APPENDIX (43 findings; sev rollup 6 distinct highs[7 rows;loader-dup listed under Arch+DRY]/~18 med/~18 low; each verifier-confirmed; 2 carrying highs[loader dual-validation, WIP null-drop] hand-reconfirmed vs source)
ARCH: [high]2 parallel invariant impls drift $L:538-937 vs 1115-1466 | [med]win/star logic in untested controller $M:840-882,1040-1088 | [med]SvgMapRenderer breaks swappable contract $MR:968-984,1133-1161 | [med]reveal shared mutable timers 3 paths $M:1107-1110,1245-1289,1411-1458,1513-1518
TESTS: [med]safe_seats/competitive_seats no unit test $E:229-246 | [med]integration test hardcoded table loader_integration_test:43-90 | [med]harness summarize() exit hole $TR:16-26,107-115 | [med]no unwired-_test.ts backstop */BUILD.bazel | [low]getCriterionIcon untested+no exhaustiveness criterion-icons:102-111 | [low]vestigial generator_lib dep, dead generator.ts model/BUILD.bazel:178
SECURITY: [med]party/winner strings→unescaped innerHTML panels:28-40 | [med]precinct/county/group→hover innerHTML $MR:1149-1160 | [med]CSP script-src has data: $IX:10
TS: [med]evaluateCriteria no exhaustiveness $E:187-326 | [low]assembler non-null asserts on optional CriterionSpec assembler:12-59 | [low]requireNumber accepts Inf/NaN $RT:28-31
DRY: [high]invariant+terrain/river dup across validators $L:538-937,1115-1471(same root as ARCH high) | [med]party set 5+ places,D,R inverted $EL:17,$MR:1137 | [med]PARTY_COLORS re-hardcoded styles.css:420 | [low]verdict dup revealVerdict vs syncOverallVerdict $M:1139-1162,1212-1237 | [low]district-color fallback #2a2a3e vs #888,no MAX_DISTRICTS $MR:1259,1281 | [low]hex path inline vs hexPolygonPath $MR:540-541
TOOLING: [med]deploy patches warn-not-error $REL:383-413 | [low]idempotency guard tip-commit-only $REL:328-335 | [low]genrule misfiles future assets/*.json web/BUILD.bazel:172-185 | [low]stale pnpm-lock.yaml | (meta)no lint/format gate
STATE: [high]WIP drops null precincts→defeats all-assigned gate $M:542-543,$GS:111-118,validity:43-46 | [low]undo reverts activeDistrict $GS:120-130,68-70 | [low]zundo full snapshots,wrong comment $GS:5,63-132 | [low]undo test asserts only assignments gameStore_test:190-201
SIM: [low]population never clamped >=0 population-stage:381,399 | [med]tie-break R(election) vs D(adapter) $EL:25-33 vs adapter:126
A11Y: [high]focus never moved(zero .focus() in src) $M:366,332,692,1471,1585,1599 | [high]overlays not dialogs/not focus-trapped $IX:75,93,104,137 | [med]tutorial lock pointer-events-only $overlay:369-374 | [low]role=list w/o listitem $IX:68 | [low]"1-5" label vs districtCount 2-4 $IX:200,$MR:1339,1388
ERRORS: [high]WASM no .catch()→blank page(+unused) $IX:291-299 | [high]loader NaN/Inf/neg passes sum invariants $RT:28-31,$L:599,617,1223,1255 | [med]stale WIP restored unvalidated $M:526-536 | [med]scenario fetch blank,no spinner/timeout $M:458-468 | [low]error text→innerHTML+inline onclick $M:444-453 | [low]loader tests in-distribution only loader_test.ts
