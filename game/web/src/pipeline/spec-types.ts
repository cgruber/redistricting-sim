/**
 * TypeScript types for the YAML pipeline spec format.
 *
 * Each section corresponds to one pipeline stage:
 *   map      → terrain generator (Stage 1)
 *   terrain  → terrain generator (Stage 1)
 *   population  → population stage (Stage 2)
 *   demographics → demographics stage (Stage 3)
 *   assembly → scenario assembler (Stage 4)
 *
 * The spec file is the human-readable source of truth checked in alongside
 * the generated scenario JSON. Agents tune the spec; the pipeline executes it.
 */

// ─── Shared geometry ──────────────────────────────────────────────────────────

export interface HexPos {
  q: number;
  r: number;
}

// ─── Stage 0: Scenario identity ───────────────────────────────────────────────

export interface ScenarioMetaSpec {
  id: string;
  title: string;
  election_type: "congressional" | "state_senate" | "state_house";
  region: {
    id: string;
    name: string;
  };
}

// ─── Stage 1a: Map layout ─────────────────────────────────────────────────────

export type MapShape = "hex_circle";

export interface HexCircleMapSpec {
  geometry: "hex_axial";
  shape: "hex_circle";
  radius: number;
}

export type MapSpec = HexCircleMapSpec;

// ─── Stage 1b: Terrain placement ──────────────────────────────────────────────

export interface TerrainTileSpec extends HexPos {
  type: "mountain" | "sea" | "lake";
}

export interface TerrainSpec {
  tiles?: TerrainTileSpec[];
  /** Position pairs; each pair names adjacent precincts separated by a river. */
  river_edges?: [HexPos, HexPos][];
}

// ─── Stage 2: Population ─────────────────────────────────────────────────────

export interface TerrainWeightsSpec {
  lakeside?: number;
  riverside?: number;
  coastal?: number;
  mountain_adjacent?: number;
}

export type SettlementAnchorNamed =
  | "lakeside" | "riverside" | "coastal" | "center"
  | "north" | "northeast" | "east" | "southeast"
  | "south" | "southwest" | "west" | "northwest";

export type SettlementAnchor = SettlementAnchorNamed | HexPos;

export interface SettlementSpec {
  type?: "city" | "town" | "village";
  label?: string;
  anchor: SettlementAnchor;
  peak: number;
  radius: number;
}

export interface PopulationSpec {
  /** Seed for the deterministic PRNG used to generate per-precinct populations. */
  seed: number;
  /** Base population per precinct (before terrain suitability and jitter). */
  base: number;
  /** Maximum +/- jitter per precinct, scaled by suitability. */
  variance: number;
  /** Override default terrain multipliers. Unspecified keys use defaults. */
  terrain_weights?: TerrainWeightsSpec;
  /** Optional named settlement zones that add Gaussian population bumps. */
  settlements?: SettlementSpec[];
}

// ─── Stage 3: Demographics ────────────────────────────────────────────────────

export interface ZoneFilter {
  q_lte?: number;
  q_gte?: number;
  hex_dist_lte?: number;
  default?: true;
}

export interface ZoneSpec {
  name: string;
  filter: ZoneFilter;
  party_base: Record<string, number>;
}

export interface CountyLabelSpec {
  id: string;
  filter: ZoneFilter;
}

export interface DemographicsGroupSpec {
  id_suffix: string;
  name?: string;
}

export interface DemographicsSpec {
  seed: number;
  parties: string[];
  group: DemographicsGroupSpec;
  turnout: { min: number; max: number };
  jitter: number;
  zones: ZoneSpec[];
  county_labels?: CountyLabelSpec[];
}

// ─── Stage 4: Assembly ───────────────────────────────────────────────────────

export interface PartySpec {
  id: string;
  name: string;
  abbreviation: string;
}

export interface DistrictSpec {
  id: string;
  name?: string;
}

export interface DiagonalStripEntry {
  max_k?: number;
  default?: true;
  district: string;
}

export interface DiagonalStripRule {
  type: "diagonal_strip";
  strips: DiagonalStripEntry[];
}

export type InitialDistrictRule = DiagonalStripRule;

export interface AssemblyRulesSpec {
  population_tolerance: number;
  contiguity: "required" | "preferred" | "allowed";
  compactness_threshold?: number;
}

export interface CriterionSpec {
  type: string;
  party?: string;
  operator?: string;
  count?: number;
  threshold?: number;
  margin?: number;
  min_count?: number;
  min_districts?: number;
  min_eligible_share?: number;
}

export interface SuccessCriterionSpec {
  id: string;
  required: boolean;
  description: string;
  criterion: CriterionSpec;
  character?: string;
  party_id?: string;
}

export interface SlideSpec {
  heading?: string;
  body: string;
  image?: string;
}

export interface NarrativeSpec {
  character: { name: string; role: string; motivation: string };
  intro_slides: SlideSpec[];
  objective: string;
  flavor_text?: string;
}

export interface AssemblySpec {
  parties: PartySpec[];
  districts: DistrictSpec[];
  default_district_id?: string;
  initial_district_rule?: InitialDistrictRule;
  rules: AssemblyRulesSpec;
  success_criteria: SuccessCriterionSpec[];
  narrative: NarrativeSpec;
  instigator_character?: string;
  character_demographics?: Record<string, string>;
}

// ─── Pipeline spec (full file) ────────────────────────────────────────────────

export interface PipelineSpec {
  format_version: "1";
  scenario: ScenarioMetaSpec;
  map: MapSpec;
  terrain?: TerrainSpec;
  population?: PopulationSpec;
  demographics?: DemographicsSpec;
  assembly?: AssemblySpec;
}
