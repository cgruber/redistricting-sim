/**
 * tutorial-004 "Fairhaven: Putting It Together" (GAME-125): terrain + winnability.
 *
 * The capstone map gains its full topographic frame — a mountain range on the NW rim, an ocean
 * on the SE rim curling around the south vertex, and a river flowing from the mountains out to
 * that sea. Each terrain tile sits on the map's OWN outer ring (GAME-127: terrain replaces the
 * precinct on its cell), so the smoke test guards the terrain-tile rendering path and the map-fit
 * that keeps the rim tiles in view.
 *
 * Terrain is COSMETIC (population weights pinned to 1.0). The winnability test pins a complete
 * legal map against the real criteria — district_count + population_balance (±15%) + contiguity;
 * there is no seat goal.
 *
 * tutorial-004 sits behind rung 3 in the tutorial campaign, so the e2e load uses
 * ?campaign=tutorial&s=tutorial-004&debug — &campaign puts it in the active list, &debug clears
 * the rung lock.
 */

import { expect, test } from "@playwright/test";

// The guided coach (GAME-076 T4 script) would intercept the editor. Suppress it via the
// per-scenario "complete" flag so the tests are deterministic.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.setItem("tutorial-tutorial-004-complete", "1");
		} catch {
			/* ignore */
		}
	});
});

/** Navigate to tutorial-004, dismiss the intro, wait for the hex grid. */
async function loadTutorial004(page: import("@playwright/test").Page): Promise<void> {
	await page.goto("/?campaign=tutorial&s=tutorial-004&debug");
	// The Bazel-sandboxed Chromium ignores config reducedMotion; emulate it so the instant
	// result-screen path runs (otherwise the animated criteria reveal leaves the verdict empty).
	await page.emulateMedia({ reducedMotion: "reduce" });
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
}

test("smoke: loads and renders the mountain + coastline terrain tiles without error", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(String(e)));

	await loadTutorial004(page);

	// Terrain tiles (GAME-125, refined GAME-127) — the first shipped scenario to use them.
	// renderTerrainTiles draws each as a `g.terrain-tile terrain-<type>` group: 7 mountains on the
	// NW rim, 9 sea tiles on the SE rim + the southern curl. Each tile REPLACES the precinct on its
	// cell, so they sit on the map's own outer ring; the map-fit must keep them in view.
	await expect(page.locator("g.terrain-mountain").first()).toBeVisible();
	await expect(page.locator("g.terrain-sea").first()).toBeVisible();
	await expect(page.locator("g.terrain-mountain")).toHaveCount(7);
	await expect(page.locator("g.terrain-sea")).toHaveCount(9);

	expect(errors, `page errors during terrain render: ${errors.join("; ")}`).toHaveLength(0);
});

test("winnability: four balanced north–south layers make a complete legal map that passes", async ({
	page,
}) => {
	await loadTutorial004(page);

	// Strategy (verified against the generated populations, matching validity.ts's per-district
	// ±15% check): the reshaped capstone (mountains carved off the NW rim, sea off the SE rim) is a
	// pointy-top hex, where cardinal "wedges" run structurally uneven (E/W ~+17%). Slicing NORTH→
	// SOUTH instead cuts across the dense middle: sort every precinct by screen-y and split into
	// four EQUAL-POPULATION horizontal layers. All four land within ±15% of the mean (±3% here) and
	// each layer is a contiguous slab. Terrain is cosmetic, so the mountains and coast don't skew it.
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
		const S3 = Math.sqrt(3);
		// Screen-y (hex-geometry.ts hexToPixel): y = HEX·(√3·r + (√3/2)·q); smaller y is further north.
		const byNorth = [...state.precincts].sort(
			(a, b) => S3 * a.coord.r + (S3 / 2) * a.coord.q - (S3 * b.coord.r + (S3 / 2) * b.coord.q),
		);
		const total = byNorth.reduce((sum, p) => sum + p.population, 0);
		// Walk north→south, filling each layer to a quarter of the total population before advancing.
		const layers: number[][] = [[], [], [], []];
		let cumulative = 0;
		let layer = 0;
		for (const p of byNorth) {
			layers[layer]!.push(p.index);
			cumulative += p.population;
			if (layer < 3 && cumulative >= (total * (layer + 1)) / 4) layer++;
		}
		state.paintStroke(layers[0]!, 4); // northern layer → District 4
		state.paintStroke(layers[1]!, 3);
		state.paintStroke(layers[2]!, 2);
		state.paintStroke(layers[3]!, 1); // southern layer → District 1
	});

	// A complete legal map (four districts, all assigned, balanced, each contiguous) → submit
	// passes. There is no seat goal; legality is the whole test.
	await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
	await page.locator("#btn-submit").click();
	await expect(page.locator("#result-screen")).toBeVisible();
	await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});
