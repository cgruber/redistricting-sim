import { test, expect } from "@playwright/test";

/**
 * Sprint 4 behavioral tests:
 *   GAME-052 (animated criteria reveal on result screen)
 *
 * GAME-052: Animated criteria evaluation:
 *   1. Criteria rows have staggered animationDelay styles applied
 *   2. Clicking the result screen fast-forwards all rows to visible
 *   3. Party reaction emoji is shown for pass/fail outcomes
 *   4. Final visible state matches expected criteria count (regression)
 */

/** Navigate, dismiss intro, wait for hex grid. */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

/** Force-open the result screen by bypassing submit gate. */
async function openResultScreen(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const btn = document.getElementById("btn-submit") as HTMLButtonElement | null;
    if (btn) btn.disabled = false;
  });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
}

// ─── GAME-052: Animated criteria reveal ──────────────────────────────────────

test("GAME-052: criterion rows have staggered animation-delay styles", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // Row 0 → 0ms delay; row 1 → 120ms; row N → N*120ms
  for (let i = 0; i < count; i++) {
    const delay = await rows.nth(i).evaluate((el) => (el as HTMLElement).style.animationDelay);
    expect(delay).toBe(`${i * 120}ms`);
  }
});

test("GAME-052: clicking result screen reveals all rows instantly", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  await page.locator("#result-screen").click();

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const opacity = await rows.nth(i).evaluate((el) => (el as HTMLElement).style.opacity);
    // animation shorthand is cleared; computed animationName resolves to "none"
    const animationName = await rows.nth(i).evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(opacity).toBe("1");
    expect(animationName).toBe("none");
  }
});

test("GAME-052: party reaction element is populated after submit", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  const reaction = page.locator("#result-reaction");
  await expect(reaction).toBeVisible();
  const text = await reaction.textContent();
  expect(text).toBeTruthy();
  expect(text!.trim().length).toBeGreaterThan(0);
});

test("GAME-052: final state has correct criteria count after skip (regression)", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  await page.locator("#result-screen").click();

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // All rows must have rc-badge children (structural integrity)
  const badges = page.locator(".result-criterion .rc-badge");
  await expect(badges).toHaveCount(count);
});
