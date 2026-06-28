/**
 * Scenario JSON loader and validator.
 *
 * Three exported entry points:
 *
 *  `parseScenario(json: unknown): PartialScenario`
 *    Structural parse: validates types and invariants that can be checked with
 *    partial data (geometry consistency, unique IDs, context precincts, terrain).
 *    Tolerates absent gameplay fields (parties, districts, population, demographics).
 *    Use for pipeline intermediates and terrain-preview rendering.
 *
 *  `validateScenarioComplete(partial: PartialScenario): Scenario`
 *    Completeness validation + full invariant check + auto-fill + assembly.
 *    Throws if any gameplay field is absent. Call at game-start.
 *
 *  `loadScenario(json: unknown): Scenario`
 *    Combined convenience: parseScenario + validateScenarioComplete.
 *    Equivalent to the pre-GAME-084 single entry point; all callers continue to work.
 *
 * Every error message names the invariant number and identifies the offending
 * element so the caller knows where the violation is.
 */

import type {
  CharacterType,
  CriterionId,
  DemographicEvent,
  DemographicGroup,
  District,
  DistrictId,
  EventId,
  GroupFilter,
  GroupId,
  GroupSchema,
  Narrative,
  Party,
  PartyId,
  PartialPrecinct,
  PartialScenario,
  Precinct,
  PrecinctId,
  RegionSpec,
  Scenario,
  ScenarioId,
  ScenarioRules,
  Slide,
  StateContext,
  SuccessCriterion,
  GeometrySpec,
  TerrainTile,
} from "./scenario.js";

import {
  requireString,
  requireNumber,
  requireBoolean,
  requireArray,
  requireObject,
} from "./runtime-types.js";

// Flat-top axial hex direction vectors (mirrors HEX_DIRECTIONS in hex-geometry.ts)
const HEX_DIRS: [number, number][] = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

// ─── Epsilon for floating-point sum checks ───────────────────────────────────

const EPSILON = 1e-6;

// Internal type used by validateScenarioInvariants: all fields required (post-completeness-check).
type RawPrecinct = Omit<Precinct, "initial_district_id"> & { initial_district_id?: DistrictId | null };

// ─── Sub-parsers ─────────────────────────────────────────────────────────────

function parseRegion(raw: unknown): RegionSpec {
  const r = requireObject(raw, "region");
  return {
    id: requireString(r["id"], "region.id") as RegionSpec["id"],
    name: requireString(r["name"], "region.name"),
  };
}

function parseGeometry(raw: unknown): GeometrySpec {
  const r = requireObject(raw, "geometry");
  const type = requireString(r["type"], "geometry.type");
  if (type === "hex_axial") return { type: "hex_axial" };
  if (type === "custom") return { type: "custom" };
  throw new Error(`geometry.type: unknown value "${type}"`);
}

function parseParty(raw: unknown, idx: number): Party {
  const r = requireObject(raw, `parties[${idx}]`);
  return {
    id: requireString(r["id"], `parties[${idx}].id`) as PartyId,
    name: requireString(r["name"], `parties[${idx}].name`),
    abbreviation: requireString(r["abbreviation"], `parties[${idx}].abbreviation`),
  };
}

function parseDistrict(raw: unknown, idx: number): District {
  const r = requireObject(raw, `districts[${idx}]`);
  const d: District = {
    id: requireString(r["id"], `districts[${idx}].id`) as DistrictId,
  };
  if (r["name"] !== undefined) {
    d.name = requireString(r["name"], `districts[${idx}].name`);
  }
  return d;
}

function parseDemographicGroup(raw: unknown, precinctId: string, idx: number): DemographicGroup {
  const label = `precinct[${precinctId}].demographic_groups[${idx}]`;
  const r = requireObject(raw, label);
  const id = requireString(r["id"], `${label}.id`) as GroupId;
  const population_share = requireNumber(r["population_share"], `${label}.population_share`);
  const turnout_rate = requireNumber(r["turnout_rate"], `${label}.turnout_rate`);

  const voteSharesRaw = requireObject(r["vote_shares"], `${label}.vote_shares`);
  const vote_shares: Record<PartyId, number> = {} as Record<PartyId, number>;
  for (const [k, v] of Object.entries(voteSharesRaw)) {
    vote_shares[k as PartyId] = requireNumber(v, `${label}.vote_shares[${k}]`);
  }

  const grp: DemographicGroup = {
    id,
    population_share,
    vote_shares,
    turnout_rate,
  };

  if (r["name"] !== undefined) {
    grp.name = requireString(r["name"], `${label}.name`);
  }
  if (r["dimensions"] !== undefined) {
    const dimsRaw = requireObject(r["dimensions"], `${label}.dimensions`);
    const dims: Record<string, string> = {};
    for (const [k, v] of Object.entries(dimsRaw)) {
      dims[k] = requireString(v, `${label}.dimensions[${k}]`);
    }
    grp.dimensions = dims;
  }
  return grp;
}

function parsePrecinct(raw: unknown, idx: number): PartialPrecinct {
  const label = `precincts[${idx}]`;
  const r = requireObject(raw, label);
  const id = requireString(r["id"], `${label}.id`) as PrecinctId;
  const editable = requireBoolean(r["editable"], `${label}.editable`);

  const posRaw = requireObject(r["position"], `${label}.position`);
  let position: Precinct["position"];
  if ("q" in posRaw && "r" in posRaw) {
    position = {
      q: requireNumber(posRaw["q"], `${label}.position.q`),
      r: requireNumber(posRaw["r"], `${label}.position.r`),
    };
  } else if ("x" in posRaw && "y" in posRaw) {
    position = {
      x: requireNumber(posRaw["x"], `${label}.position.x`),
      y: requireNumber(posRaw["y"], `${label}.position.y`),
    };
  } else {
    throw new Error(`${label}.position: must have {q,r} for hex_axial or {x,y} for custom`);
  }

  const pc: PartialPrecinct = { id, editable, position };

  // total_population and demographic_groups are optional at parse time (pipeline stages)
  if (r["total_population"] !== undefined) {
    const totalPopulation = requireNumber(r["total_population"], `${label}.total_population`);
    if (totalPopulation < 0) {
      throw new Error(`${label}.total_population: expected non-negative, got ${totalPopulation}`);
    }
    pc.total_population = totalPopulation;
  }
  if (r["demographic_groups"] !== undefined) {
    const groupsRaw = requireArray(r["demographic_groups"], `${label}.demographic_groups`);
    pc.demographic_groups = groupsRaw.map((g, i) => parseDemographicGroup(g, id, i));
  }

  if (r["county_id"] !== undefined) {
    pc.county_id = requireString(r["county_id"], `${label}.county_id`);
  }
  if (r["county_name"] !== undefined) {
    pc.county_name = requireString(r["county_name"], `${label}.county_name`);
  }
  if (r["name"] !== undefined) {
    pc.name = requireString(r["name"], `${label}.name`);
  }
  if (r["tags"] !== undefined) {
    const tagsRaw = requireArray(r["tags"], `${label}.tags`);
    pc.tags = tagsRaw.map((t, i) => requireString(t, `${label}.tags[${i}]`));
  }
  if (r["neighbors"] !== undefined) {
    const nbRaw = requireArray(r["neighbors"], `${label}.neighbors`);
    pc.neighbors = nbRaw.map((n, i) => requireString(n, `${label}.neighbors[${i}]`) as PrecinctId);
  }

  // initial_district_id: absent, null, or a string
  if (r["initial_district_id"] !== undefined) {
    if (r["initial_district_id"] === null) {
      pc.initial_district_id = null;
    } else {
      pc.initial_district_id = requireString(r["initial_district_id"], `${label}.initial_district_id`) as DistrictId;
    }
  }

  return pc;
}

