/**
 * Integration tests: load every real scenario JSON file through loadScenario.
 *
 * These tests guard against loader regressions that unit tests with synthetic
 * fixtures would miss — they exercise the full parser+validator on actual game
 * content.
 *
 * Run via Bazel: bazel test //game/web/src/model:loader_integration_test
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { loadScenario } from "./loader.js";
import {
	test,
	assertEqual,
	assertDoesNotThrow,
	assertTrue,
	summarize,
} from "../testing/test_runner.js";

// ─── Runfiles path resolution ─────────────────────────────────────────────────

/**
 * Resolve the scenarios directory inside the bazel runfiles tree.
 * Bazel js_test sets RUNFILES_DIR; files live under _main/<workspace-path>
 * (Bazel ≥ 7 canonical name) or the bare runfiles root.
 */
function scenariosDir(): string {
	const runfiles = process.env["RUNFILES_DIR"];
	if (!runfiles) throw new Error("RUNFILES_DIR not set — must run via bazel test");
	for (const prefix of ["_main", ""]) {
		const dir = prefix
			? join(runfiles, prefix, "game", "scenarios")
			: join(runfiles, "game", "scenarios");
		try {
			readdirSync(dir);
			return dir;
		} catch {
			// try next prefix
		}
	}
	throw new Error("Scenarios directory not found in runfiles");
}

const SCENARIOS_DIR = scenariosDir();

function loadJson(filename: string): unknown {
	return JSON.parse(readFileSync(join(SCENARIOS_DIR, filename), "utf8"));
}

// ─── Discover scenario files from the filesystem ──────────────────────────────
//
// GAME-109: drive the load+validate loop from the runfiles directory rather than a
// hardcoded table, so a newly added scenario JSON is exercised automatically (under
// the "generator emits ALL scenarios" philosophy). Overlay files (*.overlay.json)
// are difference fragments, not standalone scenarios — exclude them.

const SCENARIO_FILES = readdirSync(SCENARIOS_DIR)
	.filter((f) => f.endsWith(".json") && !f.endsWith(".overlay.json"))
	.sort();

// Optional per-file expectations for the known set — keeps the specific
// precinct/district-count assertions. Files not listed here are still loaded and
// validated (the assertDoesNotThrow + id-matches-filename checks below).
const EXPECTED: Record<string, { precincts: number; districts: number }> = {
	"tutorial-001.json": { precincts: 37, districts: 2 },
	"tutorial-002.json": { precincts: 61, districts: 3 },
	"tutorial-003.json": { precincts: 91, districts: 3 },
	"tutorial-004.json": { precincts: 127, districts: 4 },
	"scenario-002.json": { precincts: 91, districts: 4 },
	"scenario-003.json": { precincts: 127, districts: 5 },
	"scenario-004.json": { precincts: 127, districts: 5 },
	"scenario-005.json": { precincts: 127, districts: 5 },
	"scenario-006.json": { precincts: 127, districts: 5 },
	"scenario-007.json": { precincts: 127, districts: 5 },
	"scenario-008.json": { precincts: 127, districts: 5 },
	"scenario-009.json": { precincts: 127, districts: 5 },
};

// Sanity: the glob must actually find scenarios (guards against a runfiles/data
// regression that would otherwise make every per-scenario test silently vanish).
test("scenario discovery: at least one scenario JSON found", () => {
	assertTrue(SCENARIO_FILES.length > 0, `no scenario JSON files in ${SCENARIOS_DIR}`);
});

// ─── Per-scenario tests ───────────────────────────────────────────────────────

for (const file of SCENARIO_FILES) {
	const id = file.replace(/\.json$/, "");

	test(`${id}: loads and validates without error`, () => {
		assertDoesNotThrow(() => loadScenario(loadJson(file)), `loadScenario(${file})`);
	});

	test(`${id}: scenario id matches filename`, () => {
		const scenario = loadScenario(loadJson(file));
		assertEqual(scenario.id, id as typeof scenario.id);
	});

	test(`${id}: all editable precincts have initial_district_id resolved`, () => {
		const scenario = loadScenario(loadJson(file));
		for (const pc of scenario.precincts) {
			if (pc.editable) {
				if (pc.initial_district_id === undefined || pc.initial_district_id === null) {
					throw new Error(`Editable precinct "${pc.id}" has unresolved initial_district_id`);
				}
			}
		}
	});

	const expected = EXPECTED[file];
	if (expected !== undefined) {
		const { precincts, districts } = expected;

		test(`${id}: precinct count = ${precincts}`, () => {
			const scenario = loadScenario(loadJson(file));
			assertEqual(scenario.precincts.length, precincts);
		});

		test(`${id}: district count = ${districts}`, () => {
			const scenario = loadScenario(loadJson(file));
			assertEqual(scenario.districts.length, districts);
		});
	}
}

summarize();
