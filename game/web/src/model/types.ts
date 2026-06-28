/**
 * Core data model types for the redistricting simulator spike.
 * All types are pure data — no DOM, no D3, no side effects.
 */

/**
 * Canonical party set and iteration order — the single source of truth for every
 * winner/margin computation, party-color/label lookup, and party→key mapping.
 *
 * `PartyKey` is DERIVED from this array (`typeof ALL_PARTIES[number]`), so the
 * array is authoritative: adding or removing a party here updates the type, and
 * any record keyed by `PartyKey` (PARTY_COLORS, PARTY_LABELS, PartyShare-shaped
 * data) must then account for it — a party can't be silently dropped from one
 * place while another still expects it. Iterating this (not an inline literal)
 * also keeps tie-breaks deterministic everywhere.
 */
export const ALL_PARTIES = ["R", "D", "L", "G", "I"] as const;

/** Party keys used throughout the sim (derived from {@link ALL_PARTIES}). */
export type PartyKey = (typeof ALL_PARTIES)[number];

/**
 * Plurality winner of a PartyShare.
 *
 * CANONICAL TIE-BREAK RULE (GAME-104): ties resolve to the party that comes
 * FIRST in `ALL_PARTIES` order. Implementation: seed best = ALL_PARTIES[0] (R)
 * and replace only on a strict `>`, so an equal share never displaces an
 * earlier-listed party. This is deterministic for every tie, including L/G/I:
 * order of preference is R > D > L > G > I. This matches the authoritative
 * election simulation (election.ts), so the displayed winner always follows the
 * computed result — there is exactly one tie-break direction in the codebase.
 */
export function winnerOf(share: PartyShare): PartyKey {
	let best: PartyKey = ALL_PARTIES[0]!;
	for (const p of ALL_PARTIES) {
		if (share[p] > share[best]) {
			best = p;
		}
	}
	return best;
}

/** Partisan vote share: floats 0.0–1.0 summing to 1.0 */
export interface PartyShare {
	R: number;
	D: number;
	L: number;
	G: number;
	I: number;
}

/** Simulated prior election result for a precinct */
export interface PreviousResult {
	winner: PartyKey;
	margin: number; // 0.0–1.0 (e.g. 0.07 = 7-point margin)
}

/** Sex/gender demographic breakdown; floats summing to 1.0 */
export interface Demographics {
	male: number;
	female: number;
	nonbinary: number;
}

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

/**
 * A single precinct — the atomic geographic unit.
 * Generated once; immutable after creation (assignments live in GameState).
 */
export interface Precinct {
	/** Unique integer ID */
	id: number;
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
	 * Fixed-length array of 6 neighbor precinct IDs (or null if no neighbor).
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
	/** Partisan vote share, floats summing to 1.0 */
	partyShare: PartyShare;
	/** Simulated prior election result */
	previousResult: PreviousResult;
	/** Demographic breakdown */
	demographics: Demographics;
	/** Per-group population shares from scenario demographic_groups (for info panel) */
	groupShares?: { name: string; share: number; dimensions?: Record<string, string> }[];
}

/**
 * Composable terrain annotations for a precinct. All fields are independent —
 * a single precinct can be coast AND foothill AND lakeside simultaneously.
 * All derived at adapter time from tile adjacency and river membership.
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

/** A district is identified by a 1-based integer index */
export type DistrictId = number;

/** Per-district election result */
export interface DistrictResult {
	districtId: DistrictId;
	winner: PartyKey;
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
	seatsByParty: Partial<Record<PartyKey, number>>;
}

/** Precinct-to-district assignment map: precinctId → districtId (or null = unassigned) */
export type AssignmentMap = Map<number, DistrictId | null>;

/** Full game state — the single source of truth for the Zustand store */
export interface GameState {
	precincts: Precinct[];
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
}

/** A brush stroke undo/redo diff: maps precinctId → {from, to} */
export interface StrokeDiff {
	changes: Map<number, { from: DistrictId | null; to: DistrictId | null }>;
}

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

/** Party display colors — aligned with PuOr lean-view palette so party badges
 *  and the lean map use a consistent color language.
 *  D → purple (D-leaning end of PuOr), R → orange (R-leaning end of PuOr).
 */
export const PARTY_COLORS: Record<PartyKey, string> = {
	R: "#c96d00",
	D: "#7b35a8",
	L: "#f0c040",
	G: "#50c878",
	I: "#a0a0a0",
};

/** Party display labels — fallbacks used when a scenario does not supply party names.
 *  Generic "Party 1/2" avoids color-name confusion since party colors vary by scenario.
 */
export const PARTY_LABELS: Record<PartyKey, string> = {
	R: "Party 1",
	D: "Party 2",
	L: "Libertarian",
	G: "Green",
	I: "Independent",
};
