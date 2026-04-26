/**
 * Unit tests for progress.ts — pure serialization and mutation functions.
 * Hand-rolled TAP runner (no external test framework); compatible with Node 18+.
 *
 * Run via: bazel test //web/src/model:progress_test
 */

import {
	serializeProgress,
	deserializeProgress,
	markCompleted,
	isCompleted,
	type Progress,
} from "./progress.js";

let passed = 0;
let failed = 0;
let total = 0;

function assert(description: string, condition: boolean): void {
	total++;
	if (condition) {
		console.log(`ok ${total} - ${description}`);
		passed++;
	} else {
		console.log(`not ok ${total} - ${description}`);
		failed++;
	}
}

function assertDeepEqual(description: string, actual: unknown, expected: unknown): void {
	assert(description, JSON.stringify(actual) === JSON.stringify(expected));
}

// ─── serializeProgress ────────────────────────────────────────────────────────

{
	const p: Progress = { completed: [] };
	const json = serializeProgress(p);
	assert("serializeProgress: empty completed is valid JSON", (() => {
		try { JSON.parse(json); return true; } catch { return false; }
	})());
}

{
	const p: Progress = { completed: ["tutorial-001"] };
	const json = serializeProgress(p);
	const parsed = JSON.parse(json) as { completed: string[] };
	assertDeepEqual("serializeProgress: round-trips a single id", parsed.completed, ["tutorial-001"]);
}

{
	const p: Progress = { completed: ["tutorial-001", "level-002"] };
	const json = serializeProgress(p);
	const parsed = JSON.parse(json) as { completed: string[] };
	assertDeepEqual("serializeProgress: round-trips multiple ids", parsed.completed, ["tutorial-001", "level-002"]);
}

// ─── deserializeProgress ─────────────────────────────────────────────────────

{
	const p = deserializeProgress('{"completed":["tutorial-001"]}');
	assertDeepEqual("deserializeProgress: parses valid JSON", p.completed, ["tutorial-001"]);
}

{
	const p = deserializeProgress('{"completed":[]}');
	assertDeepEqual("deserializeProgress: parses empty completed", p.completed, []);
}

{
	const p = deserializeProgress("not-json");
	assertDeepEqual("deserializeProgress: malformed JSON returns empty", p.completed, []);
}

{
	const p = deserializeProgress('{"completed":["a",42,null,"b"]}');
	assertDeepEqual("deserializeProgress: filters non-string items", p.completed, ["a", "b"]);
}

{
	const p = deserializeProgress('{"other":"field"}');
	assertDeepEqual("deserializeProgress: missing completed returns empty", p.completed, []);
}

{
	const p = deserializeProgress("null");
	assertDeepEqual("deserializeProgress: null JSON returns empty", p.completed, []);
}

// ─── round-trip ───────────────────────────────────────────────────────────────

{
	const original: Progress = { completed: ["a", "b", "c"] };
	const roundTripped = deserializeProgress(serializeProgress(original));
	assertDeepEqual("round-trip: serialize then deserialize preserves ids", roundTripped.completed, original.completed);
}

// ─── markCompleted ────────────────────────────────────────────────────────────

{
	const p: Progress = { completed: [] };
	const updated = markCompleted(p, "tutorial-001");
	assertDeepEqual("markCompleted: adds id to empty progress", updated.completed, ["tutorial-001"]);
}

{
	const p: Progress = { completed: ["tutorial-001"] };
	const updated = markCompleted(p, "tutorial-001");
	assertDeepEqual("markCompleted: does not duplicate existing id", updated.completed, ["tutorial-001"]);
}

{
	const p: Progress = { completed: ["tutorial-001"] };
	const updated = markCompleted(p, "level-002");
	assertDeepEqual("markCompleted: appends new id to existing", updated.completed, ["tutorial-001", "level-002"]);
}

{
	const p: Progress = { completed: ["a"] };
	const updated = markCompleted(p, "b");
	assert("markCompleted: returns new object (immutable)", updated !== p);
	assertDeepEqual("markCompleted: original unchanged", p.completed, ["a"]);
}

// ─── isCompleted ──────────────────────────────────────────────────────────────

{
	const p: Progress = { completed: ["tutorial-001"] };
	assert("isCompleted: true for present id", isCompleted(p, "tutorial-001"));
}

{
	const p: Progress = { completed: ["tutorial-001"] };
	assert("isCompleted: false for absent id", !isCompleted(p, "level-002"));
}

{
	const p: Progress = { completed: [] };
	assert("isCompleted: false for empty progress", !isCompleted(p, "tutorial-001"));
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n1..${total}`);
if (failed > 0) {
	console.error(`# ${failed} of ${total} tests failed`);
	throw new Error(`Test suite failed: ${failed} of ${total} tests failed`);
} else {
	console.log(`# All ${total} tests passed`);
}
