/**
 * Tests for the terrain generator (GAME-084 Stage 1 pipeline).
 *
 * Covers:
 *   - Hex circle generation: count, sort order, edge cases
 *   - generateTerrain: produces valid PartialScenario structure
 *   - Terrain tiles: accepted, validated, placed in output
 *   - River edges: translated from position pairs to precinct-ID pairs
 *   - Error cases: out-of-boundary terrain, non-precinct river endpoints, non-adjacent river pairs
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:terrain_generator_test
 */

import { generateTerrain, generateHexCircle, hexCircleSize } from "./terrain-generator.js";
import type { PipelineSpec } from "./spec-types.js";
import {
	test,
	assertEqual,
	assertThrows,
	assertDoesNotThrow,
	summarize,
} from "../testing/test_runner.js";

// ─── Spec fixtures ────────────────────────────────────────────────────────────

function minimalSpec(radius: number, overrides: Partial<PipelineSpec> = {}): PipelineSpec {
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
		const valid = curr.r > prev.r || (curr.r === prev.r && curr.q >= prev.q);
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
	const ids = s.precincts.map((p) => p.id);
	assertEqual(ids[0], "p001");
	assertEqual(ids[6], "p007");
});

test("generateTerrain: precincts are editable by default", () => {
	const s = generateTerrain(minimalSpec(1));
	assertEqual(
		s.precincts.every((p) => p.editable),
		true,
	);
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
	// (0,2) is on the rim of an R=2 hex circle (hex distance 2) — inside the boundary.
	const spec = minimalSpec(2, {
		terrain: {
			tiles: [{ q: 0, r: 2, type: "mountain" }],
		},
	});
	const s = generateTerrain(spec);
	assertEqual(s.terrain_tiles?.length, 1);
	assertEqual(s.terrain_tiles?.[0]?.type, "mountain");
	assertEqual(s.terrain_tiles?.[0]?.position.q, 0);
	assertEqual(s.terrain_tiles?.[0]?.position.r, 2);
});

test("generateTerrain: accepts mountain, sea, and lake tile types", () => {
	// Three distinct rim cells of an R=3 hex circle (all hex distance 3, inside the boundary).
	const spec = minimalSpec(3, {
		terrain: {
			tiles: [
				{ q: 0, r: 3, type: "mountain" },
				{ q: 3, r: 0, type: "sea" },
				{ q: -3, r: 0, type: "lake" },
			],
		},
	});
	const s = generateTerrain(spec);
	assertEqual(s.terrain_tiles?.length, 3);
});

test("generateTerrain: terrain tile on a precinct cell removes that precinct (GAME-127)", () => {
	// R=2 hex circle includes (0,0); a mountain there now REPLACES the precinct rather than
	// erroring — the (0,0) precinct is dropped and the tile occupies the cell.
	const spec = minimalSpec(2, {
		terrain: { tiles: [{ q: 0, r: 0, type: "mountain" }] },
	});
	const s = generateTerrain(spec);
	assertEqual(s.precincts.length, hexCircleSize(2) - 1); // 19 − 1 = 18
	const hasOrigin = s.precincts.some((p) => {
		const pos = p.position as { q: number; r: number };
		return pos.q === 0 && pos.r === 0;
	});
	assertEqual(hasOrigin, false); // no precinct remains under the terrain tile
	assertEqual(s.terrain_tiles?.length, 1);
	assertEqual(s.terrain_tiles?.[0]?.position.q, 0);
	assertEqual(s.terrain_tiles?.[0]?.position.r, 0);
});

test("generateTerrain: terrain tile outside the radius throws (GAME-127)", () => {
	// (0,3) is one ring beyond an R=2 hex circle (hex distance 3 > 2). Terrain must live inside
	// the playable boundary, so this is rejected rather than framing the map off-grid.
	const spec = minimalSpec(2, {
		terrain: { tiles: [{ q: 0, r: 3, type: "sea" }] },
	});
	assertThrows(() => generateTerrain(spec), /outside the radius|boundary/i);
});

