/**
 * GAME-050: Main menu / title screen e2e tests.
 *
 * Tests the main menu that appears at app root (/), including Continue,
 * New Campaign, About, Load, and Settings buttons.
 */

import { test, expect } from "@playwright/test";

const LAST_PLAYED_KEY = "redistricting-sim-last-played-scenario";

test("main menu: / renders main menu (not scenario select)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#scenario-select")).not.toBeVisible();
});

test("main menu: title 'Past the Post' is displayed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-menu")).toContainText("Past the Post", { timeout: 10_000 });
});

test("main menu: New Campaign button navigates to ?view=campaigns", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#btn-main-new-campaign")).toBeVisible({ timeout: 10_000 });
  await page.locator("#btn-main-new-campaign").click();
  await expect(page).toHaveURL(/view=campaigns/);
});

test("main menu: About button opens about page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#btn-main-about")).toBeVisible({ timeout: 10_000 });
  await page.locator("#btn-main-about").click();
  await expect(page.locator("#about-screen")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("#main-menu")).not.toBeVisible();
});

test("main menu: Continue absent when no campaign progress exists", async ({ page }) => {
  await page.goto("/");
  // Ensure no last-played key
  await page.evaluate((key) => localStorage.removeItem(key), LAST_PLAYED_KEY);
  await page.reload();
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-main-continue")).not.toBeVisible();
});

test("main menu: Continue present when lastPlayedScenarioId set in localStorage", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ([key, val]) => localStorage.setItem(key, val),
    [LAST_PLAYED_KEY, "tutorial-002"],
  );
  await page.reload();
  await expect(page.locator("#main-menu")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-main-continue")).toBeVisible();
});

test("main menu: Continue navigates directly to last played scenario", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ([key, val]) => localStorage.setItem(key, val),
    [LAST_PLAYED_KEY, "tutorial-002"],
  );
  await page.reload();
  await expect(page.locator("#btn-main-continue")).toBeVisible({ timeout: 10_000 });
  await page.locator("#btn-main-continue").click();
  await expect(page).toHaveURL(/s=tutorial-002/);
});

test("main menu: Load is visible but disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#btn-main-load")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-main-load")).toBeDisabled();
  await expect(page.locator("#btn-main-load")).toContainText("coming soon");
});

test("main menu: Settings is visible but disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#btn-main-settings")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#btn-main-settings")).toBeDisabled();
  await expect(page.locator("#btn-main-settings")).toContainText("coming soon");
});
