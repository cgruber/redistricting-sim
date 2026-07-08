---
id: GAME-130
title: tutorial-006 epilogue — ground the "home = running district" independent mechanic in real residency law
area: game (content, tutorial, research)
status: resolved
created: 2026-07-08
---

## Summary

`tutorial-006` ("The Hollow's Own") models Dhalsim, an independent, as **on the ballot only in the
district that contains his home precinct** (⌂) — his lean shows map-wide, but he can only be
elected where his home lands, so the lines decide which single race he is in (GAME-118 mechanic,
GAME-121 authored). The owner asked to **ground that gameplay choice** in reality (verbatim):

> *"his home precinct is his running district — if it's a hedge we made for gameplay in a much
> messier legal reality, that's fine, as long as we explain that. Or if we can validate the choice
> with real rules, then we can explain that."*

A short research pass (NCSL, U.S. Const. Art. I §2, Wisconsin qualification rules) found the answer
is **both**: the mechanic is **validated by real law** *and* a **clean simplification** of a messier
reality. So we (a) recorded the findings as a research note and (b) added one grounding sentence to
the T006 epilogue that names it as a simplification while stating the real rule.

## Research verdict (see the research note)

- **Load-bearing real rule = office-holding, not filing.** Every U.S. state requires a state
  **legislator to live in the district they represent** (to hold the seat). That is the universal,
  always-true rule the mechanic leans on: where a home falls decides which seat can be won.
- **Candidacy timing varies** — ~13 states require district residency *at filing*, ~37 only *by
  election/taking office* (Wisconsin: not required to *run*, only by the oath). So "on the ballot
  only at home" is a **simplification of the office-residency rule**, not a literal candidacy rule.
- **The U.S. House is the exception** — state residency only (Art. I §2 cl. 2), not district; the
  mechanic is a *state-legislature* rule. (This is why incumbents get "drawn out"/"paired" in
  redistricting — the same line-drawing force T006 dramatises.)

Full findings + sources:
`thoughts/shared/research/2026-07-08-independent-home-district-residency-grounding.md` (+ compressed).

## Resolution

Resolved 2026-07-08.

- **Research note (both forms per §RESEARCH):**
  `thoughts/shared/research/2026-07-08-independent-home-district-residency-grounding.md` +
  `.compressed.md` — the district-residency findings (state-legislature office-residency vs
  candidacy-timing vs the U.S. House exception), the verdict, the exact in-game wording, reusable
  nuance for the VRA arc / future incumbency scenarios, and sources.
- **Epilogue grounding note** (`tutorial-006.spec.yaml` `assembly.narrative.epilogue` + the generated
  `tutorial-006.json` `narrative.epilogue`, edited **in sync** — committed JSONs are the source of
  truth and regeneration drifts the PRNG numbers): one sentence inserted **before** the existing
  closing thesis (so the thesis stays the last line):

  > *"That home-only rule is a simplification of real law: nearly every state requires a legislator
  > to live in the district they represent, so which district a home falls into decides where its
  > candidate can win — the U.S. House is looser, asking only that a member live somewhere in the
  > state."*

  Wording chosen deliberately: **"legislator … represent," not "candidate … run"** — the universal
  rule is office-residency (the candidacy version is true in only ~13 states and false for the
  House), and it fits the mechanic better (Dhalsim can only *win* where his home is). Named as
  **"a simplification of real law"** — the owner's ask (disclose the hedge *and* validate it in one
  breath). Neutral / factual / no advocacy (DESIGN-014).

The terse map footnote (`panels.ts:117`, "⌂ Independent candidates run only in their home district …")
is left as-is — too small a legend to carry legal nuance; the debrief epilogue is the teaching surface.

**Verification:** the spec.yaml folded scalar and the JSON `narrative.epilogue` were confirmed
character-for-character identical (yq fold vs jq extract, trailing `\n` included → `EPILOGUE-IN-SYNC`).
A repo-wide grep confirmed no test asserts on the T006 epilogue text (the `#result-epilogue`
assertions in `scenarios.spec.ts` cover scenario-002 "packing" and tutorial-004 "core loop" only;
the T006 e2e checks the debrief button, not its prose). `bazel test //game/...` green. Held for owner
serve-local eyeball of the rendered debrief.

## Goals / acceptance criteria

- [x] Research: is "home = running district" real, a hedge, or both? → answered (both; office-residency
      universal, candidacy timing varies, U.S. House exception).
- [x] Research note written in both forms (`.md` + `.compressed.md`) under `thoughts/shared/research/`.
- [x] T006 epilogue grounds the mechanic in one neutral sentence, naming the simplification and the
      real rule, without overstating (office-residency, not candidacy).
- [x] `tutorial-006.spec.yaml` and `tutorial-006.json` epilogue in sync (character-for-character).
- [x] Full local `bazel test //game/...` green.
- [ ] Owner serve-local eyeball of the rendered T006 debrief. POST-MERGE — approval gate before merge.

## Test Coverage

No new tests — this is pure narrative copy plus a research doc, with no logic or flow change. The
existing T006 e2e (`e2e/tutorial-006-multiparty.spec.ts` / home-independent specs) is the regression
guard; a repo-wide grep verified no test asserts on the edited epilogue string.

## References

- `game/scenarios/tutorial-006.spec.yaml`, `game/scenarios/tutorial-006.json` — epilogue grounding note
- `thoughts/shared/research/2026-07-08-independent-home-district-residency-grounding.md` (+ compressed)
- `game/web/src/render/panels.ts:117` — ⌂ footnote (left as-is)
- GAME-118 — the home-base independent mechanic (on-ballot-only-at-home)
- GAME-121 — authored T006 (first authored use of the independent mechanic)
- DESIGN-014 — education-not-advocacy: state the mechanism + the real rule, take no position
