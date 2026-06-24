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

/** Navigate to a scenario, skip intro, wait for hex grid. Uses &debug to bypass lock gate. */
async function loadScenario(
  page: import("@playwright/test").Page,
  id: string,
): Promise<void> {
  await page.goto(`/?s=${id}&debug`);
  // playwright.config reducedMotion:'reduce' is ignored in the Bazel-sandboxed Chromium;
  // explicit emulation ensures the instant result path runs so verdict is visible immediately.
  await page.emulateMedia({ reducedMotion: "reduce" });
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

/**
 * Paint a set of hexes (given as [q,r] pairs) into a district using paintStroke.
 * Resolves hex coordinates to precinct indices at runtime via the game store.
 * This keeps tests readable: callers specify hex positions, not opaque index arrays.
 */
async function paintHexes(
  page: import("@playwright/test").Page,
  hexes: [number, number][],
  district: number,
): Promise<void> {
  await page.evaluate(({ hexes, district }) => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const state = store.getState();
    // Build (q,r) → index lookup from precincts
    const coordToIdx = new Map<string, number>();
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      coordToIdx.set(`${p.coord.q},${p.coord.r}`, i);
    });
    const ids = hexes.map(([q, r]: [number, number]) => {
      const idx = coordToIdx.get(`${q},${r}`);
      if (idx === undefined) throw new Error(`Hex (${q},${r}) not found in precincts`);
      return idx;
    });
    state.paintStroke(ids, district);
  }, { hexes, district });
}

// ─── scenario-002: "Give the Governor a Win" ─────────────────────────────────

test("scenario-002 smoke: loads and renders 91 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(91);
});

test("scenario-002 smoke: intro shows correct character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("Ken Party wins at least 3");
});

// GAME-069: governor sprite now appears in the sc-ken-seats criterion row, not #result-reaction.
test("scenario-002: governor sprite appears in the sc-ken-seats criterion row", async ({ page }) => {
  await loadScenario(page, "scenario-002");
  // Submit the default map (fails criteria but still shows per-row character sprites).
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  // Governor sprite should be in the rc-char slot of the row containing sc-ken-seats.
  await expect(page.locator(".result-criterion .rc-char .character-sprite.character-governor").first()).toBeVisible();
});

test("scenario-002 winnability: packing east Ryu bloc into one district passes", async ({ page }) => {
  /**
   * Hex-of-hexes R=5: 91 precincts, 4 districts (population-balanced, not count-
   * balanced — the GAME-088 field has a dense city core, ~12x urban/rural).
   *
   * Geography (GAME-088/089 field): a dense Clearwater City core; its EAST half
   * (q≥1, near centre) is the high-density Ryu stronghold, its WEST half leans Ken,
   * and the rural ring leans Ken. Ryu wins the popular vote, so Ken must gerrymander.
   *
   * Winning strategy: pack the dense east-core Ryu precincts into one sink (D1),
   * then split the Ken-leaning remainder into three balanced majority-Ken districts.
   *   D1 (7 hexes, ~34k): east-core Ryu sink — Ryu by ~17k
   *   D2 (west, ~36k):    Ken-leaning west — Ken
   *   D3 (north, ~39k):   west-core Ken + north rural, absorbs one Ryu spike — Ken
   *   D4 (south+east, ~35k): Ken rural wrap + the remaining smaller Ryu density — Ken
   * Result: 3 Ken / 1 Ryu ✓  (verified offline against the sim's pop×partyShare vote model)
   */
  await loadScenario(page, "scenario-002");

  // GAME-059: Submit always enabled; initial diagonal-strip assignment fails criteria but can be submitted
  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

  // D1: pack the dense east-of-centre city core (the Ryu stronghold) into one sink.
  await paintHexes(page, [
    [1,-2],[1,-1],[2,-1],[2,-2],[1,0],[3,-1],[3,0],
  ], 1);

  // D2: the Ken-leaning west (rural west + the Ken half of the city core).
  await paintHexes(page, [
    [-2,-3],[-3,-2],[-2,-2],
    [-4,-1],[-3,-1],[-2,-1],[-1,-1],
    [-5,0],[-4,0],[-3,0],[-2,0],[-1,0],
    [-5,1],[-4,1],[-3,1],[-2,1],[-1,1],
    [-5,2],[-4,2],[-3,2],[-2,2],[-1,2],
  ], 2);

  // D3: the north — west-core Ken (0,0)/(0,-1) + north rural, absorbing the (1,-2) Ryu spike.
  await paintHexes(page, [
    [0,-5],[1,-5],[2,-5],[3,-5],[4,-5],[5,-5],
    [-1,-4],[0,-4],[1,-4],[2,-4],[3,-4],[4,-4],[5,-4],
    [-1,-3],[0,-3],[1,-3],[2,-3],[3,-3],[4,-3],[5,-3],
    [-1,-2],[0,-2],[3,-2],
    [0,-1],[0,0],
  ], 3);

  // D4: a Ken majority wrapping the south and up the east edge + remaining small Ryu density.
  await paintHexes(page, [
    [4,-2],[5,-2],[4,-1],[5,-1],
    [2,0],[4,0],[5,0],
    [0,1],[1,1],[2,1],[3,1],[4,1],
    [0,2],[1,2],[2,2],[3,2],
    [-5,3],[-4,3],[-3,3],[-2,3],[-1,3],[0,3],[1,3],[2,3],
    [-5,4],[-4,4],[-3,4],[-2,4],[-1,4],[0,4],[1,4],
    [-5,5],[-4,5],[-3,5],[-2,5],[-1,5],[0,5],
  ], 4);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-003: "The Packing Problem" ─────────────────────────────────────

test("scenario-003 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-003&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-003 smoke: intro shows packing character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-003&debug");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("at least 4 of 5 seats");
});

