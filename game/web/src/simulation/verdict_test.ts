/**
 * Unit tests for the win/star verdict projection (GAME-110).
 *
 * Hand-rolled TAP runner — no external test framework.
 * Run via Bazel: bazel test //game/web/src/simulation:verdict_test
 *
 * Coverage:
 *   computeStarCount:
 *     - all-required-pass + no optional → 1 star
 *     - each passed optional increments the star count
 *     - failed optional does not count
 *     - a failed required criterion → 0 stars
 *     - invalid map (mapIsValid=false) → 0 stars even when all criteria pass
 *   computeMaxStars:
 *     - 1 base + 1 per optional criterion
 *   buildValidityRows:
 *     - unassigned row emitted when no equivalent district_count criterion exists
 *     - unassigned row suppressed when a district_count criterion is present
 *     - per-district contiguity rows for each non-contiguous district
 *     - no rows when validity is clean
 */

import { computeStarCount, computeMaxStars, buildValidityRows } from "./verdict.js";
import type { CriterionResult } from "./evaluate.js";
import type { ValidityStats } from "./validity.js";
import type { CriterionId } from "../model/scenario.js";

import { test, assertEqual, summarize } from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function cr(required: boolean, passed: boolean, id = "c"): CriterionResult {
	return {
		criterionId: id as CriterionId,
		required,
		description: id,
		passed,
	};
}

function validity(over: Partial<ValidityStats>): ValidityStats {
	return {
		idealPopulation: 100,
		totalPopulation: 400,
		unassignedCount: 0,
		districtPop: [],
		contiguity: null,
		...over,
	};
}

// ─── computeStarCount ──────────────────────────────────────────────────────────

test("computeStarCount: all required pass, no optional → 1 star", () => {
	const results = [cr(true, true, "r1"), cr(true, true, "r2")];
	assertEqual(computeStarCount(results, true), 1);
});

test("computeStarCount: each passed optional increments", () => {
	const base = [cr(true, true, "r1")];
	assertEqual(computeStarCount([...base, cr(false, true, "o1")], true), 2);
	assertEqual(
		computeStarCount([...base, cr(false, true, "o1"), cr(false, true, "o2")], true),
		3,
	);
});

test("computeStarCount: failed optional does not count", () => {
	const results = [cr(true, true, "r1"), cr(false, true, "o1"), cr(false, false, "o2")];
	assertEqual(computeStarCount(results, true), 2);
});

test("computeStarCount: a failed required criterion → 0 stars", () => {
	const results = [cr(true, false, "r1"), cr(false, true, "o1")];
	assertEqual(computeStarCount(results, true), 0);
});

test("computeStarCount: invalid map → 0 stars even when all criteria pass", () => {
	const results = [cr(true, true, "r1"), cr(false, true, "o1")];
	assertEqual(computeStarCount(results, false), 0);
});

// ─── computeMaxStars ───────────────────────────────────────────────────────────

test("computeMaxStars: 1 base + 1 per optional", () => {
	assertEqual(computeMaxStars([cr(true, true)]), 1);
	assertEqual(computeMaxStars([cr(true, true), cr(false, false)]), 2);
	assertEqual(
		computeMaxStars([cr(true, true), cr(false, false), cr(false, true)]),
		3,
	);
});

// ─── buildValidityRows ─────────────────────────────────────────────────────────

test("buildValidityRows: emits unassigned row when no district_count criterion", () => {
	const rows = buildValidityRows(validity({ unassignedCount: 3 }), new Set());
	assertEqual(rows.length, 1);
	assertEqual(rows[0]!.criterionId as string, "validity:all-assigned");
	assertEqual(rows[0]!.passed, false);
	assertEqual(rows[0]!.detail, "3 precinct(s) unassigned");
});

test("buildValidityRows: suppresses unassigned row when district_count criterion present", () => {
	const rows = buildValidityRows(
		validity({ unassignedCount: 3 }),
		new Set(["district_count"]),
	);
	assertEqual(rows.length, 0);
});

test("buildValidityRows: per-district contiguity rows for each non-contiguous district", () => {
	const contiguity = new Map<number, boolean>([
		[0, true],
		[1, false],
		[2, false],
	]);
	const rows = buildValidityRows(validity({ contiguity }), new Set());
	assertEqual(rows.length, 2);
	assertEqual(rows[0]!.criterionId as string, "validity:contiguity-1");
	assertEqual(rows[1]!.criterionId as string, "validity:contiguity-2");
});

test("buildValidityRows: combines unassigned + contiguity rows", () => {
	const contiguity = new Map<number, boolean>([[0, false]]);
	const rows = buildValidityRows(validity({ unassignedCount: 1, contiguity }), new Set());
	assertEqual(rows.length, 2);
	assertEqual(rows[0]!.criterionId as string, "validity:all-assigned");
	assertEqual(rows[1]!.criterionId as string, "validity:contiguity-0");
});

test("buildValidityRows: no rows when validity is clean", () => {
	const contiguity = new Map<number, boolean>([[0, true], [1, true]]);
	const rows = buildValidityRows(validity({ unassignedCount: 0, contiguity }), new Set());
	assertEqual(rows.length, 0);
});

summarize();
