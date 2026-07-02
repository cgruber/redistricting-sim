/**
 * Unit tests for evaluateCriteria and isMapSubmittable (GAME-017).
 *
 * Hand-rolled TAP runner — no external test framework.
 * Run via Bazel: bazel test //web/src/simulation:evaluate_test
 *
 * Coverage:
 *   evaluateCriteria:
 *     - district_count: pass when all assigned + all districts in use
 *     - district_count: fail when precincts unassigned
 *     - district_count: fail when a district has no precincts
 *     - population_balance: pass when all within tolerance
 *     - population_balance: fail when a district is out of tolerance
 *     - compactness: pass when score meets operator + threshold
 *     - compactness: fail when score is below threshold
 *     - seat_count: pass / fail via party mapping
 *     - all-required-pass + optional-fail → overallPass true
 *     - any-required-fail → overallPass false
 *   isMapSubmittable:
 *     - false when unassigned precincts exist
 *     - false when population out of tolerance AND balance enforced (default)
 *     - allowed when out of tolerance but balance not enforced (enforceBalance=false)
 *     - false when contiguity required and district is non-contiguous
 *     - true when all enforced constraints met
 */

import { evaluateCriteria, isMapSubmittable } from "./evaluate.js";
import { computeValidityStats } from "./validity.js";
import { runElection } from "./election.js";
import type { Precinct, GameState, AssignmentMap } from "../model/runtime.js";
import type {
	ScenarioRules,
	SuccessCriterion,
	PartyId,
	PrecinctId,
	Precinct as ScenarioPrecinct,
} from "../model/scenario.js";

import { test, assertEqual, assertTrue, assertFalse, summarize } from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Party-id keyspace (GAME-043): vote shares and criterion `party` are ONE
// keyspace now (ken/ryu) — no PartyId→PartyKey mapping. ken = parties[0] (wins
// ties, the pre-GAME-043 "R" slot), ryu = parties[1] (the "D" slot).
const KEN = "ken" as PartyId;
const RYU = "ryu" as PartyId;
const IND = "ind" as PartyId;
const PARTIES: PartyId[] = [KEN, RYU];
const PARTIES3: PartyId[] = [KEN, RYU, IND];

function makePrecinct(
	id: number,
	population: number,
	partyR: number,
	partyD: number,
	neighbors: (number | null)[],
): Precinct {
	return {
		index: id,
		scenarioId: `p${id}` as unknown as PrecinctId,
		coord: { q: 0, r: id },
		center: { x: id * 10, y: 0 },
		neighbors,
		population,
		voteShare: { [KEN]: partyR, [RYU]: partyD },
		previousResult: {
			winner: partyR >= partyD ? KEN : RYU,
			margin: Math.abs(partyR - partyD),
		},
	};
}

// Three-party precinct (GAME-112): vote shares over ken/ryu/ind summing to 1.
function makePrecinct3(
	id: number,
	population: number,
	ken: number,
	ryu: number,
	ind: number,
	neighbors: (number | null)[],
): Precinct {
	const winner = ken >= ryu && ken >= ind ? KEN : ryu >= ind ? RYU : IND;
	return {
		index: id,
		scenarioId: `p${id}` as unknown as PrecinctId,
		coord: { q: 0, r: id },
		center: { x: id * 10, y: 0 },
		neighbors,
		population,
		voteShare: { [KEN]: ken, [RYU]: ryu, [IND]: ind },
		previousResult: { winner, margin: 0 },
	};
}

// 4 precincts in a 2×2 grid: 0—1—2—3 with cross-links
// 0 neighbors: [1, 2, null, null, null, null]
// 1 neighbors: [null, 3, null, 0, null, null]
// 2 neighbors: [3, null, null, null, null, 0]  (wait, let's keep simple chain)
//
// Simple chain for contiguity tests: 0 — 1 — 2 — 3
const P0 = makePrecinct(0, 1000, 0.6, 0.4, [1, null, null, null, null, null]);
const P1 = makePrecinct(1, 1000, 0.4, 0.6, [2, null, null, 0, null, null]);
const P2 = makePrecinct(2, 1000, 0.6, 0.4, [3, null, null, 1, null, null]);
const P3 = makePrecinct(3, 1000, 0.4, 0.6, [null, null, null, 2, null, null]);

const FOUR_PRECINCTS = [P0, P1, P2, P3];

const RULES: ScenarioRules = {
	contiguity: "required",
	population_tolerance: 0.05,
};

