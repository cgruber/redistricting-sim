<!--COMPRESSED v1; source:2026-04-23-agent-team-and-workflow-design.md-->
§META
date:2026-04-23 researcher:claude+cgruber branch:main repo:cgruber/redistricting-sim
topic:multi-agent team design+workflow tags:agents,workflow,roles,team-design,product,architecture
status:provisional — tech stack session pending last_updated:2026-04-23

§ABBREV
PM=Product Manager GES=Game Engine Specialist ARCH=Architect
WD=Web/UI Designer VDA=Visual Designer/Artist
TDDB=TDD Designer(backend) TDDF=TDD Designer(frontend)
CB=Coder(backend) CF=Coder(frontend)
DR=Domain Reviewer EER=Educational Effectiveness Reviewer
SR=Security Reviewer A11Y=Accessibility Reviewer CFR=Cost/Finance Reviewer
LR=Legal Reviewer BS=Build Specialist
ts=thoughts/shared nfr=non-functional requirement

§SUMMARY
Multi-agent team for redistricting-sim. Extends polyglot TDD workflow ($ts/research/2026-04-21-multi-agent-tdd-workflow.md)
with: PM, GES, VDA added as standing; 7 on-demand reviewers; SCRUM-like sprint rhythm.
Two prerequisites before impl: tech stack session (GES+ARCH) + game vision doc (PM+user).

§STANDING_ROLES

PM
  domain: what+why; feature specs; acceptance criteria; sprint priorities
  proxy: represents user to all agents; escalates to user for direction changes,
    practical-constraint deviations, large-scope changes, educational-fidelity tradeoffs,
    and regular sprint demos (user plays game each sprint)
  nfr ownership: DoD, test sufficiency, a11y standards, privacy policy, browser/device targets,
    educational effectiveness as product req

GES
  domain: game mechanics; simulation design; electoral algorithms(FPTP v1; STV/party-list stretch);
    district validity rules(contiguity,compactness); population modeling; scenario mechanics
  absorbs: domain research for own mechanics design
  does NOT own: domain accuracy checks → DR(on-demand)
  vs ARCH: peers, both answer to PM; GES="what can simulation do+how";
    ARCH="how does system hang together"; negotiate boundary in Phase 1

ARCH
  domain: system design; API; service boundaries; deployment; data flow; tech choices
  peers with GES on simulation layer; with DBA on persistence layer
  nfr ownership: scale targets; perf budgets(page load,latency,animation); security model;
    observability strategy; cost-aware design (budget envelope from CFR)

DBA
  domain: schema; migrations; seeding; portability; test data strategy
  participates: when features touch persistence; absent for frontend-only or simulation-only work

WD
  domain: map interface design; district-drawing UX; information architecture; user flows
  outputs: wireframes + interaction specs → TDDF
  key challenge: data overlays(population density, voting preference, race) readable at a glance
  works with VDA on visual language

VDA
  domain: visual identity; style guide; data viz design; game assets(illustrations,
    cut-scene storyboards/animations, tutorial art, icons, UI chrome)
  outputs: design specs(color system, typography, animation timing, SVG specs) + actual assets
  intensity: high up-front(identity+map rendering approach); iterative later(scenario/tutorial assets)
  CRITICAL: colorblindness — district viz IS the game's visual language; ~8% men affected;
    accessible color design must be in brief from day one, not retrofitted
  collaborates: PM(tone,cut-scene vision) GES(simulation data viz) DR(geographic accuracy)
    WD(visual language,motion) TDDF+CF(SVG/CSS/animation contracts)

TDDB + TDDF
  domain: tactical API completion; test-first; fill ARCH open space with concrete interfaces,
    method sigs, error contracts, type shapes, failing tests
  TDDB reads: ARCH doc + DBA schema
  TDDF reads: WD interaction specs + ARCH API contract
  can work in parallel when API contract is clear
  public contract is fixed once defined; propose changes back to ARCH; never unilateral

CB + CF
  domain: private implementation below public surface defined by TDD Designer
  latitude: private types, helpers, internal state, utility extraction, library selection(approved deps)
  may propose public changes back to TDD Designer; may not change unilaterally

§REVIEWERS

