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
  // Explicit emulation needed: playwright.config reducedMotion:'reduce' is ignored in the
  // Bazel-sandboxed Chromium, so window.matchMedia() returns false and the animated path
  // runs. With ROW_CHAIN_MS=2550ms and multiple rows, animated path exceeds the 10s test
  // timeout. Calling emulateMedia here ensures the instant (non-animated) path runs.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    const btn = document.getElementById("btn-submit") as HTMLButtonElement | null;
    if (btn) btn.disabled = false;
  });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
}

// ─── GAME-052: Animated criteria reveal ──────────────────────────────────────
// GAME-066 supersedes the 120ms stagger: reduced-motion mode (global default) renders
// all rows in final state immediately; animated mode uses sequential JS reveal instead.

test("GAME-052: criterion rows all visible immediately in reduced-motion mode", async ({ page }) => {
  // Global playwright config sets reducedMotion:'reduce' — sequential reveal is bypassed.
  await loadEditor(page);
  await openResultScreen(page);

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  // All rows finalized immediately — no rc-pending class.
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i)).toBeVisible();
    await expect(rows.nth(i)).not.toHaveClass(/rc-pending/);
  }
});

// GAME-068: skip is now a dedicated button, not click-anywhere.
// In reduced-motion mode (global default) all rows are already final at open — no skip needed.
test("GAME-052: all rows in final state immediately in reduced-motion mode", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i)).toBeVisible();
    await expect(rows.nth(i)).not.toHaveClass(/rc-pending/);
  }

  // Skip button not shown in reduced-motion path.
  await expect(page.locator("#result-reveal-controls")).toBeHidden();
});

// GAME-069: per-row character slots replace the top-level #result-reaction block.
test("GAME-069: every criterion row has a character slot (.rc-char)", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).locator(".rc-char")).toBeVisible();
  }
});

// GAME-069 / GAME-062: non-governor criterion rows show SVG placeholder checkmarks/X marks
// until sprite offsets for each type are measured and wired (GAME-062 sprite wiring pending).
test("GAME-069: non-governor criterion rows contain a placeholder SVG", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  // Governor row has a sprite; all other rows render charPlaceholderSvg() via innerHTML.
  // Check that at least one .rc-char slot contains an svg element.
  const svgSlots = page.locator(".rc-char svg");
  const count = await svgSlots.count();
  expect(count).toBeGreaterThan(0);
});

// GAME-069: in reduced-motion mode (global Playwright default), rows are built with final=true
// so .rc-char-verdict elements are immediately set to opacity "1".
test("GAME-069: reduced-motion path sets all rc-char-verdict elements to opacity 1", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  // Reduced-motion is the global default; all verdict slots must be fully visible immediately.
  const verdicts = page.locator(".rc-char-verdict");
  const count = await verdicts.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(verdicts.nth(i)).toHaveCSS("opacity", "1");
  }
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
