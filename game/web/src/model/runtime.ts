/**
 * Unified runtime data model (GAME-043).
 *
 * The single runtime precinct/district/state model the simulation, renderer, and
 * store all operate on. Built once at load by the runtime builder (adapter.ts)
 * from the canonical `scenario.ts` types. Pure data — no DOM, no D3, no side
 * effects.
 *
 * Party representation is party-agnostic: vote shares are keyed by the scenario's
 * arbitrary `PartyId` (see party.ts), not a fixed R/D/L/G/I key set. This is what
 * lets multiparty (GAME-112) fall out instead of being bolted onto fixed keys.
 *
 * The runtime precinct keeps a numeric `index` (load-bearing: AssignmentMap keys,
 * BFS contiguity, keyboard nav, WIP save/restore) and carries the canonical string
 * `scenarioId` alongside it. District ids stay 1-based numbers at runtime (distinct
 * from scenario.ts's branded string DistrictId).
 */

import type { PartyId, PrecinctId } from "./scenario.js";
import type { PartyShare } from "./party.js";

// ─── Geometry ─────────────────────────────────────────────────────────────────

/** Axial hex grid coordinates (cube system, q+r+s = 0) */
export interface HexCoord {
	q: number;
	r: number;
}

/** Pixel center of a hex cell (for SVG rendering) */
export interface Point {
	x: number;
	y: number;
}

// ─── Precinct ─────────────────────────────────────────────────────────────────

/** Simulated prior election result for a precinct */
export interface PreviousResult {
	winner: PartyId;
	margin: number; // 0.0–1.0 (e.g. 0.07 = 7-point margin)
}

/**
 * A single runtime precinct — the atomic geographic unit.
 * Built once at load; immutable after creation (assignments live in GameState).
 */
export interface Precinct {
	/** Numeric runtime index (0-based array position); AssignmentMap key. */
	index: number;
	/** Canonical scenario precinct id (branded string). */
	scenarioId: PrecinctId;
	/** Human-readable name from scenario (e.g. "Far West Ridge") */
	name?: string;
	/** County identifier from scenario (used for county border overlay) */
	county_id?: string;
	/** Human-readable county name (shown in the precinct-info panel) */
	county_name?: string;
	/** Axial hex grid coordinates */
	coord: HexCoord;
	/** Pixel center (pre-computed for rendering) */
	center: Point;
	/**
	 * Fixed-length array of 6 neighbor precinct indices (or null if no neighbor).
	 * Index i corresponds to edge i (corner[i] → corner[i+1]) and its outward direction.
	 * Directions: [0]=lower-right, [1]=down, [2]=lower-left, [3]=upper-left, [4]=up, [5]=upper-right
	 */
	neighbors: (number | null)[];
	/**
	 * Like neighbors, but river-edge pairs are nulled out when river_blocks_contiguity is true.
	 * BFS uses this; geometry/rendering uses neighbors.
	 * Absent only on legacy/test precincts without terrain — BFS falls back to neighbors.
	 */
	passableNeighbors?: (number | null)[];
	/** Composable terrain annotations — independent booleans, any combination valid. */
	terrainAnnotation?: TerrainAnnotation;
	/** Population count (arbitrary units) */
	population: number;
	/** Partisan vote share keyed by PartyId, floats summing to 1.0 */
	voteShare: PartyShare;
	/** Simulated prior election result */
	previousResult: PreviousResult;
	/** Per-group population shares from scenario demographic_groups (for info panel) */
	groupShares?: {
		name: string;
		share: number;
		dimensions?: Record<string, string>;
	}[];
}

/**
 * Composable terrain annotations for a precinct. All fields are independent —
 * a single precinct can be coast AND foothill AND lakeside simultaneously.
 * All derived at build time from tile adjacency and river membership.
 */
export interface TerrainAnnotation {
	coast: boolean;
	foothill: boolean;
	lakeside: boolean;
	riverside: boolean;
}

/** Runtime terrain tile (non-precinct; non-assignable; non-interactive) */
export interface TerrainTileRuntime {
	coord: HexCoord;
	center: Point;
	type: "sea" | "lake" | "mountain";
}