| Role | Trigger(s) |
|---|---|
| DR(Domain) | electoral accuracy; scenario validity; VRA representation; domain UI text |
| EER(Educ.Effectiveness) | scenario design; tutorial design; "does this teach the lesson?" |
| SR(Security) | any trust boundary: exposed API, user data, UGC, auth |
| A11Y(Accessibility) | every UI feature before ship; non-optional step in WD→CF pipeline |
| CFR(Cost/Finance) | infra decisions; 3rd-party service choices; build-vs-buy; cost at scale |
| LR(Legal) | COPPA/GDPR; map data licensing; real-event scenarios |
| BS(Build) | new Bazel targets(TS,WASM,Docker); significant CI changes |

COPPA flag: if game reaches US schools, data collection from <13 regulated federally — even
  anonymised telemetry may be in scope; needs legal position before any analytics added
Map tile flag: commercial providers charge per-tile-load; compounds fast under classroom load;
  OpenStreetMap(ODbL) or pre-rendered tiles preferred; CFR+ARCH must evaluate early

reviewer advantage: stable reusable prompt templates; improve over sprints; outputs auditable

§WORKFLOW

NOT waterfall — iterative cycle. Vision evolves continuously through demos+learnings.
Phases describe type-of-work, not a one-time sequence.

Cycle:
  Vision(PM↔user) → Feature Design(PM→GES/ARCH/WD/VDA) → Implementation(TDD→Coder)
       ↑                                                           ↓
       └──────────────── Demo(user plays; feedback) ──────────────┘

Vision (living doc, updated every sprint):
  PM↔user ongoing; not frozen; updated when: demos surface new understanding;
    GES/ARCH learnings change feasibility; domain/EE review changes what's appropriate
  GES consulted on feasibility; VDA on tone; direction changes reviewed with user before acting

Feature Design (per sprint, reads current vision):
  PM → feature spec+AC(from vision)
       ↓
  ┌────┴──────────────────┐
  GES↔ARCH               VDA
  (sim+system design)    (visual language+tone)
  ↓        ↓              ↓
  └──→DBA←┘            WD
  (schema if needed)   (wireframes+user flows)
  ↓                      ↓
  ARCH system doc      interaction specs

Implementation (per PR):
  TDDB(reads ARCH+schema) ║ TDDF(reads interaction specs+API contract) [parallel]
      ↓                   ║       ↓
     CB                   ║      CF

Demo (closes loop → vision):
  user plays sprint output; PM synthesises feedback →
    update vision doc | new ticket | defer
  feedback can surface: mechanics not teaching intended lesson; confusing UX;
    wrong scope; new ideas vision didn't anticipate

PM escalation to user: direction changes; constraint deviations; large scope; educ-fidelity
  tradeoffs; sprint demos

§NFRS
PM owns: DoD test-sufficiency; a11y standards; privacy policy; browser/device targets; educational effectiveness
ARCH owns: scale; perf budgets; security model; observability; cost-aware design
Shared: i18n(PM decides; ARCH implements) — unresolved
COPPA+GDPR: LR trigger; fire before any telemetry or school use

§AGENT_MECHANICS
Four advantages of specialty agents vs general-purpose:
1. context signal/noise: less irrelevant material; mitigates "lost in the middle" degradation
2. parametric knowledge activation: focused context = focused query into model weights;
   tighter-scoped prompt activates more precise training knowledge (priming, not attention per se)
3. parallelism: TDDB+TDDF share only API contract; non-overlapping concerns, no context contamination
4. prompt reusability: stable reviewer prompts improve over sprints; outputs predictable+auditable

§OPEN
1. tech stack — in-browser vs server; mobile; WASM(Kotlin Multiplatform?); map tile source
   → needs GES+ARCH session before any system design
2. ~~game vision doc — v1 scenarios; player session flow; learning objectives
   → PM-driven; user-reviewed; required before GES+ARCH design work~~
   RESOLVED: vision doc written; see $ts/vision/game-vision.compressed.md
3. LR segmentation(privacy vs IP/licensing) — deferred
4. component inventory format (WD→TDDF handoff) — deferred until tech stack known
5. i18n support — PM+user decision; if yes must enter ARCH brief early

§REFS
prior workflow: $ts/research/2026-04-21-multi-agent-tdd-workflow.md
project purpose: README.md
game vision (living doc): $ts/vision/game-vision.compressed.md — scenarios, mechanics, educational goals, v1 scope
