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
 *     - false when population out of tolerance
 *     - false when contiguity required and district is non-contiguous
 *     - true when all constraints met
 */

import { evaluateCriteria, isMapSubmittable } from "./evaluate.js";
import { computeValidityStats } from "./validity.js";
import { runElection } from "./election.js";
import type { Precinct, GameState, AssignmentMap } from "../model/types.js";
import type { ScenarioRules, SuccessCriterion } from "../model/scenario.js";

// ─── Minimal test runner ──────────────────────────────────────────────────────

let testCount = 0;
let failCount = 0;

function test(name: string, fn: () => void): void {
  testCount++;
  try {
    fn();
    console.log(`ok ${testCount} - ${name}`);
  } catch (e) {
    failCount++;
    console.log(`not ok ${testCount} - ${name}`);
    console.log(`  # ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(
      `${msg ?? "assertEqual"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assertTrue(actual: boolean, msg?: string): void {
  if (!actual) throw new Error(`${msg ?? "assertTrue"}: expected true`);
}

function assertFalse(actual: boolean, msg?: string): void {
  if (actual) throw new Error(`${msg ?? "assertFalse"}: expected false`);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePrecinct(
  id: number,
  population: number,
  partyR: number,
  partyD: number,
  neighbors: (number | null)[],
): Precinct {
  return {
    id,
    coord: { q: 0, r: id },
    center: { x: id * 10, y: 0 },
    neighbors,
    population,
    partyShare: { R: partyR, D: partyD, L: 0, G: 0, I: 0 },
    previousResult: { winner: partyR >= partyD ? "R" : "D", margin: Math.abs(partyR - partyD) },
    demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 },
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
  population_tolerance: 0.20,
};

const PARTY_MAP = new Map([["ken", "R"], ["ryu", "D"]]);

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

function makeSeatCountCriterion(party: string, op: import("../model/scenario.js").CompareOp, count: number, required = true): SuccessCriterion {
  return {
    id: "sc-seat" as import("../model/scenario.js").CriterionId,
    required,
    description: `Party ${party} wins ${count} seats`,
    criterion: { type: "seat_count", party: party as import("../model/scenario.js").PartyId, operator: op, count },
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
) {
  const validityStats = computeValidityStats(precincts, assignments, districtCount, rules);
  const state: GameState = {
    precincts,
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
    PARTY_MAP,
  );
}

// ─── district_count tests ─────────────────────────────────────────────────────

test("district_count: all assigned + all districts in use → pass", () => {
  // D1: precincts 0,1  D2: precincts 2,3
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
  assertTrue(result.criterionResults[0]!.passed, "criterion passed");
  assertTrue(result.overallPass, "overall pass");
});

test("district_count: unassigned precincts → fail", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, null], [3, 2]]);
  const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
  assertFalse(result.criterionResults[0]!.passed, "criterion failed");
  assertFalse(result.overallPass, "overall fail");
});

test("district_count: district 2 has no precincts → fail", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, 1], [3, 1]]);
  const result = runEval([makeDistrictCountCriterion()], FOUR_PRECINCTS, assignments, 2);
  assertFalse(result.criterionResults[0]!.passed, "criterion failed (district 2 empty)");
  assertFalse(result.overallPass, "overall fail");
});

// ─── population_balance tests ─────────────────────────────────────────────────

test("population_balance: equal split → pass", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const result = runEval([makePopBalanceCriterion()], FOUR_PRECINCTS, assignments, 2);
  assertTrue(result.criterionResults[0]!.passed, "equal pop → pass");
  assertTrue(result.overallPass, "overall pass");
});

test("population_balance: imbalanced split outside tolerance → fail", () => {
  // D1 gets 3 precincts (pop 3000), D2 gets 1 (pop 1000); ideal=2000; deviation=50% >> 5%
  const assignments = new Map([[0, 1], [1, 1], [2, 1], [3, 2]]);
  const result = runEval([makePopBalanceCriterion()], FOUR_PRECINCTS, assignments, 2);
  assertFalse(result.criterionResults[0]!.passed, "imbalanced → fail");
  assertFalse(result.overallPass, "overall fail");
});

