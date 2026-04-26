/**
 * Criteria evaluation — pure functions only (GAME-017).
 *
 * Takes scenario success_criteria, current validity stats, and simulation
 * results; returns a per-criterion pass/fail result plus overall verdict.
 *
 * No DOM, no D3, no Zustand. All inputs are plain data.
 */

import type { CriterionId, SuccessCriterion, ScenarioRules, CompareOp } from "../model/scenario.js";
import type { ValidityStats } from "./validity.js";
import type { SimulationResult, AssignmentMap, Precinct } from "../model/types.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface CriterionResult {
	criterionId: CriterionId;
	required: boolean;
	description: string;
	passed: boolean;
	detail?: string;
}

export interface EvaluationResult {
	criterionResults: CriterionResult[];
	/** true when every required criterion passed */
	overallPass: boolean;
}

// ─── Helper: comparison operator ─────────────────────────────────────────────

function applyOp(actual: number, op: CompareOp, threshold: number): boolean {
	switch (op) {
		case "lt":  return actual < threshold;
		case "lte": return actual <= threshold;
		case "eq":  return Math.abs(actual - threshold) < 1e-9;
		case "gte": return actual >= threshold;
		case "gt":  return actual > threshold;
	}
}

// ─── Helper: hex-based compactness per district ───────────────────────────────
//
// Compactness = fraction of each district hex's edge slots that are interior
// (i.e. the neighbour is also in the same district).
// Range: 0 (isolated singletons) → ~0.83 (densely packed blob).
// "null" neighbour slots (map boundary) count as non-interior.

function computeDistrictCompactness(
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtCount: number,
): number[] {
	const scores: number[] = [];
	for (let d = 1; d <= districtCount; d++) {
		const inDistrict = new Set<number>();
		for (const [pid, did] of assignments) {
			if (did === d) inDistrict.add(pid);
		}
		if (inDistrict.size === 0) {
			scores.push(0);
			continue;
		}
		let interior = 0;
		let total = 0;
		for (const pid of inDistrict) {
			const p = precincts[pid];
			if (!p) continue;
			for (const nbId of p.neighbors) {
				total++;
				if (nbId !== null && inDistrict.has(nbId)) interior++;
			}
		}
		scores.push(total > 0 ? interior / total : 0);
	}
	return scores;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Evaluate all scenario success criteria against the current map state.
 *
 * @param criteria         Scenario's success_criteria array
 * @param validityStats    Output of computeValidityStats for current assignments
 * @param simResult        Output of runElection for current assignments
 * @param rules            Scenario rules (population_tolerance, contiguity, …)
 * @param precincts        Spike-type Precinct array (for compactness calc)
 * @param assignments      Current precinct→district assignment map
 * @param districtCount    Number of districts in this scenario
 * @param partyIdToKey     Mapping from scenario PartyId → spike PartyKey (e.g. "ken"→"R")
 */
export function evaluateCriteria(
	criteria: SuccessCriterion[],
	validityStats: ValidityStats,
	simResult: SimulationResult,
	rules: ScenarioRules,
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtCount: number,
	partyIdToKey: Map<string, string>,
): EvaluationResult {
	// Lazy-compute compactness only if any compactness criterion exists
	let compactnessScores: number[] | null = null;
	function getCompactness(): number[] {
		if (compactnessScores === null) {
			compactnessScores = computeDistrictCompactness(precincts, assignments, districtCount);
		}
		return compactnessScores;
	}

	const criterionResults: CriterionResult[] = [];

	for (const sc of criteria) {
		let passed = false;
		let detail: string | undefined;
		const c = sc.criterion;

		switch (c.type) {
			case "district_count": {
				const allAssigned = validityStats.unassignedCount === 0;
				const districtsInUse = simResult.districtResults.length;
				passed = allAssigned && districtsInUse === districtCount;
				if (!passed) {
					if (!allAssigned) {
						detail = `${validityStats.unassignedCount} precinct(s) unassigned`;
					} else {
						detail = `only ${districtsInUse} of ${districtCount} districts have precincts`;
					}
				}
				break;
			}

			case "population_balance": {
				const failing = validityStats.districtPop.filter(d => d.status !== "ok");
				passed = failing.length === 0;
				if (!passed) {
					const worst = failing[0]!;
					const sign = worst.deviationPct >= 0 ? "+" : "";
					detail = `District ${worst.districtId}: ${sign}${worst.deviationPct.toFixed(1)}% (tolerance ±${(rules.population_tolerance * 100).toFixed(0)}%)`;
				}
				break;
			}

			case "compactness": {
				const scores = getCompactness();
				const minScore = scores.length > 0 ? Math.min(...scores) : 0;
				passed = applyOp(minScore, c.operator, c.threshold);
				const opLabel: Record<CompareOp, string> = { lt: "<", lte: "≤", eq: "=", gte: "≥", gt: ">" };
				detail = `min district score: ${(minScore * 100).toFixed(1)}% (required ${opLabel[c.operator]}${(c.threshold * 100).toFixed(0)}%)`;
				break;
			}

			case "seat_count": {
				const key = partyIdToKey.get(c.party) ?? String(c.party);
				const seats = (simResult.seatsByParty as Record<string, number>)[key] ?? 0;
				passed = applyOp(seats, c.operator, c.count);
				const opLabel: Record<CompareOp, string> = { lt: "<", lte: "≤", eq: "=", gte: "≥", gt: ">" };
				detail = `${key}: ${seats} seat(s) (required ${opLabel[c.operator]}${c.count})`;
				break;
			}

			case "safe_seats": {
				const key = partyIdToKey.get(c.party) ?? String(c.party);
				const safeCount = simResult.districtResults.filter(
					dr => dr.winner === key && dr.margin >= c.margin,
				).length;
				passed = safeCount >= c.min_count;
				detail = `${key}: ${safeCount} safe seat(s) with margin ≥${(c.margin * 100).toFixed(0)}% (required ≥${c.min_count})`;
				break;
			}

			case "competitive_seats": {
				const competitive = simResult.districtResults.filter(
					dr => dr.margin <= c.margin,
				).length;
				passed = competitive >= c.min_count;
				detail = `${competitive} competitive seat(s) with margin ≤${(c.margin * 100).toFixed(0)}% (required ≥${c.min_count})`;
				break;
			}

			case "majority_minority":
			case "efficiency_gap":
			case "mean_median":
				passed = false;
				detail = `criterion type '${c.type}' is not yet implemented`;
				break;
		}

		const entry: CriterionResult = {
			criterionId: sc.id,
			required: sc.required,
			description: sc.description,
			passed,
		};
		if (detail !== undefined) entry.detail = detail;
		criterionResults.push(entry);
	}

	const overallPass = criterionResults
		.filter(r => r.required)
		.every(r => r.passed);

	return { criterionResults, overallPass };
}

// ─── Validity gate: should the Submit button be enabled? ──────────────────────

/**
 * Returns true when the map satisfies all hard constraints required before
 * evaluation: no unassigned precincts, population within tolerance, and
 * contiguity if required by the scenario rules.
 */
export function isMapSubmittable(
	validityStats: ValidityStats,
	rules: ScenarioRules,
): boolean {
	if (validityStats.unassignedCount > 0) return false;
	if (validityStats.districtPop.some(d => d.status !== "ok")) return false;
	if (rules.contiguity === "required" && validityStats.contiguity !== null) {
		for (const ok of validityStats.contiguity.values()) {
			if (!ok) return false;
		}
	}
	return true;
}
