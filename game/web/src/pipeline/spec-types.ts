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
  /**
   * Falloff shape from the anchor (GAME-088).
   *   gaussian (default) — smooth bell; classic monocentric cone.
   *   plateau            — flat at peak within the inner half-radius, then a
   *                        linear drop to 0 at `radius`. Reads as a dense urban
   *                        core with a sharp edge rather than a smooth slope.
   */
  profile?: "gaussian" | "plateau";
}

/**
 * Optional monocentric density gradient (GAME-088).
 *
 * Tilts population toward an anchor so the map reads as "dense core → rural
 * fringe" instead of a flat field with a central spike. Multiplier ranges from
 * `1 - strength` at the rim to `1 + strength` at the anchor (mean ~1).
 */
export interface PopulationGradientSpec {
  /** Where density peaks. Defaults to "center". */
  anchor?: SettlementAnchor;
  /** 0 = flat (off); higher tilts more population toward the anchor. Suggested 0.2–0.6. */
  strength: number;
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
  // ── GAME-088 field-shaping layers (all opt-in; unset = legacy additive field) ──
  /** Monocentric density gradient (urban core → rural fringe). Default: off. */
  gradient?: PopulationGradientSpec;
  /**
   * Neighbour-averaging passes applied to the jitter component to remove
   * salt-and-pepper noise (so neighbours correlate). Default 0 = independent jitter.
   */
  smoothing?: number;
  /**
   * Contrast exponent (pow) applied to the normalized field. >1 sharpens dense
   * areas and lightens the fringe; widens dynamic range. Default 1 = off.
   */
  contrast?: number;
  /**
   * If set, the final field is scaled so total population equals this. Lets us
   * change the *shape* of the distribution without changing its magnitude
   * (keeps district-balance tests stable). Default: unset = no normalization.
   */
  target_total?: number;
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

// ─── Stage 3b: Counties (GAME-089) ────────────────────────────────────────────

/**
 * County-generation archetype. Named to be intuited on sight (the owner reasons
 * in real-city examples, not raw knobs). See the county-formation research
 * §RECOMMENDED_HEURISTIC for the full mapping.
 *
 *   seat_and_hinterland — town + rural surround; the densest center is just the
 *                         biggest county (most US county seats). Default.
 *   city_county         — the dense core is carved as its own county; the
 *                         surrounding area is absorbed by separate neighbouring
 *                         counties (San Francisco / Denver / Portland's Multnomah).
 *   split_metro         — one large center is split across several counties by
 *                         placing multiple seeds inside it (a big metro).
 */
export type CountyModel = "seat_and_hinterland" | "city_county" | "split_metro";

export interface CountiesSpec {
  /** Named archetype preset. Default: "seat_and_hinterland". */
  model?: CountyModel;
  /** Catchment radius in hexes — the "day's ride" size knob. Default 2. */
  catchment_radius?: number;
  /** Target number of counties. Default: round(precinct_count / 14). */
  target_count?: number;
  /** Catchment-pop fraction of the total for a center to anchor its own county. Default 0.15. */
  anchor_threshold?: number;
  /** Catchment-pop fraction making a center "dominant" (core/ring eligible). Default 0.40. */
  dominant_threshold?: number;
  /** Urban-core density cutoff as a fraction of the center's peak (city_county). Default 0.5. */
  core_density?: number;
  /** Border cost bias toward population troughs (higher = borders settle in valleys). Default 0.5. */
  trough_weight?: number;
  /** Border cost bias toward crossing terrain features / rivers. Default 1.0. */
  feature_weight?: number;
  /** Prefix for generated county ids (e.g. "clearwater" → "clearwater_city"). Default: region id. */
  id_prefix?: string;
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
  counties?: CountiesSpec;
  assembly?: AssemblySpec;
}