// ─── compactness tests ────────────────────────────────────────────────────────

test("compactness: chain split in half — score below strict threshold → fail", () => {
  // D1: 0-1, D2: 2-3; chain, each district is linear 2-hex segment
  // interior fraction for 2-hex chain: 2 interior half-edges / 12 total = 0.167
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const result = runEval([makeCompactnessCriterion(0.45)], FOUR_PRECINCTS, assignments, 2);
  assertFalse(result.criterionResults[0]!.passed, "linear chain < 0.45 threshold");
  // optional criterion failure should not affect overall pass (no required criteria)
  assertTrue(result.overallPass, "optional fail does not fail overall");
});

test("compactness: threshold of 0 → always pass", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const result = runEval([makeCompactnessCriterion(0)], FOUR_PRECINCTS, assignments, 2);
  assertTrue(result.criterionResults[0]!.passed, "any compactness ≥ 0 → pass");
});

// ─── seat_count tests ─────────────────────────────────────────────────────────

test("seat_count: R wins 1 seat, criterion R gte 1 → pass", () => {
  // P0 and P1 in D1: P0 is R-lean (0.6/0.4), P1 is D-lean (0.4/0.6)
  // Aggregate for D1: R=0.5, D=0.5 → tie → R wins (plurality winner picks first tie)
  // D2: P2(R 0.6), P3(D 0.6) → R=0.5, D=0.5 → R wins
  // Actually let's use clearer setup: D1=P0+P1 R-overall, D2=P2+P3 D-overall
  // With equal pop, D1 avg: (0.6+0.4)/2=0.5R, (0.4+0.6)/2=0.5D → R wins by initial sort
  // Let me use 3:1 split for clear outcome
  const strongR = makePrecinct(10, 1000, 0.8, 0.2, [null, null, null, null, null, null]);
  const strongD = makePrecinct(11, 1000, 0.2, 0.8, [null, null, null, null, null, null]);
  const precincts = [strongR, strongD];
  const assignments = new Map([[0, 1], [1, 2]]);
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
  const assignments = new Map([[0, 1], [1, 2]]);
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
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const criteria: SuccessCriterion[] = [
    makeDistrictCountCriterion(true),   // required → pass
    makePopBalanceCriterion(true),      // required → pass
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
  const assignments = new Map([[0, 1], [1, 1], [2, 1], [3, 2]]);
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
  const assignments = new Map([[0, 1], [1, 1], [2, 2], [3, 2]]);
  const stats = computeValidityStats(precincts, assignments, 2, RULES);
  assertTrue(isMapSubmittable(stats, RULES), "valid map is submittable");
});

test("isMapSubmittable: unassigned precinct → false", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, null], [3, 2]]);
  const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
  assertFalse(isMapSubmittable(stats, RULES), "unassigned → not submittable");
});

test("isMapSubmittable: population out of tolerance → false", () => {
  const assignments = new Map([[0, 1], [1, 1], [2, 1], [3, 2]]);
  const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
  assertFalse(isMapSubmittable(stats, RULES), "imbalanced pop → not submittable");
});

test("isMapSubmittable: contiguity required + non-contiguous district → false", () => {
  // D1 gets 0 and 2 (non-adjacent in chain 0-1-2-3); D2 gets 1 and 3
  const assignments = new Map([[0, 1], [1, 2], [2, 1], [3, 2]]);
  const stats = computeValidityStats(FOUR_PRECINCTS, assignments, 2, RULES);
  assertFalse(isMapSubmittable(stats, RULES), "non-contiguous → not submittable");
});

// ─── TAP summary ─────────────────────────────────────────────────────────────

console.log(`\n1..${testCount}`);
if (failCount > 0) throw new Error(`${failCount} test(s) failed`);
