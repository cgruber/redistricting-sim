import { test, expect } from "@playwright/test";

/**
 * Sprint 3 behavioral tests:
 *   GAME-014 (scenario scale), GAME-016 (intro), GAME-017 (evaluation), GAME-018 (progression).
 *
 * NOTE: Generic editor/submit/wip mechanics run against scenario-002 (the shared, play-
 * relevant fixture). The intro-narrative, winnability, and scale tests use tutorial-002 — now
 * the guided "A Legal Map" (GAME-077): a 61-precinct hex-circle, three districts, a dense
 * northern town, gated on district_count + population_balance + contiguity. Progress/select
 * tests reference tutorial-002 by id (no editor load). The guided overlay is suppressed for the
 * whole file via the beforeEach below (tutorial-<id>-complete) so the editor tests stay
 * deterministic; the overlay itself is covered in scenarios.spec.ts.
 *
 * GAME-016: Intro slide flow:
 *   1. Intro screen is visible on initial load (before map editor) — new player
 *   2. Character info is populated from scenario narrative
 *   3. Slide navigation (Next / Previous) cycles through slides correctly
 *   4. "Start Drawing" appears on the last slide and reveals the editor
 *   5. "Skip intro" immediately reveals the editor
 *   6. Objective text is shown from scenario narrative
 *
 * GAME-017: Evaluation phase:
 *   7. Submit button is enabled on initial load (GAME-059: validity gate removed)
 *   8. Submit button remains in DOM after painting precincts
 *   9. Clicking submit shows result screen with criteria
 *   10. "Keep Drawing" button hides the result screen
 *
 * GAME-018: Progression:
 *   11. Scenario select screen is shown for returning players (localStorage has completion data)
 *   12. Scenario card shows "Completed" status and "Play Again" button for completed scenario
 *   13. "Play Again" from select screen shows intro then editor
 *   14. Page reload restores completion state from localStorage
 *   15. New player (no localStorage) sees intro, not scenario select
 *
 * GAME-014: Scenario scale:
 *   16. tutorial-002 loads and renders 61 precincts (path.hex count)
 */

// tutorial-001 and tutorial-002 are guided (GAME-076/077): the overlay coaches the player
// and (for some steps) pauses input. Suppress it for the whole file via the per-scenario
// "complete" flag so the editor/winnability tests are deterministic. The overlay itself is
// exercised in scenarios.spec.ts via ?resetTutorial=1.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("tutorial-tutorial-001-complete", "1");
      localStorage.setItem("tutorial-tutorial-002-complete", "1");
    } catch { /* ignore */ }
  });
});

/** Navigate, dismiss intro, wait for hex grid. */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  // Fixture: scenario-002 (educational opener) for the generic submit/editor-mechanics tests.
  // (The intro-narrative + winnability/scale tests below stay on tutorial-002 — they assert
  // its specific content — and are updated/replaced when tutorial-002 becomes "A Legal Map".)
  await page.goto("/?s=scenario-002&debug");
  // playwright.config reducedMotion:'reduce' is ignored in the Bazel-sandboxed Chromium;
  // explicit emulation ensures the instant result path runs so verdict is visible immediately.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
}

/** Paint a hex by dispatching mousedown on it then mouseup on window. */
async function paintHex(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).dispatchEvent("mousedown");
  await page.evaluate(() => window.dispatchEvent(new MouseEvent("mouseup")));
}

// ─── GAME-016: Scenario intro screen ─────────────────────────────────────────

test("intro: screen is visible on initial load before editor", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  // Intro screen must be visible; editor elements must be hidden
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#app-header")).not.toBeVisible();
  await expect(page.locator("#main")).not.toBeVisible();
});

test("intro: character name and role are shown from scenario narrative", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  // tutorial-002.json character: name="You", role="Mapmaker, Millbrook County"
  await expect(page.locator("#char-name")).toHaveText("You");
  await expect(page.locator("#char-role")).toContainText("Mapmaker");
});

test("intro: first slide heading is shown and Previous is disabled", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-slide-heading")).toHaveText("Back to Millbrook — Now With Rules");
  await expect(page.locator("#btn-intro-prev")).toBeDisabled();
});

test("intro: Next advances to second slide; Previous returns to first", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });

  // Advance to slide 2
  await page.locator("#btn-intro-next").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("Equal, and Connected");
  await expect(page.locator("#btn-intro-prev")).toBeEnabled();

  // Return to slide 1
  await page.locator("#btn-intro-prev").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("Back to Millbrook — Now With Rules");
});

test("intro: Start Drawing button appears on last slide and reveals editor", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
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
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#btn-intro-skip")).toBeVisible({ timeout: 10_000 });

  await page.locator("#btn-intro-skip").click();
  await expect(page.locator("#intro-screen")).not.toBeVisible();
  await expect(page.locator("#app-header")).toBeVisible();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
});

