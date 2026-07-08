/**
 * Stage 1 of the GAME-084 map generation pipeline: terrain generator.
 *
 * Takes a PipelineSpec and produces a PartialScenario containing:
 *   - Hex positions for all precincts (no population or demographics yet)
 *   - Terrain tiles (mountain, sea, lake) that REPLACE the precinct on their cell
 *   - River edges as precinct-ID pairs
 *
 * Validation enforced here:
 *   - Terrain tiles must lie within the r=n boundary; each removes the precinct on its
 *     cell (GAME-127) — terrain is part of the map, never placed off-grid beyond the rim
 *   - River edges must reference precinct positions (not terrain tiles or empty cells)
 */

import type {
	GeometrySpec,
	PartialPrecinct,
	PartialScenario,
	PrecinctId,
	RegionId,
	ScenarioId,
	TerrainTile,
} from "../model/scenario.js";

import type { HexPos, PipelineSpec } from "./spec-types.js";
import { routeRiver, resolveRiverAnchor, validateRiverEdges } from "./river.js";

// Flat-top axial hex direction vectors
const HEX_DIRS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[0, -1],
	[1, -1],
];

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateTerrain(spec: PipelineSpec): PartialScenario {
	const { scenario, map, terrain } = spec;

	const allPositions = generateHexCircle(map.radius);

	// Terrain tiles must lie INSIDE the r=n boundary and REPLACE the precinct on their cell
	// (GAME-127). Validate + build them first, then drop their cells from the precinct set so the
	// mountains/sea/lake occupy the map's own hexes rather than framing it from off-grid.
	const terrainSpecs = terrain?.tiles ?? [];
	const terrainTiles = buildTerrainTiles(terrainSpecs, map.radius);
	const terrainKeys = new Set(terrainSpecs.map((t) => posKey(t.q, t.r)));

	const positions = allPositions.filter((p) => !terrainKeys.has(posKey(p.q, p.r)));

	const precincts: PartialPrecinct[] = positions.map((pos, idx) => ({
		id: sequentialId(idx + 1) as PrecinctId,
		editable: true,
		position: pos,
	}));

	const posToId = buildPosIndex(precincts);

	// River: route from intent (`terrain.river`) when present — a connected chain valid by
	// construction — else use explicit `river_edges`. Either way, reject mid-land loose ends
	// (a river must flow off-map / end in water, not stop ringed by precincts). GAME-100.
	const riverPairs: [HexPos, HexPos][] = terrain?.river
		? routeRiver(
				positions,
				resolveRiverAnchor(terrain.river.from, positions),
				resolveRiverAnchor(terrain.river.to, positions),
				(terrain.river.via ?? []).map((v) => resolveRiverAnchor(v, positions)),
			)
		: (terrain?.river_edges ?? []);
	if (riverPairs.length > 0) validateRiverEdges(positions, riverPairs);
	const riverEdges = buildRiverEdges(riverPairs, posToId);

	const partial: PartialScenario = {
		format_version: "1",
		id: scenario.id as ScenarioId,
		title: scenario.title,
		election_type: scenario.election_type,
		region: {
			id: scenario.region.id as RegionId,
			name: scenario.region.name,
		},
		geometry: { type: "hex_axial" } satisfies GeometrySpec,
		precincts,
	};

	if (terrainTiles.length > 0) partial.terrain_tiles = terrainTiles;
	if (riverEdges.length > 0) partial.river_edges = riverEdges;

	return partial;
}

// ─── Hex grid generation ──────────────────────────────────────────────────────

/** Generates all positions in a hex circle of the given radius, sorted (r asc, q asc). */
export function generateHexCircle(radius: number): HexPos[] {
	const hexes: HexPos[] = [];
	for (let q = -radius; q <= radius; q++) {
		const rMin = Math.max(-radius, -q - radius);
		const rMax = Math.min(radius, -q + radius);
		for (let r = rMin; r <= rMax; r++) {
			hexes.push({ q, r });
		}
	}
	return hexes.sort((a, b) => a.r - b.r || a.q - b.q);
}

/** Expected precinct count for a hex circle of radius R: 3R²+3R+1 */
export function hexCircleSize(radius: number): number {
	return 3 * radius * radius + 3 * radius + 1;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildPosIndex(precincts: PartialPrecinct[]): Map<string, PrecinctId> {
	const m = new Map<string, PrecinctId>();
	for (const p of precincts) {
		const pos = p.position as HexPos;
		m.set(posKey(pos.q, pos.r), p.id);
	}
	return m;
}

function buildTerrainTiles(
	specs: Array<{ q: number; r: number; type: "mountain" | "sea" | "lake" }>,
	radius: number,
): TerrainTile[] {
	return specs.map((t) => {
		const dist = hexDistance(t.q, t.r);
		if (dist > radius) {
			throw new Error(
				`Terrain tile at (${t.q},${t.r}) lies outside the radius-${radius} boundary ` +
					`(hex distance ${dist}); terrain must be placed within the playable map.`,
			);
		}
		// A terrain tile REPLACES the precinct on its cell — the precinct at (q,r) is removed
		// from the map (see generateTerrain) so the tile occupies that hex. Terrain therefore
		// lives inside the boundary, never off-grid beyond the rim. GAME-127.
		return { position: { q: t.q, r: t.r }, type: t.type };
	});
}

function buildRiverEdges(
	specs: [HexPos, HexPos][],
	posToId: Map<string, PrecinctId>,
): [PrecinctId, PrecinctId][] {
	return specs.map(([a, b]) => {
		const aId = posToId.get(posKey(a.q, a.r));
		const bId = posToId.get(posKey(b.q, b.r));
		if (!aId) throw new Error(`River edge start (${a.q},${a.r}) is not a precinct position`);
		if (!bId) throw new Error(`River edge end (${b.q},${b.r}) is not a precinct position`);
		if (!areAdjacent(a, b)) {
			throw new Error(`River edge (${a.q},${a.r})↔(${b.q},${b.r}) connects non-adjacent hexes`);
		}
		return [aId, bId];
	});
}

function areAdjacent(a: HexPos, b: HexPos): boolean {
	return HEX_DIRS.some(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
}

/** Axial hex distance from the origin: (|q| + |r| + |q+r|) / 2. */
function hexDistance(q: number, r: number): number {
	return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

function posKey(q: number, r: number): string {
	return `${q},${r}`;
}

function sequentialId(n: number): string {
	return `p${String(n).padStart(3, "0")}`;
}
