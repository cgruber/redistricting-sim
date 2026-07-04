/**
 * Unit tests for gameStore.ts (GAME-045).
 *
 * Both zustand/vanilla and zundo work in Node without a DOM, so all store
 * behaviors are exercisable here without Playwright.
 *
 * Run via Bazel:
 *   bazel test //web/src/store:gameStore_test
 *
 * Coverage:
 *   - initial state: activeDistrict, assignments, simulationResult
 *   - setActiveDistrict
 *   - paintPrecinct: assignment update, no-op guard, simulationResult non-null
 *   - paintStroke: batch assignment; no-op when all precincts already in target
 *   - resetToInitial: restores original assignments after changes
 *   - restoreAssignments: sets provided map and active district
 *   - undo: reverting a paintPrecinct restores prior assignment
 */

import { createGameStore } from "./gameStore.js";
import type { Scenario, Party, District, Precinct as ScenarioPrecinct } from "../model/scenario.js";
import type { PartyId, DistrictId, PrecinctId } from "../model/scenario.js";
import type { AssignmentMap } from "../model/runtime.js";
import {
	test,
	assertEqual,
	assertNotNull,
	assertNull,
	assertTrue,
	summarize,
} from "../testing/test_runner.js";

// ─── Scenario fixture helpers ─────────────────────────────────────────────────

function pid(s: string): PartyId {
	return s as unknown as PartyId;
}
function did(s: string): DistrictId {
	return s as unknown as DistrictId;
}
function pcid(s: string): PrecinctId {
	return s as unknown as PrecinctId;
}

const PARTY_R: Party = { id: pid("r"), name: "Red", abbreviation: "R" };
const PARTY_D: Party = { id: pid("d"), name: "Blue", abbreviation: "D" };
const DISTRICT_1: District = { id: did("d1") };
const DISTRICT_2: District = { id: did("d2") };

function makeGroup(rShare: number) {
	return {
		id: pcid("g1") as unknown as import("../model/scenario.js").GroupId,
		population_share: 1.0,
		vote_shares: { [pid("r")]: rShare, [pid("d")]: 1 - rShare } as unknown as Record<
			PartyId,
			number
		>,
		turnout_rate: 1.0,
	};
}

function makePrecinct(q: number, r: number, districtId: string): ScenarioPrecinct {
	return {
		id: pcid(`p${q}_${r}`),
		editable: true,
		position: { q, r },
		total_population: 100,
		demographic_groups: [makeGroup(0.6)],
		initial_district_id: did(districtId),
	};
}

/**
 * Minimal 3-precinct, 2-district scenario:
 *   p0 at (0,0) → d1  (spike district 1)
 *   p1 at (1,0) → d1  (spike district 1)
 *   p2 at (0,1) → d2  (spike district 2)
 */
function makeScenario(): Scenario {
	return {
		format_version: "1",
		id: "test-001" as unknown as Scenario["id"],
		title: "Test",
		election_type: "congressional",
		region: { id: "r1" as unknown as Scenario["region"]["id"], name: "Test Region" },
		geometry: { type: "hex_axial" },
		events: [],
		rules: { population_tolerance: 0.05, contiguity: "allowed" },
		success_criteria: [],
		narrative: {
			character: { name: "T", role: "Tester", motivation: "Testing" },
			intro_slides: [],
			objective: "Test",
		},
		parties: [PARTY_R, PARTY_D],
		districts: [DISTRICT_1, DISTRICT_2],
		precincts: [makePrecinct(0, 0, "d1"), makePrecinct(1, 0, "d1"), makePrecinct(0, 1, "d2")],
	};
}

// ─── Initial state ────────────────────────────────────────────────────────────

test("createGameStore: initial activeDistrict is 1", () => {
	const { store } = createGameStore(makeScenario());
	assertEqual(store.getState().activeDistrict, 1, "activeDistrict = 1");
});

test("createGameStore: initial assignments match scenario initial_district_id", () => {
	const { store } = createGameStore(makeScenario());
	const { assignments } = store.getState();
	assertEqual(assignments.get(0), 1, "precinct 0 → district 1");
	assertEqual(assignments.get(1), 1, "precinct 1 → district 1");
	assertEqual(assignments.get(2), 2, "precinct 2 → district 2");
});

test("createGameStore: simulationResult is non-null on creation", () => {
	const { store } = createGameStore(makeScenario());
	assertNotNull(store.getState().simulationResult, "simulationResult present");
});

// ─── setActiveDistrict ────────────────────────────────────────────────────────

