---
date: 2026-07-02
author: Claude (Opus 4.8) + Christian Jackson-Gruber
ticket: GAME-117, GAME-118
status: approved — design of record for the candidate/independent model
---

# Candidates & independents: the district-candidate model

## The idea

A district is won by a **named candidate**, not an abstract party. From that one idea, both the
"outcomes should read as people" ask and the independent mechanic fall out:

- A **party** is an organization that fields a **candidate in every district** — so its per-district
  vote share converts to a seat anywhere, and it can win many seats.
- An **independent** is a **single person** on the ballot in **one** district (their home). They can
  win **at most that one seat**.

Scenarios with no independent behave exactly as today (parties only). Candidate names are optional —
absent a name, display falls back to the party name, so existing scenarios are unaffected.

## Lean vs. ballot (the distinction that drives this)

- **Lean** = voter *preference* — who a precinct favors. Stays map-wide for everyone, including an
  independent (regional popularity is real). Unchanged from today.
- **Ballot** = who is *actually running* in a district. A party runs everywhere; an independent runs
  only at home. This is the layer that changes.

So an independent's lean can be high across a region while his *ballot* presence — and thus his ability
to win a seat — exists in exactly one district.

## GAME-117 — named per-district candidates

- **Model:** each `(district, party)` has a candidate name. The winner of a district displays as
  "**Candidate** (Party) +margin". No candidate authored → fall back to the party name (today's
  behavior), so 2-party scenarios and every existing scenario are unchanged.
- **Schema:** add candidate authoring to the scenario — a `candidates` map (by district → by party →
  name), or per-party `candidates: { <districtId>: <name> }`. Optional; loader validates strings.
  (Decide the exact shape in the ticket; keep it additive + optional.)
- **Render:** `panels.ts` result card + `mapRenderer.ts` info/result surfaces show the winning
  candidate name + party (color/badge unchanged). One person can't hold two seats — per-district
  names make multi-seat party wins read correctly ("Sakura took D1, Chun-Li took D2 for Ryu").
- **Out of scope:** the independent restriction (that's 118); this is names only.

## GAME-118 — home-base independent candidates (opt-in)

- **Model:** an independent is a candidate with `independent: true` and a **home** (a precinct id, or
  a coordinate resolved to a precinct). At election time:
  - In the district containing the home → the independent is on the ballot; district winner = plurality
    over parties **+ the independent**.
  - In every other district → the independent is **excluded from the seat contest**; the winner is the
    plurality over the **parties only** (his supporters there fall back to a party for the seat — his
    lean is latent, shown but not on the ballot).
  - An independent therefore wins **≤ 1 seat**, only at home.
- **UX:** a **home pin** on the map (`⌂ <name>`). The result/info for non-home districts note the race
  is party-only; the home district shows the independent as a contender. The lean map is unchanged
  (independent shows map-wide).
- **The lesson (richer than a party):** to elect the independent, draw a district around their home +
  base; to defeat them, crack the base or draw the home into a district the opposition dominates. A
  party spreads risk across many seats; an independent lives or dies by one line.
- **Interaction with metrics:** the two-party normalization (GAME-112) already restricts EG/mean-median
  to the two majors, so an independent (home or not) doesn't corrupt them. Confirm the home-district
  independent-win path is covered (GAME-112 PR1 flagged that branch untested).
- **Builds on 117** (the independent is just a candidate that exists in one district).

### GAME-118 — clarifications (from the #324 plan review)

- **Status of the independent's votes outside his home district:** they are **disregarded for the
  seat** — the non-home winner is the plurality among the **parties** using their shares as-is. We do
  **not** redistribute the independent's share to a major (second preferences aren't modeled); his
  local support is simply *unrepresented on that ballot*. This is consistent with the two-party metric
  normalization (GAME-112), which already excludes non-majors, and it's the honest outcome: those
  voters had no one of theirs to vote for. (Precinct vote shares are unchanged; only the *seat
  contest* excludes him.)
- **Multiplicity:** the model supports **zero or more** independents. Each carries its own `home`, and
  each is on the ballot only in the district containing that home. Two independents sharing a home just
  both appear on that district's ballot. No global "the independent" assumption.
- **Unassigned home mid-draw:** if the home precinct is currently unassigned (no district), the
  independent is on **no** ballot — exactly as an unassigned precinct contributes to no seat — and
  becomes a contender the moment his home is placed into a district. No special-case error; it falls
  out of "on the ballot in the district containing the home."

## GAME-119 — feature-anchored zone filters

- The demographics zone filters today are `q_lte/q_gte/hex_dist_lte-from-origin` only, forcing
  artificial q-bands. Add **proximity filters** so leans hang on geography: `near: {q,r} within: N`
  (distance to an arbitrary point — settlements sit at known anchors) and/or `near_river` /
  `near_feature`. Deterministic, behavior-preserving for existing specs (new optional filter keys).
- Also: carry T4's polished terrain into tutorial-005's map so the tutorial set reads as a progression.

## GAME-120 — rebuild tutorial-005 as the multi-party tutorial

- A clean 3rd/4th-**party** tutorial (parties contest everywhere), leans hung on features (119),
  outcomes as named candidates (117). Retire the artificial three-band draft. Debug-gated until the
  tutorial set is ready to promote.

## GAME-121 — independent tutorial

- A new scenario built on the home-base independent (118) + candidates (117) — e.g. Dhalsim done right:
  one home district, a base you can pack or crack, a home pin. Teaches the independent mechanic
  specifically, distinct from the multi-party tutorial.

## Sequence & rationale

117 → 118 → 119 (features), then 120, 121 (the tutorials). 117 is the keystone: it makes outcomes read
as people and is what 118 extends. Tutorials teach *mechanics*; the political-effect scenarios (rules
that choke a third party's chances) are later real content, not these.

## References

- `game/web/src/model/scenario.ts` (Party, schema), `model/loader.ts`, `simulation/election.ts`
  (winner computation), `render/panels.ts` + `render/mapRenderer.ts` (result/info surfaces),
  `pipeline/spec-types.ts` + `pipeline/demographics-stage.ts` (zone filters).
- Prior: GAME-112 (multiparty + two-party metrics), GAME-116 (N-party generator), GAME-115 (debug
  campaign), GAME-043 (party-agnostic runtime + Party.color).
