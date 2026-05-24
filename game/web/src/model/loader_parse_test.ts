/**
 * Tests for the loader behavioral split: parseScenario + validateScenarioComplete.
 *
 * These tests verify that:
 *  - parseScenario accepts partial scenario JSON (terrain-only, no gameplay fields)
 *  - parseScenario still catches structural invariant violations at parse time
 *  - validateScenarioComplete rejects partial scenarios missing gameplay fields
 *  - validateScenarioComplete accepts fully-populated partial scenarios
 *  - loadScenario = validateScenarioComplete(parseScenario(json)) (regression guard)
 *
 * Run via Bazel: bazel test //game/web/src/model:loader_parse_test
 */

import { parseScenario, validateScenarioComplete, loadScenario } from "./loader.js";
import { test, assertEqual, assertThrows, assertDoesNotThrow, summarize } from "../testing/test_runner.js";

// ─── Minimal terrain-only fixture (no gameplay fields) ───────────────────────

function terrainOnlyScenario(overrides: Record<string, unknown> = {}): unknown {
  return {
    format_version: "1",
    id: "terrain-test-001",
    title: "Terrain Only",
    election_type: "congressional",
    region: { id: "r1", name: "Test Region" },
    geometry: { type: "hex_axial" },
    precincts: [
      { id: "p1", editable: true, position: { q: 0, r: 0 } },
      { id: "p2", editable: true, position: { q: 1, r: 0 } },
    ],
    terrain_tiles: [
      { position: { q: 2, r: 0 }, type: "mountain" },
    ],
    ...overrides,
  };
}

// ─── Full scenario fixture (everything present) ───────────────────────────────

function fullScenario(overrides: Record<string, unknown> = {}): unknown {
  return {
    format_version: "1",
    id: "full-test-001",
    title: "Full Test Scenario",
    election_type: "congressional",
    region: { id: "r1", name: "Test Region" },
    geometry: { type: "hex_axial" },
    parties: [
      { id: "blue", name: "Blue Party", abbreviation: "B" },
      { id: "red", name: "Red Party", abbreviation: "R" },
    ],
    districts: [
      { id: "d1", name: "District 1" },
      { id: "d2", name: "District 2" },
    ],
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          {
            id: "g1",
            population_share: 1.0,
            vote_shares: { blue: 0.6, red: 0.4 },
            turnout_rate: 0.7,
          },
        ],
      },
    ],
    events: [],
    rules: { population_tolerance: 0.05, contiguity: "required" },
    success_criteria: [],
    narrative: {
      character: { name: "Alex", role: "Commissioner", motivation: "Test" },
      intro_slides: [{ body: "Welcome" }],
      objective: "Draw districts",
    },
    ...overrides,
  };
}

// ─── parseScenario: happy path ────────────────────────────────────────────────

test("parseScenario: terrain-only JSON parses without error", () => {
  assertDoesNotThrow(() => parseScenario(terrainOnlyScenario()));
});

test("parseScenario: terrain-only result has no parties or districts", () => {
  const s = parseScenario(terrainOnlyScenario());
  assertEqual(s.parties, undefined);
  assertEqual(s.districts, undefined);
  assertEqual(s.events, undefined);
  assertEqual(s.rules, undefined);
  assertEqual(s.success_criteria, undefined);
  assertEqual(s.narrative, undefined);
});

test("parseScenario: terrain-only precincts lack total_population and demographic_groups", () => {
  const s = parseScenario(terrainOnlyScenario());
  assertEqual(s.precincts.length, 2);
  assertEqual(s.precincts[0]!.total_population, undefined);
  assertEqual(s.precincts[0]!.demographic_groups, undefined);
});

test("parseScenario: terrain_tiles preserved", () => {
  const s = parseScenario(terrainOnlyScenario());
  assertEqual(s.terrain_tiles?.length, 1);
  assertEqual(s.terrain_tiles?.[0]?.type, "mountain");
});

test("parseScenario: full JSON parses correctly", () => {
  const s = parseScenario(fullScenario());
  assertEqual(s.id, "full-test-001");
  assertEqual(s.parties?.length, 2);
  assertEqual(s.districts?.length, 2);
  assertEqual(s.precincts.length, 1);
  assertEqual(s.precincts[0]!.total_population, 1000);
  assertEqual(s.precincts[0]!.demographic_groups?.length, 1);
});

// ─── parseScenario: structural errors caught at parse time ────────────────────

test("parseScenario: rejects unknown format_version", () => {
  assertThrows(
    () => parseScenario({ ...terrainOnlyScenario() as object, format_version: "2" }),
    /format_version/,
  );
});

test("parseScenario: rejects missing id", () => {
  const s = terrainOnlyScenario() as Record<string, unknown>;
  delete s["id"];
  assertThrows(() => parseScenario(s), /id/);
});

test("parseScenario: rejects zero precincts (invariant 12)", () => {
  assertThrows(
    () => parseScenario({ ...terrainOnlyScenario() as object, precincts: [] }),
    /[Ii]nvariant 12/,
  );
});

test("parseScenario: rejects context precinct without initial_district_id (invariant 4)", () => {
  assertThrows(
    () => parseScenario({
      ...terrainOnlyScenario() as object,
      precincts: [{ id: "ctx", editable: false, position: { q: 0, r: 0 } }],
    }),
    /[Ii]nvariant 4/,
  );
});

test("parseScenario: catches duplicate IDs in present data (invariant 11)", () => {
  assertThrows(
    () => parseScenario({
      ...terrainOnlyScenario() as object,
      precincts: [
        { id: "p1", editable: true, position: { q: 0, r: 0 } },
        { id: "p1", editable: true, position: { q: 1, r: 0 } },
      ],
    }),
    /[Ii]nvariant 11/,
  );
});