const RULES_LENIENT: ScenarioRules = {
	contiguity: "allowed",
	population_tolerance: 0.2,
};

function makeDistrictCountCriterion(required = true): SuccessCriterion {
	return {
		id: "sc-dc" as import("../model/scenario.js").CriterionId,
		required,
		description: "All precincts assigned, all districts in use",
		criterion: { type: "district_count" },
	};
}

function makePopBalanceCriterion(required = true): SuccessCriterion {
	return {
		id: "sc-pb" as import("../model/scenario.js").CriterionId,
		required,
		description: "Population balance within tolerance",
		criterion: { type: "population_balance" },
	};
}

function makeSeatCountCriterion(
	party: string,
	op: import("../model/scenario.js").CompareOp,
	count: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-seat" as import("../model/scenario.js").CriterionId,
		required,
		description: `Party ${party} wins ${count} seats`,
		criterion: {
			type: "seat_count",
			party: party as import("../model/scenario.js").PartyId,
			operator: op,
			count,
		},
	};
}

function makeCompactnessCriterion(threshold: number, required = false): SuccessCriterion {
	return {
		id: "sc-cmp" as import("../model/scenario.js").CriterionId,
		required,
		description: `Compactness ≥ ${threshold}`,
		criterion: { type: "compactness", operator: "gte", threshold },
	};
}

function runEval(
	criteria: SuccessCriterion[],
	precincts: Precinct[],
	assignments: AssignmentMap,
	districtCount: number,
	rules = RULES,
	scenarioPrecincts: ScenarioPrecinct[] = [],
	partiesList: PartyId[] = PARTIES,
) {
	const validityStats = computeValidityStats(precincts, assignments, districtCount, rules);
	const state: GameState = {
		precincts,
		parties: partiesList,
		assignments,
		districtCount,
		activeDistrict: 1,
		simulationResult: null,
	};
	state.simulationResult = runElection(state);
	return evaluateCriteria(
		criteria,
		validityStats,
		state.simulationResult,
		rules,
		precincts,
		assignments,
		districtCount,
		partiesList,
		scenarioPrecincts,
	);
}

// ─── district_count tests ─────────────────────────────────────────────────────

test("district_count: all assigned + all districts in use → pass", () => {
	// D1: precincts 0,1  D2: precincts 2,3
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
	assertTrue(result.criterionResults[0]!.passed, "criterion passed");
	assertTrue(result.overallPass, "overall pass");
});

test("district_count: unassigned precincts → fail", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, null],
		[3, 2],
	]);
	const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
	assertFalse(result.criterionResults[0]!.passed, "criterion failed");
	assertFalse(result.overallPass, "overall fail");
});

test("district_count: district 2 has no precincts → fail", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 1],
		[3, 1],
	]);
	const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
	assertFalse(result.criterionResults[0]!.passed, "criterion failed (district 2 empty)");
	assertFalse(result.overallPass, "overall fail");
});

// ─── population_balance tests ─────────────────────────────────────────────────

test("population_balance: equal split → pass", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const result = runEval([makePopBalanceCriterion()], FOUR_PRECINCTS, assignments, 2);
	assertTrue(result.criterionResults[0]!.passed, "equal pop → pass");
	assertTrue(result.overallPass, "overall pass");
});

test("population_balance: imbalanced split outside tolerance → fail", () => {
	// D1 gets 3 precincts (pop 3000), D2 gets 1 (pop 1000); ideal=2000; deviation=50% >> 5%
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 1],
		[3, 2],
	]);
	const result = runEval([makePopBalanceCriterion()], FOUR_PRECINCTS, assignments, 2);
	assertFalse(result.criterionResults[0]!.passed, "imbalanced → fail");
	assertFalse(result.overallPass, "overall fail");
});

// ─── compactness tests ────────────────────────────────────────────────────────

test("compactness: chain split in half — score below strict threshold → fail", () => {
	// D1: 0-1, D2: 2-3; chain, each district is linear 2-hex segment
	// interior fraction for 2-hex chain: 2 interior half-edges / 12 total = 0.167
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const result = runEval([makeCompactnessCriterion(0.45)], FOUR_PRECINCTS, assignments, 2);
	assertFalse(result.criterionResults[0]!.passed, "linear chain < 0.45 threshold");
	// optional criterion failure should not affect overall pass (no required criteria)
	assertTrue(result.overallPass, "optional fail does not fail overall");
});

test("compactness: threshold of 0 → always pass", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const result = runEval([makeCompactnessCriterion(0)], FOUR_PRECINCTS, assignments, 2);
	assertTrue(result.criterionResults[0]!.passed, "any compactness ≥ 0 → pass");
});

