/**
 * Core data model types for the redistricting simulator spike.
 * All types are pure data — no DOM, no D3, no side effects.
 */

/** Party keys used throughout the sim */
export type PartyKey = "R" | "D" | "L" | "G" | "I";

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
}

/** A brush stroke undo/redo diff: maps precinctId → {from, to} */
export interface StrokeDiff {
	changes: Map<number, { from: DistrictId | null; to: DistrictId | null }>;
}

/** District color palette — Okabe-Ito (2008) color-blind-safe 8-color set, 5 used here.
 *  Source: https://jfly.uni-koeln.de/color/
 *  Safe for deuteranopia, protanopia, and tritanopia.
 *  Chosen to avoid collision with party colors D=#3a7bd5 and R=#e94560.
 */
export const DISTRICT_COLORS: readonly string[] = [
	"#E69F00", // amber
	"#56B4E9", // sky blue
	"#009E73", // bluish green
	"#CC79A7", // mauve
	"#D55E00", // vermilion
] as const;

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

/** Party display labels */
export const PARTY_LABELS: Record<PartyKey, string> = {
	R: "Red Party",
	D: "Blue Party",
	L: "Libertarian",
	G: "Green",
	I: "Independent",
};
