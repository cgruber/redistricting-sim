---
type: vision
status: draft — awaiting review
created: 2026-04-23
authors: cgruber + claude
last_updated: 2026-04-23
---

# Redistricting Simulator — Game Vision

**Living document.** Updated each sprint after demo feedback, learnings from GES/Architect,
or domain/educational-effectiveness review. Direction changes reviewed with the user before
acting on them.

---

## Educational Goal

Players should finish the game understanding — viscerally, not just intellectually — that
representative democracy is deeply sensitive to how district boundaries are drawn. The same
population, the same votes, dramatically different outcomes depending on who drew the lines
and why. The game teaches through doing: players are asked to *be* the gerrymanderer (and
the reformer, and the demographer) and experience the levers firsthand.

Secondary goal: show that "neutral rules" don't eliminate politics from redistricting —
they constrain it differently. Different neutral rule-sets produce different outcomes.
There is no apolitical map.

This is education, not advocacy. The game presents multiple perspectives — partisan
optimization, racial representation, neutral-rules idealism, incumbency protection — without
declaring one correct. Players who finish the game should have better questions, not
predetermined answers.

A stretch goal (later versions): gesture toward Arrow's impossibility theorem — every
electoral system encodes trade-offs; there is no system that satisfies all fairness
criteria simultaneously. Not as a cynical conclusion but as an invitation to think harder.

---

## Political Neutrality and Framing

The game's credibility depends on being genuinely neutral — not just claiming to be. This
requires operational design decisions, not just a disclaimer.

**Symmetric partisan framing.** Whenever a scenario involves partisan advantage, both
parties get equal treatment in the scenario set. Scenario 2 ("Give the Governor a Win")
can be completed for either party. Packing and cracking scenarios are not associated with
a specific real-world party. Fictional party names (e.g., "Red Party" / "Blue Party") are
used throughout; no mapping to real parties.

**Neutral rules are not presented as The Answer.** Scenarios 7 and 8 show what neutral
rules achieve and what they don't — including that bipartisan-agreed neutral standards
still produce partisan outcomes. The game does not conclude that any one rule-set is
correct. The Arrow's impossibility stretch goal reinforces that there is no system that
satisfies all fairness criteria simultaneously.

**Outcome-first scenario framing.** The game asks "what happens when you do X?" rather
than "X is wrong." The packing/cracking scenarios teach the mechanics — understanding how
these tactics work is the goal, not condemnation.

**About page transparency.** The About page should describe the project's educational
intent, acknowledge that redistricting is politically contested, and link to diverse
secondary resources — academic, journalistic, from multiple political perspectives.
The specific content and framing of the About page is deferred; it deserves its own
review when there is a page to look at.

**Community scenarios as a safety valve.** If the community can submit their own scenarios
— including their own rule proposals — the game becomes less dependent on any single
author's framing. A partisan user can submit a scenario that advocates for their preferred
rules; another can submit the counterargument. The game hosts the conversation, not a
conclusion.

---

## Target Audience

- **Students (secondary+)** learning about US civics, electoral systems, or political geography
- **Engaged adults** who've heard about gerrymandering and want to understand it concretely
- **International observers** curious about the American electoral system and how it compares
  to other countries' redistricting approaches

The game should be accessible without prior knowledge (tutorial/first level covers
everything needed) and rewarding for people who already know a lot (scenario depth,
achievements, edge cases).

---

## Main Menu

```
[ New Game ]      [ Continue ]
[ Custom Level ]  [ Settings ]  [ About ]
```

- **New Game**: starts the scenario sequence from the beginning (or from the last
  unlocked scenario if the player has prior progress)
- **Continue**: resumes where the player left off (visible only if prior progress exists)
- **Custom Level**: full scenario creator — paint populations, set success criteria,
  define rules, build fictional or historically-inspired maps; includes community
  sharing (see §Custom Level and Community Scenarios below)
- **Settings**: accessibility options (colorblind mode, language, motion reduction),
  audio, display
- **About**: project description, credits, educational resources, donation link

