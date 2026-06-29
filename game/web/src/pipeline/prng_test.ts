/**
 * Tests for the mulberry32 PRNG (prng.ts).
 *
 * Covers:
 *   - Determinism: same seed → same sequence
 *   - Independence: different seeds → different sequences
 *   - nextDouble: values in [min, max)
 *   - nextInt: integer outputs in [min, max]
 *   - Sequence advances: successive calls differ
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:prng_test
 */

import { makePrng } from "./prng.js";
import { test, assertEqual, summarize } from "../testing/test_runner.js";

// ─── Determinism ──────────────────────────────────────────────────────────────

test("prng: same seed produces same sequence", () => {
	const a = makePrng(42);
	const b = makePrng(42);
	for (let i = 0; i < 20; i++) {
		assertEqual(a.nextDouble(0, 1), b.nextDouble(0, 1));
	}
});

test("prng: different seeds produce different sequences", () => {
	const a = makePrng(42);
	const b = makePrng(99);
	let allSame = true;
	for (let i = 0; i < 10; i++) {
		if (a.nextDouble(0, 1) !== b.nextDouble(0, 1)) {
			allSame = false;
			break;
		}
	}
	assertEqual(allSame, false);
});

test("prng: seed 0 is valid and deterministic", () => {
	const a = makePrng(0);
	const b = makePrng(0);
	assertEqual(a.nextDouble(0, 1), b.nextDouble(0, 1));
});

// ─── Sequence advancement ─────────────────────────────────────────────────────

test("prng: successive nextDouble calls return distinct values", () => {
	const prng = makePrng(1);
	const v1 = prng.nextDouble(0, 1);
	const v2 = prng.nextDouble(0, 1);
	assertEqual(v1 !== v2, true);
});

test("prng: nextInt and nextDouble advance the same state", () => {
	// Two PRNGs with same seed; one mixes nextInt+nextDouble, the other doesn't.
	// They should diverge after the first mixed call.
	const a = makePrng(7);
	const b = makePrng(7);
	a.nextInt(0, 10); // consumes one draw from a
	b.nextDouble(0, 1); // consumes one draw from b — same underlying call
	// Next draw should match since both consumed one step
	assertEqual(a.nextDouble(0, 1), b.nextDouble(0, 1));
});

// ─── nextDouble range ─────────────────────────────────────────────────────────

test("prng: nextDouble returns values in [min, max)", () => {
	const prng = makePrng(12345);
	const min = 10;
	const max = 20;
	for (let i = 0; i < 1000; i++) {
		const v = prng.nextDouble(min, max);
		assertEqual(v >= min, true);
		assertEqual(v < max, true);
	}
});

test("prng: nextDouble respects negative range", () => {
	const prng = makePrng(999);
	for (let i = 0; i < 100; i++) {
		const v = prng.nextDouble(-5, -1);
		assertEqual(v >= -5, true);
		assertEqual(v < -1, true);
	}
});

// ─── nextInt range and integrality ────────────────────────────────────────────

test("prng: nextInt returns integers", () => {
	const prng = makePrng(17);
	for (let i = 0; i < 100; i++) {
		const v = prng.nextInt(-150, 150);
		assertEqual(Number.isInteger(v), true);
	}
});

test("prng: nextInt stays within [min, max] inclusive", () => {
	const prng = makePrng(37);
	const min = -150;
	const max = 150;
	for (let i = 0; i < 1000; i++) {
		const v = prng.nextInt(min, max);
		assertEqual(v >= min, true);
		assertEqual(v <= max, true);
	}
});

test("prng: nextInt with symmetric range produces both extremes over many draws", () => {
	// With 10,000 draws in [-10, 10], both endpoints should appear.
	const prng = makePrng(555);
	let sawMin = false;
	let sawMax = false;
	for (let i = 0; i < 10000; i++) {
		const v = prng.nextInt(-10, 10);
		if (v === -10) sawMin = true;
		if (v === 10) sawMax = true;
		if (sawMin && sawMax) break;
	}
	assertEqual(sawMin, true);
	assertEqual(sawMax, true);
});

test("prng: nextInt with single-value range always returns that value", () => {
	const prng = makePrng(1);
	for (let i = 0; i < 10; i++) {
		assertEqual(prng.nextInt(5, 5), 5);
	}
});

summarize();
