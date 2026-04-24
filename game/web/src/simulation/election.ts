/**
 * Election simulation — pure functions only.
 * No DOM, no D3, no Zustand. Takes GameState, returns SimulationResult.
 */

import type {
	AssignmentMap,
	DistrictId,
	DistrictResult,
	GameState,
	PartyKey,
	PartyShare,
	Precinct,
	SimulationResult,
} from "../model/types.js";

const ALL_PARTIES: PartyKey[] = ["R", "D", "L", "G", "I"];

/** Zero-initialised PartyShare */
function zeroShare(): PartyShare {
	return { R: 0, D: 0, L: 0, G: 0, I: 0 };
}

/** Plurality winner of a PartyShare */
function pluralityWinner(share: PartyShare): PartyKey {
	let best: PartyKey = "R";
	for (const p of ALL_PARTIES) {
		if (share[p] > share[best]) {
			best = p;
		}
	}
	return best;
}

/** Compute DistrictResult for one district */
function simulateDistrict(
	districtId: DistrictId,
	precincts: Precinct[],
	assignments: AssignmentMap,
): DistrictResult {
	const inDistrict = precincts.filter((p) => assignments.get(p.id) === districtId);

	const voteTotals = zeroShare();
	let totalPop = 0;

	for (const p of inDistrict) {
		totalPop += p.population;
		for (const party of ALL_PARTIES) {
			voteTotals[party] += p.partyShare[party] * p.population;
		}
	}

	// Normalise vote totals to shares
	if (totalPop > 0) {
		for (const party of ALL_PARTIES) {
			voteTotals[party] /= totalPop;
		}
	}

	const winner = pluralityWinner(voteTotals);

	// Find second-place for margin
	const sorted = ALL_PARTIES.slice().sort((a, b) => voteTotals[b] - voteTotals[a]);
	const runnerUp = sorted[1] ?? "R";
	const margin = voteTotals[winner] - voteTotals[runnerUp];

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
		districtResults.push(simulateDistrict(dId, state.precincts, state.assignments));
	}

	// Summarise seats
	const seatsByParty: Partial<Record<PartyKey, number>> = {};
	for (const r of districtResults) {
		const current = seatsByParty[r.winner] ?? 0;
		seatsByParty[r.winner] = current + 1;
	}

	return { districtResults, seatsByParty };
}
