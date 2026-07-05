---
date: 2026-07-05
status: accepted
---

# ADR: Tutorial Progression & Multi-Party / Independent Placement

## Status

Accepted. **Reverses** the seat-gate decision recorded for tutorial-006 in GAME-121
(PR #331) and re-scopes that PR. The one design fork (tutorial-004's capstone role) was
resolved by the owner in favour of **Option A — a single six-rung ladder** (see below).

## Context

Six tutorials exist, each a `.spec.yaml` + generated `.json` with a guided coach
script (DESIGN-012 / GAME-076). Only four are public:

- **tutorial-001..004** — the public "tutorial" campaign.
- **tutorial-005** (three-party race, GAME-120) and **tutorial-006** (home-base
  independent, GAME-121) — parked in the `debugOnly` "debug" campaign, reachable only
  via `?campaign=debug&debug`.

Two problems motivated this ADR (surfaced by the owner's question, *"why do we have 6,
and what are the goals for each?"*):

1. **The count accreted without a progression design.** 005 and 006 were each added
   per-ticket and parked in the debug sandbox; the vision doc still describes only a
   single tutorial. There is no written arc, so the ladder reads as incoherent.

2. **tutorial-006 is an outlier on its win condition.** tutorials 001–005 gate on
   **legality only** (`district_count` + `population_balance`/`contiguity`); the
   electoral outcome is *emergent* — the player observes it in the live result panel,
   nothing requires a particular winner. This is the established pattern and is
   consistent with the [criteria-only validity model](2026-05-18-criteria-only-validity-model.md)
   (*"surface the contingency of these rules, not naturalize them"*). tutorial-006 alone
   shipped with a **`seat_count dhalsim >= 1` objective** — a win/lose gate, the only
   tutorial with a mandated outcome.

Critically, **the coaches already teach the lessons through guided highlights**:
- `TUTORIAL_005` step 2 rings the **Lean** view and names the three party bases
  ("Ken orange west, Ryu purple centre, Chun-Li teal east").
- `TUTORIAL_006` step 2 rings **Lean** + the ⌂ home pin and states the independent's
  lean-vs-ballot rule directly (*"Lean is map-wide; the ballot is home-only"*).

So the teaching the owner asked for — *"use the guidance highlights to point out how
party leans work with multiple parties and independents"* — is **already built**. The
work is mostly **subtraction** (remove the goal, remove the gating), not new authoring.

## Decision

### 1. Principle — tutorials teach by guided demonstration, not by outcome gates

Every tutorial gates on **legality only**. The electoral outcome is emergent: shown
live in the result panel, observed, never required. The lesson is carried by the
coach's highlighted steps and copy. This is already true of 001–005; 006 is brought
into line. (The educational *campaign* — scenario-002..009 — is where outcome-shaped
challenges live; the tutorial arc teaches mechanics, not objectives.)

### 2. Remove tutorial-006's seat objective (reverses GAME-121)

Drop the `seat_count dhalsim >= 1` criterion. tutorial-006 gates on `district_count`
+ `population_balance` + `contiguity`, like the rest. The lean-vs-ballot lesson survives intact as
**observation**: keep the Hollow whole → the eastern district holds Dhalsim's home and
his base → he is on the ballot *and* wins, visible in the result panel; crack the
Hollow → he wins nothing. The coach already narrates this; the live result panel
already shows it. No gate is needed to make the point — and removing it makes 006
consistent with the whole ladder and with the criteria-only validity model.

*(This reverses the "seat objective is load-bearing" position taken in PR #331. That
position was load-bearing only for a **win/lose** lesson; the owner has chosen a
guided-observation lesson instead, which is the more consistent pedagogy.)*

### 3. Promote tutorial-005 + tutorial-006 into the public progression

Move both out of the `debugOnly` campaign into the public tutorial arc. Multi-party
races and independents are game **mechanics** — how the map reads and the election
computes with more than two parties, and with a candidate whose lean and ballot
diverge. They belong in the teaching sequence, not a developer sandbox.

### The public tutorial ladder

| Rung | Scenario | New concept introduced | Gate |
|------|----------|------------------------|------|
| 1 | tutorial-001 | Core loop: paint / undo / submit | `district_count` |
| 2 | tutorial-002 | Structural rules: balance + contiguity, the Validity panel | + `population_balance` / `contiguity` |
| 3 | tutorial-003 | Electoral causality: the Lean view + live result panel | legality only |
| 4 | tutorial-004 | Synthesis: every tool visible, no new mechanic | legality only |
| 5 | tutorial-005 | Multi-party leans: three parties; packing/cracking *emerges* | legality only |
| 6 | tutorial-006 | Independent: lean (map-wide) vs. ballot (home-only) | legality only |

### The capstone-ordering fork — RESOLVED: Option A (single six-rung ladder)

tutorial-004 was authored as *"the capstone / bridge to the real campaign"* (its closing
beat: *"Then on to the real thing."*). Placing 005/006 after it breaks that framing. The
owner chose **Option A**: one Tutorial campaign, six rungs. 004 stops being the literal
last rung; its closing beat softens from "on to the real thing" to a hand-off toward the
two remaining situations, and 006 becomes the new bridge to the campaign. This is the
simplest model — one linear campaign — and matches the intent *"I want them in the
tutorial."* 004's real value (synthesising T1–T3) survives as an internal milestone even
though it is no longer the final rung.

*(The alternative considered and rejected: two public campaigns, "Basics" 001–004 +
"Advanced" 005–006, which would have preserved 004's capstone role but framed multi-
party/independent as optional rather than core, at the cost of a second campaign.)*

## Consequences — implementation slice (re-scopes PR #331)

- **`game/scenarios/tutorial-006.spec.yaml`** — remove the `seat_count` criterion;
  regenerate `tutorial-006.json` via the pipeline.
- **`game/web/src/model/campaigns.ts`** — add `tutorial-005`, `tutorial-006` to the
  `"tutorial"` campaign; remove the now-empty `"debug"` campaign (retain the
  `debugOnly` field + `visibleCampaigns` filter for future use).
- **`game/web/src/main.ts`** — keep `tutorial-005` / `tutorial-006` in
  `CAMPAIGN_ONLY_SCENARIOS` (it supplies card titles for campaign-only scenarios, as it
  already did for `tutorial-001`) and give them public titles. They stay **out** of the
  all-scenarios `SCENARIO_MANIFEST`, so they are reachable only inside the tutorial
  campaign, in rung order.
- **`game/web/src/model/campaigns_test.ts`** — update/remove the debug-campaign gating
  assertions (no campaign is `debugOnly` after this); keep coverage of the filter via a
  synthetic fixture rather than the retired "debug" campaign.
- **`game/web/src/tutorial/overlay.ts`** — reframe 006's closing beat from *"Did you win
  Dhalsim his seat?"* to observation; soften 005's *"Can you give each party a seat?"*;
  under Option A, soften 004's *"on to the real thing."* **The highlight/teaching steps
  stay as-is** — they already do the job.
- **`game/web/e2e/tutorial-006-independent.spec.ts`** — with no seat gate, **both maps
  now pass** ("Map Passed!"). The **winner-badge assertions stay and become the
  load-bearing proof** (Hollow whole → Dhalsim badge present; cracked → no Dhalsim
  badge). The lose-foil test's verdict flips to "Map Passed!" and is reframed: *a legal
  map that still denies the Hollow its seat* — the lesson made executable. Replace the
  old `?campaign=debug&debug` URLs here and in `tutorial-005-multiparty.spec.ts` and
  `home-independent.spec.ts` with `?campaign=tutorial&s=…&debug`: `&campaign=tutorial`
  puts the scenario in the active list (it is not in `SCENARIO_MANIFEST`), and `&debug`
  clears the rung lock so a test can jump straight to a later rung.
- **`thoughts/shared/vision/game-vision.md` (+ `.compressed.md`)** — replace the
  single-tutorial description with the six-rung ladder and the guided-teaching
  principle (both forms, same commit).
- **Sprint roadmap** — note under S13's tutorial-walkthrough theme that the tutorial
  arc is now six public rungs including multi-party + independent.
- **PR #331** — retitle and rewrite the body from *"author tutorial-006 home-base
  independent"* to *"promote multi-party + independent as public no-goal tutorials"*;
  re-scope the GAME-121 resolution row in `TICKETS.md` (drop the seat-objective / win-
  basin framing); amend the squash commit message. **#331 is not merged in its current
  (seat-gate, debug-only) form.**

### Educational upside

The tutorial arc now demonstrates the full mechanical vocabulary — two-party, multi-
party, and independents — *before* the educational campaign asks the player to reason
about gerrymandering techniques. And it does so without ever telling the player which
outcome is "correct": consistent with the game's thesis that district lines are choices
whose consequences you learn to *see*, not win conditions handed down.
