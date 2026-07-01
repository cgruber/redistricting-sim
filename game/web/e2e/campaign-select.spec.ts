/**
 * GAME-049: Campaign select screen e2e tests.
 */

import { test, expect } from "@playwright/test";

const PROGRESS_KEY = "redistricting-sim-progress";

test("campaign select: ?view=campaigns renders both campaign titles", async ({ page }) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
	await expect(page.locator("#campaign-select")).toContainText("Tutorial");
	await expect(page.locator("#campaign-select")).toContainText("Educational Campaign");
});

test("campaign select: clicking Tutorial navigates to ?campaign=tutorial", async ({ page }) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator(".campaign-card").first()).toBeVisible({ timeout: 10_000 });
	await page.locator(".campaign-card").first().click();
	await expect(page).toHaveURL(/campaign=tutorial/);
});

test("campaign select: clicking Educational Campaign navigates to ?campaign=educational", async ({
	page,
}) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator(".campaign-card").nth(1)).toBeVisible({ timeout: 10_000 });
	await page.locator(".campaign-card").nth(1).click();
	await expect(page).toHaveURL(/campaign=educational/);
});

test("campaign select: progress shows 0 / 4 for Tutorial with fresh localStorage", async ({
	page,
}) => {
	await page.goto("/?view=campaigns");
	await page.evaluate((key) => localStorage.removeItem(key), PROGRESS_KEY);
	await page.reload();
	await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
	// The tutorial campaign has four scenarios (T1 core loop → T2 legal map → T3 reading the vote → T4 capstone).
	await expect(page.locator(".campaign-card").first()).toContainText("0 / 4 scenarios complete");
});

test("campaign select: debug campaign is hidden without debug mode (GAME-115)", async ({
	page,
}) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
	// Only the two shipped campaigns; the debug-only campaign must not appear.
	await expect(page.locator(".campaign-card")).toHaveCount(2);
	await expect(page.locator("#campaign-select")).not.toContainText("Debug (dev)");
});

test("campaign select: debug campaign appears with &debug (GAME-115)", async ({ page }) => {
	await page.goto("/?view=campaigns&debug");
	await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
	// Debug mode active → the gated debug campaign is the third card.
	await expect(page.locator(".campaign-card")).toHaveCount(3);
	await expect(page.locator("#campaign-select")).toContainText("Debug (dev)");
});

test("campaign select: Back button is present", async ({ page }) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator("#btn-campaign-back")).toBeVisible({ timeout: 10_000 });
});

test("campaign select: Back button navigates to main menu", async ({ page }) => {
	await page.goto("/?view=campaigns");
	await expect(page.locator("#btn-campaign-back")).toBeVisible({ timeout: 10_000 });
	await page.locator("#btn-campaign-back").click();
	await expect(page.locator("#main-menu")).toBeVisible({ timeout: 5_000 });
});
