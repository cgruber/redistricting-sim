/**
 * Tests for the scenario assembler (GAME-084 Stage 4 pipeline).
 *
 * Covers:
 *   assembleScenario:
 *   - parties are mapped from spec (id, name, abbreviation)
 *   - districts are mapped from spec (id, optional name)
 *   - precincts get initial_district_id via diagonal_strip rule
 *   - diagonal_strip: k=q+r; first strip where k<=max_k wins; default catches rest
 *   - precinct name derived from county_id last segment + (q,r)
 *   - rules are copied (population_tolerance, contiguity)
 *   - success_criteria mapped: seat_count, population_balance, district_count, compactness
 *   - success_criteria: character and party_id forwarded when present
 *   - narrative copied (character, intro_slides, objective)
 *   - events is always []
 *   - default_district_id forwarded when present
 *   - instigator_character forwarded when present
 *   - character_demographics forwarded when present
 *   - input PartialScenario is not mutated
 *   - no-match diagonal_strip throws
 *   - unknown criterion type throws
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:assembler_test
 */

import type { DistrictId, PartialScenario, PartyId, SuccessCriterion } from "../model/scenario.js";
import { assertEqual, summarize, test } from "../testing/test_runner.js";
import { assembleScenario } from "./assembler.js";
import { addDemographics, assignCounties } from "./demographics-stage.js";
import { populateScenario } from "./population-stage.js";
import type { AssemblySpec, CriterionSpec, PipelineSpec } from "./spec-types.js";
import { generateTerrain } from "./terrain-generator.js";

const KEN = "ken" as PartyId;
const RYU = "ryu" as PartyId;
const D1 = "d1" as DistrictId;
const D2 = "d2" as DistrictId;
const D3 = "d3" as DistrictId;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function minimalSpec(radius: number): PipelineSpec {
	return {
		format_version: "1",
		scenario: {
			id: "test-asm",
			title: "Test Assembly",
			election_type: "state_house",
			region: { id: "r1", name: "Test Region" },
		},
		map: { geometry: "hex_axial", shape: "hex_circle", radius },
	};
}

function makeEnrichedPartial(radius: number): PartialScenario {
	const terrain = generateTerrain(minimalSpec(radius));
	const withPop = populateScenario(terrain, {
		seed: 1,
		base: 1000,
		variance: 0,
	});
	const withDemo = addDemographics(withPop, {
		seed: 1,
		parties: ["ken", "ryu"],
		group: { id_suffix: "all" },
		turnout: { min: 0.6, max: 0.7 },
		jitter: 0.0,
		zones: [{ name: "all", filter: { default: true }, party_base: { ken: 0.55 } }],
	});
	return assignCounties(withDemo, [
		{ id: "region_west", filter: { q_lte: 0 } },
		{ id: "region_east", filter: { default: true } },
	]);
}

function baseAssemblySpec(overrides: Partial<AssemblySpec> = {}): AssemblySpec {
	return {
		parties: [
			{ id: "ken", name: "Ken Party", abbreviation: "KEN" },
			{ id: "ryu", name: "Ryu Party", abbreviation: "RYU" },
		],
		districts: [
			{ id: "d1", name: "District 1" },
			{ id: "d2", name: "District 2" },
			{ id: "d3", name: "District 3" },
		],
		default_district_id: "d1",
		initial_district_rule: {
			type: "diagonal_strip",
			strips: [
				{ max_k: -2, district: "d1" },
				{ max_k: 0, district: "d2" },
				{ default: true, district: "d3" },
			],
		},
		rules: { population_tolerance: 0.1, contiguity: "required" },
		success_criteria: [
			{
				id: "sc-balance",
				required: true,
				description: "Equal population",
				criterion: { type: "population_balance" },
			},
			{
				id: "sc-ken-seats",
				required: true,
				description: "Ken wins 2 seats",
				criterion: {
					type: "seat_count",
					party: "ken",
					operator: "gte",
					count: 2,
				},
				character: "governor",
			},
		],
		narrative: {
			character: { name: "Alex", role: "Strategist", motivation: "Win." },
			intro_slides: [{ heading: "Intro", body: "Welcome." }],
			objective: "Win two seats.",
		},
		instigator_character: "governor",
		character_demographics: { governor: "bm" },
		...overrides,
	};
}

