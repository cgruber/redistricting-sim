import { test, expect } from "@playwright/test";

/**
 * E2e tests for GAME-023, GAME-024, GAME-025, GAME-026:
 *   - scenario-002: "Give the Governor a Win" (partisan gerrymandering)
 *   - scenario-003: "The Packing Problem" (packing tactic)
 *   - scenario-004: "Cracking the Opposition" (cracking tactic)
 *   - scenario-005: "Valle Verde: A Voice for the Valley" (VRA / majority-minority)
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

// ─── scenario-005: "Valle Verde: A Voice for the Valley" ─────────────────────

test("scenario-005 smoke: loads and renders 120 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-005");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(120);
});

test("scenario-005 smoke: intro shows VRA character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-005");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Redistricting Coordinator");
  await expect(page.locator("#objective-text")).toContainText("majority-Latino district");
});

test("scenario-005 winnability: consolidating the valley into one district passes", async ({ page }) => {
  /**
   * Layout: 10 cols (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts × 24.
   * Index formula: r * 10 + q  (0-based).
   *
   * Valley zone: q=3..8, r=5..8 = 24 precincts (~70% Latino).
   * Initial (vertical 2-col strips): no district reaches 50% Latino → criterion fails.
   *
   * Winning redistribution — give the valley its own district (D3):
   *   D1: q=0-1, all rows (unchanged — 24 pcts)
   *   D2: q=2, all rows (12) + q=3-8, r=0-1 (12) = 24
   *   D3: q=3-8, r=5-8 (valley, 24 pcts, ~70% Latino → majority_minority passes)
   *   D4: q=3-8, r=2-4 (18) + q=9, r=0-5 (6) = 24
   *   D5: q=9, r=6-11 (6) + q=3-8, r=9-11 (18) = 24
   *
   * All districts contiguous; population balanced (BASE_POP=1500 ±150, variance
   * within 10% across all 24-precinct districts).
   */
  await loadScenario(page, "scenario-005");

  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const { paintStroke } = store.getState();

    const d1: number[] = [];
    const d2: number[] = [];
    const d3: number[] = [];
    const d4: number[] = [];
    const d5: number[] = [];

    // D1: q=0-1, all rows
    for (let r = 0; r < 12; r++) for (let q = 0; q <= 1; q++) d1.push(r * 10 + q);

    // D2: q=2 (all rows) + q=3-8 (r=0-1)
    for (let r = 0; r < 12; r++) d2.push(r * 10 + 2);
    for (let r = 0; r <= 1; r++) for (let q = 3; q <= 8; q++) d2.push(r * 10 + q);

    // D3: valley q=3-8, r=5-8
    for (let r = 5; r <= 8; r++) for (let q = 3; q <= 8; q++) d3.push(r * 10 + q);

    // D4: q=3-8, r=2-4 + q=9, r=0-5
    for (let r = 2; r <= 4; r++) for (let q = 3; q <= 8; q++) d4.push(r * 10 + q);
    for (let r = 0; r <= 5; r++) d4.push(r * 10 + 9);

    // D5: q=9, r=6-11 + q=3-8, r=9-11
    for (let r = 6; r <= 11; r++) d5.push(r * 10 + 9);
    for (let r = 9; r <= 11; r++) for (let q = 3; q <= 8; q++) d5.push(r * 10 + q);

    paintStroke(d1, 1);
    paintStroke(d2, 2);
    paintStroke(d3, 3);
    paintStroke(d4, 4);
    paintStroke(d5, 5);
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-006: "Harden the Map" ─────────────────────────────────────────

test("scenario-006 smoke: loads and renders 120 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-006");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(120);
});

test("scenario-006 smoke: intro shows bipartisan consultant role", async ({ page }) => {
  await page.goto("/?s=scenario-006");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Bipartisan Redistricting Consultant");
  await expect(page.locator("#objective-text")).toContainText("safe seats");
});

test("scenario-006 winnability: separating partisan flanks into safe districts passes", async ({ page }) => {
  /**
   * Geography: q=0-5 Ken flank (~62%); q=6-9 Ryu flank (~62% Ryu).
   * Winning: vertical 2-col strips — D1=q0-1, D2=q2-3, D3=q4-5 (Ken safe x3),
   *          D4=q6-7, D5=q8-9 (Ryu safe x2). All margins ~24% > 15% threshold.
   */
  await loadScenario(page, "scenario-006");

  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const { paintStroke } = store.getState();
    const numQ = 10, numR = 12;
    for (let d = 0; d < 5; d++) {
      const ids: number[] = [];
      for (let r = 0; r < numR; r++) {
        ids.push(r * numQ + d * 2);
        ids.push(r * numQ + d * 2 + 1);
      }
      paintStroke(ids, d + 1);
    }
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-007: "The Reform Map" ─────────────────────────────────────────

test("scenario-007 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-007");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-007 smoke: intro shows reform commissioner role", async ({ page }) => {
  await page.goto("/?s=scenario-007");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Reform Commissioner");
  await expect(page.locator("#objective-text")).toContainText("compact");
});

