/**
 * Tests for the population stage (GAME-087 terrain-aware population).
 *
 * Covers:
 *   - All precincts receive total_population
 *   - Values are integers in [base - variance, base + variance] (flat map, no terrain)
 *   - Determinism: same spec → same output
 *   - Overwrite semantics: existing total_population is replaced
 *   - Input PartialScenario is not mutated
 *   - Different seeds → different populations
 *   - Terrain suitability ordering (lakeside > flat > mountain_adjacent)
 *   - Riverside precincts get higher population than flat precincts
 *   - Multiple terrain features compose multiplicatively
 *   - Custom terrain_weights override defaults
 *   - Settlement Gaussian bumps: center highest, monotone falloff
 *   - All anchor types resolve without throwing
 *   - Multiple settlements accumulate correctly
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:population_stage_test
 */

import { populateScenario, hexDist } from "./population-stage.js";
import { generateTerrain } from "./terrain-generator.js";
import type { PipelineSpec, PopulationSpec, SettlementSpec } from "./spec-types.js";
import type { PartialScenario, PrecinctId, ScenarioId, RegionId } from "../model/scenario.js";
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

test("populateScenario: (flat map, no terrain) total_population within [base - variance, base + variance]", () => {
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

// ─── Terrain fixtures ─────────────────────────────────────────────────────────

// Builds a minimal PartialScenario with 3 distinct terrain contexts:
//   p001 at (0,0): flat (no terrain features)
//   p002 at (2,0): lakeside (adjacent to lake tile at (3,0))
//   p003 at (0,2): mountain_adjacent (adjacent to mountain tile at (0,3))
function makeTerrainPartial(): PartialScenario {
  return {
    format_version: "1",
    id: "terrain-test" as unknown as ScenarioId,
    title: "Terrain Test",
    election_type: "congressional",
    region: { id: "r1" as unknown as RegionId, name: "R" },
    geometry: { type: "hex_axial" },
    precincts: [
      { id: "p001" as PrecinctId, editable: true, position: { q: 0, r: 0 } },
      { id: "p002" as PrecinctId, editable: true, position: { q: 2, r: 0 } },
      { id: "p003" as PrecinctId, editable: true, position: { q: 0, r: 2 } },
    ],
    terrain_tiles: [
      { position: { q: 3, r: 0 }, type: "lake" },
      { position: { q: 0, r: 3 }, type: "mountain" },
    ],
  };
}

// Builds a PartialScenario with two precincts sharing a river edge.
//   p001 at (0,0): riverside
//   p002 at (1,0): riverside
//   p003 at (-2,0): flat (not adjacent to any terrain, not in any river edge)
function makeRiverPartial(): PartialScenario {
  return {
    format_version: "1",
    id: "river-test" as unknown as ScenarioId,
    title: "River Test",
    election_type: "congressional",
    region: { id: "r1" as unknown as RegionId, name: "R" },
    geometry: { type: "hex_axial" },
    precincts: [
      { id: "p001" as PrecinctId, editable: true, position: { q: 0, r: 0 } },
      { id: "p002" as PrecinctId, editable: true, position: { q: 1, r: 0 } },
      { id: "p003" as PrecinctId, editable: true, position: { q: -2, r: 0 } },
    ],
    river_edges: [["p001" as PrecinctId, "p002" as PrecinctId]],
  };
}

// Builds a PartialScenario with a coastal precinct.
//   p001 at (0,0): flat
//   p002 at (2,0): coastal (adjacent to sea tile at (3,0))
function makeCoastalPartial(): PartialScenario {
  return {
    format_version: "1",
    id: "coastal-test" as unknown as ScenarioId,
    title: "Coastal Test",
    election_type: "congressional",
    region: { id: "r1" as unknown as RegionId, name: "R" },
    geometry: { type: "hex_axial" },
    precincts: [
      { id: "p001" as PrecinctId, editable: true, position: { q: 0, r: 0 } },
      { id: "p002" as PrecinctId, editable: true, position: { q: 2, r: 0 } },
    ],
    terrain_tiles: [{ position: { q: 3, r: 0 }, type: "sea" }],
  };
}

// Builds a PartialScenario for composability testing (multiple terrain features).
// Lake tile at (3,-1) is adjacent to both (2,0) and (2,-1).
//   p001 at (0,0): flat
//   p002 at (2,-1): lakeside only (adjacent to lake at (3,-1))
//   p003 at (2,0): lakeside+riverside (adjacent to lake at (3,-1), river edge with p004)
//   p004 at (1,0): riverside only (river edge with p003, not adjacent to lake)
function makeComposabilityPartial(): PartialScenario {
  return {
    format_version: "1",
    id: "compose-test" as unknown as ScenarioId,
    title: "Composability Test",
    election_type: "congressional",
    region: { id: "r1" as unknown as RegionId, name: "R" },
    geometry: { type: "hex_axial" },
    precincts: [
      { id: "p001" as PrecinctId, editable: true, position: { q: 0, r: 0 } },
      { id: "p002" as PrecinctId, editable: true, position: { q: 2, r: -1 } },
      { id: "p003" as PrecinctId, editable: true, position: { q: 2, r: 0 } },
      { id: "p004" as PrecinctId, editable: true, position: { q: 1, r: 0 } },
    ],
    terrain_tiles: [{ position: { q: 3, r: -1 }, type: "lake" }],
    river_edges: [["p003" as PrecinctId, "p004" as PrecinctId]],
  };
}

// ─── Terrain suitability ordering ─────────────────────────────────────────────

test("terrain: lakeside precinct has higher population than flat precinct", () => {
  const spec = basePopSpec({ base: 10000, variance: 50 });
  const partial = makeTerrainPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const lakeside = result.precincts.find(p => p.id === "p002")!;
  // lakeside suitability = 1.4 → expect ~14000 vs ~10000
  assertEqual(lakeside.total_population! > flat.total_population!, true);
});

test("terrain: mountain_adjacent precinct has lower population than flat precinct", () => {
  const spec = basePopSpec({ base: 10000, variance: 50 });
  const partial = makeTerrainPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const mountain = result.precincts.find(p => p.id === "p003")!;
  // mountain suitability = 0.5 → expect ~5000 vs ~10000
  assertEqual(flat.total_population! > mountain.total_population!, true);
});

test("terrain: riverside precinct has higher population than flat precinct", () => {
  const spec = basePopSpec({ base: 10000, variance: 50 });
  const partial = makeRiverPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p003")!;
  const riverside = result.precincts.find(p => p.id === "p001")!;
  // riverside suitability = 1.3 → expect ~13000 vs ~10000
  assertEqual(riverside.total_population! > flat.total_population!, true);
});

test("terrain: composability — lakeside+riverside multiplies both weights", () => {
  const spec = basePopSpec({ base: 10000, variance: 10 });
  const result = populateScenario(makeComposabilityPartial(), spec);
  // p002: lakeside only (suitability = 1.4 → ~14000)
  // p003: lakeside+riverside (suitability = 1.4 × 1.3 = 1.82 → ~18200)
  const lakeside = result.precincts.find(p => p.id === "p002")!;
  const lakeRiver = result.precincts.find(p => p.id === "p003")!;
  assertEqual(lakeRiver.total_population! > lakeside.total_population!, true);
});

test("terrain: default lakeside weight is 1.4× flat (AC2 defaults)", () => {
  // Pins the specific default multiplier so refactoring DEFAULT_TERRAIN_WEIGHTS is caught.
  // base=10000, variance=10 makes jitter noise (~±0.1%) negligible vs the 1.4× signal.
  const spec = basePopSpec({ base: 10000, variance: 10 });
  const partial = makeTerrainPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const lakeside = result.precincts.find(p => p.id === "p002")!;
  const ratio = lakeside.total_population! / flat.total_population!;
  assertEqual(ratio > 1.35, true);
  assertEqual(ratio < 1.45, true);
});

test("terrain: default mountain_adjacent weight is 0.5× flat (AC2 defaults)", () => {
  const spec = basePopSpec({ base: 10000, variance: 10 });
  const partial = makeTerrainPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const mountain = result.precincts.find(p => p.id === "p003")!;
  const ratio = mountain.total_population! / flat.total_population!;
  assertEqual(ratio > 0.45, true);
  assertEqual(ratio < 0.55, true);
});

test("terrain: default coastal weight is 0.9× flat (AC2 defaults)", () => {
  const spec = basePopSpec({ base: 10000, variance: 10 });
  const partial = makeCoastalPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const coastal = result.precincts.find(p => p.id === "p002")!;
  const ratio = coastal.total_population! / flat.total_population!;
  assertEqual(ratio > 0.85, true);
  assertEqual(ratio < 0.95, true);
});

test("terrain: custom terrain_weights override defaults", () => {
  const spec = basePopSpec({
    base: 10000,
    variance: 10,
    terrain_weights: { lakeside: 2.0 },
  });
  const partial = makeTerrainPartial();
  const result = populateScenario(partial, spec);
  const flat = result.precincts.find(p => p.id === "p001")!;
  const lakeside = result.precincts.find(p => p.id === "p002")!;
  // Custom lakeside = 2.0 → expect ~20000 vs default 1.4×~14000
  assertEqual(lakeside.total_population! > 18000, true);
  assertEqual(lakeside.total_population! > flat.total_population!, true);
});

test("terrain: no terrain features in partial — suitability 1.0, no throw", () => {
  const partial = makePartial(2);
  const spec = basePopSpec({ base: 1000, variance: 50 });
  const result = populateScenario(partial, spec);
  for (const p of result.precincts) {
    assertEqual(p.total_population! >= 950, true);
    assertEqual(p.total_population! <= 1050, true);
  }
});

// ─── Settlement zones ─────────────────────────────────────────────────────────

test("settlement: center precinct has highest population from Gaussian bump", () => {
  const partial = makePartial(3);
  const settlement: SettlementSpec = { anchor: "center", peak: 50000, radius: 2 };
  const spec = basePopSpec({ base: 100, variance: 5, settlements: [settlement] });
  const result = populateScenario(partial, spec);
  // Find the precinct at (0,0) — the center of a hex_circle
  const center = result.precincts.find(p => {
    const pos = p.position as { q: number; r: number };
    return pos.q === 0 && pos.r === 0;
  })!;
  const allOthers = result.precincts.filter(p => p.id !== center.id);
  const maxOther = Math.max(...allOthers.map(p => p.total_population!));
  assertEqual(center.total_population! > maxOther, true);
});

test("settlement: Gaussian falloff is monotone with hex distance from anchor", () => {
  const partial = makePartial(3);
  const settlement: SettlementSpec = { anchor: "center", peak: 50000, radius: 2 };
  const spec = basePopSpec({ base: 100, variance: 5, settlements: [settlement] });
  const result = populateScenario(partial, spec);
  const origin = { q: 0, r: 0 };
  // Bucket precincts by distance, compute average per bucket
  const byDist = new Map<number, number[]>();
  for (const p of result.precincts) {
    const d = hexDist(p.position as { q: number; r: number }, origin);
    const bucket = byDist.get(d) ?? [];
    bucket.push(p.total_population!);
    byDist.set(d, bucket);
  }
  const avgByDist = [...byDist.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, vals]) => vals.reduce((s, v) => s + v, 0) / vals.length);
  // Average population at each distance ring should decrease
  for (let i = 1; i < avgByDist.length; i++) {
    assertEqual(avgByDist[i]! < avgByDist[i - 1]!, true);
  }
});