test("scenario-003 winnability: packing urban core into one district passes", async ({ page }) => {
  /**
   * Hex-of-hexes R=6: 127 precincts, 5 districts of ~25.
   * Geography: concentric — urban core (d≤2) = 15% Ken, suburban (d=3-4) = 42%,
   *            rural (d=5-6) = 65%.
   *
   * Winning strategy: pack the urban Ryu core (d≤2, 19 hexes) + nearby
   * suburban hexes into D3 as the sacrifice district (~22% Ken → Ryu landslide).
   * Remaining 4 districts are suburban+rural → all Ken-majority (53-59% Ken).
   *   D1 (26): northeast arc — rural/suburban Ken
   *   D2 (26): northwest — rural/suburban Ken
   *   D3 (25): urban core sacrifice — packed Ryu (~22% Ken)
   *   D4 (25): southwest — suburban/rural Ken
   *   D5 (25): southeast — suburban/rural Ken
   * Result: 4 Ken / 1 Ryu ✓
   */
  await loadScenario(page, "scenario-003");

  // GAME-059: Submit always enabled; initial angular-wedge assignment fails criteria but can be submitted
  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

  // D1: northeast arc — rural + suburban Ken territory (26 hexes)
  await paintHexes(page, [
    [0,-6],[1,-6],[2,-6],[3,-6],[4,-6],[5,-6],[6,-6],
    [-1,-5],[0,-5],[1,-5],[2,-5],[3,-5],[4,-5],[5,-5],[6,-5],
    [0,-4],[1,-4],[2,-4],[3,-4],[4,-4],[5,-4],[6,-4],
    [4,-3],[5,-3],[6,-3],[4,-2],
  ], 1);

  // D2: northwest — rural + suburban Ken territory (26 hexes)
  await paintHexes(page, [
    [-2,-4],[-1,-4],
    [-3,-3],[-2,-3],[-1,-3],
    [-4,-2],[-3,-2],[-2,-2],
    [-5,-1],[-4,-1],[-3,-1],[-2,-1],
    [-6,0],[-5,0],[-4,0],[-3,0],
    [-6,1],[-5,1],[-4,1],[-3,1],
    [-6,2],[-5,2],[-4,2],
    [-6,3],[-5,3],[-6,4],
  ], 2);

  // D3: urban core sacrifice — packed Ryu (25 hexes, ~22% Ken)
  await paintHexes(page, [
    [0,-3],[1,-3],[2,-3],[3,-3],
    [-1,-2],[0,-2],[1,-2],[2,-2],[3,-2],
    [-1,-1],[0,-1],[1,-1],[2,-1],
    [-2,0],[-1,0],[0,0],[1,0],[2,0],
    [-2,1],[-1,1],[0,1],[1,1],
    [-2,2],[-1,2],[0,2],
  ], 3);

  // D4: southwest — suburban + rural Ken territory (25 hexes)
  await paintHexes(page, [
    [-3,2],
    [-4,3],[-3,3],[-2,3],[-1,3],
    [-5,4],[-4,4],[-3,4],[-2,4],[0,4],[1,4],
    [-6,5],[-5,5],[-4,5],[-3,5],[-1,5],[0,5],[1,5],
    [-6,6],[-5,6],[-4,6],[-3,6],[-2,6],[-1,6],[0,6],
  ], 4);

  // D5: southeast — suburban + rural Ken territory (25 hexes)
  await paintHexes(page, [
    [5,-2],[6,-2],
    [3,-1],[4,-1],[5,-1],[6,-1],
    [3,0],[4,0],[5,0],[6,0],
    [2,1],[3,1],[4,1],[5,1],
    [1,2],[2,2],[3,2],[4,2],
    [0,3],[1,3],[2,3],[3,3],
    [-1,4],[2,4],[-2,5],
  ], 5);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-004: "Cracking the Opposition" ─────────────────────────────────

test("scenario-004 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-004&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-004 smoke: intro references cracking tactic", async ({ page }) => {
  await page.goto("/?s=scenario-004&debug");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Ken Party");
  await expect(page.locator("#objective-text")).toContainText("Ken Party must win every seat");
});

test("scenario-004 winnability: cracking the corridor across all 5 districts passes", async ({ page }) => {
  /**
   * Hex-of-hexes R=6: 127 precincts, 5 districts of ~25.
   * Geography: corridor (r=0, 13 hexes) = 18% Ken (Ryu band),
   *            rest = 65% Ken (reliable Ken territory).
   * Initial: horizontal slabs consolidating corridor in D3 → 4 Ken / 1 Ryu.
   *
   * Winning crack: 5 vertical q-column strips. Each crosses the corridor,
   * picking up 2-4 Ryu hexes diluted among 24-27 Ken hexes → all Ken.
   *   D1 (24): q≤-4 — far west strip, 3 corridor hexes (~59% Ken)
   *   D2 (25): q=-3,-2 — west strip, 2 corridor hexes (~61% Ken)
   *   D3 (25): q=-1,0 — center strip, 2 corridor hexes (~61% Ken)
   *   D4 (26): q=1,2 — east strip, 2 corridor hexes (~62% Ken)
   *   D5 (27): q≥3 — far east strip, 4 corridor hexes (~58% Ken)
   * Result: 5 Ken / 0 Ryu ✓
   */
  await loadScenario(page, "scenario-004");

  // GAME-059: Submit always enabled; initial horizontal-slab assignment fails criteria but can be submitted
  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

  // D1: far west strip q≤-4 (24 hexes, crosses corridor at q=-6..-4 r=0)
  await paintHexes(page, [
    [-4,-2],
    [-5,-1],[-4,-1],
    [-6,0],[-5,0],[-4,0],
    [-6,1],[-5,1],[-4,1],
    [-6,2],[-5,2],[-4,2],
    [-6,3],[-5,3],[-4,3],
    [-6,4],[-5,4],[-4,4],
    [-6,5],[-5,5],[-4,5],
    [-6,6],[-5,6],[-4,6],
  ], 1);

  // D2: west strip q=-3,-2 (25 hexes, crosses corridor at q=-3,-2 r=0)
  await paintHexes(page, [
    [-2,-4],[-1,-4],
    [-3,-3],[-2,-3],[-1,-3],
    [-3,-2],[-2,-2],[-1,-2],
    [-3,-1],[-2,-1],[-1,-1],
    [-3,0],[-2,0],
    [-3,1],[-2,1],
    [-3,2],[-2,2],
    [-3,3],[-2,3],
    [-3,4],[-2,4],
    [-3,5],[-2,5],
    [-3,6],[-2,6],
  ], 2);

  // D3: center strip q=-1,0 (25 hexes, crosses corridor at q=-1,0 r=0)
  await paintHexes(page, [
    [0,-6],
    [-1,-5],[0,-5],[1,-5],
    [0,-4],[1,-4],
    [0,-3],[1,-3],
    [0,-2],[1,-2],
    [0,-1],
    [-1,0],[0,0],
    [-1,1],[0,1],
    [-1,2],[0,2],
    [-1,3],[0,3],
    [-1,4],[0,4],
    [-1,5],[0,5],
    [-1,6],[0,6],
  ], 3);

  // D4: east strip q=1,2 (26 hexes, crosses corridor at q=1,2 r=0)
  await paintHexes(page, [
    [1,-6],[2,-6],[3,-6],[4,-6],[5,-6],[6,-6],
    [2,-5],[3,-5],[4,-5],
    [2,-4],
    [2,-3],[3,-3],
    [2,-2],
    [1,-1],[2,-1],
    [1,0],[2,0],
    [1,1],[2,1],
    [1,2],[2,2],
    [1,3],[2,3],
    [1,4],[2,4],
    [1,5],
  ], 4);

  // D5: far east strip q≥3 (27 hexes, crosses corridor at q=3..6 r=0)
  await paintHexes(page, [
    [5,-5],[6,-5],
    [3,-4],[4,-4],[5,-4],[6,-4],
    [4,-3],[5,-3],[6,-3],
    [3,-2],[4,-2],[5,-2],[6,-2],
    [3,-1],[4,-1],[5,-1],[6,-1],
    [3,0],[4,0],[5,0],[6,0],
    [3,1],[4,1],[5,1],
    [3,2],[4,2],[3,3],
  ], 5);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-005: "Valle Verde: A Voice for the Valley" ─────────────────────

test("scenario-005 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-005&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-005 smoke: intro shows VRA character and objective", async ({ page }) => {
  await page.goto("/?s=scenario-005&debug");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Redistricting Coordinator");
  await expect(page.locator("#objective-text")).toContainText("majority-Latino district");
});

test("scenario-005 winnability: consolidating the valley into one district passes", async ({ page }) => {
  /**
   * Hex-of-hexes R=6: 127 precincts, 5 districts of ~25.
   * Geography: valley (q=1..5, r=-2..1) = ~70% Latino, rim = ~20% Latino.
   * Initial: diagonal strips crack the valley → no district ≥50% Latino.
   *
   * Winning strategy: consolidate valley into D1 (20 valley + 5 nearby = 25).
   *   D1 (25): valley hexes + nearby expansion → ~60% Latino ✓
   *   D2-D5: rim hexes split into 4 contiguous districts
   * Result: 1 majority-Latino district ✓
   */
  await loadScenario(page, "scenario-005");

  // GAME-059: Submit always enabled; initial diagonal-strip assignment fails VRA criterion but can be submitted
  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

  // D1: valley consolidated — all valley hexes (q=1..5, r=-2..1) + nearby (25 hexes, ~60% Latino)
  await paintHexes(page, [
    [1,-3],[2,-3],[3,-3],
    [0,-2],[1,-2],[2,-2],[3,-2],[4,-2],[5,-2],
    [0,-1],[1,-1],[2,-1],[3,-1],[4,-1],[5,-1],
    [1,0],[2,0],[3,0],[4,0],[5,0],
    [1,1],[2,1],[3,1],[4,1],[5,1],
  ], 1);

  // D2: west rim (26 hexes)
  await paintHexes(page, [
    [-6,1],[-5,1],[-4,1],[-3,1],[-2,1],[-1,1],
    [-6,2],[-5,2],[-4,2],[-3,2],[-2,2],[-1,2],
    [-6,3],[-5,3],[-4,3],[-3,3],[-2,3],
    [-6,4],[-5,4],[-4,4],[-3,4],
    [-6,5],[-5,5],[-4,5],
    [-6,6],[-5,6],
  ], 2);

  // D3: northwest rim (25 hexes)
  await paintHexes(page, [
    [-1,-5],
    [-2,-4],[-1,-4],[0,-4],[1,-4],
    [-3,-3],[-2,-3],[-1,-3],[0,-3],
    [-4,-2],[-3,-2],[-2,-2],[-1,-2],
    [-5,-1],[-4,-1],[-3,-1],[-2,-1],[-1,-1],
    [-6,0],[-5,0],[-4,0],[-3,0],[-2,0],[-1,0],[0,0],
  ], 3);

  // D4: south rim (26 hexes)
  await paintHexes(page, [
    [0,1],[0,2],[1,2],[2,2],[3,2],[4,2],
    [-1,3],[0,3],[1,3],[2,3],[3,3],
    [-2,4],[-1,4],[0,4],[1,4],[2,4],
    [-3,5],[-2,5],[-1,5],[0,5],[1,5],
    [-4,6],[-3,6],[-2,6],[-1,6],[0,6],
  ], 4);

  // D5: northeast rim (25 hexes)
  await paintHexes(page, [
    [0,-6],[1,-6],[2,-6],[3,-6],[4,-6],[5,-6],[6,-6],
    [0,-5],[1,-5],[2,-5],[3,-5],[4,-5],[5,-5],[6,-5],
    [2,-4],[3,-4],[4,-4],[5,-4],[6,-4],
    [4,-3],[5,-3],[6,-3],
    [6,-2],[6,-1],[6,0],
  ], 5);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-006: "Harden the Map" ─────────────────────────────────────────

test("scenario-006 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-006&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-006 smoke: intro shows bipartisan consultant role", async ({ page }) => {
  await page.goto("/?s=scenario-006&debug");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#char-role")).toContainText("Bipartisan Redistricting Consultant");
  await expect(page.locator("#objective-text")).toContainText("safe seats");
});

test("scenario-006 winnability: column strips separate partisan flanks into safe seats", async ({ page }) => {
  /**
   * Hex-of-hexes R=6: 127 precincts, 5 districts of ~25.
   * Geography: left (q≤0) = 62% Ken, right (q≥1) = 38% Ken.
   * Initial: angular wedges mixing both sides → all competitive.
   *
   * Winning strategy: vertical column strips that keep flanks separated.
   * Boundary columns (q=-1, q=1, q=3) are shared between adjacent districts.
   *   D1 (24): q=-6,-5,-4 — pure Ken (62%, margin 25% → safe Ken)
   *   D2 (25): q=-3,-2 + upper q=-1 — pure Ken (62%, margin 24% → safe Ken)
   *   D3 (25): lower q=-1 + q=0 + upper q=1 — mostly Ken (59%, margin 18% → safe Ken)
   *   D4 (25): lower q=1 + q=2 + upper q=3 — Ryu territory (38%, margin 25% → safe Ryu)
   *   D5 (28): lower q=3 + q=4,5,6 — Ryu territory (38%, margin 24% → safe Ryu)
   * Result: 3 Ken safe + 2 Ryu safe ✓
   */
  await loadScenario(page, "scenario-006");

  // GAME-059: Submit always enabled; initial angular-wedge assignment fails safe_seats but can be submitted
  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

  // D1: far-left Ken strip q=-6,-5,-4 (24 hexes)
  await paintHexes(page, [
    [-4,-2],
    [-5,-1],[-4,-1],
    [-6,0],[-5,0],[-4,0],
    [-6,1],[-5,1],[-4,1],
    [-6,2],[-5,2],[-4,2],
    [-6,3],[-5,3],[-4,3],
    [-6,4],[-5,4],[-4,4],
    [-6,5],[-5,5],[-4,5],
    [-6,6],[-5,6],[-4,6],
  ], 1);

  // D2: left Ken strip q=-3,-2 + upper 4 of q=-1 (25 hexes)
  await paintHexes(page, [
    [-1,-5],
    [-2,-4],[-1,-4],
    [-3,-3],[-2,-3],[-1,-3],
    [-3,-2],[-2,-2],[-1,-2],
    [-3,-1],[-2,-1],
    [-3,0],[-2,0],
    [-3,1],[-2,1],
    [-3,2],[-2,2],
    [-3,3],[-2,3],
    [-3,4],[-2,4],
    [-3,5],[-2,5],
    [-3,6],[-2,6],
  ], 2);

  // D3: center Ken strip — lower q=-1 + q=0 + upper 4 of q=1 (25 hexes)
  await paintHexes(page, [
    [0,-6],[1,-6],
    [0,-5],[1,-5],
    [0,-4],[1,-4],
    [0,-3],[1,-3],
    [0,-2],
    [-1,-1],[0,-1],
    [-1,0],[0,0],
    [-1,1],[0,1],
    [-1,2],[0,2],
    [-1,3],[0,3],
    [-1,4],[0,4],
    [-1,5],[0,5],
    [-1,6],[0,6],
  ], 3);

  // D4: right Ryu strip — lower q=1 + q=2 + upper 6 of q=3 (25 hexes)
  await paintHexes(page, [
    [2,-6],[3,-6],
    [2,-5],[3,-5],
    [2,-4],[3,-4],
    [2,-3],[3,-3],
    [1,-2],[2,-2],[3,-2],
    [1,-1],[2,-1],[3,-1],
    [1,0],[2,0],
    [1,1],[2,1],
    [1,2],[2,2],
    [1,3],[2,3],
    [1,4],[2,4],
    [1,5],
  ], 4);

  // D5: far-right Ryu strip — lower q=3 + q=4,5,6 (28 hexes)
  await paintHexes(page, [
    [4,-6],[5,-6],[6,-6],
    [4,-5],[5,-5],[6,-5],
    [4,-4],[5,-4],[6,-4],
    [4,-3],[5,-3],[6,-3],
    [4,-2],[5,-2],[6,-2],
    [4,-1],[5,-1],[6,-1],
    [3,0],[4,0],[5,0],[6,0],
    [3,1],[4,1],[5,1],
    [3,2],[4,2],[3,3],
  ], 5);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── scenario-007: "The Reform Map" ─────────────────────────────────────────

test("scenario-007 smoke: loads and renders 127 precincts", async ({ page }) => {
  await page.goto("/?s=scenario-007&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(127);
});

test("scenario-007 smoke: intro shows reform commissioner role", async ({ page }) => {
  await page.goto("/?s=scenario-007&debug");
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

  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

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
  await page.goto("/?s=scenario-008&debug");
  await expect(page.locator("path.hex")).toHaveCount(127);
});

test("scenario-008 smoke: intro shows independent commissioner role", async ({ page }) => {
  await page.goto("/?s=scenario-008&debug");
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

  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

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
  await page.goto("/?s=scenario-009&debug");
  await expect(page.locator("path.hex")).toHaveCount(127);
});

test("scenario-009 smoke: intro shows Cat Party strategist role", async ({ page }) => {
  await page.goto("/?s=scenario-009&debug");
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

  await expect(page.locator("#btn-submit")).toBeEnabled(); // GAME-059: validity gate removed

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

// ─── Cross-cutting: demo feedback fixes ─────────────────────────────────────

test("scenario select: all cards visible and scrollable", async ({ page }) => {
  // Navigate via educational campaign (8 scenarios) — enough to verify scroll
  await page.goto("/?campaign=educational");
  await page.evaluate(() => {
    localStorage.setItem("redistricting-sim-progress", JSON.stringify({ completed: ["tutorial-002"] }));
  });
  await page.reload();
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  const cards = page.locator(".scenario-card");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(8);
  // The last card should be scrollable into view, not clipped
  const lastCard = cards.last();
  await lastCard.scrollIntoViewIfNeeded();
  await expect(lastCard).toBeVisible();
});

test("scenario-005 precinct hover shows demographic group breakdown", async ({ page }) => {
  await loadScenario(page, "scenario-005");
  const hex = page.locator("path.hex").first();
  await hex.hover();
  const infoPanel = page.locator("#precinct-info");
  await expect(infoPanel).toContainText("%", { timeout: 3_000 });
  // Multiple % signs = lean + per-group breakdown (Valle Verde has 3+ groups)
  const text = await infoPanel.textContent();
  const percentCount = (text?.match(/%/g) ?? []).length;
  expect(percentCount).toBeGreaterThanOrEqual(3);
});

test("debug force-win button: visible with ?debug param, marks scenario complete", async ({ page }) => {
  await page.goto("/?s=tutorial-002&debug");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  const debugBtn = page.locator("#btn-debug-win");
  await expect(debugBtn).toBeVisible();
  await debugBtn.click();
  // Force-win now opens the result screen with all criteria forced to pass.
  await expect(page.locator("#result-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-next-scenario")).toBeVisible();
  // Scenario should be marked complete synchronously when result screen opens.
  const completed = await page.evaluate(() => {
    const raw = localStorage.getItem("redistricting-sim-progress");
    return raw ? JSON.parse(raw) : null;
  });
  expect(completed?.completed).toContain("tutorial-002");
});

test("debug force-win button: hidden without ?debug param", async ({ page }) => {
  // Navigate WITHOUT &debug (can't use loadScenario which adds it)
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  const debugBtn = page.locator("#btn-debug-win");
  await expect(debugBtn).not.toBeVisible();
});

test("lock gate: direct URL to locked scenario redirects to main menu", async ({ page }) => {
  // Ensure no progress — scenario-002 requires tutorial-002 completed
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("redistricting-sim-progress");
    localStorage.removeItem("redistricting-sim-wip");
  });
  await page.goto("/?s=scenario-002");
  // Should NOT show the intro or hex grid — should redirect to main menu
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("path.hex")).toHaveCount(0);
});

test("lock gate: debug param bypasses lock on locked scenario", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("redistricting-sim-progress");
    localStorage.removeItem("redistricting-sim-wip");
  });
  await page.goto("/?s=scenario-002&debug");
  // Should load the scenario, not redirect
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 15_000 });
});

test("routing: unknown ?s= without campaign redirects to main menu", async ({ page }) => {
  await page.goto("/?s=this-scenario-does-not-exist");
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("path.hex")).toHaveCount(0);
});

// ─── GAME-020: Wrap-up screen after final scenario ──────────────────────────

test("wrap-up screen: completing last scenario shows wrap-up on Next Scenario", async ({ page }) => {
  // Seed all but tutorial-003 (the new last scenario in SCENARIO_MANIFEST) as complete
  await page.goto("/");
  const allButLast = [
    "tutorial-002", "scenario-002", "scenario-003", "scenario-004",
    "scenario-005", "scenario-006", "scenario-007", "scenario-008", "scenario-009",
  ];
  await page.evaluate((ids) => {
    localStorage.setItem("redistricting-sim-progress", JSON.stringify({ completed: ids }));
  }, allButLast);
  // Load tutorial-003. Its initial 4-quadrant assignment is already contiguous + balanced,
  // so no paintStroke is needed — submit passes on the starting map.
  await loadScenario(page, "tutorial-003");
  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  // Click "Next Scenario" — should show wrap-up, not select screen
  await page.locator("#btn-next-scenario").click();
  await expect(page.locator("#wrap-up-screen")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#wrap-up-screen")).toContainText("Congratulations");
  // Select screen should NOT be visible
  await expect(page.locator("#scenario-select")).not.toBeVisible();
});

// ─── GAME-029: About page ───────────────────────────────────────────────────

test("about page: accessible from main menu and shows educational content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await page.locator("#btn-main-about").click();
  await expect(page.locator("#about-screen")).toBeVisible();
  await expect(page.locator("#about-screen")).toContainText("Past the Post");
  await expect(page.locator("#about-screen")).toContainText("not advocacy");
  // Back button returns to main menu
  await page.locator("#btn-about-close").click();
  await expect(page.locator("#main-menu")).toBeVisible();
  await expect(page.locator("#about-screen")).not.toBeVisible();
});

// ─── GAME-048: Campaign-driven scenario select ──────────────────────────────

test("campaign select: ?campaign=tutorial shows tutorial-001, tutorial-002, and tutorial-003", async ({ page }) => {
  await page.goto("/?campaign=tutorial");
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  const cards = page.locator(".scenario-card");
  // GAME-082: tutorial-003 (geographic-features tour) is the third tutorial scenario.
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText("Welcome to Redistricting");
  await expect(cards.nth(1)).toContainText("Three-District Challenge");
  await expect(cards.nth(2)).toContainText("Hawthorn Bend");
});

test("campaign select: ?campaign=tutorial Back button is visible", async ({ page }) => {
  await page.goto("/?campaign=tutorial");
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-back-to-campaign")).toBeVisible();
});

test("routing: ?view=scenarios redirects to main menu (legacy URL)", async ({ page }) => {
  await page.goto("/?view=scenarios");
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#scenario-select")).not.toBeVisible();
});

test("routing: unknown ?campaign= redirects to main menu", async ({ page }) => {
  await page.goto("/?campaign=bogus");
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#scenario-select")).not.toBeVisible();
});

// ── GAME-051: in-game nav-back submenu ────────────────────────────────────────

test("in-game nav: back trigger is shown in header when playing a scenario via campaign", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await expect(page.locator("#btn-nav-back-trigger")).toBeVisible();
  await expect(page.locator("#nav-back-menu")).toBeHidden();
});

test("in-game nav: clicking trigger reveals both Return to Scenarios and Return to Main Menu", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-nav-back-trigger").click();
  await expect(page.locator("#nav-back-menu")).toBeVisible();
  await expect(page.locator("#btn-back-to-scenarios")).toBeVisible();
  await expect(page.locator("#btn-back-to-main-menu")).toBeVisible();
});

