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

// GAME-076/077/098/099: tutorial-001..004 run a guided overlay (scenario.guided). Suppress it
// by default so the existing tutorial tests aren't intercepted by the coach panel / input-pause.
// The overlay-specific tests below force it with `?resetTutorial=1`, which clears these flags on
// load. (Harmless for non-guided scenarios — the flags are ignored.)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("tutorial-tutorial-001-complete", "1");
      localStorage.setItem("tutorial-tutorial-002-complete", "1");
      localStorage.setItem("tutorial-tutorial-003-complete", "1");
      localStorage.setItem("tutorial-tutorial-004-complete", "1");
    } catch { /* ignore */ }
  });
});

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
  // GAME-094: on a win the teaching debrief lives on a second panel, reached via "Continue →".
  await expect(page.locator("#btn-continue")).toBeVisible();
  await page.locator("#btn-continue").click();
  await expect(page.locator("#result-debrief")).toBeVisible();
  await expect(page.locator("#result-epilogue")).toContainText("packing");
  await expect(page.locator("#btn-debrief-next")).toBeVisible();
  // Back returns to the results view.
  await page.locator("#btn-debrief-back").click();
  await expect(page.locator("#result-main")).toBeVisible();
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
  // tutorial-002 ("A Legal Map") has a teaching epilogue (GAME-094), so the pass screen
  // routes through "Continue →" rather than showing "Next Scenario" directly.
  await expect(page.locator("#btn-continue")).toBeVisible();
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

test("reset: also restarts the guided tutorial in place (zeroes the whole scenario)", async ({ page }) => {
  // The beforeEach marks tutorials complete, so the overlay is normally suppressed.
  await page.goto("/?s=tutorial-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0); // suppressed

  // Reset → confirm: resets the map AND restarts the guided overlay in place (no reload).
  await page.locator("#btn-reset").click();
  await page.locator("#btn-reset-confirm").click();
  await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#tutorial-panel")).toContainText("rules"); // T2 step 1
});

test("reset: does not start an overlay on a non-guided scenario", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  await page.locator("#btn-reset").click();
  await page.locator("#btn-reset-confirm").click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
});

test("reset: restores the initial view — districts colouring + county overlay off", async ({ page }) => {
  // Reset zeroes the whole scenario including the vantage point: switch to lean + turn county
  // borders on, then Reset should restore districts colouring + county off (not just the map).
  await page.goto("/?s=scenario-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  await page.locator("#filter-lean").click();
  await page.locator("#filter-county").click();
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#filter-county")).toHaveAttribute("aria-pressed", "true");

  await page.locator("#btn-reset").click();
  await page.locator("#btn-reset-confirm").click();

  await expect(page.locator("#filter-districts")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#filter-county")).toHaveAttribute("aria-pressed", "false");
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
  // Seed all but tutorial-004 (the new last scenario in SCENARIO_MANIFEST) as complete
  await page.goto("/");
  const allButLast = [
    "tutorial-002", "tutorial-003", "scenario-002", "scenario-003", "scenario-004",
    "scenario-005", "scenario-006", "scenario-007", "scenario-008", "scenario-009",
  ];
  await page.evaluate((ids) => {
    localStorage.setItem("redistricting-sim-progress", JSON.stringify({ completed: ids }));
  }, allButLast);
  // tutorial-004 ("Capstone") opens as one district; carve four wedges around the centre so the
  // map is balanced (±15%) + contiguous and passes (same winning move as the winnability test).
  await loadScenario(page, "tutorial-004");
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], d: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found");
    const state = store.getState();
    const d2: number[] = [];
    const d3: number[] = [];
    const d4: number[] = [];
    const off = Math.PI / 4;
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      const x = Math.sqrt(3) * (p.coord.q + p.coord.r / 2);
      const y = 1.5 * p.coord.r;
      let a = Math.atan2(y, x);
      if (a < 0) a += 2 * Math.PI;
      const wedge = Math.min(3, Math.floor(((a - off + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2)));
      if (wedge === 1) d2.push(i);
      else if (wedge === 2) d3.push(i);
      else if (wedge === 3) d4.push(i);
      // wedge 0 stays District 1
    });
    state.paintStroke(d2, 2);
    state.paintStroke(d3, 3);
    state.paintStroke(d4, 4);
  });
  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  // tutorial-004 has a teaching epilogue → the pass screen routes through "Continue →" to the
  // debrief panel; its advance button (last scenario) leads to the wrap-up screen.
  await page.locator("#btn-continue").click();
  await page.locator("#btn-debrief-next").click();
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