// ─── seat_count tests ─────────────────────────────────────────────────────────

test("seat_count: R wins 1 seat, criterion R gte 1 → pass", () => {
	// P0 and P1 in D1: P0 is R-lean (0.6/0.4), P1 is D-lean (0.4/0.6)
	// Aggregate for D1: R=0.5, D=0.5 → tie → R wins (winnerOf: ties go to the
	// party first in ALL_PARTIES order, R before D — the one canonical rule shared
	// with the adapter's displayed winner, GAME-104)
	// D2: P2(R 0.6), P3(D 0.6) → R=0.5, D=0.5 → R wins
	// Actually let's use clearer setup: D1=P0+P1 R-overall, D2=P2+P3 D-overall
	// With equal pop, D1 avg: (0.6+0.4)/2=0.5R, (0.4+0.6)/2=0.5D → R wins by initial sort
	// Let me use 3:1 split for clear outcome
	const strongR = makePrecinct(10, 1000, 0.8, 0.2, [null, null, null, null, null, null]);
	const strongD = makePrecinct(11, 1000, 0.2, 0.8, [null, null, null, null, null, null]);
	const precincts = [strongR, strongD];
	const assignments = new Map([
		[0, 1],
		[1, 2],
	]);
	// strongR (index 0) → D1: R wins; strongD (index 1) → D2: D wins
	const result = runEval(
		[makeSeatCountCriterion("ken", "gte", 1)],
		precincts,
		assignments,
		2,
		RULES_LENIENT,
	);
	assertTrue(result.criterionResults[0]!.passed, "R wins 1 seat → gte 1 passes");
	assertTrue(result.overallPass, "overall pass");
});

test("seat_count: R wins 0 seats, criterion R gte 1 → fail", () => {
	const strongD1 = makePrecinct(0, 1000, 0.1, 0.9, [null, null, null, null, null, null]);
	const strongD2 = makePrecinct(1, 1000, 0.1, 0.9, [null, null, null, null, null, null]);
	const precincts = [strongD1, strongD2];
	const assignments = new Map([
		[0, 1],
		[1, 2],
	]);
	const result = runEval(
		[makeSeatCountCriterion("ken", "gte", 1)],
		precincts,
		assignments,
		2,
		RULES_LENIENT,
	);
	assertFalse(result.criterionResults[0]!.passed, "R wins 0 → gte 1 fails");
	assertFalse(result.overallPass, "overall fail");
});

// ─── overall pass/fail composition ───────────────────────────────────────────

test("all required pass + optional fail → overallPass true", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const criteria: SuccessCriterion[] = [
		makeDistrictCountCriterion(true), // required → pass
		makePopBalanceCriterion(true), // required → pass
		makeCompactnessCriterion(0.9, false), // optional → fail (linear chain)
	];
	const result = runEval(criteria, FOUR_PRECINCTS, assignments, 2);
	assertTrue(result.criterionResults[0]!.passed, "district_count passes");
	assertTrue(result.criterionResults[1]!.passed, "pop_balance passes");
	assertFalse(result.criterionResults[2]!.passed, "compactness fails (optional)");
	assertTrue(result.overallPass, "overall still passes");
});

test("any required criterion fails → overallPass false", () => {
	// 3:1 split → pop_balance required fails
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 1],
		[3, 2],
	]);
	const criteria: SuccessCriterion[] = [
		makeDistrictCountCriterion(true),
		makePopBalanceCriterion(true),
	];
	const result = runEval(criteria, FOUR_PRECINCTS, assignments, 2);
	assertTrue(result.criterionResults[0]!.passed, "district_count passes");
	assertFalse(result.criterionResults[1]!.passed, "pop_balance fails");
	assertFalse(result.overallPass, "overall fails");
});

// ─── isMapSubmittable tests ───────────────────────────────────────────────────

test("isMapSubmittable: valid balanced map → true", () => {
	const precincts = [P0, P1, P2, P3];
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 2],
		[3, 2],
	]);
	const stats = computeValidityStats(precincts, assignments, 2, RULES);
	assertTrue(isMapSubmittable(stats, RULES), "valid map is submittable");
});

test("isMapSubmittable: unassigned precinct → false", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, null],
		[3, 2],
	]);
	const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
	assertFalse(isMapSubmittable(stats, RULES), "unassigned → not submittable");
});

