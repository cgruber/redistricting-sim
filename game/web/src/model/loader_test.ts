/**
 * Unit tests for loadScenario.
 *
 * Uses the shared TAP runner from //web/src/testing:test_runner_lib.
 * Run via Bazel: bazel test //web/src/model:loader_test
 *
 * Coverage:
 *  - Happy path: valid scenario passes
 *  - format_version rejection
 *  - One test per invariant violation (invariants 1–12)
 *  - Auto-fill: absent initial_district_id → default_district_id
 *  - Auto-fill: null initial_district_id → districts[0]
 *  - Auto-fill: absent initial_district_id → districts[0] (no default_district_id)
 *  - Context precinct (editable: false) validation
 */

import { loadScenario } from "./loader.js";
import { test, assertEqual, assertThrows, assertDoesNotThrow, summarize } from "../testing/test_runner.js";

// ─── Minimal valid scenario factory ──────────────────────────────────────────

function minimalScenario(overrides: Record<string, unknown> = {}): unknown {
  return {
    format_version: "1",
    id: "test-scenario-001",
    title: "Test Scenario",
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
    rules: {
      population_tolerance: 0.05,
      contiguity: "required",
    },
    success_criteria: [],
    narrative: {
      character: { name: "Alex", role: "Mapmaker", motivation: "Fair districts" },
      intro_slides: [{ body: "Welcome!" }],
      objective: "Draw 2 fair districts",
    },
    ...overrides,
  };
}

// ─── Happy path ───────────────────────────────────────────────────────────────

test("happy path: valid scenario passes and returns typed Scenario", () => {
  const result = loadScenario(minimalScenario());
  assertEqual(result.format_version, "1");
  assertEqual(result.id, "test-scenario-001" as typeof result.id);
  assertEqual(result.parties.length, 2);
  assertEqual(result.districts.length, 2);
  assertEqual(result.precincts.length, 1);
});

// ─── format_version ───────────────────────────────────────────────────────────

test("rejects unknown format_version", () => {
  assertThrows(
    () => loadScenario(minimalScenario({ format_version: "2" })),
    /format_version.*unknown version/
  );
});

test("rejects missing format_version", () => {
  const raw = JSON.parse(JSON.stringify(minimalScenario())) as Record<string, unknown>;
  delete raw["format_version"];
  assertThrows(() => loadScenario(raw), /format_version/);
});

// ─── Invariant 12: precincts.length ≥ 1 ─────────────────────────────────────

test("Invariant 12: rejects empty precincts array", () => {
  assertThrows(
    () => loadScenario(minimalScenario({ precincts: [] })),
    /Invariant 12/
  );
});

// ─── Invariant 10: districts.length ≥ 2 ─────────────────────────────────────

test("Invariant 10: rejects fewer than 2 districts", () => {
  assertThrows(
    () => loadScenario(minimalScenario({ districts: [{ id: "d1", name: "Only" }] })),
    /Invariant 10/
  );
});

// ─── Invariant 11: All IDs unique within scenario ────────────────────────────

test("Invariant 11: rejects duplicate district ids", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      districts: [
        { id: "d1", name: "District 1" },
        { id: "d1", name: "District 1 Duplicate" },
      ],
    })),
    /Invariant 11.*duplicate id.*d1/
  );
});

test("Invariant 11: rejects duplicate precinct ids", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 500,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
        {
          id: "p1",
          editable: true,
          position: { q: 1, r: 0 },
          total_population: 500,
          demographic_groups: [
            { id: "g2", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 11.*duplicate id.*p1/
  );
});

test("Invariant 11: rejects duplicate group ids within a precinct", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 0.5, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
            { id: "g1", population_share: 0.5, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 11.*duplicate id.*g1/
  );
});

test("Invariant 11: rejects party id that duplicates precinct id", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      parties: [
        { id: "p1", name: "Party P1", abbreviation: "P1" }, // clashes with precinct id "p1"
        { id: "red", name: "Red Party", abbreviation: "R" },
      ],
    })),
    /Invariant 11.*duplicate id.*p1/
  );
});

test("Invariant 11: rejects duplicate group id across different precincts", () => {
  // Two distinct precincts both declaring a group with the same GroupId —
  // the spec requires all ids unique within the scenario (not just per-precinct).
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "shared_group", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
        {
          id: "p2",
          editable: true,
          position: { q: 1, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "shared_group", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 11.*duplicate id.*shared_group/
  );
});

// ─── Invariant 5: sum(population_shares) == 1.0 per precinct ─────────────────

test("Invariant 5: rejects precinct with population_share sum != 1.0", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 0.6, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
            { id: "g2", population_share: 0.6, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 5.*p1/
  );
});

// ─── Invariant 6: sum(vote_shares) == 1.0 per group; all parties present ──────

test("Invariant 6: rejects group with vote_shares not summing to 1.0", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.3, red: 0.3 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 6.*p1.*g1/
  );
});

test("Invariant 6: rejects group missing a party in vote_shares", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 1.0 }, turnout_rate: 0.7 },
          ],
        },
      ],
    })),
    /Invariant 6.*p1.*g1.*missing vote_share.*red/
  );
});

