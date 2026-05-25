/**
 * Tests for the terrain generator (GAME-084 Stage 1 pipeline).
 *
 * Covers:
 *   - Hex circle generation: count, sort order, edge cases
 *   - generateTerrain: produces valid PartialScenario structure
 *   - Terrain tiles: accepted, validated, placed in output
 *   - River edges: translated from position pairs to precinct-ID pairs
 *   - Error cases: overlapping terrain, non-precinct river endpoints, non-adjacent river pairs
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:terrain_generator_test
 */

import {
  generateTerrain,
  generateHexCircle,
  hexCircleSize,
} from "./terrain-generator.js";
import type { PipelineSpec } from "./spec-types.js";
import {
  test,
  assertEqual,
  assertThrows,
  assertDoesNotThrow,
  summarize,
} from "../testing/test_runner.js";

// ─── Spec fixtures ────────────────────────────────────────────────────────────

function minimalSpec(
  radius: number,
  overrides: Partial<PipelineSpec> = {},
): PipelineSpec {
  return {
    format_version: "1",
    scenario: {
      id: "test-001",
      title: "Test Scenario",
      election_type: "congressional",
      region: { id: "r1", name: "Test Region" },
    },
    map: { geometry: "hex_axial", shape: "hex_circle", radius },
    ...overrides,
  };
}

// ─── generateHexCircle ────────────────────────────────────────────────────────

test("generateHexCircle: R=0 produces single hex at origin", () => {
  const hexes = generateHexCircle(0);
  assertEqual(hexes.length, 1);
  assertEqual(hexes[0]!.q, 0);
  assertEqual(hexes[0]!.r, 0);
});

test("generateHexCircle: R=1 produces 7 hexes", () => {
  assertEqual(generateHexCircle(1).length, 7);
});

test("generateHexCircle: R=5 produces 91 hexes", () => {
  assertEqual(generateHexCircle(5).length, 91);
});

test("generateHexCircle: R=6 produces 127 hexes", () => {
  assertEqual(generateHexCircle(6).length, 127);
});

test("generateHexCircle: sorted by r ascending then q ascending", () => {
  const hexes = generateHexCircle(3);
  for (let i = 1; i < hexes.length; i++) {
    const prev = hexes[i - 1]!;
    const curr = hexes[i]!;
    const valid =
      curr.r > prev.r || (curr.r === prev.r && curr.q >= prev.q);
    assertEqual(valid, true);
  }
});

test("generateHexCircle: all positions satisfy hex circle invariant", () => {
  const R = 4;
  const hexes = generateHexCircle(R);
  for (const { q, r } of hexes) {
    const dist = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
    assertEqual(dist <= R, true);
  }
});

test("hexCircleSize: matches generateHexCircle length for R=0..6", () => {
  for (let R = 0; R <= 6; R++) {
    assertEqual(generateHexCircle(R).length, hexCircleSize(R));
  }
});

// ─── generateTerrain: basic structure ────────────────────────────────────────

test("generateTerrain: returns PartialScenario with correct metadata", () => {
  const s = generateTerrain(minimalSpec(1));
  assertEqual(s.format_version, "1");
  assertEqual(s.id, "test-001");
  assertEqual(s.title, "Test Scenario");
  assertEqual(s.election_type, "congressional");
  assertEqual(s.region.id, "r1");
  assertEqual(s.region.name, "Test Region");
  assertEqual(s.geometry.type, "hex_axial");
});

test("generateTerrain: R=5 produces 91 precincts", () => {
  const s = generateTerrain(minimalSpec(5));
  assertEqual(s.precincts.length, 91);
});

test("generateTerrain: precincts have no total_population or demographic_groups", () => {
  const s = generateTerrain(minimalSpec(2));
  for (const p of s.precincts) {
    assertEqual(p.total_population, undefined);
    assertEqual(p.demographic_groups, undefined);
  }
});

test("generateTerrain: precinct IDs are sequential p001..pNNN", () => {
  const s = generateTerrain(minimalSpec(1));
  const ids = s.precincts.map(p => p.id);
  assertEqual(ids[0], "p001");
  assertEqual(ids[6], "p007");
});

test("generateTerrain: precincts are editable by default", () => {
  const s = generateTerrain(minimalSpec(1));
  assertEqual(s.precincts.every(p => p.editable), true);
});

