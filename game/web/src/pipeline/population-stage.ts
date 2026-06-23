/**
 * Stage 2 of the GAME-084 map generation pipeline: terrain-aware population stage.
 *
 * Assigns total_population to every precinct using a two-layer model:
 *
 *   Layer 1 — Terrain suitability (always on):
 *     Each precinct gets a multiplicative suitability score based on adjacency to
 *     terrain features (lake, sea, mountain tiles; river edges). Multiple features
 *     compose multiplicatively. Default weights: lakeside 1.4×, riverside 1.3×,
 *     coastal 0.9×, mountain-adjacent 0.5×. Overridable via terrain_weights.
 *
 *   Layer 2 — Settlement zones (optional spec):
 *     Named settlements add a Gaussian population bump centered on an anchor
 *     precinct. Anchor types: exact {q,r}, feature-based (lakeside/riverside/
 *     coastal), center, or cardinal directions.
 *
 *   Final formula per precinct (GAME-087 core):
 *     raw = base × suitability × gradient + settlement_bump + jitter × suitability
 *
 *   GAME-088 field-shaping layers (all opt-in; unset → legacy additive field):
 *     gradient   — monocentric multiplier tilting population toward an anchor
 *     smoothing  — neighbour-averaging passes on the jitter (kills salt-and-pepper)
 *     contrast   — pow(k) on the normalized field (widens dynamic range)
 *     target_total — scale the field so Σ total_population hits a target
 *                    (changes the field's shape without changing its magnitude)
 *
 * With no GAME-088 layers set, the formula reduces exactly to GAME-087's
 *   round(base × suitability + settlement_bump + jitter × suitability).
 *
 * Always overwrites existing total_population; input PartialScenario is not mutated.
 */

import type { PartialScenario } from "../model/scenario.js";
import type {
  HexPos,
  PopulationSpec,
  SettlementAnchor,
  TerrainWeightsSpec,
} from "./spec-types.js";
import { makePrng } from "./prng.js";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TERRAIN_WEIGHTS: Required<TerrainWeightsSpec> = {
  lakeside: 1.4,
  riverside: 1.3,
  coastal: 0.9,
  mountain_adjacent: 0.5,
};

// Flat-top axial hex direction vectors (same as terrain-generator.ts)
const HEX_DIRS: [number, number][] = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

// ─── Internal types ───────────────────────────────────────────────────────────

