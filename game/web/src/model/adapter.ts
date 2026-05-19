/**
 * Adapter: converts a loaded Scenario (spec types, GAME-001) to spike
 * internal types (types.ts) for the Sprint 1 renderer and store.
 *
 * Strategy:
 *  - Stable numeric IDs from array position (precincts[i].id = i)
 *  - District IDs: 1-based integers (scenario.districts[i] → i+1)
 *  - partyShare: population-weighted vote shares; first party→R, second→D; L/G/I=0
 *  - neighbors: computed from hex axial positions via HEX_DIRECTIONS
 *  - center: hexToPixel(q, r)
 *  - initial assignments from loader-filled initial_district_id
 *
 * This is a Sprint 1 shortcut — Sprint 3 will replace spike types entirely.
 */

import type { Scenario } from "./scenario.js";
import type { AssignmentMap, DistrictId, Precinct, TerrainTileRuntime } from "./types.js";
import { HEX_DIRECTIONS, hexToPixel } from "./hex-geometry.js";

// vote_shares is Record<PartyId, number> with branded keys; cast to plain string map at runtime
type VoteShareRecord = Record<string, number>;

export function scenarioToSpike(scenario: Scenario): {
	precincts: Precinct[];
	assignments: AssignmentMap;
	districtCount: number;
	terrainTiles: TerrainTileRuntime[];
	riverEdges: [number, number][];
} {
	// Map scenario DistrictId (branded string) → spike DistrictId (1-based number)
	const districtIndexMap = new Map<string, DistrictId>();
	scenario.districts.forEach((d, i) => {
		districtIndexMap.set(d.id, (i + 1) as DistrictId);
	});

	// Map axial position key → precinct array index (for neighbor lookup)
	const posMap = new Map<string, number>();
	scenario.precincts.forEach((pc, i) => {
		const pos = pc.position;
		if ("q" in pos) posMap.set(`${pos.q},${pos.r}`, i);
	});

	// Build terrain tile position map for annotation derivation
	const terrainPosMap = new Map<string, "sea" | "lake" | "mountain">();
	for (const tile of scenario.terrain_tiles ?? []) {
		terrainPosMap.set(`${tile.position.q},${tile.position.r}`, tile.type);
	}

	// Build ID→index map for river edge conversion (precincts are ordered by scenario.precincts array)
	const idToIndex = new Map<string, number>();
	scenario.precincts.forEach((pc, i) => idToIndex.set(pc.id, i));

	// Build river edge set: "idxA,idxB" (both orderings) for fast passableNeighbors lookup
	const riverPairs: [number, number][] = [];
	const riverEdgeSet = new Set<string>();
	for (const [aId, bId] of scenario.river_edges ?? []) {
		const aIdx = idToIndex.get(aId);
		const bIdx = idToIndex.get(bId);
		if (aIdx !== undefined && bIdx !== undefined) {
			riverPairs.push([aIdx, bIdx]);
			riverEdgeSet.add(`${aIdx},${bIdx}`);
			riverEdgeSet.add(`${bIdx},${aIdx}`);
		}
	}

	const blocksContiguity = scenario.river_blocks_contiguity ?? false;

	const precincts: Precinct[] = scenario.precincts.map((pc, i) => {
		const pos = pc.position;
		const q = "q" in pos ? (pos as { q: number; r: number }).q : 0;
		const r = "q" in pos ? (pos as { q: number; r: number }).r : 0;

		const center = hexToPixel(q, r);

		// 6-element neighbors array — null where no adjacent precinct exists
		const neighbors: (number | null)[] = HEX_DIRECTIONS.map(([dq, dr]) => {
			const idx = posMap.get(`${q + dq},${r + dr}`);
			return idx !== undefined ? idx : null;
		});

		// passableNeighbors: same as neighbors but river edges nulled when blocking
		const passableNeighbors: (number | null)[] = neighbors.map((nbIdx) => {
			if (!blocksContiguity || nbIdx === null) return nbIdx;
			return riverEdgeSet.has(`${i},${nbIdx}`) ? null : nbIdx;
		});

		// Derive terrain annotation from adjacency (explicit value overrides derivation).
		// Priority: explicit > coast (sea) > lakeside (lake) > foothill (mountain) > riverside (river edge).
		// Terrain tiles are dominant features; rivers are edge features, so tiles take priority.
		let terrain: Precinct["terrain"] = pc.terrain as Precinct["terrain"] | undefined;
		if (terrain === undefined) {
			let hasSea = false;
			let hasLake = false;
			let hasMountain = false;
			for (const [dq, dr] of HEX_DIRECTIONS) {
				const tileType = terrainPosMap.get(`${q + dq},${r + dr}`);
				if (tileType === "sea") hasSea = true;
				else if (tileType === "lake") hasLake = true;
				else if (tileType === "mountain") hasMountain = true;
			}
			const isRiverside = riverPairs.some(([a, b]) => a === i || b === i);
			if (hasSea) terrain = "coast";
			else if (hasLake) terrain = "lakeside";
			else if (hasMountain) terrain = "foothill";
			else if (isRiverside) terrain = "riverside";
		}

		// Population-weighted vote shares (turnout ignored until Sprint 3)
		// Map first scenario party → R, second → D (matches partyIdToKey in main.ts)
		const firstPartyId = scenario.parties[0]?.id as string | undefined;
		const secondPartyId = scenario.parties[1]?.id as string | undefined;
		let firstShare = 0;
		let secondShare = 0;
		for (const g of pc.demographic_groups) {
			const vs = g.vote_shares as unknown as VoteShareRecord;
			if (firstPartyId) firstShare += g.population_share * (vs[firstPartyId] ?? 0);
			if (secondPartyId) secondShare += g.population_share * (vs[secondPartyId] ?? 0);
		}

		const partyShare = {
			R: Math.round(firstShare * 1000) / 1000,
			D: Math.round(secondShare * 1000) / 1000,
			L: 0,
			G: 0,
			I: 0,
		};

		const winner: "D" | "R" = partyShare.D >= partyShare.R ? "D" : "R";
		const margin = Math.round(Math.abs(partyShare.D - partyShare.R) * 100) / 100;

		const spikePrecinct: import("./types.js").Precinct = {
			id: i,
			coord: { q, r },
			center,
			neighbors,
			passableNeighbors,
			population: pc.total_population,
			partyShare,
			previousResult: { winner, margin },
			demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 },
		};
		if (pc.name !== undefined) spikePrecinct.name = pc.name;
		if (pc.county_id !== undefined) spikePrecinct.county_id = pc.county_id;
		if (terrain !== undefined) spikePrecinct.terrain = terrain;
		if (pc.has_internal_lake) spikePrecinct.has_internal_lake = true;
		if (pc.demographic_groups.length > 1) {
			spikePrecinct.groupShares = pc.demographic_groups.map((g) => {
				const entry: { name: string; share: number; dimensions?: Record<string, string> } = {
					name: g.name ?? g.id,
					share: g.population_share,
				};
				if (g.dimensions) entry.dimensions = g.dimensions as Record<string, string>;
				return entry;
			});
		}
		return spikePrecinct;
	});

	// Build initial assignments from loader-filled initial_district_id values
	const assignments: AssignmentMap = new Map();
	scenario.precincts.forEach((pc, i) => {
		const sDistId = pc.initial_district_id;
		const spikeDistId =
			sDistId != null ? (districtIndexMap.get(sDistId) ?? null) : null;
		assignments.set(i, spikeDistId);
	});

	// Build runtime terrain tiles with axial coord + pixel center
	const terrainTiles: TerrainTileRuntime[] = (scenario.terrain_tiles ?? []).map((tile) => ({
		coord: { q: tile.position.q, r: tile.position.r },
		center: hexToPixel(tile.position.q, tile.position.r),
		type: tile.type,
	}));

	return { precincts, assignments, districtCount: scenario.districts.length, terrainTiles, riverEdges: riverPairs };
}
