/**
 * tutorial-006 "The Hollow's Own" (GAME-121): the home-base INDEPENDENT tutorial — the sixth and
 * final rung of the PUBLIC tutorial ladder (promoted out of the debug campaign; see
 * thoughts/shared/decisions/2026-07-05-tutorial-progression-and-multiparty-placement.md).
 *
 * Two major parties contest every district — Ken (orange) out west, Ryu (purple) through the
 * centre — while Dhalsim (teal) is an INDEPENDENT: he carries a map-wide lean but is on the
 * BALLOT only in the district holding his home precinct (the ⌂ pin, at axial (3,-1)). Like the
 * rest of the ladder, the gate is legality only (district_count + population_balance) — there is
 * NO seat goal. Whether Dhalsim wins is EMERGENT and read off the live result panel; a map that
 * elects him and one that doesn't are BOTH legal maps that pass. That contrast IS the lesson.
 *
 * This is the first AUTHORED use of GAME-118's independent mechanic (no route-patch: the scenario
 * JSON ships `independent` + `home`), and the whole-Hollow test is the first end-to-end exercise
 * of the independent-WINS-a-seat path.
 *
 * Coverage:
 *   - smoke: loads, the ⌂ home pin renders, and the Lean view paints the 3-way colouring — no errors.
 *   - Hollow kept whole: an eastern column holds Dhalsim's home + base, so he carries that seat —
 *     his winner badge appears; the legal map passes (verdict "Map Passed!").
 *   - Hollow cracked: cross-cutting bands dilute his base and split it off his home ballot, so he
 *     wins nothing — no Dhalsim badge; the map is STILL legal and STILL passes. The lesson made
 *     executable: a legal map can silence a community whose lines are drawn against it.
 *   - overlay: the guided coach script (registered for tutorial-006) runs.
 */

import { expect, test } from "@playwright/test";

// The guided overlay (TUTORIAL_006 coach script) would intercept the editor with a coach panel /
// input-pause. Suppress it via the per-scenario "complete" flag so smoke + outcome tests are
// deterministic; the overlay test forces it back on with ?resetTutorial=1.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem("tutorial-tutorial-006-complete", "1");
		} catch {
			/* ignore */
		}
	});
});

/** Navigate to the public tutorial-006, dismiss the intro, wait for the hex grid. */
async function loadTutorial006(page: import("@playwright/test").Page): Promise<void> {
	await page.goto("/?campaign=tutorial&s=tutorial-006&debug");
	// The Bazel-sandboxed Chromium ignores config reducedMotion; emulate it so the instant
	// result-screen path runs (otherwise the animated criteria reveal leaves the verdict empty).
	await page.emulateMedia({ reducedMotion: "reduce" });
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();
	await expect(page.locator("path.hex").first()).toBeVisible({
		timeout: 15_000,
	});
}

test("smoke: loads, the ⌂ home pin renders, and the Lean view paints without error", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(String(e)));

	await loadTutorial006(page);

	// The home pin renders on load (no districting needed) — "⌂ Dhalsim" at the home precinct.
	// Its presence proves the map renderer's home-pin path on a REAL authored independent scenario
	// (not the GAME-118 route-patch fixture).
	const pin = page.locator("text.home-pin");
	await expect(pin).toHaveCount(1);
	await expect(pin).toContainText("⌂");
	await expect(pin).toContainText("Dhalsim");

	// Switch to the Lean view → exercises the 3+-party plurality-colouring path (each precinct
	// painted its plurality party's colour, independent included) in the map renderer.
	await page.locator("#filter-lean").click();
	await expect(page.locator("path.hex").first()).toBeVisible();

	expect(errors, `page errors during independent render: ${errors.join("; ")}`).toHaveLength(0);
});

