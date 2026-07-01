/**
 * Unit tests for the campaign data model (GAME-047).
 *
 * Run via Bazel:
 *   bazel test //web/src/model:campaigns_test
 */

// ─── localStorage shim (must precede import of campaigns.ts) ─────────────────

const _store: Map<string, string> = new Map();

const localStorageShim = {
	getItem(key: string): string | null {
		return _store.get(key) ?? null;
	},
	setItem(key: string, value: string): void {
		_store.set(key, value);
	},
	removeItem(key: string): void {
		_store.delete(key);
	},
	clear(): void {
		_store.clear();
	},
};

(globalThis as unknown as Record<string, unknown>)["localStorage"] = localStorageShim;

// ─── Imports ─────────────────────────────────────────────────────────────────

import {
	CAMPAIGN_REGISTRY,
	getCampaign,
	saveLastPlayedScenario,
	loadLastPlayedScenario,
	visibleCampaigns,
} from "./campaigns.js";
import { test, assertEqual, assertNull, assertNotNull, summarize } from "../testing/test_runner.js";

function resetStorage(): void {
	_store.clear();
}

// ─── CAMPAIGN_REGISTRY ────────────────────────────────────────────────────────

test("CAMPAIGN_REGISTRY contains 3 campaigns (tutorial, educational, debug)", () => {
	assertEqual(CAMPAIGN_REGISTRY.length, 3, "registry length");
});

test("CAMPAIGN_REGISTRY: first campaign is tutorial", () => {
	assertEqual(CAMPAIGN_REGISTRY[0]?.id, "tutorial", "first id");
});

test("tutorial campaign has exactly 4 scenario IDs", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds.length, 4, "tutorial scenarioIds length");
});

test("tutorial campaign scenarioIds are tutorial-001 through tutorial-004", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds.length, 4, "four tutorial scenarios");
	assertEqual(tutorial!.scenarioIds[0], "tutorial-001", "first scenario");
	assertEqual(tutorial!.scenarioIds[1], "tutorial-002", "second scenario");
	assertEqual(tutorial!.scenarioIds[2], "tutorial-003", "third scenario (Reading the Vote)");
	assertEqual(tutorial!.scenarioIds[3], "tutorial-004", "fourth scenario (Capstone)");
});

test("educational campaign has exactly 8 scenario IDs", () => {
	const edu = getCampaign("educational");
	assertNotNull(edu, "educational exists");
	assertEqual(edu!.scenarioIds.length, 8, "educational scenarioIds length");
});

test("educational campaign starts with scenario-002", () => {
	const edu = getCampaign("educational");
	assertNotNull(edu, "educational exists");
	assertEqual(edu!.scenarioIds[0], "scenario-002", "first scenario");
});

test("educational campaign ends with scenario-009", () => {
	const edu = getCampaign("educational");
	assertNotNull(edu, "educational exists");
	assertEqual(edu!.scenarioIds[edu!.scenarioIds.length - 1], "scenario-009", "last scenario");
});

// ─── debugOnly gating (GAME-115) ────────────────────────────────────────────

test("debug campaign is flagged debugOnly", () => {
	const debug = getCampaign("debug");
	assertNotNull(debug, "debug campaign exists");
	assertEqual(debug!.debugOnly, true, "debugOnly true");
});

test("tutorial and educational campaigns are not debugOnly", () => {
	assertEqual(getCampaign("tutorial")!.debugOnly, undefined, "tutorial not debugOnly");
	assertEqual(getCampaign("educational")!.debugOnly, undefined, "educational not debugOnly");
});

test("visibleCampaigns(false) hides the debug campaign", () => {
	const visible = visibleCampaigns(false);
	assertEqual(visible.length, 2, "two campaigns without debug");
	assertEqual(
		visible.some((c) => c.id === "debug"),
		false,
		"debug campaign absent",
	);
});

test("visibleCampaigns(true) includes the debug campaign", () => {
	const visible = visibleCampaigns(true);
	assertEqual(visible.length, 3, "three campaigns with debug");
	assertEqual(
		visible.some((c) => c.id === "debug"),
		true,
		"debug campaign present",
	);
});

test("visibleCampaigns always includes non-debug campaigns", () => {
	for (const isDebug of [false, true]) {
		const ids = visibleCampaigns(isDebug).map((c) => c.id);
		assertEqual(ids.includes("tutorial"), true, "tutorial visible");
		assertEqual(ids.includes("educational"), true, "educational visible");
	}
});

// ─── getCampaign ──────────────────────────────────────────────────────────────

test("getCampaign('tutorial') returns the tutorial campaign", () => {
	const c = getCampaign("tutorial");
	assertNotNull(c, "returns non-null");
	assertEqual(c!.id, "tutorial", "id matches");
});

test("getCampaign('educational') returns the educational campaign", () => {
	const c = getCampaign("educational");
	assertNotNull(c, "returns non-null");
	assertEqual(c!.id, "educational", "id matches");
});

test("getCampaign with unknown id returns undefined", () => {
	assertEqual(getCampaign("nonexistent"), undefined, "undefined for unknown id");
});

// ─── saveLastPlayedScenario / loadLastPlayedScenario ─────────────────────────

test("loadLastPlayedScenario returns null when nothing stored", () => {
	resetStorage();
	assertNull(loadLastPlayedScenario(), "null on empty storage");
});

test("saveLastPlayedScenario + loadLastPlayedScenario round-trips scenario id", () => {
	resetStorage();
	saveLastPlayedScenario("scenario-004");
	const loaded = loadLastPlayedScenario();
	assertEqual(loaded, "scenario-004", "round-trip");
});

test("saveLastPlayedScenario overwrites previous value", () => {
	resetStorage();
	saveLastPlayedScenario("scenario-002");
	saveLastPlayedScenario("tutorial-001");
	assertEqual(loadLastPlayedScenario(), "tutorial-001", "latest wins");
});

summarize();
