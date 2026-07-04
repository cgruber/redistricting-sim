/**
 * Tests for the loader behavioral split: parseScenario + validateScenarioComplete.
 *
 * These tests verify that:
 *  - parseScenario accepts partial scenario JSON (terrain-only, no gameplay fields)
 *  - parseScenario still catches structural invariant violations at parse time
 *  - validateScenarioComplete rejects partial scenarios missing gameplay fields
 *  - validateScenarioComplete accepts fully-populated partial scenarios
 *  - loadScenario = validateScenarioComplete(parseScenario(json)) (regression guard)
 *
 * Run via Bazel: bazel test //game/web/src/model:loader_parse_test
 */

import { parseScenario, validateScenarioComplete, loadScenario } from "./loader.js";
import {
	test,
	assertEqual,
	assertThrows,
	assertDoesNotThrow,
	summarize,
} from "../testing/test_runner.js";

// ─── Minimal terrain-only fixture (no gameplay fields) ───────────────────────

function terrainOnlyScenario(overrides: Record<string, unknown> = {}): unknown {
	return {
		format_version: "1",
		id: "terrain-test-001",
		title: "Terrain Only",
		election_type: "congressional",
		region: { id: "r1", name: "Test Region" },
		geometry: { type: "hex_axial" },
		precincts: [
			{ id: "p1", editable: true, position: { q: 0, r: 0 } },
			{ id: "p2", editable: true, position: { q: 1, r: 0 } },
		],
		terrain_tiles: [{ position: { q: 2, r: 0 }, type: "mountain" }],
		...overrides,
	};
}

// ─── Full scenario fixture (everything present) ───────────────────────────────

function fullScenario(overrides: Record<string, unknown> = {}): unknown {
	return {
		format_version: "1",
		id: "full-test-001",
		title: "Full Test Scenario",
		election_type: "congressional",
		region: { id: "r1", name: "Test Region" },
		geometry: { type: "hex_axial" },
		parties: [
			{ id: "blue", name: "Blue Party", abbreviation: "B" },
			{ id: "red", name: "Red Party", abbreviation: "R" },
		],
		districts: [
			{ id: "d1", name: "District 1" },
			{ id: "d2", name: "District 2" },
		],
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { q: 0, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
		],
		events: [],
		rules: { population_tolerance: 0.05, contiguity: "required" },
		success_criteria: [],
		narrative: {
			character: { name: "Alex", role: "Commissioner", motivation: "Test" },
			intro_slides: [{ body: "Welcome" }],
			objective: "Draw districts",
		},
		...overrides,
	};
}

// ─── parseScenario: happy path ────────────────────────────────────────────────

test("parseScenario: terrain-only JSON parses without error", () => {
	assertDoesNotThrow(() => parseScenario(terrainOnlyScenario()));
});

test("parseScenario: terrain-only result has no parties or districts", () => {
	const s = parseScenario(terrainOnlyScenario());
	assertEqual(s.parties, undefined);
	assertEqual(s.districts, undefined);
	assertEqual(s.events, undefined);
	assertEqual(s.rules, undefined);
	assertEqual(s.success_criteria, undefined);
	assertEqual(s.narrative, undefined);
});

test("parseScenario: terrain-only precincts lack total_population and demographic_groups", () => {
	const s = parseScenario(terrainOnlyScenario());
	assertEqual(s.precincts.length, 2);
	assertEqual(s.precincts[0]!.total_population, undefined);
	assertEqual(s.precincts[0]!.demographic_groups, undefined);
});

test("parseScenario: terrain_tiles preserved", () => {
	const s = parseScenario(terrainOnlyScenario());
	assertEqual(s.terrain_tiles?.length, 1);
	assertEqual(s.terrain_tiles?.[0]?.type, "mountain");
});

test("parseScenario: full JSON parses correctly", () => {
	const s = parseScenario(fullScenario());
	assertEqual(s.id, "full-test-001");
	assertEqual(s.parties?.length, 2);
	assertEqual(s.districts?.length, 2);
	assertEqual(s.precincts.length, 1);
	assertEqual(s.precincts[0]!.total_population, 1000);
	assertEqual(s.precincts[0]!.demographic_groups?.length, 1);
});