test("isMapSubmittable: out of tolerance → false when balance enforced (default)", () => {
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 1],
		[3, 2],
	]);
	const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
	assertFalse(isMapSubmittable(stats, RULES), "imbalanced + balance enforced → not submittable");
});

test("isMapSubmittable: out of tolerance allowed when balance not enforced (opt-out)", () => {
	// enforceBalance=false (scenario has no population_balance criterion): an imbalance the
	// player wasn't asked to fix must not block submission. Assigned + contiguous → submittable.
	const assignments = new Map([
		[0, 1],
		[1, 1],
		[2, 1],
		[3, 2],
	]);
	const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
	assertTrue(
		isMapSubmittable(stats, RULES, false),
		"imbalanced but balance not enforced → submittable",
	);
});

test("isMapSubmittable: contiguity required + non-contiguous district → false", () => {
	// D1 gets 0 and 2 (non-adjacent in chain 0-1-2-3); D2 gets 1 and 3
	const assignments = new Map([
		[0, 1],
		[1, 2],
		[2, 1],
		[3, 2],
	]);
	const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
	assertFalse(isMapSubmittable(stats, RULES), "non-contiguous → not submittable");
});

// ─── efficiency_gap tests ─────────────────────────────────────────────────────
//
// Fixture: 3 districts (1 precinct each, pop=1000), all R+D only.
//   D1 (R wins 70/30): R_wasted=200, D_wasted=300
//   D2 (D wins 30/70): R_wasted=300, D_wasted=200
//   D3 (D wins 30/70): R_wasted=300, D_wasted=200
//   Total: R_wasted=800, D_wasted=700, allVotes=3000
//   abs(EG) = |800-700|/3000 = 100/3000 ≈ 0.0333

function makeEfficiencyGapCriterion(
	op: import("../model/scenario.js").CompareOp,
	threshold: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-eg" as import("../model/scenario.js").CriterionId,
		required,
		description: "Efficiency gap bounded",
		criterion: { type: "efficiency_gap", operator: op, threshold },
	};
}

const EG_PRECINCTS = [
	makePrecinct(0, 1000, 0.7, 0.3, [null, null, null, null, null, null]), // D1: R wins
	makePrecinct(1, 1000, 0.3, 0.7, [null, null, null, null, null, null]), // D2: D wins
	makePrecinct(2, 1000, 0.3, 0.7, [null, null, null, null, null, null]), // D3: D wins
];
const EG_ASSIGNMENTS = new Map([
	[0, 1],
	[1, 2],
	[2, 3],
]);

test("efficiency_gap: abs(gap)≈0.033 ≤ 0.05 → pass", () => {
	const result = runEval(
		[makeEfficiencyGapCriterion("lte", 0.05)],
		EG_PRECINCTS,
		EG_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(result.criterionResults[0]!.passed, "gap 0.033 ≤ 0.05 should pass");
	assertTrue(result.overallPass, "overall pass");
});

test("efficiency_gap: abs(gap)≈0.033 > 0.02 → fail", () => {
	const result = runEval(
		[makeEfficiencyGapCriterion("lte", 0.02)],
		EG_PRECINCTS,
		EG_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(result.criterionResults[0]!.passed, "gap 0.033 > 0.02 should fail");
	assertFalse(result.overallPass, "overall fail");
});

// ─── mean_median tests ────────────────────────────────────────────────────────
//
// Balanced fixture: R shares = [0.4, 0.5, 0.6] → mean=0.5, median=0.5, diff=0.0
// Gerrymandered fixture: R shares = [0.3, 0.35, 0.9] → mean≈0.517, median=0.35, diff≈+0.167

function makeMeanMedianCriterion(
	party: string,
	op: import("../model/scenario.js").CompareOp,
	threshold: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-mm" as import("../model/scenario.js").CriterionId,
		required,
		description: "Mean-median difference bounded",
		criterion: {
			type: "mean_median",
			party: party as import("../model/scenario.js").PartyId,
			operator: op,
			threshold,
		},
	};
}

const MM_BALANCED_PRECINCTS = [
	makePrecinct(0, 1000, 0.4, 0.6, [null, null, null, null, null, null]),
	makePrecinct(1, 1000, 0.5, 0.5, [null, null, null, null, null, null]),
	makePrecinct(2, 1000, 0.6, 0.4, [null, null, null, null, null, null]),
];
const MM_GERRYMANDER_PRECINCTS = [
	makePrecinct(0, 1000, 0.3, 0.7, [null, null, null, null, null, null]),
	makePrecinct(1, 1000, 0.35, 0.65, [null, null, null, null, null, null]),
	makePrecinct(2, 1000, 0.9, 0.1, [null, null, null, null, null, null]),
];
const MM_ASSIGNMENTS = new Map([
	[0, 1],
	[1, 2],
	[2, 3],
]);

test("mean_median: balanced districts (diff=0) ≤ 0.05 → pass", () => {
	const result = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.05)],
		MM_BALANCED_PRECINCTS,
		MM_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(result.criterionResults[0]!.passed, "diff=0 ≤ 0.05 should pass");
	assertTrue(result.overallPass, "overall pass");
});