test("setActiveDistrict: changes activeDistrict", () => {
	const { store } = createGameStore(makeScenario());
	store.getState().setActiveDistrict(2);
	assertEqual(store.getState().activeDistrict, 2, "activeDistrict = 2");
});

// ─── paintPrecinct ────────────────────────────────────────────────────────────

test("paintPrecinct: moves precinct to active district", () => {
	const { store } = createGameStore(makeScenario());
	store.getState().setActiveDistrict(2);
	store.getState().paintPrecinct(0); // move precinct 0 from d1 → d2
	assertEqual(store.getState().assignments.get(0), 2, "precinct 0 → district 2");
});

test("paintPrecinct: simulationResult remains non-null after paint", () => {
	const { store } = createGameStore(makeScenario());
	store.getState().setActiveDistrict(2);
	store.getState().paintPrecinct(0);
	assertNotNull(store.getState().simulationResult, "simulationResult non-null after paint");
});

test("paintPrecinct: no-op if precinct already in target district", () => {
	const { store } = createGameStore(makeScenario());
	const before = store.getState().assignments;
	store.getState().setActiveDistrict(1);
	store.getState().paintPrecinct(0); // precinct 0 is already in district 1
	assertTrue(store.getState().assignments === before, "assignments reference unchanged on no-op");
});

// ─── paintStroke ──────────────────────────────────────────────────────────────

test("paintStroke: assigns batch of precincts to target district", () => {
	const { store } = createGameStore(makeScenario());
	store.getState().paintStroke([0, 2], 2); // move precincts 0 and 2 → district 2
	assertEqual(store.getState().assignments.get(0), 2, "precinct 0 → district 2");
	assertEqual(store.getState().assignments.get(2), 2, "precinct 2 → district 2");
	assertEqual(store.getState().assignments.get(1), 1, "precinct 1 unchanged");
});

test("paintStroke: no-op when all precincts already in target district", () => {
	const { store } = createGameStore(makeScenario());
	const before = store.getState().assignments;
	store.getState().paintStroke([0, 1], 1); // 0 and 1 are already in district 1
	assertTrue(store.getState().assignments === before, "assignments reference unchanged");
});

// ─── resetToInitial ───────────────────────────────────────────────────────────

test("resetToInitial: restores assignments after changes", () => {
	const { store } = createGameStore(makeScenario());
	// Make several changes
	store.getState().setActiveDistrict(2);
	store.getState().paintPrecinct(0);
	store.getState().paintPrecinct(1);
	assertEqual(store.getState().assignments.get(0), 2, "precinct 0 moved (pre-reset)");
	// Reset
	store.getState().resetToInitial();
	const { assignments } = store.getState();
	assertEqual(assignments.get(0), 1, "precinct 0 restored → district 1");
	assertEqual(assignments.get(1), 1, "precinct 1 restored → district 1");
	assertEqual(assignments.get(2), 2, "precinct 2 unchanged → district 2");
});

// ─── restoreAssignments ───────────────────────────────────────────────────────

test("restoreAssignments: sets provided assignment map and active district", () => {
	const { store } = createGameStore(makeScenario());
	const custom: AssignmentMap = new Map([
		[0, 2],
		[1, 2],
		[2, 1],
	]);
	store.getState().restoreAssignments(custom, 2);
	const state = store.getState();
	assertEqual(state.assignments.get(0), 2, "precinct 0 → district 2");
	assertEqual(state.assignments.get(1), 2, "precinct 1 → district 2");
	assertEqual(state.assignments.get(2), 1, "precinct 2 → district 1");
	assertEqual(state.activeDistrict, 2, "activeDistrict = 2");
});

// ─── undo ─────────────────────────────────────────────────────────────────────

test("undo: reverts a paintPrecinct to previous assignment", () => {
	const { store } = createGameStore(makeScenario());
	store.getState().setActiveDistrict(2);
	store.getState().paintPrecinct(0); // move precinct 0 → district 2
	assertEqual(store.getState().assignments.get(0), 2, "precinct 0 → district 2 (post-paint)");

	// Access zundo temporal store and undo
	const temporal = (store as unknown as { temporal: { getState: () => { undo: () => void } } })
		.temporal;
	temporal.getState().undo();

	assertEqual(
		store.getState().assignments.get(0),
		1,
		"precinct 0 restored → district 1 (post-undo)",
	);
});