// ─── Parties ──────────────────────────────────────────────────────────────────

test("assembleScenario: parties mapped from spec", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.parties?.length, 2);
	assertEqual(result.parties![0]!.id, KEN);
	assertEqual(result.parties![0]!.name, "Ken Party");
	assertEqual(result.parties![0]!.abbreviation, "KEN");
	assertEqual(result.parties![1]!.id, RYU);
});

test("assembleScenario: party color passes through when spec has it", () => {
	const partial = makeEnrichedPartial(2);
	const spec = baseAssemblySpec({
		parties: [
			{ id: "ken", name: "Ken Party", abbreviation: "KEN", color: "#c96d00" },
			{ id: "ryu", name: "Ryu Party", abbreviation: "RYU", color: "#7b35a8" },
		],
	});
	const result = assembleScenario(partial, spec);
	assertEqual(result.parties![0]!.color, "#c96d00");
	assertEqual(result.parties![1]!.color, "#7b35a8");
});

test("assembleScenario: party without color gets no color field", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.parties![0]!.color, undefined);
	assertEqual("color" in result.parties![0]!, false);
});

// GAME-118 home-base independent authoring: `independent` + `home` are forwarded verbatim so a
// scenario can be authored from a spec (not hand-patched into the JSON). Slot/coupling/geometry
// validation lives in the loader, not the assembler — this only proves the pass-through.
test("assembleScenario: independent + home pass through when spec has them", () => {
	const partial = makeEnrichedPartial(2);
	const spec = baseAssemblySpec({
		parties: [
			{ id: "ken", name: "Ken Party", abbreviation: "KEN" },
			{ id: "ryu", name: "Ryu Party", abbreviation: "RYU" },
			{
				id: "dhalsim",
				name: "Dhalsim",
				abbreviation: "IND",
				independent: true,
				home: { q: 1, r: -1 },
			},
		],
	});
	const result = assembleScenario(partial, spec);
	assertEqual(result.parties![2]!.independent, true);
	assertEqual(result.parties![2]!.home?.q, 1);
	assertEqual(result.parties![2]!.home?.r, -1);
});

test("assembleScenario: party without independent/home gets no such fields", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual("independent" in result.parties![0]!, false);
	assertEqual("home" in result.parties![0]!, false);
});

// ─── Districts ────────────────────────────────────────────────────────────────

test("assembleScenario: districts mapped from spec", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.districts?.length, 3);
	assertEqual(result.districts![0]!.id, D1);
	assertEqual(result.districts![0]!.name, "District 1");
	assertEqual(result.districts![1]!.id, D2);
});

test("assembleScenario: district without name gets no name field", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		districts: [{ id: "d1" }, { id: "d2" }, { id: "d3" }],
	});
	const result = assembleScenario(partial, spec);
	assertEqual(result.districts![0]!.name, undefined);
});

// ─── Diagonal strip / initial_district_id ────────────────────────────────────

test("assembleScenario: diagonal_strip assigns initial_district_id based on k=q+r", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	// Verify every precinct got an initial_district_id
	for (const p of result.precincts) {
		assertEqual(p.initial_district_id !== undefined, true);
	}
});

test("assembleScenario: diagonal_strip first strip where k<=max_k wins", () => {
	// radius=1 grid: k values range from -2 to +2
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	for (const p of result.precincts) {
		const pos = p.position as { q: number; r: number };
		const k = pos.q + pos.r;
		const expected = k <= -2 ? D1 : k <= 0 ? D2 : D3;
		assertEqual(p.initial_district_id, expected);
	}
});