**Tutorial** is not a separate menu item — it is baked into the first scenario as an
in-level guided walkthrough. This avoids the common pattern where players skip standalone
tutorials and then feel lost.

---

## Core Game Loop

```
Main Menu
    ↓
Scenario Intro Slide(s)
    ↓
Level (map editing)
    ↓
Test (animated success/failure sequence)
    ↓  pass                    ↓  fail
Success Screen             Feedback + retry
    ↓
Next Level (unlocked)
```

### 1 — Scenario Intro

A slide or short slide sequence that:
- Sets the narrative context ("The governor of [fictional state] has ordered redistricting
  following a census...")
- Describes the specific objective ("Redraw district boundaries so the governor's party
  gains at least one seat")
- Lists the success criteria clearly — required criteria and any optional bonus criteria
- Explains any mechanics specific to this scenario (e.g., "new districts are permitted
  in this scenario")

The first scenario's intro also introduces the game mechanics (what precincts are, how
boundaries work, what the filter views show). Subsequent scenarios assume familiarity and
keep intros shorter.

### 2 — Level (Map Editing)

The main interactive phase. See §Map and Mechanics below.

### 3 — Test

The player submits their district map for evaluation. The test runs through each success
criterion with a short animation:

- Governor reviews and reacts (thumbs up / concerned / veto)
- State legislature votes (cheer / grumble / close vote)
- Relevant lobby groups react (advocacy groups, party orgs, civil rights groups — varies
  by scenario)
- Legal check: does the map satisfy applicable rules? (equal population, contiguity,
  VRA compliance where applicable)
- Optional: supreme court challenge, media reaction, incumbent reactions — flavor
  elements that don't block success but add realism and narrative

Each criterion resolves with a clear visual and short text. Animations are simple and
self-contained — icon-level cutesy reactions, independent of each other. Animated GIFs
or equivalent (short CSS/SVG loops) are sufficient; no complex per-scenario authored
sequences needed. GES to confirm the evaluation model is tractable. If the test fails, the player
sees exactly which criteria were not met and can return to editing with that feedback.

### 4 — Success Screen

On passing:
- Short narrative/animation summarising what happened ("Governor Ramirez signed the new
  map into law. In the next election...")
- Achievement notifications (if triggered)
- "Next Level" button; optionally "Retry for achievements" if the player didn't get all
  optional criteria

### 5 — Retry and Achievements

Players can replay any completed level. Reasons to retry:
- Achieve a passing result a different way ("minimal change" achievement vs. "maximum
  efficiency" achievement)
- Unlock optional/bonus criteria not hit on first pass
- Completionism

Achievement examples (not exhaustive):
- *Surgical Precision* — pass with the fewest precinct moves
- *Packed to the Gills* — achieve extreme packing of one party's voters
- *Efficiency Gap* — achieve a historically notable efficiency gap score
- *Judge-Proof* — pass all legal criteria including optional ones
- *Bipartisan Groans* — have both party lobby groups express dissatisfaction (neutral-rules scenarios)
- *Cats and Dogs* — complete the cats-vs-dogs scenario (see §Scenarios)

---

## Map and Mechanics

### The Map

The playfield is a fictional sub-state **region** — a county, metro area, or similar
geographic unit — divided into **precincts**. Each scenario covers one such region.
The game does not model whole states; redistricting at the state-legislature or
congressional-district level happens within a single region boundary. "Zooming out" to
full-state or multi-state scope is explicitly deferred — it may become relevant for
electoral-system comparison scenarios but is not needed for v1 or the near term.

Precincts are the atomic unit of redistricting: small, fixed-boundary geographic cells
(a stylised grid or organic shapes depending on the scenario's aesthetic). They cannot be
subdivided. Target count is in the hundreds — visually small, like fat pixels whose edges
the player pushes around. The exact count should be calibrated against real regional
examples (see §Open Questions — precinct count research).

Each precinct has metadata:
- Population (total and density)
- Demographic breakdown (race/ethnicity, partisan affiliation, gender, religion)
- Last election result (votes by party, turnout)
- Any scenario-specific data (e.g., recent population change driving the redistricting)

**Districts** are groupings of precincts. District boundaries are the edges between
adjacent precincts assigned to different districts.

A district may consist of multiple **segments** — non-contiguous blobs of precincts
belonging to the same district. Non-contiguous districts are disabled by default and
only enabled for scenarios where they are legally or narratively appropriate.

### Viewing the Map

The default view shows population density as a color overlay. Filter controls let the
player switch the color dimension:
- Population density
- Partisan lean (last election result)
- Any demographic dimension (race/ethnicity, age, etc.)
- District assignment (highlights current district boundaries)

Hovering a precinct shows a tooltip with all metadata. Players can keep a precinct
pinned for comparison while browsing.

District boundary lines are always overlaid on top of whichever color dimension is
active.

### Editing Boundaries

The player edits district boundaries using a **brush/paint interaction**:
- The brush paints precincts into a district; the target district is determined by where
  the brush stroke begins (starting inside district A paints precincts into A)
- Brush size is adjustable — large brush for rough shaping, small brush for fine detail
- The boundary line updates live as precincts are repainted
- Click (or tap) a single precinct for fine-grained single-precinct reassignment

The specific UI motif (cursor brush vs. lasso vs. flood-fill from a boundary) is a
Web Designer + GES decision. The constraint is that bulk editing must not feel like
data entry — players should be able to reshape large areas quickly.

Creating or extending a non-contiguous district segment (when enabled by the scenario):
- Assign precincts to an existing district even if not adjacent to it
- Or create a new district from a selected precinct (only when new districts are permitted)

**Undo/redo** is always available. A "reset to start" option restores the original
scenario boundary.

### Validity Indicators

The UI gives live feedback on validity constraints:
- Population balance: each district's population shown relative to the target (±X%)
- Contiguity warnings: flag if a district becomes non-contiguous (when that's not allowed)
- VRA indicators: if a scenario has VRA requirements, districts at risk are highlighted
- Compactness score: shown when relevant to the scenario's success criteria

---

## Scenarios

### V1 Scenario Set (target: 8–12 scenarios)

The v1 scenarios establish the core educational arc. The sequence moves from "what is
redistricting" through partisan tactics, demographic requirements, and neutral-rules reform
— but the arc should not read as a moral progression from bad to good. Counter-scenarios
and character-perspective framing (see §Scenario Design Principles) are the primary tools
for maintaining genuine neutrality. Each scenario uses a fictional region and population.

| # | Working Title | Objective | Key Lesson |
|---|---|---|---|
| 1 | Welcome to New Texansifornia | Tutorial: draw any valid map | How redistricting works |
| 2 | Give the Governor a Win | Gain 1 seat for the governor's party | Basic partisan gerrymandering |
| 3 | The Packing Problem | Pack opposition into fewest districts | Packing tactic; efficiency gap |
| 4 | Cracking the Opposition | Dilute opposition across many districts | Cracking tactic |
| 5 | A Voice for the Valley | Create a majority-Latino district following population growth | VRA requirements; majority-minority districts |
| 6 | Harden the Map | Maximise safe seats for incumbents; minimise competitive races | Incumbency protection tactic |
| 7 | The Reform Map | Apply a neutral rule-set (compactness + contiguity + equal pop) | What neutral rules achieve — and don't |
| 8 | Both Sides Unhappy | Apply a bipartisan-agreed neutral standard | Why neutral rules don't eliminate politics |
| 9 | Cats vs. Dogs | Ensure the Cat Party dominates the Dog Party | Tone break; reinforces mechanics in absurd context |

One or more additional scenarios (within the 8–12 target) should complicate the
reform narrative — e.g., a neutral rules map that produces worse minority representation
than a deliberately drawn one, or a "good gerrymander" that increased competitiveness.
These are not yet designed; they are a named gap to fill before the scenario set is final.

Stretch v1 / early v2:
| # | Working Title | Notes |
|---|---|---|
| 10 | The Canadian Way | Apply Canada's arms-length electoral commission rules | International comparison; requires domain review |
| 11 | After the Boom | Census-driven redistricting with major population shift | Population change scenario |

**Out of scope for this game** — electoral system comparison (proportional representation,
STV, etc.) does not fit naturally within a district-drawing simulator. These topics may
become a separate game in a series that reuses or extends the engine, but they should not
constrain the design of this one. The PR Country scenario is removed from the list.

### Later Scenarios

- Historically-inspired recreations (famous gerrymanders, with fictional population data)
- Racial polarisation scenarios — VRA Section 2 analysis
- Multi-party scenarios (where a third party has significant presence)
- Player-designed scenarios (once Custom Level UI ships)

### Scenario Design Principles

- No two scenarios should teach the same primary lesson
- At least one scenario should be clearly "silly" — a tone break that decouples learning
  the mechanics from political anxiety
- Each scenario should have at least one surprising or counterintuitive result available
  (an outcome the player didn't expect, which is part of the lesson)
- Optional criteria add depth without blocking completion
- **Character-perspective framing.** Many scenarios cast the player as a specific actor —
  "you are a political operative for Party X," "you are an electoral reform advocate." The
  player inhabits that character's goals and bias for the duration of the scenario. This
  is not endorsement: it is experiential framing that invites the player to notice the
  difference between the character's interests and their own. Scenarios should be
  designed in matched pairs or sets where possible — if one scenario lets you gerrymander
  for Party A, another lets you do the same for Party B.
- **Counter-scenarios.** At least one scenario should demonstrate that neutral rules
  produce outcomes that neutral-rules advocates might find uncomfortable (e.g., worse
  minority representation, accidental incumbency protection). The sequence should not
  leave the player with the conclusion that reform = good, tactics = bad.

---

## Progression

Scenarios are standalone vignettes — no narrative continuity between them in v1. Each
scenario has a different fictional region, cast, and educational goal. They are ordered
for pedagogic progression (tutorial → tactics → reform), not story.

Scenarios unlock sequentially by default. Completing scenario N unlocks N+1. Players
can replay any completed scenario at any time.

A scenario select screen shows:
- Completed scenarios (with achievement indicators)
- The next unlocked scenario
- Locked future scenarios (visible but inaccessible — creates anticipation)

There is no explicit "level cap" — the game is designed to keep receiving new scenarios
over time.

**Campaign mode (stretch / later).** A possible future structure groups scenarios into
a themed campaign — a progressive sequence with shifting goals that tells a larger story.
A campaign could be followed by standalone "explore the space" scenarios. No narrative
is currently in mind; this is worth workshopping if a good concept emerges. The scenario
structure should not preclude campaigns being added later.

---

## Custom Level and Community Scenarios

### Custom Level (Scenario Creator)

Custom Level is not a sandbox with no stakes — it is a full scenario authoring tool.
A player with Custom Level open can:

- **Paint population data** — assign partisan lean, demographics, and population
  density to precincts on a blank or template map
- **Define success criteria** — required and optional, using any of the game's
  evaluation dimensions (seat counts, compactness scores, VRA compliance, etc.)
- **Design the rules** — which constraints apply (equal population tolerance, contiguity,
  compactness thresholds); this is the key feature for rules-as-advocacy scenarios
- **Write scenario text** — intro slides, narrative context, flavor
- **Build fictional or historically-inspired maps** — the tool does not require real
  geographic data; a historically-inspired map uses fictional population numbers

Custom Level targets experienced players who have completed the scenario sequence and
want to explore "what if I had drawn this differently" or "what if the rules were X?"

**V1 scope note.** The player-facing Custom Level UI is not required for v1. However,
the scenario data format and serialization model must be designed for authoring from
the start — the pre-built scenarios are authored using that same format. The data
model must not paint itself into a corner: the player-facing UI, community sharing,
and historically-inspired maps should all be achievable additions without redesigning
the core scenario format.

### Community Scenario Sharing

Players can publish custom scenarios to a shared library. Other players can browse,
play, and rate community scenarios. This feature:

- Distributes authorial power — the game is not solely shaped by one designer's choices
- Enables rules-as-advocacy: someone can publish a scenario that demonstrates why
  their preferred rule-set is better; others can publish the counterargument
- Provides an organic content pipeline without requiring server-side game state
  (scenarios are stored as data; play state remains local)

Community scenarios go through a lightweight moderation step (no hate speech, no
doxxing, no real-name targeting) but are not reviewed for political perspective —
the whole point is pluralism.

**Technical note:** Community scenarios require minimal server-side storage (scenario
data only; no user game state). This is the one server-side component justified in
an otherwise locally-run game. Design for minimum hosting cost: scenarios are
static data once published; no per-session server compute needed.

---

## V1 Scope Boundary

**In v1:**
- Single-player, single sub-state region per scenario
- FPTP (first-past-the-post) election simulation only
- Fictional regions and populations (no real geographic data)
- 8–12 scenarios covering partisan, demographic, and neutral-rules themes
- Desktop-first (mouse/keyboard primary interaction)
- Progress stored in local browser storage (IndexedDB / localStorage); no user accounts;
  no server-side game state — minimises hosting cost
- Scenario data format designed for authoring (pre-built scenarios use it; player-facing
  UI deferred to post-v1)

**Explicitly out of v1:**
- Player-facing Custom Level UI and community scenario sharing (data format in v1; UI post-v1)
- Alternative electoral systems (STV, party-list, etc.)
- Real geographic data
- Full-state or multi-state scope
- Multiplayer
- Mobile-optimised boundary drawing (TBD — may be a different interaction model on the
  same data; decision deferred)
- International comparison scenarios (target: early v2)
- User accounts, cross-device sync, leaderboards (target: v2 if demand justifies cost)
- Campaign / narrative mode (stretch — worth workshopping; must not be precluded by design)

---

## Open Questions

1. ~~**Custom Level**~~ — **Resolved.** Scenario data format in v1 (shared with pre-built
   scenario authoring); player-facing UI and community sharing deferred to post-v1.
   Format must not preclude adding the UI later.

2. ~~**Save/profile system**~~ — **Resolved.** Local browser storage (IndexedDB /
   localStorage) for v1. No user accounts, no server-side game state. Minimises hosting
   cost and eliminates COPPA exposure for game state. Community scenario sharing (post-v1)
   requires minimal server-side storage for scenario data only.

3. ~~**Precinct naming**~~ — **Resolved.** "Precinct" confirmed.

4. **Mobile** — deferred. May be a different interaction model built on the same data
   model; may not happen at all. No decision needed yet.

5. **Scenario fictional region names and geographies** — placeholder. GES + Visual Designer
   creative decision informed by educational goals per scenario.

6. **Tech stack** — unresolved (separate session with GES + Architect). Affects: how
   simulation runs, map rendering approach, save system, mobile.

7. **Precinct count calibration** — target is "hundreds" (visually small, fat-pixel
   aesthetic). Domain Reviewer should research real sub-state regions, their precinct
   counts, and how actual redistricting breaks down at that scale. Result informs
   GES + ARCH on rendering and performance targets.

8. **VRA / bloc voting simulation model** — simplified model: each demographic group
   has a per-precinct vote-share percentage (e.g., "Latinos in this precinct vote
   R 44%, D 38%, other 18%"); district outcome is aggregated from precinct-level
   demographic breakdowns. GES + Domain Reviewer to validate that this simplification
   is educationally sound and sufficient for the VRA scenario. The same model should
   generalise to other demographic groups.

9. **Historical / inspired scenarios** — later versions may use historically-inspired
   maps with fictional population data. Domain Reviewer required. Flag for v2.

10. **About page content** — deferred. Deserves its own review when there is a page
    to look at. Should convey educational intent and non-partisan framing without
    making claims that require ongoing maintenance.
