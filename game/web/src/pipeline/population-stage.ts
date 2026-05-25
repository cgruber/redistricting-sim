/**
 * Stage 2 of the GAME-084 map generation pipeline: population stage.
 *
 * Takes a PartialScenario (from the terrain generator) and a PopulationSpec,
 * and assigns a deterministic integer total_population to every precinct.
 *
 * Semantics:
 *   - Always overwrites any existing total_population (spec is source of truth).
 *   - Population = base + prng.nextInt(-variance, variance), evaluated once per
 *     precinct in the order they appear in the precincts array.
 *   - Outputs are integers; no fractional populations.
 */

import type { PartialScenario } from "../model/scenario.js";
import type { PopulationSpec } from "./spec-types.js";
import { makePrng } from "./prng.js";

export function populateScenario(
  partial: PartialScenario,
  spec: PopulationSpec,
): PartialScenario {
  const prng = makePrng(spec.seed);
  const precincts = partial.precincts.map(p => ({
    ...p,
    total_population: spec.base + prng.nextInt(-spec.variance, spec.variance),
  }));
  return { ...partial, precincts };
}
