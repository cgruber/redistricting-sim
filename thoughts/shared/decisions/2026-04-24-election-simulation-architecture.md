---
date: 2026-04-24
status: accepted
---

# ADR: Election Simulation Architecture — Demographic Events, N-Party Shares, Drift

## Status

Accepted

## Context

During review of the election simulation research (see
`thoughts/shared/research/2026-04-24-election-simulation-and-evaluation-metrics.md`),
a design discussion surfaced several architectural decisions that go beyond what the
research document covers. These decisions affect the scenario data format, the election
simulation engine, and the scenario sequencing model. They are recorded here before
implementation begins.

The project owner has an anarchist perspective on electoral systems and a particular
concern that structurally suppressed viewpoints (3rd parties, minority coalitions) be
representable in the model even if FPTP structurally prevents them from winning. This
is a design value, not advocacy — the game is educational and neutral. It informs the
decision to use demographic events rather than partisan labels, and to support N-party
vote shares from the start.

## Decisions

### 1. Deterministic core; variance as designed scenario events

The election simulation is deterministic for all v1 scenarios. Fixed precinct
partisanship + fixed turnout + exact outcomes. This preserves the tight causal loop
required for teaching structural effects: "you drew it this way, you got this outcome."

Variance (waves, shocks) is introduced only as explicit, designed scenario events —
not as ambient noise on every simulation run. A scenario event produces a deterministic
outcome given its parameters. The player sees the same result each time they try the
same map under the same event. This makes success criteria clean and prevents the
lesson from being obscured by luck.

Ensemble comparison (showing a player's map against a distribution of randomly drawn
valid maps) is deferred to v2 as a read-only analysis layer — it does not affect
gameplay or success criteria.

### 2. Waves expressed as demographic events, not partisan labels

Scenario events (waves, shocks, mobilizations) are expressed as changes to demographic
parameters — not as "red wave" or "blue wave." The partisan electoral consequence is
always *derived* from the demographic event, never assumed.

Three event types:

```
{ type: "turnout_shift",    group: GroupId, magnitude: float }   // e.g. +0.15 for Black voters
{ type: "vote_share_shift", group: GroupId, party: PartyId, delta: float }  // e.g. -0.08 for white women → Party A
{ type: "population_shift", precinct_filter: Filter, group: GroupId, delta: float }  // demographic composition change
```

`magnitude` and `delta` apply to the group's baseline value for this scenario.
`precinct_filter` can target a region (e.g., urban precincts only).

This approach:
- Avoids encoding a two-party binary into wave mechanics
- Allows events like "surge in Black voter turnout," "drop in Latino Party A support,"
  "young voter mobilization" to be expressed directly
- Makes the connection between demographic groups and electoral outcomes legible to players
- Generalizes to any demographic dimension without special-casing parties

### 3. N-party vote shares from the start

Vote shares per demographic group are not constrained to two parties. Each group has a
`vote_shares` map of `PartyId → float`, summing to 1.0. The election simulation uses
plurality-wins (FPTP) across however many parties are defined.

In v1, all scenarios use two parties. But the architecture supports N parties, enabling:
- 3rd-party spoiler effects (Party A loses 12 points of young voters to Party C; Party C
  wins nothing but Party A loses previously safe districts)
- Independent candidates eating into a coalition
- Future scenarios exploring the spoiler effect and FPTP's structural suppression of
  third parties — without requiring 3rd party wins, just making the effect visible

This is a design value: structurally suppressed viewpoints should be representable in
the model, even if FPTP prevents them from winning seats. The partisan outcome is
derived from the data, not assumed.

### 4. Precinct demographic data is mutable scenario state

Precinct demographics are not baked-in constants. Each scenario has a baseline
demographic configuration. Scenario events are *diffs* applied to that configuration.
The election simulation always recomputes from the current demographic state.

This means:
- Waves within a scenario change the demographic state for that simulation run
- Demographic drift between scenarios is a permanent transition to a new baseline
- The same scenario logic works for both — the difference is persistence

### 5. Demographic drift as inter-scenario transition

Demographic change between scenarios is represented as a visual/narrative transition
(not a separate playable scenario). Between scenarios, the player sees: "10 years have
passed. Here's what changed in the region." The filters animate to show shifts in
partisan lean, demographic composition, etc. Then the player is handed the new
baseline to draw districts for.

This teaches:
- Why redistricting happens (census/demographic change triggers mandatory redraw)
- That a "good" gerrymander can become obsolete as populations shift
- The connection between demographic change and electoral outcome

The transition is a curtain between acts, not a level. It can be as light as a
10-second animation with a paragraph of narrative context. Scenario 11 ("After the
Boom") in the vision is a full playable scenario about this; the transition mechanism
is a lighter version used between any two scenarios where the region has changed.

### 6. Scenario data format must include first-class demographic events

The scenario data format (to be defined before the evaluation engine is built) must
treat demographic events as first-class objects alongside success criteria, not as
scenario-specific code. This enables:
- Pre-built scenario events to be defined in data
- Future player-authored scenarios (post-v1) to include their own demographic events
- Consistent evaluation engine that operates on events without special cases

## Consequences

**Scenario data format**: Must include a `baseline_demographics` configuration and
an `events[]` array before the evaluation engine is built. This is the gate before
implementation of the simulation layer.

**Election simulation API**: Takes `(scenarioState, events[])` → `ElectionResult`.
The simulation function is pure: same inputs → same outputs. Events modify state
before passing to simulation; the simulation itself has no randomness in v1.

**Party model**: `PartyId` is a string, not an enum. Parties are defined per-scenario.
Vote shares are `Map<PartyId, float>`. The plurality-wins rule operates over the map.
No hardcoded "Party A / Party B" anywhere in simulation logic.

**Architectural flag for evaluation engine**: Do not begin building the evaluation
engine until the scenario data format spec is written and reviewed. The format decision
is the dependency.
