/**
 * Pure validity computations for the live feedback panel (GAME-010).
 *
 * All functions are stateless and side-effect-free — they take store state
 * and scenario rules, return plain data objects. No DOM, no D3.
 */

import type { AssignmentMap, Precinct } from "../model/types.js";
import type { ScenarioRules } from "../model/scenario.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface DistrictPopStats {
	districtId: number;
	population: number;
	/** Signed percentage deviation from ideal, e.g. +2.3 or -4.1 */
	deviationPct: number;
	status: "ok" | "over" | "under";
}

export interface ValidityStats {
	idealPopulation: number;
	totalPopulation: number;
	unassignedCount: number;
	districtPop: DistrictPopStats[];
	/** null when rules.contiguity === "allowed" (not checked) */
	contiguity: Map<number, boolean> | null;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function computeValidityStats(
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtCount: number,
	rules: ScenarioRules,
): ValidityStats {
	const totalPopulation = precincts.reduce((s, p) => s + p.population, 0);
	const idealPopulation = districtCount > 0 ? totalPopulation / districtCount : 0;
	const tolerance = rules.population_tolerance;

	// Unassigned count
	let unassignedCount = 0;
	for (const v of assignments.values()) {
		if (v === null) unassignedCount++;
	}

	// Per-district population sums
	const popByDistrict = new Map<number, number>();
	for (let d = 1; d <= districtCount; d++) popByDistrict.set(d, 0);
	for (const [precinctId, distId] of assignments) {
		if (distId !== null) {
			const pc = precincts[precinctId];
			if (pc !== undefined) {
				popByDistrict.set(distId, (popByDistrict.get(distId) ?? 0) + pc.population);
			}
		}
	}

	const districtPop: DistrictPopStats[] = [];
	for (let d = 1; d <= districtCount; d++) {
		const pop = popByDistrict.get(d) ?? 0;
		const deviationPct =
			idealPopulation > 0 ? ((pop - idealPopulation) / idealPopulation) * 100 : 0;
		let status: "ok" | "over" | "under" = "ok";
		if (deviationPct > tolerance * 100) status = "over";
		else if (deviationPct < -(tolerance * 100)) status = "under";
		districtPop.push({ districtId: d, population: pop, deviationPct, status });
	}

	// Contiguity — BFS per district; skipped when "allowed"
	let contiguity: Map<number, boolean> | null = null;
	if (rules.contiguity !== "allowed") {
		contiguity = new Map();
		for (let d = 1; d <= districtCount; d++) {
			contiguity.set(d, isContiguous(precincts, assignments, d));
		}
	}

	return { idealPopulation, totalPopulation, unassignedCount, districtPop, contiguity };
}

// ─── BFS contiguity check ─────────────────────────────────────────────────────

function isContiguous(
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtId: number,
): boolean {
	const inDistrict: number[] = [];
	for (const [pid, did] of assignments) {
		if (did === districtId) inDistrict.push(pid);
	}
	if (inDistrict.length <= 1) return true; // 0 or 1 precincts: trivially contiguous

	const inSet = new Set(inDistrict);
	const visited = new Set<number>();
	const queue: number[] = [inDistrict[0]!];
	visited.add(inDistrict[0]!);

	while (queue.length > 0) {
		const curr = queue.shift()!;
		const p = precincts[curr];
		if (p === undefined) continue;
		for (const nbId of p.neighbors) {
			if (nbId !== null && inSet.has(nbId) && !visited.has(nbId)) {
				visited.add(nbId);
				queue.push(nbId);
			}
		}
	}

	return visited.size === inSet.size;
}
