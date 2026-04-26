import { test, expect } from "@playwright/test";

/**
 * Sprint 3 behavioral tests — GAME-016 (scenario intro screen).
 *
 * Verifies the intro slide flow:
 *   1. Intro screen is visible on initial load (before map editor)
 *   2. Character info is populated from scenario narrative
 *   3. Slide navigation (Next / Previous) cycles through slides correctly
 *   4. "Start Drawing" appears on the last slide and reveals the editor
 *   5. "Skip intro" immediately reveals the editor
 */

// ─── GAME-016: Scenario intro screen ─────────────────────────────────────────

test("intro: screen is visible on initial load before editor", async ({ page }) => {
  await page.goto("/");
  // Intro screen must be visible; editor elements must be hidden
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#app-header")).not.toBeVisible();
  await expect(page.locator("#main")).not.toBeVisible();
});

test("intro: character name and role are shown from scenario narrative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  // tutorial-001.json character: name="You", role="Redistricting Coordinator, Millbrook County"
  await expect(page.locator("#char-name")).toHaveText("You");
  await expect(page.locator("#char-role")).toContainText("Redistricting Coordinator");
});

test("intro: first slide heading is shown and Previous is disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-slide-heading")).toHaveText("Welcome to Redistricting");
  await expect(page.locator("#btn-intro-prev")).toBeDisabled();
});

test("intro: Next advances to second slide; Previous returns to first", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });

  // Advance to slide 2
  await page.locator("#btn-intro-next").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("Your job is simple (in theory)");
  await expect(page.locator("#btn-intro-prev")).toBeEnabled();

  // Return to slide 1
  await page.locator("#btn-intro-prev").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("Welcome to Redistricting");
});

test("intro: Start Drawing button appears on last slide and reveals editor", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });

  // Start Drawing should not be visible on first slide
  await expect(page.locator("#btn-intro-start")).not.toBeVisible();

  // Advance to last slide (tutorial has 2 slides)
  await page.locator("#btn-intro-next").click();
  await expect(page.locator("#btn-intro-start")).toBeVisible();
  await expect(page.locator("#btn-intro-next")).not.toBeVisible();

  // Clicking Start Drawing hides intro and shows editor
  await page.locator("#btn-intro-start").click();
  await expect(page.locator("#intro-screen")).not.toBeVisible();
  await expect(page.locator("#app-header")).toBeVisible();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
});

test("intro: Skip intro immediately reveals editor without navigating slides", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#btn-intro-skip")).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-intro-skip").click();
  await expect(page.locator("#intro-screen")).not.toBeVisible();
  await expect(page.locator("#app-header")).toBeVisible();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
});

test("intro: objective text is shown from scenario narrative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#objective-text")).toContainText("Divide Millbrook County");
});