test("assembleScenario: default strip catches remaining precincts", () => {
	const partial = makeEnrichedPartial(2);
	const result = assembleScenario(partial, baseAssemblySpec());
	const d3Precincts = result.precincts.filter((p) => p.initial_district_id === D3);
	// k>0 precincts should map to d3
	const kGtZero = result.precincts.filter((p) => {
		const pos = p.position as { q: number; r: number };
		return pos.q + pos.r > 0;
	});
	assertEqual(d3Precincts.length, kGtZero.length);
});

test("assembleScenario: no initial_district_rule leaves initial_district_id undefined", () => {
	const partial = makeEnrichedPartial(1);
	const base = baseAssemblySpec();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { initial_district_rule: _ignored, ...rest } = base;
	const spec: AssemblySpec = rest;
	const result = assembleScenario(partial, spec);
	for (const p of result.precincts) {
		assertEqual(p.initial_district_id, undefined);
	}
});

test("assembleScenario: no-match diagonal_strip throws", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		initial_district_rule: {
			type: "diagonal_strip",
			strips: [{ max_k: -999, district: "d1" }],
		},
	});
	let threw = false;
	try {
		assembleScenario(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

// ─── Row band / initial_district_id ──────────────────────────────────────────

test("assembleScenario: row_band assigns initial_district_id via max_r cascade on r", () => {
	// The r-axis analog of diagonal_strip — first band where r<=max_r wins, default
	// catches the rest. This is scenario-004's initial shape: consolidate the r=0
	// corridor into a center district so it is NOT pre-cracked (which diagonal strips,
	// cutting across the row, would do — shipping the puzzle already solved).
	const partial = makeEnrichedPartial(2);
	const spec = baseAssemblySpec({
		initial_district_rule: {
			type: "row_band",
			bands: [
				{ max_r: -2, district: "d1" },
				{ max_r: 0, district: "d2" },
				{ default: true, district: "d3" },
			],
		},
	});
	const result = assembleScenario(partial, spec);
	for (const p of result.precincts) {
		const pos = p.position as { q: number; r: number };
		const expected = pos.r <= -2 ? D1 : pos.r <= 0 ? D2 : D3;
		assertEqual(p.initial_district_id, expected);
	}
});

test("assembleScenario: no-match row_band throws", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		initial_district_rule: {
			type: "row_band",
			bands: [{ max_r: -999, district: "d1" }],
		},
	});
	let threw = false;
	try {
		assembleScenario(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

// ─── Zones / initial_district_id ─────────────────────────────────────────────

test("assembleScenario: zones assigns initial_district_id by first-match ZoneFilter", () => {
	// GAME-078: the general zone-filter initial map behind the VRA arc's over-packed "before"
	// picture. First matching filter wins — the exact same semantics as the demographics/county
	// stages (matchesFilter is shared). An early hex_dist_lte claims the interior; later filters
	// catch what falls through, which is how layered zones build rings. Here the center (0,0)
	// matches BOTH d1 (hex_dist_lte:0) and d2 (q_lte:0), but d1 wins purely by list order — the
	// property a thin, non-compact opportunity district drawn around a community depends on.
	const partial = makeEnrichedPartial(2);
	const spec = baseAssemblySpec({
		initial_district_rule: {
			type: "zones",
			zones: [
				{ filter: { hex_dist_lte: 0 }, district: "d1" },
				{ filter: { q_lte: 0 }, district: "d2" },
				{ filter: { default: true }, district: "d3" },
			],
		},
	});
	const result = assembleScenario(partial, spec);
	for (const p of result.precincts) {
		const pos = p.position as { q: number; r: number };
		const hexDist = (Math.abs(pos.q) + Math.abs(pos.r) + Math.abs(-pos.q - pos.r)) / 2;
		const expected = hexDist <= 0 ? D1 : pos.q <= 0 ? D2 : D3;
		assertEqual(p.initial_district_id, expected);
	}
});

test("assembleScenario: no-match zones throws", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		initial_district_rule: {
			type: "zones",
			zones: [{ filter: { hex_dist_lte: -1 }, district: "d1" }],
		},
	});
	let threw = false;
	try {
		assembleScenario(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

// ─── Precinct names ───────────────────────────────────────────────────────────

test("assembleScenario: precinct name derived from county_id last segment + (q,r)", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	for (const p of result.precincts) {
		const pos = p.position as { q: number; r: number };
		// county_id is "region_west" or "region_east"
		const lastSeg = (p.county_id ?? "").slice((p.county_id ?? "").lastIndexOf("_") + 1);
		const label = lastSeg[0]!.toUpperCase() + lastSeg.slice(1);
		assertEqual(p.name, `${label} (${pos.q},${pos.r})`);
	}
});

// ─── Rules ───────────────────────────────────────────────────────────────────

test("assembleScenario: rules population_tolerance and contiguity copied", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.rules?.population_tolerance, 0.1);
	assertEqual(result.rules?.contiguity, "required");
});

test("assembleScenario: rules compactness_threshold forwarded when present", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		rules: {
			population_tolerance: 0.05,
			contiguity: "preferred",
			compactness_threshold: 0.4,
		},
	});
	const result = assembleScenario(partial, spec);
	assertEqual(result.rules?.compactness_threshold, 0.4);
});

