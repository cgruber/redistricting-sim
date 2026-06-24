---
date: 2026-06-22
author: claude
ticket: GAME-088, GAME-089, GAME-084 (AC6 migration)
status: draft
---

# Plan: Generation-quality overhaul — coherent population field + population-aware counties

## Goal

Make the pipeline produce maps that *look* demographically plausible across the whole
game, fixing two concrete defects observed while playtesting scenario-002:

1. **Lumpy density** — population reads as salt-and-pepper noise with a tight central
   cluster and unexpectedly light precincts next to heavy ones.
2. **Counties don't follow population** — county borders are parallel q/r slices that
   ignore the population field; real counties wrap population centers.

The output only has to *broadly feel sane*, not be perfect.

## Context

The pipeline (GAME-084) is `terrain → population → demographics → assembly`, spec-driven
(`<id>.spec.yaml` → `runPipeline` → `<id>.json`). Today only `scenario-002` has a spec;
003–009 + tutorials still come from the old per-scenario `gen-*.main.kts` generators,
which are slated for removal once migrated.

Root causes (verified in code):

- `population-stage.ts` uses **independent per-precinct uniform jitter** (`±variance`),
  so neighbours are uncorrelated → salt-and-pepper. Settlement bumps are tight Gaussians
  (σ = radius/2). There is no coherent-noise layer, no contrast/normalization step. The
  prior-art research (`2026-05-31-population-distribution-prior-art`) recommended fBm +
  `pow` contrast but the implementation took the documented "simplification off-ramp".
- Counties are assigned in `demographics-stage.ts` via `county_labels` — geometric q/r
  filters reused from the political zones, **completely decoupled from population**.
  `county_id` is **purely cosmetic**: it drives only the dashed county-border overlay
  (`mapRenderer.ts` `computeCountySegments` / `setCountyBordersVisible`); it does not
  affect contiguity, scoring, or districting.

County design is grounded in new research: `2026-06-22-us-county-formation-patterns`.
Key finding — **one algorithm (seeded priority-queue flood-fill) + a `model` flag**
expresses both requested models. Borders biased toward population troughs + river/feature
edges give compact blobs that snap to rivers, which is the safe cosmetic way to surface
the river↔boundary association (per the `project_geography_cosmetic` principle).

## Approach

Two implementation PRs, then gated per-scenario migration. **Critical constraint:** every
scenario is a tuned puzzle with an e2e solve test and a teaching point; `total_population`
feeds both district balance and seat outcomes. So we change the *shape* of the field, not
the magnitudes — **normalize each regenerated scenario back to its existing total
population** — and re-validate winnability per scenario.

### PR 1 — GAME-088: coherent population field

Rework `population-stage.ts` so the base field has spatial structure instead of
independent jitter:

- **Radial / gradient layer** (optional, spec-driven): monocentric density falloff so the
  macro shape is "dense core → rural fringe".
- **Coherent value noise** replacing independent jitter: low-frequency noise sampled on
  hex coords (seeded via existing `prng.ts`) so neighbours correlate. Cheapest viable
  form: generate per-precinct jitter then run 1–2 neighbour-averaging smoothing passes;
  upgrade to true value-noise lattice if smoothing isn't organic enough.
- **Contrast step** (`pow(normalized, k)`, k≈2): pushes low density toward 0, sharpens
  centers — the documented missing step.
- **Normalize to target total**: scale the final field so `Σ total_population` equals a
  spec target (default = preserve current scenario total). This is the de-risking lever.
- Keep terrain suitability (Layer 1) and named settlements; they compose with the above.
- Backward-compat: with the new knobs unset, output should stay close enough that
  scenario-002's e2e solve test still passes (or update the test deliberately).

### PR 2 — GAME-089: population-aware county stage

New pipeline step **after** population (so it can read the field), before/within assembly.
Replaces the geometric `county_labels` path. Algorithm (from the heuristic):

```
STEP0 target count   ≈ precincts / 14            (R5→~6, tutorial→~2); knob = catchment r=2
STEP1 classify centers by catchment pop (Σ within r, nearest-center wins):
        dominant ≥40% Ptot | anchor ≥15–20% Ptot | minor <15% (absorbed)
        always keep ≥1 anchor; cap anchors to target count (top-k by catch pop)
        → one county may hold several towns (Clark County WA case)
STEP2 grow: priority-queue flood-fill, 1 seed per anchor peak
        cost = 1 + w_trough*(1 - norm_pop_neighbor) + w_feature*crosses_feature
        (w_trough≈0.5, w_feature≈1.0); fill until all claimed; orphans → nearest seat
STEP3 named model preset (intuit-on-sight; owner reasons in city examples not knobs):
        "seat_and_hinterland" (default, B): each anchor = seat + rural surround
        "city_county" (A, SF/Denver): carve dominant center's urban-core (pop ≥
              core_density*peak, default 0.5) + split remainder into ring_counties (auto)
        "split_metro" (C, Portland): split_dense_center=true → multiple seeds in one city
STEP4 cosmetic finish: dashed borders only; optional name-after-seat
```

All thresholds are spec-overridable defaults, tuned by eyeballing 1/2/3-center fields.
Spec gains a `counties:` block (named `model` + optional overrides), **each knob carrying an
inline plain-English + real-city comment**, plus a plain-English→preset table kept in the
research doc (per [[feedback-plain-english-tooling-knobs]] — the owner won't recall raw
knobs between sessions). The old `county_labels` path is removed once scenario-002 migrates.

**Principles (hold across all tuning):** counties are *unequal by design* (target count
sets seed count only, never balances; sanity is local not global); the *region clips
counties* (truncated edge counties are an expected game simplification, not a bug); a
satellite town (Vancouver-WA-like, same state) is just another settlement, not a model;
`county_id` stays cosmetic-only.

### Phase 3 — GAME-084 AC6: per-scenario migration (separate gated tickets)

One ticket per scenario (003–009, then tutorials). Each: author a `spec.yaml` that
reproduces the puzzle's political intent, regenerate, **re-validate the e2e solve test +
teaching point**, get visual sign-off. This is the bulk of the effort and must not be
folded into PR 1/2. Old `gen-*.main.kts` removed only after all migrate (AC7).

## Steps

1. GAME-088: implement coherent field in `population-stage.ts` + unit tests; regenerate
   scenario-002; confirm e2e solve test green + visual sign-off. PR, review, merge.
2. GAME-089: implement county stage + unit tests; migrate scenario-002 spec to the new
   `counties:` block; remove geometric `county_labels` path; confirm county overlay looks
   sane in both models. PR, review, merge.
3. Phase 3: file + work per-scenario migration tickets sequentially (shared scenario files
   → no parallel PRs).

## Risks

- **Winnability regression** — population shape change flips which gerrymanders solve.
  Mitigation: normalize-to-existing-total; per-scenario e2e re-validation; scenario-002
  proven first.
- **Threshold tuning churn** — the heuristic numbers are extrapolations. Mitigation: all
  spec-overridable; tune by eyeball on scenario-002 before generalizing.
- **Spec authoring for 003–009** — no existing specs; reproducing intent is real design
  work. Mitigation: gated per-scenario tickets, not batched.
- **County visual fights political zones** — counties are cosmetic and off by default;
  low risk.

## Done (acceptance)

- [ ] scenario-002 population reads as a coherent gradient, no salt-and-pepper (visual)
- [ ] scenario-002 county overlay wraps the population center(s) sanely in both models
- [ ] scenario-002 e2e solve test passes (or deliberately updated)
- [ ] new generator knobs are spec-driven with documented defaults
- [ ] migration tracked as gated per-scenario tickets under GAME-084 AC6