// ─── Districts and results ────────────────────────────────────────────────────

/** A district is identified by a 1-based integer index at runtime */
export type DistrictId = number;

/** Per-district election result */
export interface DistrictResult {
	districtId: DistrictId;
	winner: PartyId;
	/** Vote totals by party (weighted by precinct population) */
	voteTotals: PartyShare;
	/** Total votes cast in the district */
	totalVotes: number;
	/** Winning margin (0.0–1.0) */
	margin: number;
	/** Number of precincts in the district */
	precinctCount: number;
	/** Total district population */
	population: number;
}

/** Full simulation result across all districts */
export interface SimulationResult {
	districtResults: DistrictResult[];
	/** Summary: seats won per party */
	seatsByParty: Record<PartyId, number>;
}

/** Precinct-to-district assignment map: precinct index → districtId (or null = unassigned) */
export type AssignmentMap = Map<number, DistrictId | null>;

// ─── Game state ───────────────────────────────────────────────────────────────

/** Full game state — the single source of truth for the Zustand store */
export interface GameState {
	precincts: Precinct[];
	/** Scenario parties in declaration order — the authoritative party list for
	 *  every winner/margin/seat computation (source of the tie-break order). */
	parties: PartyId[];
	/** Number of districts available to draw */
	districtCount: number;
	/** Current assignment of each precinct to a district */
	assignments: AssignmentMap;
	/** Currently active district being painted */
	activeDistrict: DistrictId;
	/** Last simulation result (null if no districts assigned) */
	simulationResult: SimulationResult | null;
	/** Non-precinct terrain tiles with pixel positions (absent = no terrain in scenario) */
	terrainTiles?: TerrainTileRuntime[];
	/** River edge pairs as precinct index pairs (absent = no rivers in scenario) */
	riverEdges?: [number, number][];
	/** GAME-118: home-base independents → their home precinct index (the array index,
	 *  equal to precinct.index and the assignment-map key). The election resolves each
	 *  independent's home *district* fresh from `assignments` every run, so this stays
	 *  correct as the player repaints. Absent or empty ⇒ no independents ⇒ every party
	 *  contests every district (the pre-GAME-118 behaviour, byte-for-byte). */
	independentHomes?: ReadonlyMap<PartyId, number>;
}

/** A brush stroke undo/redo diff: maps precinct index → {from, to} */
export interface StrokeDiff {
	changes: Map<number, { from: DistrictId | null; to: DistrictId | null }>;
}

// ─── District palette (party-agnostic) ────────────────────────────────────────

/** District color palette — Okabe-Ito (2008) color-blind-safe 8-color set, 5 used here.
 *  Source: https://jfly.uni-koeln.de/color/
 *  Safe for deuteranopia, protanopia, and tritanopia.
 *  Chosen to avoid collision with party colors D=#3a7bd5 and R=#e94560.
 *  Sky blue (#56B4E9) was swapped for yellow (#F0E442) to avoid visual conflict
 *  with water-terrain fills (sea #3a7fc1, lake/river #4dd0e1) — GAME-082.
 */
export const DISTRICT_COLORS: readonly string[] = [
	"#E69F00", // amber
	"#F0E442", // yellow
	"#009E73", // bluish green
	"#CC79A7", // mauve
	"#D55E00", // vermilion
] as const;

/** Maximum number of districts a scenario may define — bounded by the palette
 *  so every district has a distinct color. The loader rejects scenarios that
 *  exceed this rather than letting districts share a color or read as unassigned.
 */
export const MAX_DISTRICTS = DISTRICT_COLORS.length;

/**
 * District fill color for a 1-based district id. Single source of truth for the
 * district palette lookup (used by the map renderer and side panels).
 *
 * Fallback `#888` is the one agreed out-of-range color. It deliberately differs
 * from the map's unassigned-precinct fill (#2a2a3e) so an out-of-range district
 * never masquerades as "unassigned". In practice MAX_DISTRICTS keeps ids in
 * range, so the fallback should never render for a validly-loaded scenario.
 */
export function districtColor(id: number): string {
	return DISTRICT_COLORS[id - 1] ?? "#888";
}
