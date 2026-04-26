/**
 * Unit tests for computeValidityStats (GAME-010).
 *
 * Uses the same hand-rolled TAP-like runner as loader_test.ts — no external
 * test framework required. Run via Bazel: bazel test //web/src/simulation:validity_test
 *
 * Coverage:
 *   Population balance:
 *     - all-in-one-district: deviation 0%, status "ok"
 *     - two districts equal split: both 0%, both "ok"
 *     - two districts unequal split: deviation and status computed correctly
 *     - deviation at exactly the tolerance boundary: "ok"
 *     - deviation just over tolerance: "over" / "under"
 *   Unassigned count:
 *     - all assigned: 0
 *     - some null: count matches
 *   Contiguity:
 *     - rules.contiguity === "allowed": returns null
 *     - single precinct in district: trivially contiguous
 *     - two adjacent precincts: contiguous
 *     - two non-adjacent precincts: non-contiguous
 */

import { computeValidityStats } from "./validity.js";
import type { Precinct } from "../model/types.js";
import type { ScenarioRules } from "../model/scenario.js";

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

function assertNull(actual: unknown, msg?: string): void {
  if (actual !== null) {
    throw new Error(`${msg ?? "assertNull"}: expected null, got ${JSON.stringify(actual)}`);
  }
}