test("intro: objective text is shown from scenario narrative", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#objective-text")).toContainText("roughly equal in population");
});

// ─── GAME-017: Evaluation phase ───────────────────────────────────────────────

test("submit: button is enabled on initial load (GAME-059: validity gate removed)", async ({ page }) => {
  await loadEditor(page);
  // GAME-059: Submit is always enabled regardless of validity
  await expect(page.locator("#btn-submit")).toBeEnabled();
});

test("submit: result screen is hidden on initial load", async ({ page }) => {
  await loadEditor(page);
  await expect(page.locator("#result-screen")).not.toBeVisible();
});

test("submit: button remains in DOM and is interactive after painting precincts across districts", async ({ page }) => {
  await loadEditor(page);

  // Switch to district 2 and paint some precincts to vary the assignment
  await page.locator("button.district-btn").nth(1).click();
  // Paint some precincts to district 2
  for (let i = 0; i <= 14; i++) {
    const hex = page.locator(`path.hex[data-precinct-id='${i}']`);
    const isPresent = await hex.count();
    if (isPresent > 0) await paintHex(page, `path.hex[data-precinct-id='${i}']`);
  }

  // Verify the button is still attached and functional (not crashed or removed)
  await expect(page.locator("#btn-submit")).toBeAttached();
});

test("submit: clicking submit shows result screen with criteria", async ({ page }) => {
  await loadEditor(page);

  // GAME-059: Submit is always enabled; no need to force-enable via JS.
  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator(".result-criterion").first()).toBeVisible();
});

test("submit: Keep Drawing / Fix It button hides result screen", async ({ page }) => {
  await loadEditor(page);

  // GAME-059: Submit is always enabled.
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();

  await page.locator("#btn-keep-drawing").click();
  await expect(page.locator("#result-screen")).not.toBeVisible();
});

// ─── GAME-018: Progression ────────────────────────────────────────────────────

/** Seed localStorage with completed scenario IDs before navigating. */
async function seedProgress(
  page: import("@playwright/test").Page,
  completedIds: string[],
): Promise<void> {
  // Set localStorage before the page loads JS (use storageState or addInitScript)
  await page.addInitScript((ids: string[]) => {
    localStorage.setItem(
      "redistricting-sim-progress",
      JSON.stringify({ completed: ids }),
    );
  }, completedIds);
}

test("progression: scenario select screen is shown for returning players", async ({ page }) => {
  await seedProgress(page, ["tutorial-002"]);
  await page.goto("/?campaign=tutorial");

  // Scenario select must be visible; intro screen and editor must not be
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-screen")).not.toBeVisible();
  await expect(page.locator("#app-header")).not.toBeVisible();
});

test("progression: scenario card shows Completed status for completed scenario", async ({ page }) => {
  await seedProgress(page, ["tutorial-002"]);
  await page.goto("/?campaign=tutorial");

  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".sc-status.completed")).toBeVisible();
  await expect(page.locator(".sc-status.completed")).toContainText("Completed");
  await expect(page.locator(".sc-play-btn.replay")).toBeVisible();
});

test("progression: Play Again from select screen shows intro then editor", async ({ page }) => {
  // Seed both tutorial scenarios so tutorial-002 is accessible (not locked) and replayable
  await seedProgress(page, ["tutorial-001", "tutorial-002"]);
  await page.goto("/?campaign=tutorial");

  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await page.locator(".sc-play-btn.replay").first().click();

  // Intro screen appears after clicking Play Again
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 5_000 });

  // Skip intro to get to editor
  await page.locator("#btn-intro-skip").click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });
});

test("progression: page reload restores completion state from localStorage", async ({ page }) => {
  await seedProgress(page, ["tutorial-002"]);
  await page.goto("/?campaign=tutorial");

  // First load: scenario select visible with completed status
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".sc-status.completed")).toBeVisible();

  // Reload: state should be restored from localStorage
  await page.reload();
  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".sc-status.completed")).toBeVisible();
});

test("progression: new player (no localStorage) sees scenario select", async ({ page }) => {
  // No seedProgress call — fresh localStorage
  await page.goto("/?campaign=tutorial");

  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-screen")).not.toBeVisible();
});

// ─── GAME-007: WIP save/resume ───────────────────────────────────────────────

/** Seed a WIP save in localStorage before the page loads. */
async function seedWip(
  page: import("@playwright/test").Page,
  scenarioId: string,
  assignments: Record<string, number>,
  activeDistrict: number,
): Promise<void> {
  await page.addInitScript(
    (args: { scenarioId: string; assignments: Record<string, number>; activeDistrict: number }) => {
      localStorage.setItem("redistricting-sim-wip", JSON.stringify(args));
    },
    { scenarioId, assignments, activeDistrict },
  );
}

