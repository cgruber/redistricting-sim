import { test, expect } from "@playwright/test";

/**
 * Sprint 1 behavioral tests — Phase 2 (CI-002).
 *
 * Covers the five interaction categories required for the Sprint 1 demo:
 *   1. Scenario load:        30 precincts rendered, no console errors
 *   2. Paint interaction:    drag assigns a precinct to the active district
 *   3. Undo:                 undo restores prior assignment
 *   4. View toggle:          fill changes when switching between districts/lean modes
 *   5. Boundary rendering:   painting a precinct to a new district creates boundary lines
 *
 * Initial app state (tutorial-001.json):
 *   - The loader auto-fills null initial_district_id with districts[0].id ("d1").
 *   - All 30 precincts therefore start assigned to District 1.
 *   - Initial hex fills are HSL-adjusted District 1 blue (not #2a2a3e).
 *   - No interior boundaries (all same district); only outer grid edges.
 *
 * Mouse interaction note:
 *   page.mouse coordinates are unreliable for SVG paths in headless Chromium
 *   when the SVG has a large/negative viewBox. We use locator.dispatchEvent()
 *   to fire events directly on the element, which is more robust.
 *
 * Note: Playwright/Chromium is not installed on the dev machine; these tests
 * are verified in CI only.
 */

/**
 * Simulate a single-precinct brush stroke by dispatching mousedown on the hex
 * element and mouseup on the window. The window-level mouseup commits the stroke.
 *
 * IMPORTANT: Set the active district BEFORE calling this (click a .district-btn)
 * so the stroke paints to the intended district.
 */
async function paintHex(
	page: import("@playwright/test").Page,
	selector: string,
): Promise<void> {
	const hex = page.locator(selector);
	await hex.dispatchEvent("mousedown");
	await page.evaluate(() => window.dispatchEvent(new MouseEvent("mouseup")));
}

/** Navigate, dismiss the intro screen, and wait for the hex grid to be ready. */
async function loadApp(page: import("@playwright/test").Page): Promise<void> {
	await page.goto("/");
	// Dismiss intro screen (GAME-016)
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 10_000 });
	await skip.click();
	// Wait for the first hex to be visible — WASM and store init complete at this point
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

// ─── Test 1: Scenario load ────────────────────────────────────────────────────

test("scenario load: 30 precincts rendered with no console errors", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (err) => {
		consoleErrors.push(`[pageerror] ${err.message}`);
	});

	await loadApp(page);

	const hexCount = await page.locator("path.hex").count();
	expect(hexCount).toBe(30);

	expect(consoleErrors).toHaveLength(0);
});

// ─── Test 2: Paint interaction ────────────────────────────────────────────────

test("paint interaction: painting a precinct changes its fill and enables undo", async ({
	page,
}) => {
	await loadApp(page);

	const hex0 = page.locator("path.hex[data-precinct-id='0']");
	const btnUndo = page.locator("#btn-undo");

	// Capture initial fill (District 1 blue — all precincts start as D1 due to
	// loader auto-fill). Undo is disabled because no strokes have been made yet.
	const initialFill = await hex0.getAttribute("fill");
	await expect(btnUndo).toBeDisabled();

	// Switch to District 2 so this stroke actually changes the assignment
	await page.locator("button.district-btn").nth(1).click();

	// Paint precinct 0 to District 2
	await paintHex(page, "path.hex[data-precinct-id='0']");

	// Wait for the stroke to commit (undo button becomes enabled)
	await expect(btnUndo).toBeEnabled();

	// Fill must have changed from the District 1 color
	const fillAfter = await hex0.getAttribute("fill");
	expect(fillAfter).not.toBe(initialFill);
});

// ─── Test 3: Undo ─────────────────────────────────────────────────────────────

test("undo: restores fill to previous assignment and disables undo button", async ({ page }) => {
	await loadApp(page);

	const hex0 = page.locator("path.hex[data-precinct-id='0']");
	const btnUndo = page.locator("#btn-undo");

	// Capture the initial fill before any painting
	const initialFill = await hex0.getAttribute("fill");

	// Switch to District 2 and paint precinct 0
	await page.locator("button.district-btn").nth(1).click();
	await paintHex(page, "path.hex[data-precinct-id='0']");
	await expect(btnUndo).toBeEnabled();

	// Undo the stroke
	await btnUndo.click();

	// Undo button should be disabled again (no more history)
	await expect(btnUndo).toBeDisabled();

	// Fill must be restored to the original assignment
	await expect(hex0).toHaveAttribute("fill", initialFill!);
});

// ─── Test 4: View toggle ──────────────────────────────────────────────────────

test("view toggle: switching to lean mode changes hex fills", async ({ page }) => {
	await loadApp(page);

	const hex0 = page.locator("path.hex[data-precinct-id='0']");
	const btnViewToggle = page.locator("#btn-view-toggle");

	// Capture the districts-mode fill (HSL-adjusted District 1 blue)
	const districtsFill = await hex0.getAttribute("fill");

	// Toggle to lean mode
	await btnViewToggle.click();

	// In lean mode fills are RdBu-interpolated from partyShare — different from
	// the districts palette color
	await expect(hex0).not.toHaveAttribute("fill", districtsFill!);
});

// ─── Test 5: Boundary rendering ───────────────────────────────────────────────

test("boundary rendering: painting a precinct to a new district creates boundary lines", async ({
	page,
}) => {
	await loadApp(page);

	const btnUndo = page.locator("#btn-undo");

	// All precincts start as District 1 → no interior boundaries (same district
	// everywhere). Only outer grid edges exist at this point.
	const initialBoundaryCount = await page.locator("line.boundary").count();

	// Switch to District 2 and paint precinct 0.
	// Precinct 0 becomes D2; its neighbors remain D1 → interior boundaries appear
	// between D2 (precinct 0) and each D1 neighbor.
	await page.locator("button.district-btn").nth(1).click();
	await paintHex(page, "path.hex[data-precinct-id='0']");
	await expect(btnUndo).toBeEnabled();

	const afterBoundaryCount = await page.locator("line.boundary").count();
	expect(afterBoundaryCount).toBeGreaterThan(initialBoundaryCount);
});