function parseGroupSchema(raw: unknown): GroupSchema {
  const r = requireObject(raw, "group_schema");
  const dimsRaw = requireObject(r["dimensions"], "group_schema.dimensions");
  const dimensions: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(dimsRaw)) {
    const arr = requireArray(v, `group_schema.dimensions[${k}]`);
    dimensions[k] = arr.map((x, i) => requireString(x, `group_schema.dimensions[${k}][${i}]`));
  }

  const erRaw = requireArray(r["eligibility_rules"], "group_schema.eligibility_rules");
  const eligibility_rules = erRaw.map((er, i) => {
    const e = requireObject(er, `group_schema.eligibility_rules[${i}]`);
    const ve = e["voter_eligible"];
    if (ve !== false) throw new Error(`group_schema.eligibility_rules[${i}].voter_eligible: must be false`);
    return {
      dimension: requireString(e["dimension"], `group_schema.eligibility_rules[${i}].dimension`),
      value: requireString(e["value"], `group_schema.eligibility_rules[${i}].value`),
      voter_eligible: false as const,
    };
  });

  return { dimensions, eligibility_rules };
}

function parseGroupFilter(raw: unknown, label: string): GroupFilter {
  const r = requireObject(raw, label);
  if ("group_ids" in r) {
    const arr = requireArray(r["group_ids"], `${label}.group_ids`);
    return { group_ids: arr.map((x, i) => requireString(x, `${label}.group_ids[${i}]`) as GroupId) };
  }
  if ("dimension" in r && "value" in r) {
    return {
      dimension: requireString(r["dimension"], `${label}.dimension`),
      value: requireString(r["value"], `${label}.value`),
    };
  }
  throw new Error(`${label}: group_filter must have group_ids or dimension+value`);
}

function parseEvent(raw: unknown, idx: number): DemographicEvent {
  const label = `events[${idx}]`;
  const r = requireObject(raw, label);
  const id = requireString(r["id"], `${label}.id`) as EventId;
  const type = requireString(r["type"], `${label}.type`);

  if (type === "turnout_shift") {
    return {
      id,
      type: "turnout_shift",
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      magnitude: requireNumber(r["magnitude"], `${label}.magnitude`),
    };
  }
  if (type === "vote_share_shift") {
    return {
      id,
      type: "vote_share_shift",
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      party: requireString(r["party"], `${label}.party`) as PartyId,
      delta: requireNumber(r["delta"], `${label}.delta`),
    };
  }
  if (type === "population_shift") {
    const pfRaw = requireObject(r["precinct_filter"], `${label}.precinct_filter`);
    let precinct_filter: import("./scenario.js").PrecinctFilter;
    if ("precinct_ids" in pfRaw) {
      const arr = requireArray(pfRaw["precinct_ids"], `${label}.precinct_filter.precinct_ids`);
      precinct_filter = { precinct_ids: arr.map((x, i) => requireString(x, `${label}.precinct_filter.precinct_ids[${i}]`) as PrecinctId) };
    } else if ("tags" in pfRaw) {
      const arr = requireArray(pfRaw["tags"], `${label}.precinct_filter.tags`);
      precinct_filter = { tags: arr.map((x, i) => requireString(x, `${label}.precinct_filter.tags[${i}]`)) };
    } else if ("editable_only" in pfRaw) {
      if (pfRaw["editable_only"] !== true) throw new Error(`${label}.precinct_filter.editable_only must be true`);
      precinct_filter = { editable_only: true };
    } else {
      throw new Error(`${label}.precinct_filter: must have precinct_ids, tags, or editable_only`);
    }
    return {
      id,
      type: "population_shift",
      precinct_filter,
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      delta: requireNumber(r["delta"], `${label}.delta`),
    };
  }
  throw new Error(`${label}.type: unknown event type "${type}"`);
}

