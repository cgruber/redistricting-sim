/**
 * Criteria evaluation — pure functions only (GAME-017).
 *
 * Takes scenario success_criteria, current validity stats, and simulation
 * results; returns a per-criterion pass/fail result plus overall verdict.
 *
 * No DOM, no D3, no Zustand. All inputs are plain data.
 */

import type {
	CriterionId,
	SuccessCriterion,
	ScenarioRules,
	CompareOp,
	GroupFilter,
	DemographicGroup,
	PartyId,
	Precinct as ScenarioPrecinct,
} from "../model/scenario.js";
import type { ValidityStats } from "./validity.js";
import type { SimulationResult, AssignmentMap, Precinct } from "../model/runtime.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const OP_LABEL: Record<CompareOp, string> = {
	lt: "<",
	lte: "≤",
	eq: "=",
	gte: "≥",
	gt: ">",
};

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

export interface DistrictDemoStat {
	shares: number[];
	label: string;
	threshold: number;
}

export function groupFilterLabel(filter: GroupFilter): string {
	if ("dimension" in filter) {
		const v = filter.value;
		return v.charAt(0).toUpperCase() + v.slice(1);
	}
	return (filter.group_ids as string[]).join(", ");
}

// ─── Helper: comparison operator ─────────────────────────────────────────────

