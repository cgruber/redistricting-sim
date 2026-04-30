/**
 * Unit tests for simulateDistrict and runElection (GAME-035).
 *
 * Uses the shared TAP runner. Run via Bazel:
 *   bazel test //web/src/simulation:election_test
 *
 * Coverage:
 *   simulateDistrict:
 *     - clear R-majority district: winner R, margin matches vote gap
 *     - clear D-majority district: winner D
 *     - near-tie: smaller margin, correct winner
 *     - empty district (no precincts): zero totals, margin 0
 *   runElection:
 *     - all precincts in one district: one result, correct winner + seats
 *     - three districts with mixed majorities: correct per-district results + seat counts
 *     - some precincts unassigned (null): only assigned districts appear in results
 *     - empty assignment map: empty districtResults, empty seatsByParty
 */

import { simulateDistrict, runElection } from "./election.js";
import type { Precinct, AssignmentMap, GameState } from "../model/types.js";

import { test, assertEqual, assertClose, assertTrue, summarize } from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePrecinct(id: number, r: number, d: number, pop: number): Precinct {
	const total = r + d;
	const rShare = total > 0 ? r / total : 0;
	const dShare = total > 0 ? d / total : 0;
	return {
		id,
		coord: { q: 0, r: id },
		center: { x: id * 10, y: 0 },
		neighbors: [null, null, null, null, null, null],
		population: pop,
		partyShare: { R: rShare, D: dShare, L: 0, G: 0, I: 0 },
		previousResult: { winner: "D", margin: 0 },
		demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 },
	};
}

function makeState(precincts: Precinct[], assignments: AssignmentMap): GameState {
	return {
		precincts,
		districtCount: 3,
		assignments,
		activeDistrict: 1,
		simulationResult: null,
	};
}

// ─── simulateDistrict tests ───────────────────────────────────────────────────

test("simulateDistrict: clear R-majority — winner R, margin correct", () => {
	// 70 R / 30 D → R wins by 0.40
	const p = makePrecinct(0, 70, 30, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments);

	assertEqual(result.districtId, 1, "districtId");
	assertEqual(result.winner, "R", "winner");
	assertClose(result.voteTotals.R, 0.7, 0.001, "R share");
	assertClose(result.voteTotals.D, 0.3, 0.001, "D share");
	assertClose(result.margin, 0.4, 0.001, "margin");
	assertEqual(result.totalVotes, 100, "totalVotes");
	assertEqual(result.precinctCount, 1, "precinctCount");
});

test("simulateDistrict: clear D-majority — winner D", () => {
	// 20 R / 80 D → D wins by 0.60
	const p = makePrecinct(0, 20, 80, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments);

	assertEqual(result.winner, "D", "winner");
	assertClose(result.margin, 0.6, 0.001, "margin");
});

test("simulateDistrict: near-tie — smaller margin, correct winner", () => {
	// 51 R / 49 D → R wins by 0.02
	const p = makePrecinct(0, 51, 49, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments);

	assertEqual(result.winner, "R", "winner");
	assertClose(result.margin, 0.02, 0.001, "margin");
});

test("simulateDistrict: two precincts aggregate correctly", () => {
	// P0: 60 R / 40 D, pop 100 → contributes 60 R-votes, 40 D-votes
	// P1: 20 R / 80 D, pop 100 → contributes 20 R-votes, 80 D-votes
	// Total: 80 R / 120 D, pop 200 → R=0.4, D=0.6 → D wins by 0.2
	const p0 = makePrecinct(0, 60, 40, 100);
	const p1 = makePrecinct(1, 20, 80, 100);
	const assignments: AssignmentMap = new Map([[0, 1], [1, 1]]);
	const result = simulateDistrict(1, [p0, p1], assignments);

	assertEqual(result.winner, "D", "winner");
	assertClose(result.margin, 0.2, 0.001, "margin");
	assertEqual(result.totalVotes, 200, "totalVotes");
	assertEqual(result.precinctCount, 2, "precinctCount");
});

test("simulateDistrict: precinct in different district excluded", () => {
	// P0 in district 1, P1 in district 2 — only P0 should count
	const p0 = makePrecinct(0, 70, 30, 100);
	const p1 = makePrecinct(1, 10, 90, 100);
	const assignments: AssignmentMap = new Map([[0, 1], [1, 2]]);
	const result = simulateDistrict(1, [p0, p1], assignments);

	assertEqual(result.winner, "R", "winner should be R (only P0 counted)");
	assertEqual(result.precinctCount, 1, "only 1 precinct counted");
	assertEqual(result.totalVotes, 100, "totalVotes");
});

// ─── runElection tests ────────────────────────────────────────────────────────

test("runElection: all precincts in one district — one result, correct seats", () => {
	const precincts = [makePrecinct(0, 70, 30, 100), makePrecinct(1, 60, 40, 100)];
	const assignments: AssignmentMap = new Map([[0, 1], [1, 1]]);
	const state = makeState(precincts, assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 1, "one district result");
	assertEqual(result.districtResults[0]!.winner, "R", "district 1 winner");
	assertEqual(result.seatsByParty["R"], 1, "R seats");
	assertEqual(result.seatsByParty["D"] ?? 0, 0, "D seats");
});

test("runElection: three districts, mixed majorities — correct seat counts", () => {
	const p0 = makePrecinct(0, 70, 30, 100); // → D1: R
	const p1 = makePrecinct(1, 20, 80, 100); // → D2: D
	const p2 = makePrecinct(2, 25, 75, 100); // → D3: D
	const assignments: AssignmentMap = new Map([[0, 1], [1, 2], [2, 3]]);
	const state = makeState([p0, p1, p2], assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 3, "three district results");
	assertEqual(result.seatsByParty["R"], 1, "R has 1 seat");
	assertEqual(result.seatsByParty["D"], 2, "D has 2 seats");

	const d1 = result.districtResults.find(r => r.districtId === 1)!;
	const d2 = result.districtResults.find(r => r.districtId === 2)!;
	const d3 = result.districtResults.find(r => r.districtId === 3)!;
	assertEqual(d1.winner, "R", "district 1 winner");
	assertEqual(d2.winner, "D", "district 2 winner");
	assertEqual(d3.winner, "D", "district 3 winner");
});

test("runElection: some precincts unassigned (null) — only assigned districts in results", () => {
	const p0 = makePrecinct(0, 70, 30, 100);
	const p1 = makePrecinct(1, 20, 80, 100);
	const assignments: AssignmentMap = new Map([[0, 1], [1, null]]);
	const state = makeState([p0, p1], assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 1, "only district 1 in results (p1 is unassigned)");
	assertEqual(result.districtResults[0]!.districtId, 1, "district 1 present");
});

test("runElection: empty assignment map — empty results", () => {
	const precincts = [makePrecinct(0, 70, 30, 100)];
	const assignments: AssignmentMap = new Map();
	const state = makeState(precincts, assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 0, "no district results");
	assertTrue(Object.keys(result.seatsByParty).length === 0, "no seats");
});

test("runElection: district results sorted by districtId", () => {
	// Insert precincts in reverse district order to verify sorting
	const p0 = makePrecinct(0, 70, 30, 100);
	const p1 = makePrecinct(1, 20, 80, 100);
	const assignments: AssignmentMap = new Map([[0, 3], [1, 1]]);
	const state = makeState([p0, p1], assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 2, "two results");
	assertEqual(result.districtResults[0]!.districtId, 1, "first result is district 1");
	assertEqual(result.districtResults[1]!.districtId, 3, "second result is district 3");
});

summarize();
