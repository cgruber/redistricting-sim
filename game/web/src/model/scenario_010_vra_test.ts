/**
 * Durable winnability + two-witness proof for scenario-010 "The 55% Problem" (GAME-078).
 *
 * This is the load-bearing proof that the VRA Scenario A is real, not asserted: it loads the
 * SHIPPED scenario-010.json through the real loader + adapter and runs the REAL evaluateCriteria
 * (plus computeDistrictCompactness / computeDistrictGroupShares) on three authored partitions,
 * with the REAL seed-77 population field weighting the majority_minority share — so the numbers
 * here are the game's numbers, not the design tool's uniform-population estimates.
 *
 *   W1  WIN   — the compact Voronoi 5-partition: every required criterion passes (winnable), with
 *               exactly ONE compact majority-Latino district.
 *   W2a START — the authored over-pack (the map the player starts on): its thin rim+spur arm packs
 *               Latino HIGHER than the compact winner but FAILS compactness. (Also fails balance —
 *               a documented deviation from "compactness-only"; see the spec header.)
 *   W2b CRACK — five vertical slices dilute the community below 50% everywhere: majority_minority
 *               FAILS while every other criterion still passes, proving the community is crackable
 *               (so the MM criterion is a real constraint, not free).
 *
 * The over-pack invariant — arm % > compact-winner % under real population weighting — is the one
 * a "solid southern cap" density model silently inverts; it is asserted explicitly below.
 *
 * Run via Bazel: bazel test //game/web/src/model:scenario_010_vra_test
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadScenario } from "./loader.js";
import { scenarioToRuntime } from "./adapter.js";
import type { AssignmentMap, DistrictId, GameState, Precinct } from "./runtime.js";
import type { GroupFilter } from "./scenario.js";
import {
	evaluateCriteria,
	computeDistrictCompactness,
	computeDistrictGroupShares,
} from "../simulation/evaluate.js";
import { computeValidityStats } from "../simulation/validity.js";
import { runElection } from "../simulation/election.js";
import { test, assertTrue, assertEqual, summarize } from "../testing/test_runner.js";

// ─── Load the shipped scenario-010.json from the bazel runfiles tree ───────────

function scenariosDir(): string {
	const runfiles = process.env["RUNFILES_DIR"];
	if (!runfiles) throw new Error("RUNFILES_DIR not set — must run via bazel test");
	for (const prefix of ["_main", ""]) {
		const dir = prefix
			? join(runfiles, prefix, "game", "scenarios")
			: join(runfiles, "game", "scenarios");
		try {
			readdirSync(dir);
			return dir;
		} catch {
			// try next prefix
		}
	}
	throw new Error("Scenarios directory not found in runfiles");
}

const json = JSON.parse(readFileSync(join(scenariosDir(), "scenario-010.json"), "utf8"));
const scenario = loadScenario(json);
const rt = scenarioToRuntime(scenario);
const LATINO: GroupFilter = { dimension: "ethnicity", value: "latino" };

// ─── Witness partitions (precinct index → 1-based district) ────────────────────

/** Build an AssignmentMap from a per-district list of precinct indices. */
function assignmentFromPartition(partition: number[][]): AssignmentMap {
	const m: AssignmentMap = new Map();
	partition.forEach((indices, d) => {
		for (const i of indices) m.set(i, (d + 1) as DistrictId);
	});
	return m;
}