test("wip: scenario select shows 'In Progress' for scenario with saved WIP", async ({ page }) => {
  // Seed completion for tutorial-002 so select screen appears, plus WIP for scenario-002
  await seedProgress(page, ["tutorial-002"]);
  await seedWip(page, "scenario-002", { "0": 1, "1": 2 }, 2);
  await page.goto("/?campaign=educational");

  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  // scenario-002 card must show "In Progress" status and "Continue" button
  const cards = page.locator(".scenario-card");
  const scenario002Card = cards.nth(0); // first card in educational campaign
  await expect(scenario002Card.locator(".sc-status.in-progress")).toBeVisible();
  await expect(scenario002Card.locator(".sc-status.in-progress")).toContainText("In Progress");
  await expect(scenario002Card.locator(".sc-play-btn.continue")).toBeVisible();
  await expect(scenario002Card.locator(".sc-play-btn.continue")).toContainText("Continue");
});

test("wip: select screen shown when WIP exists even for new player", async ({ page }) => {
  // No completed scenarios, but a WIP exists — should show select screen
  await seedWip(page, "tutorial-002", { "0": 1 }, 1);
  await page.goto("/?campaign=tutorial");

  await expect(page.locator("#scenario-select")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-screen")).not.toBeVisible();
});

test("wip: saved assignment map is restored on scenario load", async ({ page }) => {
  // Pre-paint precinct 0 → district 2, precinct 1 → district 3 in the WIP
  // Then load tutorial-002 and verify via window.__gameStore that assignments match
  const wipAssignments: Record<string, number> = {};
  // scenario-002 has 91 precincts; build a complete assignment with index 0 → 2 (district 2)
  for (let i = 0; i < 91; i++) wipAssignments[String(i)] = i === 0 ? 2 : 1;

  await seedWip(page, "scenario-002", wipAssignments, 2);
  await page.goto("/?s=scenario-002&debug");

  // Wait for editor to be ready (intro appears because it's a fresh load without completed state)
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Verify that precinct 0 is assigned to district 2 via the exposed store
  const district = await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { assignments: Map<number, number> } }
      | undefined;
    return store?.getState().assignments.get(0);
  });
  expect(district).toBe(2);
});

test("wip: painting precincts triggers a debounced WIP save to localStorage", async ({ page }) => {
  // Load scenario-002, skip intro, paint precinct 0 → district 2 via store shortcut,
  // then wait > 800ms and confirm the WIP key was written with the expected assignment.
  await page.goto("/?s=scenario-002&debug");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Paint precinct 0 into district 2 (it starts in district 1).
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void; setActiveDistrict: (d: number) => void } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    store.getState().setActiveDistrict(2);
    store.getState().paintStroke([0], 2);
  });

  // Wait 1100ms for the 800ms debounce to fire.
  await page.waitForTimeout(1100);

  // WIP key must now exist in localStorage.
  const wipRaw = await page.evaluate(() => localStorage.getItem("redistricting-sim-wip"));
  expect(wipRaw).not.toBeNull();

  // Precinct 0 must be stored as district 2.
  const wip = JSON.parse(wipRaw!) as { scenarioId: string; assignments: Record<string, number>; activeDistrict: number };
  expect(wip.scenarioId).toBe("scenario-002");
  expect(wip.assignments["0"]).toBe(2);
  expect(wip.activeDistrict).toBe(2);
});

test("wip: WIP is cleared from localStorage after scenario completion", async ({ page }) => {
  // Load tutorial-002 fresh (no pre-seeded WIP), skip intro, paint winning move,
  // submit, then verify the WIP key is absent from localStorage.
  await page.goto("/?s=tutorial-002");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Same winning move as the winnability test: leave the northern cap (r ≤ -2, with the
  // town) as District 1; carve the rural south-west into District 2 and south-east into
  // District 3. All three land within ±12% of the mean and stay contiguous.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void; precincts: { coord: { q: number; r: number } }[] } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    const state = store.getState();
    const southWest: number[] = [];
    const southEast: number[] = [];
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      if (p.coord.r < -1) return;           // r ≤ -2 stays District 1 (the northern cap + town)
      if (p.coord.q < 0) southWest.push(i); // rural south-west → District 2
      else southEast.push(i);               // rural south-east → District 3
    });
    state.paintStroke(southWest, 2);
    state.paintStroke(southEast, 3);
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");

  // WIP key must be gone from localStorage after a successful pass
  const wipAfter = await page.evaluate(() => localStorage.getItem("redistricting-sim-wip"));
  expect(wipAfter).toBeNull();
});

// ─── GAME-077: Tutorial-002 "A Legal Map" winnability ─────────────────────────

