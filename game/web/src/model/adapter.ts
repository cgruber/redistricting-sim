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
import type { AssignmentMap, DistrictId, Precinct } from "./types.js";
import { HEX_DIRECTIONS, hexToPixel } from "./generator.js";

// vote_shares is Record<PartyId, number> with branded keys; cast to plain string map at runtime
type VoteShareRecord = Record<string, number>;

export function scenarioToSpike(scenario: Scenario): {
	precincts: Precinct[];
	assignments: AssignmentMap;
	districtCount: number;
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
			population: pc.total_population,
			partyShare,
			previousResult: { winner, margin },
			demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 },
		};
		if (pc.name !== undefined) spikePrecinct.name = pc.name;
		if (pc.county_id !== undefined) spikePrecinct.county_id = pc.county_id;
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

	return { precincts, assignments, districtCount: scenario.districts.length };
}