// ─── GAME-097: tutorial-001 "Welcome" (pipeline-generated, paint + submit) ───

test("tutorial-001 smoke: loads and renders 37 hex-circle precincts", async ({ page }) => {
  // Campaign-only scenario: needs ?campaign=tutorial to bypass the routing guard.
  await page.goto("/?campaign=tutorial&s=tutorial-001&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  expect(await page.locator("path.hex").count()).toBe(37);
});

test("tutorial-001 strips chrome to paint-only (no prediction, validity, view toolbar, or legend)", async ({ page }) => {
  // T1 is the paint-only welcome: hide_election_results + no balance criterion +
  // contiguity:allowed hide the prediction and validity panels; hide_view_toolbar hides
  // the view toolbar and forces the painter open; the legend is removed game-wide (the
  // paint toolbar serves as the legend).
  await page.goto("/?campaign=tutorial&s=tutorial-001&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  await expect(page.locator("#results-container")).toBeHidden();
  await expect(page.locator("#results-heading")).toBeHidden();
  await expect(page.locator("#validity-container")).toBeHidden();
  await expect(page.locator("#validity-heading")).toBeHidden();
  await expect(page.locator("#map-filters")).toBeHidden();
  // The paint toolbar is forced open (it doubles as the legend).
  await expect(page.locator("#district-toolbar")).toHaveClass(/expanded/);
  // The legend is removed game-wide.
  await expect(page.locator("#legend-container")).toHaveCount(0);
});

test("tutorial-001 winnability: carving a balanced contiguous District 2 passes", async ({ page }) => {
  /**
   * Hex circle R=3: 37 precincts, 2 districts. The whole county opens as District 1;
   * T1 gates ONLY on district_count (both districts used, every precinct assigned) —
   * balance and contiguity are deliberately not enforced here. So carving any chunk
   * into District 2 wins.
   *
   * We carve a clean southern block (rows r=1,2,3 + the western half of the centre row)
   * into District 2 — a realistic 18/19 split — and assert the map passes.
   */
  await page.goto("/?campaign=tutorial&s=tutorial-001&debug");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  // Carve the southern block into District 2 (everything else stays District 1).
  await paintHexes(page, [
    [-3,1],[-2,1],[-1,1],[0,1],[1,1],[2,1],   // r=1
    [-3,2],[-2,2],[-1,2],[0,2],[1,2],         // r=2
    [-3,3],[-2,3],[-1,3],[0,3],               // r=3
    [-3,0],[-2,0],[-1,0],                      // r=0, western half
  ], 2);

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  // On a win the teaching debrief lives on a second panel, reached via "Continue →".
  await page.locator("#btn-continue").click();
  await expect(page.locator("#result-debrief")).toBeVisible();
  await expect(page.locator("#result-epilogue")).toContainText("core loop");
});

test("tutorial-001: a wildly imbalanced split still passes (balance not enforced)", async ({ page }) => {
  // Regression guard for the pre-electoral rule "no untaught failure modes": T1 has no
  // population_balance criterion and contiguity:allowed, so even a 1-vs-36 split must pass.
  // The player can never fail for an imbalance the welcome never taught.
  await page.goto("/?campaign=tutorial&s=tutorial-001&debug");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  // Put a single precinct into District 2; the other 36 stay District 1.
  await paintHexes(page, [[0, 3]], 2);

  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── GAME-076: guided overlay (tutorial-001 paint-only walkthrough) ──────────

/** Force the guided overlay on tutorial-001, skip the intro, wait for the panel. */
async function loadGuidedT1(page: import("@playwright/test").Page): Promise<void> {
  // resetTutorial=1 clears the suppression flag the beforeEach set, so the overlay runs.
  await page.goto("/?campaign=tutorial&s=tutorial-001&debug&resetTutorial=1");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });
}

test("guided overlay: walks the player from orient → pick D2 → paint → undo → submit", async ({ page }) => {
  await loadGuidedT1(page);

  // Step 1 — orient.
  await expect(page.locator("#tutorial-panel")).toContainText("District 1");
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 2 — pick District 2: the button is ringed, input is paused.
  await expect(page.locator("#tutorial-panel")).toContainText("District 2");
  await expect(page.locator('[data-district="2"]')).toHaveClass(/tutorial-highlight/);
  await expect(page.locator("#main")).toHaveClass(/tutorial-paused/);
  await page.locator('[data-district="2"]').click();

  // Step 3 — paint: advance once 5 precincts are in District 2 (via the store, like other tests).
  await expect(page.locator("#tutorial-panel")).toContainText("paint");
  await expect(page.locator("#map-svg")).toHaveClass(/tutorial-highlight/);
  await paintHexes(page, [[-3, 3], [-2, 3], [-1, 3], [0, 3], [-3, 2]], 2);

  // Step 4 — undo.
  await expect(page.locator("#tutorial-panel")).toContainText("Undo");
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 5 — submit (terminal): clicking Submit ends the overlay and shows results.
  await expect(page.locator("#tutorial-panel")).toContainText("Submit");
  await page.locator("#btn-submit").click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
  await expect(page.locator("#result-screen")).toBeVisible();
});

test("guided overlay: Skip dismisses it", async ({ page }) => {
  await loadGuidedT1(page);
  await page.locator("#tutorial-panel .tutorial-skip").click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
});

test("guided overlay: not shown on a non-guided scenario", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
});

// ─── GAME-077: guided overlay (tutorial-002 "A Legal Map") ───────────────────

test("guided overlay: tutorial-002 runs the legal-map script (orient → paint → validity → Done)", async ({ page }) => {
  // resetTutorial=1 clears the suppression flag the beforeEach set, so the overlay runs.
  await page.goto("/?campaign=tutorial&s=tutorial-002&debug&resetTutorial=1");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });

  // Step 1 — orient to the two rules.
  await expect(page.locator("#tutorial-panel")).toContainText("rules");
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 2 — paint: advance once 5 precincts are in District 2 (via the store, like other tests).
  await expect(page.locator("#tutorial-panel")).toContainText("Paint");
  await paintHexes(page, [[-3, 3], [-2, 3], [-1, 3], [0, 3], [-3, 2]], 2);

  // Step 3 — the Map Validity panel (the star of T2) is ringed.
  await expect(page.locator("#tutorial-panel")).toContainText("Map Validity");
  await expect(page.locator("#validity-container")).toHaveClass(/tutorial-highlight/);
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 4 — read-only "Done" beat: no in-overlay submit. The map is frozen (no tutorial-interactive);
  // clicking Done ends the tutorial and unlocks the editor so the player evens out + submits on their own.
  await expect(page.locator("#tutorial-panel")).toContainText("the map's yours");
  await expect(page.locator("#map-svg")).not.toHaveClass(/tutorial-interactive/);
  const doneBtn = page.locator("#tutorial-panel .tutorial-next");
  await expect(doneBtn).toHaveText("Done");
  await doneBtn.click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
  await expect(page.locator("#result-screen")).toBeHidden();
  await expect(page.locator("#main")).not.toHaveClass(/tutorial-paused/);
});

