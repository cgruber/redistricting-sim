import { test, expect } from "@playwright/test";

/**
 * Sprint 1 behavioral tests — Phase 2 (CI-002).
 *
 * Covers the five interaction categories required for the Sprint 1 demo:
 *   1. Scenario load:        precincts rendered, no console errors
 *   2. Paint interaction:    drag assigns a precinct to the active district
 *   3. Undo:                 undo restores prior assignment
 *   4. View toggle:          fill changes when switching between districts/lean modes
 *   5. Boundary rendering:   painting a precinct to a new district creates boundary lines
 *
 * Fixture: these run against scenario-002 (the educational campaign opener) — a stable,
 * play-relevant editor fixture shared by the generic e2e tests (decoupled from the
 * tutorials, which are now guided). scenario-002 has 91 precincts, 4 districts, and a
 * fully-assigned diagonal-strip initial state.
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
	await page.goto("/?s=scenario-002&debug");
	// Force the instant result-screen path (the sandbox ignores config reducedMotion).
	await page.emulateMedia({ reducedMotion: "reduce" });
	// Dismiss intro screen (GAME-016)
	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 10_000 });
	await skip.click();
	// Wait for the first hex to be visible — WASM and store init complete at this point
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

// ─── Test 1: Scenario load ────────────────────────────────────────────────────

test("scenario load: 91 precincts rendered with no console errors", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (msg) => {
		if (msg.type() === "error") consoleErrors.push(msg.text());
	});
	page.on("pageerror", (err) => {
		consoleErrors.push(`[pageerror] ${err.message}`);
	});

	await loadApp(page);

	const hexCount = await page.locator("path.hex").count();
	expect(hexCount).toBe(91);

	expect(consoleErrors).toHaveLength(0);
});

// ─── Test 2: Paint interaction ────────────────────────────────────────────────

test("paint interaction: painting a precinct changes its fill and enables undo", async ({
	page,
}) => {
	await loadApp(page);

	const hex0 = page.locator("path.hex[data-precinct-id='0']");
	const btnUndo = page.locator("#btn-undo");

	// Capture initial fill (precinct 0 starts in District 2 per scenario-002's
	// initial assignment). Undo is disabled because no strokes have been made yet.
	const initialFill = await hex0.getAttribute("fill");
	await expect(btnUndo).toBeDisabled();

	// Switch to District 4 (unused in scenario-002's initial state) so this stroke
	// actually changes precinct 0's assignment (it starts in District 2).
	await page.locator("button.district-btn").nth(3).click();

	// Paint precinct 0 to District 4
	await paintHex(page, "path.hex[data-precinct-id='0']");

	// Wait for the stroke to commit (undo button becomes enabled)
	await expect(btnUndo).toBeEnabled();

	// Fill must have changed from the District 2 color
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

	// Switch to District 4 (unused initially) and paint precinct 0 (starts in District 2)
	await page.locator("button.district-btn").nth(3).click();
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

	// Capture the districts-mode fill (HSL-adjusted District 1 blue)
	const districtsFill = await hex0.getAttribute("fill");

	// Switch to lean coloring via the map filter toolbar (GAME-093).
	await page.locator("#filter-lean").click();

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

	// scenario-002 starts with a fully-assigned initial map (d1/d2/d3), so some
	// interior boundaries already exist. Capture the baseline count.
	const initialBoundaryCount = await page.locator("line.boundary").count();

	// Switch to District 4 (unused initially) and paint precinct 0 (starts in D2).
	// Precinct 0 becomes D4; its two same-district (D2) neighbors each gain a new
	// boundary with it → the interior boundary count strictly increases.
	await page.locator("button.district-btn").nth(3).click();
	await paintHex(page, "path.hex[data-precinct-id='0']");
	await expect(btnUndo).toBeEnabled();

	const afterBoundaryCount = await page.locator("line.boundary").count();
	expect(afterBoundaryCount).toBeGreaterThan(initialBoundaryCount);
});