// ─── Invariant 1: All PartyId refs exist in scenario.parties ──────────────────

test("Invariant 1: rejects event with unknown party ref", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      events: [
        {
          id: "ev1",
          type: "vote_share_shift",
          group_filter: { group_ids: ["g1"] },
          party: "green",
          delta: 0.1,
        },
      ],
    })),
    /Invariant 1.*event.*ev1.*green/
  );
});

test("Invariant 1: rejects criterion with unknown party ref", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      success_criteria: [
        {
          id: "c1",
          required: true,
          description: "Win seats",
          criterion: { type: "seat_count", party: "purple", operator: "gte", count: 1 },
        },
      ],
    })),
    /Invariant 1.*criterion.*c1.*purple/
  );
});

// ─── Invariant 2: All DistrictId refs in initial_district_id exist ────────────

test("Invariant 2: rejects precinct with unknown initial_district_id", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          initial_district_id: "d99",
        },
      ],
    })),
    /Invariant 2.*p1.*d99/
  );
});

// ─── Invariant 3: All GroupId refs in events/criteria exist in ≥1 precinct ───

test("Invariant 3: rejects event group_filter with unknown GroupId", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      events: [
        {
          id: "ev1",
          type: "turnout_shift",
          group_filter: { group_ids: ["g99"] },
          magnitude: 0.1,
        },
      ],
    })),
    /Invariant 3.*ev1.*g99/
  );
});

test("Invariant 3: rejects majority_minority criterion with unknown GroupId in group_filter", () => {
  // group_filter.group_ids contains a GroupId not present in any precinct's demographic_groups.
  assertThrows(
    () => loadScenario(minimalScenario({
      success_criteria: [
        {
          id: "c1",
          required: true,
          description: "Majority-minority district",
          criterion: {
            type: "majority_minority",
            group_filter: { group_ids: ["nonexistent_group"] },
            min_eligible_share: 0.5,
            min_districts: 1,
          },
        },
      ],
    })),
    /Invariant 3.*c1.*nonexistent_group/
  );
});

// ─── Invariant 4: Context precinct must have non-null initial_district_id ──────

test("Invariant 4: rejects context precinct with absent initial_district_id", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: false,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          // no initial_district_id
        },
      ],
    })),
    /Invariant 4.*p1/
  );
});

test("Invariant 4: rejects context precinct with null initial_district_id", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      precincts: [
        {
          id: "p1",
          editable: false,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          initial_district_id: null,
        },
      ],
    })),
    /Invariant 4.*p1/
  );
});

// ─── Invariant 8: hex_axial → no neighbors; custom → neighbors + symmetric ───

test("Invariant 8: hex_axial rejects precinct with neighbors field", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      geometry: { type: "hex_axial" },
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          neighbors: [],
        },
      ],
    })),
    /Invariant 8.*hex_axial.*p1/
  );
});

test("Invariant 8: custom geometry rejects precinct without neighbors field", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      geometry: { type: "custom" },
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { x: 0, y: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          // neighbors absent
        },
      ],
    })),
    /Invariant 8.*custom.*p1/
  );
});

test("Invariant 8: custom geometry rejects asymmetric neighbors", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      geometry: { type: "custom" },
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { x: 0, y: 0 },
          total_population: 500,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          neighbors: ["p2"],
        },
        {
          id: "p2",
          editable: true,
          position: { x: 1, y: 0 },
          total_population: 500,
          demographic_groups: [
            { id: "g2", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          neighbors: [], // does not include p1 → asymmetric
        },
      ],
    })),
    /Invariant 8.*symmetric.*p1.*p2/
  );
});

// ─── Invariant 9: custom geometry: PrecinctIds in neighbors[] exist ───────────

test("Invariant 9: custom geometry rejects unknown precinct in neighbors", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      geometry: { type: "custom" },
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { x: 0, y: 0 },
          total_population: 1000,
          demographic_groups: [
            { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
          ],
          neighbors: ["p99"],
        },
      ],
    })),
    /Invariant 9.*p1.*p99/
  );
});

// ─── Invariant 7: group_schema completeness ───────────────────────────────────

test("Invariant 7: rejects precinct missing group for a dimension combo", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      group_schema: {
        dimensions: { age: ["young", "old"] },
        eligibility_rules: [],
      },
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
              dimensions: { age: "young" },
              // missing age=old group
            },
          ],
        },
      ],
    })),
    /Invariant 7.*p1.*age=old/
  );
});

test("Invariant 7: rejects group missing a required dimension", () => {
  assertThrows(
    () => loadScenario(minimalScenario({
      group_schema: {
        dimensions: { age: ["young", "old"] },
        eligibility_rules: [],
      },
      precincts: [
        {
          id: "p1",
          editable: true,
          position: { q: 0, r: 0 },
          total_population: 1000,
          demographic_groups: [
            {
              id: "g_young",
              population_share: 0.5,
              vote_shares: { blue: 0.6, red: 0.4 },
              turnout_rate: 0.7,
              dimensions: { age: "young" },
            },
            {
              id: "g_old",
              population_share: 0.5,
              vote_shares: { blue: 0.6, red: 0.4 },
              turnout_rate: 0.7,
              // dimensions absent → missing "age"
            },
          ],
        },
      ],
    })),
    /Invariant 7.*p1.*g_old.*age/
  );
});