test("in-game nav: Return to Scenarios navigates to campaign scenario select", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-nav-back-trigger").click();
  await page.locator("#btn-back-to-scenarios").click();
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  expect(page.url()).toContain("campaign=tutorial");
});

test("in-game nav: Return to Main Menu navigates to main menu", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-nav-back-trigger").click();
  await page.locator("#btn-back-to-main-menu").click();
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
});

test("in-game nav: Escape key closes the nav submenu", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-nav-back-trigger").click();
  await expect(page.locator("#nav-back-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#nav-back-menu")).toBeHidden();
});

test("in-game nav: clicking outside the submenu closes it", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-001");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-nav-back-trigger").click();
  await expect(page.locator("#nav-back-menu")).toBeVisible();
  // Click somewhere outside the menu (the map area)
  await page.locator("path.hex").first().click();
  await expect(page.locator("#nav-back-menu")).toBeHidden();
});

test("in-game nav: without campaign context, shows plain Main Menu button (no dropdown)", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await expect(page.locator("#btn-nav-back-trigger")).toHaveText("← Main Menu");
  await expect(page.locator("#btn-back-to-scenarios")).toBeHidden();
});

// ─── GAME-066: result screen dramatic reveal ──────────────────────────────────

test("GAME-066: reduced-motion — all criterion rows visible immediately after submit", async ({ page }) => {
  // playwright.config reducedMotion:'reduce' is ignored in Bazel-sandboxed Chromium —
  // window.matchMedia() returns false there and the animated path runs. With ROW_CHAIN_MS=2550ms
  // and 5 rows in scenario-002, animated path takes 4×2550=10200ms > 10s test timeout.
  // Explicit emulateMedia call here ensures the instant path runs reliably.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await loadScenario(page, "scenario-002");
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();

  // All criterion rows must be visible immediately (no sequential reveal delay).
  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i)).toBeVisible();
    // Each row should be in a final state (passed, failed-required, or failed-optional)
    // not still in the pending checking state.
    await expect(rows.nth(i)).not.toHaveClass(/rc-pending/);
  }
});

