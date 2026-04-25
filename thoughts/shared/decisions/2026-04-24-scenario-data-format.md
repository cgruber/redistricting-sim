---
date: 2026-04-24
status: draft — awaiting review
---

# Spec: Scenario Data Format

## Status

Draft. This document is the gate before simulation implementation — the evaluation
engine must not be built until this spec is reviewed and accepted.

## Purpose

Defines the canonical data format for a redistricting scenario. The format serves:

- Pre-built scenario authoring (hand-authored JSON/YAML)
- The simulation and evaluation engine (reads this directly)
- Future player-authored scenarios and community sharing (post-v1)
- Scenario persistence / export

All data is self-contained in one document per scenario. No external lookups at
runtime. A scenario file is deterministic: given the same file and the same player
map, the simulation always produces the same result.

## Conventions

- **Format**: JSON canonical; YAML acceptable for hand-authoring (must round-trip
  cleanly to JSON). All field names: `snake_case`.
- **Identifiers**: opaque strings. `ScenarioId`, `PrecinctId`, `DistrictId`,
  `PartyId`, `GroupId`, `RegionId` are all `string`. Identifiers must be unique
  within their scope (e.g., `PrecinctId` unique within scenario).
- **Floats**: all fractional values are `[0.0, 1.0]` unless stated otherwise.
  Populations are non-negative integers.
- **Format version**: `"format_version": "1"` in every scenario file. Parser
  must reject unknown versions.

---

## Type Definitions

### Top-level: `Scenario`

```typescript
interface Scenario {
  format_version: "1"
  id:             ScenarioId
  title:          string
  election_type:  ElectionType        // "congressional" | "state_senate" | "state_house"

  region:         RegionSpec
  geometry:       GeometrySpec
  parties:        Party[]             // parties active in this scenario; min 2

  districts:      District[]          // defines the target district set
  precincts:      Precinct[]          // editable + context precincts

  group_schema?:  GroupSchema         // optional dimensional schema (see Demographic Groups)

  events:         DemographicEvent[]  // fires at evaluation time
  rules:          ScenarioRules
  success_criteria: SuccessCriterion[]

  narrative:      Narrative
  state_context?: StateContext        // pre-computed results for other regions
}
```

---

### `RegionSpec`

```typescript
interface RegionSpec {
  state_id:   string    // e.g., "new_texansifornia"
  region_id:  string    // e.g., "valley_county"
  name:       string    // display name
}
```

---

### `GeometrySpec`

Specifies the coordinate system used by precinct positions. Adjacency is derived
from coordinates for regular tilings; explicit neighbor lists are required for
irregular geometries.

```typescript
type GeometrySpec =
  | { type: "hex_axial" }
    // Precincts use axial hex coordinates { q, r }.
    // All 6 neighbors are derived: (q±1,r), (q,r±1), (q±1,r∓1).
    // precinct.neighbors must be absent or empty.

  | { type: "custom" }
    // Precincts use { x, y } cartesian coordinates (for rendering position only).
    // precinct.neighbors MUST be provided — adjacency is not derivable.
```

For v1, all scenarios use `"hex_axial"`. `"custom"` is defined now to avoid
a format-breaking change when organic map shapes are introduced.

---

### `Party`

```typescript
interface Party {
  id:           PartyId   // referenced in vote_shares, events, criteria
  name:         string    // e.g., "Red Party"
  abbreviation: string    // e.g., "R"; used in UI labels
}
```

Parties are entirely fictional. No mapping to real-world parties. All scenarios
use fictional names. Minimum two parties; N-party supported.

---

### `District`

```typescript
interface District {
  id:           DistrictId
  name?:        string    // display name, e.g., "District 3"
  description?: string    // optional flavor text
}
```

The number of districts in `districts[]` determines how many the player must fill.
Target population per district is derived: `total_region_population / districts.length`.
Population balance tolerance is declared in `ScenarioRules.population_tolerance`.

---

### `Precinct`

