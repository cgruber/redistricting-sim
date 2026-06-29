/**
 * Unit tests for getCriterionIcon (GAME-109).
 *
 * Covers the per-criterion icon lookup used by the result-screen reveal:
 *   - each Criterion["type"] resolves to a non-fallback icon
 *   - the three "validity:*" prefixes resolve (incl. a suffixed id like
 *     "validity:contiguity-5")
 *   - an exhaustiveness guard: every criterion type in scenario.ts has an icon.
 *
 * The ICONS table is module-private, so the exhaustiveness check uses a typed
 * Record<Criterion["type"], true> — adding a new criterion variant without
 * updating that table is a COMPILE error here, and the runtime assertions catch
 * a missing icon by comparing against the neutral-dash fallback.
 *
 * Run via Bazel: bazel test //game/web:criterion_icons_test
 */

import { getCriterionIcon } from "./criterion-icons.js";
import type { Criterion } from "./model/scenario.js";
import { test, assertTrue, assertFalse, summarize } from "./testing/test_runner.js";

// The fallback SVG returned for any unknown criterion id/type. Anything that
// equals this string means "no icon found" — used to detect a missing entry.
const FALLBACK = getCriterionIcon("no-such-id", "no_such_type__definitely_unmapped");

function isFallback(svg: string): boolean {
	return svg === FALLBACK;
}

// ─── Exhaustiveness: every Criterion["type"] must map to a real icon ──────────
//
// Listing each type here as a key of Record<Criterion["type"], true> makes
// adding a new criterion variant to scenario.ts a compile error until it's added
// to this table — which then forces a runtime assertion that the icon exists.
const ALL_CRITERION_TYPES: Record<Criterion["type"], true> = {
	district_count: true,
	population_balance: true,
	seat_count: true,
	majority_minority: true,
	efficiency_gap: true,
	mean_median: true,
	compactness: true,
	safe_seats: true,
	competitive_seats: true,
};

test("every Criterion type resolves to a non-fallback icon", () => {
	for (const type of Object.keys(ALL_CRITERION_TYPES)) {
		const svg = getCriterionIcon(`sc-${type}`, type);
		assertFalse(isFallback(svg), `criterion type "${type}" has no dedicated icon (got fallback)`);
		assertTrue(svg.includes("<svg"), `criterion type "${type}" returned non-SVG markup`);
	}
});

// ─── Per-type spot checks (icon content distinguishes types) ──────────────────

test("district_count and seat_count resolve to different icons", () => {
	const dc = getCriterionIcon("sc-dc", "district_count");
	const sc = getCriterionIcon("sc-seat", "seat_count");
	assertFalse(isFallback(dc), "district_count not fallback");
	assertFalse(isFallback(sc), "seat_count not fallback");
	assertTrue(dc !== sc, "district_count and seat_count icons differ");
});

// ─── validity:* prefix resolution ─────────────────────────────────────────────

test("validity:all-assigned prefix resolves", () => {
	const svg = getCriterionIcon("validity:all-assigned", "");
	assertFalse(isFallback(svg), "validity:all-assigned should resolve to a dedicated icon");
});

test("validity:population-balance prefix resolves", () => {
	const svg = getCriterionIcon("validity:population-balance", "");
	assertFalse(isFallback(svg), "validity:population-balance should resolve to a dedicated icon");
});

test("validity:contiguity prefix resolves even with a district suffix", () => {
	// Real ids look like "validity:contiguity-5" (per district).
	const svg = getCriterionIcon("validity:contiguity-5", "");
	assertFalse(isFallback(svg), "validity:contiguity-5 should resolve via prefix match");
});

// ─── Fallback for genuinely unknown criteria ─────────────────────────────────

test("unknown id and type returns the neutral-dash fallback", () => {
	const svg = getCriterionIcon("totally-unknown", "also_unknown");
	assertTrue(isFallback(svg), "unknown criterion should return the fallback dash");
	assertTrue(svg.includes("<svg"), "fallback is still valid SVG");
});

summarize();
