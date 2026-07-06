# GAME-121 — tutorial-006: the home-base independent ("Dhalsim done right")

**Date:** 2026-07-05
**Ticket:** GAME-121 (last of the 117→121 sequence; follows GAME-118 home-base mechanic, GAME-120 three-party tutorial)
**Status:** implementation
**Design of record:** `thoughts/shared/plans/2026-07-02-district-candidates-and-independents.compressed.md` (§GAME-121 "Dhalsim done right")

> **⚠️ Partially superseded (2026-07-05).** The **seat-gate objective** (§2) and the
> **debug-campaign housing** (*Registration + surfaces*, *Merge gate*) were **reversed before
> merge** by the [tutorial-progression ADR](../decisions/2026-07-05-tutorial-progression-and-multiparty-placement.md).
> tutorial-006 ships **legality-only** (`district_count` + `population_balance` + `contiguity`,
> no `seat_count`) as **rung 6 of the public tutorial ladder** — not a seat-gated demo in the
> debug campaign. The **Option-A pipeline extension** (§1), the **map geometry / zones** (§3),
> and the **feasibility proof** were implemented and still hold; the WIN / LOSE maps are now read
> as *observed* outcomes, not pass/fail. See the ADR for the decision and the six-rung ladder.

## Goal

A NEW `tutorial-006` that teaches the **GAME-118 home-base independent** mechanic: an
independent carries a **map-wide lean** but is on the **ballot only in the district holding
their home precinct**. Dhalsim — the unaffiliated yogi of the eastern Hollow — done *right*
this time (in the GAME-112 draft that became tutorial-005 he was framed as an independent but
behaved as a full party; the genuine mechanic is exercised here for the first time in an
authored, shipping scenario).

The lesson, made concrete: **keep the Hollow whole around Dhalsim's home → he's on the ballot
AND has the votes → he wins the seat. Crack his base across districts (or draw his home into a
party stronghold) → he's on the ballot at home but diluted below plurality, and his support
elsewhere is off-ballot → he wins nothing.** The player's lines alone decide his fate.

## Key decisions (advisor-vetted, two passes)

### 1. Extend the pipeline to author independents (Option A) — *this PR*
The pipeline could not author an independent: `spec-types.ts PartySpec` has no
`independent`/`home`, and `assembler.ts` (lines 84–89) explicitly field-picks
`id/name/abbreviation/color/candidates` (no spread), so those keys would be dropped. Two paths:
- **A — extend the pipeline** (`PartySpec += independent?/home?`; assembler pass-through; a
  round-trip test). Spec fully generates the JSON; no drift.
- **B — hand-add `independent`/`home` to the generated JSON.** Zero pipeline change but bakes in
  permanent regen drift — the exact hazard `project_scenario_generation_reality` warns about.

**Chosen: A, in this PR.** A pipeline feature with zero consumers isn't independently shippable;
this tutorial is its first and only consumer, so they're comingled by definition (the exception
`feedback_focused_prs` carves out). Completes GAME-118's authoring story.

### 2. Success gate: `seat_count dhalsim >= 1` objective (not T5-style legality-only)
Winning the tutorial **requires electing Dhalsim**, so the player must actually exercise the new
mechanic — stronger teaching than hoping they notice an emergent outcome. Still AC-#5-compatible:
the losing (cracked) map stays **legal and reachable**, it just doesn't complete the objective.
This is a deliberate deviation from the series' emergent philosophy (T5) → **flagged explicitly
in the user's eyeball ask** so they can veto it back to legality-only.

Verified the gate is sound end-to-end:
- `election.ts:107–111` counts an independent winner into `seatsByParty` (unit-tested:
  `election_test.ts:358` "I holds exactly one seat").
- `evaluate.ts:234` reads `seatsByParty[c.party] ?? 0` — robust to a non-major.
- `panels.ts:88` renders an independent **winner** with a full winner badge (no filtering);
  breakdown marks `⌂ Dhalsim` in-home / `(not on ballot)` elsewhere (80–82) + footnote (115–118).
- `main.ts:761–763` derives `enforceBalance` purely from the presence of a `population_balance`
  criterion — adding a `seat_count` criterion does not disturb the submit gate.
