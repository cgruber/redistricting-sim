import type { HexCoord, Point, Precinct } from "./types.js";

export type { HexCoord };

const HEX_SIZE = 36; // pixel radius (center to corner)

/** Flat-top axial hex → pixel center (offset layout) */
export function hexToPixel(q: number, r: number): Point {
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
export const HEX_DIRECTIONS: [number, number][] = [
	[1, 0], // edge 0: lower-right
	[0, 1], // edge 1: down
	[-1, 1], // edge 2: lower-left
	[-1, 0], // edge 3: upper-left
	[0, -1], // edge 4: up
	[1, -1], // edge 5: upper-right
];

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