test("GAME-066: result screen shows SVG criterion icons (not bare ✓/✗ text)", async ({ page }) => {
  // reducedMotion:'reduce' from global config — instant reveal, so we can check icons.
  await loadScenario(page, "scenario-002");
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();

  // Each rc-icon slot should contain an SVG element, not bare text.
  const icons = page.locator(".result-criterion .rc-icon svg");
  const count = await icons.count();
  expect(count).toBeGreaterThan(0);
});

// test.use() must be at describe scope, not inside a test() body.
test.describe("GAME-068: animated reveal path (no reduced-motion)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("Skip button finalises all rows instantly in animated reveal", async ({ page }) => {
    await loadScenario(page, "scenario-002");
    // Override loadScenario's reduce emulation — this test specifically exercises animated path.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("#btn-submit").click();
    await expect(page.locator("#result-screen")).toBeVisible();

    // Skip button visible during animated reveal.
    await expect(page.locator("#btn-reveal-skip")).toBeVisible();

    // Click Skip → all rows in final state immediately.
    await page.locator("#btn-reveal-skip").click();

    const rows = page.locator(".result-criterion");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toBeVisible();
      await expect(rows.nth(i)).not.toHaveClass(/rc-pending/);
    }

    // Skip button gone after skipping.
    await expect(page.locator("#result-reveal-controls")).toBeHidden();
  });
});