Note: the map geography ADR declared `neighboring_context_precincts[]` as a separate array. This spec
merges editable and context precincts into a single `precincts[]` array, distinguished by the `editable`
boolean. This is a deliberate simplification — a flat list is easier to validate and index than two parallel
arrays. The semantic distinction (editable vs. context) is preserved via the flag.

```typescript
interface Precinct {
  id:                  PrecinctId
  editable:            boolean     // false = neighboring context precinct (read-only)
  county_id?:          string      // display only; used to draw county border overlay

  // Geometry
  position:            HexAxialPosition | CartesianPosition
  neighbors?:          PrecinctId[]  // required for geometry.type == "custom"; omit for hex_axial

  // Population
  total_population:    number      // non-negative integer; sum of all group populations

  // Demographics
  demographic_groups:  DemographicGroup[]  // population_shares must sum to 1.0

  // Starting state
  initial_district_id?: DistrictId | null
    // If provided: precinct begins assigned to this district.
    // If absent/null: precinct is unassigned at scenario start.
    // When all precincts are absent/null, the game assigns all to districts[0]
    // as the starting state — player begins with one giant district and carves it up.
    // See: Unassigned Precinct Handling.
    //
    // Note: the map geography ADR specifies `pc.assignments: Map<ElectionType, DistrictId>` as the
    // runtime data structure. The scenario format uses a bare `initial_district_id` because each
    // scenario declares exactly one `election_type`; there is no ambiguity about which assignment
    // layer this initialises. The runtime engine maps `initial_district_id` into the appropriate
    // slot of the `assignments` Map when loading the scenario.

  // Optional display metadata
  name?: string         // label for tooltips, e.g., "Riverside Precinct"
  tags?: string[]       // for precinct filtering in events, e.g., ["urban", "valley"]
}

interface HexAxialPosition { q: number; r: number }
interface CartesianPosition { x: number; y: number }
```

**Context precincts** (`editable: false`) participate in population balance and
simulation but are not editable. They are first-class in the precinct list; the
renderer distinguishes them visually.

---

### `DemographicGroup`

```typescript
interface DemographicGroup {
  id:               GroupId         // opaque string; unique within precinct
  population_share: number          // fraction of precinct total_population [0, 1]
  vote_shares:      Record<PartyId, number>  // must sum to 1.0; all parties present
  turnout_rate:     number          // fraction of eligible pop that votes [0, 1]

  // Required if scenario declares a group_schema:
  dimensions?:      Record<DimensionName, DimensionValue>
    // Must supply a value for every dimension declared in group_schema.dimensions
}
```

`vote_shares` must include an entry for every `PartyId` declared in `scenario.parties`.

**Voter eligibility** is NOT a field on groups. It is derived from `group_schema.eligibility_rules`
(see below). Groups with no applicable eligibility rule are 100% voter-eligible.

**Voter weight** used in simulation:
```
voter_weight(group) = total_population × population_share
                    × voter_eligible(group)          // 1.0 or 0.0
                    × turnout_rate
```

---

### `GroupSchema` (optional)

```typescript
interface GroupSchema {
  dimensions:       Record<DimensionName, DimensionValue[]>
  eligibility_rules: EligibilityRule[]
}

interface EligibilityRule {
  dimension:     DimensionName
  value:         DimensionValue
  voter_eligible: false   // only false rules need be declared; absent = eligible
}
```

**Completeness constraint**: if `group_schema` is declared, every precinct must
contain one group for every combination of declared dimension values, even if
`population_share: 0`. This enforces filter coherence in the UI — filtering by
any dimension value covers the full population — and symmetric modeling across
groups (if citizenship is modeled for Latinos, it must be modeled for all groups).

Scenarios that do not need dimensional filtering omit `group_schema` entirely.
Their groups are flat named segments; no completeness constraint applies.

---

### `DemographicEvent`

Events fire at **evaluation time** (when the player runs "Test"). They are applied
as diffs to the baseline demographic state before the simulation runs. The player
draws their map knowing (from scenario narrative) that an event will occur; their
job is to draw a map that performs well under it.

