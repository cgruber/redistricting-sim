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
import type { AssignmentMap, GameState, Precinct } from "../model/runtime.js";
import type { PartyShare } from "../model/party.js";
import { winnerOf } from "../model/party.js";
import type { PartyId } from "../model/scenario.js";

import { test, assertEqual, assertClose, assertTrue, summarize } from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Party-agnostic keyspace (GAME-043): the runtime keys shares by PartyId. These
// stand in for the pre-GAME-043 fixed R/D/L/G/I keys; the ordered list drives the
// tie-break (first party wins ties, reproducing R>D>L>G>I).
const PARTIES = ["R", "D", "L", "G", "I"] as unknown as PartyId[];
const R = PARTIES[0]!;
const D = PARTIES[1]!;
const L = PARTIES[2]!;
const G = PARTIES[3]!;
const I = PARTIES[4]!;

function makePrecinct(index: number, r: number, d: number, pop: number): Precinct {
	const total = r + d;
	const rShare = total > 0 ? r / total : 0;
	const dShare = total > 0 ? d / total : 0;
	return {
		index,
		scenarioId: `p${index}` as unknown as import("../model/scenario.js").PrecinctId,
		coord: { q: 0, r: index },
		center: { x: index * 10, y: 0 },
		neighbors: [null, null, null, null, null, null],
		population: pop,
		voteShare: {
			[R]: rShare,
			[D]: dShare,
			[L]: 0,
			[G]: 0,
			[I]: 0,
		} as PartyShare,
		previousResult: { winner: D, margin: 0 },
	};
}

function makeState(precincts: Precinct[], assignments: AssignmentMap): GameState {
	return {
		precincts,
		parties: PARTIES,
		districtCount: 3,
		assignments,
		activeDistrict: 1,
		simulationResult: null,
	};
}

// ─── winnerOf tests (canonical tie-break, GAME-104) ─────────────────────────────

function share(p: Partial<Record<PartyId, number>>): PartyShare {
	return { [R]: 0, [D]: 0, [L]: 0, [G]: 0, [I]: 0, ...p } as PartyShare;
}

test("winnerOf: highest share wins", () => {
	assertEqual(winnerOf(share({ [R]: 0.3, [D]: 0.7 }), PARTIES), D, "D highest");
	assertEqual(winnerOf(share({ [R]: 0.6, [D]: 0.4 }), PARTIES), R, "R highest");
	assertEqual(winnerOf(share({ [R]: 0.1, [D]: 0.2, [L]: 0.7 }), PARTIES), L, "L highest");
});

test("winnerOf: exact R/D tie → R (first in parties order)", () => {
	// The canonical rule: an equal share never displaces an earlier-listed party.
	// This is the SAME rule the builder's displayed winner uses (GAME-104).
	assertEqual(winnerOf(share({ [R]: 0.5, [D]: 0.5 }), PARTIES), R, "R before D on a tie");
});

test("winnerOf: tie order is deterministic for L/G/I too (R>D>L>G>I)", () => {
	// All five equal → R (parties[0]).
	assertEqual(
		winnerOf(share({ [R]: 0.2, [D]: 0.2, [L]: 0.2, [G]: 0.2, [I]: 0.2 }), PARTIES),
		R,
		"5-way tie → R",
	);
	// D/L tie (R lower) → D, since D precedes L.
	assertEqual(winnerOf(share({ [R]: 0.1, [D]: 0.45, [L]: 0.45 }), PARTIES), D, "D before L");
	// L/G tie (others lower) → L, since L precedes G.
	assertEqual(
		winnerOf(share({ [R]: 0.1, [D]: 0.1, [L]: 0.4, [G]: 0.4 }), PARTIES),
		L,
		"L before G",
	);
	// G/I tie (others lower) → G, since G precedes I.
	assertEqual(
		winnerOf(share({ [R]: 0.1, [D]: 0.1, [L]: 0.1, [G]: 0.35, [I]: 0.35 }), PARTIES),
		G,
		"G before I",
	);
});

// ─── simulateDistrict tests ───────────────────────────────────────────────────

test("simulateDistrict: clear R-majority — winner R, margin correct", () => {
	// 70 R / 30 D → R wins by 0.40
	const p = makePrecinct(0, 70, 30, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments, PARTIES);

	assertEqual(result.districtId, 1, "districtId");
	assertEqual(result.winner, R, "winner");
	assertClose(result.voteTotals[R] ?? 0, 0.7, 0.001, "R share");
	assertClose(result.voteTotals[D] ?? 0, 0.3, 0.001, "D share");
	assertClose(result.margin, 0.4, 0.001, "margin");
	assertEqual(result.totalVotes, 100, "totalVotes");
	assertEqual(result.precinctCount, 1, "precinctCount");
});

