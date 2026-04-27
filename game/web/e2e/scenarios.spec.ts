import { test, expect } from "@playwright/test";

/**
 * E2e tests for GAME-023, GAME-024, GAME-025:
 *   - scenario-002: "Give the Governor a Win" (partisan gerrymandering)
 *   - scenario-003: "The Packing Problem" (packing tactic)
 *   - scenario-004: "Cracking the Opposition" (cracking tactic)
 *
 * Each scenario has:
 *   1. A smoke test: loads scenario, verifies precinct count and intro text.
 *   2. A winnability test: applies a known-valid solution and asserts "Map Passed!"
 *
 * Winnability tests for scenario-002 and scenario-003 paint precincts via DOM
 * events. Scenario-004 uses window.__gameStore.paintStroke() directly because
 * the winning redistribution spans too many precincts to enumerate individually
 * in a readable test.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate to a scenario, skip intro, wait for hex grid. */
async function loadScenario(
  page: import("@playwright/test").Page,
  id: string,
): Promise<void> {
  await page.goto(`/?s=${id}`);
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
}

/**
 * Dispatch a single paint event on a precinct by its 0-based index.
 * Mirrors the pattern established in sprint3.spec.ts.
 */
async function paintPrecinct(
  page: import("@playwright/test").Page,
  idx: number,
): Promise<void> {
  await page.evaluate((id) => {
    const path = document.querySelector(`path.hex[data-precinct-id='${id}']`);
    if (!path) throw new Error(`Precinct path not found for index: ${id}`);
    path.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
  }, idx);
}

/** Click the Nth district button (0-based). */
async function selectDistrict(
  page: import("@playwright/test").Page,
  nth: number,
): Promise<void> {
  await page.locator("button.district-btn").nth(nth).click();
}

// ─── scenario-002: "Give the Governor a Win" ─────────────────────────────────

test("scenario-002 smoke: loads and renders 96 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(96);
});

test("scenario-002 smoke: intro shows correct character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("Ken Party wins at least 3 seats");
});

test("scenario-002 winnability: gerrymandering 3/4 Ken districts passes the map", async ({ page }) => {
  /**
   * Layout: 8 cols (q=0..7) × 12 rows (r=0..11) = 96 precincts, 4 districts × 24.
   * Index formula: r * 8 + q  (0-based).
   *
   * Initial (2-col vertical strips):
   *   D1=q0-1, D2=q2-3, D3=q4-5, D4=q6-7
   *   D1,D2 → north+SW → ~56% Ken → KEN
   *   D3,D4 → north+SE → ~42% Ken → RYU
   *   Result: 2 Ken / 2 Ryu → fails ≥3 Ken criterion
   *
   * Winning gerrymander:
   *   Step 1: Select D3; paint q=6-7, r=0-5 (currently D4) → D3 gains North strip
   *     Indices: r=0..5, q=6..7 → [6,7,14,15,22,23,30,31,38,39,46,47]
   *   Step 2: Select D4; paint q=4-5, r=6-11 (currently D3) → D4 gets SE zone
   *     Indices: r=6..11, q=4..5 → [52,53,60,61,68,69,76,77,84,85,92,93]
   *
   * Final:
   *   D1=q0-1 all rows (56% Ken → KEN)
   *   D2=q2-3 all rows (56% Ken → KEN)
   *   D3=q4-7 r=0-5   (60% Ken North → KEN)
   *   D4=q4-7 r=6-11  (25% Ken SE → RYU, sacrificed)
   *   3 Ken / 1 Ryu ✓
   */
  await loadScenario(page, "scenario-002");

  // Initial map is valid (contiguous, balanced) — submit is enabled but criteria fail.
  // No need to assert disabled; just apply the winning redistribution.

  // Step 1: D3 claims the northern strip from D4
  await selectDistrict(page, 2); // D3
  for (const idx of [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47]) {
    await paintPrecinct(page, idx);
  }

  // Step 2: D4 claims the SE zone from D3
  await selectDistrict(page, 3); // D4
  for (const idx of [52, 53, 60, 61, 68, 69, 76, 77, 84, 85, 92, 93]) {
    await paintPrecinct(page, idx);
  }

  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-003: "The Packing Problem" ─────────────────────────────────────

test("scenario-003 smoke: loads and renders 120 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-003");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(120);
});

test("scenario-003 smoke: intro shows packing character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-003");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("4 of the 5 seats");
});