// W1 WIN — the proven compact Voronoi 5-partition (from scenario-007's e2e win). D2 is the
// compact southern opportunity district. Indices are into the canonical (r,then q) disc order
// (index 0 = (0,-6)), which is the scenario-010.json precinct order.
const WIN = assignmentFromPartition([
	[
		33, 42, 43, 44, 52, 53, 54, 55, 56, 63, 64, 65, 66, 67, 68, 69, 77, 78, 79, 80, 81, 90, 91, 92,
		101, 102,
	],
	[
		76, 87, 88, 89, 97, 98, 99, 100, 106, 107, 108, 109, 110, 111, 114, 115, 116, 117, 118, 119,
		121, 122, 123, 124, 125, 126,
	],
	[
		59, 60, 61, 62, 70, 71, 72, 73, 74, 75, 82, 83, 84, 85, 86, 93, 94, 95, 96, 103, 104, 105, 112,
		113, 120,
	],
	[0, 1, 7, 8, 9, 15, 16, 17, 24, 25, 26, 27, 34, 35, 36, 37, 38, 45, 46, 47, 48, 49, 50, 57, 58],
	[2, 3, 4, 5, 6, 10, 11, 12, 13, 14, 18, 19, 20, 21, 22, 23, 28, 29, 30, 31, 32, 39, 40, 41, 51],
]);

// W2a START — the authored over-pack. This is exactly the initial map baked into the JSON, so
// read it straight off the runtime rather than re-transcribing it (guards spec↔test drift).
const START = rt.assignments;

// W2b CRACK — five vertical slices: sort precincts by pixel-x (q + r/2) and cut into five equal
// ranks. Each column crosses all latitudes, mixing the southern community with the anglo north,
// so no slice reaches a Latino majority. Tie-broken by index for determinism.
function crackAssignment(precincts: Precinct[]): AssignmentMap {
	const px = (p: Precinct): number => p.coord.q + p.coord.r * 0.5;
	const ordered = [...precincts].sort((a, b) => px(a) - px(b) || a.index - b.index);
	const m: AssignmentMap = new Map();
	ordered.forEach((p, rank) => {
		const d = Math.floor((rank * 5) / ordered.length); // 0..4
		m.set(p.index, (d + 1) as DistrictId);
	});
	return m;
}
const CRACK = crackAssignment(rt.precincts);

// ─── Full-stack evaluation harness (real validity + election + criteria) ───────

function evaluate(assignments: AssignmentMap) {
	const validity = computeValidityStats(
		rt.precincts,
		assignments,
		rt.districtCount,
		scenario.rules,
	);
	const state: GameState = {
		precincts: rt.precincts,
		parties: rt.parties,
		districtCount: rt.districtCount,
		assignments,
		activeDistrict: 1 as DistrictId,
		simulationResult: null,
		...(rt.independentHomes ? { independentHomes: rt.independentHomes } : {}),
	};
	const sim = runElection(state);
	const result = evaluateCriteria(
		scenario.success_criteria,
		validity,
		sim,
		scenario.rules,
		rt.precincts,
		assignments,
		rt.districtCount,
		rt.parties,
		scenario.precincts,
	);
	const compactness = computeDistrictCompactness(rt.precincts, assignments, rt.districtCount);
	const latino = computeDistrictGroupShares(
		scenario.precincts,
		assignments,
		rt.districtCount,
		LATINO,
	);
	return { result, compactness, latino };
}

function passed(result: ReturnType<typeof evaluate>["result"], id: string): boolean {
	const c = result.criterionResults.find((r) => r.criterionId === id);
	if (!c) throw new Error(`no criterion "${id}"`);
	return c.passed;
}
const fmt = (xs: number[]): string => xs.map((x) => x.toFixed(3)).join(", ");

const win = evaluate(WIN);
const start = evaluate(START);
const crack = evaluate(CRACK);

// Population-WEIGHTED Latino share of the two key districts (the design tool measured these
// UNWEIGHTED at 0.524 / 0.582; these are the real seed-77 numbers).
const winMmShares = win.latino.filter((s) => s >= 0.5);
const winOppShare = Math.max(...win.latino); // the single opportunity district
const startArmShare = start.latino[4]!; // D5 = the thin arm

console.log(
	`[W1 WIN]   compactness=[${fmt(win.compactness)}]  latino=[${fmt(win.latino)}]  overallPass=${win.result.overallPass}`,
);
console.log(
	`[W2a START] compactness=[${fmt(start.compactness)}]  latino=[${fmt(start.latino)}]  overallPass=${start.result.overallPass}`,
);
console.log(
	`[W2b CRACK] compactness=[${fmt(crack.compactness)}]  latino=[${fmt(crack.latino)}]  overallPass=${crack.result.overallPass}`,
);
console.log(
	`over-pack invariant: arm ${startArmShare.toFixed(3)} > compact winner ${winOppShare.toFixed(3)}`,
);