function applyOp(actual: number, op: CompareOp, threshold: number): boolean {
	switch (op) {
		case "lt":
			return actual < threshold;
		case "lte":
			return actual <= threshold;
		case "eq":
			return Math.abs(actual - threshold) < 1e-9;
		case "gte":
			return actual >= threshold;
		case "gt":
			return actual > threshold;
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

// ─── Helper: group filter matching ───────────────────────────────────────────

function matchesGroupFilter(group: DemographicGroup, filter: GroupFilter): boolean {
	if ("group_ids" in filter) {
		return (filter.group_ids as string[]).includes(group.id as string);
	}
	return group.dimensions?.[filter.dimension] === filter.value;
}

// ─── Helper: per-district group population share ──────────────────────────────
//
// Returns the fraction of each district's total population that belongs to
// groups matching the filter.  Range: 0.0–1.0.

export function computeDistrictGroupShares(
	scenarioPrecincts: ScenarioPrecinct[],
	assignments: AssignmentMap,
	districtCount: number,
	filter: GroupFilter,
): number[] {
	const shares: number[] = [];
	for (let d = 1; d <= districtCount; d++) {
		let groupPop = 0;
		let totalPop = 0;
		for (const [pid, did] of assignments) {
			if (did !== d) continue;
			const sp = scenarioPrecincts[pid];
			if (sp === undefined) continue;
			totalPop += sp.total_population;
			for (const g of sp.demographic_groups) {
				if (matchesGroupFilter(g, filter)) {
					groupPop += g.population_share * sp.total_population;
				}
			}
		}
		shares.push(totalPop > 0 ? groupPop / totalPop : 0);
	}
	return shares;
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
 * @param parties          Scenario parties in declaration order (party-id keyspace)
 * @param scenarioPrecincts Scenario-format precincts (needed for majority_minority); omit if unused
 */
export function evaluateCriteria(
	criteria: SuccessCriterion[],
	validityStats: ValidityStats,
	simResult: SimulationResult,
	rules: ScenarioRules,
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtCount: number,
	parties: PartyId[],
	scenarioPrecincts: ScenarioPrecinct[] = [],
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
				const failing = validityStats.districtPop.filter((d) => d.status !== "ok");
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
				detail = `min district score: ${(minScore * 100).toFixed(1)}% (required ${OP_LABEL[c.operator]}${(c.threshold * 100).toFixed(0)}%)`;
				break;
			}

			case "seat_count": {
				const seats = (simResult.seatsByParty as Record<string, number>)[c.party] ?? 0;
				passed = applyOp(seats, c.operator, c.count);
				detail = `${c.party}: ${seats} seat(s) (required ${OP_LABEL[c.operator]}${c.count})`;
				break;
			}

			case "safe_seats": {
				const safeCount = simResult.districtResults.filter(
					(dr) => dr.winner === c.party && dr.margin >= c.margin,
				).length;
				passed = safeCount >= c.min_count;
				detail = `${c.party}: ${safeCount} safe seat(s) with margin ≥${(c.margin * 100).toFixed(0)}% (required ≥${c.min_count})`;
				break;
			}

			case "competitive_seats": {
				const competitive = simResult.districtResults.filter((dr) => dr.margin <= c.margin).length;
				passed = competitive >= c.min_count;
				detail = `${competitive} competitive seat(s) with margin ≤${(c.margin * 100).toFixed(0)}% (required ≥${c.min_count})`;
				break;
			}

			case "efficiency_gap": {
				// Wasted-vote efficiency gap between the two major parties (the
				// scenario's first two parties, party1/party2). GAME-043 keeps this
				// two-party to preserve behavior; the proper two-party normalization
				// for N>2 is GAME-112.
				// Positive = party1 has more wasted votes; negative = party2 does.
				// Criterion uses abs(gap) so direction doesn't matter.
				const party1 = parties[0]!;
				const party2 = parties[1]!;
				let p1Wasted = 0;
				let p2Wasted = 0;
				let allVotes = 0;
				for (const dr of simResult.districtResults) {
					const p1Votes = (dr.voteTotals[party1] ?? 0) * dr.totalVotes;
					const p2Votes = (dr.voteTotals[party2] ?? 0) * dr.totalVotes;
					allVotes += dr.totalVotes;
					if (dr.winner === party1) {
						p1Wasted += Math.max(0, p1Votes - dr.totalVotes * 0.5);
						p2Wasted += p2Votes;
					} else if (dr.winner === party2) {
						p2Wasted += Math.max(0, p2Votes - dr.totalVotes * 0.5);
						p1Wasted += p1Votes;
					} else {
						// Third-party winner: both major parties wasted all votes
						p1Wasted += p1Votes;
						p2Wasted += p2Votes;
					}
				}
				const rawGap = allVotes > 0 ? (p1Wasted - p2Wasted) / allVotes : 0;
				const absGap = Math.abs(rawGap);
				passed = applyOp(absGap, c.operator, c.threshold);
				const direction = rawGap >= 0 ? `${party1}-disadvantaged` : `${party2}-disadvantaged`;
				detail = `efficiency gap: ${(absGap * 100).toFixed(1)}% (${direction}; required ${OP_LABEL[c.operator]}${(c.threshold * 100).toFixed(0)}%)`;
				break;
			}

			case "mean_median": {
				// Mean − median of party vote share across districts.
				// Large positive value = party wins fewer seats than votes warrant (packed wins).
				// Large negative value = party wins more seats than votes warrant (cracked opponents).
				// Criterion applies applyOp to the raw (signed) difference.
				const shares = simResult.districtResults.map(
					(dr) => (dr.voteTotals as unknown as Record<string, number>)[c.party] ?? 0,
				);
				if (shares.length === 0) {
					passed = false;
					detail = "no districts to evaluate";
					break;
				}
				const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
				const sorted = shares.slice().sort((a, b) => a - b);
				const n = sorted.length;
				const median =
					n % 2 === 0 ? (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2 : sorted[Math.floor(n / 2)]!;
				const diff = mean - median;
				passed = applyOp(diff, c.operator, c.threshold);
				const sign = diff >= 0 ? "+" : "";
				detail = `${c.party}: mean ${(mean * 100).toFixed(1)}% − median ${(median * 100).toFixed(1)}% = ${sign}${(diff * 100).toFixed(1)}% (required ${OP_LABEL[c.operator]}${(c.threshold * 100).toFixed(0)}%)`;
				break;
			}

			case "majority_minority": {
				// Count districts where the target group's population share ≥ min_eligible_share.
				if (scenarioPrecincts.length === 0) {
					passed = false;
					detail = "majority_minority requires scenario precincts (not provided)";
					break;
				}
				const groupShares = computeDistrictGroupShares(
					scenarioPrecincts,
					assignments,
					districtCount,
					c.group_filter,
				);
				const qualifying = groupShares.filter((s) => s >= c.min_eligible_share).length;
				passed = qualifying >= c.min_districts;
				detail = `${qualifying} of ${districtCount} district(s) have target group ≥${(c.min_eligible_share * 100).toFixed(0)}% (required ${c.min_districts})`;
				break;
			}

			default: {
				// Exhaustiveness guard: this assigns the narrowed `c` to `never`, so adding a
				// Criterion variant without a case above is a COMPILE error here (the
				// assignment-style switch means noImplicitReturns/noFallthrough can't catch it).
				const _exhaustive: never = c;
				throw new Error(
					`evaluateCriteria: unhandled criterion type: ${(_exhaustive as { type: string }).type}`,
				);
			}
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

	const overallPass = criterionResults.filter((r) => r.required).every((r) => r.passed);

	return { criterionResults, overallPass };
}

// ─── Validity gate: should the Submit button be enabled? ──────────────────────

/**
 * Returns true when the map satisfies the hard constraints required before
 * evaluation: no unassigned precincts, population within tolerance (only when the
 * scenario enforces balance), and contiguity if the scenario rules require it.
 *
 * Population balance is opt-in: `enforceBalance` should be true only when the
 * scenario has a `population_balance` success criterion (mirroring how contiguity
 * is opt-in via `rules.contiguity`). A scenario that doesn't enforce balance — e.g.
 * the paint-only welcome tutorial — must never fail a player for an imbalance they
 * weren't asked to fix.
 */
export function isMapSubmittable(
	validityStats: ValidityStats,
	rules: ScenarioRules,
	enforceBalance = true,
): boolean {
	if (validityStats.unassignedCount > 0) return false;
	if (enforceBalance && validityStats.districtPop.some((d) => d.status !== "ok")) return false;
	if (rules.contiguity === "required" && validityStats.contiguity !== null) {
		for (const ok of validityStats.contiguity.values()) {
			if (!ok) return false;
		}
	}
	return true;
}
