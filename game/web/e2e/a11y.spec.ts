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

// tutorial-001 is campaign-only; must include campaign param to bypass routing guard.
const SCENARIO_URL = "/?campaign=tutorial&s=tutorial-001&debug=true";

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
    for (const id of ["btn-undo", "btn-redo", "btn-view-toggle", "btn-submit"]) {
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
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => document.activeElement?.id ?? "");
      focused.push(id);
      if (focused.length > 15 && focused.includes("btn-submit")) break;
    }

    // Only assert always-enabled buttons — disabled buttons (undo, redo, submit)
    // are correctly excluded from tab order until actions enable them.
    for (const id of ["btn-view-toggle", "btn-county-toggle", "btn-reset", "map-svg"]) {
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