test("simulateDistrict: clear D-majority — winner D", () => {
	// 20 R / 80 D → D wins by 0.60
	const p = makePrecinct(0, 20, 80, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments, PARTIES);

	assertEqual(result.winner, D, "winner");
	assertClose(result.margin, 0.6, 0.001, "margin");
});

test("simulateDistrict: near-tie — smaller margin, correct winner", () => {
	// 51 R / 49 D → R wins by 0.02
	const p = makePrecinct(0, 51, 49, 100);
	const assignments: AssignmentMap = new Map([[0, 1]]);
	const result = simulateDistrict(1, [p], assignments, PARTIES);

	assertEqual(result.winner, R, "winner");
	assertClose(result.margin, 0.02, 0.001, "margin");
});

test("simulateDistrict: two precincts aggregate correctly", () => {
	// P0: 60 R / 40 D, pop 100 → contributes 60 R-votes, 40 D-votes
	// P1: 20 R / 80 D, pop 100 → contributes 20 R-votes, 80 D-votes
	// Total: 80 R / 120 D, pop 200 → R=0.4, D=0.6 → D wins by 0.2
	const p0 = makePrecinct(0, 60, 40, 100);
	const p1 = makePrecinct(1, 20, 80, 100);
	const assignments: AssignmentMap = new Map([
		[0, 1],
		[1, 1],
	]);
	const result = simulateDistrict(1, [p0, p1], assignments, PARTIES);

	assertEqual(result.winner, D, "winner");
	assertClose(result.margin, 0.2, 0.001, "margin");
	assertEqual(result.totalVotes, 200, "totalVotes");
	assertEqual(result.precinctCount, 2, "precinctCount");
});

test("simulateDistrict: precinct in different district excluded", () => {
	// P0 in district 1, P1 in district 2 — only P0 should count
	const p0 = makePrecinct(0, 70, 30, 100);
	const p1 = makePrecinct(1, 10, 90, 100);
	const assignments: AssignmentMap = new Map([
		[0, 1],
		[1, 2],
	]);
	const result = simulateDistrict(1, [p0, p1], assignments, PARTIES);

	assertEqual(result.winner, R, "winner should be R (only P0 counted)");
	assertEqual(result.precinctCount, 1, "only 1 precinct counted");
	assertEqual(result.totalVotes, 100, "totalVotes");
});

// ─── runElection tests ────────────────────────────────────────────────────────

test("runElection: all precincts in one district — one result, correct seats", () => {
	const precincts = [makePrecinct(0, 70, 30, 100), makePrecinct(1, 60, 40, 100)];
	const assignments: AssignmentMap = new Map([
		[0, 1],
		[1, 1],
	]);
	const state = makeState(precincts, assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 1, "one district result");
	assertEqual(result.districtResults[0]!.winner, R, "district 1 winner");
	assertEqual(result.seatsByParty[R], 1, "R seats");
	assertEqual(result.seatsByParty[D] ?? 0, 0, "D seats");
});

test("runElection: three districts, mixed majorities — correct seat counts", () => {
	const p0 = makePrecinct(0, 70, 30, 100); // → D1: R
	const p1 = makePrecinct(1, 20, 80, 100); // → D2: D
	const p2 = makePrecinct(2, 25, 75, 100); // → D3: D
	const assignments: AssignmentMap = new Map([
		[0, 1],
		[1, 2],
		[2, 3],
	]);
	const state = makeState([p0, p1, p2], assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 3, "three district results");
	assertEqual(result.seatsByParty[R], 1, "R has 1 seat");
	assertEqual(result.seatsByParty[D], 2, "D has 2 seats");

	const d1 = result.districtResults.find((r) => r.districtId === 1)!;
	const d2 = result.districtResults.find((r) => r.districtId === 2)!;
	const d3 = result.districtResults.find((r) => r.districtId === 3)!;
	assertEqual(d1.winner, R, "district 1 winner");
	assertEqual(d2.winner, D, "district 2 winner");
	assertEqual(d3.winner, D, "district 3 winner");
});

test("runElection: some precincts unassigned (null) — only assigned districts in results", () => {
	const p0 = makePrecinct(0, 70, 30, 100);
	const p1 = makePrecinct(1, 20, 80, 100);
	const assignments: AssignmentMap = new Map([
		[0, 1],
		[1, null],
	]);
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
	const assignments: AssignmentMap = new Map([
		[0, 3],
		[1, 1],
	]);
	const state = makeState([p0, p1], assignments);
	const result = runElection(state);

	assertEqual(result.districtResults.length, 2, "two results");
	assertEqual(result.districtResults[0]!.districtId, 1, "first result is district 1");
	assertEqual(result.districtResults[1]!.districtId, 3, "second result is district 3");
});

summarize();