test("settlement: anchor HexPos resolves to exact precinct without throwing", () => {
  const partial = makePartial(2);
  const settlement: SettlementSpec = { anchor: { q: 1, r: 0 }, peak: 5000, radius: 1 };
  const spec = basePopSpec({ base: 1000, variance: 50, settlements: [settlement] });
  const result = populateScenario(partial, spec);
  const anchored = result.precincts.find(p => {
    const pos = p.position as { q: number; r: number };
    return pos.q === 1 && pos.r === 0;
  })!;
  // Precinct at anchor should have bump = peak (distance 0)
  assertEqual(anchored.total_population! > 5000, true);
});

test("settlement: cardinal direction anchors all resolve without throwing", () => {
  const partial = makePartial(3);
  const directions = ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"] as const;
  for (const dir of directions) {
    const spec = basePopSpec({
      base: 1000, variance: 10,
      settlements: [{ anchor: dir, peak: 1000, radius: 1 }],
    });
    const result = populateScenario(partial, spec);
    assertEqual(result.precincts.every(p => p.total_population !== undefined), true);
  }
});

test("settlement: east anchor places bump at max-q precinct", () => {
  // Verifies DIRECTION_SCORE["east"] = (q,_r) => q selects the easternmost precinct.
  const partial = makePartial(3);
  const spec = basePopSpec({
    base: 100, variance: 0,
    settlements: [{ anchor: "east", peak: 50000, radius: 1 }],
  });
  const result = populateScenario(partial, spec);
  const maxQ = Math.max(...result.precincts.map(p => (p.position as { q: number; r: number }).q));
  const atMaxQ = result.precincts.filter(p => (p.position as { q: number; r: number }).q === maxQ);
  const others = result.precincts.filter(p => (p.position as { q: number; r: number }).q !== maxQ);
  const maxAtQ = Math.max(...atMaxQ.map(p => p.total_population!));
  const maxOther = Math.max(...others.map(p => p.total_population!));
  assertEqual(maxAtQ > maxOther, true);
});