test("assembleScenario: rules compactness_threshold absent when not in spec", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.rules?.compactness_threshold, undefined);
});

// ─── Success criteria ────────────────────────────────────────────────────────

test("assembleScenario: success_criteria count matches spec", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.success_criteria?.length, 2);
});

test("assembleScenario: population_balance criterion mapped correctly", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	const sc = result.success_criteria!.find((s) => s.id === ("sc-balance" as any));
	assertEqual(sc?.criterion.type, "population_balance");
	assertEqual(sc?.required, true);
});

test("assembleScenario: seat_count criterion mapped with party+operator+count", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	const sc = result.success_criteria!.find((s) => s.id === ("sc-ken-seats" as any));
	const c = sc!.criterion as Extract<SuccessCriterion["criterion"], { type: "seat_count" }>;
	assertEqual(c?.type, "seat_count");
	assertEqual(c?.party, KEN);
	assertEqual(c?.operator, "gte");
	assertEqual(c?.count, 2);
});

test("assembleScenario: criterion character forwarded", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	const sc = result.success_criteria!.find((s) => s.id === ("sc-ken-seats" as any));
	assertEqual(sc?.character, "governor");
});

test("assembleScenario: district_count criterion mapped correctly", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		success_criteria: [
			{
				id: "sc-dc",
				required: true,
				description: "Four districts used",
				criterion: { type: "district_count" },
			},
		],
	});
	const result = assembleScenario(partial, spec);
	assertEqual(result.success_criteria![0]!.criterion.type, "district_count");
});

test("assembleScenario: compactness criterion mapped with operator+threshold", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		success_criteria: [
			{
				id: "sc-compact",
				required: false,
				description: "Compactness check",
				criterion: { type: "compactness", operator: "gte", threshold: 0.4 },
			},
		],
	});
	const result = assembleScenario(partial, spec);
	const c = result.success_criteria![0]!.criterion as Extract<
		SuccessCriterion["criterion"],
		{ type: "compactness" }
	>;
	assertEqual(c.type, "compactness");
	assertEqual(c.operator, "gte");
	assertEqual(c.threshold, 0.4);
});

