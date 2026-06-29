/**
 * River geometry for the terrain stage (GAME-100): validation + routing.
 *
 * A `river_edge` is a pair of adjacent precincts; the renderer draws the **shared hex edge**
 * between them (a boundary segment), and consecutive segments form a flowing river only when
 * they meet at a shared hex corner (vertex). This module:
 *
 *   - validateRiverEdges() — rejects "loose ends": a river endpoint (a degree-1 corner) must sit
 *     on a boundary (the map rim, or adjacent to a non-precinct tile — mountain/sea/lake), i.e.
 *     flow off-map or end in water. A corner ringed by 3 precincts is a mid-land loose end and
 *     is per-se invalid. (Interior chain vertices are degree ≥ 2 — fine.)
 *   - routeRiver() — generates a connected chain of river edges from a source toward a sink, by
 *     walking the internal hex-edge graph; the result is valid by construction.
 *
 * Geometry matches game/web/src/model/hex-geometry.ts (FLAT-TOP, HEX_SIZE = 36):
 *   center(q,r) = (54q, 36·(√3·r + (√3/2)·q));  corner i = center + 36·(cos 60i°, sin 60i°)
 *   HEX_DIRECTIONS[d] is the neighbor across edge d = corner[d] → corner[d+1].
 */

import type { HexPos, SettlementAnchor } from "./spec-types.js";

const HEX_DIRS: [number, number][] = [
	[1, 0],
	[0, 1],
	[-1, 1],
	[-1, 0],
	[0, -1],
	[1, -1],
];

const SIZE = 36;
const SQRT3 = Math.sqrt(3);

function centerOf(q: number, r: number): [number, number] {
	return [SIZE * 1.5 * q, SIZE * (SQRT3 * r + (SQRT3 / 2) * q)];
}

/** Quantized key for corner i of hex (q,r) — quantization lets segments from different cells
 *  that touch the same physical vertex compare equal (mirrors the renderer's chain-building). */
export function cornerKey(q: number, r: number, i: number): string {
	const [cx, cy] = centerOf(q, r);
	const a = (Math.PI / 180) * (60 * i);
	return `${Math.round(cx + SIZE * Math.cos(a))},${Math.round(cy + SIZE * Math.sin(a))}`;
}

function posKey(q: number, r: number): string {
	return `${q},${r}`;
}