```typescript
type DemographicEvent =
  | {
      type:         "turnout_shift"
      id:           EventId
      description?: string             // human-readable; for authoring/debugging
      group_filter: GroupFilter
      magnitude:    number             // delta applied to group.turnout_rate; clamped [0,1]
    }
  | {
      type:         "vote_share_shift"
      id:           EventId
      description?: string
      group_filter: GroupFilter
      party:        PartyId
      delta:        number             // delta applied to vote_shares[party]; shares renormalized
    }
  | {
      type:         "population_shift"
      id:           EventId
      description?: string
      precinct_filter: PrecinctFilter  // which precincts affected
      group_filter: GroupFilter        // which groups within those precincts
      delta:        number             // delta to population_share; shares renormalized
    }
```

`GroupFilter` and `PrecinctFilter`:

```typescript
type GroupFilter =
  | { group_ids: GroupId[] }                                    // explicit list
  | { dimension: DimensionName; value: DimensionValue }         // requires group_schema

type PrecinctFilter =
  | { precinct_ids: PrecinctId[] }                              // explicit list
  | { tags: string[] }                                          // precincts with ALL tags
  | { editable_only: true }                                     // only editable precincts
```

Multiple events may be declared. They are applied in order before simulation runs.
The simulation sees the post-event demographic state.

---

### `ScenarioRules`

```typescript
interface ScenarioRules {
  population_tolerance:    number
  contiguity:              "required" | "preferred" | "allowed"
    // "required": non-contiguous districts are a hard error (default)
    // "preferred": non-contiguous triggers a warning but is not an error
    // "allowed": non-contiguous is fully permitted (island scenarios, etc.)
  compactness_threshold?:  number    // min Fraction Kept score; absent = not enforced as rule
                                     // (compactness may still be evaluated as a metric)
}
```

Population balance and contiguity are always evaluated as validity checks.
`contiguity: "allowed"` is unusual but supported (e.g., island archipelago scenario).

---

### `SuccessCriterion`

```typescript
interface SuccessCriterion {
  id:          CriterionId
  required:    boolean     // true = must pass to complete scenario; false = achievement/optional
  description: string      // shown to player in Test sequence and Feedback screen
  criterion:   Criterion
}

type Criterion =
  | { type: "seat_count";         party: PartyId; operator: CompareOp; count: number }
  | { type: "majority_minority";  group_filter: GroupFilter; min_cvap_share: number;
                                  min_districts: number }
                                  // at least min_districts must have ≥ min_cvap_share CVAP
  | { type: "efficiency_gap";     operator: CompareOp; threshold: number }
  | { type: "mean_median";        party: PartyId; operator: CompareOp; threshold: number }
  | { type: "compactness";        operator: CompareOp; threshold: number }   // Fraction Kept
  | { type: "safe_seats";         party: PartyId; margin: number; min_count: number }
                                  // min_count districts where party wins by ≥ margin
  | { type: "competitive_seats";  margin: number; min_count: number }
                                  // min_count districts where winning margin ≤ margin
  | { type: "population_balance" }
                                  // all districts within rules.population_tolerance
                                  // (redundant if rules enforce it; included for
                                  //  explicit display in Test sequence)

type CompareOp = "lt" | "lte" | "eq" | "gte" | "gt"
```

`majority_minority` uses CVAP if a citizenship dimension is present in
`group_schema`; falls back to VAP otherwise. The criterion description should
tell the player which is being evaluated.

---

### `Narrative`

```typescript
interface Narrative {
  character: {
    name:       string    // player's character name, e.g., "State Party Chair Rivera"
    role:       string    // one-line role description
    motivation: string    // one-sentence motivation/bias framing
  }

  intro_slides: Slide[]   // shown in ScenarioIntro sequence; ordered
  objective:    string    // brief objective shown on map screen header
  flavor_text?: string    // optional closing flavor for scenario context
}

interface Slide {
  heading?: string
  body:     string        // markdown; rendered in slide panel
  image?:   string        // asset reference (relative path or asset key); optional
}
```

