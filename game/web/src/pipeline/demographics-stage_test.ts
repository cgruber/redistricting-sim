/**
 * Tests for the demographics stage (GAME-084 Stage 3 pipeline).
 *
 * Covers:
 *   addDemographics:
 *   - All precincts get a demographic_groups array with one group
 *   - Group ID format: "<precinct_id>-<id_suffix>"
 *   - population_share is exactly 1.0
 *   - vote_shares sum to 1.0 (primary + others = 1)
 *   - All party keys present in vote_shares
 *   - Vote shares are in [0, 1]
 *   - N-party (GAME-116): 3-party bases realized as weights over the remainder;
 *     unspecified others split equally; 2-party path byte-identical; N=3 determinism
 *   - Turnout in [spec.turnout.min, spec.turnout.max]
 *   - Zone matching: first-match-wins, ANDed filter conditions
 *   - hex_dist_lte boundary (at boundary = match, just outside = no match)
 *   - near/within proximity to an arbitrary anchor (GAME-119): boundary, ANDed
 *     with q-conditions, and a half-specified (near without within) filter throws
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
	const spec = baseDemoSpec({
		group: { id_suffix: "all", name: "All voters" },
	});
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

test("addDemographics: zone filter r_gte/r_lte selects a horizontal row band", () => {
	// The r-axis complement to q_lte/q_gte. {r_gte: 0, r_lte: 0} selects exactly the
	// r = 0 row — the horizontal corridor a "cracking" scenario dilutes. Precincts off
	// that row fall through to the default zone.
	const spec = baseDemoSpec({
		zones: [
			{ name: "corridor", filter: { r_gte: 0, r_lte: 0 }, party_base: { ken: 0.18 } },
			{ name: "rest", filter: { default: true }, party_base: { ken: 0.65 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
	});
	const result = addDemographics(makePartial(3), spec);
	for (const p of result.precincts) {
		const { r } = hexPos(p);
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		assertEqual(Math.abs(kenShare - (r === 0 ? 0.18 : 0.65)) < 1e-10, true);
	}
});

test("addDemographics: zone filter r_gte selects a one-sided row half-plane", () => {
	// r_gte alone (no r_lte) mirrors q_gte: every precinct with r >= 2 matches — the
	// "north" band a county overlay uses; r < 2 falls through to default.
	const spec = baseDemoSpec({
		zones: [
			{ name: "north", filter: { r_gte: 2 }, party_base: { ken: 0.9 } },
			{ name: "rest", filter: { default: true }, party_base: { ken: 0.1 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		seed: 4,
	});
	const result = addDemographics(makePartial(3), spec);
	for (const p of result.precincts) {
		const { r } = hexPos(p);
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		assertEqual(Math.abs(kenShare - (r >= 2 ? 0.9 : 0.1)) < 1e-10, true);
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
			{
				name: "inner_east",
				filter: { q_gte: 0, hex_dist_lte: 2 },
				party_base: { ken: 0.9 },
			},
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

test("addDemographics: near/within selects precincts around an arbitrary anchor (boundary)", () => {
	// Anchor at (2,-1) — a NON-origin point, so this exercises proximity to an arbitrary
	// feature, distinct from hex_dist_lte (distance from the origin). within: 1 → the anchor
	// hex and its immediate neighbours match; distance 2+ falls through to the default zone.
	const anchor = { q: 2, r: -1 };
	const spec = baseDemoSpec({
		zones: [
			{ name: "near_anchor", filter: { near: anchor, within: 1 }, party_base: { ken: 0.9 } },
			{ name: "rest", filter: { default: true }, party_base: { ken: 0.1 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
	});
	const result = addDemographics(makePartial(3), spec);
	for (const p of result.precincts) {
		const { q, r } = hexPos(p);
		// distance from the anchor = hex distance of the component-wise difference
		const dq = q - anchor.q;
		const dr = r - anchor.r;
		const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr)) / 2;
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		assertEqual(Math.abs(kenShare - (dist <= 1 ? 0.9 : 0.1)) < 1e-10, true);
	}
});

test("addDemographics: near/within is ANDed with q conditions", () => {
	// Zone matches within 2 of the anchor (0,2) AND q <= 0 — both must hold, else the
	// precinct falls through to default. Guards that proximity composes with the q-filters.
	const anchor = { q: 0, r: 2 };
	const spec = baseDemoSpec({
		zones: [
			{ name: "sw", filter: { near: anchor, within: 2, q_lte: 0 }, party_base: { ken: 0.85 } },
			{ name: "rest", filter: { default: true }, party_base: { ken: 0.15 } },
		],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		seed: 3,
	});
	const result = addDemographics(makePartial(3), spec);
	for (const p of result.precincts) {
		const { q, r } = hexPos(p);
		const dq = q - anchor.q;
		const dr = r - anchor.r;
		const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr)) / 2;
		const inZone = dist <= 2 && q <= 0;
		const kenShare = p.demographic_groups![0]!.vote_shares[KEN] ?? 0;
		assertEqual(Math.abs(kenShare - (inZone ? 0.85 : 0.15)) < 1e-10, true);
	}
});

test("addDemographics: near without within throws (malformed filter, fail-fast)", () => {
	// The anchor and radius are a pair; a half-specified proximity filter is rejected
	// rather than silently ignored (which would produce wrong leans).
	const spec = baseDemoSpec({
		zones: [{ name: "bad", filter: { near: { q: 0, r: 0 } }, party_base: { ken: 0.5 } }],
	});
	let threw = false;
	try {
		addDemographics(makePartial(1), spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
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

// ─── N-party (GAME-116) ─────────────────────────────────────────────────────

const IND = "ind" as PartyId;

test("addDemographics: 3-party vote_shares include all parties and sum to 1.0", () => {
	const spec = baseDemoSpec({
		parties: ["ken", "ryu", "ind"],
		zones: [
			{
				name: "all",
				filter: { default: true },
				party_base: { ken: 0.55, ryu: 0.37, ind: 0.08 },
			},
		],
	});
	const result = addDemographics(makePartial(3), spec);
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		assertEqual(KEN in vs && RYU in vs && IND in vs, true);
		const sum = (vs[KEN] ?? 0) + (vs[RYU] ?? 0) + (vs[IND] ?? 0);
		assertEqual(Math.abs(sum - 1.0) < 1e-10, true);
	}
});

test("addDemographics: 3-party realizes authored bases at jitter 0 (weights sum to 1)", () => {
	const spec = baseDemoSpec({
		parties: ["ken", "ryu", "ind"],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		zones: [
			{
				name: "all",
				filter: { default: true },
				party_base: { ken: 0.55, ryu: 0.37, ind: 0.08 },
			},
		],
	});
	const result = addDemographics(makePartial(2), spec);
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		assertEqual(Math.abs((vs[KEN] ?? 0) - 0.55) < 1e-10, true);
		assertEqual(Math.abs((vs[RYU] ?? 0) - 0.37) < 1e-10, true);
		assertEqual(Math.abs((vs[IND] ?? 0) - 0.08) < 1e-10, true);
	}
});

test("addDemographics: unspecified non-primary bases split the remainder equally", () => {
	const spec = baseDemoSpec({
		parties: ["ken", "ryu", "ind"],
		jitter: 0,
		turnout: { min: 0.6, max: 0.6 },
		zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.5 } }],
	});
	const result = addDemographics(makePartial(2), spec);
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		// remainder 0.5 split equally between the two unspecified others → 0.25 each
		assertEqual(Math.abs((vs[RYU] ?? 0) - 0.25) < 1e-10, true);
		assertEqual(Math.abs((vs[IND] ?? 0) - 0.25) < 1e-10, true);
	}
});

test("addDemographics: 2-party path unchanged — secondary is exactly 1 − primary", () => {
	// Regression guard for byte-identity: with only the primary base specified,
	// the single other party gets remainder × 1.0, bit-identical to 1 − primary.
	const result = addDemographics(makePartial(3), baseDemoSpec({ seed: 7 }));
	for (const p of result.precincts) {
		const vs = p.demographic_groups![0]!.vote_shares;
		assertEqual(vs[RYU], 1 - (vs[KEN] ?? 0));
	}
});

test("addDemographics: N=3 deterministic — same seed twice produces identical shares", () => {
	const spec = baseDemoSpec({
		parties: ["ken", "ryu", "ind"],
		seed: 42,
		zones: [
			{
				name: "all",
				filter: { default: true },
				party_base: { ken: 0.5, ryu: 0.3, ind: 0.2 },
			},
		],
	});
	const partial = makePartial(3);
	const a = addDemographics(partial, spec);
	const b = addDemographics(partial, spec);
	for (let i = 0; i < a.precincts.length; i++) {
		const ga = a.precincts[i]!.demographic_groups![0]!;
		const gb = b.precincts[i]!.demographic_groups![0]!;
		assertEqual(ga.vote_shares[IND], gb.vote_shares[IND]);
		assertEqual(ga.turnout_rate, gb.turnout_rate);
	}
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
