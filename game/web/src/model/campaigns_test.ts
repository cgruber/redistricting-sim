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
} from "./campaigns.js";
import {
	test,
	assertEqual,
	assertNull,
	assertNotNull,
	summarize,
} from "../testing/test_runner.js";

function resetStorage(): void {
	_store.clear();
}

// ─── CAMPAIGN_REGISTRY ────────────────────────────────────────────────────────

test("CAMPAIGN_REGISTRY contains exactly 2 campaigns", () => {
	assertEqual(CAMPAIGN_REGISTRY.length, 2, "registry length");
});

test("CAMPAIGN_REGISTRY: first campaign is tutorial", () => {
	assertEqual(CAMPAIGN_REGISTRY[0]?.id, "tutorial", "first id");
});

test("tutorial campaign has exactly 2 scenario IDs", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds.length, 2, "tutorial scenarioIds length");
});

test("tutorial campaign scenarioIds are tutorial-001 and tutorial-002", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds[0], "tutorial-001", "first scenario");
	assertEqual(tutorial!.scenarioIds[1], "tutorial-002", "second scenario");
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