// ─── parseScenario: rejects non-finite / out-of-range numbers (GAME-101) ──────
// These inputs are in-memory JS objects (the realistic pipeline-bug vector before
// serialization), so NaN/Infinity are representable. Without the requireNumber
// finiteness guard, a NaN share would silently pass `Math.abs(sum - 1) > EPSILON`.

test("parseScenario: rejects NaN total_population", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					precincts: [
						{ id: "p1", editable: true, position: { q: 0, r: 0 }, total_population: Number.NaN },
					],
				}),
			),
		/finite/,
	);
});

test("parseScenario: rejects Infinity total_population", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					precincts: [
						{
							id: "p1",
							editable: true,
							position: { q: 0, r: 0 },
							total_population: Number.POSITIVE_INFINITY,
						},
					],
				}),
			),
		/finite/,
	);
});

test("parseScenario: rejects negative total_population", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					precincts: [
						{ id: "p1", editable: true, position: { q: 0, r: 0 }, total_population: -100 },
					],
				}),
			),
		/non-negative/,
	);
});

test("parseScenario: rejects non-finite vote_share", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					precincts: [
						{
							id: "p1",
							editable: true,
							position: { q: 0, r: 0 },
							total_population: 1000,
							demographic_groups: [
								{
									id: "g1",
									population_share: 1.0,
									vote_shares: { blue: Number.POSITIVE_INFINITY, red: 0.4 },
									turnout_rate: 0.7,
								},
							],
						},
					],
				}),
			),
		/finite/,
	);
});

// ─── parseScenario: structural errors caught at parse time ────────────────────

test("parseScenario: rejects unknown format_version", () => {
	assertThrows(
		() => parseScenario({ ...(terrainOnlyScenario() as object), format_version: "2" }),
		/format_version/,
	);
});

test("parseScenario: rejects missing id", () => {
	const s = terrainOnlyScenario() as Record<string, unknown>;
	delete s["id"];
	assertThrows(() => parseScenario(s), /id/);
});

test("parseScenario: rejects zero precincts (invariant 12)", () => {
	assertThrows(
		() => parseScenario({ ...(terrainOnlyScenario() as object), precincts: [] }),
		/[Ii]nvariant 12/,
	);
});

test("parseScenario: rejects context precinct without initial_district_id (invariant 4)", () => {
	assertThrows(
		() =>
			parseScenario({
				...(terrainOnlyScenario() as object),
				precincts: [{ id: "ctx", editable: false, position: { q: 0, r: 0 } }],
			}),
		/[Ii]nvariant 4/,
	);
});

test("parseScenario: catches duplicate IDs in present data (invariant 11)", () => {
	assertThrows(
		() =>
			parseScenario({
				...(terrainOnlyScenario() as object),
				precincts: [
					{ id: "p1", editable: true, position: { q: 0, r: 0 } },
					{ id: "p1", editable: true, position: { q: 1, r: 0 } },
				],
			}),
		/[Ii]nvariant 11/,
	);
});

test("parseScenario: hex_axial precinct with neighbors rejected (invariant 8)", () => {
	assertThrows(
		() =>
			parseScenario({
				...(terrainOnlyScenario() as object),
				precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 }, neighbors: ["p2"] }],
			}),
		/[Ii]nvariant 8/,
	);
});

test("parseScenario: invalid terrain tile type rejected", () => {
	assertThrows(
		() =>
			parseScenario({
				...(terrainOnlyScenario() as object),
				terrain_tiles: [{ position: { q: 2, r: 0 }, type: "swamp" }],
			}),
		/type/,
	);
});

test("parseScenario: terrain tile overlapping precinct rejected", () => {
	assertThrows(
		() =>
			parseScenario({
				...(terrainOnlyScenario() as object),
				terrain_tiles: [{ position: { q: 0, r: 0 }, type: "mountain" }],
			}),
		/[Tt]errain/,
	);
});

