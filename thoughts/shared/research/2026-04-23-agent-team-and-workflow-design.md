---
date: 2026-04-23
researcher: claude+cgruber
branch: main
repository: cgruber/redistricting-sim
topic: Multi-agent team design and development workflow for redistricting-sim
tags: agents, workflow, roles, team-design, product, architecture
status: provisional — tech stack session pending
last_updated: 2026-04-23
last_updated_by: claude+cgruber
---

# Agent Team and Workflow Design

## Summary

Design of the multi-agent development team and workflow for the redistricting-sim project.
Builds on the TDD workflow pattern established in polyglot
(`thoughts/shared/research/2026-04-21-multi-agent-tdd-workflow.md`) and expands it
substantially to cover the requirements of a game: product management, game mechanics
design, web UI, visual design, and a set of on-demand specialist reviewers.

Two open workstreams remain before implementation begins: a tech stack session (involving
GES and Architect) and a game vision document (PM-driven, user-reviewed).

---

## Role Roster

### Standing Production Roles

These roles participate in every sprint or every feature, depending on scope.

#### Product Manager (PM)
**Domain:** What gets built and why. Translates the user's educational goals into
concrete feature specs, acceptance criteria, and sprint priorities. Represents the user
to all other agents between formal checkpoints. Makes on-the-fly decisions within
established scope; escalates to user for: fundamental direction changes, deviations from
prior decisions due to new constraints or learnings, large-scope changes, and any tradeoff
of educational fidelity against playability (this tradeoff is close to the project's core
and warrants user input rather than unilateral PM decisions).

**Also owns (non-functional):** Definition of Done, test sufficiency standards,
accessibility standards, privacy/data collection policy, browser/device targets,
educational effectiveness as a product requirement.

**Workflow rhythm:** SCRUM-like. Drives sprint planning with user input. Owns regular
demos — the user plays whatever has been built each sprint, giving feedback that feeds
the next cycle.

#### Game Engine Specialist (GES)
**Domain:** Game mechanics design and simulation. Owns: electoral algorithm design
(FPTP for v1; STV, party-list, etc. as stretch goals), district validity rules
(contiguity, compactness metrics), population distribution modeling, scenario mechanics,
progression design. Does necessary domain research as part of this work (how FPTP
counting actually works, what compactness metrics academics use, historical redistricting
patterns). Not responsible for raw domain accuracy checks — that's the Domain Reviewer's
role on-demand.

**Relationship to Architect:** Peer/co-designer, not subordinate. Both answer to PM.
GES owns "what is the simulation capable of and how should it work"; Architect owns "how
does the system hang together." They negotiate the boundary between those two in Phase 1
of feature design.

#### Architect
**Domain:** How all systems hang together. API design, service boundaries, deployment
strategy, data flow, technology choices, integration points. Co-designs with GES on the
simulation layer; co-designs with DBA on the persistence layer.

**Also owns (non-functional):** Scale targets, performance budgets (page load, simulation
latency, animation frame budget), security model (threat model, input validation, rate
limiting), observability strategy, cost-aware design (infrastructure choices must live
within a budget envelope informed by the Cost/Finance Reviewer).

#### DBA
**Domain:** Schema design, migrations, seeding, DB portability, test data strategy.
Serves the Architect's intent; negotiates data model constraints back. Participates when
features touch the persistence layer; not present for purely frontend or simulation-only
changes.

#### Web/UI Designer
**Domain:** Interactive map interface design, user experience for district drawing,
information architecture, user flows. Produces wireframes and interaction specs as primary
handoff artifacts to frontend TDD Designer. Works closely with Visual Designer/Artist on
visual language. The district-drawing interaction and the data overlay design (communicating
population density, voting preference, racial composition at a glance) are core UX challenges
for this game.

#### Visual Designer/Artist
**Domain:** Visual identity, style guide, data visualization design, game assets
(illustrations, cut-scene storyboards/animations, tutorial art, icons, UI chrome).
Produces both design specs (color systems, typography, animation timing contracts, SVG
specs) and actual assets.

**Role intensity varies:** High up-front work establishing visual identity and map
rendering approach (before Web Designer can produce meaningful wireframes); shifts to
iterative asset production for specific scenarios, tutorials, and cut-scenes in later
sprints.

**Key constraint to establish early:** Colorblindness. District boundary visualization
and data overlays are the entire visual language of the game. ~8% of men have color
vision deficiency. Accessible color design must be in the brief from the start, not
retrofitted.

**Collaboration graph (widest of any role):**
- PM: tone, educational intent, scenario cut-scene vision
- GES: how simulation data is visualized; what the map communicates
- Domain Reviewer: visual accuracy of geographic/demographic representations
- Web Designer: visual language, component design, interaction motion design
- Frontend TDD Designer/Coder: SVG specs, CSS variables, animation timing contracts

#### TDD Designer (Backend) and TDD Designer (Frontend)
**Domain:** Tactical API completion and test-first design for their layer. Fill the
Architect's open design space with concrete interfaces, method signatures, error contracts,
type shapes, and tests. Their definitions are the public contract Coders must implement.
Can propose contract changes back to the Architect but may not unilaterally change
signatures.

