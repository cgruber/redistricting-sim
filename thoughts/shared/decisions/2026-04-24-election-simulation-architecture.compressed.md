<!--COMPRESSED v1; source:2026-04-24-election-simulation-architecture.md-->
§META
date:2026-04-24 status:accepted
topic:election-simulation-architecture — demographic events, N-party shares, drift

§CONTEXT
Post-research design discussion; decisions beyond what research doc covers.
Owner value: structurally suppressed viewpoints (3rd parties, minority coalitions)
must be representable even if FPTP prevents wins → drives demographic-event model
and N-party shares. Educational/neutral stance unchanged.

§DECISIONS

1. Deterministic core; variance as designed events
  v1: fixed precinct partisanship+turnout; exact outcomes; tight causal loop
  Variance: explicit designed scenario events only — not ambient noise
  Each event → deterministic outcome (same map+event = same result every time)
  Ensemble comparison (map vs. distribution of random valid maps): v2, read-only layer; runs against same deterministic core (see scenario-data-format spec Purpose section)

2. Waves = demographic events, not partisan labels
  Partisan consequence always DERIVED from demographic event, never assumed
  Event types:
    turnout_shift:    {group, magnitude}          // +0.15 for Black voters
    vote_share_shift: {group, party, delta}        // -0.08 white women → Party A
    population_shift: {precinct_filter, group, delta}
  Enables: surge in Black turnout | Latino Party A drop | young voter mobilization
  Generalises to any demographic dimension; no two-party binary encoded in wave mechanics

3. N-party vote shares
  vote_shares: Map<PartyId, float> summing to 1.0 per group; plurality-wins over map
  v1: 2 parties in scenarios; architecture supports N
  Enables: 3rd-party spoiler effects visible without 3rd-party wins
  No hardcoded "Party A / Party B" in simulation logic; PartyId=string; parties per-scenario

4. Precinct demographics = mutable scenario state
  Baseline demographic config per scenario; events = diffs applied to config
  Simulation always recomputes from current state
  Within-scenario wave: transient diff | inter-scenario drift: permanent new baseline

5. Demographic drift as inter-scenario transition (not a scenario)
  Between scenarios: animated curtain showing regional change over time
  Teaches: why redistricting happens; gerrymandered maps become obsolete
  Light implementation: 10s animation + narrative paragraph
  Distinct from Scenario 11 (After the Boom) which is a full playable level

6. Scenario format must include first-class demographic events
  events[] array alongside success criteria; in data not code
  Prerequisite for evaluation engine build

§CONSEQUENCES
Scenario format: needs baseline_demographics + events[] BEFORE evaluation engine starts
Simulation API: (scenarioState, events[]) → ElectionResult; pure function; no v1 randomness
Party model: PartyId=string; parties defined per-scenario; no enum
GATE: do not build evaluation engine until scenario data format spec written+reviewed

§REFS
Research: thoughts/shared/research/2026-04-24-election-simulation-and-evaluation-metrics.md
Game vision: thoughts/shared/vision/game-vision.compressed.md