test("generateTerrain: no terrain_tiles field when spec has none", () => {
  const s = generateTerrain(minimalSpec(1));
  assertEqual(s.terrain_tiles, undefined);
});

test("generateTerrain: no river_edges field when spec has none", () => {
  const s = generateTerrain(minimalSpec(1));
  assertEqual(s.river_edges, undefined);
});

// ─── generateTerrain: terrain tiles ──────────────────────────────────────────

test("generateTerrain: terrain tiles appear in output", () => {
  const spec = minimalSpec(2, {
    terrain: {
      tiles: [{ q: 0, r: 3, type: "mountain" }],
    },
  });
  const s = generateTerrain(spec);
  assertEqual(s.terrain_tiles?.length, 1);
  assertEqual(s.terrain_tiles?.[0]?.type, "mountain");
  assertEqual(s.terrain_tiles?.[0]?.position.q, 0);
  assertEqual(s.terrain_tiles?.[0]?.position.r, 3);
});

test("generateTerrain: accepts mountain, sea, and lake tile types", () => {
  const spec = minimalSpec(3, {
    terrain: {
      tiles: [
        { q: 0, r: 4, type: "mountain" },
        { q: 1, r: 4, type: "sea" },
        { q: 2, r: 4, type: "lake" },
      ],
    },
  });
  const s = generateTerrain(spec);
  assertEqual(s.terrain_tiles?.length, 3);
});

test("generateTerrain: terrain tile overlapping precinct throws", () => {
  // R=2 hex circle includes (0,0); placing mountain there should fail
  const spec = minimalSpec(2, {
    terrain: { tiles: [{ q: 0, r: 0, type: "mountain" }] },
  });
  assertThrows(() => generateTerrain(spec), /overlap/i);
});

// ─── generateTerrain: river edges ────────────────────────────────────────────

test("generateTerrain: river edges translated to precinct ID pairs", () => {
  // R=1 hex; (0,0) and (1,0) are adjacent precincts
  // Sorted layout (r asc, q asc): r=-1: (0,-1),(1,-1); r=0: (-1,0),(0,0),(1,0); r=1: (-1,1),(0,1)
  // (0,0) is idx 3 (0-indexed) → p004; (1,0) is idx 4 → p005
  const spec = minimalSpec(1, {
    terrain: {
      river_edges: [[{ q: 0, r: 0 }, { q: 1, r: 0 }]],
    },
  });
  const s = generateTerrain(spec);
  assertEqual(s.river_edges?.length, 1);
  // Both IDs must be valid p0NN identifiers
  const [a, b] = s.river_edges![0]!;
  assertEqual(typeof a, "string");
  assertEqual(typeof b, "string");
  assertEqual(a !== b, true);
});

test("generateTerrain: river edge at non-precinct position throws", () => {
  // (0, 99) is outside the hex circle for R=1
  const spec = minimalSpec(1, {
    terrain: {
      river_edges: [[{ q: 0, r: 0 }, { q: 0, r: 99 }]],
    },
  });
  assertThrows(() => generateTerrain(spec), /not a precinct/i);
});

test("generateTerrain: river edge between non-adjacent positions throws", () => {
  // (0,0) and (0,2) are not adjacent in a hex grid
  const spec = minimalSpec(3, {
    terrain: {
      river_edges: [[{ q: 0, r: 0 }, { q: 0, r: 2 }]],
    },
  });
  assertThrows(() => generateTerrain(spec), /non-adjacent/i);
});

test("generateTerrain: river edge IDs correspond to correct positions", () => {
  // Verify the ID assigned to a known position
  const spec = minimalSpec(5);
  const s = generateTerrain(spec);
  // Build position→id map from output
  const posToId = new Map(
    s.precincts.map(p => {
      const pos = p.position as { q: number; r: number };
      return [`${pos.q},${pos.r}`, p.id];
    }),
  );
  // Now add a river between two known adjacent precincts
  const specWithRiver = minimalSpec(5, {
    terrain: {
      river_edges: [[{ q: 0, r: 0 }, { q: 1, r: 0 }]],
    },
  });
  const sWithRiver = generateTerrain(specWithRiver);
  const [aId, bId] = sWithRiver.river_edges![0]!;
  assertEqual(aId, posToId.get("0,0"));
  assertEqual(bId, posToId.get("1,0"));
});

summarize();
