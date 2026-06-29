/**
 * Tests for the demographics stage (GAME-084 Stage 3 pipeline).
 *
 * Covers:
 *   addDemographics:
 *   - All precincts get a demographic_groups array with one group
 *   - Group ID format: "<precinct_id>-<id_suffix>"
 *   - population_share is exactly 1.0
 *   - vote_shares sum to 1.0 (primary + secondary = 1)
 *   - Both party keys present in vote_shares
 *   - Vote shares are in [0, 1]
 *   - Turnout in [spec.turnout.min, spec.turnout.max]
 *   - Zone matching: first-match-wins, ANDed filter conditions
 *   - hex_dist_lte boundary (at boundary = match, just outside = no match)
 *   - No-match throws
 *   - Determinism: same spec → same output
 *   - Different seeds → different outputs
 *   - Input PartialScenario is not mutated
 *   - Metadata fields are preserved
 *   - group.name is propagated when present, absent when not
 *
 *   assignCounties:
 *   - All precincts get county_id
 *   - county_id matches expected zone
 *   - No-match throws
 *   - Input not mutated
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:demographics_stage_test
 */

import { addDemographics, assignCounties } from "./demographics-stage.js";
import { generateTerrain } from "./terrain-generator.js";
import type { PipelineSpec, DemographicsSpec, CountyLabelSpec } from "./spec-types.js";
import type { PartialScenario, PartialPrecinct, PartyId } from "../model/scenario.js";
import type { HexAxialPosition } from "../model/scenario.js";
import { test, assertEqual, summarize } from "../testing/test_runner.js";

const KEN = "ken" as PartyId;
const RYU = "ryu" as PartyId;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function minimalTerrainSpec(radius: number): PipelineSpec {
	return {
		format_version: "1",
		scenario: {
			id: "test-demo",
			title: "Test Demo",
			election_type: "congressional",
			region: { id: "r1", name: "Test Region" },
		},
		map: { geometry: "hex_axial", shape: "hex_circle", radius },
	};
}

function makePartial(radius: number): PartialScenario {
	return generateTerrain(minimalTerrainSpec(radius));
}

function baseDemoSpec(overrides: Partial<DemographicsSpec> = {}): DemographicsSpec {
	return {
		seed: 99,
		parties: ["ken", "ryu"],
		group: { id_suffix: "all", name: "All voters" },
		turnout: { min: 0.55, max: 0.7 },
		jitter: 0.04,
		zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
		...overrides,
	};
}

function hexPos(p: PartialPrecinct): HexAxialPosition {
	const pos = p.position;
	if (!("q" in pos)) throw new Error("Expected hex position");
	return pos as HexAxialPosition;
}

// ─── Group structure ───────────────────────────────────────────────────────────

test("addDemographics: all precincts get exactly one demographic group", () => {
	const partial = makePartial(3);
	const result = addDemographics(partial, baseDemoSpec());
	for (const p of result.precincts) {
		assertEqual(p.demographic_groups?.length, 1);
	}
});

test("addDemographics: group ID format is <precinct_id>-<id_suffix>", () => {
	const partial = makePartial(2);
	const result = addDemographics(partial, baseDemoSpec({ group: { id_suffix: "all" } }));
	for (const p of result.precincts) {
		const group = p.demographic_groups![0]!;
		assertEqual(group.id, `${p.id}-all`);
	}
});

test("addDemographics: population_share is 1.0", () => {
	const partial = makePartial(2);
	const result = addDemographics(partial, baseDemoSpec());
	for (const p of result.precincts) {
		assertEqual(p.demographic_groups![0]!.population_share, 1.0);
	}
});

test("addDemographics: vote_shares sum to 1.0", () => {
	const partial = makePartial(3);
	const result = addDemographics(partial, baseDemoSpec());
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		const sum = (vs[KEN] ?? 0) + (vs[RYU] ?? 0);
		// Floating-point: allow tiny epsilon
		assertEqual(Math.abs(sum - 1.0) < 1e-10, true);
	}
});

test("addDemographics: both party keys present in vote_shares", () => {
	const partial = makePartial(2);
	const result = addDemographics(partial, baseDemoSpec());
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		assertEqual(KEN in vs, true);
		assertEqual(RYU in vs, true);
	}
});

test("addDemographics: vote_shares are in [0, 1]", () => {
	// Use extreme jitter to stress clamping
	const spec = baseDemoSpec({
		jitter: 0.99,
		zones: [{ name: "a", filter: { default: true }, party_base: { ken: 0.5 } }],
	});
	const partial = makePartial(3);
	const result = addDemographics(partial, spec);
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		assertEqual((vs[KEN] ?? -1) >= 0, true);
		assertEqual((vs[KEN] ?? 2) <= 1, true);
		assertEqual((vs[RYU] ?? -1) >= 0, true);
		assertEqual((vs[RYU] ?? 2) <= 1, true);
	}
});

