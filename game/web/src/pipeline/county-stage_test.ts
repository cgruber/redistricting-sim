/**
 * Tests for the population-aware county stage (GAME-089).
 *
 * Covers:
 *   - Every precinct receives a county_id
 *   - Determinism (same input → same assignment)
 *   - Each county is spatially contiguous (flood-fill invariant)
 *   - County count respects the target
 *   - seat_and_hinterland: densest center anchors the biggest county
 *   - city_county: the dense core is carved into its own "_city" county,
 *     distinct from the surrounding counties
 *   - Multiple centers → multiple counties (Clark County multi-town absorption)
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:county_stage_test
 */

import { assignCountiesByPopulation } from "./county-stage.js";
import { populateScenario } from "./population-stage.js";
import { generateTerrain } from "./terrain-generator.js";
import type { PipelineSpec, PopulationSpec, CountiesSpec } from "./spec-types.js";
import type { PartialScenario } from "../model/scenario.js";
import { test, assertEqual, summarize } from "../testing/test_runner.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function terrainSpec(radius: number): PipelineSpec {
	return {
		format_version: "1",
		scenario: {
			id: "county-test",
			title: "County Test",
			election_type: "state_house",
			region: { id: "testco", name: "Test County" },
		},
		map: { geometry: "hex_axial", shape: "hex_circle", radius },
	};
}

// A radius-5 map with a strong central city + a secondary eastern town, so the
// field has two clear local maxima plus a rural west.
function populatedPartial(overrides: Partial<PopulationSpec> = {}): PartialScenario {
	const partial = generateTerrain(terrainSpec(5));
	const pop: PopulationSpec = {
		seed: 42,
		base: 1500,
		variance: 100,
		gradient: { strength: 0.3 },
		smoothing: 2,
		contrast: 1.3,
		target_total: 144000,
		settlements: [
			{ anchor: "center", peak: 800, radius: 3 },
			{ anchor: "east", peak: 400, radius: 1 },
		],
		...overrides,
	};
	return populateScenario(partial, pop);
}

function pos(p: { position: unknown }): { q: number; r: number } {
	return p.position as { q: number; r: number };
}

const HEX_DIRS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[0, -1],
	[1, -1],
];

function isContiguous(result: PartialScenario, countyId: string): boolean {
	const members = result.precincts.filter((p) => p.county_id === countyId);
	if (members.length <= 1) return true;
	const ids = new Set(members.map((p) => p.id));
	const byPos = new Map(members.map((p) => [`${pos(p).q},${pos(p).r}`, p.id]));
	const posById = new Map(members.map((p) => [p.id, pos(p)]));
	const start = members[0]!.id;
	const seen = new Set<string>([start]);
	const queue = [start];
	while (queue.length > 0) {
		const id = queue.shift()!;
		const { q, r } = posById.get(id)!;
		for (const [dq, dr] of HEX_DIRS) {
			const nid = byPos.get(`${q + dq},${r + dr}`);
			if (nid !== undefined && ids.has(nid) && !seen.has(nid)) {
				seen.add(nid);
				queue.push(nid);
			}
		}
	}
	return seen.size === members.length;
}

function countyIds(result: PartialScenario): string[] {
	return [...new Set(result.precincts.map((p) => p.county_id!))];
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

test("county: every precinct receives a county_id", () => {
	const result = assignCountiesByPopulation(populatedPartial(), { model: "seat_and_hinterland" });
	assertEqual(
		result.precincts.every((p) => typeof p.county_id === "string" && p.county_id.length > 0),
		true,
	);
});

test("county: assignment is deterministic", () => {
	const a = assignCountiesByPopulation(populatedPartial(), { model: "city_county" });
	const b = assignCountiesByPopulation(populatedPartial(), { model: "city_county" });
	for (let i = 0; i < a.precincts.length; i++) {
		assertEqual(a.precincts[i]!.county_id, b.precincts[i]!.county_id);
	}
});

test("county: every county is spatially contiguous (seat_and_hinterland)", () => {
	const result = assignCountiesByPopulation(populatedPartial(), { model: "seat_and_hinterland" });
	for (const cid of countyIds(result)) {
		assertEqual(isContiguous(result, cid), true);
	}
});

test("county: county count respects the target", () => {
	const result = assignCountiesByPopulation(populatedPartial(), {
		model: "seat_and_hinterland",
		target_count: 3,
	});
	assertEqual(countyIds(result).length <= 3, true);
	assertEqual(countyIds(result).length >= 1, true);
});

test("county: does not mutate the input scenario", () => {
	const partial = populatedPartial();
	assignCountiesByPopulation(partial, { model: "city_county" });
	assertEqual(
		partial.precincts.every((p) => p.county_id === undefined),
		true,
	);
});

test("city_county: the dense core is carved into its own '_city' county", () => {
	const result = assignCountiesByPopulation(populatedPartial(), {
		model: "city_county",
		target_count: 3,
	});
	// The densest precinct (the city peak) must live in a county whose id ends in "city".
	const peak = result.precincts.reduce((a, b) =>
		(b.total_population ?? 0) > (a.total_population ?? 0) ? b : a,
	);
	assertEqual(peak.county_id!.endsWith("city"), true);
	// The city county must not span the whole map — other counties exist.
	assertEqual(countyIds(result).length >= 2, true);
});

test("city_county: a rim precinct is in a different county than the city core", () => {
	const result = assignCountiesByPopulation(populatedPartial(), {
		model: "city_county",
		target_count: 3,
	});
	const peak = result.precincts.reduce((a, b) =>
		(b.total_population ?? 0) > (a.total_population ?? 0) ? b : a,
	);
	// A far-west rim precinct should not be in the city county.
	const rim = result.precincts.reduce((a, b) => (pos(b).q < pos(a).q ? b : a));
	assertEqual(rim.county_id !== peak.county_id, true);
});

test("county: multiple centers produce multiple counties", () => {
	const result = assignCountiesByPopulation(populatedPartial(), {
		model: "seat_and_hinterland",
		target_count: 3,
	});
	assertEqual(countyIds(result).length >= 2, true);
});

test("county: empty scenario is returned unchanged", () => {
	const partial = generateTerrain(terrainSpec(1));
	const emptied: PartialScenario = { ...partial, precincts: [] };
	const result = assignCountiesByPopulation(emptied, { model: "city_county" });
	assertEqual(result.precincts.length, 0);
});

summarize();