// ─── tutorial-003: "Hawthorn Bend — A Tour of the Map" (GAME-082 geo features tour) ───

test("tutorial-003 smoke: loads and renders 119 precincts", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // 127 R=6 circle hexes minus 3 mountain tiles minus 4 sea tiles (now at r=6) minus 1 lake tile = 119.
  await expect(page.locator("path.hex")).toHaveCount(119);
});

test("tutorial-003 terrain: 8 terrain tiles rendered (3 mountain + 4 sea + 1 lake)", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // Mountain tiles now at (-3,-3), (-2,-4), (-1,-5) — hexDist=6 boundary positions.
  await expect(page.locator("g.terrain-tile")).toHaveCount(8);
  await expect(page.locator("g.terrain-tile[data-terrain-type='mountain']")).toHaveCount(3);
  await expect(page.locator("g.terrain-tile[data-terrain-type='sea']")).toHaveCount(4);
  await expect(page.locator("g.terrain-tile[data-terrain-type='lake']")).toHaveCount(1);
});

test("tutorial-003 terrain: river rendered as two smoothed chains (split at lake tile)", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // 16 river edges split into two chains by the lake tile at (-1,1):
  //   chain 1: NW foothill (-1,-4) → (-2,1)  [9 edges]
  //   chain 2: (-2,2) → (-1,5) [7 edges] — downstream reach to coast area
  // Smoothing uses d3.curveCardinal.tension(0.4).
  await expect(page.locator("path.river-chain")).toHaveCount(2);
  const d = await page.locator("path.river-chain").first().getAttribute("d");
  expect(d).toBeTruthy();
  expect(d!.startsWith("M")).toBe(true);
  // curveCardinal on 3+ points emits cubic bezier (C).
  expect(d!.includes("C")).toBe(true);
});

