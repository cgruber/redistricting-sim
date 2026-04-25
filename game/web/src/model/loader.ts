/**
 * Scenario JSON loader and validator.
 *
 * `loadScenario(json: unknown): Scenario` is the single entry point.
 * It validates all 13 spec invariants, auto-fills missing initial_district_id
 * on editable precincts, and returns a fully-typed Scenario.
 *
 * Every error message names the invariant number and identifies the offending
 * element (precinct id, group id, party id, etc.) so the caller knows where
 * the violation is.
 */

import type {
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
} from "./scenario.js";

// ─── Epsilon for floating-point sum checks ───────────────────────────────────

const EPSILON = 1e-6;

// ─── Thin runtime-type helpers ───────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function requireString(v: unknown, label: string): string {
  if (!isString(v)) throw new Error(`${label}: expected string, got ${typeof v}`);
  return v;
}

function requireNumber(v: unknown, label: string): number {
  if (!isNumber(v)) throw new Error(`${label}: expected number, got ${typeof v}`);
  return v;
}

function requireBoolean(v: unknown, label: string): boolean {
  if (!isBoolean(v)) throw new Error(`${label}: expected boolean, got ${typeof v}`);
  return v;
}

function requireArray(v: unknown, label: string): unknown[] {
  if (!isArray(v)) throw new Error(`${label}: expected array, got ${typeof v}`);
  return v;
}

function requireObject(v: unknown, label: string): Record<string, unknown> {
  if (!isObject(v)) throw new Error(`${label}: expected object, got ${typeof v}`);
  return v;
}

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

