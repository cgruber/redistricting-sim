---
date: 2026-07-08
researcher: Claude (Opus 4.8) + Christian Jackson-Gruber
git_commit: ca9ddbeb302e
branch: main
repository: cgruber/redistricting-sim
topic: "Grounding the tutorial-006 home-base independent mechanic in real candidate-residency law"
tags: [research, content, tutorial-006, independent, residency, legal, neutrality, education]
status: complete
last_updated: 2026-07-08
last_updated_by: Claude
---

# Grounding the T006 home-base independent (home = running district) in real residency law

## The question

`tutorial-006` ("The Hollow's Own") models Dhalsim, an independent, as **on the ballot only in the
district that contains his home precinct** (marked ⌂). His *lean* shows map-wide, but he can only
be elected where his home lands, so the district lines decide which single race he is in — and
whether the community around his home can elect him at all.

The owner asked (verbatim): *"his home precinct is his running district — if it's a hedge we made
for gameplay in a much messier legal reality, that's fine, as long as we explain that. Or if we can
validate the choice with real rules, then we can explain that."*

So: is "you run where you live" a real rule, a gameplay hedge, or both? And what exactly should the
in-game copy claim without overstating it?

## Verdict

**Grounded in real law, with clean and honest simplifications.** The load-bearing real rule is
about **holding office**, not about **filing to run**:

- **Every U.S. state requires a state legislator to *live in* the district they *represent*** to
  hold the seat. This is the universal, always-true rule, and it is exactly what the mechanic
  leans on: where your home falls decides which seat you can win.
- **Whether a *candidate* must *already* live in the district to *run* varies by state** — so the
  game's "on the ballot only at home" is a *simplification of the office-residency rule*, not a
  literal statement of every state's candidacy rule.
- **The U.S. House is the notable exception**: it requires only *state* residency, not district
  residency (U.S. Const. Art. I, §2, cl. 2 — a Representative must be "an Inhabitant of that State
  in which he shall be chosen"). So for Congress the mechanic does not hold at all; it is a
  state-legislature rule.

This is *both* answers the owner offered: the choice is **validated by real rules** (state
legislators must live in the district they represent) **and** it is a **gameplay simplification**
of a messier reality (candidacy timing varies; the House is looser). The honest in-game framing
names it as a simplification and states the real rule.

## Findings in detail

### 1. Office-residency: universal across state legislatures

All 50 states require a state legislator to be a resident of the district they represent. This is
the rule the mechanic actually depends on — you can only *win/hold* the seat where you live, so the
district that contains your home is the only one whose seat you can take. Redistricting can move
the lines around a fixed home, which is precisely the T006 lesson.

### 2. Candidacy timing: the part that varies (and that the game simplifies)

Whether you must *already* live in the district *when you file to run* — versus only *by the time
you take office* — differs by state (National Conference of State Legislatures, "Legislator
Qualifications"):

- **~13 states** require district residency **at the time of filing/candidacy**.
- **~37 states** require it only **by the general election / by the time of taking office**.
- **Duration requirements** (how long you must have lived in the district) range from about
  **30 days** (e.g. Nevada) to a few **years** (e.g. Massachusetts's longer Senate requirement),
  most clustering around **1–2 years**.

Wisconsin is a clean illustration of the candidacy-vs-office split: a person **does not need to
live in a district to be a *candidate*** there — they need a legal address in it by the time they
**take the oath of office**. So "on the ballot only where you live" is *not* literally true
everywhere; it is the game's simplification of "you must live there to *hold* the seat."

### 3. The U.S. House exception: state residency only

For the U.S. House of Representatives the Constitution requires only that a member be an inhabitant
of the **state** (Art. I, §2, cl. 2), **not** the district. This is why incumbents can be — and
routinely are — "**drawn out**" of their districts or "**paired**" with another incumbent when
maps are redrawn: their home ends up outside the old district's new lines, and they may run in a
neighbouring district, move, or retire. That real phenomenon is the same force T006 dramatises
(the lines decide which race a fixed home is in), just without a district-residency bar at the
federal level.

## How this is grounded in-game

We add **one sentence to the T006 epilogue** (the debrief the player reaches after passing),
inserted before the existing closing thesis so the thesis stays the last line. Exact wording:

> That home-only rule is a simplification of real law: nearly every state requires a legislator to
> live in the district they represent, so which district a home falls into decides where its
> candidate can win — the U.S. House is looser, asking only that a member live somewhere in the
> state.

Design choices that matter:

- **"legislator … represent," not "candidate … run."** The universal rule is office-residency; the
  candidacy version is only true in ~13 states and false for the House. Saying "legislator … live
  in the district they represent" is the accurate, always-true claim, and it fits the mechanic
  better (Dhalsim can only *win* where his home is).
- **Named as a simplification** ("a simplification of real law"), which is exactly what the owner
  asked for — disclose the hedge *and* validate it in one breath.
- **Neutral, factual, no advocacy** (DESIGN-014 / education-not-advocacy). It states the mechanism
  and the real rule; it takes no position on whether residency rules are good or bad.

The debrief is the right surface (it teaches after the fact); the terse map footnote
(`panels.ts:117`, "⌂ Independent candidates run only in their home district …") is left as-is —
too small a legend to carry legal nuance.

## Reusable nuance for future content

- **"Live in the district to hold the seat" is the safe, universal claim.** Anything stronger
  ("must live there to run/file") is state-specific — hedge it or scope it to state legislatures.
- **The U.S. House is the standing exception** to district-residency framings — worth remembering
  for any Congressional-map scenario, and for the VRA arc (which is federal-district territory).
- **"Drawn out" / "paired" incumbents** are a real, citable redistricting phenomenon that maps
  directly onto the "the lines decide which race a home is in" lesson — a candidate hook for a
  future scenario about incumbency and line-drawing.

## References (code)

- `game/scenarios/tutorial-006.spec.yaml` — the mechanic (assembly.parties[dhalsim]:
  `independent: true`, `home: {q: 3, r: -1}`) and the pedagogy header; epilogue grounding note added.
- `game/scenarios/tutorial-006.json` — generated output; `narrative.epilogue` edited in sync.
- `game/web/src/render/panels.ts:117` — the ⌂ footnote (left as-is; too terse for legal grounding).
- GAME-118 — the home-base independent mechanic (on-ballot-only-at-home, home resolved per run).
- GAME-121 — authored T006 (first authored use of the independent mechanic).
- GAME-130 — this grounding note (resolves).

## Sources (external)

- **National Conference of State Legislatures (NCSL)**, "Legislator Qualifications" — district
  residency requirements by state; ~13 states require it at filing vs ~37 by election/office;
  duration ranges (≈30 days to a few years). Primary source for the candidacy-timing figures.
- **U.S. Constitution, Article I, §2, cl. 2** — House members must be "an Inhabitant of that State
  in which he shall be chosen" (state residency only, not district).
- **Wisconsin** (state qualification rules, as summarised by PBS Wisconsin coverage) — a candidate
  need not live in the district to *run*; a legal address in it is required only by the time of
  taking the **oath of office**. Illustrates the candidacy-vs-office-holding split.
- General redistricting practice — incumbents "**drawn out**" / "**paired**" when district lines
  are redrawn around fixed homes (widely documented in redistricting reporting).

> Note: figures above were established during the GAME-130 research pass (WebSearch + a WebFetch of
> the NCSL qualifications page) and cross-checked against the mechanic. Re-fetch the NCSL page for
> exact per-state counts if a formal citation is ever needed — state rules change.
