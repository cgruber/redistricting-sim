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

export interface PopulationSpec {
  /** Seed for the deterministic PRNG used to generate per-precinct populations. */
  seed: number;
  /** Base population per precinct before random variance is applied. */
  base: number;
  /** Maximum +/- deviation from base (uniform distribution, integer output). */
  variance: number;
}

// ─── Pipeline spec (full file) ────────────────────────────────────────────────

export interface PipelineSpec {
  format_version: "1";
  scenario: ScenarioMetaSpec;
  map: MapSpec;
  terrain?: TerrainSpec;
  population?: PopulationSpec;
  // demographics, assembly sections added in later stages
}