// Conditional structural: when parties ARE present, party refs are checked
test("parseScenario: catches unknown party ref in demographic_groups when parties present", () => {
	assertThrows(
		() =>
			parseScenario({
				...(fullScenario() as object),
				precincts: [
					{
						id: "p1",
						editable: true,
						position: { q: 0, r: 0 },
						total_population: 1000,
						demographic_groups: [
							{
								id: "g1",
								population_share: 1.0,
								vote_shares: { blue: 0.6, green: 0.4 },
								turnout_rate: 0.7,
							},
						],
					},
				],
			}),
		/[Ii]nvariant 1/,
	);
});

// ─── validateScenarioComplete: completeness checks ────────────────────────────

test("validateScenarioComplete: rejects terrain-only partial (no parties)", () => {
	const partial = parseScenario(terrainOnlyScenario());
	assertThrows(() => validateScenarioComplete(partial), /parties/i);
});

test("validateScenarioComplete: rejects partial with parties but no districts", () => {
	const partial = parseScenario({
		...(terrainOnlyScenario() as object),
		parties: [{ id: "blue", name: "Blue", abbreviation: "B" }],
	});
	assertThrows(() => validateScenarioComplete(partial), /district/i);
});

test("validateScenarioComplete: rejects partial with 1 district (invariant 10)", () => {
	const partial = parseScenario({
		...(terrainOnlyScenario() as object),
		parties: [{ id: "blue", name: "Blue", abbreviation: "B" }],
		districts: [{ id: "d1" }],
	});
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 10/);
});

test("validateScenarioComplete: rejects > MAX_DISTRICTS districts (invariant 10 upper bound, GAME-104)", () => {
	// DISTRICT_COLORS has 5 entries → MAX_DISTRICTS = 5. Six districts exceeds the
	// palette and must fail loud rather than letting two districts share a color.
	const partial = parseScenario(
		fullScenario({
			districts: [
				{ id: "d1", name: "District 1" },
				{ id: "d2", name: "District 2" },
				{ id: "d3", name: "District 3" },
				{ id: "d4", name: "District 4" },
				{ id: "d5", name: "District 5" },
				{ id: "d6", name: "District 6" },
			],
		}),
	);
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 10/);
	assertThrows(() => validateScenarioComplete(partial), /at most/);
});

test("validateScenarioComplete: accepts exactly MAX_DISTRICTS districts (boundary, GAME-104)", () => {
	// 5 districts == MAX_DISTRICTS must still load (the bound is inclusive).
	const partial = parseScenario(
		fullScenario({
			districts: [
				{ id: "d1", name: "District 1" },
				{ id: "d2", name: "District 2" },
				{ id: "d3", name: "District 3" },
				{ id: "d4", name: "District 4" },
				{ id: "d5", name: "District 5" },
			],
		}),
	);
	assertDoesNotThrow(() => validateScenarioComplete(partial));
});

test("validateScenarioComplete: rejects partial with missing total_population", () => {
	const partial = parseScenario({
		...(fullScenario() as object),
		precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 } }],
	});
	assertThrows(() => validateScenarioComplete(partial), /total_population/);
});

test("validateScenarioComplete: rejects partial missing demographic_groups", () => {
	const partial = parseScenario({
		...(fullScenario() as object),
		precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 }, total_population: 100 }],
	});
	assertThrows(() => validateScenarioComplete(partial), /demographic_groups/);
});

test("validateScenarioComplete: rejects partial missing rules", () => {
	const s = fullScenario() as Record<string, unknown>;
	delete s["rules"];
	const partial = parseScenario(s);
	assertThrows(() => validateScenarioComplete(partial), /rules/);
});

test("validateScenarioComplete: rejects partial missing narrative", () => {
	const s = fullScenario() as Record<string, unknown>;
	delete s["narrative"];
	const partial = parseScenario(s);
	assertThrows(() => validateScenarioComplete(partial), /narrative/);
});

test("validateScenarioComplete: rejects partial missing events", () => {
	const s = fullScenario() as Record<string, unknown>;
	delete s["events"];
	const partial = parseScenario(s);
	assertThrows(() => validateScenarioComplete(partial), /events/);
});