test("Hollow kept whole: an eastern column elects Dhalsim, and the legal map passes", async ({
	page,
}) => {
	await loadTutorial006(page);

	// Strategy (proven against the generated populations + election.ts winner math): carve three
	// vertical columns by q. The western fields (q<=-2) go to D1 (Ken), the central townships
	// (-1..1) to D2 (Ryu), and the eastern HOLLOW (q>=2) to D3 — which holds Dhalsim's home (3,-1)
	// AND his ~48% base, so he is both on the ballot and ahead. With uniform population the three
	// columns are ~30/31/30 precincts (all within ±15%) and each column is contiguous.
	await page.evaluate(() => {
		const store = (
			window as unknown as Record<
				string,
				{
					getState: () => {
						paintStroke: (ids: number[], district: number) => void;
						precincts: { index: number; coord: { q: number; r: number } }[];
					};
				}
			>
		)["__gameStore"];
		if (!store) throw new Error("__gameStore not found on window");
		const state = store.getState();
		const west: number[] = []; // q <= -2 → Ken country
		const centre: number[] = []; // -1..1 → Ryu's townships
		const hollow: number[] = []; // q >= 2 → the Hollow (Dhalsim's home + base)
		for (const p of state.precincts) {
			(p.coord.q <= -2 ? west : p.coord.q >= 2 ? hollow : centre).push(p.index);
		}
		state.paintStroke(west, 1);
		state.paintStroke(centre, 2);
		state.paintStroke(hollow, 3);
	});

	// The live results panel shows the winning candidate per seat in district order (D1,D2,D3):
	// Ken carries the west behind Sean Matsuda, Ryu the centre, and DHALSIM the Hollow — his badge
	// is the payoff (an independent winning his home seat, GAME-118's first authored win). These
	// badge assertions are the load-bearing proof of the mechanic: with no seat gate, the winner
	// badges — not the verdict — are what distinguishes this map from the cracked one below.
	const badges = page.locator("#results-container .winner-badge");
	await expect(badges).toHaveCount(3);
	await expect(badges.nth(0)).toContainText("Sean Matsuda");
	await expect(badges.nth(1)).toContainText("Ryu");
	await expect(badges.nth(2)).toContainText("Dhalsim");

	// The map is legal (balanced + contiguous + fully assigned) → submitting passes. There is no
	// seat gate; Dhalsim's win is the emergent payoff to READ, not the pass condition.
	await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
	await page.locator("#btn-submit").click();
	await expect(page.locator("#result-screen")).toBeVisible();
	await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

test("Hollow cracked: bands win Dhalsim nothing — yet the map is still legal and still passes", async ({
	page,
}) => {
	await loadTutorial006(page);

	// The cautionary map: three HORIZONTAL bands by r, each cutting west→east. Every band clips only
	// a thin eastern sliver of Dhalsim's base against a long western body, so his ~48% dilutes below
	// a plurality. His home (3,-1) sits in the middle band (r -1..1) where he is on the ballot but
	// third; in the other bands he is off the ballot entirely. Balanced (~30/31/30) and contiguous —
	// a perfectly LEGAL map — it just denies the Hollow its seat.
	await page.evaluate(() => {
		const store = (
			window as unknown as Record<
				string,
				{
					getState: () => {
						paintStroke: (ids: number[], district: number) => void;
						precincts: { index: number; coord: { q: number; r: number } }[];
					};
				}
			>
		)["__gameStore"];
		if (!store) throw new Error("__gameStore not found on window");
		const state = store.getState();
		const north: number[] = []; // r <= -2
		const middle: number[] = []; // -1..1  (holds Dhalsim's home, but dilutes him to third)
		const south: number[] = []; // r >= 2
		for (const p of state.precincts) {
			(p.coord.r <= -2 ? north : p.coord.r >= 2 ? south : middle).push(p.index);
		}
		state.paintStroke(north, 1);
		state.paintStroke(middle, 2);
		state.paintStroke(south, 3);
	});

	// Dhalsim carries no seat — none of the three winner badges is his. This is the load-bearing
	// contrast with the whole-Hollow map: same legality, different representation.
	const badges = page.locator("#results-container .winner-badge");
	await expect(badges).toHaveCount(3);
	await expect(
		page.locator("#results-container .winner-badge", { hasText: "Dhalsim" }),
	).toHaveCount(0);

	// The map is legal (balanced + contiguous + fully assigned), and there is NO seat gate — so it
	// passes just like the whole-Hollow map. THAT is the lesson made executable: legality alone does
	// not guarantee a community a voice; the same legal map, drawn against the Hollow, silences it.
	await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
	await page.locator("#btn-submit").click();
	await expect(page.locator("#result-screen")).toBeVisible();
	await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

test("overlay: the guided coach script runs and introduces the independent", async ({ page }) => {
	// ?resetTutorial=1 clears the per-scenario complete flag on load, so the coach runs even though
	// the beforeEach marked it complete.
	await page.goto("/?campaign=tutorial&s=tutorial-006&debug&resetTutorial=1");
	await page.emulateMedia({ reducedMotion: "reduce" });

	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();

	const panel = page.locator("#tutorial-panel");
	await expect(panel).toBeVisible({ timeout: 10_000 });
	await expect(panel).toContainText("Hollowmere");
});
