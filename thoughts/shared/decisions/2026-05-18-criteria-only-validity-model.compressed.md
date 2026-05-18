<!--COMPRESSED v1; source:2026-05-18-criteria-only-validity-model.md-->
§META
date:2026-05-18 status:accepted
topic:criteria-only validity model — deprecate dual validity/criteria system
impl:GAME-074

§CONTEXT
Two overlapping constraint systems exist:
1. validity (validity.ts, isMapSubmittable): rules.population_tolerance + rules.contiguity → mapIsValid gate; generates buildValidityRows diagnostic rows on result screen
2. criteria (evaluate.ts, success_criteria): explicit player-facing goals; shown in result screen list
Overlap: tutorial-001 has both rules.population_tolerance AND population_balance criterion → duplicate rows on failure, one row on success; suppression workaround added but is wrong fix
Root problem: validity system encodes US redistricting assumptions as engine invariants; disempowers scenario authors; contradicts educational mission (contingency of rules is the point)

§DECISION
Collapse to criteria only.

One engine invariant (not a criterion): all precincts assigned → undefined simulation otherwise; shown as pre-submit UI check, never in criteria list.

Everything else (population balance, contiguity, compactness, seat counts) = scenario criterion; opt-in/opt-out per scenario.

§SCHEMA_CHANGES
population_balance criterion gains tolerance field:
  { "type": "population_balance", "tolerance": 0.05 }
contiguity becomes opt-in criterion:
  { "type": "contiguity" }
rules block deprecated → migrate remaining fields → remove when empty

§SIMPLIFICATIONS
remove: isMapSubmittable | mapIsValid gate | buildValidityRows | May-2026 suppression hack
overallPass = all required criteria pass AND all precincts assigned
computeValidityStats: retain only all-assigned + district-in-use checks (still needed for district_count criterion)
population+contiguity checks move into their criterion evaluators

§AUTHORING_DEFAULTS
new scenarios default to contiguity + population_balance required criteria
editor shows warning on removal: "required by most real-world redistricting law — remove intentionally for alternative polity scenarios"

§MIGRATION
all scenario JSONs:
  remove rules.population_tolerance → add tolerance to population_balance criterion
  remove rules.contiguity → add contiguity criterion (all current scenarios require it)
  remove rules block if empty

§CONSEQUENCES
scenario.ts: update criterion union type; deprecate rules
loader.ts: validate tolerance on population_balance; remove rules parsing; warn on non-empty rules block
validity.ts: retain only all-assigned + district-in-use
evaluate.ts: population_balance reads tolerance from criterion; add contiguity type
main.ts: remove isMapSubmittable/mapIsValid/buildValidityRows; update overallPass
all scenario JSONs: migration required
e2e tests: update validity-row + mapIsValid tests
educational upside: all constraints visible as criteria → rules are choices not nature

§REFS
impl ticket: thoughts/shared/tickets/GAME-074-criteria-only-validity-model.md
scenario format ADR: thoughts/shared/decisions/2026-04-24-scenario-data-format.compressed.md