test("addDemographics: turnout_rate within [min, max]", () => {
	const spec = baseDemoSpec({ turnout: { min: 0.6, max: 0.65 } });
	const partial = makePartial(3);
	const result = addDemographics(partial, spec);
	for (const p of result.precincts) {
		const t = p.demographic_groups![0]!.turnout_rate;
		assertEqual(t >= 0.6, true);
		assertEqual(t <= 0.65, true);
	}
});

// ─── group.name propagation ────────────────────────────────────────────────────

test("addDemographics: group.name propagated when present", () => {
	const spec = baseDemoSpec({ group: { id_suffix: "all", name: "All voters" } });
	const partial = makePartial(1);
	const result = addDemographics(partial, spec);
	for (const p of result.precincts) {
		assertEqual(p.demographic_groups![0]!.name, "All voters");
	}
});

test("addDemographics: group.name absent when not in spec", () => {
	const spec = baseDemoSpec({ group: { id_suffix: "all" } });
	const partial = makePartial(1);
	const result = addDemographics(partial, spec);
	for (const p of result.precincts) {
		assertEqual("name" in p.demographic_groups![0]!, false);
	}
});

// ─── Zone matching ─────────────────────────────────────────────────────────────

test("addDemographics: zone filter q_lte selects correct precincts", () => {
	const spec = baseDemoSpec({
		zones: [
			{ name: "west", filter: { q_lte: 0 }, party_base: { ken: 0.7 } },
			{ name: "east", filter: { default: true }, party_base: { ken: 0.3 } },
		],
		jitter: 0, // no jitter so we can test exact party_base propagation
		turnout: { min: 0.6, max: 0.6 },
	});
	const partial = makePartial(3);
	const result = addDemographics(partial, spec);

	for (const p of result.precincts) {
		const { q } = hexPos(p);
		const group = p.demographic_groups![0]!;
		if (q <= 0) {
			// west zone: ken ≈ 0.70
			assertEqual(Math.abs((group.vote_shares[KEN] ?? 0) - 0.7) < 1e-10, true);
		} else {
			// east zone: ken ≈ 0.30
			assertEqual(Math.abs((group.vote_shares[KEN] ?? 0) - 0.3) < 1e-10, true);
		}
	}
});