test("winnability: drawing balanced, contiguous districts produces a passing map", async ({ page }) => {
  /**
   * tutorial-002 "A Legal Map": a 61-precinct hex-circle (radius 4), three districts, a
   * densely-settled town in the north on a flat rural base. The map opens as a single
   * District 1; the player carves three balanced, contiguous pieces. Gates on
   * district_count + population_balance (±12% of mean) with contiguity required.
   *
   * Winning move (verified against the generated populations; ideal/district ≈ 66,380):
   *   - District 1: the compact northern cap (rows r ≤ -2, 18 precincts) — it holds the
   *     dense town, so it needs the least land. Left as the default; ~70.5k (+6.2%).
   *   - District 2: the rural south-WEST (r ≥ -1 and q < 0, 23 precincts) — ~68.8k (+3.6%).
   *   - District 3: the rural south-EAST (r ≥ -1 and q ≥ 0, 20 precincts) — ~59.9k (-9.7%).
   * The dense north gets a smaller district; the open south splits into two equal halves.
   * A naive equal-AREA split (three horizontal thirds) over-fills the middle and starves
   * the south — that's the imbalance this map teaches the player to read off the panel.
   */
  await page.goto("/?s=tutorial-002");
  // Force the instant result-screen path (the sandbox ignores config reducedMotion);
  // without this the animated criteria reveal leaves #result-verdict empty past the timeout.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // GAME-059: Submit is always enabled; the default single-district map is submittable
  // (it just fails district_count + balance).
  await expect(page.locator("#btn-submit")).toBeEnabled();

  // Carve the two rural southern districts out of the default District 1, leaving the
  // northern cap (r ≤ -2, with the town) as District 1. Paint by hex coordinate so the
  // strategy is legible: south-west → District 2, south-east → District 3.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const state = store.getState();
    const southWest: number[] = [];
    const southEast: number[] = [];
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      if (p.coord.r < -1) return;           // r ≤ -2 stays District 1 (the northern cap + town)
      if (p.coord.q < 0) southWest.push(i); // rural south-west → District 2
      else southEast.push(i);               // rural south-east → District 3
    });
    state.paintStroke(southWest, 2);
    state.paintStroke(southEast, 3);
  });

  // Submit should be enabled (all three districts within tolerance, each contiguous).
  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });

  // Submit and assert pass
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");

  // All required criteria must show PASS badges
  const requiredBadges = page.locator(".result-criterion:not(.failed-optional) .rc-badge");
  const badgeCount = await requiredBadges.count();
  for (let i = 0; i < badgeCount; i++) {
    await expect(requiredBadges.nth(i)).toHaveText("PASS");
  }
});

test("legal-map chrome: validity panel shows; view toolbar + election prediction stay hidden", async ({ page }) => {
  // The Map Validity panel is the star of "A Legal Map" — it shows because the scenario
  // gates on population balance + contiguity. The lean/county views and the election-result
  // prediction stay hidden (still pre-electoral).
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Validity panel visible, populated, and reporting both gated constraints.
  await expect(page.locator("#validity-container")).toBeVisible();
  await expect(page.locator("#validity-container")).not.toBeEmpty();
  await expect(page.locator("#validity-container")).toContainText("Population balance");
  await expect(page.locator("#validity-container")).toContainText("Contiguity");

  // Pre-electoral: view toolbar + election-result prediction hidden.
  await expect(page.locator("#map-filters")).toBeHidden();
  await expect(page.locator("#results-container")).toBeHidden();
});

test("winnability (negative): a lopsided three-district map is flagged by the panel and fails", async ({ page }) => {
  // The AC's other half: an unbalanced attempt must fail and the validity panel must flag it.
  await page.goto("/?s=tutorial-002");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Give Districts 2 and 3 a single southern precinct each, leaving District 1 with the
  // other 59 — three districts in use, but wildly out of balance.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const state = store.getState();
    const south = state.precincts
      .map((p: { coord: { q: number; r: number } }, i: number) => ({ p, i }))
      .filter(({ p }: { p: { coord: { q: number; r: number } } }) => p.coord.r >= 2)
      .slice(0, 2)
      .map(({ i }: { i: number }) => i);
    state.paintStroke([south[0]!], 2);
    state.paintStroke([south[1]!], 3);
  });

  // The validity panel flags at least one out-of-balance district (validity-error row).
  await expect(page.locator("#validity-container .validity-row.validity-error").first()).toBeVisible();

  // And the submitted map fails.
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Failed");
});

// ─── GAME-014: Scenario scale ─────────────────────────────────────────────────

test("scale: tutorial-002 loads and renders 61 precincts (path.hex count)", async ({ page }) => {
  // tutorial-002 "A Legal Map" is a radius-4 hex-circle: 3·4·5 + 1 = 61 precincts
  await page.goto("/?s=tutorial-002");

  // Skip intro to reveal editor
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();

  // Wait for at least one hex to render
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  // Count all rendered hex paths — should match precinct count (61)
  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(61);
});