test("validateScenarioComplete: rejects partial missing success_criteria", () => {
	const s = fullScenario() as Record<string, unknown>;
	delete s["success_criteria"];
	const partial = parseScenario(s);
	assertThrows(() => validateScenarioComplete(partial), /success_criteria/);
});

test("validateScenarioComplete: rejects partial with empty parties array (length 0 branch)", () => {
	// Use precincts without demographic_groups so party-ref invariant (inv 1) does not fire at parse
	// time when parties:[] — the empty-parties completeness check in validateScenarioComplete fires instead.
	const partial = parseScenario({
		...(fullScenario() as object),
		parties: [],
		precincts: [{ id: "p1", editable: true, position: { q: 0, r: 0 } }],
	});
	assertThrows(() => validateScenarioComplete(partial), /parties/i);
});

test("validateScenarioComplete: accepts full partial, returns Scenario", () => {
	const partial = parseScenario(fullScenario());
	assertDoesNotThrow(() => validateScenarioComplete(partial));
	const scenario = validateScenarioComplete(partial);
	assertEqual(scenario.id, "full-test-001");
	assertEqual(scenario.parties.length, 2);
	assertEqual(scenario.districts.length, 2);
	assertEqual(scenario.precincts.length, 1);
});

test("validateScenarioComplete: auto-fills initial_district_id for editable precincts", () => {
	const partial = parseScenario(fullScenario());
	const scenario = validateScenarioComplete(partial);
	assertEqual(scenario.precincts[0]!.initial_district_id, "d1");
});

// ─── loadScenario regression guard ───────────────────────────────────────────

test("loadScenario: still works end-to-end (regression guard)", () => {
	assertDoesNotThrow(() => loadScenario(fullScenario()));
	const s = loadScenario(fullScenario());
	assertEqual(s.id, "full-test-001");
});

test("loadScenario: still rejects partial JSON missing required gameplay fields", () => {
	assertThrows(() => loadScenario(terrainOnlyScenario()), /parties|districts|narrative|rules/i);
});

// ─── GAME-102: parse-time and complete-time validation agree ──────────────────
//
// loader.ts holds one definition per invariant, called from both the parse path
// (validateStructural) and the complete path (validateScenarioInvariants). These
// tests lock that single-definition behavior:
//  - loadScenario rejects each invalid variant (parse path fires first in prod), and
//  - validateScenarioComplete rejects the same violation when fed directly
//    (so a future complete-path-only regression can't sail through).

// A full, custom-geometry scenario whose neighbors are valid + symmetric.
function fullCustomScenario(overrides: Record<string, unknown> = {}): unknown {
	return fullScenario({
		geometry: { type: "custom" },
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { x: 0, y: 0 },
				neighbors: ["p2"],
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				id: "p2",
				editable: true,
				position: { x: 1, y: 0 },
				neighbors: ["p1"],
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.5 },
						turnout_rate: 0.7,
					},
				],
			},
		],
		...overrides,
	});
}

// A full, hex_axial scenario with two adjacent precincts (for terrain/river cases).
function fullHexScenario(overrides: Record<string, unknown> = {}): unknown {
	return fullScenario({
		geometry: { type: "hex_axial" },
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { q: 0, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				id: "p2",
				editable: true,
				position: { q: 1, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.5 },
						turnout_rate: 0.7,
					},
				],
			},
		],
		...overrides,
	});
}

// Both paths accept the same valid full fixture.
test("agreement: loadScenario and validateScenarioComplete both accept the full fixture", () => {
	assertDoesNotThrow(() => loadScenario(fullScenario()));
	assertDoesNotThrow(() => validateScenarioComplete(parseScenario(fullScenario())));
});

// Invariant 11 — duplicate id.
test("agreement: duplicate id rejected by both paths (Invariant 11)", () => {
	const json = fullHexScenario({
		districts: [
			{ id: "d1", name: "District 1" },
			{ id: "d1", name: "District 1 dupe" },
		],
	});
	assertThrows(() => loadScenario(json), /[Ii]nvariant 11/);
	// Bypass parse: build the partial from a valid base, then inject the duplicate.
	const partial = parseScenario(fullHexScenario());
	partial.districts = [
		{ id: "d1" as never, name: "District 1" },
		{ id: "d1" as never, name: "District 1 dupe" },
	];
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 11/);
});

