/**
 * Unit tests for hex-geometry.ts (GAME-044).
 *
 * Run via Bazel:
 *   bazel test //web/src/model:hex_geometry_test
 *
 * Coverage:
 *   - hexToPixel: origin, q-axis, r-axis
 *   - hexCorners: 6 points all at HEX_SIZE distance; first corner at (center.x+36, center.y);
 *     offset center propagates
 *   - HEX_DIRECTIONS: 6 entries; each opposite pair sums to (0,0)
 *   - mapBounds: single-precinct box; two-precinct box spans both centers
 */

import { hexToPixel, hexCorners, mapBounds, HEX_DIRECTIONS } from "./hex-geometry.js";
import type { Precinct } from "./types.js";
import { test, assertEqual, assertClose, assertTrue, summarize } from "../testing/test_runner.js";

const HEX_SIZE = 36;

// ─── hexToPixel ───────────────────────────────────────────────────────────────

test("hexToPixel: origin (0,0) → {x:0, y:0}", () => {
	const p = hexToPixel(0, 0);
	assertEqual(p.x, 0, "x=0");
	assertEqual(p.y, 0, "y=0");
});

test("hexToPixel: q=1,r=0 — x = 36*1.5 = 54", () => {
	const p = hexToPixel(1, 0);
	assertClose(p.x, 54, 0.001, "x=54");
	assertClose(p.y, HEX_SIZE * (Math.sqrt(3) / 2), 0.001, "y = 36*sqrt(3)/2");
});

test("hexToPixel: q=0,r=1 — x=0, y = 36*sqrt(3)", () => {
	const p = hexToPixel(0, 1);
	assertClose(p.x, 0, 0.001, "x=0");
	assertClose(p.y, HEX_SIZE * Math.sqrt(3), 0.001, "y = 36*sqrt(3)");
});

test("hexToPixel: q=2,r=0 — x=108, y = 36*sqrt(3)", () => {
	const p = hexToPixel(2, 0);
	assertClose(p.x, 108, 0.001, "x=108");
	assertClose(p.y, HEX_SIZE * Math.sqrt(3), 0.001, "y = 36*sqrt(3)");
});

// ─── hexCorners ──────────────────────────────────────────────────────────────

test("hexCorners: returns 6 corners", () => {
	const corners = hexCorners({ x: 0, y: 0 });
	assertEqual(corners.length, 6, "6 corners");
});

test("hexCorners: all corners at distance HEX_SIZE from center", () => {
	const center = { x: 0, y: 0 };
	const corners = hexCorners(center);
	for (let i = 0; i < 6; i++) {
		const [cx, cy] = corners[i]!;
		const dist = Math.sqrt(cx * cx + cy * cy);
		assertClose(dist, HEX_SIZE, 0.001, `corner ${i} distance = 36`);
	}
});

test("hexCorners: first corner at (center.x + 36, center.y) for flat-top", () => {
	const corners = hexCorners({ x: 0, y: 0 });
	assertClose(corners[0]![0], 36, 0.001, "corner[0].x = 36");
	assertClose(corners[0]![1], 0, 0.001, "corner[0].y = 0");
});

test("hexCorners: offset center propagates to all corners", () => {
	const cx = 100;
	const cy = 50;
	const corners = hexCorners({ x: cx, y: cy });
	// First corner: angle 0° → (cx + 36, cy)
	assertClose(corners[0]![0], cx + HEX_SIZE, 0.001, "corner[0].x = cx+36");
	assertClose(corners[0]![1], cy, 0.001, "corner[0].y = cy");
	// Check all corners are still at distance HEX_SIZE from (cx, cy)
	for (let i = 0; i < 6; i++) {
		const dx = corners[i]![0] - cx;
		const dy = corners[i]![1] - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);
		assertClose(dist, HEX_SIZE, 0.001, `corner ${i} distance from offset center`);
	}
});

// ─── HEX_DIRECTIONS ──────────────────────────────────────────────────────────

test("HEX_DIRECTIONS: 6 directions", () => {
	assertEqual(HEX_DIRECTIONS.length, 6, "6 directions");
});

test("HEX_DIRECTIONS: each opposite pair sums to (0,0)", () => {
	for (let i = 0; i < 3; i++) {
		const [q1, r1] = HEX_DIRECTIONS[i]!;
		const [q2, r2] = HEX_DIRECTIONS[i + 3]!;
		assertEqual(q1 + q2, 0, `directions ${i} and ${i + 3} q-sum = 0`);
		assertEqual(r1 + r2, 0, `directions ${i} and ${i + 3} r-sum = 0`);
	}
});

// ─── mapBounds ───────────────────────────────────────────────────────────────

function makePrecinct(x: number, y: number): Precinct {
	return { center: { x, y } } as Precinct;
}

test("mapBounds: single precinct at origin — symmetric box of size 2*pad", () => {
	const pad = HEX_SIZE * 1.2;
	const bounds = mapBounds([makePrecinct(0, 0)]);
	assertClose(bounds.minX, -pad, 0.001, "minX = -pad");
	assertClose(bounds.minY, -pad, 0.001, "minY = -pad");
	assertClose(bounds.width, 2 * pad, 0.001, "width = 2*pad");
	assertClose(bounds.height, 2 * pad, 0.001, "height = 2*pad");
});

test("mapBounds: two precincts span both centers with padding on each side", () => {
	const pad = HEX_SIZE * 1.2;
	// precinct A at (0, 0), precinct B at (54, 0)
	const bounds = mapBounds([makePrecinct(0, 0), makePrecinct(54, 0)]);
	assertClose(bounds.minX, 0 - pad, 0.001, "minX");
	assertClose(bounds.minY, 0 - pad, 0.001, "minY");
	assertClose(bounds.width, 54 + 2 * pad, 0.001, "width spans 54px + 2*pad");
	assertClose(bounds.height, 2 * pad, 0.001, "height = 2*pad (same y)");
});

test("mapBounds: two precincts — correct width and height for diagonal placement", () => {
	const pad = HEX_SIZE * 1.2;
	const x2 = 54;
	const y2 = HEX_SIZE * Math.sqrt(3);
	const bounds = mapBounds([makePrecinct(0, 0), makePrecinct(x2, y2)]);
	assertClose(bounds.width, x2 + 2 * pad, 0.001, "width");
	assertClose(bounds.height, y2 + 2 * pad, 0.001, "height");
	assertTrue(bounds.width > 0, "width positive");
	assertTrue(bounds.height > 0, "height positive");
});

summarize();
