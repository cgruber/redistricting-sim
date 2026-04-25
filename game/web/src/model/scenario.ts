/**
 * Spec-grade TypeScript types for the scenario data format.
 *
 * These are the canonical data types for the game engine — loader, simulation,
 * renderer, and store all build on these. The spike types in types.ts are left
 * untouched; the two type systems coexist until GAME-005 replaces the generator.
 *
 * All string-keyed identifiers use opaque branded types to prevent accidental
 * cross-type assignment (e.g. passing a PrecinctId where a DistrictId is needed).
 */

// ─── Branded ID types ─────────────────────────────────────────────────────────

declare const _scenarioId: unique symbol;
export type ScenarioId = string & { readonly [_scenarioId]: never };

declare const _partyId: unique symbol;
export type PartyId = string & { readonly [_partyId]: never };

declare const _districtId: unique symbol;
export type DistrictId = string & { readonly [_districtId]: never };

declare const _precinctId: unique symbol;
export type PrecinctId = string & { readonly [_precinctId]: never };

declare const _groupId: unique symbol;
export type GroupId = string & { readonly [_groupId]: never };

declare const _eventId: unique symbol;
export type EventId = string & { readonly [_eventId]: never };

declare const _criterionId: unique symbol;
export type CriterionId = string & { readonly [_criterionId]: never };

declare const _regionId: unique symbol;
export type RegionId = string & { readonly [_regionId]: never };

// ─── Geometry ─────────────────────────────────────────────────────────────────

export interface HexAxialPosition {
	q: number;
	r: number;
}

export interface CartesianPosition {
	x: number;
	y: number;
}

export type GeometrySpec =
	| { type: "hex_axial" }
	| { type: "custom" };

// ─── Region ───────────────────────────────────────────────────────────────────

export interface RegionSpec {
	id: RegionId;
	name: string;
}

// ─── Parties and districts ────────────────────────────────────────────────────

export interface Party {
	id: PartyId;
	name: string;
	abbreviation: string;
}

export interface District {
	id: DistrictId;
	name?: string;
}

// ─── Demographic groups ───────────────────────────────────────────────────────

export interface EligibilityRule {
	dimension: string;
	value: string;
	voter_eligible: false;
}

export interface GroupSchema {
	dimensions: Record<string, string[]>;
	eligibility_rules: EligibilityRule[];
}

export interface DemographicGroup {
	id: GroupId;
	name?: string;
	/** Share of precinct total_population; all groups in a precinct must sum to 1.0 */
	population_share: number;
	/** Vote share per party; all parties must be present; values sum to 1.0 */
	vote_shares: Record<PartyId, number>;
	/** Fraction of eligible voters who turn out; 0.0–1.0 */
	turnout_rate: number;
	/** Required if group_schema declared; must cover every dimension-value combo */
	dimensions?: Record<string, string>;
}

// ─── Precincts ────────────────────────────────────────────────────────────────

export interface Precinct {
	id: PrecinctId;
	/** false = context precinct: read-only, participates in sim, must have initial_district_id */
	editable: boolean;
	county_id?: string;
	/** HexAxialPosition for hex_axial geometry; CartesianPosition for custom */
	position: HexAxialPosition | CartesianPosition;
	/** Required for custom geometry only; must be symmetric */
	neighbors?: PrecinctId[];
	total_population: number;
	demographic_groups: DemographicGroup[];
	/** null/absent = auto-fill to default_district_id or districts[0] (editable only) */
	initial_district_id?: DistrictId | null;
	name?: string;
	tags?: string[];
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type GroupFilter =
	| { group_ids: GroupId[] }
	| { dimension: string; value: string };

export type PrecinctFilter =
	| { precinct_ids: PrecinctId[] }
	| { tags: string[] }
	| { editable_only: true };

interface DemographicEventBase {
	id: EventId;
}

export interface TurnoutShiftEvent extends DemographicEventBase {
	type: "turnout_shift";
	group_filter: GroupFilter;
	/** Delta applied to turnout_rate; clamped to [0, 1] after application */
	magnitude: number;
}

export interface VoteShareShiftEvent extends DemographicEventBase {
	type: "vote_share_shift";
	group_filter: GroupFilter;
	party: PartyId;
	/** Delta applied then renormalized across all parties */
	delta: number;
}

export interface PopulationShiftEvent extends DemographicEventBase {
	type: "population_shift";
	precinct_filter: PrecinctFilter;
	group_filter: GroupFilter;
	/** Delta applied then renormalized across all groups */
	delta: number;
}

export type DemographicEvent = TurnoutShiftEvent | VoteShareShiftEvent | PopulationShiftEvent;

// ─── Rules ────────────────────────────────────────────────────────────────────

export interface ScenarioRules {
	/** ±fraction from ideal population (e.g. 0.05 = 5%) */
	population_tolerance: number;
	/** required = hard error; preferred = warning; allowed = fully permitted */
	contiguity: "required" | "preferred" | "allowed";
	/** Min Fraction Kept; absent = not enforced */
	compactness_threshold?: number;
}

// ─── Success criteria ─────────────────────────────────────────────────────────

export type CompareOp = "lt" | "lte" | "eq" | "gte" | "gt";

export type Criterion =
	| { type: "seat_count"; party: PartyId; operator: CompareOp; count: number }
	| { type: "majority_minority"; group_filter: GroupFilter; min_eligible_share: number; min_districts: number }
	| { type: "efficiency_gap"; operator: CompareOp; threshold: number }
	| { type: "mean_median"; party: PartyId; operator: CompareOp; threshold: number }
	| { type: "compactness"; operator: CompareOp; threshold: number }
	| { type: "safe_seats"; party: PartyId; margin: number; min_count: number }
	| { type: "competitive_seats"; margin: number; min_count: number }
	| { type: "population_balance" }
	| { type: "district_count" };

export interface SuccessCriterion {
	id: CriterionId;
	required: boolean;
	description: string;
	criterion: Criterion;
}

// ─── Narrative ────────────────────────────────────────────────────────────────

export interface Slide {
	heading?: string;
	/** Markdown */
	body: string;
	image?: string;
}

export interface Narrative {
	character: {
		name: string;
		role: string;
		motivation: string;
	};
	intro_slides: Slide[];
	/** Shown on the map screen */
	objective: string;
	flavor_text?: string;
}

// ─── State context ────────────────────────────────────────────────────────────

export interface RegionResult {
	district_count: number;
	seat_totals: Record<PartyId, number>;
}

export interface StateContext {
	state_name: string;
	total_districts: number;
	other_region_results: Record<RegionId, RegionResult>;
}

// ─── Top-level Scenario ───────────────────────────────────────────────────────

export interface Scenario {
	format_version: "1";
	id: ScenarioId;
	title: string;
	election_type: "congressional" | "state_senate" | "state_house";
	region: RegionSpec;
	geometry: GeometrySpec;
	parties: Party[];
	districts: District[];
	precincts: Precinct[];
	group_schema?: GroupSchema;
	/** Auto-fill target for editable precincts with absent/null initial_district_id */
	default_district_id?: DistrictId;
	/** Applied in declaration order at evaluation time, before simulation */
	events: DemographicEvent[];
	rules: ScenarioRules;
	success_criteria: SuccessCriterion[];
	narrative: Narrative;
	/** v1: parsed but may be ignored by renderer */
	state_context?: StateContext;
}