---

### `StateContext`

Pre-computed election results for all regions outside the player's scenario region.
Used for state-level aggregation (displaying statewide seat totals as the player
draws).

```typescript
interface StateContext {
  state_name:             string
  total_districts:        number                      // statewide total including this region
  other_region_results:   Record<RegionId, RegionResult>
}

interface RegionResult {
  district_count: number
  seat_totals:    Record<PartyId, number>             // seats won per party in this region
}
```

The player's region results are computed live. State totals = live results +
sum(other_region_results).

---

## Validation Invariants

A scenario is valid if and only if:

1. All `PartyId` references in `vote_shares`, `events`, and `success_criteria` exist
   in `scenario.parties`.
2. All `DistrictId` references in `initial_district_id` exist in `scenario.districts`.
3. All `GroupId` references in `events` and `success_criteria` exist in at least
   one precinct's `demographic_groups`.
4. Every context precinct (`editable: false`) must have `initial_district_id` set to
   a non-null `DistrictId`. Auto-fill to `districts[0]` applies only to editable
   precincts.
5. For every precinct: `sum(demographic_groups[*].population_share) == 1.0` (±ε).
6. For every group: `sum(vote_shares[*]) == 1.0` (±ε); all `scenario.parties` present.
7. If `group_schema` declared: every precinct contains one group per combination of
   dimension values; every group declares a value for every dimension.
8. For `geometry.type == "hex_axial"`: no precinct has a `neighbors` field.
9. For `geometry.type == "custom"`: every precinct has a non-empty `neighbors` field;
   adjacency is symmetric (if A lists B as neighbor, B lists A).
10. For `geometry.type == "custom"`: all `PrecinctId` values in `neighbors[]` must
    exist in `scenario.precincts`.
11. `scenario.districts` has at least 2 entries.
12. Every `EventId`, `CriterionId`, `PrecinctId`, `DistrictId`, `GroupId`, `PartyId`
    is unique within the scenario.

---

## Unassigned Precinct Handling

When a scenario provides no `initial_district_id` on any precinct (or all are null),
the game initializes all precincts to `districts[0]`. The player begins with one
giant district and carves it into the required number. This avoids an error state
and gives a natural starting point.

Partial initial assignments (some precincts assigned, others not) are valid — the
unassigned precincts are auto-assigned to `districts[0]`. This covers scenarios
where part of the map is fixed and the player fills in the rest.

If a scenario requires the player to draw from a genuinely blank state (no starting
districts), set `initial_district_id: null` on all precincts — the auto-assign
behavior applies. The scenario's narrative should explain this starting condition.

The scenario's initial assignments are the starting point for the player's session state. The simulation
API `simulate(allPrecincts, assignments, electionType)` receives the *current* assignment map (player's
working state), not the initial map. The runtime engine maintains assignment state separately from the
scenario file; `initial_district_id` is read once at scenario load.

---

## Example Skeleton

A minimal two-district, two-party scenario with one event and one required criterion:

```json
{
  "format_version": "1",
  "id": "tutorial-001",
  "title": "Welcome to New Texansifornia",
  "election_type": "state_house",

  "region": {
    "state_id": "new_texansifornia",
    "region_id": "valley_county",
    "name": "Valley County"
  },

  "geometry": { "type": "hex_axial" },

  "parties": [
    { "id": "red",  "name": "Red Party",  "abbreviation": "R" },
    { "id": "blue", "name": "Blue Party", "abbreviation": "B" }
  ],

  "districts": [
    { "id": "d1", "name": "District 1" },
    { "id": "d2", "name": "District 2" }
  ],

  "precincts": [
    {
      "id": "p001",
      "editable": true,
      "county_id": "north_valley",
      "position": { "q": 0, "r": 0 },
      "total_population": 4200,
      "demographic_groups": [
        {
          "id": "white_voters",
          "population_share": 0.55,
          "vote_shares": { "red": 0.65, "blue": 0.35 },
          "turnout_rate": 0.68
        },
        {
          "id": "latino_voters",
          "population_share": 0.35,
          "vote_shares": { "red": 0.30, "blue": 0.70 },
          "turnout_rate": 0.52
        },
        {
          "id": "black_voters",
          "population_share": 0.10,
          "vote_shares": { "red": 0.10, "blue": 0.90 },
          "turnout_rate": 0.60
        }
      ]
    }
    // ... remaining precincts
  ],

  "events": [
    {
      "type": "turnout_shift",
      "id": "evt-001",
      "description": "Surge in Latino voter mobilization",
      "group_filter": { "group_ids": ["latino_voters"] },
      "magnitude": 0.15
    }
  ],

  "rules": {
    "population_tolerance": 0.05,
    "contiguity": "required"
  },

  "success_criteria": [
    {
      "id": "sc-001",
      "required": true,
      "description": "Draw a valid map with equal population in both districts",
      "criterion": { "type": "population_balance" }
    }
  ],

  "narrative": {
    "character": {
      "name": "Taylor Kim",
      "role": "State House Redistricting Coordinator",
      "motivation": "You just want to draw a legal map. How hard can it be?"
    },
    "intro_slides": [
      {
        "heading": "Welcome to New Texansifornia",
        "body": "The census is in. Valley County gets two state house seats. Your job: draw the lines."
      }
    ],
    "objective": "Draw two districts with roughly equal population."
  }
}
```

---

## Open Questions

1. **CVAP vs VAP in `majority_minority` criterion**: The criterion uses CVAP when
   a citizenship dimension is present. Should the criterion explicitly declare
   which measure to use (`measure: "cvap" | "vap"`) rather than inferring from
   schema? More explicit; better for authoring validation.

2. ~~**Event ordering and interaction**~~: Resolved. Events are applied in
   declaration order (sequential). Scenario authors must be aware that overlapping
   population shifts may produce different results depending on order; this is by
   design and should be documented in authoring guidance.

3. ~~**`state_context` in v1**~~: Resolved. `state_context` is included in the format
   for forward compatibility; v1 renderer may ignore it. No breaking change needed
   when v2 state-level view is implemented.

4. **Narrative asset references**: `Slide.image` references an asset. What is the
   asset resolution strategy? Relative path to a sibling assets directory? A
   named key in a shared asset bundle? Needs a decision before pre-built scenario
   authoring begins.

5. **Partial initial assignment auto-fill**: The spec says unassigned precincts
   auto-fill to `districts[0]`. Should the auto-fill target be configurable
   (`default_district_id` on the scenario)? Or is `districts[0]` always correct?

6. **Scenario versioning / migration**: No migration strategy defined. Format
   version `"1"` is parsed or rejected. Future versions will need a migration path.
   Defer until there is a v2 format requirement.

7. **Context precinct non-editability as a pedagogical simplification**: In
   real-world redistricting, districts frequently cross county/region boundaries
   and adjustments to neighboring-region precincts may be mechanically required to
   satisfy population balance. The spec locks context precincts as read-only, which
   glosses over this. Acceptable for v1 because: (a) `editable: false` is per-precinct
   and a scenario could mark some context precincts editable if the lesson demands it;
   (b) early scenarios are intentionally pedagogically simplified. Worth revisiting
   if campaign scenarios or advanced scenarios require cross-boundary editing fidelity.

8. **Editor tools for blank-start scenarios**: The brush/paint interaction is
   sufficient for reshaping an existing map but is a poor starting point for drawing
   ~300 blank precincts from scratch. Editor needs additional tools before blank-start
   scenarios are playable:
   - Flood-fill from a seed precinct (expand greedily to district boundary)
   - Lasso / region-select then assign
   - Generate valid starting partition (randomize contiguous, population-balanced map)
   These are UI/editor concerns, not format concerns. Track separately when
   approaching editor implementation.
