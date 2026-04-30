/**
 * Unit tests for scenarioToSpike (GAME-037).
 *
 * Uses the shared TAP runner. Run via Bazel:
 *   bazel test //web/src/model:adapter_test
 *
 * Coverage:
 *   - correct precinct count produced from scenario
 *   - party vote-share mapping: first party → R, second → D; population-weighted
 *   - multi-group population-weighted vote shares
 *   - neighbor array: adjacent hex precincts correctly wired; non-adjacent null
 *   - district assignments: initial_district_id maps to 1-based spike district ID
 *   - unassigned precincts (no initial_district_id) → null in assignments
 *   - districtCount matches scenario.districts.length
 *   - precinct IDs are 0-based array indices
 */

import { scenarioToSpike } from "./adapter.js";
import type { Scenario, Party, District } from "./scenario.js";
import type { PartyId, DistrictId, PrecinctId } from "./scenario.js";
import { test, assertEqual, assertNull, assertNotNull, assertClose, summarize } from "../testing/test_runner.js";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function pid(s: string): PartyId { return s as unknown as PartyId; }
function did(s: string): DistrictId { return s as unknown as DistrictId; }
function pcid(s: string): PrecinctId { return s as unknown as PrecinctId; }

const PARTY_R: Party = { id: pid("r_party"), name: "Red", abbreviation: "R" };
const PARTY_D: Party = { id: pid("d_party"), name: "Blue", abbreviation: "D" };

function makeScenario(overrides: Partial<Scenario> & Pick<Scenario, "parties" | "districts" | "precincts">): Scenario {
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
		...overrides,
	};
}

function makeGroup(partyShares: Record<string, number>, populationShare = 1.0) {
	return {
		id: pcid("g1") as unknown as import("./scenario.js").GroupId,
		population_share: populationShare,
		vote_shares: partyShares as unknown as Record<PartyId, number>,
		turnout_rate: 1.0,
	};
}

function makePrecinct(
	q: number,
	r: number,
	groups: ReturnType<typeof makeGroup>[],
	initialDistrictId?: string,
) {
	return {
		id: pcid(`p${q}_${r}`),
		editable: true,
		position: { q, r },
		total_population: 100,
		demographic_groups: groups,
		initial_district_id: initialDistrictId !== undefined ? did(initialDistrictId) : null,
	};
}

// ─── Precinct count ───────────────────────────────────────────────────────────

test("scenarioToSpike: produces correct number of precincts", () => {
	const g = makeGroup({ [pid("r_party")]: 0.6, [pid("d_party")]: 0.4 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }, { id: did("d2") }],
		precincts: [
			makePrecinct(0, 0, [g], "d1"),
			makePrecinct(1, 0, [g], "d1"),
			makePrecinct(2, 0, [g], "d2"),
		],
	});
	const { precincts } = scenarioToSpike(scenario);
	assertEqual(precincts.length, 3, "3 precincts produced");
});

// ─── Precinct IDs are 0-based array indices ───────────────────────────────────

test("scenarioToSpike: precinct IDs are 0-based array indices", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1"), makePrecinct(1, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	assertEqual(precincts[0]!.id, 0, "first precinct id=0");
	assertEqual(precincts[1]!.id, 1, "second precinct id=1");
});

// ─── Party vote shares ────────────────────────────────────────────────────────

