---
ticket: GAME-003
phase: 1 — proposal
status: draft — awaiting review
created: 2026-04-25
---

# GAME-003 Tutorial Scenario Sketch / Proposal

This is the Phase 1 written proposal required before Phase 2 JSON authoring begins.
It covers every item in the Phase 1 acceptance checklist. Review this document before
the full `tutorial-001.json` is written.

---

## Fictional State and Region

**State name:** New Texifornia

**Region name:** Millbrook County
*(A mid-sized fictional county — "Millbrook" connotes a working town, a county seat,
nothing loaded. Plausible anywhere in the US.)*

---

## Fictional Parties

| Field | Party A | Party B |
|---|---|---|
| `id` | `"ken"` | `"ryu"` |
| `name` | Ken Party | Ryu Party |
| `abbreviation` | KEN | RYU |

**Rationale:** Street Fighter rivals — memorable, fun, symmetric, and completely
politically unloaded. Neither Ken nor Ryu is the hero or villain. Both are equally
capable of winning. The names carry no policy connotation whatsoever and make it
obvious to the player that partisan mapping to real politics is not the point.
Colors during authoring: gold/amber for Ken, blue/steel for Ryu (Street Fighter
palette reference — to be confirmed at GAME-005 rendering time).

---

## Player Character

The player character has **no name, no gender, no ethnicity** — they are a
fully abstract stand-in. All player-facing text refers to "you" directly.

**Role:** Redistricting coordinator for Millbrook County.

**Motivation:** You have no political agenda. The census just came in, your
supervisor handed you the map software, and there's a deadline. You just need
to draw two legal districts. That's it.

---

## Intro Slides (2 slides)

**Slide 1**

> **Welcome to Redistricting**
>
> Every ten years, after the census, district boundaries get redrawn to reflect
> population changes. Millbrook County just got its new numbers — and someone has
> to draw the lines.
>
> That someone is you.

**Slide 2**

> **Your job is simple (in theory)**
>
> New Texifornia elects State House representatives by district. Your task:
> divide Millbrook County's precincts into two districts with roughly equal
> population.
>
> The county doesn't care which party wins — it just needs a valid map.

---

## Map Screen Objective Text

> Divide Millbrook County into 2 districts with equal population. Every precinct
> must be assigned. Both districts must be contiguous.

---

## Map Shape: ~30 Hex Precincts in Axial Coordinates

**Target:** 30 editable precincts; no context precincts (tutorial is self-contained).

**Layout concept:** A roughly oval county with a denser urban cluster in the center
and sparser rural precincts on the periphery. The map is designed so there are many
valid two-district solutions — the player should discover that line placement is a
choice, not a puzzle with one answer.

**ASCII hex grid sketch** (axial coords q,r; each cell shown as (q,r)):

```
          (-2,-1) (-1,-2)
      (-2, 0) (-1,-1) ( 0,-2)
  (-2, 1) (-1, 0) ( 0,-1) ( 1,-2)
      (-1, 1) ( 0, 0) ( 1,-1) ( 2,-2)
  (-1, 2) ( 0, 1) ( 1, 0) ( 2,-1)
      ( 0, 2) ( 1, 1) ( 2, 0) ( 3,-1)
          ( 1, 2) ( 2, 1) ( 3, 0)
              ( 2, 2) ( 3, 1)
                  ( 3, 2)
```

29 hexes in the diagram above; exact count finalized to 30 during Phase 2 by
adding or trimming one edge precinct.

**Urban core** (higher population density): approximately the 7–9 center hexes
near (0,0), (0,-1), (1,-1), (-1,0), (0,1), (1,0), (-1,1).

**Intended district split:** A northwest-to-southeast cut through the middle of the
county is one natural valid solution, but many others exist. Neither split produces
a partisan surprise — the tutorial's lesson is about geometry and balance, not
outcomes.

---

## Population Design