test("generateTerrain: a routed river coexists with terrain removal and references only land (GAME-127)", () => {
	// A sea tile on the east rim removes that precinct (off the north–south axis, so the river
	// anchors are unaffected); a north→south river must still route over the remaining land and
	// terminate validly (no throw), referencing only surviving land precinct IDs.
	const spec = minimalSpec(4, {
		terrain: {
			tiles: [{ q: 4, r: 0, type: "sea" }],
			river: { from: "north", to: "south" },
		},
	});
	const s = generateTerrain(spec);
	const landIds = new Set(s.precincts.map((p) => p.id));
	const removed = s.precincts.some((p) => {
		const pos = p.position as { q: number; r: number };
		return pos.q === 4 && pos.r === 0;
	});
	assertEqual(removed, false); // the (4,0) precinct was replaced by the sea tile
	assertEqual((s.river_edges?.length ?? 0) > 0, true);
	for (const [a, b] of s.river_edges!) {
		assertEqual(landIds.has(a), true);
		assertEqual(landIds.has(b), true);
	}
});

// ─── generateTerrain: river edges ────────────────────────────────────────────

test("generateTerrain: routes a river from intent (north→south) and translates it to precinct IDs", () => {
	// GAME-100: `terrain.river` intent → a routed, connected, off-map-terminating river.
	const spec = minimalSpec(3, {
		terrain: { river: { from: "north", to: "south" } },
	});
	const s = generateTerrain(spec);
	assertEqual((s.river_edges?.length ?? 0) > 0, true);
	for (const [a, b] of s.river_edges!) {
		assertEqual(typeof a, "string");
		assertEqual(typeof b, "string");
		assertEqual(a !== b, true);
	}
});

test("generateTerrain: an explicit river with a mid-land loose end throws", () => {
	// A single interior segment (both corners ringed by 3 precincts) is per-se invalid.
	const spec = minimalSpec(2, {
		terrain: {
			river_edges: [
				[
					{ q: 0, r: 0 },
					{ q: 1, r: 0 },
				],
			],
		},
	});
	assertThrows(() => generateTerrain(spec), /loose end/i);
});

test("generateTerrain: river edge at non-precinct position throws", () => {
	// (0, 99) is outside the hex circle for R=1
	const spec = minimalSpec(1, {
		terrain: {
			river_edges: [
				[
					{ q: 0, r: 0 },
					{ q: 0, r: 99 },
				],
			],
		},
	});
	assertThrows(() => generateTerrain(spec), /not a precinct/i);
});

test("generateTerrain: river edge between non-adjacent positions throws", () => {
	// (0,0) and (0,2) are not adjacent in a hex grid
	const spec = minimalSpec(3, {
		terrain: {
			river_edges: [
				[
					{ q: 0, r: 0 },
					{ q: 0, r: 2 },
				],
			],
		},
	});
	assertThrows(() => generateTerrain(spec), /non-adjacent/i);
});

test("generateTerrain: river edge IDs round-trip to adjacent precinct positions", () => {
	// Every routed river edge must translate to two real, adjacent precinct IDs.
	const spec = minimalSpec(5, {
		terrain: { river: { from: "west", to: "east" } },
	});
	const s = generateTerrain(spec);
	// id → position, built from the output precincts
	const idToPos = new Map(
		s.precincts.map((p) => {
			const pos = p.position as { q: number; r: number };
			return [p.id, pos];
		}),
	);
	const dirs: [number, number][] = [
		[1, 0],
		[0, 1],
		[-1, 1],
		[-1, 0],
		[0, -1],
		[1, -1],
	];
	const adjacent = (a: { q: number; r: number }, b: { q: number; r: number }) =>
		dirs.some(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
	assertEqual((s.river_edges?.length ?? 0) > 0, true);
	for (const [aId, bId] of s.river_edges!) {
		const a = idToPos.get(aId);
		const b = idToPos.get(bId);
		assertEqual(a !== undefined, true);
		assertEqual(b !== undefined, true);
		assertEqual(adjacent(a!, b!), true);
	}
});

summarize();
