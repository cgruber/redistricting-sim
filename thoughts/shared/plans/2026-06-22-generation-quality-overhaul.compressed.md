<!--COMPRESSED v1; source:2026-06-22-generation-quality-overhaul.md-->
§META
date:2026-06-22 author:claude ticket:GAME-088,GAME-089,GAME-084(AC6) status:draft

§ABBREV
$pop=total_population $ff=priority-queue flood-fill $cty=county $ctr=settlement center
$Ptot=total regional pop $cosmetic=dashed-border overlay,no gameplay effect
$norm=normalize field to target total

§GOAL
Pipeline maps that LOOK demographically plausible game-wide. Fix 2 scenario-002 defects:
(1) lumpy density (salt-and-pepper + tight central cluster + light precincts beside heavy);
(2) $cty borders=parallel q/r slices ignoring $pop; real $cty wrap $ctr. Output need only
broadly feel sane.

§CONTEXT
pipeline(GAME-084)=terrain→population→demographics→assembly; spec-driven(<id>.spec.yaml→
runPipeline→<id>.json). only scenario-002 has spec; 003-009+tutorials=old gen-*.main.kts(to
remove post-migrate). ROOT CAUSES(verified):
- population-stage.ts uses INDEPENDENT per-precinct uniform jitter(±variance)→uncorrelated→
  salt-pepper; settlement bumps=tight Gaussians(σ=radius/2); NO coherent-noise, NO contrast/
  norm step. prior-art(2026-05-31) recommended fBm+pow but impl took "simplification off-ramp".
- $cty assigned in demographics-stage.ts via county_labels=geometric q/r filters reused from
  political zones, DECOUPLED from $pop. county_id=PURELY $cosmetic: drives only dashed overlay
  (mapRenderer.ts computeCountySegments/setCountyBordersVisible); NOT contiguity/scoring/districting.
county design grounded: 2026-06-22-us-county-formation-patterns. KEY=ONE algo(seeded $ff)+`model`
flag expresses both models; borders bias to $pop troughs+river/feature edges→compact blobs snap to
rivers=safe $cosmetic way to show river↔boundary assoc (per project_geography_cosmetic).

§APPROACH
2 impl PRs then gated per-scenario migration. CRITICAL CONSTRAINT: every scenario=tuned puzzle w/
e2e solve test+teaching point; $pop feeds district balance AND seat outcomes. → change field SHAPE
not magnitudes: $norm each regenerated scenario to its EXISTING total $pop; re-validate winnability
per scenario.

PR1 GAME-088 coherent population field (population-stage.ts):
  - radial/gradient layer(optional,spec): monocentric falloff→dense core→rural fringe
  - coherent value noise REPLACING independent jitter: cheapest=per-precinct jitter +1-2 neighbour-
    averaging smoothing passes(seeded via prng.ts); upgrade to value-noise lattice if not organic
  - contrast: pow(normalized,k≈2)→push low→0, sharpen centers (the missing step)
  - $norm to target total(default=preserve current scenario total)=de-risk lever
  - keep terrain suitability(L1)+named settlements; compose
  - backward-compat: knobs unset→output close enough scenario-002 e2e still passes(or update deliberately)

PR2 GAME-089 population-aware $cty stage (NEW step AFTER population so it reads field; replaces
geometric county_labels):
  STEP0 target count ≈precincts/14 (R5→~6,tut→~2); knob=catchment r=2
  STEP1 classify $ctr by catchment pop(Σ within r,nearest wins): dominant≥40%$Ptot|anchor≥15-20%|
        minor<15%(absorbed); always ≥1 anchor; cap anchors to target(top-k by catch pop) → 1 cty may
        hold SEVERAL towns(Clark County WA case)
  STEP2 grow: $ff 1 seed/anchor peak; cost=1+w_trough*(1-norm_pop_neighbor)+w_feature*crosses_feature
        (w_trough≈0.5,w_feature≈1.0); fill all; orphans→nearest seat
  STEP3 NAMED model preset(intuit-on-sight; owner reasons in city examples not knobs):
        "seat_and_hinterland"(default,B)=each anchor=seat+rural surround |
        "city_county"(A,SF/Denver)=carve dominant urban-core(pop≥core_density*peak,def 0.5)+split
          remainder into ring_counties(auto) |
        "split_metro"(C,Portland)=split_dense_center=true→multiple seeds in 1 city
  STEP4 $cosmetic finish: dashed only; optional name-after-seat
  all thresholds spec-overridable defaults; spec gains counties:{named model,overrides} EACH w/ inline
  plain-English+real-city comment; plain-English→preset table in research doc (feedback-plain-english-
  tooling-knobs: owner won't recall raw knobs). remove county_labels once scenario-002 migrated.
  PRINCIPLES(hold across tuning): cty UNEQUAL by design(target=#seeds only,never balances;sanity
  LOCAL not global) | REGION CLIPS cty(truncated edge cty=expected simplification not bug) | satellite
  town(Vancouver-WA-like,same state)=just another settlement not a model | county_id stays $cosmetic.

Phase3 GAME-084 AC6 migration (SEPARATE gated tickets, NOT folded into PR1/2): 1 ticket/scenario
  (003-009 then tutorials); each=author spec.yaml reproducing political intent→regenerate→re-validate
  e2e solve+teaching→visual sign-off. old gen-*.main.kts removed only after all migrate(AC7).

§STEPS
1. GAME-088 impl+unit tests; regen scenario-002; e2e green+visual sign-off; PR→merge.
2. GAME-089 impl+unit tests; migrate scenario-002 spec to counties: block; remove county_labels;
   verify overlay both models; PR→merge.
3. Phase3 per-scenario migration tickets SEQUENTIAL (shared files→no parallel PRs).

§RISKS
winnability regression(shape flips solvable gerrymanders)→$norm + per-scenario e2e revalidation +
  scenario-002 first | threshold churn(numbers=extrapolations)→spec-overridable, tune on scenario-002
  first | spec authoring 003-009(no existing specs=real design work)→gated per-scenario | $cty visual
  fights political zones→$cosmetic+off-by-default, low risk.

§DONE
[ ] scenario-002 pop=coherent gradient, no salt-pepper(visual)
[ ] scenario-002 $cty overlay wraps center(s) sanely both models
[ ] scenario-002 e2e solve test passes(or deliberately updated)
[ ] new generator knobs spec-driven w/ documented defaults
[ ] migration tracked as gated per-scenario tickets under GAME-084 AC6