// Invariant 8 — asymmetric neighbor in custom geometry.
test("agreement: asymmetric neighbor rejected by both paths (Invariant 8)", () => {
	// p1 lists p2, but p2 omits p1 → not symmetric.
	const json = fullCustomScenario({
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { x: 0, y: 0 },
				neighbors: ["p2"],
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				id: "p2",
				editable: true,
				position: { x: 1, y: 0 },
				neighbors: [],
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.5 },
						turnout_rate: 0.7,
					},
				],
			},
		],
	});
	assertThrows(() => loadScenario(json), /[Ii]nvariant 8/);
	// Bypass parse: build from a symmetric base, then break symmetry on the partial.
	const partial = parseScenario(fullCustomScenario());
	partial.precincts[1]!.neighbors = [];
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 8/);
});

// Terrain — mountain enclosure.
test("agreement: mountain enclosure rejected by both paths (terrain)", () => {
	// Ring of mountains around p1 at (0,0); the 6 flat-top axial neighbors of (0,0)
	// are (1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1). p2 sits outside at (5,0).
	const enclosingMountains = [
		{ position: { q: 1, r: 0 }, type: "mountain" },
		{ position: { q: 0, r: 1 }, type: "mountain" },
		{ position: { q: -1, r: 1 }, type: "mountain" },
		{ position: { q: -1, r: 0 }, type: "mountain" },
		{ position: { q: 0, r: -1 }, type: "mountain" },
		{ position: { q: 1, r: -1 }, type: "mountain" },
	];
	const json = fullHexScenario({
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { q: 0, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				id: "p2",
				editable: true,
				position: { q: 5, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.5 },
						turnout_rate: 0.7,
					},
				],
			},
		],
		terrain_tiles: enclosingMountains,
	});
	assertThrows(() => loadScenario(json), /enclosed by mountain/);
	// Bypass parse: build from a no-mountain base, then inject the enclosing ring.
	const partial = parseScenario(
		fullHexScenario({
			precincts: [
				{
					id: "p1",
					editable: true,
					position: { q: 0, r: 0 },
					total_population: 1000,
					demographic_groups: [
						{
							id: "g1",
							population_share: 1.0,
							vote_shares: { blue: 0.6, red: 0.4 },
							turnout_rate: 0.7,
						},
					],
				},
				{
					id: "p2",
					editable: true,
					position: { q: 5, r: 0 },
					total_population: 1000,
					demographic_groups: [
						{
							id: "g2",
							population_share: 1.0,
							vote_shares: { blue: 0.5, red: 0.5 },
							turnout_rate: 0.7,
						},
					],
				},
			],
		}),
	);
	partial.terrain_tiles = enclosingMountains.map((m) => ({
		position: m.position,
		type: "mountain" as const,
	}));
	assertThrows(() => validateScenarioComplete(partial), /enclosed by mountain/);
});

// Inv1/Inv6 ordering — the parse path interleaves them per group, so an earlier
// precinct's Inv6 (sum) violation must win over a later precinct's Inv1 (unknown
// party) violation. The complete path runs Inv6 as a full pass before Inv1, so it
// also throws Inv6. Both paths must agree on Invariant 6 for this input.
test("agreement: per-group Inv1/Inv6 interleaving — earlier Inv6 wins (parse + complete)", () => {
	const json = fullHexScenario({
		precincts: [
			{
				// p1/g1: vote_shares sum to 0.9 → Invariant 6 violation, no unknown party.
				id: "p1",
				editable: true,
				position: { q: 0, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				// p2/g2: "green" is an unknown party → Invariant 1 violation, sum fine.
				id: "p2",
				editable: true,
				position: { q: 1, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.3, green: 0.2 },
						turnout_rate: 0.7,
					},
				],
			},
		],
	});
	// Parse path (runs first in production) throws on p1's Inv6, not p2's Inv1.
	assertThrows(() => loadScenario(json), /[Ii]nvariant 6/);
	// Complete path, fed directly: build a valid partial, then inject the two
	// violations so parse can't pre-empt. The complete path runs the Inv6 full pass
	// before the Inv1 full pass, so it also throws Invariant 6.
	const partial = parseScenario(fullHexScenario());
	partial.precincts[0]!.demographic_groups = [
		{
			id: "g1" as never,
			population_share: 1.0,
			vote_shares: { blue: 0.5, red: 0.4 } as never,
			turnout_rate: 0.7,
		},
	];
	partial.precincts[1]!.demographic_groups = [
		{
			id: "g2" as never,
			population_share: 1.0,
			vote_shares: { blue: 0.5, red: 0.3, green: 0.2 } as never,
			turnout_rate: 0.7,
		},
	];
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 6/);
});

