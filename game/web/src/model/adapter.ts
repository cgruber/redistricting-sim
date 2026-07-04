/**
 * Runtime builder (GAME-043): builds the unified runtime model (runtime.ts) from
 * a loaded Scenario (scenario.ts) once at load.
 *
 * No longer a bridge between two type *systems* — just derivation: hex geometry,
 * neighbor indices, terrain annotations, all-party vote aggregation, previousResult.
 *
 * Strategy:
 *  - Numeric runtime index from array position (precincts[i].index = i); the
 *    canonical string PrecinctId is carried as `scenarioId`.
 *  - District IDs: 1-based integers (scenario.districts[i] → i+1)
 *  - voteShare: population-weighted shares over EVERY scenario party (turnout
 *    ignored — GAME-112/113). Behavior-preserving today: shipped scenarios are 2-party.
 *  - neighbors: computed from hex axial positions via HEX_DIRECTIONS
 *  - center: hexToPixel(q, r)
 *  - initial assignments from loader-filled initial_district_id
 */

import type { Party, PartyId, Scenario } from "./scenario.js";
import type {
	AssignmentMap,
	DistrictId,
	Precinct,
	TerrainAnnotation,
	TerrainTileRuntime,
} from "./runtime.js";
import type { PartyShare } from "./party.js";
import { winnerOf, zeroShare } from "./party.js";
import { HEX_DIRECTIONS, hexToPixel } from "./hex-geometry.js";

// vote_shares is Record<PartyId, number> with branded keys; cast to plain string map at runtime
type VoteShareRecord = Record<string, number>;

export function scenarioToRuntime(scenario: Scenario): {
	precincts: Precinct[];
	parties: PartyId[];
	assignments: AssignmentMap;
	districtCount: number;
	terrainTiles: TerrainTileRuntime[];
	riverEdges: [number, number][];
	independentHomes?: ReadonlyMap<PartyId, number>;
} {
	// Ordered scenario party list — the source of the tie-break order and every
	// winner/margin/seat computation downstream.
	const parties: PartyId[] = scenario.parties.map((p: Party) => p.id);

	// Map scenario DistrictId (branded string) → runtime DistrictId (1-based number)
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

	// GAME-118: resolve each home-base independent's home coord → precinct index.
	// Only the (stable) precinct index is stored; the election derives the home
	// *district* fresh from assignments each run. Loader guarantees independent⟺home
	// and hex_axial geometry, so posMap has the coord unless it's simply wrong.
	const independentHomes = new Map<PartyId, number>();
	scenario.parties.forEach((p: Party) => {
		if (!p.independent || p.home === undefined) return;
		const homeIndex = posMap.get(`${p.home.q},${p.home.r}`);
		if (homeIndex === undefined) {
			throw new Error(
				`Independent party "${p.id}" home (${p.home.q},${p.home.r}) matches no precinct`,
			);
		}
		independentHomes.set(p.id, homeIndex);
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

		// Derive composable terrain annotations — all independent, any combination valid.
		// coast/foothill/lakeside/riverside: purely derived from adjacency (never authored in JSON).
		let hasSea = false;
		let hasMountain = false;
		let hasLakeAdj = false;
		for (const [dq, dr] of HEX_DIRECTIONS) {
			const tileType = terrainPosMap.get(`${q + dq},${r + dr}`);
			if (tileType === "sea") hasSea = true;
			else if (tileType === "mountain") hasMountain = true;
			else if (tileType === "lake") hasLakeAdj = true;
		}
		const isRiverside = riverPairs.some(([a, b]) => a === i || b === i);
		const terrainAnnotation: TerrainAnnotation = {
			coast: hasSea,
			foothill: hasMountain,
			lakeside: hasLakeAdj,
			riverside: isRiverside && !hasSea && !hasMountain && !hasLakeAdj,
		};

		// Population-weighted vote shares over EVERY scenario party (turnout ignored
		// until GAME-112/113). Round each to 3 decimals to match the pre-GAME-043
		// two-party path (which rounded R/D to 3 decimals).
		const voteShare: PartyShare = zeroShare(parties);
		for (const g of pc.demographic_groups) {
			const vs = g.vote_shares as unknown as VoteShareRecord;
			for (const party of parties) {
				voteShare[party] = (voteShare[party] ?? 0) + g.population_share * (vs[party] ?? 0);
			}
		}
		for (const party of parties) {
			voteShare[party] = Math.round((voteShare[party] ?? 0) * 1000) / 1000;
		}

		// Canonical tie-break (GAME-104): winnerOf scans `parties` with strict >,
		// so an exact tie resolves to the first-listed party — matching the election
		// simulation.
		const winner = winnerOf(voteShare, parties);
		// Margin vs. the actual runner-up (sorted). For a 2-party scenario this is
		// |party2 − party1|, identical to the pre-GAME-043 |D − R|. Rounded to 2
		// decimals to preserve the prior previousResult.margin precision.
		const sorted = parties.slice().sort((a, b) => (voteShare[b] ?? 0) - (voteShare[a] ?? 0));
		const runnerUp = sorted[1];
		const rawMargin =
			runnerUp !== undefined ? (voteShare[winner] ?? 0) - (voteShare[runnerUp] ?? 0) : 0;
		const margin = Math.round(rawMargin * 100) / 100;

		const runtimePrecinct: Precinct = {
			index: i,
			scenarioId: pc.id,
			coord: { q, r },
			center,
			neighbors,
			passableNeighbors,
			population: pc.total_population,
			voteShare,
			previousResult: { winner, margin },
		};
		if (pc.name !== undefined) runtimePrecinct.name = pc.name;
		if (pc.county_id !== undefined) runtimePrecinct.county_id = pc.county_id;
		if (pc.county_name !== undefined) runtimePrecinct.county_name = pc.county_name;
		// Only store annotation when at least one flag is true (avoids polluting all precincts)
		if (hasSea || hasMountain || isRiverside || hasLakeAdj) {
			runtimePrecinct.terrainAnnotation = terrainAnnotation;
		}
		if (pc.demographic_groups.length > 1) {
			runtimePrecinct.groupShares = pc.demographic_groups.map((g) => {
				const entry: {
					name: string;
					share: number;
					dimensions?: Record<string, string>;
				} = {
					name: g.name ?? g.id,
					share: g.population_share,
				};
				if (g.dimensions) entry.dimensions = g.dimensions as Record<string, string>;
				return entry;
			});
		}
		return runtimePrecinct;
	});

	// Build initial assignments from loader-filled initial_district_id values
	const assignments: AssignmentMap = new Map();
	scenario.precincts.forEach((pc, i) => {
		const sDistId = pc.initial_district_id;
		const runtimeDistId = sDistId != null ? (districtIndexMap.get(sDistId) ?? null) : null;
		assignments.set(i, runtimeDistId);
	});

	// Build initial runtime terrain tiles with axial coord + pixel center
	const terrainTiles: TerrainTileRuntime[] = (scenario.terrain_tiles ?? []).map((tile) => ({
		coord: { q: tile.position.q, r: tile.position.r },
		center: hexToPixel(tile.position.q, tile.position.r),
		type: tile.type,
	}));

	return {
		precincts,
		parties,
		assignments,
		districtCount: scenario.districts.length,
		terrainTiles,
		riverEdges: riverPairs,
		// Omit when empty so no-independent scenarios produce an identical GameState.
		...(independentHomes.size > 0 ? { independentHomes } : {}),
	};
}