test("settlement: lakeside anchor places bump at lakeside precinct", () => {
  // Verifies feature anchor resolution: highest-suitability lakeside precinct gets distance-0 bump.
  const partial = makeTerrainPartial();  // p002 at (2,0) is the only lakeside precinct
  const spec = basePopSpec({
    base: 100, variance: 0,
    settlements: [{ anchor: "lakeside", peak: 50000, radius: 1 }],
  });
  const result = populateScenario(partial, spec);
  const lakeside = result.precincts.find(p => p.id === "p002")!;
  const others = result.precincts.filter(p => p.id !== "p002");
  const maxOther = Math.max(...others.map(p => p.total_population!));
  assertEqual(lakeside.total_population! > maxOther, true);
});

test("settlement: feature anchors (lakeside, riverside, coastal) resolve without throwing", () => {
  const partial = generateTerrain({
    format_version: "1",
    scenario: {
      id: "feature-anchor-test",
      title: "Feature Anchor Test",
      election_type: "congressional",
      region: { id: "r1", name: "R" },
    },
    map: { geometry: "hex_axial", shape: "hex_circle", radius: 2 },
    terrain: {
      tiles: [
        { q: 3, r: -1, type: "lake" },
        { q: 3, r: -2, type: "sea" },
      ],
      river_edges: [[{ q: 0, r: 0 }, { q: 1, r: 0 }]],
    },
  });

  for (const anchor of ["lakeside", "coastal", "riverside"] as const) {
    const spec = basePopSpec({
      base: 1000, variance: 10,
      settlements: [{ anchor, peak: 5000, radius: 1 }],
    });
    const result = populateScenario(partial, spec);
    assertEqual(result.precincts.every(p => p.total_population !== undefined), true);
  }
});

