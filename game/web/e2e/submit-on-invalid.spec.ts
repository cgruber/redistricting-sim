import { test, expect } from "@playwright/test";

/**
 * GAME-059: Submit-on-invalid maps.
 *
 * Validates that:
 *   1. Submit button is always enabled regardless of map validity
 *   2. Submitting an invalid map shows a failure result screen with validity errors
 *   3. Any non-passing result hides "Next Scenario" and shows the back button
 *   4. Submitting a passing map shows pass screen with "Next Scenario"
 *   5. "Fix It" label appears on invalid map result; "Keep Drawing" on passing map result
 *   6. Validity sidebar panel updates live during drawing (regression guard)
 */

/** Navigate, dismiss intro, wait for hex grid. */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

/** Use the store shortcut to paint all precincts into a single district (invalid: all in d1). */
async function paintAllIntoDistrictOne(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void; assignments: Map<number, number | null> } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    const state = store.getState();
    const allIds = Array.from(state.assignments.keys());
    state.paintStroke(allIds, 1); // All precincts → district 1; districts 2 and 3 empty
  });
}

/** Paint the winning move: move boundary precincts at r=-2, q=-6..0 from d2 to d1. */
async function paintWinningMove(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void; precincts: { coord: { q: number; r: number } }[] } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    const state = store.getState();
    const coordToIdx = new Map<string, number>();
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      coordToIdx.set(`${p.coord.q},${p.coord.r}`, i);
    });
    // Move 7 hexes at r=-2, q=-6..0 from central (d2) → north (d1)
    const ids: number[] = [];
    for (let q = -6; q <= 0; q++) {
      const idx = coordToIdx.get(`${q},-2`);
      if (idx !== undefined) ids.push(idx);
    }
    state.paintStroke(ids, 1);
  });
}

// ─── Always-enabled submit button ────────────────────────────────────────────

test("submit-on-invalid: submit button is enabled on initial load (no validity gate)", async ({ page }) => {
  await loadEditor(page);
  // Submit must be enabled regardless of validity (GAME-059)
  await expect(page.locator("#btn-submit")).toBeEnabled();
});

test("submit-on-invalid: submit button is enabled with empty assignments", async ({ page }) => {
  await loadEditor(page);
  // Paint all into d1 → districts 2 and 3 empty; map is definitely invalid
  await paintAllIntoDistrictOne(page);
  // Submit still enabled
  await expect(page.locator("#btn-submit")).toBeEnabled();
});

// ─── Invalid map result screen ────────────────────────────────────────────────

test("submit-on-invalid: submitting invalid map shows failure result screen", async ({ page }) => {
  await loadEditor(page);
  // All precincts in d1 → invalid map (districts 2 and 3 empty, population way off)
  await paintAllIntoDistrictOne(page);

  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Failed");
  await expect(page.locator("#result-verdict")).toHaveClass(/fail/);
});

test("submit-on-invalid: invalid map result shows validity constraint rows", async ({ page }) => {
  await loadEditor(page);
  // All precincts in d1 → structural violations visible
  await paintAllIntoDistrictOne(page);

  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  // At least one failed-required criterion row must appear
  await expect(page.locator(".result-criterion.failed-required").first()).toBeVisible();
});

test("submit-on-invalid: invalid map shows Fix It button, not Next Scenario", async ({ page }) => {
  await loadEditor(page);
  await paintAllIntoDistrictOne(page);

  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  // Fix It button visible (relabeled keep-drawing)
  await expect(page.locator("#btn-keep-drawing")).toBeVisible();
  await expect(page.locator("#btn-keep-drawing")).toHaveText(/Fix It/);
  // Next Scenario must be hidden
  await expect(page.locator("#btn-next-scenario")).not.toBeVisible();
});

test("submit-on-invalid: Fix It button returns to editor from invalid map result", async ({ page }) => {
  await loadEditor(page);
  await paintAllIntoDistrictOne(page);

  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();

  await page.locator("#btn-keep-drawing").click();
  await expect(page.locator("#result-screen")).not.toBeVisible();
});

// ─── Any non-passing result ───────────────────────────────────────────────────

test("submit-on-invalid: any non-passing result hides Next Scenario and shows the back button", async ({ page }) => {
  // The initial state of tutorial-002 has population imbalance (invalid map).
  // Submitting it produces a non-passing result — the result screen shows a
  // failure verdict, the back button (Keep Drawing / Fix It), and hides Next Scenario.
  // Note: the "Fix It" vs "Keep Drawing" label distinction is covered separately:
  //   - "Fix It" for invalid maps: see "invalid map shows Fix It button, not Next Scenario"
  //   - "Keep Drawing" for passing maps: see "passing map shows Keep Drawing (not Fix It) label"
  await loadEditor(page);
  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Failed");
  await expect(page.locator("#btn-keep-drawing")).toBeVisible();
  await expect(page.locator("#btn-next-scenario")).not.toBeVisible();
});

// ─── Winning (passing) map result screen ─────────────────────────────────────

test("submit-on-invalid: passing map shows pass screen with Next Scenario", async ({ page }) => {
  await loadEditor(page);
  // Paint the winning move to satisfy all required criteria
  await paintWinningMove(page);

  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  // Both buttons shown on pass
  await expect(page.locator("#btn-keep-drawing")).toBeVisible();
  await expect(page.locator("#btn-next-scenario")).toBeVisible();
});

test("submit-on-invalid: passing map shows Keep Drawing (not Fix It) label", async ({ page }) => {
  await loadEditor(page);
  await paintWinningMove(page);

  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  // Label must be "Keep Drawing" on a passing map, not "Fix It"
  await expect(page.locator("#btn-keep-drawing")).toHaveText(/Keep Drawing/);
});

// ─── Validity sidebar live update (regression guard) ─────────────────────────

test("submit-on-invalid: validity sidebar updates live during drawing", async ({ page }) => {
  await loadEditor(page);

  // Validity panel must be present in the DOM
  await expect(page.locator("#validity-container")).toBeAttached();

  // Paint precincts via store shortcut and confirm the panel re-renders
  // (presence of a validity row implies the panel updated)
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    store.getState().paintStroke([0, 1, 2], 2);
  });

  // After painting, the panel should still be visible and contain content
  await expect(page.locator("#validity-container")).toBeVisible();
  // The panel renders validity rows (class="validity-row ..."); at least one should be present
  await expect(page.locator("#validity-container .validity-row").first()).toBeAttached();
});