interface TerrainContext {
  lakeside: boolean;
  riverside: boolean;
  coastal: boolean;
  mountain_adjacent: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function posKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function hexDist(a: HexPos, b: HexPos): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function buildTerrainContexts(partial: PartialScenario): Map<string, TerrainContext> {
  const lake = new Set<string>();
  const sea = new Set<string>();
  const mountain = new Set<string>();

  for (const tile of partial.terrain_tiles ?? []) {
    const key = posKey(tile.position.q, tile.position.r);
    if (tile.type === "lake") lake.add(key);
    else if (tile.type === "sea") sea.add(key);
    else if (tile.type === "mountain") mountain.add(key);
  }

  const riverside = new Set<string>();
  for (const edge of partial.river_edges ?? []) {
    riverside.add(edge[0]);
    riverside.add(edge[1]);
  }

  const result = new Map<string, TerrainContext>();
  for (const p of partial.precincts) {
    const pos = p.position as HexPos;
    let isLakeside = false;
    let isCoastal = false;
    let isMountainAdj = false;
    for (const [dq, dr] of HEX_DIRS) {
      const nk = posKey(pos.q + dq, pos.r + dr);
      if (lake.has(nk)) isLakeside = true;
      if (sea.has(nk)) isCoastal = true;
      if (mountain.has(nk)) isMountainAdj = true;
    }
    result.set(p.id, {
      lakeside: isLakeside,
      riverside: riverside.has(p.id),
      coastal: isCoastal,
      mountain_adjacent: isMountainAdj,
    });
  }
  return result;
}

function computeSuitability(ctx: TerrainContext, w: Required<TerrainWeightsSpec>): number {
  let s = 1.0;
  if (ctx.lakeside) s *= w.lakeside;
  if (ctx.riverside) s *= w.riverside;
  if (ctx.coastal) s *= w.coastal;
  if (ctx.mountain_adjacent) s *= w.mountain_adjacent;
  return s;
}

// Axial-coordinate projection scores for cardinal anchor resolution
const DIRECTION_SCORE: Record<string, (q: number, r: number) => number> = {
  north:     (_q, r) => -r,
  south:     (_q, r) => r,
  east:      (q, _r) => q,
  west:      (q, _r) => -q,
  northeast: (q, r) => q - r,
  northwest: (q, r) => -(q + r),
  southeast: (q, r) => q + r,
  southwest: (q, r) => r - q,
};

function resolveAnchor(
  anchor: SettlementAnchor,
  partial: PartialScenario,
  suitabilities: Map<string, number>,
  terrainContexts: Map<string, TerrainContext>,
): HexPos {
  // Exact coordinate anchor
  if (typeof anchor === "object") {
    const { q, r } = anchor;
    const found = partial.precincts.find(p => {
      const pos = p.position as HexPos;
      return pos.q === q && pos.r === r;
    });
    if (!found) throw new Error(`No precinct at anchor position (${q}, ${r})`);
    return anchor;
  }

  const origin: HexPos = { q: 0, r: 0 };

  if (anchor === "center") {
    const best = partial.precincts.reduce((a, b) => {
      const da = hexDist(a.position as HexPos, origin);
      const db = hexDist(b.position as HexPos, origin);
      return db < da ? b : a;
    });
    return best.position as HexPos;
  }

  if (anchor === "lakeside" || anchor === "riverside" || anchor === "coastal") {
    const candidates = partial.precincts.filter(p => {
      const ctx = terrainContexts.get(p.id);
      if (!ctx) return false;
      if (anchor === "lakeside") return ctx.lakeside;
      if (anchor === "riverside") return ctx.riverside;
      return ctx.coastal;
    });
    if (candidates.length === 0) {
      throw new Error(`No ${anchor} precincts found — cannot resolve anchor`);
    }
    const best = candidates.reduce((a, b) => {
      const sa = suitabilities.get(a.id) ?? 1.0;
      const sb = suitabilities.get(b.id) ?? 1.0;
      if (sb !== sa) return sb > sa ? b : a;
      // tiebreak: closest to map center
      const da = hexDist(a.position as HexPos, origin);
      const db = hexDist(b.position as HexPos, origin);
      return db < da ? b : a;
    });
    return best.position as HexPos;
  }

  const scorer = DIRECTION_SCORE[anchor];
  if (!scorer) throw new Error(`Unknown anchor type: ${anchor}`);
  const best = partial.precincts.reduce((a, b) => {
    const pa = a.position as HexPos;
    const pb = b.position as HexPos;
    return scorer(pb.q, pb.r) > scorer(pa.q, pa.r) ? b : a;
  });
  return best.position as HexPos;
}

// ─── GAME-088 field-shaping helpers (all opt-in) ────────────────────────────────

/** Build adjacency: precinct id → ids of existing hex-adjacent neighbours. */
function buildNeighbors(partial: PartialScenario): Map<string, string[]> {
  const byPos = new Map<string, string>();
  for (const p of partial.precincts) {
    const pos = p.position as HexPos;
    byPos.set(posKey(pos.q, pos.r), p.id);
  }
  const result = new Map<string, string[]>();
  for (const p of partial.precincts) {
    const pos = p.position as HexPos;
    const neighbors: string[] = [];
    for (const [dq, dr] of HEX_DIRS) {
      const nid = byPos.get(posKey(pos.q + dq, pos.r + dr));
      if (nid !== undefined) neighbors.push(nid);
    }
    result.set(p.id, neighbors);
  }
  return result;
}

/**
 * Monocentric gradient multiplier per precinct: `1 - strength` at the rim up to
 * `1 + strength` at the anchor (mean ~1). Tilts population toward the anchor.
 */
function computeGradientMultipliers(
  partial: PartialScenario,
  anchorPos: HexPos,
  strength: number,
): Map<string, number> {
  let maxDist = 0;
  for (const p of partial.precincts) {
    const d = hexDist(p.position as HexPos, anchorPos);
    if (d > maxDist) maxDist = d;
  }
  const result = new Map<string, number>();
  for (const p of partial.precincts) {
    const d = hexDist(p.position as HexPos, anchorPos);
    const closeness = maxDist > 0 ? 1 - d / maxDist : 1; // 1 at anchor, 0 at rim
    result.set(p.id, 1 - strength + closeness * 2 * strength);
  }
  return result;
}

/**
 * Average each precinct's noise value with its neighbours, `passes` times.
 * Replaces salt-and-pepper independent jitter with a spatially-coherent field.
 * Mutates `noise` in place.
 */
function smoothNoise(
  noise: Map<string, number>,
  neighbors: Map<string, string[]>,
  passes: number,
): void {
  for (let pass = 0; pass < passes; pass++) {
    const next = new Map<string, number>();
    for (const [id, value] of noise) {
      const nbrs = neighbors.get(id) ?? [];
      let sum = value;
      for (const nid of nbrs) sum += noise.get(nid) ?? 0;
      next.set(id, sum / (nbrs.length + 1));
    }
    for (const [id, value] of next) noise.set(id, value);
  }
}

/**
 * pow-contrast on a field, anchored to its [min, max]: interior values are
 * reshaped by `n^k` while the extremes stay fixed. k>1 lightens the fringe and
 * relatively sharpens dense areas, widening the dynamic range.
 */
function applyContrast(field: Map<string, number>, k: number): Map<string, number> {
  let min = Infinity;
  let max = -Infinity;
  for (const v of field.values()) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  const result = new Map<string, number>();
  for (const [id, v] of field) {
    if (range === 0) {
      result.set(id, v);
    } else {
      const n = (v - min) / range;
      result.set(id, min + Math.pow(n, k) * range);
    }
  }
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function populateScenario(
  partial: PartialScenario,
  spec: PopulationSpec,
): PartialScenario {
  const prng = makePrng(spec.seed);

  const w: Required<TerrainWeightsSpec> = {
    lakeside: spec.terrain_weights?.lakeside ?? DEFAULT_TERRAIN_WEIGHTS.lakeside,
    riverside: spec.terrain_weights?.riverside ?? DEFAULT_TERRAIN_WEIGHTS.riverside,
    coastal: spec.terrain_weights?.coastal ?? DEFAULT_TERRAIN_WEIGHTS.coastal,
    mountain_adjacent:
      spec.terrain_weights?.mountain_adjacent ?? DEFAULT_TERRAIN_WEIGHTS.mountain_adjacent,
  };

  const terrainContexts = buildTerrainContexts(partial);
  const suitabilities = new Map<string, number>();
  for (const p of partial.precincts) {
    const ctx = terrainContexts.get(p.id)!;
    suitabilities.set(p.id, computeSuitability(ctx, w));
  }

  // Resolve settlements and accumulate Gaussian bumps per precinct
  const settlementBumps = new Map<string, number>();
  for (const settlement of spec.settlements ?? []) {
    const anchorPos = resolveAnchor(
      settlement.anchor,
      partial,
      suitabilities,
      terrainContexts,
    );
    const sigma = settlement.radius / 2;
    const twoSigmaSq = 2 * sigma * sigma;
    for (const p of partial.precincts) {
      const dist = hexDist(p.position as HexPos, anchorPos);
      const bump = settlement.peak * Math.exp(-(dist * dist) / twoSigmaSq);
      settlementBumps.set(p.id, (settlementBumps.get(p.id) ?? 0) + bump);
    }
  }

  // Gradient multipliers (GAME-088). Default 1.0 everywhere when no gradient spec.
  let gradientMul: Map<string, number> | null = null;
  if (spec.gradient && spec.gradient.strength !== 0) {
    const gradientAnchor = resolveAnchor(
      spec.gradient.anchor ?? "center",
      partial,
      suitabilities,
      terrainContexts,
    );
    gradientMul = computeGradientMultipliers(partial, gradientAnchor, spec.gradient.strength);
  }

  // Per-precinct jitter, drawn in precinct order (preserves legacy determinism:
  // with no field-shaping layers the formula reduces exactly to GAME-087's).
  const noise = new Map<string, number>();
  for (const p of partial.precincts) {
    noise.set(p.id, prng.nextInt(-spec.variance, spec.variance));
  }
  if (spec.smoothing !== undefined && spec.smoothing > 0) {
    smoothNoise(noise, buildNeighbors(partial), spec.smoothing);
  }

  // Raw field: base × suitability × gradient + settlement bump + jitter × suitability.
  let field = new Map<string, number>();
  for (const p of partial.precincts) {
    const suitability = suitabilities.get(p.id)!;
    const g = gradientMul?.get(p.id) ?? 1.0;
    const bump = settlementBumps.get(p.id) ?? 0;
    field.set(p.id, spec.base * suitability * g + bump + noise.get(p.id)! * suitability);
  }

  // Contrast: widen dynamic range so density reads as a gradient, not a flat field.
  if (spec.contrast !== undefined && spec.contrast !== 1) {
    field = applyContrast(field, spec.contrast);
  }

  // Normalize to a target total: change the shape of the field, not its magnitude.
  let scale = 1;
  if (spec.target_total !== undefined) {
    let sum = 0;
    for (const v of field.values()) sum += v;
    if (sum > 0) scale = spec.target_total / sum;
  }

  const precincts = partial.precincts.map(p => ({
    ...p,
    total_population: Math.round(field.get(p.id)! * scale),
  }));

  return { ...partial, precincts };
}