test("parseScenario: hex_axial precinct with neighbors rejected (invariant 8)", () => {
  assertThrows(
    () => parseScenario({
      ...terrainOnlyScenario() as object,
      precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 }, neighbors: ["p2"] }],
    }),
    /[Ii]nvariant 8/,
  );
});

test("parseScenario: invalid terrain tile type rejected", () => {
  assertThrows(
    () => parseScenario({
      ...terrainOnlyScenario() as object,
      terrain_tiles: [{ position: { q: 2, r: 0 }, type: "swamp" }],
    }),
    /type/,
  );
});

test("parseScenario: terrain tile overlapping precinct rejected", () => {
  assertThrows(
    () => parseScenario({
      ...terrainOnlyScenario() as object,
      terrain_tiles: [{ position: { q: 0, r: 0 }, type: "mountain" }],
    }),
    /[Tt]errain/,
  );
});

// Conditional structural: when parties ARE present, party refs are checked
test("parseScenario: catches unknown party ref in demographic_groups when parties present", () => {
  assertThrows(
    () => parseScenario({
      ...fullScenario() as object,
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            {
              id: "g1",
              population_share: 1.0,
              vote_shares: { blue: 0.6, green: 0.4 },
              turnout_rate: 0.7,
            },
          ],
        },
      ],
    }),
    /[Ii]nvariant 1/,
  );
});

// ─── validateScenarioComplete: completeness checks ────────────────────────────

test("validateScenarioComplete: rejects terrain-only partial (no parties)", () => {
  const partial = parseScenario(terrainOnlyScenario());
  assertThrows(() => validateScenarioComplete(partial), /parties/i);
});

test("validateScenarioComplete: rejects partial with parties but no districts", () => {
  const partial = parseScenario({
    ...terrainOnlyScenario() as object,
    parties: [{ id: "blue", name: "Blue", abbreviation: "B" }],
  });
  assertThrows(() => validateScenarioComplete(partial), /district/i);
});

test("validateScenarioComplete: rejects partial with 1 district (invariant 10)", () => {
  const partial = parseScenario({
    ...terrainOnlyScenario() as object,
    parties: [{ id: "blue", name: "Blue", abbreviation: "B" }],
    districts: [{ id: "d1" }],
  });
  assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 10/);
});

test("validateScenarioComplete: rejects partial with missing total_population", () => {
  const partial = parseScenario({
    ...fullScenario() as object,
    precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 } }],
  });
  assertThrows(() => validateScenarioComplete(partial), /total_population/);
});

test("validateScenarioComplete: rejects partial missing demographic_groups", () => {
  const partial = parseScenario({
    ...fullScenario() as object,
    precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 }, total_population: 100 }],
  });
  assertThrows(() => validateScenarioComplete(partial), /demographic_groups/);
});

test("validateScenarioComplete: rejects partial missing rules", () => {
  const s = fullScenario() as Record<string, unknown>;
  delete s["rules"];
  const partial = parseScenario(s);
  assertThrows(() => validateScenarioComplete(partial), /rules/);
});

test("validateScenarioComplete: rejects partial missing narrative", () => {
  const s = fullScenario() as Record<string, unknown>;
  delete s["narrative"];
  const partial = parseScenario(s);
  assertThrows(() => validateScenarioComplete(partial), /narrative/);
});

test("validateScenarioComplete: rejects partial missing events", () => {
  const s = fullScenario() as Record<string, unknown>;
  delete s["events"];
  const partial = parseScenario(s);
  assertThrows(() => validateScenarioComplete(partial), /events/);
});

test("validateScenarioComplete: rejects partial missing success_criteria", () => {
  const s = fullScenario() as Record<string, unknown>;
  delete s["success_criteria"];
  const partial = parseScenario(s);
  assertThrows(() => validateScenarioComplete(partial), /success_criteria/);
});

test("validateScenarioComplete: rejects partial with empty parties array (length 0 branch)", () => {
  // Use precincts without demographic_groups so party-ref invariant (inv 1) does not fire at parse
  // time when parties:[] — the empty-parties completeness check in validateScenarioComplete fires instead.
  const partial = parseScenario({
    ...fullScenario() as object,
    parties: [],
    precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 } }],
  });
  assertThrows(() => validateScenarioComplete(partial), /parties/i);
});

test("validateScenarioComplete: accepts full partial, returns Scenario", () => {
  const partial = parseScenario(fullScenario());
  assertDoesNotThrow(() => validateScenarioComplete(partial));
  const scenario = validateScenarioComplete(partial);
  assertEqual(scenario.id, "full-test-001");
  assertEqual(scenario.parties.length, 2);
  assertEqual(scenario.districts.length, 2);
  assertEqual(scenario.precincts.length, 1);
});

test("validateScenarioComplete: auto-fills initial_district_id for editable precincts", () => {
  const partial = parseScenario(fullScenario());
  const scenario = validateScenarioComplete(partial);
  assertEqual(scenario.precincts[0]!.initial_district_id, "d1");
});

// ─── loadScenario regression guard ───────────────────────────────────────────

test("loadScenario: still works end-to-end (regression guard)", () => {
  assertDoesNotThrow(() => loadScenario(fullScenario()));
  const s = loadScenario(fullScenario());
  assertEqual(s.id, "full-test-001");
});

test("loadScenario: still rejects partial JSON missing required gameplay fields", () => {
  assertThrows(() => loadScenario(terrainOnlyScenario()), /parties|districts|narrative|rules/i);
});

summarize();