test("settlement: multiple settlements accumulate at shared precincts", () => {
  const partial = makePartial(3);
  const singleSpec = basePopSpec({
    base: 1000, variance: 0,
    settlements: [{ anchor: "center", peak: 10000, radius: 1 }],
  });
  const doubleSpec = basePopSpec({
    base: 1000, variance: 0,
    settlements: [
      { anchor: "center", peak: 10000, radius: 1 },
      { anchor: "center", peak: 5000, radius: 1 },
    ],
  });
  const singleResult = populateScenario(partial, singleSpec);
  const doubleResult = populateScenario(partial, doubleSpec);
  const singleCenter = singleResult.precincts.find(p => {
    const pos = p.position as { q: number; r: number };
    return pos.q === 0 && pos.r === 0;
  })!;
  const doubleCenter = doubleResult.precincts.find(p => {
    const pos = p.position as { q: number; r: number };
    return pos.q === 0 && pos.r === 0;
  })!;
  // double settlement should add approximately 5000 more
  assertEqual(doubleCenter.total_population! > singleCenter.total_population!, true);
});

// ─── Error paths ──────────────────────────────────────────────────────────────

test("resolveAnchor: HexPos anchor throws when no precinct at position", () => {
  const spec = basePopSpec({
    settlements: [{ anchor: { q: 99, r: 99 }, peak: 1000, radius: 1 }],
  });
  let threw = false;
  try { populateScenario(makePartial(1), spec); } catch { threw = true; }
  assertEqual(threw, true);
});