test("assembleScenario: majority_minority criterion mapped with dimension/value group_filter", () => {
	// GAME-078 VRA arc: the protected-group opportunity criterion. group_filter carries a
	// dimension/value pair; min_eligible_share + min_districts pass through.
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		success_criteria: [
			{
				id: "sc-mm",
				required: true,
				description: "One Latino-opportunity district",
				criterion: {
					type: "majority_minority",
					group_filter: { dimension: "ethnicity", value: "latino" },
					min_eligible_share: 0.5,
					min_districts: 1,
				},
			},
		],
	});
	const result = assembleScenario(partial, spec);
	const c = result.success_criteria![0]!.criterion as Extract<
		SuccessCriterion["criterion"],
		{ type: "majority_minority" }
	>;
	assertEqual(c.type, "majority_minority");
	const gf = c.group_filter as { dimension: string; value: string };
	assertEqual(gf.dimension, "ethnicity");
	assertEqual(gf.value, "latino");
	assertEqual(c.min_eligible_share, 0.5);
	assertEqual(c.min_districts, 1);
});

test("assembleScenario: majority_minority without a group_filter throws", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		success_criteria: [
			{
				id: "sc-mm-bad",
				required: true,
				description: "Missing group_filter",
				criterion: {
					type: "majority_minority",
					min_eligible_share: 0.5,
					min_districts: 1,
				} as CriterionSpec,
			},
		],
	});
	let threw = false;
	try {
		assembleScenario(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

test("assembleScenario: unknown criterion type throws", () => {
	const partial = makeEnrichedPartial(1);
	const spec = baseAssemblySpec({
		success_criteria: [
			{
				id: "sc-bad",
				required: false,
				description: "Bad type",
				criterion: { type: "does_not_exist" } as CriterionSpec,
			},
		],
	});
	let threw = false;
	try {
		assembleScenario(partial, spec);
	} catch {
		threw = true;
	}
	assertEqual(threw, true);
});

// ─── Narrative ───────────────────────────────────────────────────────────────

test("assembleScenario: narrative character copied", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.narrative?.character.name, "Alex");
	assertEqual(result.narrative?.character.role, "Strategist");
});

test("assembleScenario: narrative intro_slides and objective copied", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.narrative?.intro_slides.length, 1);
	assertEqual(result.narrative?.intro_slides[0]?.heading, "Intro");
	assertEqual(result.narrative?.objective, "Win two seats.");
});

// ─── Events, metadata, optional fields ───────────────────────────────────────

test("assembleScenario: events is always []", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(Array.isArray(result.events), true);
	assertEqual(result.events?.length, 0);
});

test("assembleScenario: default_district_id forwarded", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.default_district_id, D1);
});

test("assembleScenario: instigator_character forwarded", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual(result.instigator_character, "governor");
});

test("assembleScenario: character_demographics forwarded", () => {
	const partial = makeEnrichedPartial(1);
	const result = assembleScenario(partial, baseAssemblySpec());
	assertEqual((result.character_demographics as any)?.governor, "bm");
});

test("assembleScenario: optional fields absent when not in spec", () => {
	const partial = makeEnrichedPartial(1);
	const base = baseAssemblySpec();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const {
		instigator_character: _a,
		character_demographics: _b,
		default_district_id: _c,
		...rest
	} = base;
	const spec: AssemblySpec = rest;
	const result = assembleScenario(partial, spec);
	assertEqual(result.instigator_character, undefined);
	assertEqual(result.character_demographics, undefined);
	assertEqual(result.default_district_id, undefined);
});

// ─── Immutability ─────────────────────────────────────────────────────────────

test("assembleScenario: input PartialScenario is not mutated", () => {
	const partial = makeEnrichedPartial(1);
	const originalPrecincts = partial.precincts.map((p) => ({ ...p }));
	assembleScenario(partial, baseAssemblySpec());
	for (let i = 0; i < originalPrecincts.length; i++) {
		assertEqual(
			partial.precincts[i]!.initial_district_id,
			originalPrecincts[i]!.initial_district_id,
		);
		assertEqual(partial.precincts[i]!.name, originalPrecincts[i]!.name);
	}
});

summarize();
