import { test, expect } from "@playwright/test";

/**
 * Sprint 2 behavioral tests — backfill for GAME-009, DESIGN-002, GAME-010,
 * GAME-011, GAME-012, GAME-013.
 *
 * Each test covers one named interaction from the Sprint 2 feature set.
 * Pan/zoom gesture simulation (scroll wheel, right-click drag) is not tested
 * here — those require browser internals not reliably available in Playwright
 * headless Chromium. DOM-level structural checks are used instead.
 *
 * Precinct event simulation uses dispatchEvent() directly on SVG path elements
 * (same approach as sprint1.spec.ts) to avoid coordinate-mapping issues.
 */

/** Navigate, dismiss the intro screen, and wait for the hex grid to be ready. */
async function loadApp(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?s=tutorial-002");
  // Dismiss intro screen (GAME-016)
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

/** Simulate a single-precinct brush stroke on the given hex selector. */
async function paintHex(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).dispatchEvent("mousedown");
  await page.evaluate(() => window.dispatchEvent(new MouseEvent("mouseup")));
}

// ─── GAME-009: Pan / zoom DOM structure ───────────────────────────────────────

test("pan/zoom: zoom-layer group exists in SVG after load", async ({ page }) => {
  await loadApp(page);
  await expect(page.locator("svg g.zoom-layer")).toBeAttached();
});

test("pan/zoom: keyboard shortcut 0 fires without console error", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`[pageerror] ${err.message}`));

  await loadApp(page);
  // Press 0 to reset zoom — should not throw
  await page.keyboard.press("0");
  expect(consoleErrors).toHaveLength(0);
});

// (View toggle + county overlay are exercised via the map filter toolbar — see the
//  GAME-093 section below. The old header toggle buttons were removed in GAME-093.)

// ─── GAME-010: Map validity panel ────────────────────────────────────────────

test("validity panel: non-empty after load with at least one validity row", async ({ page }) => {
  await loadApp(page);
  const panel = page.locator("#validity-container");
  await expect(panel).not.toBeEmpty();
  await expect(panel.locator(".validity-row").first()).toBeVisible();
});

test("validity panel: updates after painting a precinct to a new district", async ({ page }) => {
  await loadApp(page);

  // Capture initial validity panel HTML
  const before = await page.locator("#validity-container").innerHTML();

  // Switch to District 2 and paint precinct 0
  await page.locator("button.district-btn").nth(1).click();
  await paintHex(page, "path.hex[data-precinct-id='0']");
  await expect(page.locator("#btn-undo")).toBeEnabled();

  // Panel content must have changed (population distribution changed)
  const after = await page.locator("#validity-container").innerHTML();
  expect(after).not.toBe(before);
});

// ─── GAME-011: Precinct info sidebar ─────────────────────────────────────────

test("precinct info: shows placeholder on load", async ({ page }) => {
  await loadApp(page);
  const placeholder = page.locator("#precinct-info .precinct-placeholder");
  await expect(placeholder).toBeVisible();
});

test("precinct info: hover over hex shows precinct details; mouseout restores placeholder", async ({
  page,
}) => {
  await loadApp(page);
  const hex = page.locator("path.hex[data-precinct-id='0']");
  const placeholder = page.locator("#precinct-info .precinct-placeholder");
  const detail = page.locator("#precinct-info .precinct-detail");

  // Hover over precinct 0
  await hex.dispatchEvent("mousemove", { bubbles: true });

  await expect(placeholder).not.toBeVisible();
  await expect(detail).toBeVisible();

  // Move mouse out of SVG
  const svgEl = page.locator("#map-svg");
  await svgEl.dispatchEvent("mouseout", {
    relatedTarget: null,
    bubbles: true,
  });

  await expect(placeholder).toBeVisible();
});

// ─── GAME-093: map view filter toolbar (replaces old header view/county toggles) ──

test("filter toolbar: present; coloring radio + overlay sections, defaults correct", async ({ page }) => {
  await loadApp(page);
  await expect(page.locator("#map-filters")).toBeVisible();
  // Section 1 — precinct coloring (radio): districts selected by default.
  await expect(page.locator("#filter-districts")).toHaveClass(/active/);
  await expect(page.locator("#filter-districts")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "false");
  // Section 2 — overlay (toggle): county off by default.
  await expect(page.locator("#filter-county")).toHaveAttribute("aria-pressed", "false");
  // Section headers + visible labels (expanded by default).
  await expect(page.locator(".map-filter-section-label").first()).toBeVisible();
  await expect(page.locator("#filter-districts .map-filter-label")).toHaveText("Districts");
  // Theme tooltip text present (used when collapsed).
  await expect(page.locator("#filter-districts")).toHaveAttribute("data-tip", /district/i);
});

