import { test, expect } from "@playwright/test";

/**
 * GAME-008 Accessibility e2e tests.
 *
 * Targeted ARIA and keyboard assertions — no axe-core dependency.
 * Covers:
 *   1. HTML lang attribute
 *   2. Main menu ARIA roles
 *   3. Game screen ARIA labels
 *   4. Control button tab order
 *   5. SVG keyboard navigation
 *   6. Keyboard district assignment
 */

// The a11y suite exercises the FULL editor chrome (view toolbar, results/validity panels).
// tutorial-001 is the stripped paint-only welcome (no view toolbar/legend/panels), so the
// suite runs against scenario-002, which has the complete UI.
const SCENARIO_URL = "/?s=scenario-002&debug=true";

/** Navigate to the game editor, skip the intro, and wait for the hex grid. */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(SCENARIO_URL);
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });
}

test.describe("GAME-008 Accessibility", () => {
  // ─── Test 1: HTML lang attribute ──────────────────────────────────────────

  test("html element has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBeTruthy();
  });

  // ─── Test 2: Main menu ARIA roles ─────────────────────────────────────────

  test("main menu has correct ARIA roles and focusable buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });

    // #main-menu must carry role="main"
    const menuRole = await page.locator("#main-menu").getAttribute("role");
    expect(menuRole).toBe("main");

    // #main-menu-nav must declare its navigation purpose
    const navRole = await page.locator("#main-menu-nav").getAttribute("role");
    const navLabel = await page.locator("#main-menu-nav").getAttribute("aria-label");
    expect(navRole === "navigation" || (navLabel !== null && navLabel.length > 0)).toBeTruthy();

    // New Campaign button must be focusable
    await page.locator("#btn-main-new-campaign").focus();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe("btn-main-new-campaign");
  });

  // ─── Test 3: Game screen ARIA labels ──────────────────────────────────────

  test("game screen elements have required ARIA labels and roles", async ({ page }) => {
    await loadEditor(page);

    // SVG map must be keyboard-accessible and labelled
    const svg = page.locator("#map-svg");
    const svgRole = await svg.getAttribute("role");
    expect(svgRole).toBe("application");

    const svgTabindex = await svg.getAttribute("tabindex");
    expect(svgTabindex).toBe("0");

    const svgAriaLabel = await svg.getAttribute("aria-label");
    expect(svgAriaLabel).toBeTruthy();

    // Results container must announce updates to assistive tech
    const resultsLive = await page.locator("#results-container").getAttribute("aria-live");
    expect(resultsLive).toBe("polite");

    // All control buttons must have accessible labels
    for (const id of ["btn-undo", "btn-redo", "filter-districts", "filter-county", "btn-submit"]) {
      const label = await page.locator(`#${id}`).getAttribute("aria-label");
      expect(label, `#${id} must have a non-empty aria-label`).toBeTruthy();
    }

    // District button group must expose its group role
    const groupRole = await page.locator("#district-buttons").getAttribute("role");
    expect(groupRole).toBe("group");
  });

  // ─── Test 4: Control button tab order ─────────────────────────────────────

  test("control buttons appear in tab sequence", async ({ page }) => {
    await loadEditor(page);

    const focused: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => document.activeElement?.id ?? "");
      focused.push(id);
    }

    // Only assert always-enabled controls — disabled buttons (undo, redo, submit)
    // are correctly excluded from tab order until actions enable them. The map view
    // filter toolbar buttons sit after the SVG in DOM order.
    for (const id of ["btn-reset", "map-svg", "filter-districts", "filter-county"]) {
      expect(focused, `#${id} must appear in tab sequence`).toContain(id);
    }
  });

  // ─── Test 5: SVG keyboard navigation ──────────────────────────────────────

  test("SVG keyboard navigation focuses a precinct and updates aria-label", async ({ page }) => {
    await loadEditor(page);

    // Click SVG to focus it, then press ArrowDown to select first precinct
    await page.locator("#map-svg").click();
    await page.keyboard.press("ArrowDown");

    const label = await page.locator("#map-svg").getAttribute("aria-label");
    expect(label).toContain("focused:");
  });

  // ─── Test 6: Keyboard district assignment ─────────────────────────────────

  test("keyboard district assignment leaves SVG functional with no errors", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await loadEditor(page);

    // Focus SVG, navigate to first precinct, assign to district 1
    await page.locator("#map-svg").click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("1");
    await page.waitForTimeout(200);

    // SVG must still be visible and functional after keyboard assignment
    await expect(page.locator("#map-svg")).toBeVisible();

    // No JS errors must have been thrown
    expect(jsErrors).toHaveLength(0);
  });
});