// ─── W1: the compact map WINS ──────────────────────────────────────────────────

test("W1 WIN: the compact Voronoi partition satisfies every required criterion", () => {
	assertTrue(win.result.overallPass, "WIN must pass overall (scenario is winnable)");
	assertTrue(passed(win.result, "sc-district-count"), "district_count must pass");
	assertTrue(passed(win.result, "sc-population-balance"), "population_balance must pass");
	assertTrue(passed(win.result, "sc-compactness"), "compactness must pass");
	assertTrue(passed(win.result, "sc-majority-minority"), "majority_minority must pass");
});

test("W1 WIN: every district is compact (≥ 0.42) and exactly one is a Latino majority", () => {
	assertTrue(
		Math.min(...win.compactness) >= 0.42,
		`min compactness ${Math.min(...win.compactness)} < 0.42`,
	);
	assertEqual(winMmShares.length, 1);
	// The opportunity district clears 50%+1 but sits below 55% — the "you didn't need 55%" beat.
	assertTrue(
		winOppShare >= 0.5,
		`opportunity district ${winOppShare} < 0.50 (would be unwinnable)`,
	);
	assertTrue(
		winOppShare < 0.55,
		`opportunity district ${winOppShare} ≥ 0.55 (over the "didn't need 55%" bound)`,
	);
});

// ─── W2a: the authored START (over-pack) FAILS, on compactness, with MM satisfied ──

test("W2a START: the over-packed starting map fails, and fails on compactness", () => {
	assertTrue(!start.result.overallPass, "START must NOT pass (it is the court-struck over-pack)");
	assertTrue(
		!passed(start.result, "sc-compactness"),
		"compactness must FAIL at start (the thin arm)",
	);
	// The over-pack DID create a majority-minority district — the defect is its SHAPE, not its share.
	assertTrue(
		passed(start.result, "sc-majority-minority"),
		"majority_minority passes at start (the arm is ★MM)",
	);
	// Exactly one district is sub-threshold on compactness: the thin rim+spur arm (D5).
	const sub = start.compactness.filter((c) => c < 0.42);
	assertEqual(sub.length, 1);
	assertTrue(start.compactness[4]! < 0.42, "the sub-threshold district is D5 (the arm)");
});

// ─── W2b: CRACKING the community makes majority_minority FAIL (and only that) ───

test("W2b CRACK: five vertical slices dilute the community — majority_minority fails, alone", () => {
	assertTrue(!crack.result.overallPass, "CRACK must NOT pass");
	assertTrue(
		!passed(crack.result, "sc-majority-minority"),
		"majority_minority must FAIL (community cracked)",
	);
	assertEqual(crack.latino.filter((s) => s >= 0.5).length, 0);
	// The crack fails ONLY on MM — it is otherwise a valid map (compact, balanced, fully assigned).
	assertTrue(passed(crack.result, "sc-compactness"), "compactness still passes under the crack");
	assertTrue(
		passed(crack.result, "sc-population-balance"),
		"population_balance still passes under the crack",
	);
	assertTrue(
		passed(crack.result, "sc-district-count"),
		"district_count still passes under the crack",
	);
});

// ─── The over-pack invariant: the arm out-packs the compact winner ─────────────

test("over-pack invariant: the thin arm packs Latino HIGHER than the compact winner", () => {
	assertTrue(startArmShare >= 0.5, `arm share ${startArmShare} < 0.50`);
	assertTrue(
		startArmShare > winOppShare,
		`arm ${startArmShare.toFixed(3)} must exceed compact winner ${winOppShare.toFixed(3)} (else the over-pack pedagogy inverts)`,
	);
});

summarize();