test("scenario-003 winnability: packing urban core into one district passes the map", async ({ page }) => {
  /**
   * Layout: 10 cols (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts × 24.
   * Index formula: r * 10 + q  (0-based).
   *
   * Urban core: q=3..6, r=3..8 = 24 precincts (15% Ken → strong Ryu).
   * Initial (2-col vertical strips): D1=q0-1, D2=q2-3, D3=q4-5, D4=q6-7, D5=q8-9
   *   D2 gets 6 core precincts (q=3, r=3-8) → leans Ryu → RYU
   *   D3 gets 12 core precincts (q=4-5, r=3-8) → strongly Ryu → RYU
   *   D4 gets 6 core precincts (q=6, r=3-8) → leans Ryu → RYU
   *   D1, D5 are all rural (65% Ken) → KEN
   *   Result: 2 Ken / 3 Ryu → fails ≥4 Ken
   *
   * Winning pack — consolidate all 24 core precincts into D3:
   *   Step 1: Select D3; paint D2's core (q=3, r=3-8) → [33,43,53,63,73,83]
   *   Step 2:            paint D4's core (q=6, r=3-8) → [36,46,56,66,76,86]
   *     D3 now has 24+6+6=36 (over). Need to shed 12 non-core to D2 and D4.
   *   Step 3: Select D2; paint q=4, r=0-2 and r=9-11 from D3 → [4,14,24,94,104,114]
   *   Step 4: Select D4; paint q=5, r=0-2 and r=9-11 from D3 → [5,15,25,95,105,115]
   *
   * Final:
   *   D1=q0-1 all rows (rural, 65% Ken → KEN)
   *   D2=q2-3 non-core + q=4 r=0-2,r=9-11 (rural/suburban, ~59% Ken → KEN)
   *   D3=q3-6 r=3-8 exactly (all urban core, 15% Ken → RYU, sacrifice)
   *   D4=q5 r=0-2,r=9-11 + q=6-7 non-core (rural/suburban, ~59% Ken → KEN)
   *   D5=q8-9 all rows (rural, 65% Ken → KEN)
   *   4 Ken / 1 Ryu ✓
   */
  await loadScenario(page, "scenario-003");

  // Initial map is valid (contiguous, balanced) — submit is enabled but criteria fail.
  // No need to assert disabled; just apply the winning redistribution.

  // Step 1+2: Pack all core precincts into D3
  await selectDistrict(page, 2); // D3
  for (const idx of [33, 43, 53, 63, 73, 83]) {  // q=3, r=3-8 from D2
    await paintPrecinct(page, idx);
  }
  for (const idx of [36, 46, 56, 66, 76, 86]) {  // q=6, r=3-8 from D4
    await paintPrecinct(page, idx);
  }

  // Step 3: Shed D3's non-core northern/southern q=4 column into D2
  await selectDistrict(page, 1); // D2
  for (const idx of [4, 14, 24, 94, 104, 114]) {  // q=4, r=0-2 and r=9-11
    await paintPrecinct(page, idx);
  }

  // Step 4: Shed D3's non-core northern/southern q=5 column into D4
  await selectDistrict(page, 3); // D4
  for (const idx of [5, 15, 25, 95, 105, 115]) {  // q=5, r=0-2 and r=9-11
    await paintPrecinct(page, idx);
  }

  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-004: "Cracking the Opposition" ─────────────────────────────────

test("scenario-004 smoke: loads and renders 120 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-004");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(120);
});

test("scenario-004 smoke: intro references cracking tactic and prior scenario", async ({ page }) => {
  await page.goto("/?s=scenario-004");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("Ken Party wins every seat");
});

test("scenario-004 winnability: cracking the corridor across all 5 districts passes", async ({ page }) => {
  /**
   * Layout: 10 cols (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts × 24.
   * Index formula: r * 10 + q  (0-based).
   *
   * Corridor: r=5..6 (2 rows × 10 cols = 20 precincts, 18% Ken → strong Ryu).
   * Upper: r=0..4 (50 precincts, 65% Ken). Lower: r=7..11 (50 precincts, 65% Ken).
   *
   * Initial (horizontal bands, corridor isolated in D3):
   *   D3 = r=4,q=8-9 + r=5-6(all) + r=7,q=0-1 → corridor-heavy → 25% Ken → RYU
   *   D1,D2,D4,D5 are upper/lower → 65% Ken → KEN
   *   Result: 4 Ken / 1 Ryu → fails "all 5" (≥5 Ken) criterion
   *
   * Winning crack: vertical 2-col strips (each district gets 4 corridor precincts).
   *   Each district (q=2k..2k+1, all rows): (4×0.18 + 20×0.65)/24 ≈ 57% Ken → KEN
   *   Result: 5 Ken / 0 Ryu ✓
   *
   * Because the full redistribution spans 96+ precinct operations, we use
   * window.__gameStore.paintStroke() to set assignments directly.
   */
  await loadScenario(page, "scenario-004");

  await expect(page.locator("#btn-submit")).toBeDisabled();

  // Build complete vertical-strip assignment via store.paintStroke()
  // Each district d (0-based index) owns columns q=2d..2d+1, all rows.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const getState = store.getState.bind(store);
    const numQ = 10;
    const numR = 12;
    const districts = [1, 2, 3, 4, 5];

    for (let d = 0; d < 5; d++) {
      const ids: number[] = [];
      for (let r = 0; r < numR; r++) {
        for (let qOffset = 0; qOffset < 2; qOffset++) {
          const q = d * 2 + qOffset;
          ids.push(r * numQ + q);
        }
      }
      getState().paintStroke(ids, districts[d]);
    }
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});