// ─── GAME-055: Party names ────────────────────────────────────────────────────

test.describe("GAME-055 Party names", () => {
  /**
   * Test 1: scenario-002 results panel shows scenario party names (Ken Party / Ryu Party)
   * not the generic PARTY_LABELS fallbacks ("Party 1" / "Party 2").
   *
   * Exercises the paint→results path: we repaint a split across districts 1 and 2 via
   * window.__gameStore and assert renderResults() labels the districts with the scenario's
   * party names. (tutorial-001 can't be used here — it hides the results panel, being
   * pre-electoral; that hiding is covered in scenarios.spec.ts.)
   */
  test("scenario-002 results panel shows scenario party names not hardcoded labels", async ({ page }) => {
    await page.goto("/?s=scenario-002&debug=true");
    const skip = page.locator("#btn-intro-skip");
    await expect(skip).toBeVisible({ timeout: 10_000 });
    await skip.click();
    await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });

    // Assign all precincts to districts 1 and 2 (split roughly in half) via the
    // exposed game store so renderResults() runs with non-empty districtResults.
    await page.evaluate(() => {
      const store = (window as unknown as Record<string, {
        getState: () => {
          paintStroke: (ids: number[], district: number) => void;
          precincts: unknown[];
        };
      }>)["__gameStore"];
      if (!store) throw new Error("__gameStore not exposed");
      const { precincts, paintStroke } = store.getState();
      const total = precincts.length;
      const half = Math.floor(total / 2);
      // District 1 gets first half, district 2 gets second half
      paintStroke(Array.from({ length: half }, (_, i) => i), 1);
      paintStroke(Array.from({ length: total - half }, (_, i) => i + half), 2);
    });

    // Wait for at least one result-district row to appear
    await expect(page.locator("#results-container .result-district").first()).toBeVisible({ timeout: 5_000 });

    const resultsText = await page.locator("#results-container").innerText();

    // Must NOT contain the generic PARTY_LABELS fallbacks
    expect(resultsText).not.toContain("Party 1");
    expect(resultsText).not.toContain("Party 2");

    // Must contain both scenario-specific party names
    expect(resultsText).toContain("Ken Party");
    expect(resultsText).toContain("Ryu Party");
  });

  /**
   * Test 2: scenario-009 results panel shows Cat Party / Dog Party names.
   *
   * scenario-009 ships with all precincts pre-assigned, so results are already
   * populated on initial load — no painting required.
   */
  test("scenario-009 results panel shows scenario party names not hardcoded labels", async ({ page }) => {
    // scenario-009 is in the educational campaign, accessible via ?s= + ?debug
    await page.goto("/?campaign=educational&s=scenario-009&debug=true");
    const skip = page.locator("#btn-intro-skip");
    await expect(skip).toBeVisible({ timeout: 10_000 });
    await skip.click();
    await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });

    // All precincts are pre-assigned in scenario-009 — results render on page load
    await expect(page.locator("#results-container .result-district").first()).toBeVisible({ timeout: 5_000 });

    const resultsText = await page.locator("#results-container").innerText();

    // Must NOT contain the generic PARTY_LABELS fallbacks
    expect(resultsText).not.toContain("Party 1");
    expect(resultsText).not.toContain("Party 2");

    // Must contain both scenario-specific party names
    expect(resultsText).toContain("Cat Party");
    expect(resultsText).toContain("Dog Party");
  });
});
