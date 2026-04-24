<!--COMPRESSED v1; source:game-vision.md-->
§META
type:vision status:draft created:2026-04-23 authors:cgruber+claude last_updated:2026-04-23
LIVING DOC — updated each sprint after demo; direction changes reviewed with user before acting

§ABBREV
pc=precinct seg=segment dist=district
FPTP=first-past-the-post VRA=Voting Rights Act
v1=version 1 scope

§GOAL
Primary: players understand viscerally that same population+votes → wildly different outcomes
  depending on who drew the lines and why; teach through doing — player IS the gerrymanderer
Secondary: "neutral rules" don't eliminate politics, they constrain it differently;
  different rule-sets → different outcomes; no apolitical map
Stance: education not advocacy; multiple perspectives presented; player leaves with better
  questions not predetermined answers
Stretch(later): Arrow's impossibility — every electoral system encodes tradeoffs; no system
  satisfies all fairness criteria simultaneously; invitation to think harder, not cynicism

§NEUTRALITY
Operational design decisions (not just a disclaimer):
symmetric partisan: both parties get equal treatment; each partisan scenario completable
  for either; fictional party names(Red/Blue Party); no mapping to real parties
neutral rules NOT The Answer: scenarios show what neutral rules achieve+don't;
  bipartisan-agreed standards still produce partisan outcomes; no rule-set declared correct
outcome-first framing: "what happens when you do X?" not "X is wrong"
About page: states educational intent; names designer+non-partisan intent;
  links to diverse resources(academic,journalistic,multiple political perspectives)
community scenarios as safety valve: pluralism distributes authorial power;
  users submit rules-as-advocacy scenarios; game hosts conversation not conclusion

§AUDIENCE
students(secondary+): civics/electoral/political-geography learning
engaged adults: heard about gerrymandering; want concrete understanding
international: curious about US system; interested in comparisons
accessible(no prior knowledge required) + rewarding(depth for experts)

§MENU
New Game | Continue(if progress) | Custom Level | Settings | About
Tutorial: NOT separate item — baked into level 1 as guided walkthrough
Custom Level: full scenario creator(paint populations, success criteria, rules design,
  community sharing) — see §CUSTOM_LEVEL

§LOOP
MainMenu → ScenarioIntro(slides) → Level(map editing) → Test(animated evaluation)
    → pass: SuccessScreen → NextLevel(unlocked)
    → fail: Feedback(which criteria failed) → retry

§SCENARIO_INTRO
narrative context + specific objective + success criteria(required+optional) +
  scenario-specific mechanic notes
level 1: also introduces game mechanics; later levels assume familiarity, shorter intros

§TEST
animated sequence evaluating each success criterion:
  Governor(thumbs up/concerned/veto) | Legislature(cheer/grumble/close vote) |
  Lobby groups(vary by scenario) | Legal check(equal pop, contiguity, $VRA) |
  Optional flavor: supreme court challenge, media reaction, incumbent reactions
fail → shows exactly which criteria missed → return to editing with feedback
Animation style: simple, self-contained icon reactions; cutesy; animated GIFs or
  equivalent(short CSS/SVG loops); NOT complex per-scenario authored sequences
  GES to confirm evaluation model tractability

§SUCCESS_SCREEN
narrative summary of outcome | achievement notifications | NextLevel button |
  optionally: "retry for achievements" if optional criteria missed

§ACHIEVEMENTS (examples, not exhaustive)
Surgical Precision(fewest precinct moves) | Packed to the Gills(extreme packing) |
Efficiency Gap(notable score) | Judge-Proof(all legal+optional criteria) |
Bipartisan Groans(both parties unhappy — neutral rules scenarios) |
Cats and Dogs(complete cats-vs-dogs scenario)
Replay motivation: achievements + optional criteria + completionism

§MAP_MECHANICS
Playfield: fictional sub-state region(county/metro/similar) — ONE region per scenario
  scope: NOT whole state; not multi-state; "zoom out" deferred(may be relevant for electoral-system
  comparisons later; explicitly not $v1 or near-term)
Precincts($pc): atomic geographic unit; not subdivisible; target ~hundreds; visually small
  ("fat pixels whose edges you push around"); exact count → calibrate against real regions(see §OPEN)
$pc metadata: population(total+density) | demographic breakdown(race,partisan,gender,religion) |
  last election result(votes by party, turnout) | scenario-specific data
$dist = grouping of $pcs; boundary = edges between adjacent $pcs in different $dists
$seg = contiguous blob of $pcs within a $dist; $dist may have multiple $segs(non-contiguous)
  non-contiguous: DISABLED by default; enabled only when scenario permits

View filters(color overlay; always show $dist boundaries on top):
  population density | partisan lean | any demographic dimension | district assignment
Hover: tooltip with all $pc metadata; pin for comparison

Editing:
  brush/paint: stroke determines target $dist by starting location; adjustable brush size
    (large=rough shaping; small=fine detail); boundary updates live
  single-$pc click still available for fine-grained work
  specific UI motif(brush vs lasso vs flood-fill) → WD+GES decision;
    constraint: bulk editing must NOT feel like data entry
  non-contiguous(when enabled): assign $pc to non-adjacent $dist | create new $dist from $pc
  undo/redo always available | reset-to-start restores original scenario boundary

Live validity indicators:
  population balance(each $dist vs target ±%) | contiguity warnings |
  $VRA risk highlights | compactness score(when relevant)

§SCENARIOS