// Invariant 7 — group_schema completeness. The two original copies had different
// loop structures (parse: per-precinct dimensions-then-combos; complete: all-precinct
// dimensions then all-precinct combos), which produced different first-error messages
// for inputs with multiple distinct Inv7 violations. The shared helper unifies on the
// parse structure, so both paths now agree on the SAME Inv7 message.
test("agreement: group_schema Inv7 violation — both paths throw the same message (Invariant 7)", () => {
	const group_schema = {
		dimensions: { race: ["white", "black"] },
		eligibility_rules: [],
	};
	// precinct p1: only a `white` group → passes dimension validation, fails the
	// `race=black` combo. precinct p2: a `purple` group → invalid dimension value.
	const violatingPrecincts = [
		{
			id: "p1",
			editable: true,
			position: { q: 0, r: 0 },
			total_population: 1000,
			demographic_groups: [
				{
					id: "g1",
					population_share: 1.0,
					vote_shares: { blue: 0.6, red: 0.4 },
					turnout_rate: 0.7,
					dimensions: { race: "white" },
				},
			],
		},
		{
			id: "p2",
			editable: true,
			position: { q: 1, r: 0 },
			total_population: 1000,
			demographic_groups: [
				{
					id: "g2",
					population_share: 1.0,
					vote_shares: { blue: 0.5, red: 0.5 },
					turnout_rate: 0.7,
					dimensions: { race: "purple" },
				},
			],
		},
	];
	const json = fullHexScenario({ group_schema, precincts: violatingPrecincts });
	// Parse path: per-precinct loop hits p1's missing race=black combo first.
	assertThrows(() => loadScenario(json), /[Ii]nvariant 7.*race=black/);
	// Complete path, fed directly via an injected partial, throws the SAME message.
	const partial = parseScenario(fullHexScenario());
	partial.group_schema = group_schema as never;
	partial.precincts = violatingPrecincts.map((pc) => ({
		id: pc.id as never,
		editable: pc.editable,
		position: pc.position,
		total_population: pc.total_population,
		demographic_groups: pc.demographic_groups as never,
	}));
	assertThrows(() => validateScenarioComplete(partial), /[Ii]nvariant 7.*race=black/);
});

// River — loose end (non-adjacent river edge).
test("agreement: non-adjacent river edge rejected by both paths (river)", () => {
	// p1 at (0,0) and p2 at (5,0) are not geometrically adjacent.
	const json = fullHexScenario({
		precincts: [
			{
				id: "p1",
				editable: true,
				position: { q: 0, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g1",
						population_share: 1.0,
						vote_shares: { blue: 0.6, red: 0.4 },
						turnout_rate: 0.7,
					},
				],
			},
			{
				id: "p2",
				editable: true,
				position: { q: 5, r: 0 },
				total_population: 1000,
				demographic_groups: [
					{
						id: "g2",
						population_share: 1.0,
						vote_shares: { blue: 0.5, red: 0.5 },
						turnout_rate: 0.7,
					},
				],
			},
		],
		river_edges: [["p1", "p2"]],
	});
	assertThrows(() => loadScenario(json), /not geometrically adjacent/);
	// Bypass parse: build a valid base (no river, p2 far from p1), then inject the bad edge.
	const partial = parseScenario(
		fullHexScenario({
			precincts: [
				{
					id: "p1",
					editable: true,
					position: { q: 0, r: 0 },
					total_population: 1000,
					demographic_groups: [
						{
							id: "g1",
							population_share: 1.0,
							vote_shares: { blue: 0.6, red: 0.4 },
							turnout_rate: 0.7,
						},
					],
				},
				{
					id: "p2",
					editable: true,
					position: { q: 5, r: 0 },
					total_population: 1000,
					demographic_groups: [
						{
							id: "g2",
							population_share: 1.0,
							vote_shares: { blue: 0.5, red: 0.5 },
							turnout_rate: 0.7,
						},
					],
				},
			],
		}),
	);
	partial.river_edges = [["p1" as never, "p2" as never]];
	assertThrows(() => validateScenarioComplete(partial), /not geometrically adjacent/);
});

