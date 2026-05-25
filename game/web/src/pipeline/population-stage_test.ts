/**
 * Tests for the population stage (GAME-084 Stage 2 pipeline).
 *
 * Covers:
 *   - All precincts receive total_population
 *   - Values are integers in [base - variance, base + variance]
 *   - Determinism: same spec → same output
 *   - Overwrite semantics: existing total_population is replaced
 *   - Input PartialScenario is not mutated
 *   - Different seeds → different populations
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:population_stage_test
 */

import { populateScenario } from "./population-stage.js";
import { generateTerrain } from "./terrain-generator.js";
import type { PipelineSpec, PopulationSpec } from "./spec-types.js";
import type { PartialScenario } from "../model/scenario.js";
import {
  test,
  assertEqual,
  summarize,
} from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function minimalTerrainSpec(radius: number): PipelineSpec {
  return {
    format_version: "1",
    scenario: {
      id: "test-001",
      title: "Test",
      election_type: "congressional",
      region: { id: "r1", name: "Test Region" },
    },
    map: { geometry: "hex_axial", shape: "hex_circle", radius },
  };
}

function basePopSpec(overrides: Partial<PopulationSpec> = {}): PopulationSpec {
  return { seed: 42, base: 1000, variance: 100, ...overrides };
}

function makePartial(radius: number): PartialScenario {
  return generateTerrain(minimalTerrainSpec(radius));
}

// ─── Basic population assignment ──────────────────────────────────────────────

test("populateScenario: all precincts receive total_population", () => {
  const partial = makePartial(3);
  const result = populateScenario(partial, basePopSpec());
  assertEqual(result.precincts.every(p => p.total_population !== undefined), true);
});

test("populateScenario: precinct count is unchanged", () => {
  const partial = makePartial(5);
  const result = populateScenario(partial, basePopSpec());
  assertEqual(result.precincts.length, partial.precincts.length);
});

test("populateScenario: total_population values are integers", () => {
  const partial = makePartial(2);
  const result = populateScenario(partial, basePopSpec());
  for (const p of result.precincts) {
    assertEqual(Number.isInteger(p.total_population!), true);
  }
});

test("populateScenario: total_population within [base - variance, base + variance]", () => {
  const spec = basePopSpec({ base: 1500, variance: 150 });
  const partial = makePartial(5);
  const result = populateScenario(partial, spec);
  for (const p of result.precincts) {
    assertEqual(p.total_population! >= 1350, true);
    assertEqual(p.total_population! <= 1650, true);
  }
});

// ─── Determinism ──────────────────────────────────────────────────────────────

test("populateScenario: same spec produces same populations", () => {
  const partial = makePartial(3);
  const spec = basePopSpec({ seed: 7 });
  const a = populateScenario(partial, spec);
  const b = populateScenario(partial, spec);
  const aVals = a.precincts.map(p => p.total_population);
  const bVals = b.precincts.map(p => p.total_population);
  for (let i = 0; i < aVals.length; i++) {
    assertEqual(aVals[i], bVals[i]);
  }
});

test("populateScenario: different seeds produce different populations", () => {
  const partial = makePartial(5);
  const a = populateScenario(partial, basePopSpec({ seed: 1 }));
  const b = populateScenario(partial, basePopSpec({ seed: 2 }));
  const aVals = a.precincts.map(p => p.total_population);
  const bVals = b.precincts.map(p => p.total_population);
  const anyDiff = aVals.some((v, i) => v !== bVals[i]);
  assertEqual(anyDiff, true);
});

// ─── Overwrite semantics ──────────────────────────────────────────────────────

test("populateScenario: overwrites existing total_population", () => {
  const partial = makePartial(1);
  // Pre-populate with sentinel value 99999
  const prePopulated: PartialScenario = {
    ...partial,
    precincts: partial.precincts.map(p => ({ ...p, total_population: 99999 })),
  };
  const result = populateScenario(prePopulated, basePopSpec());
  // All sentinels should be gone
  assertEqual(result.precincts.every(p => p.total_population !== 99999), true);
});

// ─── Immutability ─────────────────────────────────────────────────────────────

test("populateScenario: does not mutate input PartialScenario", () => {
  const partial = makePartial(2);
  // Snapshot IDs and positions before
  const beforeIds = partial.precincts.map(p => p.id);
  populateScenario(partial, basePopSpec());
  // Original precincts unchanged
  for (let i = 0; i < beforeIds.length; i++) {
    assertEqual(partial.precincts[i]!.id, beforeIds[i]);
    assertEqual(partial.precincts[i]!.total_population, undefined);
  }
});

// ─── Metadata passthrough ─────────────────────────────────────────────────────

test("populateScenario: metadata fields are preserved unchanged", () => {
  const partial = makePartial(1);
  const result = populateScenario(partial, basePopSpec());
  assertEqual(result.format_version, partial.format_version);
  assertEqual(result.id, partial.id);
  assertEqual(result.title, partial.title);
  assertEqual(result.election_type, partial.election_type);
  assertEqual(result.geometry.type, partial.geometry.type);
});

summarize();