test("scenarioToSpike: first party → R, second party → D (single group)", () => {
	// 70% R, 30% D in a single demographic group
	const g = makeGroup({ [pid("r_party")]: 0.7, [pid("d_party")]: 0.3 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	const p = precincts[0]!;
	assertClose(p.partyShare.R, 0.7, 0.001, "R share");
	assertClose(p.partyShare.D, 0.3, 0.001, "D share");
	assertEqual(p.partyShare.L, 0, "L share");
});

test("scenarioToSpike: population-weighted across two groups", () => {
	// Group 1: 60% of pop, votes 80% R / 20% D → contributes R: 0.48, D: 0.12
	// Group 2: 40% of pop, votes 20% R / 80% D → contributes R: 0.08, D: 0.32
	// Total: R=0.56, D=0.44
	const g1 = makeGroup({ [pid("r_party")]: 0.8, [pid("d_party")]: 0.2 }, 0.6);
	const g2 = makeGroup({ [pid("r_party")]: 0.2, [pid("d_party")]: 0.8 }, 0.4);
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g1, g2], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	const p = precincts[0]!;
	assertClose(p.partyShare.R, 0.56, 0.001, "R share");
	assertClose(p.partyShare.D, 0.44, 0.001, "D share");
});

test("scenarioToSpike: R wins → winner R, correct margin", () => {
	const g = makeGroup({ [pid("r_party")]: 0.7, [pid("d_party")]: 0.3 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	assertEqual(precincts[0]!.previousResult.winner, "R", "winner");
	assertClose(precincts[0]!.previousResult.margin, 0.4, 0.01, "margin");
});

test("scenarioToSpike: D wins when D >= R", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	assertEqual(precincts[0]!.previousResult.winner, "D", "D wins on exact tie (D >= R)");
});

// ─── Neighbor lists ───────────────────────────────────────────────────────────

test("scenarioToSpike: neighbor lists — two adjacent precincts wired to each other", () => {
	// P0 at (0,0), P1 at (1,0).
	// HEX_DIRECTIONS[0]=[+1,0] → P0's edge-0 neighbor is at (1,0) = P1 (index 1)
	// HEX_DIRECTIONS[3]=[-1,0] → P1's edge-3 neighbor is at (0,0) = P0 (index 0)
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1"), makePrecinct(1, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	const p0 = precincts[0]!;
	const p1 = precincts[1]!;

	assertEqual(p0.neighbors.length, 6, "6-element neighbor array for p0");
	assertEqual(p0.neighbors[0], 1, "p0 edge-0 neighbor is p1 (index 1)");
	assertNull(p0.neighbors[1], "p0 edge-1 is null (no precinct there)");
	assertNull(p0.neighbors[2], "p0 edge-2 is null");
	assertNull(p0.neighbors[3], "p0 edge-3 is null");
	assertNull(p0.neighbors[4], "p0 edge-4 is null");
	assertNull(p0.neighbors[5], "p0 edge-5 is null");

	assertEqual(p1.neighbors[3], 0, "p1 edge-3 neighbor is p0 (index 0)");
	assertNull(p1.neighbors[0], "p1 edge-0 is null");
});

test("scenarioToSpike: isolated precinct has all-null neighbor array", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g], "d1")],
	});
	const { precincts } = scenarioToSpike(scenario);
	const p = precincts[0]!;
	assertEqual(p.neighbors.length, 6, "6 neighbors");
	assertEqual(p.neighbors.filter(n => n === null).length, 6, "all null");
});

// ─── District assignments ─────────────────────────────────────────────────────

test("scenarioToSpike: initial_district_id maps to 1-based spike district ID", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }, { id: did("d2") }],
		precincts: [
			makePrecinct(0, 0, [g], "d1"), // → spike district 1
			makePrecinct(1, 0, [g], "d2"), // → spike district 2
		],
	});
	const { assignments } = scenarioToSpike(scenario);
	assertEqual(assignments.get(0), 1, "precinct 0 → district 1");
	assertEqual(assignments.get(1), 2, "precinct 1 → district 2");
});

test("scenarioToSpike: precinct with null initial_district_id → null assignment", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }],
		precincts: [makePrecinct(0, 0, [g])], // no initial_district_id
	});
	const { assignments } = scenarioToSpike(scenario);
	assertNull(assignments.get(0), "unassigned precinct → null");
});

// ─── District count ───────────────────────────────────────────────────────────

test("scenarioToSpike: districtCount matches scenario.districts.length", () => {
	const g = makeGroup({ [pid("r_party")]: 0.5, [pid("d_party")]: 0.5 });
	const scenario = makeScenario({
		parties: [PARTY_R, PARTY_D],
		districts: [{ id: did("d1") }, { id: did("d2") }, { id: did("d3") }],
		precincts: [makePrecinct(0, 0, [g], "d1")],
	});
	const { districtCount } = scenarioToSpike(scenario);
	assertEqual(districtCount, 3, "districtCount = 3");
});

summarize();