// ─── GAME-048: Campaign-driven scenario select ──────────────────────────────

test("campaign select: ?campaign=tutorial shows the four tutorials in order", async ({ page }) => {
  await page.goto("/?campaign=tutorial");
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  const cards = page.locator(".scenario-card");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toContainText("Welcome to Redistricting");
  await expect(cards.nth(1)).toContainText("A Legal Map");
  await expect(cards.nth(2)).toContainText("Hawthorn Bend");          // "Reading the Vote"
  await expect(cards.nth(3)).toContainText("Fairhaven");              // "Putting It Together" (Capstone)
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

// ─── tutorial-003: "Hawthorn Bend: Reading the Vote" (GAME-098 — first electoral layer) ───
// Redesigned from the old terrain tour: a 91-precinct map with an east/west partisan lean,
// a cosmetic river, and counties. Guided overlay reveals the election result + Lean view
// together, then the County view. Gates on district_count only (the result is shown to read).

test("tutorial-003 smoke: loads and renders 91 precincts", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  await expect(page.locator("path.hex")).toHaveCount(91);
});

test("tutorial-003 terrain: the cosmetic river is rendered", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  // The river renders as an SVG <path class="river-chain">. It's a thin stroked line, so
  // toBeVisible() (bounding-box based) is unreliable for SVG — assert it's attached instead.
  await expect(page.locator("path.river-chain").first()).toBeAttached();
});

test("tutorial-003 chrome: the result panel AND the Map Validity panel are both visible", async ({ page }) => {
  // hide_election_results: false → the result panel shows (first electoral tutorial). And T3
  // gates balance + contiguity, so the Map Validity panel stays visible — panels accrete once
  // revealed (it was introduced in T2; the applicable-aware hiding must not re-hide it here).
  await loadScenario(page, "tutorial-003");
  await expect(page.locator("#results-container")).toBeVisible();
  await expect(page.locator("#validity-container")).toBeVisible();
});