// ─── Auto-fill behavior ────────────────────────────────────────────────────────

test("auto-fill: absent initial_district_id on editable precinct → districts[0]", () => {
  const result = loadScenario(minimalScenario());
  assertEqual(result.precincts[0]?.initial_district_id, "d1" as typeof result.precincts[0]["initial_district_id"]);
});

test("auto-fill: null initial_district_id on editable precinct → districts[0]", () => {
  const result = loadScenario(minimalScenario({
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
        ],
        initial_district_id: null,
      },
    ],
  }));
  assertEqual(result.precincts[0]?.initial_district_id, "d1" as typeof result.precincts[0]["initial_district_id"]);
});

test("auto-fill: absent initial_district_id → default_district_id when set", () => {
  const result = loadScenario(minimalScenario({
    default_district_id: "d2",
  }));
  assertEqual(result.precincts[0]?.initial_district_id, "d2" as typeof result.precincts[0]["initial_district_id"]);
});

test("auto-fill: explicit initial_district_id is preserved (not overwritten)", () => {
  const result = loadScenario(minimalScenario({
    default_district_id: "d2",
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
        ],
        initial_district_id: "d1",
      },
    ],
  }));
  assertEqual(result.precincts[0]?.initial_district_id, "d1" as typeof result.precincts[0]["initial_district_id"]);
});

test("context precinct: valid initial_district_id is preserved unchanged", () => {
  const result = loadScenario(minimalScenario({
    precincts: [
      {
        id: "p1",
        editable: false,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
        ],
        initial_district_id: "d2",
      },
    ],
  }));
  assertEqual(result.precincts[0]?.initial_district_id, "d2" as typeof result.precincts[0]["initial_district_id"]);
});

// ─── Custom geometry: valid case ──────────────────────────────────────────────

test("custom geometry: valid symmetric neighbors passes", () => {
  assertDoesNotThrow(() => loadScenario(minimalScenario({
    geometry: { type: "custom" },
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { x: 0, y: 0 },
        total_population: 500,
        demographic_groups: [
          { id: "g1", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
        ],
        neighbors: ["p2"],
      },
      {
        id: "p2",
        editable: true,
        position: { x: 1, y: 0 },
        total_population: 500,
        demographic_groups: [
          { id: "g2", population_share: 1.0, vote_shares: { blue: 0.6, red: 0.4 }, turnout_rate: 0.7 },
        ],
        neighbors: ["p1"],
      },
    ],
  })));
});

// ─── group_schema: valid completeness passes ──────────────────────────────────

test("group_schema: valid completeness passes", () => {
  const result = loadScenario(minimalScenario({
    group_schema: {
      dimensions: { age: ["young", "old"] },
      eligibility_rules: [],
    },
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          {
            id: "g_young",
            population_share: 0.5,
            vote_shares: { blue: 0.6, red: 0.4 },
            turnout_rate: 0.7,
            dimensions: { age: "young" },
          },
          {
            id: "g_old",
            population_share: 0.5,
            vote_shares: { blue: 0.6, red: 0.4 },
            turnout_rate: 0.7,
            dimensions: { age: "old" },
          },
        ],
      },
    ],
  }));
  assertEqual(result.group_schema?.dimensions["age"]?.length, 2);
});

// ─── Events with valid refs pass ──────────────────────────────────────────────

test("events with valid group_ids filter refs pass", () => {
  const result = loadScenario(minimalScenario({
    events: [
      {
        id: "ev1",
        type: "turnout_shift",
        group_filter: { group_ids: ["g1"] },
        magnitude: 0.05,
      },
    ],
  }));
  assertEqual(result.events.length, 1);
});

test("events with dimension group_filter (no group_ids) pass without group existence check", () => {
  const result = loadScenario(minimalScenario({
    group_schema: {
      dimensions: { age: ["young", "old"] },
      eligibility_rules: [],
    },
    precincts: [
      {
        id: "p1",
        editable: true,
        position: { q: 0, r: 0 },
        total_population: 1000,
        demographic_groups: [
          {
            id: "g_young",
            population_share: 0.5,
            vote_shares: { blue: 0.6, red: 0.4 },
            turnout_rate: 0.7,
            dimensions: { age: "young" },
          },
          {
            id: "g_old",
            population_share: 0.5,
            vote_shares: { blue: 0.6, red: 0.4 },
            turnout_rate: 0.7,
            dimensions: { age: "old" },
          },
        ],
      },
    ],
    events: [
      {
        id: "ev1",
        type: "turnout_shift",
        group_filter: { dimension: "age", value: "young" },
        magnitude: 0.05,
      },
    ],
  }));
  assertEqual(result.events.length, 1);
});

summarize();
