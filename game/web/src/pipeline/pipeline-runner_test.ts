/**
 * Tests for the pipeline runner (GAME-084 wiring — all stages).
 *
 * Covers:
 *   runPipeline:
 *   - all four stages present → output has populated fields from each stage
 *   - population absent → precincts have no total_population
 *   - demographics absent → precincts have no demographic_groups
 *   - assembly absent → scenario has no parties or districts
 *   - demographics.county_labels absent → precincts have no county_id
 *   - demographics.county_labels empty → precincts have no county_id (no throw)
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:pipeline_runner_test
 */

import { runPipeline } from "./pipeline-runner.js";
import type { PipelineSpec } from "./spec-types.js";
import {
  test,
  assertEqual,
  summarize,
} from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function baseSpec(): PipelineSpec {
  return {
    format_version: "1",
    scenario: {
      id: "test-pipeline",
      title: "Pipeline Runner Test",
      election_type: "state_house",
      region: { id: "r1", name: "Test Region" },
    },
    map: { geometry: "hex_axial", shape: "hex_circle", radius: 2 },
  };
}

function withAllStages(): PipelineSpec {
  return {
    ...baseSpec(),
    population: { seed: 1, base: 1000, variance: 0 },
    demographics: {
      seed: 1,
      parties: ["ken", "ryu"],
      group: { id_suffix: "all" },
      turnout: { min: 0.6, max: 0.7 },
      jitter: 0.0,
      zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
      county_labels: [
        { id: "region_west", filter: { q_lte: 0 } },
        { id: "region_east", filter: { default: true } },
      ],
    },
    assembly: {
      parties: [
        { id: "ken", name: "Ken Party", abbreviation: "KEN" },
        { id: "ryu", name: "Ryu Party", abbreviation: "RYU" },
      ],
      districts: [
        { id: "d1", name: "District 1" },
        { id: "d2", name: "District 2" },
      ],
      rules: { population_tolerance: 0.10, contiguity: "required" },
      initial_district_rule: {
        type: "diagonal_strip",
        strips: [
          { max_k: 0, district: "d1" },
          { default: true, district: "d2" },
        ],
      },
      success_criteria: [
        {
          id: "sc1",
          required: true,
          description: "All districts in use.",
          criterion: { type: "district_count" },
        },
      ],
      narrative: {
        character: { name: "You", role: "Strategist", motivation: "Win." },
        intro_slides: [{ body: "Welcome." }],
        objective: "Draw fair districts.",
      },
    },
  };
}

// ─── All stages present ────────────────────────────────────────────────────────

test("runPipeline: all stages present — precincts have total_population", () => {
  const result = runPipeline(withAllStages());
  for (const p of result.precincts) {
    assertEqual(typeof p.total_population, "number");
  }
});

test("runPipeline: all stages present — precincts have demographic_groups", () => {
  const result = runPipeline(withAllStages());
  for (const p of result.precincts) {
    assertEqual((p.demographic_groups?.length ?? 0) > 0, true);
  }
});

test("runPipeline: all stages present — precincts have county_id", () => {
  const result = runPipeline(withAllStages());
  for (const p of result.precincts) {
    assertEqual(typeof p.county_id, "string");
  }
});

test("runPipeline: all stages present — scenario has parties and districts", () => {
  const result = runPipeline(withAllStages());
  assertEqual((result.parties?.length ?? 0) > 0, true);
  assertEqual((result.districts?.length ?? 0) > 0, true);
});

test("runPipeline: all stages present — precincts have initial_district_id", () => {
  const result = runPipeline(withAllStages());
  for (const p of result.precincts) {
    assertEqual(typeof p.initial_district_id, "string");
  }
});

// ─── Absent stages ────────────────────────────────────────────────────────────

test("runPipeline: population absent — precincts have no total_population", () => {
  const spec: PipelineSpec = { ...baseSpec() };
  const result = runPipeline(spec);
  for (const p of result.precincts) {
    assertEqual(p.total_population, undefined);
  }
});

test("runPipeline: demographics absent — precincts have no demographic_groups", () => {
  const spec: PipelineSpec = {
    ...baseSpec(),
    population: { seed: 1, base: 1000, variance: 0 },
  };
  const result = runPipeline(spec);
  for (const p of result.precincts) {
    assertEqual(p.demographic_groups, undefined);
  }
});

test("runPipeline: assembly absent — scenario has no parties", () => {
  const spec: PipelineSpec = {
    ...baseSpec(),
    population: { seed: 1, base: 1000, variance: 0 },
    demographics: {
      seed: 1,
      parties: ["ken", "ryu"],
      group: { id_suffix: "all" },
      turnout: { min: 0.6, max: 0.7 },
      jitter: 0.0,
      zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
    },
  };
  const result = runPipeline(spec);
  assertEqual(result.parties, undefined);
  assertEqual(result.districts, undefined);
});

test("runPipeline: county_labels absent — precincts have no county_id", () => {
  const spec: PipelineSpec = {
    ...baseSpec(),
    demographics: {
      seed: 1,
      parties: ["ken", "ryu"],
      group: { id_suffix: "all" },
      turnout: { min: 0.6, max: 0.7 },
      jitter: 0.0,
      zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
    },
  };
  const result = runPipeline(spec);
  for (const p of result.precincts) {
    assertEqual(p.county_id, undefined);
  }
});

test("runPipeline: county_labels empty array — precincts have no county_id, no throw", () => {
  const spec: PipelineSpec = {
    ...baseSpec(),
    demographics: {
      seed: 1,
      parties: ["ken", "ryu"],
      group: { id_suffix: "all" },
      turnout: { min: 0.6, max: 0.7 },
      jitter: 0.0,
      zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
      county_labels: [],
    },
  };
  const result = runPipeline(spec);
  for (const p of result.precincts) {
    assertEqual(p.county_id, undefined);
  }
});

summarize();
