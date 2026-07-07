/**
 * tutorial-004 "Fairhaven: Putting It Together" (GAME-125): terrain + winnability.
 *
 * The capstone map gains its full topographic frame — a mountain range on the NW rim, an ocean
 * on the SE rim curling around the south vertex, and a river flowing from the mountains out to
 * that sea. This is the FIRST shipped scenario with terrain tiles, so the smoke test guards the
 * terrain-tile rendering path (and the map-fit that keeps rim-framing tiles in view, GAME-125).
 *
 * Terrain is COSMETIC (population weights pinned to 1.0), so the four-wedge balance this tutorial
 * teaches is preserved. The winnability test pins that against the real criteria — district_count
 * + population_balance (±15%) + contiguity; there is no seat goal.
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

	// Terrain tiles (GAME-125) — the first shipped scenario to use them. renderTerrainTiles draws
	// each as a `g.terrain-tile terrain-<type>` group: 8 mountains framing the NW rim, 10 sea tiles
	// framing the SE rim + the southern curl. Both kinds must render, and the map-fit must keep
	// them in view (they sit one ring outside the precinct circle).
	await expect(page.locator("g.terrain-mountain").first()).toBeVisible();
	await expect(page.locator("g.terrain-sea").first()).toBeVisible();
	await expect(page.locator("g.terrain-mountain")).toHaveCount(8);
	await expect(page.locator("g.terrain-sea")).toHaveCount(10);

	expect(errors, `page errors during terrain render: ${errors.join("; ")}`).toHaveLength(0);
});

test("winnability: four cardinal wedges make a complete legal map that passes", async ({
	page,
}) => {
	await loadTutorial004(page);

	// Strategy (verified against the generated populations, matching validity.ts's per-district
	// ±15% check): the capstone is a central city ringed by four equal villages at N/E/S/W — a
	// symmetric field that splits into FOUR WEDGES around the centre. Assign each precinct to the
	// cardinal wedge (E/S/W/N) its pixel angle falls in; all four land within ±15% of the mean and
	// each wedge is a contiguous pie-slice from the centre. Terrain is cosmetic, so the NW mountains
	// and SE coast don't skew the balance.
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
		const HEX = 36;
		const S3 = Math.sqrt(3);
		// Flat-top axial → pixel (hex-geometry.ts hexToPixel); in SVG space y is DOWN, so +y = south.
		const wedges: number[][] = [[], [], [], []]; // 0=E, 1=S, 2=W, 3=N
		for (const p of state.precincts) {
			const x = HEX * 1.5 * p.coord.q;
			const y = HEX * (S3 * p.coord.r + (S3 / 2) * p.coord.q);
			const deg = (Math.atan2(y, x) * 180) / Math.PI;
			const w = ((Math.round(deg / 90) % 4) + 4) % 4;
			wedges[w]!.push(p.index);
		}
		state.paintStroke(wedges[0]!, 1); // East wedge  → District 1
		state.paintStroke(wedges[1]!, 2); // South wedge → District 2
		state.paintStroke(wedges[2]!, 3); // West wedge  → District 3
		state.paintStroke(wedges[3]!, 4); // North wedge → District 4
	});

	// A complete legal map (four districts, all assigned, balanced, each contiguous) → submit
	// passes. There is no seat goal; legality is the whole test.
	await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
	await page.locator("#btn-submit").click();
	await expect(page.locator("#result-screen")).toBeVisible();
	await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});
