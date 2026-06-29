/**
 * Stage 3b of the GAME-084 pipeline: population-aware county assignment (GAME-089).
 *
 * Replaces the old geometric `county_labels` slices with cosmetic county
 * boundaries that follow the population field, so counties wrap population
 * centers the way real US counties do. `county_id` is purely cosmetic — it drives
 * only the dashed county-border overlay, never contiguity/scoring/districting.
 *
 * One algorithm — seeded priority-queue flood-fill — parametrized by a named
 * `model` preset. See thoughts/shared/research/2026-06-22-us-county-formation-patterns.md
 * §RECOMMENDED_HEURISTIC. Principles: counties are unequal by design (the target
 * count only sets how many seeds to drop, never balances them); the region clips
 * counties at the map edge (a deliberate game simplification).
 *
 *   seat_and_hinterland (default) — each seed's flood-grown region is one county.
 *   city_county                   — the densest center's core is carved as its own
 *                                   county; the rest is absorbed by the other seeds.
 *   split_metro                   — the densest center is split across seeds.
 */

import type { PartialScenario, PartialPrecinct } from "../model/scenario.js";
import type { CountiesSpec, CountyModel, HexPos } from "./spec-types.js";

// Flat-top axial hex direction vectors (same as terrain-generator / population-stage).
const HEX_DIRS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[0, -1],
	[1, -1],
];

const DEFAULTS = {
	catchment_radius: 2,
	anchor_threshold: 0.15,
	dominant_threshold: 0.4,
	core_density: 0.5,
	trough_weight: 0.5,
	feature_weight: 1.0,
};

// ─── Geometry helpers ───────────────────────────────────────────────────────────

function posKey(q: number, r: number): string {
	return `${q},${r}`;
}

function pos(p: PartialPrecinct): HexPos {
	return p.position as HexPos;
}

