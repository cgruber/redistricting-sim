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
	type Campaign,
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

test("CAMPAIGN_REGISTRY contains 2 campaigns (tutorial, educational)", () => {
	assertEqual(CAMPAIGN_REGISTRY.length, 2, "registry length");
});

test("CAMPAIGN_REGISTRY: first campaign is tutorial", () => {
	assertEqual(CAMPAIGN_REGISTRY[0]?.id, "tutorial", "first id");
});

test("tutorial campaign has exactly 6 scenario IDs", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds.length, 6, "tutorial scenarioIds length");
});

test("tutorial campaign scenarioIds are tutorial-001 through tutorial-006", () => {
	const tutorial = getCampaign("tutorial");
	assertNotNull(tutorial, "tutorial exists");
	assertEqual(tutorial!.scenarioIds.length, 6, "six tutorial scenarios");
	assertEqual(tutorial!.scenarioIds[0], "tutorial-001", "first scenario (core loop)");
	assertEqual(tutorial!.scenarioIds[1], "tutorial-002", "second scenario (legal map)");
	assertEqual(tutorial!.scenarioIds[2], "tutorial-003", "third scenario (reading the vote)");
	assertEqual(tutorial!.scenarioIds[3], "tutorial-004", "fourth scenario (synthesis)");
	assertEqual(tutorial!.scenarioIds[4], "tutorial-005", "fifth scenario (multi-party leans)");
	assertEqual(tutorial!.scenarioIds[5], "tutorial-006", "sixth scenario (independent)");
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
// No SHIPPED campaign sets debugOnly since GAME-121 promoted the multi-party + independent demos
// into the public tutorial. The flag + visibleCampaigns filter are retained (dormant), so the
// gating is exercised here against a synthetic fixture registry via the injectable `registry` arg.

const FIXTURE_REGISTRY: Campaign[] = [
	{ id: "public-a", title: "A", description: "", scenarioIds: [] },
	{ id: "gated", title: "G", description: "", scenarioIds: [], debugOnly: true },
	{ id: "public-b", title: "B", description: "", scenarioIds: [] },
];

test("no shipped campaign is debugOnly", () => {
	assertEqual(
		CAMPAIGN_REGISTRY.some((c) => c.debugOnly === true),
		false,
		"no debugOnly campaign ships",
	);
});

test("tutorial and educational campaigns are not debugOnly", () => {
	assertEqual(getCampaign("tutorial")!.debugOnly, undefined, "tutorial not debugOnly");
	assertEqual(getCampaign("educational")!.debugOnly, undefined, "educational not debugOnly");
});

test("visibleCampaigns(false, fixture) hides the debugOnly campaign", () => {
	const visible = visibleCampaigns(false, FIXTURE_REGISTRY);
	assertEqual(visible.length, 2, "two public campaigns without debug");
	assertEqual(
		visible.some((c) => c.id === "gated"),
		false,
		"gated campaign absent",
	);
});

test("visibleCampaigns(true, fixture) includes the debugOnly campaign", () => {
	const visible = visibleCampaigns(true, FIXTURE_REGISTRY);
	assertEqual(visible.length, 3, "all three campaigns with debug");
	assertEqual(
		visible.some((c) => c.id === "gated"),
		true,
		"gated campaign present",
	);
});

test("visibleCampaigns (default registry) shows every shipped campaign in both modes", () => {
	for (const isDebug of [false, true]) {
		const ids = visibleCampaigns(isDebug).map((c) => c.id);
		assertEqual(ids.includes("tutorial"), true, "tutorial visible");
		assertEqual(ids.includes("educational"), true, "educational visible");
		assertEqual(ids.length, CAMPAIGN_REGISTRY.length, "no campaign hidden (none debugOnly)");
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
