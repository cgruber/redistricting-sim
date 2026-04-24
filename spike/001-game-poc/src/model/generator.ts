/**
 * Procedural map generator for a fictional redistricting region.
 *
 * Approach:
 * - Regular hex grid (offset, 7 columns × 8 rows ≈ 50 cells)
 * - Population: Gaussian mixture model with 2–3 epicenters (sum of exp(-d²/2σ²))
 * - Partisan lean: spatially coherent via overlapping sinusoidal gradients
 *   (low-frequency noise — nearby cells share correlated lean, no urban/rural stereotypes)
 * - All randomness seeded via a simple LCG for reproducibility
 */

import type {
	Demographics,
	HexCoord,
	PartyShare,
	Point,
	Precinct,
	PreviousResult,
} from "./types.js";

// ─── Hex geometry constants ───────────────────────────────────────────────────

const HEX_SIZE = 36; // pixel radius (center to corner)
const COLS = 7;
const ROWS = 8;

/** Flat-top axial hex → pixel center (offset layout) */
function hexToPixel(q: number, r: number): Point {
	const x = HEX_SIZE * (1.5 * q);
	const y = HEX_SIZE * (Math.sqrt(3) * r + (Math.sqrt(3) / 2) * q);
	return { x, y };
}

/**
 * The 6 axial direction vectors for a flat-top hex grid.
 * Index i corresponds to edge i (corner[i] → corner[i+1] in hexCorners).
 * Direction i is the outward neighbor across edge i.
 *
 * Corner angles (flat-top, SVG y-down): 0°, 60°, 120°, 180°, 240°, 300°
 * Edge i midpoint angle: 30° + 60°*i
 *   edge 0 = 30°  → lower-right  = [+q, +0]
 *   edge 1 = 90°  → down         = [+0, +r]
 *   edge 2 = 150° → lower-left   = [-q, +r]
 *   edge 3 = 210° → upper-left   = [-q, +0]
 *   edge 4 = 270° → up           = [+0, -r]
 *   edge 5 = 330° → upper-right  = [+q, -r]
 */
const HEX_DIRECTIONS: [number, number][] = [
	[1, 0], // edge 0: lower-right
	[0, 1], // edge 1: down
	[-1, 1], // edge 2: lower-left
	[-1, 0], // edge 3: upper-left
	[0, -1], // edge 4: up
	[1, -1], // edge 5: upper-right
];

// ─── Simple seeded PRNG (LCG) ─────────────────────────────────────────────────

function makePrng(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = Math.imul(1664525, s) + 1013904223;
		return (s >>> 0) / 0x100000000;
	};
}

// ─── Population distribution ─────────────────────────────────────────────────

interface Epicenter {
	q: number;
	r: number;
	weight: number;
	sigma: number; // spread in hex-grid units
}

function gaussianContribution(dq: number, dr: number, epi: Epicenter): number {
	// Euclidean distance in grid space
	const dx = dq;
	const dy = dr + dq * 0.5; // cube-to-2D projection
	const d2 = dx * dx + dy * dy;
	return epi.weight * Math.exp(-d2 / (2 * epi.sigma * epi.sigma));
}

// ─── Partisan lean (spatial coherence via sinusoidal gradient) ───────────────