function hexDist(a: HexPos, b: HexPos): number {
	const dq = a.q - b.q;
	const dr = a.r - b.r;
	return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Adjacency: precinct id → ids of existing hex-adjacent neighbours. */
function buildNeighbors(precincts: PartialPrecinct[]): Map<string, string[]> {
	const byPos = new Map<string, string>();
	for (const p of precincts) byPos.set(posKey(pos(p).q, pos(p).r), p.id);
	const result = new Map<string, string[]>();
	for (const p of precincts) {
		const here = pos(p);
		const ns: string[] = [];
		for (const [dq, dr] of HEX_DIRS) {
			const nid = byPos.get(posKey(here.q + dq, here.r + dr));
			if (nid !== undefined) ns.push(nid);
		}
		result.set(p.id, ns);
	}
	return result;
}

/**
 * Cardinal direction (4-way) of a position relative to the map centre, for
 * naming. Kept to N/S/E/W so county names read cleanly ("Clearwater East" rather
 * than "Clearwater Northeast"); seats very near the centre name "central".
 */
function cardinal(p: HexPos): string {
	if (Math.abs(p.q) <= 1 && Math.abs(p.r) <= 1 && Math.abs(p.q + p.r) <= 1) return "central";
	const scores: [string, number][] = [
		["east", p.q],
		["west", -p.q],
		["north", -p.r],
		["south", p.r],
	];
	scores.sort((a, b) => b[1] - a[1]);
	return scores[0]![0];
}

// ─── Centers & seeds ────────────────────────────────────────────────────────────

interface Center {
	id: string;
	pos: HexPos;
	pop: number; // precinct population at the center
	catchment: number; // summed population within catchment_radius
}

function popOf(p: PartialPrecinct): number {
	return p.total_population ?? 0;
}

/** Local maxima: precincts whose population is ≥ all neighbours'. */
function localMaxima(
	precincts: PartialPrecinct[],
	neighbors: Map<string, string[]>,
): PartialPrecinct[] {
	const byId = new Map<string, PartialPrecinct>(precincts.map((p) => [p.id, p]));
	return precincts.filter((p) => {
		const mine = popOf(p);
		return (neighbors.get(p.id) ?? []).every((nid) => popOf(byId.get(nid)!) <= mine);
	});
}

function catchmentPop(center: HexPos, precincts: PartialPrecinct[], radius: number): number {
	let sum = 0;
	for (const p of precincts) if (hexDist(pos(p), center) <= radius) sum += popOf(p);
	return sum;
}

/**
 * Choose county seeds: start from population local maxima, enforce a minimum
 * separation, then greedily top up to the target count with the highest-population
 * precincts that respect separation. Always returns at least one seed.
 */
function selectSeeds(
	precincts: PartialPrecinct[],
	neighbors: Map<string, string[]>,
	radius: number,
	targetCount: number,
): Center[] {
	const byId = new Map<string, PartialPrecinct>(precincts.map((p) => [p.id, p]));
	const mkCenter = (p: PartialPrecinct): Center => ({
		id: p.id,
		pos: pos(p),
		pop: popOf(p),
		catchment: catchmentPop(pos(p), precincts, radius),
	});

	const farEnough = (p: PartialPrecinct, chosen: Center[]) =>
		chosen.every((c) => hexDist(pos(p), c.pos) >= radius);

	const seeds: Center[] = [];
	// 1) Local maxima, densest first, respecting separation.
	const maxima = localMaxima(precincts, neighbors).sort((a, b) => popOf(b) - popOf(a));
	for (const p of maxima) {
		if (seeds.length >= targetCount) break;
		if (farEnough(p, seeds)) seeds.push(mkCenter(p));
	}
	// 2) Top up with the highest-population precincts that respect separation.
	if (seeds.length < targetCount) {
		const rest = precincts
			.filter((p) => !seeds.some((c) => c.id === p.id))
			.sort((a, b) => popOf(b) - popOf(a));
		for (const p of rest) {
			if (seeds.length >= targetCount) break;
			if (farEnough(p, seeds)) seeds.push(mkCenter(p));
		}
	}
	if (seeds.length === 0 && precincts.length > 0) {
		// Degenerate fallback: single densest precinct.
		const densest = precincts.reduce((a, b) => (popOf(b) > popOf(a) ? b : a));
		seeds.push(mkCenter(densest));
	}
	return seeds;
}

// ─── Flood-fill ─────────────────────────────────────────────────────────────────

interface FloodOpts {
	precincts: PartialPrecinct[];
	neighbors: Map<string, string[]>;
	riverEdges: Set<string>; // "a|b" unordered keys
	troughWeight: number;
	featureWeight: number;
	excluded?: Set<string>; // precincts already claimed (e.g. carved core)
}

function edgeKey(a: string, b: string): string {
	return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Multi-source Dijkstra flood-fill. Returns precinctId → seedId (the county it
 * was claimed by). Cost to cross into a neighbour rises in population troughs and
 * across river/feature edges, so borders settle in valleys and along rivers.
 */
function floodFill(seeds: string[], opts: FloodOpts): Map<string, string> {
	const { precincts, neighbors, riverEdges, troughWeight, featureWeight, excluded } = opts;
	const byId = new Map<string, PartialPrecinct>(precincts.map((p) => [p.id, p]));
	let min = Number.POSITIVE_INFINITY,
		max = Number.NEGATIVE_INFINITY;
	for (const p of precincts) {
		if (excluded?.has(p.id)) continue;
		const v = popOf(p);
		if (v < min) min = v;
		if (v > max) max = v;
	}
	const range = max - min || 1;

	const owner = new Map<string, string>();
	const best = new Map<string, number>();
	// Simple array-based priority queue (small graphs: ~100 nodes).
	const frontier: { id: string; cost: number; seed: string }[] = [];
	for (const s of seeds) {
		frontier.push({ id: s, cost: 0, seed: s });
		best.set(s, 0);
	}
	while (frontier.length > 0) {
		let mi = 0;
		for (let i = 1; i < frontier.length; i++) if (frontier[i]!.cost < frontier[mi]!.cost) mi = i;
		const cur = frontier.splice(mi, 1)[0]!;
		if (owner.has(cur.id)) continue;
		owner.set(cur.id, cur.seed);
		for (const nid of neighbors.get(cur.id) ?? []) {
			if (owner.has(nid) || excluded?.has(nid)) continue;
			const np = byId.get(nid)!;
			const trough = troughWeight * (1 - (popOf(np) - min) / range);
			const feature = riverEdges.has(edgeKey(cur.id, nid)) ? featureWeight : 0;
			const cost = cur.cost + 1 + trough + feature;
			if (cost < (best.get(nid) ?? Number.POSITIVE_INFINITY)) {
				best.set(nid, cost);
				frontier.push({ id: nid, cost, seed: cur.seed });
			}
		}
	}
	return owner;
}

/**
 * Carve the urban core around a center: flood out from the peak through precincts
 * whose population clears a density contour, staying contiguous. The contour is
 * range-relative — `min + coreDensity × (peak − min)` — so "out to a certain
 * density" means the same thing whether the field is steep or flat (a peak-
 * relative cutoff would swallow the whole map on a gentle gradient). Returns the
 * core precinct ids.
 */
function carveCore(
	center: Center,
	precincts: PartialPrecinct[],
	neighbors: Map<string, string[]>,
	coreDensity: number,
): Set<string> {
	const byId = new Map<string, PartialPrecinct>(precincts.map((p) => [p.id, p]));
	let gmin = Number.POSITIVE_INFINITY;
	for (const p of precincts) {
		const v = popOf(p);
		if (v < gmin) gmin = v;
	}
	const threshold = gmin + coreDensity * (center.pop - gmin);
	const core = new Set<string>([center.id]);
	const queue = [center.id];
	while (queue.length > 0) {
		const id = queue.shift()!;
		for (const nid of neighbors.get(id) ?? []) {
			if (core.has(nid)) continue;
			if (popOf(byId.get(nid)!) >= threshold) {
				core.add(nid);
				queue.push(nid);
			}
		}
	}
	return core;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function assignCountiesByPopulation(
	partial: PartialScenario,
	spec: CountiesSpec,
): PartialScenario {
	const precincts = partial.precincts;
	if (precincts.length === 0) return partial;

	const model: CountyModel = spec.model ?? "seat_and_hinterland";
	const radius = spec.catchment_radius ?? DEFAULTS.catchment_radius;
	const targetCount = spec.target_count ?? Math.max(1, Math.round(precincts.length / 14));
	const dominantThreshold = spec.dominant_threshold ?? DEFAULTS.dominant_threshold;
	const coreDensity = spec.core_density ?? DEFAULTS.core_density;
	const troughWeight = spec.trough_weight ?? DEFAULTS.trough_weight;
	const featureWeight = spec.feature_weight ?? DEFAULTS.feature_weight;
	const prefix = spec.id_prefix ?? partial.region?.id ?? "county";

	const neighbors = buildNeighbors(precincts);
	const total = precincts.reduce((s, p) => s + popOf(p), 0);

	const riverEdges = new Set<string>();
	for (const [a, b] of partial.river_edges ?? []) riverEdges.add(edgeKey(a, b));

	const seeds = selectSeeds(precincts, neighbors, radius, targetCount);
	seeds.sort((a, b) => b.catchment - a.catchment); // densest first

	// Identify dominant centers (eligible for core carving). When the author picks
	// city_county explicitly, the single largest center is treated as dominant even
	// if it doesn't clear the threshold — the named model is the intent.
	const dominant = new Set<string>();
	if (model === "city_county" || model === "split_metro") {
		for (const c of seeds) if (c.catchment >= dominantThreshold * total) dominant.add(c.id);
		if (dominant.size === 0 && seeds.length > 0) dominant.add(seeds[0]!.id);
	}

	const ownerToCounty = new Map<string, string>(); // seedId → county id
	const coreCounties = new Map<string, Set<string>>(); // county id → precinct ids (carved cores)
	const usedNames = new Map<string, number>();
	const countyNames = new Map<string, string>(); // county id → human display name
	const titleCase = (s: string): string =>
		s
			.split(/[_\s]+/)
			.filter(Boolean)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");
	const nameFor = (base: string): string => {
		const n = usedNames.get(base) ?? 0;
		usedNames.set(base, n + 1);
		const id = n === 0 ? `${prefix}_${base}` : `${prefix}_${base}${n + 1}`;
		const display = `${titleCase(prefix)} ${titleCase(base)}` + (n === 0 ? "" : ` ${n + 1}`);
		countyNames.set(id, display);
		return id;
	};

	const assignment = new Map<string, string>(); // precinctId → county id

	if (model === "city_county") {
		// Carve each dominant center's core; flood the remainder from the OTHER seeds.
		const excluded = new Set<string>();
		for (const c of seeds) {
			if (!dominant.has(c.id)) continue;
			const core = carveCore(c, precincts, neighbors, coreDensity);
			const cid = nameFor("city");
			coreCounties.set(cid, core);
			for (const id of core) {
				assignment.set(id, cid);
				excluded.add(id);
			}
		}
		const ringSeeds = seeds.filter((c) => !dominant.has(c.id));
		if (ringSeeds.length === 0) {
			// No non-dominant anchors: the non-core remainder becomes one hinterland county.
			const cid = nameFor("hinterland");
			for (const p of precincts) if (!excluded.has(p.id)) assignment.set(p.id, cid);
		} else {
			for (const c of ringSeeds) ownerToCounty.set(c.id, nameFor(cardinal(c.pos)));
			const owner = floodFill(
				ringSeeds.map((c) => c.id),
				{
					precincts,
					neighbors,
					riverEdges,
					troughWeight,
					featureWeight,
					excluded,
				},
			);
			for (const [pid, seedId] of owner) assignment.set(pid, ownerToCounty.get(seedId)!);
		}
	} else {
		// seat_and_hinterland (and split_metro's base): one county per seed.
		const fillSeeds = seeds.map((c) => c.id);
		if (model === "split_metro") {
			// Add a second seed inside each dominant center to split the metro.
			for (const c of seeds) {
				if (!dominant.has(c.id)) continue;
				const ring = neighbors.get(c.id) ?? [];
				const extra = ring.find((nid) => !fillSeeds.includes(nid));
				if (extra) {
					fillSeeds.push(extra);
					ownerToCounty.set(extra, nameFor(`${cardinal(c.pos)}_metro`));
				}
			}
		}
		for (const c of seeds) {
			if (!ownerToCounty.has(c.id)) ownerToCounty.set(c.id, nameFor(cardinal(c.pos)));
		}
		const owner = floodFill(fillSeeds, {
			precincts,
			neighbors,
			riverEdges,
			troughWeight,
			featureWeight,
		});
		for (const [pid, seedId] of owner) assignment.set(pid, ownerToCounty.get(seedId)!);
	}

	// Orphan sweep: any precinct the fill never reached → the county of its nearest
	// already-assigned precinct (never mints a new county, so no stray singletons).
	const assignedSnapshot = precincts.filter((p) => assignment.has(p.id));
	for (const p of precincts) {
		if (assignment.has(p.id)) continue;
		let best: PartialPrecinct | null = null;
		let bestD = Number.POSITIVE_INFINITY;
		for (const q of assignedSnapshot) {
			const d = hexDist(pos(p), pos(q));
			if (d < bestD) {
				bestD = d;
				best = q;
			}
		}
		if (best) assignment.set(p.id, assignment.get(best.id)!);
	}

	const out = precincts.map((p) => {
		const cid = assignment.get(p.id)!;
		const name = countyNames.get(cid);
		return name !== undefined
			? { ...p, county_id: cid, county_name: name }
			: { ...p, county_id: cid };
	});
	return { ...partial, precincts: out };
}