test("undo: reverts assignments but leaves the live active district untouched (GAME-106)", () => {
	const { store } = createGameStore(makeScenario());

	// Paint a precinct while district 2 is active → records a history snapshot.
	store.getState().setActiveDistrict(2);
	store.getState().paintPrecinct(0); // precinct 0: d1 → d2
	assertEqual(store.getState().assignments.get(0), 2, "precinct 0 → district 2 (post-paint)");

	// Change the brush selection AFTER the last assignment-changing snapshot.
	// (No new snapshot: assignments are unchanged, so the equality gate skips it.)
	store.getState().setActiveDistrict(1);

	const temporal = (store as unknown as { temporal: { getState: () => { undo: () => void } } })
		.temporal;
	temporal.getState().undo();

	// Assignments revert to the pre-paint state...
	assertEqual(
		store.getState().assignments.get(0),
		1,
		"precinct 0 reverted → district 1 (post-undo)",
	);
	// ...but the active district stays the live value (1), not the snapshot value (2).
	assertEqual(store.getState().activeDistrict, 1, "activeDistrict unchanged by undo (stays 1)");
});

// ─── GAME-118: home-base independent wiring (adapter → store → runElection) ─────
//
// The advisor's gate: a pure simulateDistrict test can't catch a dropped wire. This
// exercises the real path — createGameStore runs the adapter (resolving the home
// coord), builds GameState, and runs the election. If independentHomes fails to
// thread through, the independent silently wins everywhere it leads and both asserts
// below break.

const PARTY_IND: Party = { id: pid("ind"), name: "Independent", abbreviation: "I" };

function makeGroup3(rShare: number, dShare: number, indShare: number) {
	return {
		id: pcid("g1") as unknown as import("../model/scenario.js").GroupId,
		population_share: 1.0,
		vote_shares: {
			[pid("r")]: rShare,
			[pid("d")]: dShare,
			[pid("ind")]: indShare,
		} as unknown as Record<PartyId, number>,
		turnout_rate: 1.0,
	};
}

function makePrecinct3(
	q: number,
	r: number,
	districtId: string,
	group: ReturnType<typeof makeGroup3>,
): ScenarioPrecinct {
	return {
		id: pcid(`p${q}_${r}`),
		editable: true,
		position: { q, r },
		total_population: 100,
		demographic_groups: [group],
		initial_district_id: did(districtId),
	};
}

// A 3-party scenario with a home-base independent (slot 2) whose home is precinct p0
// at (0,0) in district 1. Both precincts lean independent (.45); the independent must
// win d1 (home) and be excluded from d2 (a major takes it).
function makeIndependentScenario(): Scenario {
	return {
		format_version: "1",
		id: "test-ind-001" as unknown as Scenario["id"],
		title: "Test Independent",
		election_type: "congressional",
		region: { id: "r1" as unknown as Scenario["region"]["id"], name: "Test Region" },
		geometry: { type: "hex_axial" },
		events: [],
		rules: { population_tolerance: 0.05, contiguity: "allowed" },
		success_criteria: [],
		narrative: {
			character: { name: "T", role: "Tester", motivation: "Testing" },
			intro_slides: [],
			objective: "Test",
		},
		parties: [PARTY_R, PARTY_D, { ...PARTY_IND, independent: true, home: { q: 0, r: 0 } }],
		districts: [DISTRICT_1, DISTRICT_2],
		precincts: [
			makePrecinct3(0, 0, "d1", makeGroup3(0.3, 0.25, 0.45)), // I's home (d1)
			makePrecinct3(1, 0, "d2", makeGroup3(0.3, 0.25, 0.45)), // away (d2)
		],
	};
}

test("createGameStore (GAME-118): independentHomes is carried from the scenario into GameState", () => {
	const { store } = createGameStore(makeIndependentScenario());
	const { independentHomes } = store.getState();
	assertNotNull(independentHomes, "independentHomes present on GameState");
	assertEqual(independentHomes!.get(pid("ind")), 0, "I's home resolves to precinct index 0");
});

test("createGameStore (GAME-118): independent wins its home district but is excluded elsewhere", () => {
	const { store } = createGameStore(makeIndependentScenario());
	const result = store.getState().simulationResult!;
	const d1 = result.districtResults.find((r) => r.districtId === 1)!;
	const d2 = result.districtResults.find((r) => r.districtId === 2)!;

	assertEqual(d1.winner, pid("ind"), "d1 (home): independent wins");
	assertEqual(d2.winner, pid("r"), "d2 (away): independent excluded → R wins");
	assertEqual(result.seatsByParty[pid("ind")] ?? 0, 1, "independent holds exactly one seat");
});

summarize();