test("tutorial-003 lean view: switching to Lean recolors the map by partisanship", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  const hex0 = page.locator("path.hex").first();
  const districtFill = await hex0.getAttribute("fill");
  await page.locator("#filter-lean").click();
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "true");
  await expect(hex0).not.toHaveAttribute("fill", districtFill!);
});

test("tutorial-003 county view: the county overlay toggles on", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  const county = page.locator("#filter-county");
  await county.click();
  await expect(county).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("svg g.county-borders")).toBeAttached();
});

test("tutorial-003 winnability: three balanced, connected wedges pass (district_count + balance + contiguity)", async ({ page }) => {
  await loadScenario(page, "tutorial-003");
  // T3 draws a LEGAL map: three districts balanced (±15%) + connected, plus reading the vote.
  // Carve three wedges around the centre — each gets a slice of the dense core + sparse rim, so
  // all three balance (BFS-verified; a 45° rotation is best: -1 / +4 / -3%, comfortably within
  // ±15% even with the routed river's riverside population ridge — GAME-100).
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], d: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found");
    const state = store.getState();
    const d2: number[] = [];
    const d3: number[] = [];
    const off = Math.PI / 4; // 45° rotation — best-balanced wedge orientation
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      const x = Math.sqrt(3) * (p.coord.q + p.coord.r / 2);
      const y = 1.5 * p.coord.r;
      let a = Math.atan2(y, x);
      if (a < 0) a += 2 * Math.PI;
      const wedge = Math.min(2, Math.floor(((a - off + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI / 3)));
      if (wedge === 1) d2.push(i);
      else if (wedge === 2) d3.push(i);
      // wedge 0 stays District 1
    });
    state.paintStroke(d2, 2);
    state.paintStroke(d3, 3);
  });
  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── GAME-098: guided overlay (tutorial-003) — first use of the `reveal` action ───

test("guided overlay: tutorial-003 reveals the result + lean, then county, then a Done beat", async ({ page }) => {
  // resetTutorial=1 clears the suppression flag the beforeEach set, so the overlay runs.
  await page.goto("/?campaign=tutorial&s=tutorial-003&debug&resetTutorial=1");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });

  // The reveal targets start hidden — the overlay hides them on load.
  await expect(page.locator("#results-container")).toBeHidden();
  await expect(page.locator("#filter-lean")).toBeHidden();
  await expect(page.locator("#filter-county")).toBeHidden();

  // Step 1 — orient.
  await expect(page.locator("#tutorial-panel")).toContainText("geography");
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 2 — reveal the Lean button + the election result; advance only when Lean is clicked.
  await expect(page.locator("#tutorial-panel")).toContainText("election result");
  await expect(page.locator("#results-container")).toBeVisible();
  await expect(page.locator("#filter-lean")).toBeVisible();
  await page.locator("#filter-lean").click(); // the "thing" — Next is not offered on this step
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "true");

  // Step 3 — paint and watch the result move; advance once 5 precincts are in District 2.
  await expect(page.locator("#tutorial-panel")).toContainText("watch the result");
  await paintHexes(page, [[-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0]], 2);

  // Step 4 — reveal the County view (paused; advance on clicking the county toggle).
  await expect(page.locator("#tutorial-panel")).toContainText("County");
  await expect(page.locator("#filter-county")).toBeVisible();
  await page.locator("#filter-county").click();

  // Step 5 — read-only "Done" beat: no in-overlay submit. The map is frozen; clicking Done ends
  // the tutorial and unlocks the editor so the player draws + submits on their own.
  await expect(page.locator("#tutorial-panel")).toContainText("whole picture");
  await expect(page.locator("#map-svg")).not.toHaveClass(/tutorial-interactive/);
  const doneBtn = page.locator("#tutorial-panel .tutorial-next");
  await expect(doneBtn).toHaveText("Done");
  await doneBtn.click();
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
  await expect(page.locator("#result-screen")).toBeHidden();
  await expect(page.locator("#main")).not.toHaveClass(/tutorial-paused/);
});

// ─── tutorial-004: "Fairhaven: Putting It Together" (GAME-099 — capstone) ───
// A fuller map (127 precincts, 4 districts) with every tool visible from the start (nothing
// hidden, no reveal). Light guided orientation; gates the full legal-map skill —
// district_count + population_balance (±15%) + contiguity.

