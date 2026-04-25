import { test, expect } from "@playwright/test";

/**
 * Smoke test — Phase 1 (CI-002).
 *
 * Verifies that the spike app loads and the hex map SVG renders with at least
 * one hex precinct path. This is the regression baseline for sprint demos.
 *
 * Note: The app loads WASM asynchronously before injecting bundle.js.
 * We wait for #map-svg to contain child elements rather than a fixed delay.
 */
test("app loads and renders hex map", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(`[pageerror] ${err.message}`);
  });

  await page.goto("/");

  // Wait for the SVG to be present (it is static in the HTML)
  const svg = page.locator("#map-svg");
  await expect(svg).toBeVisible();

  // Wait for at least one hex path to appear — the renderer populates these
  // after the store initialises with generated precinct data.
  const hexPath = svg.locator("path.hex").first();
  await expect(hexPath).toBeVisible({ timeout: 10_000 });

  // Confirm multiple hex cells rendered (not just 1 — sanity check)
  const hexCount = await svg.locator("path.hex").count();
  expect(hexCount).toBeGreaterThan(1);

  // No uncaught console errors during load
  expect(consoleErrors).toHaveLength(0);
});