/** Direction index d such that b = a + HEX_DIRS[d], or -1 if not adjacent. */
export function edgeDir(a: HexPos, b: HexPos): number {
	return HEX_DIRS.findIndex(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
}

/** The two corner keys of the shared edge between precinct `a` and its neighbor in direction d. */
function edgeCornerKeys(a: HexPos, d: number): [string, string] {
	return [cornerKey(a.q, a.r, d), cornerKey(a.q, a.r, (d + 1) % 6)];
}

/**
 * Throw if any river endpoint is a mid-land loose end. `positions` is the precinct set;
 * `tiles` are non-precinct terrain tiles (their corners count as boundary, like the rim).
 */
export function validateRiverEdges(
	positions: HexPos[],
	edges: [HexPos, HexPos][],
	_tiles: HexPos[] = [],
): void {
	if (edges.length === 0) return;

	// corner → number of precincts that have it as a corner. < 3 ⇒ the corner is on the boundary
	// of the precinct area (the rim, or adjacent to a non-precinct cell such as a terrain tile).
	const cornerPrecincts = new Map<string, number>();
	for (const p of positions) {
		for (let i = 0; i < 6; i++) {
			const k = cornerKey(p.q, p.r, i);
			cornerPrecincts.set(k, (cornerPrecincts.get(k) ?? 0) + 1);
		}
	}

	// Degree of each corner across the river's segments.
	const degree = new Map<string, number>();
	for (const [a, b] of edges) {
		const d = edgeDir(a, b);
		if (d < 0) continue; // adjacency is validated separately
		for (const k of edgeCornerKeys(a, d)) degree.set(k, (degree.get(k) ?? 0) + 1);
	}

	for (const [corner, deg] of degree) {
		if (deg !== 1) continue; // interior chain vertex — fine
		const ringed = (cornerPrecincts.get(corner) ?? 0) >= 3;
		if (ringed) {
			throw new Error(
				`River has a loose end at corner ${corner}: a river must flow off-map, end in water ` +
					`(sea/lake), or join another river segment — not stop mid-land.`,
			);
		}
	}
}

// ─── Routing ────────────────────────────────────────────────────────────────

interface InternalEdge {
	a: HexPos;
	b: HexPos;
	c0: string;
	c1: string;
}

// Projection scores for cardinal anchors (mirrors population-stage's DIRECTION_SCORE).
const DIR_SCORE: Record<string, (q: number, r: number) => number> = {
	north: (_q, r) => -r,
	south: (_q, r) => r,
	east: (q, _r) => q,
	west: (q, _r) => -q,
	northeast: (q, r) => q - r,
	northwest: (q, r) => -(q + r),
	southeast: (q, r) => q + r,
	southwest: (q, r) => r - q,
};

/**
 * Resolve a river `from`/`to` anchor to a precinct position: an exact `{q,r}`, `center`, or a
 * cardinal direction (the extreme precinct in that direction). Throws for unsupported anchors
 * (e.g. the population-only `lakeside`/`riverside`/`coastal`).
 */
export function resolveRiverAnchor(anchor: SettlementAnchor, positions: HexPos[]): HexPos {
	if (typeof anchor === "object") return { q: anchor.q, r: anchor.r };
	if (anchor === "center") {
		const dist = (p: HexPos) => Math.abs(p.q) + Math.abs(p.r) + Math.abs(p.q + p.r);
		return positions.reduce((a, b) => (dist(b) < dist(a) ? b : a));
	}
	const score = DIR_SCORE[anchor];
	if (!score) {
		throw new Error(
			`river anchor "${anchor}" is not supported — use a cardinal direction, "center", or {q,r}`,
		);
	}
	return positions.reduce((a, b) => (score(b.q, b.r) > score(a.q, a.r) ? b : a));
}

/** Build the internal hex-edge graph: one entry per precinct↔precinct boundary (deduped). */
function internalEdges(positions: HexPos[]): InternalEdge[] {
	const set = new Set(positions.map((p) => posKey(p.q, p.r)));
	const seen = new Set<string>();
	const out: InternalEdge[] = [];
	for (const p of positions) {
		for (let d = 0; d < 6; d++) {
			const nb = { q: p.q + HEX_DIRS[d]![0], r: p.r + HEX_DIRS[d]![1] };
			if (!set.has(posKey(nb.q, nb.r))) continue;
			const pair = [posKey(p.q, p.r), posKey(nb.q, nb.r)].sort().join("|");
			if (seen.has(pair)) continue;
			seen.add(pair);
			const [c0, c1] = edgeCornerKeys(p, d);
			out.push({ a: { q: p.q, r: p.r }, b: nb, c0, c1 });
		}
	}
	return out;
}

/** Squared pixel distance from corner key to a hex center (for nearest-corner selection). */
function distToCenter(cornerK: string, q: number, r: number): number {
	const [cx, cy] = centerOf(q, r);
	const [x, y] = cornerK.split(",").map(Number) as [number, number];
	return (x - cx) ** 2 + (y - cy) ** 2;
}

/**
 * Route a connected river from near `from` to near `to`, walking internal hex edges so the
 * result chains vertex-to-vertex and terminates at boundary corners (off-map). Optional `vias`
 * are interior waypoints the river threads through in order (each snapped to the nearest routable
 * corner) — use them to shape a deliberate bend rather than the shortest straight run. Returns the
 * river edges as precinct (q,r) pairs in path order. Throws if no path exists.
 */
export function routeRiver(
	positions: HexPos[],
	from: HexPos,
	to: HexPos,
	vias: HexPos[] = [],
): [HexPos, HexPos][] {
	const edges = internalEdges(positions);
	if (edges.length === 0) return [];

	const cornerPrecincts = new Map<string, number>();
	for (const p of positions)
		for (let i = 0; i < 6; i++) {
			const k = cornerKey(p.q, p.r, i);
			cornerPrecincts.set(k, (cornerPrecincts.get(k) ?? 0) + 1);
		}
	// Routable termini: boundary corners shared by exactly 2 precincts — these sit on the rim (or
	// against a tile) AND have an incident internal edge to anchor the chain. count==1 corners are
	// outer tips with no internal edge (isolated in the graph), so a river can't start/end there.
	const boundary = [...cornerPrecincts.keys()].filter((k) => (cornerPrecincts.get(k) ?? 0) === 2);

	// corner → incident internal-edge indices
	const inc = new Map<string, number[]>();
	edges.forEach((e, i) => {
		(inc.get(e.c0) ?? inc.set(e.c0, []).get(e.c0)!).push(i);
		(inc.get(e.c1) ?? inc.set(e.c1, []).get(e.c1)!).push(i);
	});
	const routable = [...inc.keys()]; // any corner with an incident internal edge — valid waypoint

	const nearestIn = (corners: string[], q: number, r: number): string =>
		corners.reduce((best, k) => (distToCenter(k, q, r) < distToCenter(best, q, r) ? k : best));

	const start = nearestIn(boundary, from.q, from.r);
	const goal = nearestIn(boundary, to.q, to.r);
	// Fail fast rather than silently emit no river: coincident termini can't bound a chain.
	if (start === goal) {
		throw new Error(
			`routeRiver: from (${from.q},${from.r}) and to (${to.q},${to.r}) resolve to the same ` +
				`boundary corner ${start} — choose endpoints on different sides of the map.`,
		);
	}

	// Corner sequence to thread through: rim start → each waypoint (nearest routable corner) → rim goal.
	const sequence = [start, ...vias.map((v) => nearestIn(routable, v.q, v.r)), goal];

	// BFS shortest edge-path between two corners over the internal-edge graph. `banned` is the edge
	// by which the previous leg arrived at `s`; forbidding it as the first hop stops the river from
	// immediately retracing that segment (a doubled spur), making the waypoint a true pass-through.
	const bfsPath = (s: string, g: string, banned: number): number[] => {
		if (s === g) return [];
		const prevCorner = new Map<string, string>();
		const prevEdge = new Map<string, number>();
		const queue: string[] = [s];
		prevCorner.set(s, s);
		while (queue.length > 0) {
			const cur = queue.shift()!;
			if (cur === g) break;
			for (const ei of inc.get(cur) ?? []) {
				if (cur === s && ei === banned) continue; // don't retrace the arrival edge out of s
				const e = edges[ei]!;
				const other = e.c0 === cur ? e.c1 : e.c0;
				if (!prevCorner.has(other)) {
					prevCorner.set(other, cur);
					prevEdge.set(other, ei);
					queue.push(other);
				}
			}
		}
		if (!prevCorner.has(g)) {
			if (banned >= 0) return bfsPath(s, g, -1); // dead-end waypoint: allow the retrace rather than fail
			throw new Error(`routeRiver: no connected path between corners ${s} and ${g}`);
		}
		const path: number[] = [];
		let c = g;
		while (c !== s) {
			path.push(prevEdge.get(c)!);
			c = prevCorner.get(c)!;
		}
		path.reverse();
		return path;
	};

	const edgeIdx: number[] = [];
	let lastEdge = -1;
	for (let i = 1; i < sequence.length; i++) {
		const seg = bfsPath(sequence[i - 1]!, sequence[i]!, lastEdge);
		edgeIdx.push(...seg);
		if (seg.length > 0) lastEdge = seg[seg.length - 1]!;
	}

	return edgeIdx.map((ei) => [edges[ei]!.a, edges[ei]!.b] as [HexPos, HexPos]);
}
