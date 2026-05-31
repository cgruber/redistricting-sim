import { generateTerrain } from "./terrain-generator.js";
import { populateScenario } from "./population-stage.js";
import { addDemographics, assignCounties } from "./demographics-stage.js";
import { assembleScenario } from "./assembler.js";
import type { PartialScenario } from "../model/scenario.js";
import type { PipelineSpec } from "./spec-types.js";

export function runPipeline(spec: PipelineSpec): PartialScenario {
  let partial = generateTerrain(spec);

  if (spec.population) {
    partial = populateScenario(partial, spec.population);
  }

  if (spec.demographics) {
    partial = addDemographics(partial, spec.demographics);
    if (spec.demographics.county_labels && spec.demographics.county_labels.length > 0) {
      partial = assignCounties(partial, spec.demographics.county_labels);
    }
  }

  if (spec.assembly) {
    partial = assembleScenario(partial, spec.assembly);
  }

  return partial;
}
