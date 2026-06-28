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

// ─── GAME-105: focus management + modal inert (no pre-focus) ───────────────────

test.describe("GAME-105 focus management & inert", () => {
  // These tests deliberately do NOT pre-focus any element — they exercise the real
  // bug: focus never moving on a screen transition. The pre-existing suite (above)
  // pre-focuses, which is exactly why it missed this.

  /**
   * After clicking Submit, focus must land *inside* the result dialog — not stay on
   * the now-hidden Submit button. We never call .focus() ourselves.
   */
  test("submit moves focus into the result screen (no manual focus)", async ({ page }) => {
    await loadEditor(page);

    await page.locator("#btn-submit").click();
    await expect(page.locator("#result-screen")).toBeVisible();

    // Wait for the rAF-deferred focus to land, then assert activeElement is in the dialog.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const ae = document.activeElement;
          const dialog = document.getElementById("result-screen");
          return ae !== null && dialog !== null && dialog.contains(ae);
        }),
      )
      .toBe(true);
  });

  /**
   * With the result dialog open, the live editor behind it must be inert — a keyboard
   * user cannot Tab into the map / re-submit behind the modal. We assert the editor
   * roots are inert AND that focusing #map-svg cannot make it the activeElement.
   */
  test("result overlay makes the editor inert (cannot reach the map behind it)", async ({ page }) => {
    await loadEditor(page);

    await page.locator("#btn-submit").click();
    await expect(page.locator("#result-screen")).toBeVisible();

    // Editor roots carry the inert property.
    const mainInert = await page.locator("#main").evaluate((el) => (el as HTMLElement).inert);
    const headerInert = await page.locator("#app-header").evaluate((el) => (el as HTMLElement).inert);
    expect(mainInert).toBe(true);
    expect(headerInert).toBe(true);

    // Attempting to focus the map fails — inert elements cannot receive focus.
    const mapBecameActive = await page.evaluate(() => {
      const svg = document.getElementById("map-svg");
      svg?.focus();
      return document.activeElement === svg;
    });
    expect(mapBecameActive).toBe(false);
  });

  /**
   * Keep Drawing restores the editor — inert is cleared so the map works again.
   */
  test("Keep Drawing clears editor inert", async ({ page }) => {
    await loadEditor(page);

    await page.locator("#btn-submit").click();
    await expect(page.locator("#result-screen")).toBeVisible();
    await page.locator("#btn-keep-drawing").click();
    await expect(page.locator("#result-screen")).not.toBeVisible();

    const mainInert = await page.locator("#main").evaluate((el) => (el as HTMLElement).inert);
    expect(mainInert).toBe(false);

    // And the map can now be focused again.
    const mapBecameActive = await page.evaluate(() => {
      const svg = document.getElementById("map-svg");
      svg?.focus();
      return document.activeElement === svg;
    });
    expect(mapBecameActive).toBe(true);
  });

  /**
   * Keyboard path: during a non-paint tutorial step the map must be locked for the
   * keyboard too — focusing #map-svg and pressing a number key must NOT paint.
   * tutorial-002 step 1 is an intro ("next" advance) — a frozen, non-paint step.
   */
  test("tutorial non-paint step: keyboard cannot focus the map or paint", async ({ page }) => {
    // tutorial-002 is guided; resetTutorial=1 forces the coach to run. The intro slides
    // play before the editor, so skip them first (the overlay starts on showEditor).
    await page.goto("/?campaign=tutorial&s=tutorial-002&debug=true&resetTutorial=1");
    const skip = page.locator("#btn-intro-skip");
    await expect(skip).toBeVisible({ timeout: 15_000 });
    await skip.click();
    await expect(page.locator("#tutorial-panel")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });

    // Step 1 is the intro (non-paint). The map must carry the inert attribute (inert is an
    // HTMLElement IDL property only, so it's set/read via the namespace-agnostic attribute).
    const mapInert = await page.locator("#map-svg").evaluate((el) => el.hasAttribute("inert"));
    expect(mapInert).toBe(true);

    // PRIMARY assertion (the literal ticket requirement): try to focus the map and paint via
    // the keyboard during a frozen step, then assert NO assignment occurred. This holds
    // regardless of focus-mechanics quirks — it's the actual user-facing invariant.
    // Fingerprint the assignment VALUES, not assignments.size: the adapter seeds an
    // entry for every precinct at load, so .size is invariant under painting (paint
    // mutates values on existing keys) and a size assertion would pass even if the lock
    // were removed. Serializing the entries detects any actual paint. The companion
    // "control" test below proves this exact key sequence DOES paint on an unlocked map,
    // so "unchanged here" genuinely means the lock blocked a real paint.
    const fingerprint = () =>
      page.evaluate(() => {
        const store = (window as unknown as Record<string, { getState: () => { assignments: Map<number, number | null> } }>)["__gameStore"];
        return store ? JSON.stringify([...store.getState().assignments.entries()]) : "no-store";
      });

    const before = await fingerprint();

    // Attempt to focus the map and drive the number-key paint handler.
    await page.evaluate(() => document.getElementById("map-svg")?.focus());
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("2");
    await page.waitForTimeout(150);

    const after = await fingerprint();
    expect(after).toBe(before); // lock held — no precinct was reassigned
  });

  /**
   * Control for the test above: on an UNLOCKED (non-tutorial) map, the identical
   * keyboard sequence (focus → init-focus key → number key) DOES paint a precinct.
   * Without this, the locked-step assertion could pass vacuously (e.g. if the key
   * sequence were wrong); together they prove the tutorial lock blocks a real paint.
   */
  test("control: keyboard number key paints on an unlocked map", async ({ page }) => {
    await page.goto("/?s=scenario-002&debug");
    const skip = page.locator("#btn-intro-skip");
    await expect(skip).toBeVisible({ timeout: 15_000 });
    await skip.click();
    await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });

    // No tutorial → the map must NOT be inert here.
    expect(await page.locator("#map-svg").evaluate((el) => el.hasAttribute("inert"))).toBe(false);

    const fingerprint = () =>
      page.evaluate(() => {
        const store = (window as unknown as Record<string, { getState: () => { assignments: Map<number, number | null> } }>)["__gameStore"];
        return store ? JSON.stringify([...store.getState().assignments.entries()]) : "no-store";
      });

    const before = await fingerprint();

    // Same sequence as the locked test: focus, ArrowDown (initialises keyboard focus to
    // precinct 0), then "1" (paints precinct 0 into district 1 — districtCount ≥ 2 always).
    await page.evaluate(() => document.getElementById("map-svg")?.focus());
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("1");
    await page.waitForTimeout(150);

    const after = await fingerprint();
    expect(after).not.toBe(before); // the sequence really does paint when the map is unlocked
  });

  /**
   * Scenario cards must carry role="listitem" (parent is role="list").
   */
  test("scenario cards have role=listitem", async ({ page }) => {
    await page.goto("/?campaign=educational");
    await expect(page.locator("#scenario-cards .scenario-card").first()).toBeVisible({ timeout: 10_000 });
    const roles = await page.locator("#scenario-cards .scenario-card").evaluateAll((els) =>
      els.map((e) => e.getAttribute("role")),
    );
    expect(roles.length).toBeGreaterThan(0);
    for (const r of roles) expect(r).toBe("listitem");
  });

  /**
   * #nav-back-menu (campaign context) focuses its first menuitem on open and roves with
   * ArrowUp/ArrowDown; Escape returns focus to the trigger.
   */
  test("nav-back submenu: focus first item on open, arrow roving, Escape returns to trigger", async ({ page }) => {
    // A campaign context gives the two-item dropdown (single-option mode is a plain button).
    // scenario-002 is non-guided, so no tutorial overlay competes for Escape/focus.
    await page.goto("/?campaign=educational&s=scenario-002&debug=true");
    const skip = page.locator("#btn-intro-skip");
    await expect(skip).toBeVisible({ timeout: 10_000 });
    await skip.click();
    await expect(page.locator("#map-svg path.hex").first()).toBeVisible({ timeout: 10_000 });

    await page.locator("#btn-nav-back-trigger").click();
    await expect(page.locator("#nav-back-menu")).toBeVisible();

    // First menuitem is focused on open.
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("btn-back-to-scenarios");

    // ArrowDown moves to the second; ArrowUp back to the first (wrap not required, but roving is).
    await page.keyboard.press("ArrowDown");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("btn-back-to-main-menu");
    await page.keyboard.press("ArrowUp");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("btn-back-to-scenarios");

    // Escape closes the menu and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(page.locator("#nav-back-menu")).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("btn-nav-back-trigger");
  });

  /**
   * The focus-state aria-label builds the key range from districtCount, not a hardcoded 1–5.
   * scenario-002 has 4 districts, so the label must say "1–4", never "1–5".
   */
  test("map aria-label key range is built from districtCount", async ({ page }) => {
    await loadEditor(page); // scenario-002 (4 districts)
    await page.locator("#map-svg").click();
    await page.keyboard.press("ArrowDown");
    const label = await page.locator("#map-svg").getAttribute("aria-label");
    expect(label).toContain("focused:");
    expect(label).not.toContain("1–5");
    expect(label).toContain("1–4");
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