test("addDemographics: first-match-wins for overlapping zones", () => {
	// q_lte: 2 matches any q <= 2; default matches all.
	// First zone should win for q <= 2.
	const spec = baseDemoSpec({
		zones: [
			{ name: "first", filter: { q_lte: 2 }, party_base: { ken: 0.8 } },
			{ name: "second", filter: { default: true }, party_base: { ken: 0.2 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		seed: 1,
	});
	const partial = makePartial(2);
	const result = addDemographics(partial, spec);

	for (const p of result.precincts) {
		const { q } = hexPos(p);
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		if (q <= 2) {
			assertEqual(Math.abs(kenShare - 0.8) < 1e-10, true);
		} else {
			assertEqual(Math.abs(kenShare - 0.2) < 1e-10, true);
		}
	}
});

test("addDemographics: ANDed filter conditions both must hold", () => {
	// Zone matches q_gte: 0 AND hex_dist_lte: 2.
	// Precincts with q >= 0 but hex_dist > 2 should fall through to default.
	const spec = baseDemoSpec({
		zones: [
			{ name: "inner_east", filter: { q_gte: 0, hex_dist_lte: 2 }, party_base: { ken: 0.9 } },
			{ name: "other", filter: { default: true }, party_base: { ken: 0.1 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		seed: 5,
	});
	const partial = makePartial(3);
	const result = addDemographics(partial, spec);

	for (const p of result.precincts) {
		const { q, r } = hexPos(p);
		const s = -q - r;
		const dist = (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		if (q >= 0 && dist <= 2) {
			assertEqual(Math.abs(kenShare - 0.9) < 1e-10, true);
		} else {
			assertEqual(Math.abs(kenShare - 0.1) < 1e-10, true);
		}
	}
});

test("addDemographics: hex_dist_lte boundary — at distance matches, just outside does not", () => {
	// Radius-3 grid: origin precinct has dist=0, precincts at ring 2 have dist=2.
	// Zone1: hex_dist_lte: 2 → ken=0.90. Zone2: default → ken=0.10.
	const spec = baseDemoSpec({
		zones: [
			{ name: "inner", filter: { hex_dist_lte: 2 }, party_base: { ken: 0.9 } },
			{ name: "outer", filter: { default: true }, party_base: { ken: 0.1 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
	});
	const partial = makePartial(3);
	const result = addDemographics(partial, spec);

	for (const p of result.precincts) {
		const { q, r } = hexPos(p);
		const s = -q - r;
		const dist = (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		if (dist <= 2) {
			assertEqual(Math.abs(kenShare - 0.9) < 1e-10, true);
		} else {
			assertEqual(Math.abs(kenShare - 0.1) < 1e-10, true);
		}
	}
});

test("addDemographics: throws when no zone matches a precinct", () => {
	// Only zone matches q_lte: -10, no precinct in radius-1 grid has q <= -10.
	const spec = baseDemoSpec({
		zones: [{ name: "impossible", filter: { q_lte: -10 }, party_base: { ken: 0.5 } }],
	});
	const partial = makePartial(1);
	let threw = false;
	try {
		addDemographics(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

// ─── Determinism ──────────────────────────────────────────────────────────────

test("addDemographics: same spec produces same output", () => {
	const partial = makePartial(3);
	const spec = baseDemoSpec({ seed: 42 });
	const a = addDemographics(partial, spec);
	const b = addDemographics(partial, spec);
	for (let i = 0; i < a.precincts.length; i++) {
		const ga = a.precincts[i]!.demographic_groups![0]!;
		const gb = b.precincts[i]!.demographic_groups![0]!;
		assertEqual(ga.turnout_rate, gb.turnout_rate);
		assertEqual(ga.vote_shares[KEN], gb.vote_shares[KEN]);
	}
});

test("addDemographics: different seeds produce different outputs", () => {
	const partial = makePartial(3);
	const a = addDemographics(partial, baseDemoSpec({ seed: 1 }));
	const b = addDemographics(partial, baseDemoSpec({ seed: 2 }));
	const anyDiff = a.precincts.some((p, i) => {
		const ga = p.demographic_groups![0]!;
		const gb = b.precincts[i]!.demographic_groups![0]!;
		return ga.turnout_rate !== gb.turnout_rate || ga.vote_shares[KEN] !== gb.vote_shares[KEN];
	});
	assertEqual(anyDiff, true);
});

// ─── Immutability ─────────────────────────────────────────────────────────────

test("addDemographics: does not mutate input PartialScenario", () => {
	const partial = makePartial(2);
	const beforeIds = partial.precincts.map((p) => p.id);
	addDemographics(partial, baseDemoSpec());
	for (let i = 0; i < beforeIds.length; i++) {
		assertEqual(partial.precincts[i]!.id, beforeIds[i]);
		assertEqual(partial.precincts[i]!.demographic_groups, undefined);
	}
});

// ─── Metadata passthrough ─────────────────────────────────────────────────────

test("addDemographics: metadata fields are preserved", () => {
	const partial = makePartial(1);
	const result = addDemographics(partial, baseDemoSpec());
	assertEqual(result.format_version, partial.format_version);
	assertEqual(result.id, partial.id);
	assertEqual(result.title, partial.title);
	assertEqual(result.election_type, partial.election_type);
});

// ─── assignCounties ────────────────────────────────────────────────────────────

test("assignCounties: all precincts get a county_id", () => {
	const partial = makePartial(3);
	const labels: CountyLabelSpec[] = [
		{ id: "west_county", filter: { q_lte: 0 } },
		{ id: "east_county", filter: { default: true } },
	];
	const result = assignCounties(partial, labels);
	for (const p of result.precincts) {
		assertEqual(typeof p.county_id, "string");
	}
});

test("assignCounties: county_id matches expected zone for each precinct", () => {
	const partial = makePartial(3);
	const labels: CountyLabelSpec[] = [
		{ id: "west_county", filter: { q_lte: 0 } },
		{ id: "east_county", filter: { default: true } },
	];
	const result = assignCounties(partial, labels);
	for (const p of result.precincts) {
		const { q } = hexPos(p);
		const expectedId = q <= 0 ? "west_county" : "east_county";
		assertEqual(p.county_id, expectedId);
	}
});

test("assignCounties: throws when no label matches a precinct", () => {
	const partial = makePartial(1);
	const labels: CountyLabelSpec[] = [{ id: "impossible", filter: { q_lte: -10 } }];
	let threw = false;
	try {
		assignCounties(partial, labels);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

test("assignCounties: does not mutate input PartialScenario", () => {
	const partial = makePartial(2);
	const beforeIds = partial.precincts.map((p) => p.id);
	const labels: CountyLabelSpec[] = [{ id: "all", filter: { default: true } }];
	assignCounties(partial, labels);
	for (let i = 0; i < beforeIds.length; i++) {
		assertEqual(partial.precincts[i]!.id, beforeIds[i]);
		assertEqual(partial.precincts[i]!.county_id, undefined);
	}
});

summarize();