// ─── GAME-118: home-base independent party validation ─────────────────────────
//
// parseParty enforces: independent ⟺ home (coupled), and an independent may not sit
// in a major slot (0/1, reserved for the two parties the fairness metrics normalise
// against). These fire at parse time.

test("parseScenario (GAME-118): an independent party without a home is rejected", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					parties: [
						{ id: "blue", name: "Blue", abbreviation: "B" },
						{ id: "red", name: "Red", abbreviation: "R" },
						{ id: "ind", name: "Ind", abbreviation: "I", independent: true },
					],
				}),
			),
		/home/,
	);
});

test("parseScenario (GAME-118): a home without independent:true is rejected", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					parties: [
						{ id: "blue", name: "Blue", abbreviation: "B" },
						{ id: "red", name: "Red", abbreviation: "R" },
						{ id: "ind", name: "Ind", abbreviation: "I", home: { q: 0, r: 0 } },
					],
				}),
			),
		/independent/,
	);
});

test("parseScenario (GAME-118): an independent in a major slot (0/1) is rejected", () => {
	assertThrows(
		() =>
			parseScenario(
				fullScenario({
					parties: [
						{ id: "ind", name: "Ind", abbreviation: "I", independent: true, home: { q: 0, r: 0 } },
						{ id: "red", name: "Red", abbreviation: "R" },
						{ id: "blue", name: "Blue", abbreviation: "B" },
					],
				}),
			),
		/slot/,
	);
});

test("parseScenario (GAME-118): a well-formed slot-2 independent with a home parses", () => {
	assertDoesNotThrow(() =>
		parseScenario(
			fullScenario({
				parties: [
					{ id: "blue", name: "Blue", abbreviation: "B" },
					{ id: "red", name: "Red", abbreviation: "R" },
					{ id: "ind", name: "Ind", abbreviation: "I", independent: true, home: { q: 0, r: 0 } },
				],
				// A 3-party precinct so vote-share completeness (Invariant 6) is satisfied.
				precincts: [
					{
						id: "p1",
						editable: true,
						position: { q: 0, r: 0 },
						total_population: 1000,
						demographic_groups: [
							{
								id: "g1",
								population_share: 1.0,
								vote_shares: { blue: 0.4, red: 0.3, ind: 0.3 },
								turnout_rate: 0.7,
							},
						],
					},
				],
			}),
		),
	);
});

test("loadScenario (GAME-118): a complete scenario with a slot-2 independent validates end-to-end", () => {
	// parseScenario acceptance (above) runs only structural checks; this drives the
	// FULL complete-path validation (loadScenario = parse + validateScenarioComplete),
	// which is where the independent-requires-hex_axial guard lives — so a guard or
	// coupling regression that wrongly rejected a valid hex independent is caught here.
	assertDoesNotThrow(() =>
		loadScenario(
			fullScenario({
				parties: [
					{ id: "blue", name: "Blue", abbreviation: "B" },
					{ id: "red", name: "Red", abbreviation: "R" },
					{ id: "ind", name: "Ind", abbreviation: "I", independent: true, home: { q: 0, r: 0 } },
				],
				precincts: [
					{
						id: "p1",
						editable: true,
						position: { q: 0, r: 0 },
						total_population: 1000,
						demographic_groups: [
							{
								id: "g1",
								population_share: 1.0,
								vote_shares: { blue: 0.4, red: 0.3, ind: 0.3 },
								turnout_rate: 0.7,
							},
						],
					},
				],
			}),
		),
	);
});

summarize();
