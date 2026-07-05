/**
 * GAME-118 PR 2: home-base independent map surfaces (home pin + party-only note).
 *
 * tutorial-005 ships a third party (the Chun-Li Party) in party slot 2 (index 2). Here we
 * intercept its JSON and flag that party as a home-base independent — `independent` + a
 * `home` precinct — so GAME-118's render paths light up without waiting on GAME-121's
 * authored independent tutorial. (This is a FIXTURE use of tutorial-005: it just needs a
 * 3-party scenario to patch; the slot-2 party's name is whatever tutorial-005 declares.)
 * Asserts the "⌂ name" pin renders at the home precinct and
 * that, once districts are drawn, a non-home district's result card marks the independent
 * "(not on ballot)" with the explanatory footnote. Full visual polish is a serve-local
 * eyeball. &debug reaches the gated debug campaign (as in tutorial-005-multiparty.spec).
 */

import { expect, test } from "@playwright/test";

test("home-base independent: ⌂ pin renders and a non-home district reads party-only", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(String(e)));

	// tutorial-005 now ships a guided coach overlay (GAME-120: the TUTORIAL_005 script). Its
	// scrim intercepts pointer events, which would block the hover assertions below. Suppress it
	// via the per-scenario "complete" flag (same mechanism as tutorial-005-multiparty.spec) — this
	// test exercises GAME-118's independent render paths, not the coach.
	await page.addInitScript(() => {
		try {
			localStorage.setItem("tutorial-tutorial-005-complete", "1");
		} catch {
			/* ignore */
		}
	});

	// Patch tutorial-005 in flight: promote the slot-2 party (the Chun-Li Party) to a home-base
	// independent homed at the first precinct. The route must be registered before navigation.
	await page.route("**/scenarios/tutorial-005.json", async (route) => {
		const response = await route.fetch();
		const scenario = await response.json();
		const independent = scenario.parties[2];
		independent.independent = true;
		independent.home = {
			q: scenario.precincts[0].position.q,
			r: scenario.precincts[0].position.r,
		};
		await route.fulfill({ json: scenario });
	});

	await page.goto("/?s=tutorial-005&campaign=debug&debug");
	await page.emulateMedia({ reducedMotion: "reduce" });

	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();

	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

	// The home pin renders on load (no districting needed) — "⌂ <independent name>" at the
	// home precinct. Its presence proves the map renderer's home-pin path (mapRenderer.ts).
	const pin = page.locator("text.home-pin");
	await expect(pin).toHaveCount(1);
	await expect(pin).toContainText("⌂");
	await expect(pin).toContainText("Chun-Li Party");

	// Draw districts so result cards appear: the home precinct (index 0) alone in D1, every
	// other precinct in D2. D1 holds the independent's home; D2 is a party-only race.
	await page.evaluate(() => {
		const store = (
			window as unknown as {
				__gameStore?: {
					getState: () => {
						precincts: unknown[];
						paintStroke: (ids: number[], district: number) => void;
					};
				};
			}
		).__gameStore;
		if (!store) throw new Error("__gameStore not found on window");
		const state = store.getState();
		const others: number[] = [];
		for (let i = 1; i < state.precincts.length; i++) others.push(i);
		state.paintStroke([0], 1);
		state.paintStroke(others, 2);
	});

	// The non-home district (D2) shows the independent's map-wide lean but marks it off-ballot,
	// and a one-time footnote explains the ⌂ pin (renderResults, panels.ts). Exactly one card —
	// the home district (D1) lists the independent as a contender, not off-ballot.
	await expect(page.locator(".result-district").filter({ hasText: "(not on ballot)" })).toHaveCount(
		1,
	);
	// The home district (D1) lists the independent as a contender, marked ⌂ — not off-ballot. Only
	// D1's card carries ⌂: the map pin's ⌂ lives in text.home-pin, the legend's in .results-footnote,
	// so filtering .result-district by ⌂ isolates the home-contender branch (panels.ts).
	await expect(page.locator(".result-district").filter({ hasText: "⌂" })).toHaveCount(1);
	await expect(page.locator(".results-footnote")).toContainText("home district");

	// The precinct info panel reads lean ≠ ballot too (mapRenderer.ts): hovering a non-home precinct
	// (D2) shows the independent's map-wide lean flagged "(not on ballot)"; hovering the home precinct
	// (D1) marks it ⌂. data-precinct-id is the precinct index (0 = home precinct, painted into D1).
	await page.locator('path.hex[data-precinct-id="1"]').hover();
	await expect(page.locator("#precinct-info")).toContainText("(not on ballot)");
	await page.locator('path.hex[data-precinct-id="0"]').hover();
	await expect(page.locator("#precinct-info")).toContainText("⌂");

	expect(errors, `page errors on the independent render path: ${errors.join("; ")}`).toHaveLength(
		0,
	);
});