Frontend TDD Designer works from Web Designer interaction specs + Architect's API contract.
Backend TDD Designer works from Architect's system design + DBA schema.
Both can work in parallel on the same feature when the API contract is clear.

#### Coder (Backend) and Coder (Frontend)
**Domain:** Private implementation — everything below the public surface defined by TDD
Designer. Full creative latitude on: private types, helpers, internal state, utility
extraction, library selection within approved deps. May propose public contract changes
back to TDD Designer; may not change them unilaterally.

---

### On-Demand Reviewer Roles

These roles are not present in every sprint. They are invoked at specific trigger points.
Each should have a stable, reusable prompt template that improves over time.

#### Domain Reviewer
**Invoked for:** Electoral accuracy checks, scenario validity ("is this redistricting
scenario realistic?"), Voting Rights Act representation accuracy, domain-specific text in
the UI.
**Distinct from GES:** GES reasons about what mechanics are possible; Domain Reviewer
reasons about whether those mechanics accurately represent the real domain.

#### Educational Effectiveness Reviewer
**Invoked for:** Scenario design review, tutorial design, "does this actually teach the
intended lesson?" The game can be mechanically correct and pedagogically ineffective.
Someone needs to own this review at the scenario level.
**Distinct from GES:** GES reasons about mechanics; this role reasons about learning
outcomes and instructional design.

#### Security Reviewer
**Invoked for:** Every sprint touching a trust boundary: API endpoints exposed to the
internet, anything involving user data, scenario sharing if user-generated content is
added, auth if user accounts are introduced.

#### Accessibility Reviewer
**Invoked for:** Every UI feature before it ships. Given the educational target audience
and the visual complexity of the game's core interface, this should be a non-optional
step in the Web Designer → Frontend Coder pipeline, not an afterthought.

#### Cost/Finance Reviewer
**Invoked for:** Infrastructure decisions, third-party service choices, build-vs-buy
decisions. Evaluates "what does this cost at 100 concurrent users? At 10,000 during a
viral classroom moment?" Output feeds directly into Architect's tradeoff decisions.
**Context:** The game is intended to be free and donation-supported. Fixed operational
costs must stay within what a small donation base can sustain. Map tile costs in
particular can compound fast under load (see map data licensing note below).

#### Legal Reviewer
**Invoked for:** COPPA/GDPR analysis (if we collect any telemetry — even anonymised —
and the game reaches schools or EU users), map data licensing (OpenStreetMap ODbL vs.
commercial), any scenario based on real political events. May be segmented into specialised
sub-roles later (privacy law, IP/licensing) as needs clarify.

**COPPA flag:** If the game is used in US schools, federal law governs data collection
from children under 13. This applies even to anonymised telemetry. Needs a legal position
before any analytics are added.

#### Build Specialist
**Invoked for:** Adding new build targets to Bazel (TypeScript frontend, WASM compilation,
Docker packaging, map asset processing), significant CI pipeline changes. The Architect
should not need to hold deep Bazel bzlmod expertise; the Build Specialist provides a
dedicated context for "how does this new thing integrate correctly and what are the
MODULE.bazel implications."

---

## Workflow

**This is an iterative cycle, not a waterfall.** Vision is established first but is never
frozen — it evolves continuously through demos and learnings. Each sprint demo feeds back
into the vision, which shapes the next round of feature design. The three phases describe
the *type* of work happening, not a strict sequence that happens once.

```
        ┌─────────────────────────────────────────┐
        ↓                                         │
  Vision (PM ↔ user)                              │
        ↓                                         │
  Feature Design (PM → GES/Arch/WD/VDA)           │
        ↓                                         │
  Implementation (TDD Designer → Coder)           │
        ↓                                         │
  Demo (user plays, gives feedback) ──────────────┘
```

### Vision — living document, evolves every sprint

PM ↔ user: ongoing conversation that started at project inception and continues
throughout. The game vision document (`thoughts/shared/vision/game-vision.md`) is a
*living document*, not a frozen spec. It is updated when: demos surface new understanding,
GES or Architect learnings change what's feasible, domain or educational effectiveness
review changes what's appropriate.

GES is consulted on simulation feasibility; Visual Designer on tone and aesthetic direction.
Any update to the vision document that represents a meaningful direction change is reviewed
with the user before being acted on.

### Feature Design — per sprint, informed by current vision

Each sprint begins with PM checking the current vision state and translating it into a
concrete feature spec with acceptance criteria. The vision doc is the input; the feature
spec is the output.

```
PM writes feature spec + acceptance criteria
         ↓
    ┌────┴─────────────────────────┐
    ↓                              ↓
GES ↔ Architect              Visual Designer/Artist
(simulation + system design)  (visual language + interaction tone)
    ↓         ↓                    ↓
    └──→ DBA ←┘               Web Designer
    (schema if needed)        (wireframes + user flows)
         ↓                         ↓
    Architect's system doc    Interaction specs
```

GES and Architect co-produce the Phase 1 design document — same collaborative model as
DBA+Architect in the polyglot TDD workflow, but for the simulation/system layer rather
than the data layer.

Visual Designer and Web Designer work in parallel, with Visual Designer's style guide as
a constraint on Web Designer's wireframes.

### Implementation — per PR, per layer

```
Backend TDD Designer          Frontend TDD Designer
(reads Arch doc + schema)     (reads interaction specs + API contract)
         ↓                              ↓
    Backend Coder              Frontend Coder
```

Both pairs work in parallel when the API contract (shared boundary) is clear. Each TDD
Designer produces: interfaces, method signatures, error contracts, type shapes, and failing
tests. Coders fill the implementation bodies.

### Demo — closes the loop back to vision

At the end of each sprint, the user plays what has been built. Demo feedback is not just
bug reports — it can surface: mechanics that don't teach the intended lesson, UI flows
that confuse, scope that feels wrong, or new ideas the vision document didn't anticipate.
PM synthesises demo feedback and decides what updates the vision document, what becomes a
new ticket, and what is deferred.

### Review Gates (woven into implementation)

| Trigger | Reviewer invoked |
|---|---|
| Any trust boundary touched | Security Reviewer |
| Any UI feature | Accessibility Reviewer |
| Infrastructure/service decision | Cost/Finance Reviewer |
| Scenario or tutorial content | Educational Effectiveness Reviewer |
| Electoral accuracy question | Domain Reviewer |
| New Bazel target or CI change | Build Specialist |
| Data collection, school use, map licensing | Legal Reviewer |

### PM Escalation to User

PM makes on-the-fly decisions within scope. Escalates to user for:
- Fundamental direction changes
- Deviations from prior decisions due to new constraints or learnings
- Large-scope changes
- Any tradeoff of educational fidelity for playability
- Sprint demos (user plays the game, gives feedback; feeds back into vision)

---

## Non-Functional Requirement Ownership

| NFR | Owner |
|---|---|
| Definition of Done, test sufficiency | PM |
| Accessibility standards | PM (requirement); Web/Visual Designers (implementation) |
| Privacy/data collection policy | PM + Legal Reviewer |
| Browser/device targets | PM |
| Educational effectiveness | PM + Educational Effectiveness Reviewer |
| Scale targets | Architect |
| Performance budgets | Architect |
| Security model | Architect + Security Reviewer |
| Observability strategy | Architect |
| Cost-aware design | Architect + Cost/Finance Reviewer |
| Internationalisation | PM (decision to support); Architect (how) — unresolved |
| COPPA/GDPR compliance | Legal Reviewer; trigger: any telemetry or school use |

---

## Mechanical Advantage of Specialty Agents

Four distinct advantages over general-purpose agents for specialist roles:

1. **Context signal/noise.** Attention in transformers operates over the context window.
   A focused specialist context has less irrelevant material to route through, improving
   signal quality. The documented "lost in the middle" phenomenon (models perform worse on
   information buried in long, noisy contexts) is mitigated by shorter, denser contexts.

2. **Context as query into parametric knowledge.** The model's knowledge lives in weights
   (from training). The context acts as a query that activates specific learned patterns.
   A tightly scoped security-review prompt activates security-relevant knowledge more
   precisely than a broad prompt spanning game design, electoral law, and frontend
   architecture simultaneously. This is priming, not attention per se, but the effect is real.

3. **Parallelism with non-overlapping concerns.** Frontend TDD Designer and Backend TDD
   Designer working simultaneously on the same feature share only the API contract. Their
   file sets and contexts don't overlap. Two specialists in parallel is faster and produces
   less context contamination than one general agent working sequentially.

4. **Prompt template reusability.** A stable, well-crafted reviewer prompt (Security,
   A11y, Cost) improves over sprints. Each invocation starts from a high, consistent
   baseline. Review outputs are predictable and auditable — you can assess whether the
   review covered what it was supposed to cover.

---

## Open Questions

1. **Tech stack** — in-browser vs. server computation, mobile roadmap, WASM feasibility
   (Kotlin Multiplatform?). Needs a dedicated session with GES and Architect before
   system design begins. Map tile data source is part of this (cost + licensing
   implications).

2. ~~**Game vision document** — what are the concrete v1 scenarios? What does a player
   session look like start to finish? What should a player understand at the end that they
   didn't before? PM-driven, user-reviewed. Required before GES or Architect can produce
   meaningful designs.~~ **Resolved** — game vision doc written and included in this PR
   (`thoughts/shared/vision/game-vision.md`).

3. **Legal reviewer segmentation** — may split into privacy law and IP/licensing
   sub-roles as the project matures. Deferred for now.

4. **Component inventory format** — handoff artifact from Web Designer to Frontend TDD
   Designer. Deferred until tech stack is chosen.

5. **Internationalisation** — whether to support multiple languages is a PM/user decision.
   Unresolved; if yes, must be in the Architect's brief early.

---

## References

- Prior workflow research: `thoughts/shared/research/2026-04-21-multi-agent-tdd-workflow.md`
- Project purpose: `README.md`
- Game vision (living doc): `thoughts/shared/vision/game-vision.compressed.md` — scenarios, mechanics, educational goals, v1 scope