- Metrics survive an independent win: `evaluate.ts:287–292` EG `else` branch ("third-party
  winner → both majors' two-party votes wasted"); mean-median is share-based + two-party
  normalized. My memory's "third-party-WIN branch untested" is about *coverage*, not
  correctness — the winnability e2e closes that coverage gap end-to-end.

### 3. Map design: uniform population, q-column WIN vs r-band LOSE
- **Geometry:** `hex_axial` `hex_circle` radius 5 (91 precincts), 3 districts. **No terrain** —
  a uniform population field so balance never *forces* a particular map (advisor's point;
  terrain's riverside 1.3× would bias a column heavy). Visual texture is an eyeball-time
  refinement, added only if it survives a balance re-check.
- **Base geometry = eastern q-strip, not a `near/within` disk.** A disk cracked by horizontal
  bands can leave the home band still Dhalsim-majority (its central slice is his densest turf);
  an eastern `q_gte` strip cracked by bands dilutes cleanly (thin eastern sliver vs long western
  body). `q_gte`/`q_lte` are supported filters (`demographics-stage.ts:13–14`).
- **Parties (declaration order fixes the two-party majors at slots 0/1):**
  - slot 0 **Ken** (major, blue `#2166ac`) — GAME-116 *primary*, carries the jitter; leads WEST.
  - slot 1 **Ryu** (major, purple `#7b35a8`) — leads CENTER.
  - slot 2 **Dhalsim** (INDEPENDENT, teal `#2a9d8f`, `home {q:3,r:-1}`) — leads EAST.
  - All three hues are cool → stay distinct through the lean view's contested-precinct paling
    (warm orange/gold collapse; the bug fixed in GAME-120).
- **Zones (first-match; GAME-116 weights sum to 1.0 with the primary → realized literally):**
  - `west`  `q_lte -2`  `{ken .52, ryu .38, dhalsim .10}` → Ken leads.
  - `east`  `q_gte  2`  `{ken .30, ryu .22, dhalsim .48}` → Dhalsim leads.
  - `hollow_edge`/`center` default `{ken .30, ryu .50, dhalsim .20}` → Ryu leads.
- **Candidates (GAME-117):** majors field three each (flavour); Dhalsim runs the same person in
  every district slot (`[Dhalsim, Dhalsim, Dhalsim]`) so his badge always reads "Dhalsim"
  regardless of which district number his home lands in.

## Feasibility proof — PROVEN against generated JSON (GAME-120 rigor)

Verified with a faithful re-implementation of election.ts (weighted shares + independent
home-eligibility) + BFS contiguity over real axial-hex adjacency, on the actual jittered
`tutorial-006.json` (91 precincts, seed 21). All green:

- **WIN = q-column thirds** `q≤−2 | −1..1 | q≥2` → 30 / 31 / 30 precincts (dev −0.7/+1.7/−1.0%),
  each contiguous. **West → Ken +14.8%, Centre → Ryu +20.1%, East/Hollow → Dhalsim +18.0%**
  (home inside, on ballot, share 0.480). → **balance PASS, contiguity PASS, dhalsim seats = 1.**
- **LOSE = r-band thirds** `r≤−2 | −1..1 | r≥2` → 30 / 31 / 30 (dev −0.8/+1.9/−1.1%), each
  contiguous. Home middle band → **Ken +2.6%**, Dhalsim **0.261 (third, ~12pt back)**; off-ballot
  in the other two bands. → **balance PASS, contiguity PASS, dhalsim seats = 0.** A legal map that
  still denies the Hollow its seat (`seat_count` fails) — the AC-#5 foil.
- **Win-basin (fairness of the seat gate) — wide, not a knife-edge.** Dhalsim carries an eastern
  home district `{q ≥ T}` across the whole range T = 3 (0.481) → 2 (0.480, the balanced third) →
  1 (0.411, 75% east) → 0 (0.366, 59% east). He needs only ~>54% of his district from the east
  zone to out-plurality Ryu, and the balanced eastern third is 100% east-zone — so any reasonable
  eastern district a guided player draws wins. No fallback to legality-only needed.

Contiguity of the column/band partitions is also enforced live by the engine's own submit gate in
the winnability e2e (an illegal map would block Submit and fail the test) — proven twice.

## Registration + surfaces
- `campaigns.ts` debug campaign `scenarioIds += "tutorial-006"`.
- `main.ts` `CAMPAIGN_ONLY_SCENARIOS += tutorial-006` (debug-only; never the all-scenarios
  fallback).
- `overlay.ts` `TUTORIAL_006` coach script + `SCRIPTS` registry (`guided: true` honesty): orient
  → Lean (Dhalsim's east base + ⌂ pin) → the lean-vs-ballot beat (paint the Hollow together) →
  Done.
- `game/scenarios/BUILD.bazel` globs `*.json` — no edit for the new JSON.

## Tests
- `e2e/tutorial-006-independent.spec.ts`: **smoke** (loads via the gated debug campaign, ⌂ home
  pin + lean render, no console errors); **winnability** (paint the WIN column map by a legible
  coordinate rule → submit → Dhalsim holds his home seat + criteria pass — first end-to-end
  exercise of the independent-WIN path); **lose foil** (paint the r-band map → Dhalsim 0 seats,
  `seat_count` fails — proves both maps reachable).
- Pipeline: assembler round-trip test (independent/home spec → JSON carries both).
- `bazel test //game/web/...` green locally before push.

## Merge gate
Pipeline + content + **visual** PR → **held for the user's `bazel run //game:serve-local`
eyeball** (`feedback_eyeball_in_dev`). The eyeball ask must (a) call out the seat-gate deviation
for veto, and (b) confirm the *winning* result screen (Dhalsim badge + `seat_count` pass + ⌂
pin), not just a clean load.

## Out of scope
- Terrain/visual texture (eyeball-time refinement only, balance-re-checked).
- Broader "author independents with N>1" — one home-base independent is the ticket.
