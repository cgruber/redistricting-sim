---
date: 2026-04-24
status: accepted
---

# ADR: Demographic Group Model and Voter Eligibility Architecture

## Status

Accepted

## Context

During design discussion of the election simulation architecture, a need emerged to
model demographic subpopulations with sufficient fidelity to support:

- Bloc voting analysis and VRA compliance checks
- Turnout variation across demographic groups
- Voter eligibility distinctions (citizenship, age) without implying that any demographic
  dimension is inherently eligibility-restricting
- Educational display of population vs. voter-eligible population
- Counterfactual analysis ("what if this group could vote?")
- Future scenario extensibility without mandating a fixed demographic vocabulary

This ADR records the resulting design decisions for the demographic group model and
the voter eligibility architecture.

## Decisions

### 1. Groups are named flat simulation units

Each precinct's demographic data is a set of named groups. A group represents a
population segment that votes coherently — it is the atomic unit for simulation
purposes. Groups are not derived from a fixed dimensional vocabulary; they are
named strings defined by the scenario.

```
group: {
  id: GroupId            // opaque string; scenario-defined
  population_share: float  // fraction of precinct total population [0, 1]
  vote_shares: Map<PartyId, float>  // required for ALL groups, including ineligible
  turnout_rate: float    // fraction of eligible group that votes [0, 1]
}
```

This model handles: race × partisanship, age × turnout, citizenship × eligibility,
or any other combination the scenario designer needs. It avoids pre-committing to
any demographic vocabulary at the engine level.

### 2. Scenario-level dimensional schema with completeness constraint

A scenario may optionally declare a dimensional schema describing the axes along
which its groups are defined:

```
scenario.group_schema:
  dimensions:
    race: [White, Latino, Black]
    citizenship: [citizen, non_citizen]
```

If a dimensional schema is declared, the completeness constraint applies:

- Every group must declare a value for every declared dimension
- Every combination of dimension values must exist as a group in every precinct,
  even if that combination has `population_share: 0`

This constraint ensures filter coherence in the UI (filtering by any dimension
value always covers the full population) and enforces neutral treatment by
construction — if citizenship is modeled, it must be modeled for all groups.
A race-only scenario with no citizenship dimension never implies that race
affects voter eligibility.

### 3. Voter eligibility is derived from scenario-level eligibility rules

Voter eligibility is NOT a field on groups. It is derived by the engine from
eligibility rules declared in the scenario schema:

```
scenario.group_schema:
  eligibility_rules:
    - { dimension: citizenship, value: non_citizen, voter_eligible: false }
    - { dimension: age, value: under_18, voter_eligible: false }
```

A group's voter eligibility is the conjunction of its dimension values' eligibility
annotations. Groups with no eligibility-restricting dimension values are fully
voter-eligible by default.

Scenarios that declare no dimensional schema and no eligibility rules treat all
groups as fully voter-eligible. The concept of voter eligibility simply does not
appear in such scenarios' data — no field, no default, no implication.

### 4. The engine has no dimension vocabulary

Dimension names and values are open strings. The engine does not know that `race`
is a legally protected class, that `citizenship` has specific legal meaning in the
US, or that `hive_affiliation` is science fiction. The engine runs the simulation
faithfully regardless of what the dimensions mean.

The eligibility rules system does not restrict which dimensions may carry eligibility
annotations. A scenario may declare `race: Black, voter_eligible: false` — modeling
historical voter suppression or a dystopian scenario. The engine executes it without
comment. Content guidance (warnings, disclaimers, editorial policy) is out of scope
for the simulation engine.

This decision is deliberate. The game's educational value depends on the simulator
being an honest model. Restricting what the engine can represent would:
- Prevent legitimate historical suppression scenarios
- Prevent counterfactual analysis (e.g., "what if permanent residents could vote?")
- Be circumventable by anyone using different dimension names
- Encode the engine's authors' political/legal views into what is supposed to be a
  neutral simulation substrate

### 5. Vote shares required for all groups, including ineligible ones

Ineligible groups (e.g., `citizenship: non_citizen`, `age: under_18`) still require
vote shares in the scenario data. Rationale:

- **Display rollup**: when the UI shows population without an eligibility filter,
  ineligible groups contribute to demographic display correctly
- **Counterfactual analysis**: "what would happen if this group could vote?" requires
  the vote share data to be present
- **Data integrity**: requiring vote shares for ineligible groups forces scenario
  authors to confront what they're claiming about those groups' political preferences
- **Consistency**: uniform data requirements make scenario data easier to validate
  and audit

Authoring tools will provide sensible defaults for ineligible-group vote shares
(e.g., inherit from a regional baseline) to reduce authoring burden.

### 6. Content guidance lives in the authoring tool, not the engine

The game's scenario authoring tool (post-v1) is the appropriate place for content
guidance. The tool can:

- Surface warnings when eligibility rules are applied to dimensions that are not
  factual eligibility criteria (age, citizenship, registration status)
- Provide informational text about legal/ethical considerations
- Display pre-populated dimension pickers with common demographic categories

The tool may special-case specific dimension names it recognizes. This is
the tool's business — not the engine's. The tool's guidance is advisory, not
prohibitive; scenario authors can proceed past any warning.

### 7. Voter weight calculation

The engine derives voter weight per group as:

```
voter_weight(group) =
  population_share
  × voter_eligible(group, eligibility_rules)   // 1.0 or 0.0
  × turnout_rate
```

For VRA analysis, the engine can also compute CVAP-equivalent denominators using
the citizenship dimension if present. No special field is needed — citizenship-based
eligibility rules already encode the information.

## Consequences

**Scenario data format**: Groups are a flat named list. Dimensional schema is
optional. If present, completeness constraint applies: all dimension-value
combinations must exist in every precinct (zero population allowed).

**Election simulation API**: Engine derives voter eligibility from scenario's
`eligibility_rules`. Groups have no `voter_eligible` field.

**VRA risk calculation**: Uses CVAP-equivalent denominator if citizenship dimension
is present; falls back to full population if not. See election simulation ADR for
VRA risk threshold definition.

**Authoring tool (post-v1)**: Content guidance for eligibility rules is the tool's
responsibility. The engine takes no position.

**Legal/disclaimer research**: A separate inquiry is needed into whether omitting
warnings for unrecognized dimension names that carry eligibility restrictions could
constitute accidental endorsement of discriminatory practices. See LEGAL-001.

## References

Election simulation ADR: `thoughts/shared/decisions/2026-04-24-election-simulation-architecture.md`
Legal/disclaimer research ticket: `thoughts/shared/tickets/LEGAL-001-content-presentation-risks.md`
