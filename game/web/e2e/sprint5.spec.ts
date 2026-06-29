import { test, expect } from "@playwright/test";

/**
 * Sprint 5 (S13) behavioral tests:
 *   GAME-080 — live per-district demographic stat under district buttons
 *
 * On scenarios with a majority_minority criterion, each district button
 * shows the group share % below it, highlighted green when the threshold
 * is met. On other scenarios no stat is shown.
 */

async function loadScenario(page: import("@playwright/test").Page, id: string): Promise<void> {
	await page.goto(`/?s=${id}&debug`);
	await page.emulateMedia({ reducedMotion: "reduce" });
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
}

/**
 * Paint a set of hex [q,r] coordinates into a district via __gameStore.paintStroke.
 * Resolves coordinates to precinct indices at runtime using the store's precinct list.
 */
async function paintHexes(
	page: import("@playwright/test").Page,
	hexes: [number, number][],
	district: number,
): Promise<void> {
	await page.evaluate(
		({ hexes, district }) => {
			const store = (
				window as unknown as Record<
					string,
					{
						getState: () => {
							paintStroke: (ids: number[], district: number) => void;
							precincts: { coord: { q: number; r: number } }[];
						};
					}
				>
			)["__gameStore"];
			if (!store) throw new Error("__gameStore not found on window");
			const state = store.getState();
			const coordToIdx = new Map<string, number>();
			state.precincts.forEach((p, i) => {
				coordToIdx.set(`${p.coord.q},${p.coord.r}`, i);
			});
			const ids = hexes.map(([q, r]) => {
				const idx = coordToIdx.get(`${q},${r}`);
				if (idx === undefined) throw new Error(`Hex (${q},${r}) not found in precincts`);
				return idx;
			});
			state.paintStroke(ids, district);
		},
		{ hexes, district },
	);
}

// ─── GAME-080: District demographic stat ─────────────────────────────────────

test("GAME-080: scenario-005 shows district-demo-stat under each district button", async ({
	page,
}) => {
	await loadScenario(page, "scenario-005");
	const stats = page.locator(".district-demo-stat");
	// scenario-005 has 5 districts → 5 stat elements
	await expect(stats).toHaveCount(5);
});

test("GAME-080: district-demo-stat shows Latino percentage text", async ({ page }) => {
	await loadScenario(page, "scenario-005");
	const firstStat = page.locator(".district-demo-stat").first();
	await expect(firstStat).toBeVisible();
	// Each stat shows "<N>% Latino" (group_filter dimension=ethnicity value=latino)
	await expect(firstStat).toContainText("% Latino");
});

test("GAME-080: painting the winning solution gives district 1 the .met class", async ({
	page,
}) => {
	await loadScenario(page, "scenario-005");

	// Apply the full winning assignment from the scenarios.spec.ts winnability test.
	// Painting only D1 valley hexes is insufficient because the original diagonal-strip
	// precincts remain in D1, diluting the Latino share below 50%.
	// Painting all 5 districts reassigns every precinct explicitly, giving D1 ~60% Latino.

	// D1: valley consolidated (~60% Latino)
	await paintHexes(
		page,
		[
			[1, -3],
			[2, -3],
			[3, -3],
			[0, -2],
			[1, -2],
			[2, -2],
			[3, -2],
			[4, -2],
			[5, -2],
			[0, -1],
			[1, -1],
			[2, -1],
			[3, -1],
			[4, -1],
			[5, -1],
			[1, 0],
			[2, 0],
			[3, 0],
			[4, 0],
			[5, 0],
			[1, 1],
			[2, 1],
			[3, 1],
			[4, 1],
			[5, 1],
		],
		1,
	);

	// D2: west rim
	await paintHexes(
		page,
		[
			[-6, 1],
			[-5, 1],
			[-4, 1],
			[-3, 1],
			[-2, 1],
			[-1, 1],
			[-6, 2],
			[-5, 2],
			[-4, 2],
			[-3, 2],
			[-2, 2],
			[-1, 2],
			[-6, 3],
			[-5, 3],
			[-4, 3],
			[-3, 3],
			[-2, 3],
			[-6, 4],
			[-5, 4],
			[-4, 4],
			[-3, 4],
			[-6, 5],
			[-5, 5],
			[-4, 5],
			[-6, 6],
			[-5, 6],
		],
		2,
	);

	// D3: northwest rim
	await paintHexes(
		page,
		[
			[-1, -5],
			[-2, -4],
			[-1, -4],
			[0, -4],
			[1, -4],
			[-3, -3],
			[-2, -3],
			[-1, -3],
			[0, -3],
			[-4, -2],
			[-3, -2],
			[-2, -2],
			[-1, -2],
			[-5, -1],
			[-4, -1],
			[-3, -1],
			[-2, -1],
			[-1, -1],
			[-6, 0],
			[-5, 0],
			[-4, 0],
			[-3, 0],
			[-2, 0],
			[-1, 0],
			[0, 0],
		],
		3,
	);

	// D4: south rim
	await paintHexes(
		page,
		[
			[0, 1],
			[0, 2],
			[1, 2],
			[2, 2],
			[3, 2],
			[4, 2],
			[-1, 3],
			[0, 3],
			[1, 3],
			[2, 3],
			[3, 3],
			[-2, 4],
			[-1, 4],
			[0, 4],
			[1, 4],
			[2, 4],
			[-3, 5],
			[-2, 5],
			[-1, 5],
			[0, 5],
			[1, 5],
			[-4, 6],
			[-3, 6],
			[-2, 6],
			[-1, 6],
			[0, 6],
		],
		4,
	);

	// D5: northeast rim
	await paintHexes(
		page,
		[
			[0, -6],
			[1, -6],
			[2, -6],
			[3, -6],
			[4, -6],
			[5, -6],
			[6, -6],
			[0, -5],
			[1, -5],
			[2, -5],
			[3, -5],
			[4, -5],
			[5, -5],
			[6, -5],
			[2, -4],
			[3, -4],
			[4, -4],
			[5, -4],
			[6, -4],
			[4, -3],
			[5, -3],
			[6, -3],
			[6, -2],
			[6, -1],
			[6, 0],
		],
		5,
	);

	// D1 now has ~60% Latino → .met; D2-D5 have ~20% → no .met
	const metStats = page.locator(".district-demo-stat.met");
	await expect(metStats).toHaveCount(1, { timeout: 3_000 });
});

test("GAME-080: non-majority-minority scenario shows no demographic stat", async ({ page }) => {
	// scenario-002 has no majority_minority criterion
	await loadScenario(page, "scenario-002");
	const stats = page.locator(".district-demo-stat");
	await expect(stats).toHaveCount(0);
});

test("GAME-080: stat count matches district button count", async ({ page }) => {
	await loadScenario(page, "scenario-005");
	const btns = page.locator("button.district-btn");
	const stats = page.locator(".district-demo-stat");
	const btnCount = await btns.count();
	const statCount = await stats.count();
	expect(statCount).toBe(btnCount);
});
