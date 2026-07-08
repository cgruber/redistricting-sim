---
id: GAME-129
title: tutorial-005 objective + coach copy — an outcome to observe, not a goal to hit
area: game (content, UX, tutorial)
status: resolved
created: 2026-07-08
---

## Summary

tutorial-005 ("Hawthorn Bend: A Three-Way Race") is **legality-gated only** —
`district_count` + `population_balance` (±15%) + `contiguity`, with **no seat objective**.
Who wins how many seats is *emergent* from the player's lines, meant to be explored and read off
the live result panel, not achieved. Two copy spots still framed the three-way result as a **goal
to reach**:

- the briefing **objective** ("YOUR OBJECTIVE"): *"…can you draw a map where the Ken Party, the Ryu
  Party, and the Chun-Li Party each carry a seat?"*
- the **coach** closing (step 4): *"Can you give each party a seat?"*

Owner request (verbatim): *"we want the user to explore it, not try to achieve it — and it's not a
formal goal so it shouldn't be in the Your Objective section. Or it should be softened to pointing
out you can draw a seat where chun-li wins, or one where they get shut out. Not a goal to achieve,
an outcome to observe."* and *"If it's not a scenario goal, it shouldn't have 'goal' language — and
this is still learning the mechanisms, not scenarios to 'win'."*

This **reverses the deliberate GAME-122 decision** to KEEP the "can you give each party a seat?"
phrasing (then judged "an invitation to experiment, not a gate"). After further playtest the owner
reconsidered: on a mechanism-learning rung it still reads as goal / "win" language. Re-aligns with
the original tutorial-progression ADR, which listed softening T5's seat question as a consequence.

## Resolution

Resolved 2026-07-08. Softened both spots to observation-language, mirroring the already-accepted
`TUTORIAL_006` Dhalsim closing (*"Watch the result: … Dhalsim carries the Hollow. (Split it across
districts instead, and his voice slips away.)"*):

- **Coach** (`overlay.ts`, `TUTORIAL_005` step 4): *"…Can you give each party a seat?"* →
  *"…Watch the result: keep the eastern base whole and Chun-Li carries that seat; split it across
  districts and she's shut out."*
- **Briefing objective** (`tutorial-005.spec.yaml` `assembly.narrative.objective` + the generated
  `tutorial-005.json` `narrative.objective`, edited **in sync** — committed JSONs are the source of
  truth and regeneration drifts the PRNG-derived numbers): dropped the "can you draw a map where…
  each carry a seat?" goal-question. Now leads with the real goal and demotes the outcome to
  observation: *"…There's no seat to chase: the winners emerge from where you put the lines. Keep
  the eastern base whole and Chun-Li carries that seat; split it across districts and she's shut
  out — repaint and watch the three-cornered race shift."*
- **Stale-comment fix** (same spec): the demographics-header EAST bullet named *"Dhalsim, the
  unaffiliated local yogi"* (T006's independent, a copy-paste artifact) — corrected to Chun-Li's
  ~two-in-five party base, the actual T005 east.

**Verification:** the spec.yaml folded scalar and the JSON `narrative.objective` were confirmed
character-for-character identical (yq fold vs jq extract, trailing `\n` included). A repo-wide grep
confirmed no test asserts on any changed string — the T005 e2e (`tutorial-005-multiparty.spec.ts`)
checks only the candidate winner badges, `"Map Passed!"`, and `"three-cornered race"`, none of
which the copy edit touches. `bazel test //game/...` 47/47. Held for owner serve-local eyeball (the
rendered objective under YOUR OBJECTIVE and coach step 4).

## Goals / acceptance criteria

- [x] Briefing objective drops the "each carry a seat?" goal-question; frames the outcome as an
      observation (Chun-Li wins vs. shut out).
- [x] Coach closing drops "Can you give each party a seat?"; frames the outcome as an observation.
- [x] `tutorial-005.spec.yaml` and `tutorial-005.json` objective in sync (character-for-character).
- [x] Stale T006 "Dhalsim" comment in the T005 spec corrected to Chun-Li.
- [x] Full local `bazel test //game/...` green.

## Test Coverage

No new tests — this is pure narrative copy with no logic or flow change. The existing T005 e2e
(`e2e/tutorial-005-multiparty.spec.ts`) is the regression guard; a repo-wide grep verified it (and
every other test) is decoupled from the edited strings.

## References

- `game/web/src/tutorial/overlay.ts` — `TUTORIAL_005` coach script
- `game/scenarios/tutorial-005.spec.yaml`, `game/scenarios/tutorial-005.json`
- GAME-122 — KEPT the seat phrasing (this ticket reverses that owner call, post-playtest)
- GAME-120 / GAME-121 — the T005 three-party build + public-ladder promotion
- `thoughts/shared/decisions/2026-07-05-tutorial-progression-and-multiparty-placement.md` — ADR that
  listed softening T5's seat question as a consequence
- DESIGN-014 — education-not-advocacy: a mechanism to observe, not a scenario to "win"
