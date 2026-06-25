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

/** Navigate, dismiss intro, wait for hex grid. Fixture: scenario-002 (educational opener). */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?s=scenario-002&debug");
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

// GAME-062: commissioner rows use real sprite sheets (not placeholder SVG) after wiring.
// scenario-002 has commissioner criteria with demo "bf".
test("GAME-062: commissioner criterion rows render a character sprite", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  // All criterion rows with data-char-type="commissioner" must have a .character-sprite child.
  const commRows = page.locator('.result-criterion[data-char-type="commissioner"]');
  const count = await commRows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    // Neutral state: .rc-char-neutral holds the sprite
    const sprite = commRows.nth(i).locator(".rc-char-neutral .character-sprite");
    await expect(sprite).toBeVisible();
    await expect(sprite).toHaveAttribute("aria-label", "Character awaiting verdict");
  }
});

// GAME-062: verdict sprite aria-label reflects evaluation outcome.
// In reduced-motion mode all verdict elements are already shown (opacity 1).
test("GAME-062: verdict sprite aria-label reflects pass/fail outcome", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page);

  // All rows have a verdict sprite; aria-label must be "Approves" or "Disapproves".
  const rows = page.locator(".result-criterion");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const verdictSprite = rows.nth(i).locator(".rc-char-verdict .character-sprite");
    if (await verdictSprite.count() === 0) continue; // governor row uses same pattern; covered
    const label = await verdictSprite.getAttribute("aria-label");
    expect(["Approves", "Disapproves"]).toContain(label);
  }
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

// ─── GAME-073: deferred success banner + star count reveal ───────────────────

// Reduced-motion path: failure banner shows immediately (map unsolved = failing).
test("GAME-073: failure banner shown immediately in reduced-motion mode", async ({ page }) => {
  await loadEditor(page);
  await openResultScreen(page); // already emulates reducedMotion:'reduce'
  // scenario-002 default map has required-failing criteria.
  await expect(page.locator("#result-verdict")).toHaveText("Map Failed");
  await expect(page.locator("#result-stars")).toBeHidden();
});

// Reduced-motion path: success banner + stars shown immediately on a force-win.
test("GAME-073: success banner and stars shown immediately in reduced-motion mode (force-win)", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-debug-win").click();
  await expect(page.locator("#result-screen")).toBeVisible({ timeout: 10_000 });

  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  await expect(page.locator("#result-stars")).toBeVisible();
  // scenario-002: 3 required + 1 optional → max 2 stars; force-win passes all → 2 stars
  const starCount = await page.locator("#result-stars .result-star").count();
  expect(starCount).toBe(2);
});

// Animated path: verdict starts empty, skip button reveals it with stars.
test("GAME-073: skip reveals verdict and stars (animated mode, force-win)", async ({ page }) => {
  await page.goto("/?s=scenario-002&debug");
  // Do NOT emulate reduced-motion — use animated path.
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-debug-win").click();
  await expect(page.locator("#result-screen")).toBeVisible({ timeout: 10_000 });

  // Verdict starts empty before any row resolves.
  await expect(page.locator("#result-verdict")).toHaveText("");

  // Skip → all rows finalized → success banner appears.
  await page.locator("#btn-reveal-skip").click();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");
  await expect(page.locator("#result-stars")).toBeVisible();
});