test("filter toolbar: expand/collapse toggle hides/shows labels", async ({ page }) => {
  await loadApp(page);
  await expect(page.locator("#map-filters")).toHaveClass(/expanded/);
  await expect(page.locator("#filter-districts .map-filter-label")).toBeVisible();
  // Collapse → labels hidden, toggle reflects state.
  await page.locator("#map-filters-toggle").click();
  await expect(page.locator("#map-filters")).toHaveClass(/collapsed/);
  await expect(page.locator("#filter-districts .map-filter-label")).toBeHidden();
  await expect(page.locator("#map-filters-toggle")).toHaveAttribute("aria-expanded", "false");
  // Expand again.
  await page.locator("#map-filters-toggle").click();
  await expect(page.locator("#map-filters")).toHaveClass(/expanded/);
  await expect(page.locator("#filter-districts .map-filter-label")).toBeVisible();
});

test("filter toolbar: coloring is mutually exclusive (districts <-> lean)", async ({ page }) => {
  await loadApp(page);
  await page.locator("#filter-lean").click();
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#filter-lean")).toHaveClass(/active/);
  await expect(page.locator("#filter-districts")).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("#filter-districts")).not.toHaveClass(/active/);
  await page.locator("#filter-districts").click();
  await expect(page.locator("#filter-districts")).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#filter-lean")).toHaveAttribute("aria-checked", "false");
});

test("filter toolbar: county overlay toggles independently; layer in DOM; no errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`[pageerror] ${err.message}`));

  await loadApp(page);
  const btn = page.locator("#filter-county");

  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await expect(btn).toHaveClass(/active/);
  // Layer group must exist in DOM (may be empty if scenario has no county_id data)
  await expect(page.locator("svg g.county-borders")).toBeAttached();

  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "false");
  await expect(btn).not.toHaveClass(/active/);

  expect(consoleErrors).toHaveLength(0);
});

// ─── GAME-013: Reset to initial ──────────────────────────────────────────────

test("reset: button is visible and confirm row is hidden on load", async ({ page }) => {
  await loadApp(page);
  await expect(page.locator("#btn-reset")).toBeVisible();
  await expect(page.locator("#reset-confirm")).not.toBeVisible();
});

test("reset: clicking Reset shows confirm row without changing map", async ({ page }) => {
  await loadApp(page);
  const hex0 = page.locator("path.hex[data-precinct-id='0']");
  const initialFill = await hex0.getAttribute("fill");

  await page.locator("#btn-reset").click();
  await expect(page.locator("#reset-confirm")).toBeVisible();

  // Map should be unchanged
  await expect(hex0).toHaveAttribute("fill", initialFill!);
});

test("reset: Cancel hides confirm row and preserves undo state", async ({ page }) => {
  await loadApp(page);
  const btnUndo = page.locator("#btn-undo");

  // Paint first so undo is enabled
  await page.locator("button.district-btn").nth(1).click();
  await paintHex(page, "path.hex[data-precinct-id='0']");
  await expect(btnUndo).toBeEnabled();

  // Open and cancel reset
  await page.locator("#btn-reset").click();
  await page.locator("#btn-reset-cancel").click();

  await expect(page.locator("#reset-confirm")).not.toBeVisible();
  // Undo must still be enabled (history not cleared)
  await expect(btnUndo).toBeEnabled();
});

test("reset: full flow — paint, confirm reset, fills restored, undo disabled", async ({
  page,
}) => {
  await loadApp(page);
  const hex0 = page.locator("path.hex[data-precinct-id='0']");
  const btnUndo = page.locator("#btn-undo");
  const btnRedo = page.locator("#btn-redo");

  const initialFill = await hex0.getAttribute("fill");

  // Paint precinct 0 to District 2
  await page.locator("button.district-btn").nth(1).click();
  await paintHex(page, "path.hex[data-precinct-id='0']");
  await expect(btnUndo).toBeEnabled();
  expect(await hex0.getAttribute("fill")).not.toBe(initialFill);

  // Reset with confirmation
  await page.locator("#btn-reset").click();
  await expect(page.locator("#reset-confirm")).toBeVisible();
  await page.locator("#btn-reset-confirm").click();

  // Confirm row hidden; fill restored; both undo and redo disabled
  await expect(page.locator("#reset-confirm")).not.toBeVisible();
  await expect(hex0).toHaveAttribute("fill", initialFill!);
  await expect(btnUndo).toBeDisabled();
  await expect(btnRedo).toBeDisabled();
});
