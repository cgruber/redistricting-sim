/**
 * Unit tests for progress.ts — pure serialization and mutation functions.
 * Run via: bazel test //web/src/model:progress_test
 */

import {
	serializeProgress,
	deserializeProgress,
	markCompleted,
	isCompleted,
	type Progress,
} from "./progress.js";
import { test, assertEqual, assertDeepEqual, assertTrue, assertFalse, summarize } from "../testing/test_runner.js";

// ─── serializeProgress ────────────────────────────────────────────────────────

test("serializeProgress: empty completed is valid JSON", () => {
	const p: Progress = { completed: [] };
	const json = serializeProgress(p);
	JSON.parse(json); // throws if invalid
});

test("serializeProgress: round-trips a single id", () => {
	const p: Progress = { completed: ["tutorial-001"] };
	const parsed = JSON.parse(serializeProgress(p)) as { completed: string[] };
	assertDeepEqual(parsed.completed, ["tutorial-001"]);
});

test("serializeProgress: round-trips multiple ids", () => {
	const p: Progress = { completed: ["tutorial-001", "level-002"] };
	const parsed = JSON.parse(serializeProgress(p)) as { completed: string[] };
	assertDeepEqual(parsed.completed, ["tutorial-001", "level-002"]);
});

// ─── deserializeProgress ─────────────────────────────────────────────────────

test("deserializeProgress: parses valid JSON", () => {
	const p = deserializeProgress('{"completed":["tutorial-001"]}');
	assertDeepEqual(p.completed, ["tutorial-001"]);
});

test("deserializeProgress: parses empty completed", () => {
	const p = deserializeProgress('{"completed":[]}');
	assertDeepEqual(p.completed, []);
});

test("deserializeProgress: malformed JSON returns empty", () => {
	const p = deserializeProgress("not-json");
	assertDeepEqual(p.completed, []);
});

test("deserializeProgress: filters non-string items", () => {
	const p = deserializeProgress('{"completed":["a",42,null,"b"]}');
	assertDeepEqual(p.completed, ["a", "b"]);
});

test("deserializeProgress: missing completed returns empty", () => {
	const p = deserializeProgress('{"other":"field"}');
	assertDeepEqual(p.completed, []);
});

test("deserializeProgress: null JSON returns empty", () => {
	const p = deserializeProgress("null");
	assertDeepEqual(p.completed, []);
});

// ─── round-trip ───────────────────────────────────────────────────────────────

test("round-trip: serialize then deserialize preserves ids", () => {
	const original: Progress = { completed: ["a", "b", "c"] };
	const roundTripped = deserializeProgress(serializeProgress(original));
	assertDeepEqual(roundTripped.completed, original.completed);
});

// ─── markCompleted ────────────────────────────────────────────────────────────

test("markCompleted: adds id to empty progress", () => {
	const p: Progress = { completed: [] };
	assertDeepEqual(markCompleted(p, "tutorial-001").completed, ["tutorial-001"]);
});

test("markCompleted: does not duplicate existing id", () => {
	const p: Progress = { completed: ["tutorial-001"] };
	assertDeepEqual(markCompleted(p, "tutorial-001").completed, ["tutorial-001"]);
});

test("markCompleted: appends new id to existing", () => {
	const p: Progress = { completed: ["tutorial-001"] };
	assertDeepEqual(markCompleted(p, "level-002").completed, ["tutorial-001", "level-002"]);
});

test("markCompleted: returns new object (immutable)", () => {
	const p: Progress = { completed: ["a"] };
	const updated = markCompleted(p, "b");
	assertTrue(updated !== p, "should return a new object");
	assertDeepEqual(p.completed, ["a"], "original unchanged");
});

// ─── isCompleted ──────────────────────────────────────────────────────────────

test("isCompleted: true for present id", () => {
	const p: Progress = { completed: ["tutorial-001"] };
	assertTrue(isCompleted(p, "tutorial-001"));
});

test("isCompleted: false for absent id", () => {
	const p: Progress = { completed: ["tutorial-001"] };
	assertFalse(isCompleted(p, "level-002"));
});

test("isCompleted: false for empty progress", () => {
	const p: Progress = { completed: [] };
	assertFalse(isCompleted(p, "tutorial-001"));
});

summarize();