test("scenario-007 winnability: five compact blobs pass reform criteria", async ({ page }) => {
  /**
   * Hex-of-hexes R=6: 127 precincts sorted by (r, q).
   * Initial: diagonal strips (k=q+r) — non-compact, population-imbalanced → submit disabled.
   * Winning: 5 compact Voronoi-like blobs grown from seeds at d=4 (~72° apart).
   *   Sizes: 26, 26, 25, 25, 25 — all within ±10% of target (25.4).
   *   Compactness: 0.81–0.83 — well above the 0.40 threshold.
   *
   * Precomputed via Voronoi BFS from seeds:
   *   D1 seed (4,0)  ~0°,   D2 seed (-1,4) ~74°,  D3 seed (-4,2) ~150°,
   *   D4 seed (-2,-2) ~210°, D5 seed (3,-4) ~286°.
   */
  await loadScenario(page, "scenario-007");

  await expect(page.locator("#btn-submit")).toBeDisabled();

  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const { paintStroke } = store.getState();

    // Precomputed compact balanced assignment (indices into hexes sorted by (r, q))
    const assignment: number[][] = [
      [33,42,43,44,52,53,54,55,56,63,64,65,66,67,68,69,77,78,79,80,81,90,91,92,101,102],
      [76,87,88,89,97,98,99,100,106,107,108,109,110,111,114,115,116,117,118,119,121,122,123,124,125,126],
      [59,60,61,62,70,71,72,73,74,75,82,83,84,85,86,93,94,95,96,103,104,105,112,113,120],
      [0,1,7,8,9,15,16,17,24,25,26,27,34,35,36,37,38,45,46,47,48,49,50,57,58],
      [2,3,4,5,6,10,11,12,13,14,18,19,20,21,22,23,28,29,30,31,32,39,40,41,51],
    ];
    assignment.forEach((ids, d) => paintStroke(ids, d + 1));
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-008: "Both Sides Unhappy" ─────────────────────────────────────

test("scenario-008 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-008");
  await expect(page.locator("path.hex")).toHaveCount(127);
});

test("scenario-008 smoke: intro shows independent commissioner role", async ({ page }) => {
  await page.goto("/?s=scenario-008");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Independent Commissioner");
  await expect(page.locator("#objective-text")).toContainText("compact");
});

test("scenario-008 winnability: compact Voronoi blobs pass neutral criteria", async ({ page }) => {
  /**
   * Same hex-of-hexes R=6, 127 precincts. Same Voronoi BFS assignment as
   * scenario-007 (geometry-only criteria: compactness, population balance).
   * Efficiency gap criterion is optional — doesn't block pass.
   */
  await loadScenario(page, "scenario-008");

  await expect(page.locator("#btn-submit")).toBeDisabled();

  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const { paintStroke } = store.getState();

    const assignment: number[][] = [
      [33,42,43,44,52,53,54,55,56,63,64,65,66,67,68,69,77,78,79,80,81,90,91,92,101,102],
      [76,87,88,89,97,98,99,100,106,107,108,109,110,111,114,115,116,117,118,119,121,122,123,124,125,126],
      [59,60,61,62,70,71,72,73,74,75,82,83,84,85,86,93,94,95,96,103,104,105,112,113,120],
      [0,1,7,8,9,15,16,17,24,25,26,27,34,35,36,37,38,45,46,47,48,49,50,57,58],
      [2,3,4,5,6,10,11,12,13,14,18,19,20,21,22,23,28,29,30,31,32,39,40,41,51],
    ];
    assignment.forEach((ids, d) => paintStroke(ids, d + 1));
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-009: "Cats vs. Dogs" ──────────────────────────────────────────

test("scenario-009 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-009");
  await expect(page.locator("path.hex")).toHaveCount(127);
});

test("scenario-009 smoke: intro shows Cat Party strategist role", async ({ page }) => {
  await page.goto("/?s=scenario-009");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Cat Party");
  await expect(page.locator("#objective-text")).toContainText("Cat Party");
});

test("scenario-009 winnability: ring-based split gives 3 Cat-safe districts", async ({ page }) => {
  /**
   * Hex-of-hexes R=6, 127 precincts. Ring-based Cat geography (inner = Cat
   * stronghold, outer = competitive). Ring-based assignment gives:
   *   D1 (inner): ~78% Cat → safe; D2-D3 (middle): ~60-64% Cat → safe;
   *   D4-D5 (outer): ~48% Cat → competitive/Dog.
   * 3 Cat-safe seats (margin ≥ 15%) passes the required criterion.
   */
  await loadScenario(page, "scenario-009");

  await expect(page.locator("#btn-submit")).toBeDisabled();

  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const { paintStroke } = store.getState();

    // Ring-based: D1=inner core, D2-D3=middle+some outer, D4-D5=outer sectors
    const assignment: number[][] = [
      [27,28,29,30,37,38,39,40,41,49,50,51,52,61,62,63,64,65,74,75,76,77,86,87,88],
      [55,66,67,68,72,73,78,79,80,83,84,85,89,90,95,96,97,98,99,100,105,106,107,108,109],
      [8,9,10,11,12,13,16,17,18,19,20,21,22,25,26,31,32,36,42,47,48,53,54,59,60],
      [82,91,92,93,94,101,102,103,104,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126],
      [0,1,2,3,4,5,6,7,14,15,23,24,33,34,35,43,44,45,46,56,57,58,69,70,71,81],
    ];
    assignment.forEach((ids, d) => paintStroke(ids, d + 1));
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});