- Urban core precincts (~8): ~5,000–6,000 each
- Mid-ring precincts (~12): ~3,000–4,000 each
- Outer precincts (~10): ~1,500–2,500 each
- Total region population: approximately 110,000–130,000
- Target per district: ~55,000–65,000
- Population balance rule: ±5%

Population values will be set so that a simple north/south or east/west split both
pass balance — multiple strategies succeed.

---

## Demographic Groups

Each precinct will have **two demographic groups**:

| Group id | `name` | Voting tendency |
|---|---|---|
| `"workers"` | Working-class voters | Leans Ken Party |
| `"professionals"` | Professional-class voters | Leans Ryu Party |

Both groups are present in every precinct; `population_share` varies by precinct to
create the urban/rural gradient. No racial or ethnic labels in the tutorial — VRA
concepts are introduced in a later scenario. The tutorial is about geometry and
population, not identity.

`vote_shares` will be set so that neutral splits produce roughly balanced results —
no partisan advantage to any particular map shape. This reinforces the lesson that
the tutorial is about mechanics, not outcomes.

---

## Success Criteria

### Required (must pass to complete scenario)

1. **`district_count`** — both districts are non-empty; all 30 precincts are assigned.
   - Player-facing text: *"Every precinct is assigned to a district, and both
     districts are in use."*

2. **`population_balance`** — both districts within ±5% of target population.
   - Player-facing text: *"Both districts have roughly equal population (within 5%)."*

### Optional (achievement, not required to pass)

3. **`compactness`** — both districts are reasonably compact (no extreme salamander
   shapes). Threshold: TBD in Phase 2 (likely Polsby-Popper ≥ 0.35 or fraction-kept ≥ 0.50).
   - Player-facing text: *"Both districts have compact, reasonable shapes."*
   - Optional: a player can pass with a strange-shaped map. The optional criterion
     introduces compactness as a concept without making it a barrier.

---

## No Events

Tutorial has no `events[]`. Demographic events are introduced in a later scenario.
The tutorial is a static baseline.

---

## Lesson Taught

**Primary:** Redistricting is the act of dividing a population into districts with
equal population. The lines matter — different valid maps produce different shapes —
but in this scenario, there is no politically "correct" answer. The player learns:
what a precinct is, how to assign precincts to districts, what contiguity means,
and what population balance means.

**No partisan angle.** Winnable many ways. The optional compactness criterion
introduces the concept of a geometric fairness standard without asserting which rule
is correct or best.

**Tone:** Bureaucratic, matter-of-fact, no drama. You have a job. Do the job.

---

## Open Questions for Review

1. **Party colors:** Gold/amber for Ken Party, blue/steel for Ryu Party is proposed.
   To be confirmed before GAME-005 rendering work begins.

2. **Compactness threshold:** Exact numeric threshold for the optional criterion will
   be determined during Phase 2 authoring, once precinct positions are finalized.

3. **Slide images:** The scenario format ADR notes that `Slide.image` asset resolution
   is an open question (OQ4). Tutorial slides are proposed as text-only to avoid
   blocking. Confirm before Phase 2.

4. **County overlay:** All precincts share `county_id: "millbrook"` (one county, one
   scenario). The county border overlay will have nothing to draw in tutorial. Confirm
   renderer handles the single-county case gracefully — this should be verified in GAME-005.

---

## Phase 2 Checklist Preview

Once this proposal is approved, Phase 2 will produce:

- `game/scenarios/tutorial-001.json` — valid scenario JSON
- Passes `loadScenario()` validator with no errors
- `format_version: "1"`, `election_type: "state_house"`
- 30 hex precincts in axial coordinates, all `editable: true`
- 2 demographic groups per precinct; `vote_shares` sum to 1.0 for both parties;
  `population_share` sums to 1.0 per precinct
- `initial_district_id: null` on all precincts (player draws from scratch)
- No `events[]`
- 2 required success criteria + 1 optional compactness criterion
- Narrative: fully-abstract player, 2 intro slides, map objective text