function makePartisanField(rng: () => number): (q: number, r: number) => number {
	// Three sinusoidal components at different angles and frequencies
	const waves = [
		{
			angle: rng() * Math.PI,
			freq: 0.3 + rng() * 0.2,
			phase: rng() * Math.PI * 2,
		},
		{
			angle: rng() * Math.PI,
			freq: 0.15 + rng() * 0.15,
			phase: rng() * Math.PI * 2,
		},
		{
			angle: rng() * Math.PI,
			freq: 0.4 + rng() * 0.1,
			phase: rng() * Math.PI * 2,
		},
	];

	return (q: number, r: number) => {
		// Map axial coords to 2D projection
		const px = q;
		const py = r + q * 0.5;

		let sum = 0;
		for (const w of waves) {
			const proj = Math.cos(w.angle) * px + Math.sin(w.angle) * py;
			sum += Math.sin(w.freq * proj + w.phase);
		}
		// Normalize from [-3, 3] to [0, 1]
		return (sum / 3 + 1) / 2;
	};
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generatePrecincts(seed = 42): Precinct[] {
	const rng = makePrng(seed);
	const getLean = makePartisanField(rng);

	// Place 2–3 epicenters
	const epicenterCount = 2 + (rng() < 0.5 ? 1 : 0);
	const epicenters: Epicenter[] = [];
	for (let i = 0; i < epicenterCount; i++) {
		epicenters.push({
			q: Math.floor(rng() * COLS),
			r: Math.floor(rng() * ROWS),
			weight: 0.5 + rng() * 0.5,
			sigma: 1.5 + rng() * 2.0,
		});
	}

	// Build list of valid (q, r) coords for flat-top offset grid
	const coords: HexCoord[] = [];
	for (let q = 0; q < COLS; q++) {
		for (let r = 0; r < ROWS; r++) {
			coords.push({ q, r });
		}
	}

	// Build id lookup: "q,r" → id
	const idMap = new Map<string, number>();
	coords.forEach((c, i) => idMap.set(`${c.q},${c.r}`, i));

	const precincts: Precinct[] = coords.map(({ q, r }, id) => {
		// Population: sum of Gaussian contributions
		let pop = 0;
		for (const epi of epicenters) {
			pop += gaussianContribution(q - epi.q, r - epi.r, epi);
		}
		// Scale to integer range 500–8000
		const population = Math.round(500 + pop * 7500);

		// Partisan lean (D-lean in [0, 1])
		const dLean = getLean(q, r);

		// Map dLean to party shares with minor parties
		// D and R dominate; L, G, I share the remainder
		const minor = 0.06 + rng() * 0.08; // 6–14% total minor party
		const lShare = (rng() * 0.4 + 0.3) * minor;
		const gShare = (rng() * 0.3 + 0.2) * minor;
		const iShare = minor - lShare - gShare;
		const majorShare = 1 - minor;
		const dShare = dLean * majorShare;
		const rShare = (1 - dLean) * majorShare;

		const partyShare: PartyShare = {
			D: Math.round(dShare * 1000) / 1000,
			R: Math.round(rShare * 1000) / 1000,
			L: Math.round(lShare * 1000) / 1000,
			G: Math.round(gShare * 1000) / 1000,
			I: Math.round(iShare * 1000) / 1000,
		};

		// Normalize to exactly 1.0
		const total = partyShare.D + partyShare.R + partyShare.L + partyShare.G + partyShare.I;
		partyShare.D = Math.round((partyShare.D / total) * 1000) / 1000;
		partyShare.R = Math.round((partyShare.R / total) * 1000) / 1000;
		partyShare.L = Math.round((partyShare.L / total) * 1000) / 1000;
		partyShare.G = Math.round((partyShare.G / total) * 1000) / 1000;
		partyShare.I =
			Math.round((1 - partyShare.D - partyShare.R - partyShare.L - partyShare.G) * 1000) / 1000;

		// Prior result: winner is plurality party + small margin noise
		const parties: Array<keyof PartyShare> = ["D", "R", "L", "G", "I"];
		const winner = parties.reduce((a, b) => (partyShare[a] > partyShare[b] ? a : b));
		const second = parties
			.filter((p) => p !== winner)
			.reduce((a, b) => (partyShare[a] > partyShare[b] ? a : b));
		const margin = Math.round((partyShare[winner] - partyShare[second]) * 100) / 100;

		const previousResult: PreviousResult = { winner, margin };

		// Demographics: slight random variation around 49/49/2
		const nb = 0.015 + rng() * 0.01;
		const male = (1 - nb) * (0.48 + rng() * 0.04);
		const female = 1 - nb - male;
		const demographics: Demographics = {
			male: Math.round(male * 1000) / 1000,
			female: Math.round(female * 1000) / 1000,
			nonbinary: Math.round(nb * 1000) / 1000,
		};

		// Neighbors: fixed-length array of 6 entries (null = no neighbor / grid boundary).
		// Index i corresponds to HEX_DIRECTIONS[i] and hexCorners edge i.
		const neighbors: (number | null)[] = HEX_DIRECTIONS.map(([dq, dr]) => {
			const nKey = `${q + dq},${r + dr}`;
			const nId = idMap.get(nKey);
			return nId !== undefined ? nId : null;
		});

		const center = hexToPixel(q, r);

		return {
			id,
			coord: { q, r },
			center,
			neighbors,
			population,
			partyShare,
			previousResult,
			demographics,
		};
	});

	return precincts;
}

/**
 * Compute the 6 corner points of a flat-top hex polygon at the given center.
 * Returns points as [x, y] pairs.
 */
export function hexCorners(center: Point): [number, number][] {
	const corners: [number, number][] = [];
	for (let i = 0; i < 6; i++) {
		const angleDeg = 60 * i; // flat-top: 0°, 60°, 120°, ...
		const angleRad = (Math.PI / 180) * angleDeg;
		corners.push([
			center.x + HEX_SIZE * Math.cos(angleRad),
			center.y + HEX_SIZE * Math.sin(angleRad),
		]);
	}
	return corners;
}

/** Bounding box of all precinct centers (for SVG viewBox calculation) */
export function mapBounds(precincts: Precinct[]): {
	minX: number;
	minY: number;
	width: number;
	height: number;
} {
	const pad = HEX_SIZE * 1.2;
	const xs = precincts.map((p) => p.center.x);
	const ys = precincts.map((p) => p.center.y);
	const minX = Math.min(...xs) - pad;
	const maxX = Math.max(...xs) + pad;
	const minY = Math.min(...ys) - pad;
	const maxY = Math.max(...ys) + pad;
	return { minX, minY, width: maxX - minX, height: maxY - minY };
}