test("mean_median: gerrymandered (diff≈+0.167) > 0.05 → fail", () => {
	const result = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.05)],
		MM_GERRYMANDER_PRECINCTS,
		MM_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(result.criterionResults[0]!.passed, "diff 0.167 > 0.05 should fail");
	assertFalse(result.overallPass, "overall fail");
});

// ─── majority_minority tests ──────────────────────────────────────────────────
//
// Fixture: 4 precincts, 2 districts (2 precincts each), pop=1000 each.
//   D1 precincts: minority group share = 0.3  → district share = 0.3
//   D2 precincts: minority group share = 0.6  → district share = 0.6
//
// group_filter: { group_ids: ["minority"] }
// min_eligible_share: 0.50
//   D1 fails (0.3 < 0.50), D2 passes (0.6 ≥ 0.50) → qualifying = 1

function makeScenarioPrecinct(idx: number, pop: number, minorityShare: number): ScenarioPrecinct {
	const majorityShare = 1 - minorityShare;
	return {
		id: `p${idx}` as import("../model/scenario.js").PrecinctId,
		editable: true,
		position: { q: 0, r: idx },
		total_population: pop,
		demographic_groups: [
			{
				id: "minority" as import("../model/scenario.js").GroupId,
				population_share: minorityShare,
				vote_shares: { ken: 0.3, ryu: 0.7 } as Record<
					import("../model/scenario.js").PartyId,
					number
				>,
				turnout_rate: 0.6,
			},
			{
				id: "majority" as import("../model/scenario.js").GroupId,
				population_share: majorityShare,
				vote_shares: { ken: 0.55, ryu: 0.45 } as Record<
					import("../model/scenario.js").PartyId,
					number
				>,
				turnout_rate: 0.7,
			},
		],
	};
}

function makeMajorityMinorityCriterion(
	minShare: number,
	minDistricts: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-mjm" as import("../model/scenario.js").CriterionId,
		required,
		description: `At least ${minDistricts} majority-minority district(s)`,
		criterion: {
			type: "majority_minority",
			group_filter: {
				group_ids: ["minority" as import("../model/scenario.js").GroupId],
			},
			min_eligible_share: minShare,
			min_districts: minDistricts,
		},
	};
}

// Spike precincts for the 4-precinct map (majority_minority only reads scenario precincts)
const MJM_SPIKE_PRECINCTS = [
	makePrecinct(0, 1000, 0.55, 0.45, [null, null, null, null, null, null]),
	makePrecinct(1, 1000, 0.55, 0.45, [null, null, null, null, null, null]),
	makePrecinct(2, 1000, 0.3, 0.7, [null, null, null, null, null, null]),
	makePrecinct(3, 1000, 0.3, 0.7, [null, null, null, null, null, null]),
];
// Scenario precincts: D1 (idx 0,1) have 30% minority; D2 (idx 2,3) have 60% minority
const MJM_SCENARIO_PRECINCTS = [
	makeScenarioPrecinct(0, 1000, 0.3),
	makeScenarioPrecinct(1, 1000, 0.3),
	makeScenarioPrecinct(2, 1000, 0.6),
	makeScenarioPrecinct(3, 1000, 0.6),
];
const MJM_ASSIGNMENTS = new Map([
	[0, 1],
	[1, 1],
	[2, 2],
	[3, 2],
]);

test("majority_minority: 1 qualifying district ≥ min_districts=1 → pass", () => {
	const result = runEval(
		[makeMajorityMinorityCriterion(0.5, 1)],
		MJM_SPIKE_PRECINCTS,
		MJM_ASSIGNMENTS,
		2,
		RULES_LENIENT,
		MJM_SCENARIO_PRECINCTS,
	);
	assertTrue(result.criterionResults[0]!.passed, "1 ≥ 1 qualifying districts should pass");
	assertTrue(result.overallPass, "overall pass");
});

