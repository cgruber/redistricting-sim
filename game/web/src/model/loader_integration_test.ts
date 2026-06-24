/**
 * Integration tests: load every real scenario JSON file through loadScenario.
 *
 * These tests guard against loader regressions that unit tests with synthetic
 * fixtures would miss — they exercise the full parser+validator on actual game
 * content.
 *
 * Run via Bazel: bazel test //game/web/src/model:loader_integration_test
 */

import { readFileSync } from "fs";
import { join } from "path";
import { loadScenario } from "./loader.js";
import { test, assertEqual, assertDoesNotThrow, summarize } from "../testing/test_runner.js";

// ─── Runfiles path resolution ─────────────────────────────────────────────────

function scenarioPath(filename: string): string {
  // Bazel js_test sets RUNFILES_DIR; files are under _main/<workspace-relative-path>.
  const runfiles = process.env["RUNFILES_DIR"];
  if (!runfiles) throw new Error("RUNFILES_DIR not set — must run via bazel test");
  // Try _main canonical name (Bazel ≥ 7) first, then bare runfiles root.
  for (const prefix of ["_main", ""]) {
    const p = prefix
      ? join(runfiles, prefix, "game", "scenarios", filename)
      : join(runfiles, "game", "scenarios", filename);
    try {
      readFileSync(p);
      return p;
    } catch {
      // try next prefix
    }
  }
  throw new Error(`Scenario file not found in runfiles: ${filename}`);
}

function loadJson(filename: string): unknown {
  return JSON.parse(readFileSync(scenarioPath(filename), "utf8"));
}

// ─── Scenario metadata table ──────────────────────────────────────────────────

const SCENARIOS: { file: string; id: string; precincts: number; districts: number }[] = [
  { file: "tutorial-001.json",  id: "tutorial-001",  precincts: 37,  districts: 2 },
  { file: "tutorial-002.json",  id: "tutorial-002",  precincts: 196, districts: 3 },
  { file: "tutorial-003.json",  id: "tutorial-003",  precincts: 119, districts: 4 },
  { file: "scenario-002.json",  id: "scenario-002",  precincts: 91,  districts: 4 },
  { file: "scenario-003.json",  id: "scenario-003",  precincts: 127, districts: 5 },
  { file: "scenario-004.json",  id: "scenario-004",  precincts: 127, districts: 5 },
  { file: "scenario-005.json",  id: "scenario-005",  precincts: 127, districts: 5 },
  { file: "scenario-006.json",  id: "scenario-006",  precincts: 127, districts: 5 },
  { file: "scenario-007.json",  id: "scenario-007",  precincts: 127, districts: 5 },
  { file: "scenario-008.json",  id: "scenario-008",  precincts: 127, districts: 5 },
  { file: "scenario-009.json",  id: "scenario-009",  precincts: 127, districts: 5 },
];

// ─── Per-scenario tests ───────────────────────────────────────────────────────

for (const { file, id, precincts, districts } of SCENARIOS) {
  test(`${id}: loads and validates without error`, () => {
    assertDoesNotThrow(() => loadScenario(loadJson(file)), `loadScenario(${file})`);
  });

  test(`${id}: precinct count = ${precincts}`, () => {
    const scenario = loadScenario(loadJson(file));
    assertEqual(scenario.precincts.length, precincts);
  });

  test(`${id}: district count = ${districts}`, () => {
    const scenario = loadScenario(loadJson(file));
    assertEqual(scenario.districts.length, districts);
  });

  test(`${id}: scenario id matches filename`, () => {
    const scenario = loadScenario(loadJson(file));
    assertEqual(scenario.id, id as typeof scenario.id);
  });

  test(`${id}: all editable precincts have initial_district_id resolved`, () => {
    const scenario = loadScenario(loadJson(file));
    for (const pc of scenario.precincts) {
      if (pc.editable) {
        if (pc.initial_district_id === undefined || pc.initial_district_id === null) {
          throw new Error(`Editable precinct "${pc.id}" has unresolved initial_district_id`);
        }
      }
    }
  });
}

summarize();