test("tutorial-003 terrain: terrain tiles are non-interactive (pointer-events: none)", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  const pointerEvents = await page.locator("g.terrain-tile").first().evaluate(
    (el) => getComputedStyle(el).pointerEvents,
  );
  expect(pointerEvents).toBe("none");
});

test("tutorial-003 terrain: coast edge strokes on precincts adjacent to sea", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // Sea tiles moved to r=6: (-3,6), (-2,6), (-1,6), (0,6). Coast precincts at r=5 / edge of map:
  //   (-3,6): 3 precinct-facing edges → (-4,6), (-3,5), (-2,5)
  //   (-2,6): 2 precinct-facing edges → (-2,5), (-1,5)
  //   (-1,6): 2 precinct-facing edges → (-1,5), (0,5)
  //   (0,6):  2 precinct-facing edges → (0,5), (1,5)
  // Total: 3+2+2+2 = 9 sea-facing edges, each rendered as a curved <path> (GAME-082).
  await expect(page.locator("path.terrain-edge-sea")).toHaveCount(9);
});

test("tutorial-003 terrain: lake edge strokes on precincts adjacent to lake tile", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // Lake tile at (-1,1). All 6 neighbours are valid precincts, each with 1 lake-facing edge:
  //   (0,1), (-1,2), (-2,2), (-2,1), (-1,0), (0,0)
  // Total: 6 lake-facing edges, each rendered as a curved <path>.
  await expect(page.locator("path.terrain-edge-lake")).toHaveCount(6);
});

