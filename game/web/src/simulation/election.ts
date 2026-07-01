/**
 * Election simulation — pure functions only.
 * No DOM, no D3, no Zustand. Takes GameState, returns SimulationResult.
 */

import type { PartyId } from "../model/scenario.js";
import type {
	AssignmentMap,
	DistrictId,
	DistrictResult,
	GameState,
	Precinct,
	SimulationResult,
} from "../model/runtime.js";
import type { PartyShare } from "../model/party.js";
import { winnerOf, zeroShare } from "../model/party.js";

/** Compute DistrictResult for one district */
export function simulateDistrict(
	districtId: DistrictId,
	precincts: Precinct[],
	assignments: AssignmentMap,
	parties: PartyId[],
): DistrictResult {
	const inDistrict = precincts.filter((p) => assignments.get(p.index) === districtId);

	const voteTotals: PartyShare = zeroShare(parties);
	let totalPop = 0;

	for (const p of inDistrict) {
		totalPop += p.population;
		for (const party of parties) {
			voteTotals[party] = (voteTotals[party] ?? 0) + (p.voteShare[party] ?? 0) * p.population;
		}
	}

	// Normalise vote totals to shares
	if (totalPop > 0) {
		for (const party of parties) {
			voteTotals[party] = (voteTotals[party] ?? 0) / totalPop;
		}
	}

	const winner = winnerOf(voteTotals, parties);

	// Find second-place for margin
	const sorted = parties.slice().sort((a, b) => (voteTotals[b] ?? 0) - (voteTotals[a] ?? 0));
	const runnerUp = sorted[1] ?? parties[0]!;
	const margin = (voteTotals[winner] ?? 0) - (voteTotals[runnerUp] ?? 0);

	return {
		districtId,
		winner,
		voteTotals,
		totalVotes: totalPop,
		margin: Math.round(margin * 1000) / 1000,
		precinctCount: inDistrict.length,
		population: totalPop,
	};
}

/**
 * Run a full election simulation across all districts.
 * Only districts that have at least one precinct assigned are included.
 */
export function runElection(state: GameState): SimulationResult {
	// Collect which districts have at least one precinct
	const activeDistricts = new Set<DistrictId>();
	for (const [, dId] of state.assignments) {
		if (dId !== null) {
			activeDistricts.add(dId);
		}
	}

	const districtResults: DistrictResult[] = [];
	for (const dId of Array.from(activeDistricts).sort((a, b) => a - b)) {
		districtResults.push(simulateDistrict(dId, state.precincts, state.assignments, state.parties));
	}

	// Summarise seats
	const seatsByParty = {} as Record<PartyId, number>;
	for (const r of districtResults) {
		const current = seatsByParty[r.winner] ?? 0;
		seatsByParty[r.winner] = current + 1;
	}

	return { districtResults, seatsByParty };
}