test("majority_minority: 1 qualifying district < min_districts=2 → fail", () => {
	const result = runEval(
		[makeMajorityMinorityCriterion(0.5, 2)],
		MJM_SPIKE_PRECINCTS,
		MJM_ASSIGNMENTS,
		2,
		RULES_LENIENT,
		MJM_SCENARIO_PRECINCTS,
	);
	assertFalse(result.criterionResults[0]!.passed, "1 < 2 qualifying districts should fail");
	assertFalse(result.overallPass, "overall fail");
});

test("majority_minority: no scenario precincts provided → fail with message", () => {
	const result = runEval(
		[makeMajorityMinorityCriterion(0.5, 1)],
		MJM_SPIKE_PRECINCTS,
		MJM_ASSIGNMENTS,
		2,
		RULES_LENIENT,
		// no scenarioPrecincts → default []
	);
	assertFalse(result.criterionResults[0]!.passed, "missing scenario precincts → fail");
});

// ─── safe_seats tests ─────────────────────────────────────────────────────────
//
// margin = round((winnerShare − runnerUpShare) * 1000) / 1000. With only R/D
// populated (minor parties 0) and one precinct per district, a precinct's
// partyShare IS the district share, so margins are exact:
//   R 0.62 / D 0.38 → margin 0.24   (above a 0.20 threshold)
//   R 0.60 / D 0.40 → margin 0.20   (exactly == threshold; >= must count it)
//   R 0.55 / D 0.45 → margin 0.10   (below threshold; must NOT count)

function makeSafeSeatsCriterion(
	party: string,
	margin: number,
	minCount: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-safe" as import("../model/scenario.js").CriterionId,
		required,
		description: `Party ${party} holds ${minCount} safe seat(s) (margin ≥ ${margin})`,
		criterion: {
			type: "safe_seats",
			party: party as import("../model/scenario.js").PartyId,
			margin,
			min_count: minCount,
		},
	};
}

// Three R-won districts at three different margins (above / exactly == / below 0.20).
const SAFE_PRECINCTS = [
	makePrecinct(0, 1000, 0.62, 0.38, [null, null, null, null, null, null]), // margin 0.24
	makePrecinct(1, 1000, 0.6, 0.4, [null, null, null, null, null, null]), // margin 0.20
	makePrecinct(2, 1000, 0.55, 0.45, [null, null, null, null, null, null]), // margin 0.10
];
const SAFE_ASSIGNMENTS = new Map([
	[0, 1],
	[1, 2],
	[2, 3],
]);