V1 target 8-12:
| # | Title | Objective | Lesson |
|---|---|---|---|
| 1 | Welcome to New Texansifornia | tutorial: draw any valid map | how redistricting works |
| 2 | Give the Governor a Win | +1 seat for governor's party | basic partisan gerrymandering |
| 3 | The Packing Problem | pack opposition into fewest $dists | packing; efficiency gap |
| 4 | Cracking the Opposition | dilute opposition across many $dists | cracking tactic |
| 5 | A Voice for the Valley | create majority-Latino $dist after pop growth | $VRA; majority-minority $dists |
| 6 | Harden the Map | maximise safe seats; minimise competitive | incumbency protection |
| 7 | The Reform Map | apply neutral rules(compactness+contiguity+equal pop) | what neutral rules achieve+don't |
| 8 | Both Sides Unhappy | bipartisan-agreed neutral standard | neutral rules don't eliminate politics |
| 9 | Cats vs. Dogs | Cat Party dominates Dog Party | tone break; reinforce mechanics |

Stretch $v1/early v2:
| 10 | The Canadian Way | Canada arms-length commission rules | international comparison |
| 11 | After the Boom | census-driven redraw w/ major pop shift | population change |

PR/electoral system scenarios: OUT OF SCOPE for this game — don't fit district-drawing sim;
  possible separate game in a series; must not constrain this engine's design

1+ additional $v1 scenarios needed: complicate reform narrative(e.g. neutral rules →
  worse minority representation; or "good gerrymander" → more competitive map)
  these are a named design gap — fill before scenario set is final

Later: historically-inspired(fictional pop data) | $VRA s.2 | multi-party | player-designed

Design principles:
  no two scenarios same primary lesson | ≥1 silly scenario(tone break) |
  ≥1 surprising/counterintuitive result per scenario | optional criteria add depth w/o blocking
  character-perspective framing: player cast as specific actor(operative, reformer, etc.)
    inhabits character's goals+bias; invites player to compare vs. own views
    matched pairs where possible(gerrymander for A → gerrymander for B)
  counter-scenarios: ≥1 scenario where neutral rules produce uncomfortable outcome;
    arc must not conclude reform=good, tactics=bad

§CUSTOM_LEVEL
V1 scope: scenario data FORMAT only(shared with pre-built scenario authoring); must not
  preclude player UI or community sharing later
Player-facing creator(post-$v1): paint population data(partisan lean, demographics, density per $pc)
  define success criteria(required+optional; any evaluation dimension)
  design rules(which constraints apply; compactness thresholds; contiguity; equal pop ±%)
  write scenario text(intro slides, narrative context, flavor)
  build fictional or historically-inspired maps(no real geodata required)

Community sharing(post-$v1):
  publish scenarios → shared library; others browse+play+rate
  distributes authorial power; enables rules-as-advocacy
  lightweight moderation(no hate speech, no doxxing); NOT filtered by political perspective
  server-side: scenario data ONLY(no per-session compute); minimal hosting cost
  play state remains local

§PROGRESSION
Scenarios: standalone vignettes; no narrative continuity in $v1; ordered for pedagogic
  progression(tutorial→tactics→reform), not story; each has different fictional region+cast
sequential unlock(complete N → unlock N+1) | replay any completed scenario anytime
scenario select: completed(+achievement status) | next unlocked | locked visible(anticipation)
no level cap — game receives new scenarios over time
Campaign mode(stretch/later): grouped scenarios with shifting goals; possible story arc;
  no narrative currently in mind; worth workshopping; design must not preclude adding later

§V1_SCOPE
IN: single-player | single sub-state region/scenario | $FPTP only | fictional regions+pops |
  8-12 scenarios(partisan+demographic+neutral-rules) | desktop-first |
  progress: local browser storage(IndexedDB/localStorage); no user accounts; no server game state
  scenario data format(shared w/ pre-built authoring; player UI deferred)
OUT: player-facing Custom Level UI + community sharing(post-$v1) |
  alt electoral systems(STV,party-list) | real geodata | full-state/multi-state scope |
  multiplayer | mobile-optimised editor(TBD; may be different model on same data) |
  international comparisons(early v2) | user accounts/cross-device(v2 if justified) |
  campaign/narrative mode(stretch; must not be precluded)

§OPEN
1. [RESOLVED] Custom Level: scenario data format in $v1; player UI+community sharing post-$v1
2. [RESOLVED] Save/profile: local browser storage(IndexedDB); no user accounts $v1;
   community scenarios(post-$v1) need minimal server storage(scenario data only)
3. [RESOLVED] Precinct naming: "precinct" confirmed
4. Mobile: deferred; may be different interaction model on same data; may not happen; no decision needed
5. Fictional region names+geographies: GES+VDA creative decision per scenario
6. [RESOLVED] Tech stack: TypeScript+Vite+D3.js+Zustand (SPIKE-001) + Bazel 9.1+bzlmod+rules_rust+aspect_rules_ts (SPIKE-002); Rust→WASM via wasm-bindgen; open: switch to web target+proper .d.ts import for production; next: BUILD ticket to integrate spikes into single Bazel graph
7. Precinct count calibration: target ~hundreds; DR to research real sub-state regions+precinct
   counts to inform GES+ARCH rendering+perf targets
8. $VRA/bloc voting model: simplified — demographic group vote-share % per $pc; district outcome
   aggregated from breakdown; GES+DR to validate educational soundness; generalises to any demographic
9. Historical/inspired scenarios: post-$v1; fictional pop data on inspired maps; DR required
10. About page content: deferred until page exists; convey intent+non-partisan framing

§REFS
team+workflow: thoughts/shared/research/2026-04-23-agent-team-and-workflow-design.compressed.md
project purpose: README.md
