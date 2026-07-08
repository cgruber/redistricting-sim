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

test("campaign select: Educational Campaign is a non-interactive 'coming soon' card (GAME-128)", async ({
	page,
}) => {
	await page.goto("/?view=campaigns");
	const eduCard = page.locator(".campaign-card").nth(1);
	await expect(eduCard).toBeVisible({ timeout: 10_000 });
	await expect(eduCard).toContainText("Educational Campaign");
	// Not yet playable: an italic "coming soon" replaces the scenario count, the card carries
	// aria-disabled, and clicking it does not navigate into the campaign.
	await expect(eduCard).toContainText("coming soon");
	await expect(eduCard).not.toContainText("scenarios complete");
	await expect(eduCard).toHaveAttribute("aria-disabled", "true");
	await eduCard.click();
	await expect(page).not.toHaveURL(/campaign=educational/);
});

test("campaign select: progress shows 0 / 6 for Tutorial with fresh localStorage", async ({
	page,
}) => {
	await page.goto("/?view=campaigns");
	await page.evaluate((key) => localStorage.removeItem(key), PROGRESS_KEY);
	await page.reload();
	await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
	// The tutorial campaign has six scenarios (T1 core loop → T2 legal map → T3 reading the vote →
	// T4 synthesis → T5 multi-party → T6 independent).
	await expect(page.locator(".campaign-card").first()).toContainText("0 / 6 scenarios complete");
});

test("campaign select: only the two public campaigns show, with or without &debug (GAME-121)", async ({
	page,
}) => {
	// GAME-121 promoted the multi-party + independent demos into the public tutorial and retired the
	// debug campaign, so no shipped campaign is debugOnly — the card count no longer depends on
	// &debug. (The debugOnly filter itself is still unit-tested against a synthetic fixture.)
	for (const url of ["/?view=campaigns", "/?view=campaigns&debug"]) {
		await page.goto(url);
		await expect(page.locator("#campaign-select")).toBeVisible({ timeout: 10_000 });
		await expect(page.locator(".campaign-card")).toHaveCount(2);
		await expect(page.locator("#campaign-select")).not.toContainText("Debug (dev)");
	}
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