test("safe_seats: a district won by margin ABOVE threshold counts", () => {
	// threshold 0.20, min_count 1 → the 0.24-margin district alone satisfies it.
	const result = runEval(
		[makeSafeSeatsCriterion("ken", 0.2, 1)],
		SAFE_PRECINCTS,
		SAFE_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(result.criterionResults[0]!.passed, "1 safe seat (margin 0.24 ≥ 0.20) → pass");
});

test("safe_seats: margin EXACTLY == threshold counts (>= boundary)", () => {
	// threshold 0.20, min_count 2 → needs both the 0.24 AND the exactly-0.20 district.
	// Only passes if the boundary margin (0.20) is counted by the `>=` comparison.
	const result = runEval(
		[makeSafeSeatsCriterion("ken", 0.2, 2)],
		SAFE_PRECINCTS,
		SAFE_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(
		result.criterionResults[0]!.passed,
		"2 safe seats incl. the exactly-0.20 district (>= boundary) → pass",
	);
});

test("safe_seats: margin just BELOW threshold does not count", () => {
	// threshold 0.20, min_count 3 → would need the 0.10-margin district too, but it
	// must NOT count, so only 2 qualify and the criterion fails.
	const result = runEval(
		[makeSafeSeatsCriterion("ken", 0.2, 3)],
		SAFE_PRECINCTS,
		SAFE_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(
		result.criterionResults[0]!.passed,
		"only 2 of 3 districts ≥ 0.20 margin (the 0.10 one excluded) → 3rd seat missing → fail",
	);
});

test("safe_seats: safeCount < min_count fails", () => {
	// threshold 0.20, min_count 2 but only ONE district provided (margin 0.24).
	const result = runEval(
		[makeSafeSeatsCriterion("ken", 0.2, 2)],
		[SAFE_PRECINCTS[0]!],
		new Map([[0, 1]]),
		1,
		RULES_LENIENT,
	);
	assertFalse(result.criterionResults[0]!.passed, "1 safe seat < min_count 2 → fail");
	assertFalse(result.overallPass, "overall fail");
});

// ─── competitive_seats tests ──────────────────────────────────────────────────
//
// competitive = districts with margin <= c.margin. Reuses SAFE_PRECINCTS:
//   margins are 0.24, 0.20, 0.10. A threshold of 0.20 counts the 0.20 (boundary)
//   and 0.10 districts → 2 competitive; the 0.24 district is excluded.

function makeCompetitiveSeatsCriterion(
	margin: number,
	minCount: number,
	required = true,
): SuccessCriterion {
	return {
		id: "sc-comp" as import("../model/scenario.js").CriterionId,
		required,
		description: `At least ${minCount} competitive seat(s) (margin ≤ ${margin})`,
		criterion: { type: "competitive_seats", margin, min_count: minCount },
	};
}

test("competitive_seats: boundary margin (== threshold) counts as competitive", () => {
	// threshold 0.20 → districts with margin ≤ 0.20 are the 0.20 and 0.10 ones (2);
	// requiring 2 passes only if the boundary 0.20 district is counted (margin <= threshold).
	const result = runEval(
		[makeCompetitiveSeatsCriterion(0.2, 2)],
		SAFE_PRECINCTS,
		SAFE_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(
		result.criterionResults[0]!.passed,
		"2 competitive seats incl. the exactly-0.20 boundary district → pass",
	);
});

test("competitive_seats: a district above the margin threshold is not competitive", () => {
	// Requiring 3 competitive at threshold 0.20 fails because the 0.24-margin
	// district is excluded (only 2 qualify).
	const result = runEval(
		[makeCompetitiveSeatsCriterion(0.2, 3)],
		SAFE_PRECINCTS,
		SAFE_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(result.criterionResults[0]!.passed, "only 2 of 3 districts ≤ 0.20 margin → fail");
});

// ─── N-party two-party-normalized metrics (GAME-112) ──────────────────────────
//
// A 3-party fixture (ken/ryu/ind), 3 districts, 1 precinct each, pop 1000.
//   D1  ken 0.5 / ryu 0.3 / ind 0.2  → ken wins
//   D2  ken 0.3 / ryu 0.5 / ind 0.2  → ryu wins
//   D3  ken 0.3 / ryu 0.5 / ind 0.2  → ryu wins
//
// TWO-PARTY efficiency gap (the correct, normalized value): win line = half the
// TWO-party vote (800/2=400), denominator = Σ two-party votes (2400).
//   D1 ken wins: ken_wasted 500−400=100, ryu_wasted 300
//   D2 ryu wins: ryu_wasted 500−400=100, ken_wasted 300
//   D3 ryu wins: ryu_wasted 100,        ken_wasted 300
//   ken_wasted 700, ryu_wasted 500 → |700−500|/2400 = 0.0833
// The OLD (all-vote) formula would give |600−300|/3000 = 0.10 — so a `lte 0.09`
// test PASSES only under two-party normalization (0.0833 ≤ 0.09; the old 0.10 fails it).

const EG3_PRECINCTS = [
	makePrecinct3(0, 1000, 0.5, 0.3, 0.2, [null, null, null, null, null, null]),
	makePrecinct3(1, 1000, 0.3, 0.5, 0.2, [null, null, null, null, null, null]),
	makePrecinct3(2, 1000, 0.3, 0.5, 0.2, [null, null, null, null, null, null]),
];
const EG3_ASSIGNMENTS = new Map([
	[0, 1],
	[1, 2],
	[2, 3],
]);

test("efficiency_gap (3-party): two-party gap ≈0.083 ≤ 0.09 → pass (old all-vote 0.10 would fail)", () => {
	const result = runEval(
		[makeEfficiencyGapCriterion("lte", 0.09)],
		EG3_PRECINCTS,
		EG3_ASSIGNMENTS,
		3,
		RULES_LENIENT,
		[],
		PARTIES3,
	);
	assertTrue(result.criterionResults[0]!.passed, "two-party gap 0.083 ≤ 0.09 → pass");
});

test("efficiency_gap (3-party): two-party gap ≈0.083 > 0.08 → fail (pins the value >0.08)", () => {
	const result = runEval(
		[makeEfficiencyGapCriterion("lte", 0.08)],
		EG3_PRECINCTS,
		EG3_ASSIGNMENTS,
		3,
		RULES_LENIENT,
		[],
		PARTIES3,
	);
	assertFalse(result.criterionResults[0]!.passed, "two-party gap 0.083 > 0.08 → fail");
});

// TWO-PARTY mean−median for ken: per-district two-party share ken/(ken+ryu):
//   D1 0.5/0.8=0.625,  D2 0.3/0.8=0.375,  D3 0.3/0.8=0.375
//   mean 0.4583, median 0.375 → diff +0.0833
// The OLD (raw all-vote share) formula would give shares [0.5,0.3,0.3] →
// mean 0.3667 − median 0.30 = 0.0667 — so a `lte 0.075` test FAILS only under
// two-party normalization (0.0833 > 0.075; the old 0.0667 would pass it).

test("mean_median (3-party): two-party diff ≈0.083 > 0.075 → fail (old raw 0.067 would pass)", () => {
	const result = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.075)],
		EG3_PRECINCTS,
		EG3_ASSIGNMENTS,
		3,
		RULES_LENIENT,
		[],
		PARTIES3,
	);
	assertFalse(result.criterionResults[0]!.passed, "two-party diff 0.083 > 0.075 → fail");
});

test("mean_median (3-party): two-party diff ≈0.083 ≤ 0.09 → pass (pins the value ≤0.09)", () => {
	const result = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.09)],
		EG3_PRECINCTS,
		EG3_ASSIGNMENTS,
		3,
		RULES_LENIENT,
		[],
		PARTIES3,
	);
	assertTrue(result.criterionResults[0]!.passed, "two-party diff 0.083 ≤ 0.09 → pass");
});

