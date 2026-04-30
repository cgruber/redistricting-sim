/**
 * Unit tests for WIP persistence (GAME-036): saveWip, loadWip, clearWip.
 *
 * Uses the shared TAP runner. Run via Bazel:
 *   bazel test //web/src/model:progress_wip_test
 *
 * localStorage is not available in Node. An in-memory shim is installed on
 * globalThis before the module under test is imported, so the WIP functions
 * hit the shim rather than a missing global.
 *
 * Coverage:
 *   saveWip / loadWip:
 *     - save then load: round-trips WipState correctly
 *     - assignments map and activeDistrict preserved
 *   loadWip:
 *     - missing key: returns null
 *     - malformed JSON: returns null
 *     - object missing required fields: returns null
 *     - scenarioId wrong type: returns null
 *     - activeDistrict wrong type: returns null
 *   clearWip:
 *     - clears after save: loadWip returns null
 *     - clear with nothing stored: no error
 */

// ─── localStorage shim (must be set up before importing progress.ts) ─────────

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

// ─── Imports (after shim is installed) ───────────────────────────────────────

import { saveWip, loadWip, clearWip, type WipState } from "./progress.js";
import { test, assertEqual, assertNull, assertNotNull, summarize } from "../testing/test_runner.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

function resetStorage(): void {
	_store.clear();
}

function makeWip(overrides: Partial<WipState> = {}): WipState {
	return {
		scenarioId: "tutorial-001",
		assignments: { "0": 1, "1": 2, "2": 1 },
		activeDistrict: 2,
		...overrides,
	};
}

// ─── saveWip / loadWip round-trip ─────────────────────────────────────────────

test("saveWip + loadWip: round-trips a full WipState", () => {
	resetStorage();
	const wip = makeWip();
	saveWip(wip);
	const loaded = loadWip();

	assertNotNull(loaded, "loadWip returns non-null after save");
	assertEqual(loaded!.scenarioId, "tutorial-001", "scenarioId");
	assertEqual(loaded!.activeDistrict, 2, "activeDistrict");
	assertEqual(loaded!.assignments["0"], 1, "assignment 0");
	assertEqual(loaded!.assignments["1"], 2, "assignment 1");
	assertEqual(loaded!.assignments["2"], 1, "assignment 2");
});

test("saveWip + loadWip: overwrites previous WIP on re-save", () => {
	resetStorage();
	saveWip(makeWip({ scenarioId: "old-scenario", activeDistrict: 1 }));
	saveWip(makeWip({ scenarioId: "new-scenario", activeDistrict: 3 }));
	const loaded = loadWip();

	assertNotNull(loaded, "returns non-null");
	assertEqual(loaded!.scenarioId, "new-scenario", "latest scenarioId");
	assertEqual(loaded!.activeDistrict, 3, "latest activeDistrict");
});

test("saveWip + loadWip: empty assignments round-trips", () => {
	resetStorage();
	saveWip(makeWip({ assignments: {} }));
	const loaded = loadWip();

	assertNotNull(loaded, "returns non-null");
	assertEqual(Object.keys(loaded!.assignments).length, 0, "empty assignments");
});

// ─── loadWip: missing / invalid data ─────────────────────────────────────────

test("loadWip: nothing stored — returns null", () => {
	resetStorage();
	assertNull(loadWip(), "null when key absent");
});

test("loadWip: malformed JSON — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", "not-valid-json{{{");
	assertNull(loadWip(), "null on parse error");
});

test("loadWip: object missing scenarioId — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", JSON.stringify({ assignments: {}, activeDistrict: 1 }));
	assertNull(loadWip(), "null when scenarioId absent");
});

test("loadWip: object missing assignments — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", JSON.stringify({ scenarioId: "x", activeDistrict: 1 }));
	assertNull(loadWip(), "null when assignments absent");
});

test("loadWip: object missing activeDistrict — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", JSON.stringify({ scenarioId: "x", assignments: {} }));
	assertNull(loadWip(), "null when activeDistrict absent");
});

test("loadWip: scenarioId is number not string — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", JSON.stringify({ scenarioId: 42, assignments: {}, activeDistrict: 1 }));
	assertNull(loadWip(), "null when scenarioId is wrong type");
});

test("loadWip: activeDistrict is string not number — returns null", () => {
	resetStorage();
	_store.set("redistricting-sim-wip", JSON.stringify({ scenarioId: "x", assignments: {}, activeDistrict: "2" }));
	assertNull(loadWip(), "null when activeDistrict is wrong type");
});

// ─── clearWip ─────────────────────────────────────────────────────────────────

test("clearWip: after save, loadWip returns null", () => {
	resetStorage();
	saveWip(makeWip());
	assertNotNull(loadWip(), "present before clear");
	clearWip();
	assertNull(loadWip(), "null after clear");
});

test("clearWip: clearing nothing stored does not throw", () => {
	resetStorage();
	clearWip(); // should not throw
	assertNull(loadWip(), "still null after clear-with-nothing");
});

summarize();
