import type {
	PartialScenario,
	PartialPrecinct,
	Party,
	District,
	SuccessCriterion,
	Criterion,
	ScenarioRules,
	Narrative,
	CharacterType,
} from "../model/scenario.js";
import type { PartyId, DistrictId, CriterionId } from "../model/scenario.js";
import type { AssemblySpec, CriterionSpec, DiagonalStripEntry } from "./spec-types.js";

function applyDiagonalStrip(strips: DiagonalStripEntry[], q: number, r: number): DistrictId {
	const k = q + r;
	const match = strips.find((s) => s.default === true || (s.max_k !== undefined && k <= s.max_k));
	if (!match) throw new Error(`No diagonal strip matched q=${q} r=${r} (k=${k})`);
	return match.district as DistrictId;
}

function mapCriterion(spec: CriterionSpec): Criterion {
	switch (spec.type) {
		case "seat_count":
			return {
				type: "seat_count",
				party: spec.party as PartyId,
				operator: spec.operator as "lt" | "lte" | "eq" | "gte" | "gt",
				count: spec.count!,
			};
		case "population_balance":
			return { type: "population_balance" };
		case "district_count":
			return { type: "district_count" };
		case "compactness":
			return {
				type: "compactness",
				operator: spec.operator as "lt" | "lte" | "eq" | "gte" | "gt",
				threshold: spec.threshold!,
			};
		case "efficiency_gap":
			return {
				type: "efficiency_gap",
				operator: spec.operator as "lt" | "lte" | "eq" | "gte" | "gt",
				threshold: spec.threshold!,
			};
		case "mean_median":
			return {
				type: "mean_median",
				party: spec.party as PartyId,
				operator: spec.operator as "lt" | "lte" | "eq" | "gte" | "gt",
				threshold: spec.threshold!,
			};
		case "safe_seats":
			return {
				type: "safe_seats",
				party: spec.party as PartyId,
				margin: spec.margin!,
				min_count: spec.min_count!,
			};
		case "competitive_seats":
			return {
				type: "competitive_seats",
				margin: spec.margin!,
				min_count: spec.min_count!,
			};
		default:
			throw new Error(`Unknown criterion type: ${spec.type}`);
	}
}

function precinctName(p: PartialPrecinct): string {
	const countyId = p.county_id ?? "";
	const lastSegment = countyId.includes("_")
		? countyId.slice(countyId.lastIndexOf("_") + 1)
		: countyId;
	const label = lastSegment.length > 0 ? lastSegment[0]!.toUpperCase() + lastSegment.slice(1) : "";
	const pos = p.position;
	if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position for name derivation`);
	return `${label} (${pos.q},${pos.r})`;
}

export function assembleScenario(partial: PartialScenario, spec: AssemblySpec): PartialScenario {
	const parties: Party[] = spec.parties.map((ps) => ({
		id: ps.id as PartyId,
		name: ps.name,
		abbreviation: ps.abbreviation,
	}));

	const districts: District[] = spec.districts.map((ds) => ({
		id: ds.id as DistrictId,
		...(ds.name !== undefined ? { name: ds.name } : {}),
	}));

	const precincts = partial.precincts.map((p) => {
		const pos = p.position;
		if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position`);
		const { q, r } = pos;

		const initial_district_id =
			spec.initial_district_rule?.type === "diagonal_strip"
				? applyDiagonalStrip(spec.initial_district_rule.strips, q, r)
				: undefined;

		const name = precinctName(p);

		return {
			...p,
			name,
			...(initial_district_id !== undefined ? { initial_district_id } : {}),
		};
	});

	const rules: ScenarioRules = {
		population_tolerance: spec.rules.population_tolerance,
		contiguity: spec.rules.contiguity,
		...(spec.rules.compactness_threshold !== undefined
			? { compactness_threshold: spec.rules.compactness_threshold }
			: {}),
	};

	const success_criteria: SuccessCriterion[] = spec.success_criteria.map((sc) => ({
		id: sc.id as CriterionId,
		required: sc.required,
		description: sc.description,
		criterion: mapCriterion(sc.criterion),
		...(sc.character !== undefined
			? { character: sc.character as CharacterType | "instigator" }
			: {}),
		...(sc.party_id !== undefined ? { party_id: sc.party_id as PartyId } : {}),
	}));

	const narrative: Narrative = {
		character: spec.narrative.character,
		intro_slides: spec.narrative.intro_slides,
		objective: spec.narrative.objective,
		...(spec.narrative.flavor_text !== undefined
			? { flavor_text: spec.narrative.flavor_text }
			: {}),
		...(spec.narrative.epilogue !== undefined ? { epilogue: spec.narrative.epilogue } : {}),
	};

	return {
		...partial,
		precincts,
		parties,
		districts,
		rules,
		success_criteria,
		narrative,
		events: [],
		...(spec.default_district_id !== undefined
			? { default_district_id: spec.default_district_id as DistrictId }
			: {}),
		...(spec.instigator_character !== undefined
			? { instigator_character: spec.instigator_character as CharacterType }
			: {}),
		...(spec.character_demographics !== undefined
			? {
					character_demographics: spec.character_demographics as Partial<
						Record<CharacterType, string>
					>,
				}
			: {}),
		...(spec.hide_election_results !== undefined
			? { hide_election_results: spec.hide_election_results }
			: {}),
		...(spec.hide_view_toolbar !== undefined ? { hide_view_toolbar: spec.hide_view_toolbar } : {}),
		...(spec.guided !== undefined ? { guided: spec.guided } : {}),
	};
}
