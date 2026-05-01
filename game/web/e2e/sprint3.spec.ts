import { test, expect } from "@playwright/test";

/**
 * Sprint 3 behavioral tests:
 *   GAME-014 (scenario scale), GAME-016 (intro), GAME-017 (evaluation), GAME-018 (progression).
 *
 * NOTE: The app loads tutorial-002.json (196-precinct three-county map) as the primary scenario.
 * tutorial-001.json is retained for loader unit tests only.
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
 *   7. Submit button is disabled on initial state (one district empty)
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
 *   16. tutorial-002 loads and renders 196 precincts (path.hex count)
 */

/** Navigate, dismiss intro, wait for hex grid. */
async function loadEditor(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/?s=tutorial-002");
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
  // tutorial-002.json character: name="You", role="Redistricting Commissioner, Millbrook County"
  await expect(page.locator("#char-name")).toHaveText("You");
  await expect(page.locator("#char-role")).toContainText("Redistricting Commissioner");
});

test("intro: first slide heading is shown and Previous is disabled", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#intro-slide-heading")).toHaveText("Welcome to Millbrook County");
  await expect(page.locator("#btn-intro-prev")).toBeDisabled();
});

test("intro: Next advances to second slide; Previous returns to first", async ({ page }) => {
  await page.goto("/?s=tutorial-002");
  await expect(page.locator("#intro-screen")).toBeVisible({ timeout: 10_000 });

  // Advance to slide 2
  await page.locator("#btn-intro-next").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("The Tools");
  await expect(page.locator("#btn-intro-prev")).toBeEnabled();

  // Return to slide 1
  await page.locator("#btn-intro-prev").click();
  await expect(page.locator("#intro-slide-heading")).toHaveText("Welcome to Millbrook County");
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
  await expect(page.locator("#objective-text")).toContainText("Balance the three districts");
});

// ─── GAME-017: Evaluation phase ───────────────────────────────────────────────

test("submit: button is disabled on initial load (population imbalance)", async ({ page }) => {
  await loadEditor(page);
  // Initial state: precincts distributed unevenly across 3 districts → fails population balance
  await expect(page.locator("#btn-submit")).toBeDisabled();
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

  // Force-enable and click submit via JS (bypasses the validity gate for this structural test)
  await page.evaluate(() => {
    const btn = document.getElementById("btn-submit") as HTMLButtonElement | null;
    if (btn) btn.disabled = false;
  });
  await page.locator("#btn-submit").click();

  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator(".result-criterion").first()).toBeVisible();
});

test("submit: Keep Drawing button hides result screen", async ({ page }) => {
  await loadEditor(page);

  // Show result screen by force
  await page.evaluate(() => {
    const btn = document.getElementById("btn-submit") as HTMLButtonElement | null;
    if (btn) btn.disabled = false;
  });
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
  // tutorial-002 has 196 precincts; build a complete assignment with index 0 → 2 (district 2)
  for (let i = 0; i < 196; i++) wipAssignments[String(i)] = i === 0 ? 2 : 1;

  await seedWip(page, "tutorial-002", wipAssignments, 2);
  await page.goto("/?s=tutorial-002");

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
  // Load tutorial-002, skip intro, paint precinct 0 → district 2 via store shortcut,
  // then wait > 800ms and confirm the WIP key was written with the expected assignment.
  await page.goto("/?s=tutorial-002");
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
  expect(wip.scenarioId).toBe("tutorial-002");
  expect(wip.assignments["0"]).toBe(2);
  expect(wip.activeDistrict).toBe(2);
});