function parsePrecinct(raw: unknown, idx: number): Omit<Precinct, "initial_district_id"> & { initial_district_id?: DistrictId | null } {
  const label = `precincts[${idx}]`;
  const r = requireObject(raw, label);
  const id = requireString(r["id"], `${label}.id`) as PrecinctId;
  const editable = requireBoolean(r["editable"], `${label}.editable`);
  const total_population = requireNumber(r["total_population"], `${label}.total_population`);

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

  const groupsRaw = requireArray(r["demographic_groups"], `${label}.demographic_groups`);
  const demographic_groups = groupsRaw.map((g, i) => parseDemographicGroup(g, id, i));

  const pc: Omit<Precinct, "initial_district_id"> & { initial_district_id?: DistrictId | null } = {
    id,
    editable,
    position,
    total_population,
    demographic_groups,
  };

  if (r["county_id"] !== undefined) {
    pc.county_id = requireString(r["county_id"], `${label}.county_id`);
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
  // if key absent: pc.initial_district_id is undefined (not set)

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

  return { id, required, description, criterion };
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

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Parse and validate a raw JSON value as a Scenario.
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
  const raw = requireObject(json, "scenario");

  // ── format_version check ────────────────────────────────────────────────────
  const fv = requireString(raw["format_version"], "format_version");
  if (fv !== "1") {
    throw new Error(`format_version: unknown version "${fv}"; only "1" is supported`);
  }

  // ── Parse all fields ────────────────────────────────────────────────────────
  const id = requireString(raw["id"], "id") as ScenarioId;
  const title = requireString(raw["title"], "title");
  const etRaw = requireString(raw["election_type"], "election_type");
  if (etRaw !== "congressional" && etRaw !== "state_senate" && etRaw !== "state_house") {
    throw new Error(`election_type: must be "congressional", "state_senate", or "state_house"`);
  }
  const election_type = etRaw;

  const region = parseRegion(raw["region"]);
  const geometry = parseGeometry(raw["geometry"]);

  const partiesRaw = requireArray(raw["parties"], "parties");
  const parties = partiesRaw.map((p, i) => parseParty(p, i));

  const districtsRaw = requireArray(raw["districts"], "districts");
  const districts = districtsRaw.map((d, i) => parseDistrict(d, i));

  const precinctsRaw = requireArray(raw["precincts"], "precincts");
  const rawPrecincts = precinctsRaw.map((p, i) => parsePrecinct(p, i));

  let group_schema: GroupSchema | undefined;
  if (raw["group_schema"] !== undefined) {
    group_schema = parseGroupSchema(raw["group_schema"]);
  }

  let default_district_id: DistrictId | undefined;
  if (raw["default_district_id"] !== undefined) {
    default_district_id = requireString(raw["default_district_id"], "default_district_id") as DistrictId;
  }

  const eventsRaw = requireArray(raw["events"], "events");
  const events = eventsRaw.map((e, i) => parseEvent(e, i));

  const rules = parseRules(raw["rules"]);

  const criteriaRaw = requireArray(raw["success_criteria"], "success_criteria");
  const success_criteria = criteriaRaw.map((c, i) => parseCriterion(c, i));

  const narrative = parseNarrative(raw["narrative"]);

  let state_context: StateContext | undefined;
  if (raw["state_context"] !== undefined) {
    state_context = parseStateContext(raw["state_context"]);
  }

  // ── VALIDATION INVARIANTS ────────────────────────────────────────────────────

  // Build lookup sets for fast validation
  const partyIds = new Set(parties.map(p => p.id));
  const districtIds = new Set(districts.map(d => d.id));
  const precinctIds = new Set(rawPrecincts.map(p => p.id));

  // Build set of all GroupIds defined across all precincts
  const definedGroupIds = new Set<GroupId>();
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      definedGroupIds.add(grp.id);
    }
  }

  // ── Invariant 12: precincts.length ≥ 1 ──────────────────────────────────────
  if (rawPrecincts.length < 1) {
    throw new Error("Invariant 12: precincts must have at least 1 element");
  }

  // ── Invariant 10: districts.length ≥ 2 ──────────────────────────────────────
  if (districts.length < 2) {
    throw new Error("Invariant 10: districts must have at least 2 elements");
  }

  // ── Invariant 11: All IDs unique within scenario ─────────────────────────────
  // Spec: "All ids (EventId, CriterionId, PcId, DistId, GroupId, PartyId) unique within scenario"
  {
    const allIds = new Map<string, string>(); // id -> namespace label
    const checkId = (id: string, label: string) => {
      const existing = allIds.get(id);
      if (existing !== undefined) {
        throw new Error(`Invariant 11: duplicate id "${id}" found in both ${existing} and ${label}`);
      }
      allIds.set(id, label);
    };
    for (const p of parties) checkId(p.id, "parties");
    for (const d of districts) checkId(d.id, "districts");
    for (const pc of rawPrecincts) {
      checkId(pc.id, "precincts");
      for (const grp of pc.demographic_groups) checkId(grp.id, `precincts[${pc.id}].demographic_groups`);
    }
    for (const ev of events) checkId(ev.id, "events");
    for (const cr of success_criteria) checkId(cr.id, "success_criteria");
  }

  // ── Invariant 5: sum(population_shares) == 1.0 per precinct (±ε) ─────────────
  for (const pc of rawPrecincts) {
    const sum = pc.demographic_groups.reduce((acc, g) => acc + g.population_share, 0);
    if (Math.abs(sum - 1.0) > EPSILON) {
      throw new Error(
        `Invariant 5: precinct "${pc.id}" demographic_groups population_share sum is ${sum}, expected 1.0 (±${EPSILON})`
      );
    }
  }

  // ── Invariant 6: sum(vote_shares) == 1.0 per group (±ε); all parties present ─
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      // All parties must be present
      for (const partyId of partyIds) {
        if (!(partyId in grp.vote_shares)) {
          throw new Error(
            `Invariant 6: precinct "${pc.id}" group "${grp.id}" is missing vote_share for party "${partyId}"`
          );
        }
      }
      const sum = Object.values(grp.vote_shares).reduce((acc: number, v) => acc + (v as number), 0);
      if (Math.abs(sum - 1.0) > EPSILON) {
        throw new Error(
          `Invariant 6: precinct "${pc.id}" group "${grp.id}" vote_shares sum is ${sum}, expected 1.0 (±${EPSILON})`
        );
      }
    }
  }

  // ── Invariant 1: All PartyId refs exist in scenario.parties ─────────────────
  // Check group vote_shares keys
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      for (const pid of Object.keys(grp.vote_shares)) {
        if (!partyIds.has(pid as PartyId)) {
          throw new Error(
            `Invariant 1: precinct "${pc.id}" group "${grp.id}" references unknown party "${pid}" in vote_shares`
          );
        }
      }
    }
  }
  // Check events for party refs
  for (const ev of events) {
    if (ev.type === "vote_share_shift") {
      if (!partyIds.has(ev.party)) {
        throw new Error(
          `Invariant 1: event "${ev.id}" references unknown party "${ev.party}"`
        );
      }
    }
  }
  // Check criteria for party refs
  for (const cr of success_criteria) {
    const c = cr.criterion;
    if (c.type === "seat_count" || c.type === "mean_median" || c.type === "safe_seats") {
      if (!partyIds.has(c.party)) {
        throw new Error(
          `Invariant 1: criterion "${cr.id}" references unknown party "${c.party}"`
        );
      }
    }
  }

  // ── Invariant 2: All DistrictId refs in initial_district_id exist in scenario.districts ─
  for (const pc of rawPrecincts) {
    if (pc.initial_district_id !== undefined && pc.initial_district_id !== null) {
      if (!districtIds.has(pc.initial_district_id)) {
        throw new Error(
          `Invariant 2: precinct "${pc.id}" initial_district_id "${pc.initial_district_id}" does not exist in districts`
        );
      }
    }
  }
  if (default_district_id !== undefined && !districtIds.has(default_district_id)) {
    throw new Error(
      `Invariant 2: default_district_id "${default_district_id}" does not exist in districts`
    );
  }

  // ── Invariant 3: All GroupId refs in events/criteria exist in ≥1 precinct's demographic_groups ─
  // For dimension-based filters, also validate dimension name and value against group_schema.
  for (const ev of events) {
    const gf = ev.group_filter;
    const gids = groupFilterGroupIds(gf);
    for (const gid of gids) {
      if (!definedGroupIds.has(gid)) {
        throw new Error(
          `Invariant 3: event "${ev.id}" group_filter references unknown group "${gid}"`
        );
      }
    }
    validateDimensionFilter(gf, group_schema, `event "${ev.id}"`);
  }
  for (const cr of success_criteria) {
    const c = cr.criterion;
    if (c.type === "majority_minority") {
      const gf = c.group_filter;
      const gids = groupFilterGroupIds(gf);
      for (const gid of gids) {
        if (!definedGroupIds.has(gid)) {
          throw new Error(
            `Invariant 3: criterion "${cr.id}" group_filter references unknown group "${gid}"`
          );
        }
      }
      validateDimensionFilter(gf, group_schema, `criterion "${cr.id}"`);
    }
  }

  // ── Invariant 4: Every context precinct (editable:false) must have non-null initial_district_id ─
  for (const pc of rawPrecincts) {
    if (!pc.editable) {
      if (pc.initial_district_id === undefined || pc.initial_district_id === null) {
        throw new Error(
          `Invariant 4: context precinct "${pc.id}" (editable: false) must have a non-null initial_district_id`
        );
      }
    }
  }

  // ── Invariant 8: hex_axial → no neighbors field; custom → neighbors present + symmetric ─
  if (geometry.type === "hex_axial") {
    for (const pc of rawPrecincts) {
      if (pc.neighbors !== undefined) {
        throw new Error(
          `Invariant 8: hex_axial geometry precinct "${pc.id}" must not have a neighbors field`
        );
      }
    }
  } else {
    // custom geometry
    // Invariant 8 (custom part): neighbors must be present
    for (const pc of rawPrecincts) {
      if (pc.neighbors === undefined) {
        throw new Error(
          `Invariant 8: custom geometry precinct "${pc.id}" must have a neighbors field`
        );
      }
    }

    // ── Invariant 9: custom geometry: all PrecinctId values in neighbors[] exist in scenario.precincts ─
    for (const pc of rawPrecincts) {
      for (const nbId of pc.neighbors!) {
        if (!precinctIds.has(nbId)) {
          throw new Error(
            `Invariant 9: precinct "${pc.id}" neighbors[] references unknown precinct "${nbId}"`
          );
        }
      }
    }

    // ── Invariant 8 (symmetric): neighbors must be symmetric ─────────────────
    // Build adjacency map
    const adjMap = new Map<PrecinctId, Set<PrecinctId>>();
    for (const pc of rawPrecincts) {
      adjMap.set(pc.id, new Set(pc.neighbors!));
    }
    for (const pc of rawPrecincts) {
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

  // ── Invariant 7: If group_schema declared: completeness constraint ─────────────
  if (group_schema !== undefined) {
    const dims = group_schema.dimensions;
    const dimNames = Object.keys(dims);

    // Build expected set of dimension combos (cartesian product)
    // For each precinct: must have exactly one group per dim-value combo
    // Also: each group must have a value for every dimension

    // First verify every group has a value for every dimension
    for (const pc of rawPrecincts) {
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
    }

    // For each precinct: one group per dim-value combo (completeness)
    // Cartesian product of all dimension values
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

    const expectedCombos = cartesianProduct(dimNames, dims);

    for (const pc of rawPrecincts) {
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

  // ── Auto-fill initial_district_id for editable precincts ─────────────────────
  const fillDistrictId = default_district_id ?? districts[0]!.id;

  const precincts: Precinct[] = rawPrecincts.map(pc => {
    if (pc.editable) {
      const resolved: DistrictId =
        (pc.initial_district_id !== undefined && pc.initial_district_id !== null)
          ? pc.initial_district_id
          : fillDistrictId;
      const result: Precinct = {
        ...pc,
        initial_district_id: resolved,
      };
      return result;
    } else {
      // Context precinct: initial_district_id is required (checked in invariant 4)
      // It must be non-null at this point
      const result: Precinct = {
        ...pc,
        initial_district_id: pc.initial_district_id as DistrictId,
      };
      return result;
    }
  });

  // ── Assemble and return ──────────────────────────────────────────────────────
  const scenario: Scenario = {
    format_version: "1",
    id,
    title,
    election_type,
    region,
    geometry,
    parties,
    districts,
    precincts,
    events,
    rules,
    success_criteria,
    narrative,
  };

  if (group_schema !== undefined) scenario.group_schema = group_schema;
  if (default_district_id !== undefined) scenario.default_district_id = default_district_id;
  if (state_context !== undefined) scenario.state_context = state_context;

  return scenario;
}