test("tutorial-003 terrain: foothill edge strokes on precincts adjacent to mountains", async ({ page }) => {
  await page.goto("/?s=tutorial-003&debug");
  // Mountain tiles at (-3,-3), (-2,-4), (-1,-5) are NOT precincts (terrain-position exclusion).
  // Only positions with hexDist ≤ 6 are valid precincts. Foothill precincts are:
  //   (-2,-3): 2 edges facing (-3,-3) and (-2,-4) [hexDist=5]
  //   (-3,-2): 1 edge facing (-3,-3)              [hexDist=3]
  //   (-4,-2): 1 edge facing (-3,-3)              [hexDist=4]
  //   (-1,-4): 2 edges facing (-2,-4) and (-1,-5) [hexDist=5]
  //   (0,-5):  1 edge facing (-1,-5)              [hexDist=5]
  //   (0,-6):  1 edge facing (-1,-5)              [hexDist=6]
  // Positions (-4,-3), (-3,-4), (-2,-5), (-1,-6) are hexDist=7 — outside the grid.
  // Total: 2+1+1+2+1+1 = 8 mountain-facing edges, rendered as curved <path> (GAME-082).
  await expect(page.locator("path.terrain-edge-mountain")).toHaveCount(8);
});

test("tutorial-003 contiguity: river is cosmetic, initial quadrant districts are contiguous", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  // GAME-082: rivers are visual only — `river_blocks_contiguity: false`. The initial 4-quadrant
  // assignment (3×3 blocks of precincts) is contiguous and population-balanced; no repainting needed.
  await expect(page.locator("#validity-container")).toBeVisible();
  const validityText = await page.locator("#validity-container").innerText();
  expect(validityText).toMatch(/Connected/);
  expect(validityText).not.toMatch(/Non-contiguous/);
});
