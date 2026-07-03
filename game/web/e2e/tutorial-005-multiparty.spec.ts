/**
 * GAME-112 PR 2: smoke test for the debug-only 3-party demo (tutorial-005).
 *
 * Guards the multiparty RENDER paths against a crash-on-load: the scenario loads
 * with three parties (Ken / Ryu / the Independent Ada Hollis), and switching to the
 * Lean view exercises the 3+-party plurality-coloring branch in the map renderer.
 * Full visual review (the gold stronghold, the all-party result card) is a manual
 * serve-local eyeball. tutorial-005 is debug-gated, so &debug is required to reach it.
 */

import { expect, test } from "@playwright/test";

test("tutorial-005 (3-party demo): loads and the Lean view renders without error", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(String(e)));

	// tutorial-005 is campaign-only (GAME-115) — reachable via the debug campaign
	// context, not the plain ?s= manifest. &debug bypasses the scenario lock gate.
	await page.goto("/?s=tutorial-005&campaign=debug&debug");
	await page.emulateMedia({ reducedMotion: "reduce" });

	const skip = page.locator("#btn-intro-skip");
	await expect(skip).toBeVisible({ timeout: 15_000 });
	await skip.click();

	// The hex grid renders (scenario loaded, three-party data parsed).
	await expect(page.locator("path.hex").first()).toBeVisible({ timeout: 15_000 });

	// Switch to the Lean view → exercises the 3+-party plurality-coloring path
	// (each precinct painted its plurality party's color) in the map renderer.
	await page.locator("#filter-lean").click();
	await expect(page.locator("path.hex").first()).toBeVisible();

	expect(errors, `page errors during 3-party render: ${errors.join("; ")}`).toHaveLength(0);
});
