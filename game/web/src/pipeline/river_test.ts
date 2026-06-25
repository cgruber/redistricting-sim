/**
 * Tests for river geometry (GAME-100): validation + routing.
 *
 * Run via Bazel: bazel test //game/web/src/pipeline:river_test
 */

import { generateHexCircle } from "./terrain-generator.js";
import { validateRiverEdges, routeRiver, edgeDir, cornerKey } from "./river.js";
import {
  test,
  assertEqual,
  assertThrows,
  assertDoesNotThrow,
  summarize,
} from "../testing/test_runner.js";

// ─── validateRiverEdges ───────────────────────────────────────────────────────

test("validateRiverEdges: an empty river is valid", () => {
  assertDoesNotThrow(() => validateRiverEdges(generateHexCircle(2), [], []));
});

test("validateRiverEdges: an isolated mid-map segment is a loose end (throws)", () => {
  const pos = generateHexCircle(2);
  // (0,0) (centre) ↔ (1,0): both corners of the shared edge are ringed by 3 precincts → loose ends.
  assertThrows(
    () => validateRiverEdges(pos, [[{ q: 0, r: 0 }, { q: 1, r: 0 }]], []),
    /loose end/i,
  );
});

test("validateRiverEdges: a routed rim-to-rim river is valid", () => {
  const pos = generateHexCircle(4);
  const river = routeRiver(pos, { q: 0, r: -4 }, { q: 0, r: 4 });
  assertDoesNotThrow(() => validateRiverEdges(pos, river, []));
});

// ─── routeRiver ─────────────────────────────────────────────────────────────

test("routeRiver: returns a non-empty chain of adjacent precinct pairs", () => {
  const pos = generateHexCircle(4);
  const river = routeRiver(pos, { q: 0, r: -4 }, { q: 0, r: 4 });
  assertEqual(river.length > 0, true);
  for (const [a, b] of river) assertEqual(edgeDir(a, b) >= 0, true);
});

test("routeRiver: consecutive segments share a hex corner (the river is connected)", () => {
  const pos = generateHexCircle(5);
  const river = routeRiver(pos, { q: -5, r: 0 }, { q: 5, r: 0 }); // west → east

  // Corner pair for each segment (a,b) is corner[d], corner[d+1] of a.
  const cornersOf = (a: { q: number; r: number }, b: { q: number; r: number }): [string, string] => {
    const d = edgeDir(a, b);
    return [cornerKey(a.q, a.r, d), cornerKey(a.q, a.r, (d + 1) % 6)];
  };
  for (let i = 1; i < river.length; i++) {
    const prev = new Set(cornersOf(river[i - 1]![0], river[i - 1]![1]));
    const cur = cornersOf(river[i]![0], river[i]![1]);
    assertEqual(prev.has(cur[0]) || prev.has(cur[1]), true);
  }
});

test("routeRiver: a river across a radius-3 map is valid", () => {
  const pos = generateHexCircle(3);
  const river = routeRiver(pos, { q: 0, r: -3 }, { q: 2, r: 1 });
  assertEqual(river.length > 0, true);
  assertDoesNotThrow(() => validateRiverEdges(pos, river, []));
});

test("routeRiver: coincident termini fail fast (no silent empty river)", () => {
  const pos = generateHexCircle(3);
  // Both anchors resolve to the same nearest boundary corner → can't bound a chain.
  assertThrows(() => routeRiver(pos, { q: 0, r: -3 }, { q: 0, r: -3 }), /same .*corner/i);
});

test("routeRiver: a via waypoint bends the path through it with no doubled-back spur", () => {
  const pos = generateHexCircle(5);
  const via = { q: 0, r: -3 }; // a north waypoint pulls the W→E river up through it
  const river = routeRiver(pos, { q: -5, r: 0 }, { q: 5, r: 0 }, [via]);

  // No segment is immediately retraced (the fix for the in-and-out spur at the waypoint).
  for (let i = 1; i < river.length; i++) {
    const a = river[i - 1]!, b = river[i]!;
    const same =
      a[0].q === b[0].q && a[0].r === b[0].r && a[1].q === b[1].q && a[1].r === b[1].r;
    assertEqual(same, false);
  }

  // The path actually passes through the waypoint's neighbourhood (within one hex of it).
  const hexDist = (p: { q: number; r: number }, x: { q: number; r: number }) =>
    (Math.abs(p.q - x.q) + Math.abs(p.r - x.r) + Math.abs(p.q + p.r - x.q - x.r)) / 2;
  const near = river.some(([a, b]) => hexDist(a, via) <= 1 || hexDist(b, via) <= 1);
  assertEqual(near, true);

  assertDoesNotThrow(() => validateRiverEdges(pos, river, []));
});

summarize();