// ─── Behavior-preservation guard: tight-boundary 2-party values (GAME-112) ────
//
// The pre-existing 2-party threshold tests sit far from their boundaries, so they
// only catch gross regressions. These pin the exact two-party values so a formula
// change (e.g. reverting the two-party normalization) is caught. Two-party EG for
// EG_PRECINCTS is 0.0333; two-party mean-median for MM_GERRYMANDER (ken) is 0.1667.

test("efficiency_gap (2-party regression): value ≈0.0333 — ≤0.034 passes, ≤0.033 fails", () => {
	const pass = runEval(
		[makeEfficiencyGapCriterion("lte", 0.034)],
		EG_PRECINCTS,
		EG_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(pass.criterionResults[0]!.passed, "0.0333 ≤ 0.034 → pass");
	const fail = runEval(
		[makeEfficiencyGapCriterion("lte", 0.033)],
		EG_PRECINCTS,
		EG_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(fail.criterionResults[0]!.passed, "0.0333 > 0.033 → fail (pins the value)");
});

test("mean_median (2-party regression): gerrymander diff ≈0.1667 — ≤0.17 passes, ≤0.16 fails", () => {
	const pass = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.17)],
		MM_GERRYMANDER_PRECINCTS,
		MM_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertTrue(pass.criterionResults[0]!.passed, "0.1667 ≤ 0.17 → pass");
	const fail = runEval(
		[makeMeanMedianCriterion("ken", "lte", 0.16)],
		MM_GERRYMANDER_PRECINCTS,
		MM_ASSIGNMENTS,
		3,
		RULES_LENIENT,
	);
	assertFalse(fail.criterionResults[0]!.passed, "0.1667 > 0.16 → fail (pins the value)");
});

// ─── mean_median minor-party guard (GAME-112) ─────────────────────────────────
//
// Two-party normalization is only meaningful for a major party; targeting a MINOR
// party must fall back to the raw share (else pShare/(party1+party2) exceeds 1 and
// is meaningless). Fixture: ind raw shares [0.6, 0.2, 0.2] → guarded diff 0.133.
// WITHOUT the guard it would be ind/(ken+ryu) = [1.5, 0.25, 0.25] → diff 0.417.

const MINOR_TARGET_PRECINCTS = [
	makePrecinct3(0, 1000, 0.3, 0.1, 0.6, [null, null, null, null, null, null]),
	makePrecinct3(1, 1000, 0.4, 0.4, 0.2, [null, null, null, null, null, null]),
	makePrecinct3(2, 1000, 0.4, 0.4, 0.2, [null, null, null, null, null, null]),
];

test("mean_median (minor target): falls back to raw share — diff ≈0.133 ≤ 0.20 (ungarded 0.417 would fail)", () => {
	const result = runEval(
		[makeMeanMedianCriterion("ind", "lte", 0.2)],
		MINOR_TARGET_PRECINCTS,
		EG3_ASSIGNMENTS,
		3,
		RULES_LENIENT,
		[],
		PARTIES3,
	);
	assertTrue(
		result.criterionResults[0]!.passed,
		"raw-share diff 0.133 ≤ 0.20 → pass (the unguarded two-party 0.417 would fail)",
	);
});

summarize();
