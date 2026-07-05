/**
 * tutorial-005 "A Three-Way Race" (GAME-120): the debug-only multiparty tutorial.
 *
 * Three PARTIES contest every district — Ken (orange) out west, Ryu (purple) in the
 * city, Chun-Li (teal) out east — with leans hung on real geography (GAME-119) and
 * outcomes shown as named candidates (GAME-117). Gated on legality only
 * (district_count + population_balance + contiguity); no seat goal.
 *
 * Coverage:
 *   - smoke: loads + the Lean view renders the 3-party plurality colouring without error.
 *   - winnability: a balanced, contiguous map that elects all three parties passes, and
 *     the result panel shows each party's named candidate for the seat it carries.
 *   - overlay: the guided coach script (registered for tutorial-005) runs.
 *
 * tutorial-005 is campaign-only (GAME-115); &debug + &campaign=debug reach it.
 */

import { expect, test } from "@playwright/test";

// The guided overlay (GAME-120: TUTORIAL_005 coach script) would intercept the editor
// with a coach panel / input-pause. Suppress it via the per-scenario "complete" flag so the
// smoke + winnability tests are deterministic; the overlay test below forces it back on with
// ?resetTutorial=1 (which clears this flag on load).
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem("tutorial-tutorial-005-complete", "1");
		} catch {
			/* ignore */
		}
	});
});

/** Navigate to the debug-gated tutorial-005, dismiss the intro, wait for the hex grid. */
async function loadTutorial005(page: import("@playwright/test").Page): Promise<void> {
	await page.goto("/?s=tutorial-005&campaign=debug&debug");
	// The Bazel-sandboxed Chromium ignores config reducedMotion; emulate it so the instant
	// result-screen path runs (otherwise the animated criteria reveal leaves the verdict empty).
	await page.emulateMedia({ reducedMotion: "reduce" });
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
}

test("smoke: loads and the Lean view renders the 3-party colouring without error", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(String(e)));

	await loadTutorial005(page);

	// Switch to the Lean view → exercises the 3+-party plurality-colouring path (each precinct
	// painted its plurality party's colour) in the map renderer.
	await page.locator("#filter-lean").click();
	await expect(page.locator("path.hex").first()).toBeVisible();

	expect(errors, `page errors during 3-party render: ${errors.join("; ")}`).toHaveLength(0);
});

test("winnability: a balanced 3-way map elects all three parties, each with its named candidate", async ({
	page,
}) => {
	await loadTutorial005(page);

	// Strategy (verified against the generated populations + election.ts winner math):
	// sort precincts west→east by q and carve three EQUAL-POPULATION columns. Because Hawthorn
	// city sits at the centre, its dense core lands in a NARROW middle column — the balance twist
	// this tutorial teaches (the crowded centre needs the smaller district). The west column goes
	// to D1 (Ken country), the centre to D2 (Ryu's city), the east to D3 (Chun-Li's ground). All
	// three land within ±15% of the mean, stay contiguous, and each elects a different party.
	await page.evaluate(() => {
		const store = (
			window as unknown as Record<
				string,
				{
					getState: () => {
						paintStroke: (ids: number[], district: number) => void;
						precincts: { index: number; coord: { q: number; r: number }; population: number }[];
					};
				}
			>
		)["__gameStore"];
		if (!store) throw new Error("__gameStore not found on window");
		const state = store.getState();
		const sorted = [...state.precincts].sort(
			(a, b) => a.coord.q - b.coord.q || a.coord.r - b.coord.r,
		);
		const total = sorted.reduce((s, p) => s + p.population, 0);
		const west: number[] = [];
		const center: number[] = [];
		const east: number[] = [];
		let cum = 0;
		for (const p of sorted) {
			const frac = cum / total;
			(frac < 1 / 3 ? west : frac < 2 / 3 ? center : east).push(p.index);
			cum += p.population;
		}
		state.paintStroke(west, 1); // west column → District 1 (Ken)
		state.paintStroke(center, 2); // dense centre → District 2 (Ryu)
		state.paintStroke(east, 3); // east column → District 3 (Chun-Li)
	});

	// The live results panel shows three DISTINCT winners, each rendered as the winning party's
	// named candidate for that seat (GAME-117): Ken carries the west behind Sean Matsuda, Ryu the
	// city behind Sakura Kasugano, Chun-Li the east. Badges render in district order (D1, D2, D3).
	const badges = page.locator("#results-container .winner-badge");
	await expect(badges).toHaveCount(3);
	await expect(badges.nth(0)).toContainText("Sean Matsuda");
	await expect(badges.nth(1)).toContainText("Sakura Kasugano");
	await expect(badges.nth(2)).toContainText("Chun-Li");

	// The map is legal → submitting passes (district_count + population_balance + contiguity).
	await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
	await page.locator("#btn-submit").click();
	await expect(page.locator("#result-screen")).toBeVisible();
	await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

test("overlay: the guided coach script runs and introduces the three-party race", async ({
	page,
}) => {
	// ?resetTutorial=1 clears the per-scenario complete flag on load, so the coach runs even
	// though the beforeEach marked it complete.
	await page.goto("/?s=tutorial-005&campaign=debug&debug&resetTutorial=1");
	await page.emulateMedia({ reducedMotion: "reduce" });

	// Dismiss the intro; the guided overlay starts once the editor is up.
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();

	const panel = page.locator("#tutorial-panel");
	await expect(panel).toBeVisible({ timeout: 10_000 });
	await expect(panel).toContainText("three-cornered race");
});