function parseCriterion(raw: unknown, idx: number): SuccessCriterion {
  const label = `success_criteria[${idx}]`;
  const r = requireObject(raw, label);
  const id = requireString(r["id"], `${label}.id`) as CriterionId;
  const required = requireBoolean(r["required"], `${label}.required`);
  const description = requireString(r["description"], `${label}.description`);
  const cRaw = requireObject(r["criterion"], `${label}.criterion`);
  const cType = requireString(cRaw["type"], `${label}.criterion.type`);

  let criterion: import("./scenario.js").Criterion;
  switch (cType) {
    case "seat_count":
      criterion = {
        type: "seat_count",
        party: requireString(cRaw["party"], `${label}.criterion.party`) as PartyId,
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`) as import("./scenario.js").CompareOp,
        count: requireNumber(cRaw["count"], `${label}.criterion.count`),
      };
      break;
    case "majority_minority":
      criterion = {
        type: "majority_minority",
        group_filter: parseGroupFilter(cRaw["group_filter"], `${label}.criterion.group_filter`),
        min_eligible_share: requireNumber(cRaw["min_eligible_share"], `${label}.criterion.min_eligible_share`),
        min_districts: requireNumber(cRaw["min_districts"], `${label}.criterion.min_districts`),
      };
      break;
    case "efficiency_gap":
      criterion = {
        type: "efficiency_gap",
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`) as import("./scenario.js").CompareOp,
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`),
      };
      break;
    case "mean_median":
      criterion = {
        type: "mean_median",
        party: requireString(cRaw["party"], `${label}.criterion.party`) as PartyId,
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`) as import("./scenario.js").CompareOp,
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`),
      };
      break;
    case "compactness":
      criterion = {
        type: "compactness",
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`) as import("./scenario.js").CompareOp,
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`),
      };
      break;
    case "safe_seats":
      criterion = {
        type: "safe_seats",
        party: requireString(cRaw["party"], `${label}.criterion.party`) as PartyId,
        margin: requireNumber(cRaw["margin"], `${label}.criterion.margin`),
        min_count: requireNumber(cRaw["min_count"], `${label}.criterion.min_count`),
      };
      break;
    case "competitive_seats":
      criterion = {
        type: "competitive_seats",
        margin: requireNumber(cRaw["margin"], `${label}.criterion.margin`),
        min_count: requireNumber(cRaw["min_count"], `${label}.criterion.min_count`),
      };
      break;
    case "population_balance":
      criterion = { type: "population_balance" };
      break;
    case "district_count":
      criterion = { type: "district_count" };
      break;
    default:
      throw new Error(`${label}.criterion.type: unknown type "${cType}"`);
  }

  const sc: SuccessCriterion = { id, required, description, criterion };

  if (r["character"] !== undefined) {
    const charVal = requireString(r["character"], `${label}.character`);
    const validChars = ["governor", "commissioner", "party", "judge", "legislator", "instigator"];
    if (!validChars.includes(charVal)) {
      throw new Error(`${label}.character: unknown value "${charVal}"; expected one of: ${validChars.join(", ")}`);
    }
    // When character is statically "party" (not via instigator indirection), party_id is required
    // at load time. The instigator→party chain resolves at render time and cannot be checked here.
    if (charVal === "party" && r["party_id"] === undefined) {
      throw new Error(`${label}.character is "party" but party_id is missing`);
    }
    sc.character = charVal as CharacterType | "instigator";
  }

  if (r["party_id"] !== undefined) {
    sc.party_id = requireString(r["party_id"], `${label}.party_id`) as PartyId;
  }

  return sc;
}

function parseNarrative(raw: unknown): Narrative {
  const r = requireObject(raw, "narrative");
  const charRaw = requireObject(r["character"], "narrative.character");
  const slidesRaw = requireArray(r["intro_slides"], "narrative.intro_slides");
  const slides: Slide[] = slidesRaw.map((s, i) => {
    const sr = requireObject(s, `narrative.intro_slides[${i}]`);
    const slide: Slide = { body: requireString(sr["body"], `narrative.intro_slides[${i}].body`) };
    if (sr["heading"] !== undefined) slide.heading = requireString(sr["heading"], `narrative.intro_slides[${i}].heading`);
    if (sr["image"] !== undefined) slide.image = requireString(sr["image"], `narrative.intro_slides[${i}].image`);
    return slide;
  });

  const narrative: Narrative = {
    character: {
      name: requireString(charRaw["name"], "narrative.character.name"),
      role: requireString(charRaw["role"], "narrative.character.role"),
      motivation: requireString(charRaw["motivation"], "narrative.character.motivation"),
    },
    intro_slides: slides,
    objective: requireString(r["objective"], "narrative.objective"),
  };
  if (r["flavor_text"] !== undefined) {
    narrative.flavor_text = requireString(r["flavor_text"], "narrative.flavor_text");
  }
  if (r["epilogue"] !== undefined) {
    narrative.epilogue = requireString(r["epilogue"], "narrative.epilogue");
  }
  if (r["instigator"] !== undefined) {
    throw new Error("narrative.instigator removed; use instigator_character at the scenario root level instead");
  }
  return narrative;
}

function parseRules(raw: unknown): ScenarioRules {
  const r = requireObject(raw, "rules");
  const contiguityRaw = requireString(r["contiguity"], "rules.contiguity");
  if (contiguityRaw !== "required" && contiguityRaw !== "preferred" && contiguityRaw !== "allowed") {
    throw new Error(`rules.contiguity: must be "required", "preferred", or "allowed"`);
  }
  const rules: ScenarioRules = {
    population_tolerance: requireNumber(r["population_tolerance"], "rules.population_tolerance"),
    contiguity: contiguityRaw,
  };
  if (r["compactness_threshold"] !== undefined) {
    rules.compactness_threshold = requireNumber(r["compactness_threshold"], "rules.compactness_threshold");
  }
  return rules;
}

function parseStateContext(raw: unknown): StateContext {
  const r = requireObject(raw, "state_context");
  const othersRaw = requireObject(r["other_region_results"], "state_context.other_region_results");
  const other_region_results: StateContext["other_region_results"] = {} as StateContext["other_region_results"];
  for (const [regionId, rr] of Object.entries(othersRaw)) {
    const rrObj = requireObject(rr, `state_context.other_region_results[${regionId}]`);
    const seatTotalsRaw = requireObject(rrObj["seat_totals"], `state_context.other_region_results[${regionId}].seat_totals`);
    const seat_totals: Record<PartyId, number> = {} as Record<PartyId, number>;
    for (const [pid, cnt] of Object.entries(seatTotalsRaw)) {
      seat_totals[pid as PartyId] = requireNumber(cnt, `state_context.other_region_results[${regionId}].seat_totals[${pid}]`);
    }
    other_region_results[regionId as import("./scenario.js").RegionId] = {
      district_count: requireNumber(rrObj["district_count"], `state_context.other_region_results[${regionId}].district_count`),
      seat_totals,
    };
  }
  return {
    state_name: requireString(r["state_name"], "state_context.state_name"),
    total_districts: requireNumber(r["total_districts"], "state_context.total_districts"),
    other_region_results,
  };
}

function parseTerrainTile(raw: unknown, idx: number): TerrainTile {
  const label = `terrain_tiles[${idx}]`;
  const r = requireObject(raw, label);
  const posRaw = requireObject(r["position"], `${label}.position`);
  const q = requireNumber(posRaw["q"], `${label}.position.q`);
  const rr = requireNumber(posRaw["r"], `${label}.position.r`);
  const type = requireString(r["type"], `${label}.type`);
  if (type !== "sea" && type !== "lake" && type !== "mountain") {
    throw new Error(`${label}.type: unknown value "${type}"; expected "sea", "lake", or "mountain"`);
  }
  return { position: { q, r: rr }, type };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Collect all GroupId values referenced in a GroupFilter (only group_ids form; dimension form has no explicit GroupId refs). */
function groupFilterGroupIds(gf: GroupFilter): GroupId[] {
  if ("group_ids" in gf) return gf.group_ids;
  return [];
}

/**
 * Validate a dimension-based GroupFilter against the scenario's group_schema.
 * For {dimension, value} filters, checks:
 *   (a) group_schema is present
 *   (b) the dimension name exists in group_schema.dimensions
 *   (c) the value exists in group_schema.dimensions[dimension]
 * No-op for group_ids filters (those are validated separately via groupFilterGroupIds).
 */
function validateDimensionFilter(gf: GroupFilter, schema: GroupSchema | undefined, label: string): void {
  if (!("dimension" in gf)) return; // group_ids variant — skip
  if (schema === undefined) {
    throw new Error(
      `Invariant 3: ${label} uses a dimension GroupFilter but no group_schema is defined`
    );
  }
  if (!(gf.dimension in schema.dimensions)) {
    throw new Error(
      `Invariant 3: ${label} group_filter references unknown dimension "${gf.dimension}" (not in group_schema.dimensions)`
    );
  }
  const allowed = schema.dimensions[gf.dimension];
  if (allowed === undefined || !allowed.includes(gf.value)) {
    throw new Error(
      `Invariant 3: ${label} group_filter dimension "${gf.dimension}" value "${gf.value}" is not in schema values [${allowed?.join(", ")}]`
    );
  }
}

/** Collect all PartyId values referenced in a GroupFilter context (none directly — party refs are on events/criteria). */
// (no-op helper; kept for symmetry; party refs extracted per-event below)

// ─── Validation invariants ────────────────────────────────────────────────────

function cartesianProduct(dimNames: string[], dims: Record<string, string[]>): Record<string, string>[] {
  if (dimNames.length === 0) return [{}];
  const first = dimNames[0] as string;
  const rest = dimNames.slice(1);
  const restCombos = cartesianProduct(rest, dims);
  const result: Record<string, string>[] = [];
  for (const val of dims[first] ?? []) {
    for (const combo of restCombos) {
      result.push({ [first]: val, ...combo });
    }
  }
  return result;
}

// ─── Single-definition invariant checks (GAME-102) ────────────────────────────
//
// Each duplicated invariant lives in exactly ONE helper below. Both entry points
// — validateStructural (parse-time, partial data) and validateScenarioInvariants
// (complete-time) — call these helpers. The PARSE path calls a helper only when the
// data it needs is present (preserving its `if (x !== undefined)` guards); the
// COMPLETE path calls them unconditionally after the completeness gate. The helpers
// are invoked in EACH function's original sequence, so per-function throw order and
// every Error string are preserved verbatim — zero behavior change for either path.

/** Invariant 12: precincts.length ≥ 1. */
function checkPrecinctCount(precinctCount: number): void {
  if (precinctCount < 1) {
    throw new Error("Invariant 12: precincts must have at least 1 element");
  }
}

/**
 * Invariant 4: every context precinct (editable:false) must have a non-null
 * initial_district_id.
 */
function checkContextPrecinctDistrictId(
  precincts: { id: PrecinctId; editable: boolean; initial_district_id?: DistrictId | null }[],
): void {
  for (const pc of precincts) {
    if (!pc.editable) {
      if (pc.initial_district_id === undefined || pc.initial_district_id === null) {
        throw new Error(
          `Invariant 4: context precinct "${pc.id}" (editable: false) must have a non-null initial_district_id`
        );
      }
    }
  }
}

/** Invariant 11: all IDs unique within the supplied data. */
function checkUniqueIds(args: {
  parties?: Party[] | undefined;
  districts?: District[] | undefined;
  precincts: { id: PrecinctId; demographic_groups?: DemographicGroup[] | undefined }[];
  events?: DemographicEvent[] | undefined;
  success_criteria?: SuccessCriterion[] | undefined;
}): void {
  const allIds = new Map<string, string>(); // id -> namespace label
  const checkId = (id: string, label: string) => {
    const existing = allIds.get(id);
    if (existing !== undefined) {
      throw new Error(`Invariant 11: duplicate id "${id}" found in both ${existing} and ${label}`);
    }
    allIds.set(id, label);
  };
  if (args.parties !== undefined) for (const p of args.parties) checkId(p.id, "parties");
  if (args.districts !== undefined) for (const d of args.districts) checkId(d.id, "districts");
  for (const pc of args.precincts) {
    checkId(pc.id, "precincts");
    if (pc.demographic_groups !== undefined) {
      for (const grp of pc.demographic_groups) checkId(grp.id, `precincts[${pc.id}].demographic_groups`);
    }
  }
  if (args.events !== undefined) for (const ev of args.events) checkId(ev.id, "events");
  if (args.success_criteria !== undefined) for (const cr of args.success_criteria) checkId(cr.id, "success_criteria");
}

/**
 * Invariant 8/9: geometry/neighbors consistency.
 *  - hex_axial → no neighbors field.
 *  - custom → neighbors present, all referenced precincts exist (Inv 9), symmetric.
 */
function checkGeometryAndNeighbors(
  geometry: GeometrySpec,
  precincts: { id: PrecinctId; neighbors?: PrecinctId[] }[],
  precinctIds: Set<PrecinctId>,
): void {
  if (geometry.type === "hex_axial") {
    for (const pc of precincts) {
      if (pc.neighbors !== undefined) {
        throw new Error(
          `Invariant 8: hex_axial geometry precinct "${pc.id}" must not have a neighbors field`
        );
      }
    }
  } else {
    for (const pc of precincts) {
      if (pc.neighbors === undefined) {
        throw new Error(
          `Invariant 8: custom geometry precinct "${pc.id}" must have a neighbors field`
        );
      }
    }
    // Invariant 9: neighbor IDs must exist
    for (const pc of precincts) {
      for (const nbId of pc.neighbors!) {
        if (!precinctIds.has(nbId)) {
          throw new Error(
            `Invariant 9: precinct "${pc.id}" neighbors[] references unknown precinct "${nbId}"`
          );
        }
      }
    }
    // Invariant 8 (symmetric): neighbors must be symmetric
    const adjMap = new Map<PrecinctId, Set<PrecinctId>>();
    for (const pc of precincts) adjMap.set(pc.id, new Set(pc.neighbors!));
    for (const pc of precincts) {
      for (const nbId of pc.neighbors!) {
        const nbNeighbors = adjMap.get(nbId);
        if (nbNeighbors === undefined || !nbNeighbors.has(pc.id)) {
          throw new Error(
            `Invariant 8: custom geometry neighbors not symmetric: precinct "${pc.id}" lists "${nbId}" as neighbor, but "${nbId}" does not list "${pc.id}"`
          );
        }
      }
    }
  }
}

/**
 * Invariant 1 (vote_shares portion): every party referenced in ONE group's
 * vote_shares exists. Per-group predicate so callers control Inv1/Inv6 ordering.
 */
function checkGroupUnknownParties(
  precinctId: PrecinctId,
  grp: DemographicGroup,
  partyIds: Set<PartyId>,
): void {
  for (const pid of Object.keys(grp.vote_shares)) {
    if (!partyIds.has(pid as PartyId)) {
      throw new Error(
        `Invariant 1: precinct "${precinctId}" group "${grp.id}" references unknown party "${pid}" in vote_shares`
      );
    }
  }
}

/**
 * Invariant 6 (per-group): ONE group lists every party in vote_shares and its
 * shares sum to 1.0 (±ε). Per-group predicate so callers control Inv1/Inv6 ordering.
 */
function checkGroupVoteShareComplete(
  precinctId: PrecinctId,
  grp: DemographicGroup,
  partyIds: Set<PartyId>,
): void {
  for (const pid of partyIds) {
    if (!(pid in grp.vote_shares)) {
      throw new Error(
        `Invariant 6: precinct "${precinctId}" group "${grp.id}" is missing vote_share for party "${pid}"`
      );
    }
  }
  const vsum = Object.values(grp.vote_shares).reduce((a, v) => a + (v as number), 0);
  if (Math.abs(vsum - 1.0) > EPSILON) {
    throw new Error(
      `Invariant 6: precinct "${precinctId}" group "${grp.id}" vote_shares sum is ${vsum}, expected 1.0 (±${EPSILON})`
    );
  }
}

/**
 * Invariant 1 (vote_shares portion), all groups. Used by the COMPLETE path, which
 * runs the full Inv1 pass before the full Inv6 pass.
 */
function checkUnknownPartyRefsInGroups(
  precincts: { id: PrecinctId; demographic_groups?: DemographicGroup[] }[],
  partyIds: Set<PartyId>,
): void {
  for (const pc of precincts) {
    if (pc.demographic_groups === undefined) continue;
    for (const grp of pc.demographic_groups) {
      checkGroupUnknownParties(pc.id, grp, partyIds);
    }
  }
}

/**
 * Invariant 6, all groups. Used by the COMPLETE path, which runs the full Inv6
 * pass before the full Inv1 pass.
 */
function checkVoteShareCompleteness(
  precincts: { id: PrecinctId; demographic_groups?: DemographicGroup[] }[],
  partyIds: Set<PartyId>,
): void {
  for (const pc of precincts) {
    if (pc.demographic_groups === undefined) continue;
    for (const grp of pc.demographic_groups) {
      checkGroupVoteShareComplete(pc.id, grp, partyIds);
    }
  }
}

/** Invariant 1 (event/criteria portion): party refs on events and success criteria exist. */
function checkPartyRefsInEventsAndCriteria(
  events: DemographicEvent[] | undefined,
  success_criteria: SuccessCriterion[] | undefined,
  partyIds: Set<PartyId>,
): void {
  if (events !== undefined) {
    for (const ev of events) {
      if (ev.type === "vote_share_shift" && !partyIds.has(ev.party)) {
        throw new Error(`Invariant 1: event "${ev.id}" references unknown party "${ev.party}"`);
      }
    }
  }
  if (success_criteria !== undefined) {
    for (const cr of success_criteria) {
      const c = cr.criterion;
      if (c.type === "seat_count" || c.type === "mean_median" || c.type === "safe_seats") {
        if (!partyIds.has(c.party)) {
          throw new Error(`Invariant 1: criterion "${cr.id}" references unknown party "${c.party}"`);
        }
      }
    }
  }
}

/** Invariant 5: sum(population_shares) == 1.0 per precinct (±ε). */
function checkPopulationShareSums(
  precincts: { id: PrecinctId; demographic_groups?: DemographicGroup[] }[],
): void {
  for (const pc of precincts) {
    if (pc.demographic_groups === undefined) continue;
    const sum = pc.demographic_groups.reduce((acc, g) => acc + g.population_share, 0);
    if (Math.abs(sum - 1.0) > EPSILON) {
      throw new Error(
        `Invariant 5: precinct "${pc.id}" demographic_groups population_share sum is ${sum}, expected 1.0 (±${EPSILON})`
      );
    }
  }
}

/** Invariant 2: initial_district_id and default_district_id refs exist in districts. */
function checkDistrictRefs(
  precincts: { id: PrecinctId; initial_district_id?: DistrictId | null }[],
  districtIds: Set<DistrictId>,
  default_district_id: DistrictId | undefined,
): void {
  for (const pc of precincts) {
    if (pc.initial_district_id !== undefined && pc.initial_district_id !== null) {
      if (!districtIds.has(pc.initial_district_id)) {
        throw new Error(
          `Invariant 2: precinct "${pc.id}" initial_district_id "${pc.initial_district_id}" does not exist in districts`
        );
      }
    }
  }
  if (default_district_id !== undefined && !districtIds.has(default_district_id)) {
    throw new Error(`Invariant 2: default_district_id "${default_district_id}" does not exist in districts`);
  }
}

/** Build the set of all GroupIds defined across the supplied precincts' demographic_groups. */
function collectDefinedGroupIds(
  precincts: { demographic_groups?: DemographicGroup[] }[],
): Set<GroupId> {
  const definedGroupIds = new Set<GroupId>();
  for (const pc of precincts) {
    if (pc.demographic_groups !== undefined) {
      for (const grp of pc.demographic_groups) definedGroupIds.add(grp.id);
    }
  }
  return definedGroupIds;
}

/** Invariant 3 (events): event group_filter refs exist as groups / valid dimension values. */
function checkGroupRefsInEvents(
  events: DemographicEvent[],
  definedGroupIds: Set<GroupId>,
  group_schema: GroupSchema | undefined,
): void {
  for (const ev of events) {
    const gids = groupFilterGroupIds(ev.group_filter);
    for (const gid of gids) {
      if (!definedGroupIds.has(gid)) {
        throw new Error(`Invariant 3: event "${ev.id}" group_filter references unknown group "${gid}"`);
      }
    }
    validateDimensionFilter(ev.group_filter, group_schema, `event "${ev.id}"`);
  }
}

/** Invariant 3 (criteria): majority_minority criterion group_filter refs exist / valid dimension values. */
function checkGroupRefsInCriteria(
  success_criteria: SuccessCriterion[],
  definedGroupIds: Set<GroupId>,
  group_schema: GroupSchema | undefined,
): void {
  for (const cr of success_criteria) {
    const c = cr.criterion;
    if (c.type === "majority_minority") {
      const gids = groupFilterGroupIds(c.group_filter);
      for (const gid of gids) {
        if (!definedGroupIds.has(gid)) {
          throw new Error(`Invariant 3: criterion "${cr.id}" group_filter references unknown group "${gid}"`);
        }
      }
      validateDimensionFilter(c.group_filter, group_schema, `criterion "${cr.id}"`);
    }
  }
}

/**
 * Invariant 7: when group_schema is declared, every group carries every schema
 * dimension with a valid value, and each precinct has exactly one group per
 * dimension-value cartesian-product combination.
 */
function checkGroupSchemaCompleteness(
  group_schema: GroupSchema,
  precincts: { id: PrecinctId; demographic_groups?: DemographicGroup[] }[],
): void {
  const dims = group_schema.dimensions;
  const dimNames = Object.keys(dims);
  for (const pc of precincts) {
    if (pc.demographic_groups === undefined) continue;
    for (const grp of pc.demographic_groups) {
      for (const dimName of dimNames) {
        if (grp.dimensions === undefined || !(dimName in grp.dimensions)) {
          throw new Error(
            `Invariant 7: precinct "${pc.id}" group "${grp.id}" is missing dimension "${dimName}" (required by group_schema)`
          );
        }
        const val = grp.dimensions[dimName];
        const allowed = dims[dimName];
        if (allowed === undefined || !allowed.includes(val!)) {
          throw new Error(
            `Invariant 7: precinct "${pc.id}" group "${grp.id}" dimension "${dimName}" value "${val}" is not in schema values [${allowed?.join(", ")}]`
          );
        }
      }
    }
    const expectedCombos = cartesianProduct(dimNames, dims);
    for (const expectedCombo of expectedCombos) {
      const matchingGroups = pc.demographic_groups.filter(grp => {
        if (grp.dimensions === undefined) return false;
        return dimNames.every(d => grp.dimensions![d] === expectedCombo[d]);
      });
      if (matchingGroups.length === 0) {
        const comboStr = Object.entries(expectedCombo).map(([k, v]) => `${k}=${v}`).join(", ");
        throw new Error(
          `Invariant 7: precinct "${pc.id}" is missing a group for dimension combo {${comboStr}} (required by group_schema)`
        );
      }
      if (matchingGroups.length > 1) {
        const comboStr = Object.entries(expectedCombo).map(([k, v]) => `${k}=${v}`).join(", ");
        throw new Error(
          `Invariant 7: precinct "${pc.id}" has ${matchingGroups.length} groups for dimension combo {${comboStr}}; expected exactly 1`
        );
      }
    }
  }
}

/**
 * Terrain + river validation: custom-geometry rejection, terrain/precinct overlap,
 * lake/sea adjacency, mountain-enclosure BFS flood-fill, and river-edge existence +
 * geometric adjacency. Single home for the formerly byte-duplicated terrain blocks.
 */
function validateTerrainAndRivers(
  geometry: GeometrySpec,
  precincts: { id: PrecinctId; position: Precinct["position"] }[],
  precinctIds: Set<PrecinctId>,
  terrain_tiles: TerrainTile[] | undefined,
  river_edges: [PrecinctId, PrecinctId][] | undefined,
): void {
  if (geometry.type === "custom") {
    if (terrain_tiles !== undefined && terrain_tiles.length > 0) {
      throw new Error(
        `Terrain validation: terrain_tiles require geometry.type "hex_axial"; custom geometry is not supported in v1`
      );
    }
    if (river_edges !== undefined && river_edges.length > 0) {
      throw new Error(
        `Terrain validation: river_edges require geometry.type "hex_axial"; custom geometry is not supported in v1`
      );
    }
  }

  if (terrain_tiles !== undefined && terrain_tiles.length > 0) {
    const precinctPosSet = new Set<string>();
    for (const pc of precincts) {
      const pos = pc.position;
      if ("q" in pos) precinctPosSet.add(`${pos.q},${pos.r}`);
    }

    const tileTypeMap = new Map<string, string>();
    for (const tile of terrain_tiles) {
      const key = `${tile.position.q},${tile.position.r}`;
      if (precinctPosSet.has(key)) {
        throw new Error(
          `Terrain validation: terrain_tile at (${tile.position.q},${tile.position.r}) overlaps precinct position`
        );
      }
      tileTypeMap.set(key, tile.type);
    }

    for (const tile of terrain_tiles) {
      if (tile.type !== "lake") continue;
      for (const [dq, dr] of HEX_DIRS) {
        const nKey = `${tile.position.q + dq},${tile.position.r + dr}`;
        if (tileTypeMap.get(nKey) === "sea") {
          throw new Error(
            `Terrain validation: lake tile at (${tile.position.q},${tile.position.r}) is adjacent to sea tile at (${tile.position.q + dq},${tile.position.r + dr})`
          );
        }
      }
    }

    {
      const mountainSet = new Set<string>();
      for (const tile of terrain_tiles) {
        if (tile.type === "mountain") mountainSet.add(`${tile.position.q},${tile.position.r}`);
      }

      if (mountainSet.size > 0) {
        const allQs: number[] = [];
        const allRs: number[] = [];
        for (const pc of precincts) {
          const pos = pc.position;
          if ("q" in pos) { allQs.push(pos.q); allRs.push(pos.r); }
        }
        for (const tile of terrain_tiles) {
          allQs.push(tile.position.q);
          allRs.push(tile.position.r);
        }
        const minQ = Math.min(...allQs) - 2;
        const maxQ = Math.max(...allQs) + 2;
        const minR = Math.min(...allRs) - 2;
        const maxR = Math.max(...allRs) + 2;

        const outsideKey = `${minQ},${minR}`;
        const visited = new Set<string>([outsideKey]);
        const queue: string[] = [outsideKey];

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const [cq, cr] = curr.split(",").map(Number) as [number, number];
          for (const [dq, dr] of HEX_DIRS) {
            const nq = cq + dq;
            const nr = cr + dr;
            if (nq < minQ - 1 || nq > maxQ + 1 || nr < minR - 1 || nr > maxR + 1) continue;
            const nKey = `${nq},${nr}`;
            if (!visited.has(nKey) && !mountainSet.has(nKey)) {
              visited.add(nKey);
              queue.push(nKey);
            }
          }
        }

        for (const pc of precincts) {
          const pos = pc.position;
          if ("q" in pos) {
            const key = `${pos.q},${pos.r}`;
            if (!visited.has(key)) {
              throw new Error(
                `Terrain validation: precinct "${pc.id}" at (${pos.q},${pos.r}) is fully enclosed by mountain tiles`
              );
            }
          }
        }
      }
    }
  }

  if (river_edges !== undefined) {
    const precinctPosByid = new Map<PrecinctId, { q: number; r: number }>();
    if (geometry.type === "hex_axial") {
      for (const pc of precincts) {
        const pos = pc.position;
        if ("q" in pos) precinctPosByid.set(pc.id, { q: pos.q, r: pos.r });
      }
    }

    for (const [aId, bId] of river_edges) {
      if (!precinctIds.has(aId)) {
        throw new Error(`river_edges: precinct "${aId}" does not exist in precincts`);
      }
      if (!precinctIds.has(bId)) {
        throw new Error(`river_edges: precinct "${bId}" does not exist in precincts`);
      }
      const aPos = precinctPosByid.get(aId);
      const bPos = precinctPosByid.get(bId);
      if (aPos !== undefined && bPos !== undefined) {
        const dq = bPos.q - aPos.q;
        const dr = bPos.r - aPos.r;
        const isAdjacent = HEX_DIRS.some(([ddq, ddr]) => ddq === dq && ddr === dr);
        if (!isAdjacent) {
          throw new Error(
            `river_edges: precincts "${aId}" (${aPos.q},${aPos.r}) and "${bId}" (${bPos.q},${bPos.r}) are not geometrically adjacent`
          );
        }
      }
    }
  }
}

/**
 * Validate all spec invariants for a parsed scenario. Throws on the first violation.
 * Called by loadScenario after field parsing, before auto-fill and assembly.
 * Extracted as a named function so GAME-084's load/validate split can call it independently.
 */
function validateScenarioInvariants(fields: {
  rawPrecincts: RawPrecinct[];
  parties: Party[];
  districts: District[];
  events: DemographicEvent[];
  success_criteria: SuccessCriterion[];
  geometry: GeometrySpec;
  group_schema: GroupSchema | undefined;
  terrain_tiles: TerrainTile[] | undefined;
  river_edges: [PrecinctId, PrecinctId][] | undefined;
  default_district_id: DistrictId | undefined;
}): void {
  const { rawPrecincts, parties, districts, events, success_criteria,
          geometry, group_schema, terrain_tiles, river_edges, default_district_id } = fields;

  // Build lookup sets for fast validation
  const partyIds = new Set(parties.map(p => p.id));
  const districtIds = new Set(districts.map(d => d.id));
  const precinctIds = new Set(rawPrecincts.map(p => p.id));
  const definedGroupIds = collectDefinedGroupIds(rawPrecincts);

  // The complete path runs every shared check unconditionally (data guaranteed by
  // the completeness gate), in the original validateScenarioInvariants sequence.
  // Each check is a single-definition helper shared with validateStructural.

  // ── Invariant 12: precincts.length ≥ 1 ──────────────────────────────────────
  checkPrecinctCount(rawPrecincts.length);

  // ── Invariant 10: districts.length ≥ 2 (complete-only) ───────────────────────
  if (districts.length < 2) {
    throw new Error("Invariant 10: districts must have at least 2 elements");
  }

  // ── Invariant 11: All IDs unique within scenario ─────────────────────────────
  checkUniqueIds({ parties, districts, precincts: rawPrecincts, events, success_criteria });

  // ── Invariant 5: sum(population_shares) == 1.0 per precinct (±ε) ─────────────
  checkPopulationShareSums(rawPrecincts);

  // ── Invariant 6: sum(vote_shares) == 1.0 per group (±ε); all parties present ─
  checkVoteShareCompleteness(rawPrecincts, partyIds);

  // ── Invariant 1: All PartyId refs exist in scenario.parties ─────────────────
  checkUnknownPartyRefsInGroups(rawPrecincts, partyIds);
  checkPartyRefsInEventsAndCriteria(events, success_criteria, partyIds);

  // ── Invariant 2: All DistrictId refs in initial_district_id exist in districts ─
  checkDistrictRefs(rawPrecincts, districtIds, default_district_id);

  // ── Invariant 3: All GroupId refs in events/criteria exist in ≥1 precinct's groups ─
  checkGroupRefsInEvents(events, definedGroupIds, group_schema);
  checkGroupRefsInCriteria(success_criteria, definedGroupIds, group_schema);

  // ── Invariant 4: context precincts must have non-null initial_district_id ─────
  checkContextPrecinctDistrictId(rawPrecincts);

  // ── Invariant 8/9: geometry/neighbors consistency ────────────────────────────
  checkGeometryAndNeighbors(geometry, rawPrecincts, precinctIds);

  // ── Invariant 7: group_schema completeness constraint ────────────────────────
  if (group_schema !== undefined) {
    checkGroupSchemaCompleteness(group_schema, rawPrecincts);
  }

  // ── Terrain + river validation ───────────────────────────────────────────────
  validateTerrainAndRivers(geometry, rawPrecincts, precinctIds, terrain_tiles, river_edges);
}

// ─── Shared parsing helper ────────────────────────────────────────────────────

/**
 * Parse all fields from a raw JSON object, making gameplay-required fields
 * optional. Returns a PartialScenario. Called by parseScenario (and transitively
 * by loadScenario via validateScenarioComplete(parseScenario(json))).
 */
function parseAllFields(raw: Record<string, unknown>): PartialScenario {
  // ── Required structural fields ───────────────────────────────────────────────
  const id = requireString(raw["id"], "id") as ScenarioId;
  const title = requireString(raw["title"], "title");
  const etRaw = requireString(raw["election_type"], "election_type");
  if (etRaw !== "congressional" && etRaw !== "state_senate" && etRaw !== "state_house") {
    throw new Error(`election_type: must be "congressional", "state_senate", or "state_house"`);
  }
  const election_type = etRaw;

  const region = parseRegion(raw["region"]);
  const geometry = parseGeometry(raw["geometry"]);

  const precinctsRaw = requireArray(raw["precincts"], "precincts");
  const partialPrecincts = precinctsRaw.map((p, i) => parsePrecinct(p, i));

  // ── Optional gameplay fields ─────────────────────────────────────────────────
  let parties: Party[] | undefined;
  if (raw["parties"] !== undefined) {
    parties = requireArray(raw["parties"], "parties").map((p, i) => parseParty(p, i));
  }

  let districts: District[] | undefined;
  if (raw["districts"] !== undefined) {
    districts = requireArray(raw["districts"], "districts").map((d, i) => parseDistrict(d, i));
  }

  let group_schema: GroupSchema | undefined;
  if (raw["group_schema"] !== undefined) {
    group_schema = parseGroupSchema(raw["group_schema"]);
  }

  let default_district_id: DistrictId | undefined;
  if (raw["default_district_id"] !== undefined) {
    default_district_id = requireString(raw["default_district_id"], "default_district_id") as DistrictId;
  }

  let events: DemographicEvent[] | undefined;
  if (raw["events"] !== undefined) {
    events = requireArray(raw["events"], "events").map((e, i) => parseEvent(e, i));
  }

  let rules: ScenarioRules | undefined;
  if (raw["rules"] !== undefined) {
    rules = parseRules(raw["rules"]);
  }

  let success_criteria: SuccessCriterion[] | undefined;
  if (raw["success_criteria"] !== undefined) {
    success_criteria = requireArray(raw["success_criteria"], "success_criteria").map((c, i) => parseCriterion(c, i));
  }

  let narrative: Narrative | undefined;
  if (raw["narrative"] !== undefined) {
    narrative = parseNarrative(raw["narrative"]);
  }

  let instigator_character: CharacterType | undefined;
  if (raw["instigator_character"] !== undefined) {
    const icVal = requireString(raw["instigator_character"], "instigator_character");
    const validChars: string[] = ["governor", "commissioner", "party", "judge", "legislator"];
    if (!validChars.includes(icVal)) {
      throw new Error(`instigator_character: unknown value "${icVal}"; expected one of: ${validChars.join(", ")}`);
    }
    instigator_character = icVal as CharacterType;
  }

  let character_demographics: Partial<Record<CharacterType, string>> | undefined;
  if (raw["character_demographics"] !== undefined) {
    const cd = raw["character_demographics"];
    if (typeof cd !== "object" || cd === null || Array.isArray(cd)) {
      throw new Error("character_demographics: must be an object");
    }
    const validChars: string[] = ["governor", "commissioner", "judge", "legislator"];
    const requiresSuffix = new Set(["governor", "commissioner", "legislator"]);
    character_demographics = {};
    for (const key of Object.keys(cd)) {
      if (key === "party") {
        throw new Error(`character_demographics: "party" has no demographic variants and must be omitted`);
      }
      if (!validChars.includes(key)) {
        throw new Error(`character_demographics: unknown key "${key}"; expected one of: ${validChars.join(", ")}`);
      }
      const val = requireString((cd as Record<string, unknown>)[key], `character_demographics.${key}`);
      if (requiresSuffix.has(key) && val === "") {
        throw new Error(`character_demographics.${key}: demographic suffix must be non-empty (no bare "${key}/" directory exists)`);
      }
      character_demographics[key as CharacterType] = val;
    }
  }

  let state_context: StateContext | undefined;
  if (raw["state_context"] !== undefined) {
    state_context = parseStateContext(raw["state_context"]);
  }

  let terrain_tiles: TerrainTile[] | undefined;
  if (raw["terrain_tiles"] !== undefined) {
    const tilesRaw = requireArray(raw["terrain_tiles"], "terrain_tiles");
    terrain_tiles = tilesRaw.map((t, i) => parseTerrainTile(t, i));
  }

  let river_edges: [PrecinctId, PrecinctId][] | undefined;
  if (raw["river_edges"] !== undefined) {
    const edgesRaw = requireArray(raw["river_edges"], "river_edges");
    river_edges = edgesRaw.map((pair, i) => {
      const pairArr = requireArray(pair, `river_edges[${i}]`);
      if (pairArr.length !== 2) {
        throw new Error(`river_edges[${i}]: expected array of 2 precinct IDs, got ${pairArr.length}`);
      }
      return [
        requireString(pairArr[0], `river_edges[${i}][0]`) as PrecinctId,
        requireString(pairArr[1], `river_edges[${i}][1]`) as PrecinctId,
      ];
    });
  }

  let river_blocks_contiguity: boolean | undefined;
  if (raw["river_blocks_contiguity"] !== undefined) {
    river_blocks_contiguity = requireBoolean(raw["river_blocks_contiguity"], "river_blocks_contiguity");
  }

  let hide_election_results: boolean | undefined;
  if (raw["hide_election_results"] !== undefined) {
    hide_election_results = requireBoolean(raw["hide_election_results"], "hide_election_results");
  }

  let hide_view_toolbar: boolean | undefined;
  if (raw["hide_view_toolbar"] !== undefined) {
    hide_view_toolbar = requireBoolean(raw["hide_view_toolbar"], "hide_view_toolbar");
  }

  let guided: boolean | undefined;
  if (raw["guided"] !== undefined) {
    guided = requireBoolean(raw["guided"], "guided");
  }

  const partial: PartialScenario = {
    format_version: "1", id, title, election_type, region, geometry,
    precincts: partialPrecincts,
  };
  if (parties !== undefined) partial.parties = parties;
  if (districts !== undefined) partial.districts = districts;
  if (group_schema !== undefined) partial.group_schema = group_schema;
  if (default_district_id !== undefined) partial.default_district_id = default_district_id;
  if (events !== undefined) partial.events = events;
  if (rules !== undefined) partial.rules = rules;
  if (success_criteria !== undefined) partial.success_criteria = success_criteria;
  if (narrative !== undefined) partial.narrative = narrative;
  if (instigator_character !== undefined) partial.instigator_character = instigator_character;
  if (character_demographics !== undefined) partial.character_demographics = character_demographics;
  if (state_context !== undefined) partial.state_context = state_context;
  if (terrain_tiles !== undefined) partial.terrain_tiles = terrain_tiles;
  if (river_edges !== undefined) partial.river_edges = river_edges;
  if (river_blocks_contiguity !== undefined) partial.river_blocks_contiguity = river_blocks_contiguity;
  if (hide_election_results !== undefined) partial.hide_election_results = hide_election_results;
  if (hide_view_toolbar !== undefined) partial.hide_view_toolbar = hide_view_toolbar;
  if (guided !== undefined) partial.guided = guided;

  return partial;
}

// ─── Structural validation (parse-time) ──────────────────────────────────────

/**
 * Validate invariants checkable with partial data: uniqueness, geometry
 * consistency, context precinct district assignment, terrain adjacency.
 * Conditionally validates demographic and party refs when the data is present.
 */
function validateStructural(s: PartialScenario): void {
  const { precincts, parties, districts, events, success_criteria,
          geometry, group_schema, terrain_tiles, river_edges, default_district_id } = s;

  // The parse path runs each shared check only when the data it needs is present
  // (preserving the original `if (x !== undefined)` guards), in the original
  // validateStructural sequence. Each check is a single-definition helper shared
  // with validateScenarioInvariants.

  // Invariant 12: precincts ≥ 1
  checkPrecinctCount(precincts.length);

  // Invariant 4: context precincts must have non-null initial_district_id
  checkContextPrecinctDistrictId(precincts);

  // Invariant 11: All IDs unique within present data
  checkUniqueIds({ parties, districts, precincts, events, success_criteria });

  // Invariant 8/9: geometry/neighbors consistency
  const precinctIds = new Set(precincts.map(p => p.id));
  checkGeometryAndNeighbors(geometry, precincts, precinctIds);

  // Conditional: when parties present, check party refs in demographics
  if (parties !== undefined) {
    const partyIds = new Set(parties.map(p => p.id));
    // Original parse-path order: Inv1 then Inv6 INTERLEAVED per group (one precinct
    // loop), so for a precinct violating both, Inv1 wins for that group. Preserve
    // that exact interleaving via the per-group predicates.
    for (const pc of precincts) {
      if (pc.demographic_groups === undefined) continue;
      for (const grp of pc.demographic_groups) {
        checkGroupUnknownParties(pc.id, grp, partyIds);
        checkGroupVoteShareComplete(pc.id, grp, partyIds);
      }
    }
    checkPartyRefsInEventsAndCriteria(events, success_criteria, partyIds);
  }

  // Conditional: population_share sums when demographic_groups present
  checkPopulationShareSums(precincts);

  // Conditional: district refs when districts present
  if (districts !== undefined) {
    const districtIds = new Set(districts.map(d => d.id));
    checkDistrictRefs(precincts, districtIds, default_district_id);
  }

  // Conditional: group refs in events when both events and groups present
  if (events !== undefined) {
    const definedGroupIds = collectDefinedGroupIds(precincts);
    if (definedGroupIds.size > 0) {
      checkGroupRefsInEvents(events, definedGroupIds, group_schema);
    }
  }
  if (success_criteria !== undefined) {
    const definedGroupIds = collectDefinedGroupIds(precincts);
    if (definedGroupIds.size > 0) {
      checkGroupRefsInCriteria(success_criteria, definedGroupIds, group_schema);
    }
  }

  // Conditional: group_schema completeness when both schema and demographic_groups present
  if (group_schema !== undefined) {
    checkGroupSchemaCompleteness(group_schema, precincts);
  }

  // Terrain + river validation (conditional on terrain_tiles / river_edges)
  validateTerrainAndRivers(geometry, precincts, precinctIds, terrain_tiles, river_edges);
}

// ─── Assembly helper ──────────────────────────────────────────────────────────

function assembleScenario(
  partial: PartialScenario,
  parties: Party[],
  districts: District[],
  events: DemographicEvent[],
  rules: ScenarioRules,
  success_criteria: SuccessCriterion[],
  narrative: Narrative,
): Scenario {
  const rawPrecincts = partial.precincts as RawPrecinct[];
  const fillDistrictId = partial.default_district_id ?? districts[0]!.id;

  const precincts: Precinct[] = rawPrecincts.map(pc => {
    if (pc.editable) {
      const resolved: DistrictId =
        (pc.initial_district_id !== undefined && pc.initial_district_id !== null)
          ? pc.initial_district_id
          : fillDistrictId;
      return { ...pc, initial_district_id: resolved };
    } else {
      return { ...pc, initial_district_id: pc.initial_district_id as DistrictId };
    }
  });

  const scenario: Scenario = {
    format_version: "1",
    id: partial.id,
    title: partial.title,
    election_type: partial.election_type,
    region: partial.region,
    geometry: partial.geometry,
    parties,
    districts,
    precincts,
    events,
    rules,
    success_criteria,
    narrative,
  };

  if (partial.group_schema !== undefined) scenario.group_schema = partial.group_schema;
  if (partial.default_district_id !== undefined) scenario.default_district_id = partial.default_district_id;
  if (partial.instigator_character !== undefined) scenario.instigator_character = partial.instigator_character;
  if (partial.character_demographics !== undefined) scenario.character_demographics = partial.character_demographics;
  if (partial.state_context !== undefined) scenario.state_context = partial.state_context;
  if (partial.terrain_tiles !== undefined) scenario.terrain_tiles = partial.terrain_tiles;
  if (partial.river_edges !== undefined) scenario.river_edges = partial.river_edges;
  if (partial.river_blocks_contiguity !== undefined) scenario.river_blocks_contiguity = partial.river_blocks_contiguity;
  if (partial.hide_election_results !== undefined) scenario.hide_election_results = partial.hide_election_results;
  if (partial.hide_view_toolbar !== undefined) scenario.hide_view_toolbar = partial.hide_view_toolbar;
  if (partial.guided !== undefined) scenario.guided = partial.guided;

  return scenario;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Structural parse: validates types and structural invariants (geometry
 * consistency, unique IDs, context precinct assignment, terrain adjacency).
 * Tolerates absent gameplay fields (parties, districts, population, demographics).
 *
 * Use for pipeline intermediates and terrain-preview rendering.
 * Call `validateScenarioComplete` before gameplay.
 */
export function parseScenario(json: unknown): PartialScenario {
  const raw = requireObject(json, "scenario");
  const fv = requireString(raw["format_version"], "format_version");
  if (fv !== "1") {
    throw new Error(`format_version: unknown version "${fv}"; only "1" is supported`);
  }
  const partial = parseAllFields(raw);
  validateStructural(partial);
  return partial;
}

/**
 * Completeness validation: asserts all gameplay-required fields are present,
 * runs the full 13-invariant suite, auto-fills initial_district_id, and
 * assembles the final Scenario.
 *
 * Throws if any field required for gameplay is absent.
 * Call at game-start after parseScenario.
 */
export function validateScenarioComplete(partial: PartialScenario): Scenario {
  // ── Completeness checks ──────────────────────────────────────────────────────
  if (partial.parties === undefined || partial.parties.length === 0) {
    throw new Error("completeness: parties is required for gameplay and must not be empty");
  }
  if (partial.districts === undefined || partial.districts.length < 2) {
    throw new Error("Invariant 10: districts must have at least 2 elements");
  }
  if (partial.events === undefined) {
    throw new Error("completeness: events is required for gameplay (use [] for none)");
  }
  if (partial.rules === undefined) {
    throw new Error("completeness: rules is required for gameplay");
  }
  if (partial.success_criteria === undefined) {
    throw new Error("completeness: success_criteria is required for gameplay (use [] for none)");
  }
  if (partial.narrative === undefined) {
    throw new Error("completeness: narrative is required for gameplay");
  }
  for (const pc of partial.precincts) {
    if (pc.total_population === undefined) {
      throw new Error(`completeness: precinct "${pc.id}" is missing total_population (required for gameplay)`);
    }
    if (pc.demographic_groups === undefined) {
      throw new Error(`completeness: precinct "${pc.id}" is missing demographic_groups (required for gameplay)`);
    }
  }

  // ── Full invariant check (all 13) ────────────────────────────────────────────
  validateScenarioInvariants({
    rawPrecincts: partial.precincts as RawPrecinct[],
    parties: partial.parties,
    districts: partial.districts,
    events: partial.events,
    success_criteria: partial.success_criteria,
    geometry: partial.geometry,
    group_schema: partial.group_schema,
    terrain_tiles: partial.terrain_tiles,
    river_edges: partial.river_edges,
    default_district_id: partial.default_district_id,
  });

  return assembleScenario(
    partial,
    partial.parties,
    partial.districts,
    partial.events,
    partial.rules,
    partial.success_criteria,
    partial.narrative,
  );
}

/**
 * Parse and validate a raw JSON value as a Scenario.
 *
 * Equivalent to validateScenarioComplete(parseScenario(json)).
 * All existing callers continue to work unchanged.
 *
 * Throws a descriptive Error if:
 *  - format_version is unknown
 *  - any required field is missing or the wrong type
 *  - any of the 13 spec validation invariants is violated
 *
 * Returns a fully-typed Scenario with explicit initial_district_id on all
 * editable precincts (auto-filled from default_district_id or districts[0]).
 */
export function loadScenario(json: unknown): Scenario {
  return validateScenarioComplete(parseScenario(json));
}
