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
 *   Final formula per precinct:
 *     total_population = round(base × suitability + settlement_bump
 *                              + prng.nextInt(-variance, variance) × suitability)
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

  const precincts = partial.precincts.map(p => {
    const suitability = suitabilities.get(p.id)!;
    const bump = settlementBumps.get(p.id) ?? 0;
    const jitter = prng.nextInt(-spec.variance, spec.variance);
    const total_population = Math.round(
      spec.base * suitability + bump + jitter * suitability,
    );
    return { ...p, total_population };
  });

  return { ...partial, precincts };
}