function assertNotNull(actual: unknown, msg?: string): void {
  if (actual === null || actual === undefined) {
    throw new Error(`${msg ?? "assertNotNull"}: expected non-null, got ${String(actual)}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, msg?: string): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `${msg ?? "assertClose"}: expected ${expected} ±${tolerance}, got ${actual}`,
    );
  }
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

/**
 * Minimal Precinct with configurable neighbors (6-element array).
 * All other fields are placeholder values not relevant to validity computation.
 */
function makePrecinct(id: number, population: number, neighbors: (number | null)[]): Precinct {
  return {
    id,
    coord: { q: 0, r: id },
    center: { x: id * 10, y: 0 },
    neighbors,
    population,
    partyShare: { R: 0.5, D: 0.5, L: 0, G: 0, I: 0 },
    previousResult: { winner: "D", margin: 0 },
    demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 },
  };
}

/** Standard rules: contiguity required, 5% tolerance. */
const RULES_REQUIRED: ScenarioRules = {
  contiguity: "required",
  population_tolerance: 0.05,
};

/** Rules where contiguity check is skipped. */
const RULES_ALLOWED: ScenarioRules = {
  contiguity: "allowed",
  population_tolerance: 0.05,
};

// ─── Precinct fixtures ────────────────────────────────────────────────────────

// Three precincts in a chain: 0 — 1 — 2
// Neighbor index layout: [0]=lower-right, [1]=down, [2]=lower-left, [3]=upper-left, [4]=up, [5]=upper-right
// We use index 0 for "right neighbor" and index 3 for "left neighbor" to form a simple line.
const P0 = makePrecinct(0, 100, [1, null, null, null, null, null]);
const P1 = makePrecinct(1, 100, [2, null, null, 0, null, null]);
const P2 = makePrecinct(2, 100, [null, null, null, 1, null, null]);

// ─── Population balance tests ─────────────────────────────────────────────────

test("population: all precincts in one district — deviation 0%, status ok", () => {
  const precincts = [P0, P1, P2];
  const assignments = new Map([[0, 1], [1, 1], [2, 1]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_REQUIRED);

  assertEqual(stats.totalPopulation, 300, "totalPopulation");
  assertEqual(stats.idealPopulation, 300, "idealPopulation (1 district)");
  assertEqual(stats.districtPop.length, 1, "one district entry");

  const d1 = stats.districtPop[0]!;
  assertEqual(d1.districtId, 1, "districtId");
  assertEqual(d1.population, 300, "population");
  assertClose(d1.deviationPct, 0, 0.01, "deviationPct");
  assertEqual(d1.status, "ok", "status");
});

test("population: two districts equal split — both 0% deviation, both ok", () => {
  const precincts = [P0, P1];
  const assignments = new Map([[0, 1], [1, 2]]);
  const stats = computeValidityStats(precincts, assignments, 2, RULES_REQUIRED);

  assertEqual(stats.totalPopulation, 200, "totalPopulation");
  assertEqual(stats.idealPopulation, 100, "idealPopulation");
  assertEqual(stats.districtPop.length, 2, "two district entries");

  for (const d of stats.districtPop) {
    assertEqual(d.population, 100, `district ${d.districtId} population`);
    assertClose(d.deviationPct, 0, 0.01, `district ${d.districtId} deviationPct`);
    assertEqual(d.status, "ok", `district ${d.districtId} status`);
  }
});

test("population: uneven split — over/under computed correctly", () => {
  // District 1: 150 pop, District 2: 50 pop. Ideal = 100.
  // D1 deviation: (150-100)/100*100 = +50%; D2: (50-100)/100*100 = -50%
  const p0 = makePrecinct(0, 150, [null, null, null, null, null, null]);
  const p1 = makePrecinct(1, 50, [null, null, null, null, null, null]);
  const assignments = new Map([[0, 1], [1, 2]]);
  const stats = computeValidityStats([p0, p1], assignments, 2, RULES_REQUIRED);

  const d1 = stats.districtPop.find((d) => d.districtId === 1)!;
  const d2 = stats.districtPop.find((d) => d.districtId === 2)!;

  assertClose(d1.deviationPct, 50, 0.01, "D1 deviationPct");
  assertEqual(d1.status, "over", "D1 status");

  assertClose(d2.deviationPct, -50, 0.01, "D2 deviationPct");
  assertEqual(d2.status, "under", "D2 status");
});

test("population: deviation at exactly tolerance boundary — status ok", () => {
  // Tolerance = 5% (0.05). Ideal = 100. District at exactly 105 → deviation = 5% → ok.
  const p0 = makePrecinct(0, 105, [null, null, null, null, null, null]);
  const p1 = makePrecinct(1, 95, [null, null, null, null, null, null]);
  const assignments = new Map([[0, 1], [1, 2]]);
  const stats = computeValidityStats([p0, p1], assignments, 2, RULES_REQUIRED);

  const d1 = stats.districtPop.find((d) => d.districtId === 1)!;
  const d2 = stats.districtPop.find((d) => d.districtId === 2)!;

  // 5% exactly == tolerance * 100 → NOT over (strict inequality)
  assertEqual(d1.status, "ok", "D1 at exactly 5% should be ok");
  assertEqual(d2.status, "ok", "D2 at exactly -5% should be ok");
});

test("population: deviation just over tolerance — status over/under", () => {
  // Tolerance = 5%. Ideal = 100. District at 106 → deviation = 6% → over.
  const p0 = makePrecinct(0, 106, [null, null, null, null, null, null]);
  const p1 = makePrecinct(1, 94, [null, null, null, null, null, null]);
  const assignments = new Map([[0, 1], [1, 2]]);
  const stats = computeValidityStats([p0, p1], assignments, 2, RULES_REQUIRED);

  const d1 = stats.districtPop.find((d) => d.districtId === 1)!;
  const d2 = stats.districtPop.find((d) => d.districtId === 2)!;

  assertEqual(d1.status, "over", "D1 at 6% should be over");
  assertEqual(d2.status, "under", "D2 at -6% should be under");
});

// ─── Unassigned count tests ───────────────────────────────────────────────────

test("unassigned: all assigned — count is 0", () => {
  const precincts = [P0, P1, P2];
  const assignments = new Map([[0, 1], [1, 1], [2, 1]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_REQUIRED);
  assertEqual(stats.unassignedCount, 0, "unassignedCount");
});

test("unassigned: two null assignments — count is 2", () => {
  const precincts = [P0, P1, P2];
  const assignments = new Map<number, number | null>([[0, 1], [1, null], [2, null]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_REQUIRED);
  assertEqual(stats.unassignedCount, 2, "unassignedCount");
});

// ─── Contiguity tests ─────────────────────────────────────────────────────────

test("contiguity: rules.contiguity === 'allowed' returns null", () => {
  const precincts = [P0, P1, P2];
  const assignments = new Map([[0, 1], [1, 1], [2, 1]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_ALLOWED);
  assertNull(stats.contiguity, "contiguity should be null when allowed");
});

test("contiguity: single precinct in district is trivially contiguous", () => {
  const precincts = [P0];
  const assignments = new Map([[0, 1]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_REQUIRED);
  assertNotNull(stats.contiguity, "contiguity map should exist");
  assertEqual(stats.contiguity!.get(1), true, "single-precinct district is contiguous");
});

test("contiguity: two adjacent precincts in same district — contiguous", () => {
  // P0 and P1 are adjacent (P0.neighbors[0] = 1, P1.neighbors[3] = 0)
  const precincts = [P0, P1];
  const assignments = new Map([[0, 1], [1, 1]]);
  const stats = computeValidityStats(precincts, assignments, 1, RULES_REQUIRED);
  assertNotNull(stats.contiguity, "contiguity map should exist");
  assertEqual(stats.contiguity!.get(1), true, "adjacent precincts are contiguous");
});

test("contiguity: two non-adjacent precincts in same district — not contiguous", () => {
  // P0 and P2: P0.neighbors[0]=1 (not P2), P2.neighbors[3]=1 (not P0).
  // District 1 contains P0 and P2, which are only connected through P1 (in D2).
  const precincts = [P0, P1, P2];
  const assignments = new Map([[0, 1], [1, 2], [2, 1]]);
  const stats = computeValidityStats(precincts, assignments, 2, RULES_REQUIRED);
  assertNotNull(stats.contiguity, "contiguity map should exist");
  assertEqual(stats.contiguity!.get(1), false, "non-adjacent precincts are not contiguous");
  assertEqual(stats.contiguity!.get(2), true, "single-precinct district 2 is contiguous");
});

// ─── Report ───────────────────────────────────────────────────────────────────

console.log(`\n1..${testCount}`);
console.log(`# ${testCount - failCount} passed, ${failCount} failed`);
if (failCount > 0) throw new Error(`${failCount} test(s) failed`);