test("resolveAnchor: feature anchor throws when no matching precincts (no sea tiles)", () => {
  // makeTerrainPartial has no sea tiles → coastal anchor should throw
  const spec = basePopSpec({
    settlements: [{ anchor: "coastal", peak: 1000, radius: 1 }],
  });
  let threw = false;
  try { populateScenario(makeTerrainPartial(), spec); } catch { threw = true; }
  assertEqual(threw, true);
});

// ─── GAME-088: field-shaping layers ─────────────────────────────────────────────

function popStdDev(result: PartialScenario): number {
  const vals = result.precincts.map(p => p.total_population!);
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

test("gradient: unset layers reduce exactly to the legacy additive formula", () => {
  // Back-compat guard: explicit no-op layers must equal omitting them.
  const partial = makePartial(3);
  const legacy = populateScenario(partial, basePopSpec({ base: 1000, variance: 100 }));
  const noop = populateScenario(
    partial,
    basePopSpec({ base: 1000, variance: 100, smoothing: 0, contrast: 1 }),
  );
  for (let i = 0; i < legacy.precincts.length; i++) {
    assertEqual(legacy.precincts[i]!.total_population, noop.precincts[i]!.total_population);
  }
});

test("gradient: center precinct outweighs the rim when strength > 0", () => {
  const partial = makePartial(3);
  const spec = basePopSpec({ base: 1000, variance: 0, gradient: { strength: 0.5 } });
  const result = populateScenario(partial, spec);
  const center = result.precincts.find(p => {
    const pos = p.position as { q: number; r: number };
    return pos.q === 0 && pos.r === 0;
  })!;
  const maxOther = Math.max(...result.precincts.filter(p => p.id !== center.id).map(p => p.total_population!));
  assertEqual(center.total_population! > maxOther, true);
});

test("gradient: strength 0 leaves a flat field flat", () => {
  const partial = makePartial(3);
  const spec = basePopSpec({ base: 1000, variance: 0, gradient: { strength: 0 } });
  const result = populateScenario(partial, spec);
  for (const p of result.precincts) {
    assertEqual(p.total_population, 1000);
  }
});

test("smoothing: reduces the spread of an i.i.d. jitter field", () => {
  const partial = makePartial(4);
  const rough = populateScenario(partial, basePopSpec({ base: 1000, variance: 500, smoothing: 0 }));
  const smooth = populateScenario(partial, basePopSpec({ base: 1000, variance: 500, smoothing: 3 }));
  assertEqual(popStdDev(smooth) < popStdDev(rough), true);
});

test("smoothing: stays deterministic with the same seed", () => {
  const partial = makePartial(3);
  const spec = basePopSpec({ base: 1000, variance: 300, smoothing: 2, seed: 11 });
  const a = populateScenario(partial, spec);
  const b = populateScenario(partial, spec);
  for (let i = 0; i < a.precincts.length; i++) {
    assertEqual(a.precincts[i]!.total_population, b.precincts[i]!.total_population);
  }
});

test("target_total: final field sums to the target (within rounding)", () => {
  const partial = makePartial(5); // 91 precincts
  const spec = basePopSpec({ base: 1500, variance: 150, target_total: 100000 });
  const result = populateScenario(partial, spec);
  const sum = result.precincts.reduce((s, p) => s + p.total_population!, 0);
  // Per-precinct rounding can drift the sum by at most ~half a unit per precinct.
  assertEqual(Math.abs(sum - 100000) <= result.precincts.length, true);
});

test("contrast: widens dynamic range (denser core) at a fixed total", () => {
  const partial = makePartial(4);
  const flat = populateScenario(
    partial,
    basePopSpec({ base: 1000, variance: 0, gradient: { strength: 0.5 }, target_total: 100000, contrast: 1 }),
  );
  const sharp = populateScenario(
    partial,
    basePopSpec({ base: 1000, variance: 0, gradient: { strength: 0.5 }, target_total: 100000, contrast: 2 }),
  );
  const maxOf = (r: PartialScenario) => Math.max(...r.precincts.map(p => p.total_population!));
  // Same total, but contrast pushes the peak higher.
  assertEqual(maxOf(sharp) > maxOf(flat), true);
});

summarize();