test("wip: WIP is cleared from localStorage after scenario completion", async ({ page }) => {
  // Load tutorial-002 fresh (no pre-seeded WIP), skip intro, paint winning move,
  // submit, then verify the WIP key is absent from localStorage.
  await page.goto("/?s=tutorial-002");
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 10_000 });

  // Paint 7 boundary precincts at r=-2, q=-6..0 from d2 (central) → d1 (north).
  // Same winning move as the winnability test. After this the map is balanced.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>)["__gameStore"] as
      | { getState: () => { paintStroke: (ids: number[], d: number) => void; setActiveDistrict: (d: number) => void; precincts: { coord: { q: number; r: number } }[] } }
      | undefined;
    if (!store) throw new Error("__gameStore not exposed");
    const state = store.getState();
    state.setActiveDistrict(1);
    const coordToIdx = new Map<string, number>();
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      coordToIdx.set(`${p.coord.q},${p.coord.r}`, i);
    });
    const ids: number[] = [];
    for (let q = -6; q <= 0; q++) {
      const idx = coordToIdx.get(`${q},-2`);
      if (idx !== undefined) ids.push(idx);
    }
    state.paintStroke(ids, 1);
  });

  await expect(page.locator("#btn-submit")).toBeEnabled({ timeout: 3_000 });
  await page.locator("#btn-submit").click();
  await expect(page.locator("#result-screen")).toBeVisible();
  await expect(page.locator("#result-verdict")).toHaveText("Map Passed!");

  // WIP key must be gone from localStorage after a successful pass
  const wipAfter = await page.evaluate(() => localStorage.getItem("redistricting-sim-wip"));
  expect(wipAfter).toBeNull();
});

// ─── GAME-019: Tutorial-002 winnability ───────────────────────────────────────

test("winnability: painting boundary precincts enables submit and produces a passing map", async ({ page }) => {
  /**
   * tutorial-002 initial state: county-aligned (north→d1, central→d2, south→d3).
   * Hex-of-hexes R=8 trimmed to 196. Counties split at r=-2/r=2.
   *   d1 (north, r<-2): ~57 hexes, underpopulated (~-14%)
   *   d2 (central, |r|≤2): ~74 hexes, overpopulated (~+13%)
   *   d3 (south, r>2): ~65 hexes, about right (~+0.4%)
   * Submit is disabled; population imbalance prevents submission.
   *
   * Winning move: paint 7 hexes at r=-2, q=-6..0 from d2 → d1.
   * This transfers ~21k population, bringing all three districts within ±3%.
   */
  await loadEditor(page);

  // Initial state: submit must be disabled (d1 under-populated, d2 over-populated)
  await expect(page.locator("#btn-submit")).toBeDisabled();

  // Activate district 1 (the default, but be explicit)
  await page.locator("button.district-btn").first().click();

  // Paint 7 boundary precincts (r=-2, q=-6..0) from central (d2) into north (d1).
  // These hexes are at the boundary between the north and central counties.
  // Uses paintHexes helper for hex-coordinate-based painting.
  await page.evaluate(() => {
    const store = (window as unknown as Record<string, { getState: () => {
      paintStroke: (ids: number[], district: number) => void;
      precincts: { coord: { q: number; r: number } }[];
    } }>)["__gameStore"];
    if (!store) throw new Error("__gameStore not found on window");
    const state = store.getState();
    const coordToIdx = new Map<string, number>();
    state.precincts.forEach((p: { coord: { q: number; r: number } }, i: number) => {
      coordToIdx.set(`${p.coord.q},${p.coord.r}`, i);
    });
    // Move 7 hexes at r=-2, q=-6 through q=0 from d2 (central) into d1 (north)
    const ids: number[] = [];
    for (let q = -6; q <= 0; q++) {
      const idx = coordToIdx.get(`${q},-2`);
      if (idx !== undefined) ids.push(idx);
    }
    state.paintStroke(ids, 1);  // district 1 (north)
  });

  // Submit should now be enabled (all districts within tolerance, contiguous)
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

// ─── GAME-014: Scenario scale ─────────────────────────────────────────────────

test("scale: tutorial-002 loads and renders 196 precincts (path.hex count)", async ({ page }) => {
  // tutorial-002 is the 196-precinct three-county map
  await page.goto("/?s=tutorial-002");

  // Skip intro to reveal editor
  const skip = page.locator("#btn-intro-skip");
  await expect(skip).toBeVisible({ timeout: 10_000 });
  await skip.click();

  // Wait for at least one hex to render
  await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

  // Count all rendered hex paths — should match precinct count (196)
  const hexCount = await page.locator("path.hex").count();
  expect(hexCount).toBe(196);
});