test("tutorial-004 smoke: loads and renders 127 precincts", async ({ page }) => {
  await loadScenario(page, "tutorial-004");
  await expect(page.locator("path.hex")).toHaveCount(127);
});

test("tutorial-004 capstone chrome: validity panel, view toolbar, and result are all visible", async ({ page }) => {
  // The capstone hides nothing (hide_election_results: false, hide_view_toolbar: false, no
  // reveal). With the overlay suppressed (beforeEach), every tool is present from load.
  await loadScenario(page, "tutorial-004");
  await expect(page.locator("#validity-container")).toBeVisible();
  await expect(page.locator("#map-filters")).toBeVisible();
  await expect(page.locator("#results-container")).toBeVisible();
});

test("tutorial-004 winnability: four balanced, connected districts pass (district_count + balance + contiguity)", async ({ page }) => {
  await loadScenario(page, "tutorial-004");
  // Carve four wedges around the centre — each district gets an equal slice of the dense core
  // and the sparse rim, so all four land within ±15% (BFS-verified balanced + contiguous;
  // a 45° rotation is the best-balanced). This is the "give the dense centre to everyone" move
  // a player arrives at by evening out the panel.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], d: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found");
    const state = store.getState();
    const d2: number[] = [];
    const d3: number[] = [];
    const d4: number[] = [];
    const off = Math.PI / 4; // 45° rotation — best-balanced wedge orientation
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      const x = Math.sqrt(3) * (p.coord.q + p.coord.r / 2);
      const y = 1.5 * p.coord.r;
      let a = Math.atan2(y, x);
      if (a < 0) a += 2 * Math.PI;
      const wedge = Math.min(3, Math.floor(((a - off + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2)));
      if (wedge === 1) d2.push(i);
      else if (wedge === 2) d3.push(i);
      else if (wedge === 3) d4.push(i);
      // wedge 0 stays District 1
    });
    state.paintStroke(d2, 2);
    state.paintStroke(d3, 3);
    state.paintStroke(d4, 4);
  });
  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
});

// ─── GAME-099: guided overlay (tutorial-004) — light orient (nothing hidden) ───

test("guided overlay: tutorial-004 gives a light orient then a read-only Done beat that unlocks without submitting", async ({ page }) => {
  await page.goto("/?campaign=tutorial&s=tutorial-004&debug&resetTutorial=1");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 15_000 });
  await skip.click();
  await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });

  // Nothing is hidden — the capstone reveals no controls.
  await expect(page.locator("#results-container")).toBeVisible();
  await expect(page.locator("#map-filters")).toBeVisible();

  // Step 1 — orient.
  await expect(page.locator("#tutorial-panel")).toContainText("capstone");
  await page.locator("#tutorial-panel .tutorial-next").click();

  // Step 2 — paint a full district's worth (32). The live counter shows the target and progress.
  await expect(page.locator("#tutorial-panel")).toContainText("full district's worth");
  await expect(page.locator("#tutorial-panel .tutorial-progress")).toBeVisible();
  await expect(page.locator("#tutorial-panel .tutorial-progress")).toContainText("/ 32 painted");
  // Paint 32 precincts into District 2 via the store (the overlay counts assignments live).
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], d: number) => void;
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found");
    store.getState().paintStroke([...Array(32).keys()], 2);
  });

  // Step 3 — read-only "Done" beat: the map + painter are locked (no tutorial-interactive), so the
  // only action is reading the coach and clicking Done. The button reads "Done", not "Next →".
  await expect(page.locator("#tutorial-panel")).toContainText("the map is yours", { timeout: 10_000 });
  await expect(page.locator("#map-svg")).not.toHaveClass(/tutorial-interactive/);
  await expect(page.locator("#district-toolbar")).not.toHaveClass(/tutorial-interactive/);
  const doneBtn = page.locator("#tutorial-panel .tutorial-next");
  await expect(doneBtn).toHaveText("Done");
  await doneBtn.click();

  // Done ends the tutorial WITHOUT submitting: the overlay is gone, no result screen appeared,
  // and the editor is unlocked (the player finishes — pan, inspect, submit — on their own).
  await expect(page.locator("#tutorial-panel")).toHaveCount(0);
  await expect(page.locator("#result-screen")).toBeHidden();
  await expect(page.locator("#main")).not.toHaveClass(/tutorial-paused/);
});
