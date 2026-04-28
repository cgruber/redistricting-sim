var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => {
  return (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
};
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x3) => x3.done ? resolve(x3.value) : Promise.resolve(x3.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __yieldStar = (value) => {
  var obj = value[__knownSymbol("asyncIterator")];
  var isAwait = false;
  var method;
  var it = {};
  if (obj == null) {
    obj = value[__knownSymbol("iterator")]();
    method = (k2) => it[k2] = (x3) => obj[k2](x3);
  } else {
    obj = obj.call(value);
    method = (k2) => it[k2] = (v2) => {
      if (isAwait) {
        isAwait = false;
        if (k2 === "throw")
          throw v2;
        return v2;
      }
      isAwait = true;
      return {
        done: false,
        value: new __await(new Promise((resolve) => {
          var x3 = obj[k2](v2);
          if (!(x3 instanceof Object))
            throw TypeError("Object expected");
          resolve(x3);
        }), 1)
      };
    };
  }
  return it[__knownSymbol("iterator")] = () => it, method("next"), "throw" in obj ? method("throw") : it.throw = (x3) => {
    throw x3;
  }, "return" in obj && method("return"), it;
};

// web/src/model/loader.js
function isObject(v2) {
  return typeof v2 === "object" && v2 !== null && !Array.isArray(v2);
}
function isString(v2) {
  return typeof v2 === "string";
}
function isNumber(v2) {
  return typeof v2 === "number";
}
function isBoolean(v2) {
  return typeof v2 === "boolean";
}
function isArray(v2) {
  return Array.isArray(v2);
}
function requireString(v2, label) {
  if (!isString(v2))
    throw new Error(`${label}: expected string, got ${typeof v2}`);
  return v2;
}
function requireNumber(v2, label) {
  if (!isNumber(v2))
    throw new Error(`${label}: expected number, got ${typeof v2}`);
  return v2;
}
function requireBoolean(v2, label) {
  if (!isBoolean(v2))
    throw new Error(`${label}: expected boolean, got ${typeof v2}`);
  return v2;
}
function requireArray(v2, label) {
  if (!isArray(v2))
    throw new Error(`${label}: expected array, got ${typeof v2}`);
  return v2;
}
function requireObject(v2, label) {
  if (!isObject(v2))
    throw new Error(`${label}: expected object, got ${typeof v2}`);
  return v2;
}
function parseRegion(raw) {
  const r = requireObject(raw, "region");
  return {
    id: requireString(r["id"], "region.id"),
    name: requireString(r["name"], "region.name")
  };
}
function parseGeometry(raw) {
  const r = requireObject(raw, "geometry");
  const type2 = requireString(r["type"], "geometry.type");
  if (type2 === "hex_axial")
    return { type: "hex_axial" };
  if (type2 === "custom")
    return { type: "custom" };
  throw new Error(`geometry.type: unknown value "${type2}"`);
}
function parseParty(raw, idx) {
  const r = requireObject(raw, `parties[${idx}]`);
  return {
    id: requireString(r["id"], `parties[${idx}].id`),
    name: requireString(r["name"], `parties[${idx}].name`),
    abbreviation: requireString(r["abbreviation"], `parties[${idx}].abbreviation`)
  };
}
function parseDistrict(raw, idx) {
  const r = requireObject(raw, `districts[${idx}]`);
  const d = {
    id: requireString(r["id"], `districts[${idx}].id`)
  };
  if (r["name"] !== void 0) {
    d.name = requireString(r["name"], `districts[${idx}].name`);
  }
  return d;
}
function parseDemographicGroup(raw, precinctId, idx) {
  const label = `precinct[${precinctId}].demographic_groups[${idx}]`;
  const r = requireObject(raw, label);
  const id2 = requireString(r["id"], `${label}.id`);
  const population_share = requireNumber(r["population_share"], `${label}.population_share`);
  const turnout_rate = requireNumber(r["turnout_rate"], `${label}.turnout_rate`);
  const voteSharesRaw = requireObject(r["vote_shares"], `${label}.vote_shares`);
  const vote_shares = {};
  for (const [k2, v2] of Object.entries(voteSharesRaw)) {
    vote_shares[k2] = requireNumber(v2, `${label}.vote_shares[${k2}]`);
  }
  const grp = {
    id: id2,
    population_share,
    vote_shares,
    turnout_rate
  };
  if (r["name"] !== void 0) {
    grp.name = requireString(r["name"], `${label}.name`);
  }
  if (r["dimensions"] !== void 0) {
    const dimsRaw = requireObject(r["dimensions"], `${label}.dimensions`);
    const dims = {};
    for (const [k2, v2] of Object.entries(dimsRaw)) {
      dims[k2] = requireString(v2, `${label}.dimensions[${k2}]`);
    }
    grp.dimensions = dims;
  }
  return grp;
}
function parsePrecinct(raw, idx) {
  const label = `precincts[${idx}]`;
  const r = requireObject(raw, label);
  const id2 = requireString(r["id"], `${label}.id`);
  const editable = requireBoolean(r["editable"], `${label}.editable`);
  const total_population = requireNumber(r["total_population"], `${label}.total_population`);
  const posRaw = requireObject(r["position"], `${label}.position`);
  let position;
  if ("q" in posRaw && "r" in posRaw) {
    position = {
      q: requireNumber(posRaw["q"], `${label}.position.q`),
      r: requireNumber(posRaw["r"], `${label}.position.r`)
    };
  } else if ("x" in posRaw && "y" in posRaw) {
    position = {
      x: requireNumber(posRaw["x"], `${label}.position.x`),
      y: requireNumber(posRaw["y"], `${label}.position.y`)
    };
  } else {
    throw new Error(`${label}.position: must have {q,r} for hex_axial or {x,y} for custom`);
  }
  const groupsRaw = requireArray(r["demographic_groups"], `${label}.demographic_groups`);
  const demographic_groups = groupsRaw.map((g, i) => parseDemographicGroup(g, id2, i));
  const pc = {
    id: id2,
    editable,
    position,
    total_population,
    demographic_groups
  };
  if (r["county_id"] !== void 0) {
    pc.county_id = requireString(r["county_id"], `${label}.county_id`);
  }
  if (r["name"] !== void 0) {
    pc.name = requireString(r["name"], `${label}.name`);
  }
  if (r["tags"] !== void 0) {
    const tagsRaw = requireArray(r["tags"], `${label}.tags`);
    pc.tags = tagsRaw.map((t, i) => requireString(t, `${label}.tags[${i}]`));
  }
  if (r["neighbors"] !== void 0) {
    const nbRaw = requireArray(r["neighbors"], `${label}.neighbors`);
    pc.neighbors = nbRaw.map((n, i) => requireString(n, `${label}.neighbors[${i}]`));
  }
  if (r["initial_district_id"] !== void 0) {
    if (r["initial_district_id"] === null) {
      pc.initial_district_id = null;
    } else {
      pc.initial_district_id = requireString(r["initial_district_id"], `${label}.initial_district_id`);
    }
  }
  return pc;
}
function parseGroupSchema(raw) {
  const r = requireObject(raw, "group_schema");
  const dimsRaw = requireObject(r["dimensions"], "group_schema.dimensions");
  const dimensions = {};
  for (const [k2, v2] of Object.entries(dimsRaw)) {
    const arr = requireArray(v2, `group_schema.dimensions[${k2}]`);
    dimensions[k2] = arr.map((x3, i) => requireString(x3, `group_schema.dimensions[${k2}][${i}]`));
  }
  const erRaw = requireArray(r["eligibility_rules"], "group_schema.eligibility_rules");
  const eligibility_rules = erRaw.map((er, i) => {
    const e = requireObject(er, `group_schema.eligibility_rules[${i}]`);
    const ve = e["voter_eligible"];
    if (ve !== false)
      throw new Error(`group_schema.eligibility_rules[${i}].voter_eligible: must be false`);
    return {
      dimension: requireString(e["dimension"], `group_schema.eligibility_rules[${i}].dimension`),
      value: requireString(e["value"], `group_schema.eligibility_rules[${i}].value`),
      voter_eligible: false
    };
  });
  return { dimensions, eligibility_rules };
}
function parseGroupFilter(raw, label) {
  const r = requireObject(raw, label);
  if ("group_ids" in r) {
    const arr = requireArray(r["group_ids"], `${label}.group_ids`);
    return { group_ids: arr.map((x3, i) => requireString(x3, `${label}.group_ids[${i}]`)) };
  }
  if ("dimension" in r && "value" in r) {
    return {
      dimension: requireString(r["dimension"], `${label}.dimension`),
      value: requireString(r["value"], `${label}.value`)
    };
  }
  throw new Error(`${label}: group_filter must have group_ids or dimension+value`);
}
function parseEvent(raw, idx) {
  const label = `events[${idx}]`;
  const r = requireObject(raw, label);
  const id2 = requireString(r["id"], `${label}.id`);
  const type2 = requireString(r["type"], `${label}.type`);
  if (type2 === "turnout_shift") {
    return {
      id: id2,
      type: "turnout_shift",
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      magnitude: requireNumber(r["magnitude"], `${label}.magnitude`)
    };
  }
  if (type2 === "vote_share_shift") {
    return {
      id: id2,
      type: "vote_share_shift",
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      party: requireString(r["party"], `${label}.party`),
      delta: requireNumber(r["delta"], `${label}.delta`)
    };
  }
  if (type2 === "population_shift") {
    const pfRaw = requireObject(r["precinct_filter"], `${label}.precinct_filter`);
    let precinct_filter;
    if ("precinct_ids" in pfRaw) {
      const arr = requireArray(pfRaw["precinct_ids"], `${label}.precinct_filter.precinct_ids`);
      precinct_filter = { precinct_ids: arr.map((x3, i) => requireString(x3, `${label}.precinct_filter.precinct_ids[${i}]`)) };
    } else if ("tags" in pfRaw) {
      const arr = requireArray(pfRaw["tags"], `${label}.precinct_filter.tags`);
      precinct_filter = { tags: arr.map((x3, i) => requireString(x3, `${label}.precinct_filter.tags[${i}]`)) };
    } else if ("editable_only" in pfRaw) {
      if (pfRaw["editable_only"] !== true)
        throw new Error(`${label}.precinct_filter.editable_only must be true`);
      precinct_filter = { editable_only: true };
    } else {
      throw new Error(`${label}.precinct_filter: must have precinct_ids, tags, or editable_only`);
    }
    return {
      id: id2,
      type: "population_shift",
      precinct_filter,
      group_filter: parseGroupFilter(r["group_filter"], `${label}.group_filter`),
      delta: requireNumber(r["delta"], `${label}.delta`)
    };
  }
  throw new Error(`${label}.type: unknown event type "${type2}"`);
}
function parseCriterion(raw, idx) {
  const label = `success_criteria[${idx}]`;
  const r = requireObject(raw, label);
  const id2 = requireString(r["id"], `${label}.id`);
  const required2 = requireBoolean(r["required"], `${label}.required`);
  const description = requireString(r["description"], `${label}.description`);
  const cRaw = requireObject(r["criterion"], `${label}.criterion`);
  const cType = requireString(cRaw["type"], `${label}.criterion.type`);
  let criterion;
  switch (cType) {
    case "seat_count":
      criterion = {
        type: "seat_count",
        party: requireString(cRaw["party"], `${label}.criterion.party`),
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`),
        count: requireNumber(cRaw["count"], `${label}.criterion.count`)
      };
      break;
    case "majority_minority":
      criterion = {
        type: "majority_minority",
        group_filter: parseGroupFilter(cRaw["group_filter"], `${label}.criterion.group_filter`),
        min_eligible_share: requireNumber(cRaw["min_eligible_share"], `${label}.criterion.min_eligible_share`),
        min_districts: requireNumber(cRaw["min_districts"], `${label}.criterion.min_districts`)
      };
      break;
    case "efficiency_gap":
      criterion = {
        type: "efficiency_gap",
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`),
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`)
      };
      break;
    case "mean_median":
      criterion = {
        type: "mean_median",
        party: requireString(cRaw["party"], `${label}.criterion.party`),
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`),
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`)
      };
      break;
    case "compactness":
      criterion = {
        type: "compactness",
        operator: requireString(cRaw["operator"], `${label}.criterion.operator`),
        threshold: requireNumber(cRaw["threshold"], `${label}.criterion.threshold`)
      };
      break;
    case "safe_seats":
      criterion = {
        type: "safe_seats",
        party: requireString(cRaw["party"], `${label}.criterion.party`),
        margin: requireNumber(cRaw["margin"], `${label}.criterion.margin`),
        min_count: requireNumber(cRaw["min_count"], `${label}.criterion.min_count`)
      };
      break;
    case "competitive_seats":
      criterion = {
        type: "competitive_seats",
        margin: requireNumber(cRaw["margin"], `${label}.criterion.margin`),
        min_count: requireNumber(cRaw["min_count"], `${label}.criterion.min_count`)
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
  return { id: id2, required: required2, description, criterion };
}
function parseNarrative(raw) {
  const r = requireObject(raw, "narrative");
  const charRaw = requireObject(r["character"], "narrative.character");
  const slidesRaw = requireArray(r["intro_slides"], "narrative.intro_slides");
  const slides = slidesRaw.map((s2, i) => {
    const sr = requireObject(s2, `narrative.intro_slides[${i}]`);
    const slide = { body: requireString(sr["body"], `narrative.intro_slides[${i}].body`) };
    if (sr["heading"] !== void 0)
      slide.heading = requireString(sr["heading"], `narrative.intro_slides[${i}].heading`);
    if (sr["image"] !== void 0)
      slide.image = requireString(sr["image"], `narrative.intro_slides[${i}].image`);
    return slide;
  });
  const narrative = {
    character: {
      name: requireString(charRaw["name"], "narrative.character.name"),
      role: requireString(charRaw["role"], "narrative.character.role"),
      motivation: requireString(charRaw["motivation"], "narrative.character.motivation")
    },
    intro_slides: slides,
    objective: requireString(r["objective"], "narrative.objective")
  };
  if (r["flavor_text"] !== void 0) {
    narrative.flavor_text = requireString(r["flavor_text"], "narrative.flavor_text");
  }
  return narrative;
}
function parseRules(raw) {
  const r = requireObject(raw, "rules");
  const contiguityRaw = requireString(r["contiguity"], "rules.contiguity");
  if (contiguityRaw !== "required" && contiguityRaw !== "preferred" && contiguityRaw !== "allowed") {
    throw new Error(`rules.contiguity: must be "required", "preferred", or "allowed"`);
  }
  const rules = {
    population_tolerance: requireNumber(r["population_tolerance"], "rules.population_tolerance"),
    contiguity: contiguityRaw
  };
  if (r["compactness_threshold"] !== void 0) {
    rules.compactness_threshold = requireNumber(r["compactness_threshold"], "rules.compactness_threshold");
  }
  return rules;
}
function parseStateContext(raw) {
  const r = requireObject(raw, "state_context");
  const othersRaw = requireObject(r["other_region_results"], "state_context.other_region_results");
  const other_region_results = {};
  for (const [regionId, rr] of Object.entries(othersRaw)) {
    const rrObj = requireObject(rr, `state_context.other_region_results[${regionId}]`);
    const seatTotalsRaw = requireObject(rrObj["seat_totals"], `state_context.other_region_results[${regionId}].seat_totals`);
    const seat_totals = {};
    for (const [pid, cnt] of Object.entries(seatTotalsRaw)) {
      seat_totals[pid] = requireNumber(cnt, `state_context.other_region_results[${regionId}].seat_totals[${pid}]`);
    }
    other_region_results[regionId] = {
      district_count: requireNumber(rrObj["district_count"], `state_context.other_region_results[${regionId}].district_count`),
      seat_totals
    };
  }
  return {
    state_name: requireString(r["state_name"], "state_context.state_name"),
    total_districts: requireNumber(r["total_districts"], "state_context.total_districts"),
    other_region_results
  };
}
function groupFilterGroupIds(gf) {
  if ("group_ids" in gf)
    return gf.group_ids;
  return [];
}
function validateDimensionFilter(gf, schema, label) {
  if (!("dimension" in gf))
    return;
  if (schema === void 0) {
    throw new Error(`Invariant 3: ${label} uses a dimension GroupFilter but no group_schema is defined`);
  }
  if (!(gf.dimension in schema.dimensions)) {
    throw new Error(`Invariant 3: ${label} group_filter references unknown dimension "${gf.dimension}" (not in group_schema.dimensions)`);
  }
  const allowed = schema.dimensions[gf.dimension];
  if (allowed === void 0 || !allowed.includes(gf.value)) {
    throw new Error(`Invariant 3: ${label} group_filter dimension "${gf.dimension}" value "${gf.value}" is not in schema values [${allowed == null ? void 0 : allowed.join(", ")}]`);
  }
}
function loadScenario(json) {
  const raw = requireObject(json, "scenario");
  const fv = requireString(raw["format_version"], "format_version");
  if (fv !== "1") {
    throw new Error(`format_version: unknown version "${fv}"; only "1" is supported`);
  }
  const id2 = requireString(raw["id"], "id");
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
  let group_schema;
  if (raw["group_schema"] !== void 0) {
    group_schema = parseGroupSchema(raw["group_schema"]);
  }
  let default_district_id;
  if (raw["default_district_id"] !== void 0) {
    default_district_id = requireString(raw["default_district_id"], "default_district_id");
  }
  const eventsRaw = requireArray(raw["events"], "events");
  const events = eventsRaw.map((e, i) => parseEvent(e, i));
  const rules = parseRules(raw["rules"]);
  const criteriaRaw = requireArray(raw["success_criteria"], "success_criteria");
  const success_criteria = criteriaRaw.map((c3, i) => parseCriterion(c3, i));
  const narrative = parseNarrative(raw["narrative"]);
  let state_context;
  if (raw["state_context"] !== void 0) {
    state_context = parseStateContext(raw["state_context"]);
  }
  const partyIds = new Set(parties.map((p) => p.id));
  const districtIds = new Set(districts.map((d) => d.id));
  const precinctIds = new Set(rawPrecincts.map((p) => p.id));
  const definedGroupIds = /* @__PURE__ */ new Set();
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      definedGroupIds.add(grp.id);
    }
  }
  if (rawPrecincts.length < 1) {
    throw new Error("Invariant 12: precincts must have at least 1 element");
  }
  if (districts.length < 2) {
    throw new Error("Invariant 10: districts must have at least 2 elements");
  }
  {
    const allIds = /* @__PURE__ */ new Map();
    const checkId = (id3, label) => {
      const existing = allIds.get(id3);
      if (existing !== void 0) {
        throw new Error(`Invariant 11: duplicate id "${id3}" found in both ${existing} and ${label}`);
      }
      allIds.set(id3, label);
    };
    for (const p of parties)
      checkId(p.id, "parties");
    for (const d of districts)
      checkId(d.id, "districts");
    for (const pc of rawPrecincts) {
      checkId(pc.id, "precincts");
      for (const grp of pc.demographic_groups)
        checkId(grp.id, `precincts[${pc.id}].demographic_groups`);
    }
    for (const ev of events)
      checkId(ev.id, "events");
    for (const cr of success_criteria)
      checkId(cr.id, "success_criteria");
  }
  for (const pc of rawPrecincts) {
    const sum4 = pc.demographic_groups.reduce((acc, g) => acc + g.population_share, 0);
    if (Math.abs(sum4 - 1) > EPSILON) {
      throw new Error(`Invariant 5: precinct "${pc.id}" demographic_groups population_share sum is ${sum4}, expected 1.0 (\xB1${EPSILON})`);
    }
  }
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      for (const partyId of partyIds) {
        if (!(partyId in grp.vote_shares)) {
          throw new Error(`Invariant 6: precinct "${pc.id}" group "${grp.id}" is missing vote_share for party "${partyId}"`);
        }
      }
      const sum4 = Object.values(grp.vote_shares).reduce((acc, v2) => acc + v2, 0);
      if (Math.abs(sum4 - 1) > EPSILON) {
        throw new Error(`Invariant 6: precinct "${pc.id}" group "${grp.id}" vote_shares sum is ${sum4}, expected 1.0 (\xB1${EPSILON})`);
      }
    }
  }
  for (const pc of rawPrecincts) {
    for (const grp of pc.demographic_groups) {
      for (const pid of Object.keys(grp.vote_shares)) {
        if (!partyIds.has(pid)) {
          throw new Error(`Invariant 1: precinct "${pc.id}" group "${grp.id}" references unknown party "${pid}" in vote_shares`);
        }
      }
    }
  }
  for (const ev of events) {
    if (ev.type === "vote_share_shift") {
      if (!partyIds.has(ev.party)) {
        throw new Error(`Invariant 1: event "${ev.id}" references unknown party "${ev.party}"`);
      }
    }
  }
  for (const cr of success_criteria) {
    const c3 = cr.criterion;
    if (c3.type === "seat_count" || c3.type === "mean_median" || c3.type === "safe_seats") {
      if (!partyIds.has(c3.party)) {
        throw new Error(`Invariant 1: criterion "${cr.id}" references unknown party "${c3.party}"`);
      }
    }
  }
  for (const pc of rawPrecincts) {
    if (pc.initial_district_id !== void 0 && pc.initial_district_id !== null) {
      if (!districtIds.has(pc.initial_district_id)) {
        throw new Error(`Invariant 2: precinct "${pc.id}" initial_district_id "${pc.initial_district_id}" does not exist in districts`);
      }
    }
  }
  if (default_district_id !== void 0 && !districtIds.has(default_district_id)) {
    throw new Error(`Invariant 2: default_district_id "${default_district_id}" does not exist in districts`);
  }
  for (const ev of events) {
    const gf = ev.group_filter;
    const gids = groupFilterGroupIds(gf);
    for (const gid of gids) {
      if (!definedGroupIds.has(gid)) {
        throw new Error(`Invariant 3: event "${ev.id}" group_filter references unknown group "${gid}"`);
      }
    }
    validateDimensionFilter(gf, group_schema, `event "${ev.id}"`);
  }
  for (const cr of success_criteria) {
    const c3 = cr.criterion;
    if (c3.type === "majority_minority") {
      const gf = c3.group_filter;
      const gids = groupFilterGroupIds(gf);
      for (const gid of gids) {
        if (!definedGroupIds.has(gid)) {
          throw new Error(`Invariant 3: criterion "${cr.id}" group_filter references unknown group "${gid}"`);
        }
      }
      validateDimensionFilter(gf, group_schema, `criterion "${cr.id}"`);
    }
  }
  for (const pc of rawPrecincts) {
    if (!pc.editable) {
      if (pc.initial_district_id === void 0 || pc.initial_district_id === null) {
        throw new Error(`Invariant 4: context precinct "${pc.id}" (editable: false) must have a non-null initial_district_id`);
      }
    }
  }
  if (geometry.type === "hex_axial") {
    for (const pc of rawPrecincts) {
      if (pc.neighbors !== void 0) {
        throw new Error(`Invariant 8: hex_axial geometry precinct "${pc.id}" must not have a neighbors field`);
      }
    }
  } else {
    for (const pc of rawPrecincts) {
      if (pc.neighbors === void 0) {
        throw new Error(`Invariant 8: custom geometry precinct "${pc.id}" must have a neighbors field`);
      }
    }
    for (const pc of rawPrecincts) {
      for (const nbId of pc.neighbors) {
        if (!precinctIds.has(nbId)) {
          throw new Error(`Invariant 9: precinct "${pc.id}" neighbors[] references unknown precinct "${nbId}"`);
        }
      }
    }
    const adjMap = /* @__PURE__ */ new Map();
    for (const pc of rawPrecincts) {
      adjMap.set(pc.id, new Set(pc.neighbors));
    }
    for (const pc of rawPrecincts) {
      for (const nbId of pc.neighbors) {
        const nbNeighbors = adjMap.get(nbId);
        if (nbNeighbors === void 0 || !nbNeighbors.has(pc.id)) {
          throw new Error(`Invariant 8: custom geometry neighbors not symmetric: precinct "${pc.id}" lists "${nbId}" as neighbor, but "${nbId}" does not list "${pc.id}"`);
        }
      }
    }
  }
  if (group_schema !== void 0) {
    let cartesianProduct = function(dimNames2, dims2) {
      var _a;
      if (dimNames2.length === 0)
        return [{}];
      const first = dimNames2[0];
      const rest = dimNames2.slice(1);
      const restCombos = cartesianProduct(rest, dims2);
      const result = [];
      for (const val of (_a = dims2[first]) != null ? _a : []) {
        for (const combo of restCombos) {
          result.push(__spreadValues({ [first]: val }, combo));
        }
      }
      return result;
    };
    const dims = group_schema.dimensions;
    const dimNames = Object.keys(dims);
    for (const pc of rawPrecincts) {
      for (const grp of pc.demographic_groups) {
        for (const dimName of dimNames) {
          if (grp.dimensions === void 0 || !(dimName in grp.dimensions)) {
            throw new Error(`Invariant 7: precinct "${pc.id}" group "${grp.id}" is missing dimension "${dimName}" (required by group_schema)`);
          }
          const val = grp.dimensions[dimName];
          const allowed = dims[dimName];
          if (allowed === void 0 || !allowed.includes(val)) {
            throw new Error(`Invariant 7: precinct "${pc.id}" group "${grp.id}" dimension "${dimName}" value "${val}" is not in schema values [${allowed == null ? void 0 : allowed.join(", ")}]`);
          }
        }
      }
    }
    const expectedCombos = cartesianProduct(dimNames, dims);
    for (const pc of rawPrecincts) {
      for (const expectedCombo of expectedCombos) {
        const matchingGroups = pc.demographic_groups.filter((grp) => {
          if (grp.dimensions === void 0)
            return false;
          return dimNames.every((d) => grp.dimensions[d] === expectedCombo[d]);
        });
        if (matchingGroups.length === 0) {
          const comboStr = Object.entries(expectedCombo).map(([k2, v2]) => `${k2}=${v2}`).join(", ");
          throw new Error(`Invariant 7: precinct "${pc.id}" is missing a group for dimension combo {${comboStr}} (required by group_schema)`);
        }
        if (matchingGroups.length > 1) {
          const comboStr = Object.entries(expectedCombo).map(([k2, v2]) => `${k2}=${v2}`).join(", ");
          throw new Error(`Invariant 7: precinct "${pc.id}" has ${matchingGroups.length} groups for dimension combo {${comboStr}}; expected exactly 1`);
        }
      }
    }
  }
  const fillDistrictId = default_district_id != null ? default_district_id : districts[0].id;
  const precincts = rawPrecincts.map((pc) => {
    if (pc.editable) {
      const resolved = pc.initial_district_id !== void 0 && pc.initial_district_id !== null ? pc.initial_district_id : fillDistrictId;
      const result = __spreadProps(__spreadValues({}, pc), {
        initial_district_id: resolved
      });
      return result;
    } else {
      const result = __spreadProps(__spreadValues({}, pc), {
        initial_district_id: pc.initial_district_id
      });
      return result;
    }
  });
  const scenario = {
    format_version: "1",
    id: id2,
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
    narrative
  };
  if (group_schema !== void 0)
    scenario.group_schema = group_schema;
  if (default_district_id !== void 0)
    scenario.default_district_id = default_district_id;
  if (state_context !== void 0)
    scenario.state_context = state_context;
  return scenario;
}
var EPSILON;
var init_loader = __esm({
  "web/src/model/loader.js"() {
    EPSILON = 1e-6;
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/ascending.js
function ascending(a2, b) {
  return a2 == null || b == null ? NaN : a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
var init_ascending = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/ascending.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/descending.js
function descending(a2, b) {
  return a2 == null || b == null ? NaN : b < a2 ? -1 : b > a2 ? 1 : b >= a2 ? 0 : NaN;
}
var init_descending = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/descending.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bisector.js
function bisector(f) {
  let compare1, compare2, delta;
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x3) => ascending(f(d), x3);
    delta = (d, x3) => f(d) - x3;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left(a2, x3, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x3, x3) !== 0)
        return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a2[mid], x3) < 0)
          lo = mid + 1;
        else
          hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a2, x3, lo = 0, hi = a2.length) {
    if (lo < hi) {
      if (compare1(x3, x3) !== 0)
        return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a2[mid], x3) <= 0)
          lo = mid + 1;
        else
          hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a2, x3, lo = 0, hi = a2.length) {
    const i = left(a2, x3, lo, hi - 1);
    return i > lo && delta(a2[i - 1], x3) > -delta(a2[i], x3) ? i - 1 : i;
  }
  return { left, center, right };
}
function zero() {
  return 0;
}
var init_bisector = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bisector.js"() {
    init_ascending();
    init_descending();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/number.js
function number(x3) {
  return x3 === null ? NaN : +x3;
}
var init_number = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/number.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bisect.js
var ascendingBisect, bisectRight, bisectLeft, bisectCenter;
var init_bisect = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bisect.js"() {
    init_ascending();
    init_bisector();
    init_number();
    ascendingBisect = bisector(ascending);
    bisectRight = ascendingBisect.right;
    bisectLeft = ascendingBisect.left;
    bisectCenter = bisector(number).center;
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/blur.js
function Blur2(blur3) {
  return function(data, rx, ry = rx) {
    if (!((rx = +rx) >= 0))
      throw new RangeError("invalid rx");
    if (!((ry = +ry) >= 0))
      throw new RangeError("invalid ry");
    let { data: values, width, height } = data;
    if (!((width = Math.floor(width)) >= 0))
      throw new RangeError("invalid width");
    if (!((height = Math.floor(height !== void 0 ? height : values.length / width)) >= 0))
      throw new RangeError("invalid height");
    if (!width || !height || !rx && !ry)
      return data;
    const blurx = rx && blur3(rx);
    const blury = ry && blur3(ry);
    const temp = values.slice();
    if (blurx && blury) {
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    } else if (blurx) {
      blurh(blurx, values, temp, width, height);
      blurh(blurx, temp, values, width, height);
      blurh(blurx, values, temp, width, height);
    } else if (blury) {
      blurv(blury, values, temp, width, height);
      blurv(blury, temp, values, width, height);
      blurv(blury, values, temp, width, height);
    }
    return data;
  };
}
function blurh(blur3, T, S, w, h) {
  for (let y3 = 0, n = w * h; y3 < n; ) {
    blur3(T, S, y3, y3 += w, 1);
  }
}
function blurv(blur3, T, S, w, h) {
  for (let x3 = 0, n = w * h; x3 < w; ++x3) {
    blur3(T, S, x3, x3 + n, w);
  }
}
function blurfImage(radius) {
  const blur3 = blurf(radius);
  return (T, S, start2, stop, step) => {
    start2 <<= 2, stop <<= 2, step <<= 2;
    blur3(T, S, start2 + 0, stop + 0, step);
    blur3(T, S, start2 + 1, stop + 1, step);
    blur3(T, S, start2 + 2, stop + 2, step);
    blur3(T, S, start2 + 3, stop + 3, step);
  };
}
function blurf(radius) {
  const radius0 = Math.floor(radius);
  if (radius0 === radius)
    return bluri(radius);
  const t = radius - radius0;
  const w = 2 * radius + 1;
  return (T, S, start2, stop, step) => {
    if (!((stop -= step) >= start2))
      return;
    let sum4 = radius0 * S[start2];
    const s0 = step * radius0;
    const s1 = s0 + step;
    for (let i = start2, j = start2 + s0; i < j; i += step) {
      sum4 += S[Math.min(stop, i)];
    }
    for (let i = start2, j = stop; i <= j; i += step) {
      sum4 += S[Math.min(stop, i + s0)];
      T[i] = (sum4 + t * (S[Math.max(start2, i - s1)] + S[Math.min(stop, i + s1)])) / w;
      sum4 -= S[Math.max(start2, i - s0)];
    }
  };
}
function bluri(radius) {
  const w = 2 * radius + 1;
  return (T, S, start2, stop, step) => {
    if (!((stop -= step) >= start2))
      return;
    let sum4 = radius * S[start2];
    const s2 = step * radius;
    for (let i = start2, j = start2 + s2; i < j; i += step) {
      sum4 += S[Math.min(stop, i)];
    }
    for (let i = start2, j = stop; i <= j; i += step) {
      sum4 += S[Math.min(stop, i + s2)];
      T[i] = sum4 / w;
      sum4 -= S[Math.max(start2, i - s2)];
    }
  };
}
var blur2, blurImage;
var init_blur = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/blur.js"() {
    blur2 = Blur2(blurf);
    blurImage = Blur2(blurfImage);
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/count.js
var init_count = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/count.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/cross.js
var init_cross = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/cross.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/cumsum.js
var init_cumsum = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/cumsum.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/variance.js
var init_variance = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/variance.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/deviation.js
var init_deviation = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/deviation.js"() {
    init_variance();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/extent.js
var init_extent = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/extent.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/fsum.js
var Adder;
var init_fsum = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/fsum.js"() {
    Adder = class {
      constructor() {
        this._partials = new Float64Array(32);
        this._n = 0;
      }
      add(x3) {
        const p = this._partials;
        let i = 0;
        for (let j = 0; j < this._n && j < 32; j++) {
          const y3 = p[j], hi = x3 + y3, lo = Math.abs(x3) < Math.abs(y3) ? x3 - (hi - y3) : y3 - (hi - x3);
          if (lo)
            p[i++] = lo;
          x3 = hi;
        }
        p[i] = x3;
        this._n = i + 1;
        return this;
      }
      valueOf() {
        const p = this._partials;
        let n = this._n, x3, y3, lo, hi = 0;
        if (n > 0) {
          hi = p[--n];
          while (n > 0) {
            x3 = hi;
            y3 = p[--n];
            hi = x3 + y3;
            lo = y3 - (hi - x3);
            if (lo)
              break;
          }
          if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
            y3 = lo * 2;
            x3 = hi + y3;
            if (y3 == x3 - hi)
              hi = x3;
          }
        }
        return hi;
      }
    };
  }
});

// node_modules/.aspect_rules_js/internmap@2.0.3/node_modules/internmap/src/index.js
var init_src = __esm({
  "node_modules/.aspect_rules_js/internmap@2.0.3/node_modules/internmap/src/index.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/identity.js
var init_identity = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/identity.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/group.js
var init_group = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/group.js"() {
    init_src();
    init_identity();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/permute.js
var init_permute = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/permute.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/sort.js
var init_sort = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/sort.js"() {
    init_ascending();
    init_permute();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/groupSort.js
var init_groupSort = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/groupSort.js"() {
    init_ascending();
    init_group();
    init_sort();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/array.js
var array, slice, map;
var init_array = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/array.js"() {
    array = Array.prototype;
    slice = array.slice;
    map = array.map;
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/constant.js
var init_constant = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/ticks.js
function tickSpec(start2, stop, count3) {
  const step = (stop - start2) / Math.max(0, count3), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start2 * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start2)
      ++i1;
    if (i2 / inc > stop)
      --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start2 / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start2)
      ++i1;
    if (i2 * inc > stop)
      --i2;
  }
  if (i2 < i1 && 0.5 <= count3 && count3 < 2)
    return tickSpec(start2, stop, count3 * 2);
  return [i1, i2, inc];
}
function tickIncrement(start2, stop, count3) {
  stop = +stop, start2 = +start2, count3 = +count3;
  return tickSpec(start2, stop, count3)[2];
}
function tickStep(start2, stop, count3) {
  stop = +stop, start2 = +start2, count3 = +count3;
  const reverse2 = stop < start2, inc = reverse2 ? tickIncrement(stop, start2, count3) : tickIncrement(start2, stop, count3);
  return (reverse2 ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}
var e10, e5, e2;
var init_ticks = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/ticks.js"() {
    e10 = Math.sqrt(50);
    e5 = Math.sqrt(10);
    e2 = Math.sqrt(2);
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/nice.js
var init_nice = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/nice.js"() {
    init_ticks();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/sturges.js
var init_sturges = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/sturges.js"() {
    init_count();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bin.js
var init_bin = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/bin.js"() {
    init_array();
    init_bisect();
    init_constant();
    init_extent();
    init_identity();
    init_nice();
    init_ticks();
    init_sturges();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/max.js
var init_max = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/max.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/maxIndex.js
var init_maxIndex = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/maxIndex.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/min.js
var init_min = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/min.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/minIndex.js
var init_minIndex = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/minIndex.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/quickselect.js
var init_quickselect = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/quickselect.js"() {
    init_sort();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/greatest.js
var init_greatest = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/greatest.js"() {
    init_ascending();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/quantile.js
var init_quantile = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/quantile.js"() {
    init_max();
    init_maxIndex();
    init_min();
    init_minIndex();
    init_quickselect();
    init_number();
    init_sort();
    init_greatest();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/freedmanDiaconis.js
var init_freedmanDiaconis = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/freedmanDiaconis.js"() {
    init_count();
    init_quantile();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/scott.js
var init_scott = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/threshold/scott.js"() {
    init_count();
    init_deviation();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/mean.js
var init_mean = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/mean.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/median.js
var init_median = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/median.js"() {
    init_quantile();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/merge.js
function* flatten(arrays) {
  for (const array4 of arrays) {
    yield* __yieldStar(array4);
  }
}
function merge(arrays) {
  return Array.from(flatten(arrays));
}
var init_merge = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/merge.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/mode.js
var init_mode = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/mode.js"() {
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/pairs.js
var init_pairs = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/pairs.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/range.js
var init_range = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/range.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/rank.js
var init_rank = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/rank.js"() {
    init_ascending();
    init_sort();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/least.js
var init_least = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/least.js"() {
    init_ascending();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/leastIndex.js
var init_leastIndex = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/leastIndex.js"() {
    init_ascending();
    init_minIndex();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/greatestIndex.js
var init_greatestIndex = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/greatestIndex.js"() {
    init_ascending();
    init_maxIndex();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/scan.js
var init_scan = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/scan.js"() {
    init_leastIndex();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/shuffle.js
function shuffler(random) {
  return function shuffle2(array4, i0 = 0, i1 = array4.length) {
    let m = i1 - (i0 = +i0);
    while (m) {
      const i = random() * m-- | 0, t = array4[m + i0];
      array4[m + i0] = array4[i + i0];
      array4[i + i0] = t;
    }
    return array4;
  };
}
var shuffle_default;
var init_shuffle = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/shuffle.js"() {
    shuffle_default = shuffler(Math.random);
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/sum.js
var init_sum = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/sum.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/transpose.js
var init_transpose = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/transpose.js"() {
    init_min();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/zip.js
var init_zip = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/zip.js"() {
    init_transpose();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/every.js
var init_every = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/every.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/some.js
var init_some = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/some.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/filter.js
var init_filter = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/filter.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/map.js
var init_map = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/map.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/reduce.js
var init_reduce = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/reduce.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/reverse.js
var init_reverse = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/reverse.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/difference.js
var init_difference = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/difference.js"() {
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/disjoint.js
var init_disjoint = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/disjoint.js"() {
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/intersection.js
var init_intersection = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/intersection.js"() {
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/superset.js
var init_superset = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/superset.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/subset.js
var init_subset = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/subset.js"() {
    init_superset();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/union.js
var init_union = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/union.js"() {
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/index.js
var init_src2 = __esm({
  "node_modules/.aspect_rules_js/d3-array@3.2.4/node_modules/d3-array/src/index.js"() {
    init_bisect();
    init_ascending();
    init_bisector();
    init_blur();
    init_count();
    init_cross();
    init_cumsum();
    init_descending();
    init_deviation();
    init_extent();
    init_fsum();
    init_group();
    init_groupSort();
    init_bin();
    init_freedmanDiaconis();
    init_scott();
    init_sturges();
    init_max();
    init_maxIndex();
    init_mean();
    init_median();
    init_merge();
    init_min();
    init_minIndex();
    init_mode();
    init_nice();
    init_pairs();
    init_permute();
    init_quantile();
    init_quickselect();
    init_range();
    init_rank();
    init_least();
    init_leastIndex();
    init_greatest();
    init_greatestIndex();
    init_scan();
    init_shuffle();
    init_sum();
    init_ticks();
    init_transpose();
    init_variance();
    init_zip();
    init_every();
    init_some();
    init_filter();
    init_map();
    init_reduce();
    init_reverse();
    init_sort();
    init_difference();
    init_disjoint();
    init_intersection();
    init_subset();
    init_superset();
    init_union();
    init_src();
  }
});

// node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/identity.js
var init_identity2 = __esm({
  "node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/identity.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/axis.js
var init_axis = __esm({
  "node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/axis.js"() {
    init_identity2();
  }
});

// node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/index.js
var init_src3 = __esm({
  "node_modules/.aspect_rules_js/d3-axis@3.0.0/node_modules/d3-axis/src/index.js"() {
    init_axis();
  }
});

// node_modules/.aspect_rules_js/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js
function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t))
      throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}
function Dispatch(_) {
  this._ = _;
}
function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t))
      throw new Error("unknown type: " + t);
    return { type: t, name };
  });
}
function get(type2, name) {
  for (var i = 0, n = type2.length, c3; i < n; ++i) {
    if ((c3 = type2[i]).name === name) {
      return c3.value;
    }
  }
}
function set(type2, name, callback) {
  for (var i = 0, n = type2.length; i < n; ++i) {
    if (type2[i].name === name) {
      type2[i] = noop, type2 = type2.slice(0, i).concat(type2.slice(i + 1));
      break;
    }
  }
  if (callback != null)
    type2.push({ name, value: callback });
  return type2;
}
var noop, dispatch_default;
var init_dispatch = __esm({
  "node_modules/.aspect_rules_js/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/dispatch.js"() {
    noop = { value: () => {
    } };
    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
        if (arguments.length < 2) {
          while (++i < n)
            if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name)))
              return t;
          return;
        }
        if (callback != null && typeof callback !== "function")
          throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type)
            _[t] = set(_[t], typename.name, callback);
          else if (callback == null)
            for (t in _)
              _[t] = set(_[t], typename.name, null);
        }
        return this;
      },
      copy: function() {
        var copy3 = {}, _ = this._;
        for (var t in _)
          copy3[t] = _[t].slice();
        return new Dispatch(copy3);
      },
      call: function(type2, that) {
        if ((n = arguments.length - 2) > 0)
          for (var args = new Array(n), i = 0, n, t; i < n; ++i)
            args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type2))
          throw new Error("unknown type: " + type2);
        for (t = this._[type2], i = 0, n = t.length; i < n; ++i)
          t[i].value.apply(that, args);
      },
      apply: function(type2, that, args) {
        if (!this._.hasOwnProperty(type2))
          throw new Error("unknown type: " + type2);
        for (var t = this._[type2], i = 0, n = t.length; i < n; ++i)
          t[i].value.apply(that, args);
      }
    };
    dispatch_default = dispatch;
  }
});

// node_modules/.aspect_rules_js/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/index.js
var init_src4 = __esm({
  "node_modules/.aspect_rules_js/d3-dispatch@3.0.1/node_modules/d3-dispatch/src/index.js"() {
    init_dispatch();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/namespaces.js
var xhtml, namespaces_default;
var init_namespaces = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/namespaces.js"() {
    xhtml = "http://www.w3.org/1999/xhtml";
    namespaces_default = {
      svg: "http://www.w3.org/2000/svg",
      xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js
function namespace_default(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns")
    name = name.slice(i + 1);
  return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
}
var init_namespace = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/namespace.js"() {
    init_namespaces();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js
function creatorInherit(name) {
  return function() {
    var document2 = this.ownerDocument, uri = this.namespaceURI;
    return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
  };
}
function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}
function creator_default(name) {
  var fullname = namespace_default(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
}
var init_creator = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/creator.js"() {
    init_namespace();
    init_namespaces();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js
function none() {
}
function selector_default(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}
var init_selector = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selector.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js
function select_default(select) {
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups2 = this._groups, m = groups2.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group2[i]) && (subnode = select.call(node, node.__data__, i, group2))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
var init_select = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/select.js"() {
    init_selection();
    init_selector();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/array.js
function array2(x3) {
  return x3 == null ? [] : Array.isArray(x3) ? x3 : Array.from(x3);
}
var init_array2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/array.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js
function empty() {
  return [];
}
function selectorAll_default(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}
var init_selectorAll = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selectorAll.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js
function arrayAll(select) {
  return function() {
    return array2(select.apply(this, arguments));
  };
}
function selectAll_default(select) {
  if (typeof select === "function")
    select = arrayAll(select);
  else
    select = selectorAll_default(select);
  for (var groups2 = this._groups, m = groups2.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, node, i = 0; i < n; ++i) {
      if (node = group2[i]) {
        subgroups.push(select.call(node, node.__data__, i, group2));
        parents.push(node);
      }
    }
  }
  return new Selection(subgroups, parents);
}
var init_selectAll = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectAll.js"() {
    init_selection();
    init_array2();
    init_selectorAll();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js
function matcher_default(selector) {
  return function() {
    return this.matches(selector);
  };
}
function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}
var init_matcher = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/matcher.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js
function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}
function childFirst() {
  return this.firstElementChild;
}
function selectChild_default(match) {
  return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
}
var find;
var init_selectChild = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChild.js"() {
    init_matcher();
    find = Array.prototype.find;
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js
function children() {
  return Array.from(this.children);
}
function childrenFilter(match) {
  return function() {
    return filter2.call(this.children, match);
  };
}
function selectChildren_default(match) {
  return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}
var filter2;
var init_selectChildren = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/selectChildren.js"() {
    init_matcher();
    filter2 = Array.prototype.filter;
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js
function filter_default(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups2 = this._groups, m = groups2.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group2[i]) && match.call(node, node.__data__, i, group2)) {
        subgroup.push(node);
      }
    }
  }
  return new Selection(subgroups, this._parents);
}
var init_filter2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/filter.js"() {
    init_selection();
    init_matcher();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js
function sparse_default(update) {
  return new Array(update.length);
}
var init_sparse = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sparse.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js
function enter_default() {
  return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
}
function EnterNode(parent, datum2) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum2;
}
var init_enter = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/enter.js"() {
    init_sparse();
    init_selection();
    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) {
        return this._parent.insertBefore(child, this._next);
      },
      insertBefore: function(child, next) {
        return this._parent.insertBefore(child, next);
      },
      querySelector: function(selector) {
        return this._parent.querySelector(selector);
      },
      querySelectorAll: function(selector) {
        return this._parent.querySelectorAll(selector);
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js
function constant_default(x3) {
  return function() {
    return x3;
  };
}
var init_constant2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js
function bindIndex(parent, group2, enter, update, exit, data) {
  var i = 0, node, groupLength = group2.length, dataLength = data.length;
  for (; i < dataLength; ++i) {
    if (node = group2[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (; i < groupLength; ++i) {
    if (node = group2[i]) {
      exit[i] = node;
    }
  }
}
function bindKey(parent, group2, enter, update, exit, data, key) {
  var i, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group2.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
  for (i = 0; i < groupLength; ++i) {
    if (node = group2[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group2) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }
  for (i = 0; i < groupLength; ++i) {
    if ((node = group2[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
      exit[i] = node;
    }
  }
}
function datum(node) {
  return node.__data__;
}
function data_default(value, key) {
  if (!arguments.length)
    return Array.from(this, datum);
  var bind = key ? bindKey : bindIndex, parents = this._parents, groups2 = this._groups;
  if (typeof value !== "function")
    value = constant_default(value);
  for (var m = groups2.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j], group2 = groups2[j], groupLength = group2.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
    bind(parent, group2, enterGroup, updateGroup, exitGroup, data, key);
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1)
          i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength)
          ;
        previous._next = next || null;
      }
    }
  }
  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}
function arraylike(data) {
  return typeof data === "object" && "length" in data ? data : Array.from(data);
}
var init_data = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/data.js"() {
    init_selection();
    init_enter();
    init_constant2();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js
function exit_default() {
  return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
}
var init_exit = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/exit.js"() {
    init_sparse();
    init_selection();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js
function join_default(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter)
      enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update)
      update = update.selection();
  }
  if (onexit == null)
    exit.remove();
  else
    onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}
var init_join = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/join.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js
function merge_default(context) {
  var selection2 = context.selection ? context.selection() : context;
  for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge2 = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge2[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Selection(merges, this._parents);
}
var init_merge2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/merge.js"() {
    init_selection();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js
function order_default() {
  for (var groups2 = this._groups, j = -1, m = groups2.length; ++j < m; ) {
    for (var group2 = groups2[j], i = group2.length - 1, next = group2[i], node; --i >= 0; ) {
      if (node = group2[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4)
          next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
}
var init_order = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/order.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js
function sort_default(compare) {
  if (!compare)
    compare = ascending2;
  function compareNode(a2, b) {
    return a2 && b ? compare(a2.__data__, b.__data__) : !a2 - !b;
  }
  for (var groups2 = this._groups, m = groups2.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group2[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }
  return new Selection(sortgroups, this._parents).order();
}
function ascending2(a2, b) {
  return a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
}
var init_sort2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/sort.js"() {
    init_selection();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js
function call_default() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}
var init_call = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/call.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js
function nodes_default() {
  return Array.from(this);
}
var init_nodes = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/nodes.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js
function node_default() {
  for (var groups2 = this._groups, j = 0, m = groups2.length; j < m; ++j) {
    for (var group2 = groups2[j], i = 0, n = group2.length; i < n; ++i) {
      var node = group2[i];
      if (node)
        return node;
    }
  }
  return null;
}
var init_node = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/node.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js
function size_default() {
  let size = 0;
  for (const node of this)
    ++size;
  return size;
}
var init_size = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/size.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js
function empty_default() {
  return !this.node();
}
var init_empty = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/empty.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js
function each_default(callback) {
  for (var groups2 = this._groups, j = 0, m = groups2.length; j < m; ++j) {
    for (var group2 = groups2[j], i = 0, n = group2.length, node; i < n; ++i) {
      if (node = group2[i])
        callback.call(node, node.__data__, i, group2);
    }
  }
  return this;
}
var init_each = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/each.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js
function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}
function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}
function attrFunction(name, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.removeAttribute(name);
    else
      this.setAttribute(name, v2);
  };
}
function attrFunctionNS(fullname, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.removeAttributeNS(fullname.space, fullname.local);
    else
      this.setAttributeNS(fullname.space, fullname.local, v2);
  };
}
function attr_default(name, value) {
  var fullname = namespace_default(name);
  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }
  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
}
var init_attr = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/attr.js"() {
    init_namespace();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/window.js
function window_default(node) {
  return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
}
var init_window = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/window.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js
function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}
function styleFunction(name, value, priority) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      this.style.removeProperty(name);
    else
      this.style.setProperty(name, v2, priority);
  };
}
function style_default(name, value, priority) {
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
}
function styleValue(node, name) {
  return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
}
var init_style = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/style.js"() {
    init_window();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js
function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}
function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}
function propertyFunction(name, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (v2 == null)
      delete this[name];
    else
      this[name] = v2;
  };
}
function property_default(name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
}
var init_property = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/property.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js
function classArray(string) {
  return string.trim().split(/^|\s+/);
}
function classList(node) {
  return node.classList || new ClassList(node);
}
function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}
function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.add(names[i]);
}
function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n)
    list.remove(names[i]);
}
function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}
function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}
function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}
function classed_default(name, value) {
  var names = classArray(name + "");
  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n)
      if (!list.contains(names[i]))
        return false;
    return true;
  }
  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
}
var init_classed = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/classed.js"() {
    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js
function textRemove() {
  this.textContent = "";
}
function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction(value) {
  return function() {
    var v2 = value.apply(this, arguments);
    this.textContent = v2 == null ? "" : v2;
  };
}
function text_default(value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
}
var init_text = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/text.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js
function htmlRemove() {
  this.innerHTML = "";
}
function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}
function htmlFunction(value) {
  return function() {
    var v2 = value.apply(this, arguments);
    this.innerHTML = v2 == null ? "" : v2;
  };
}
function html_default(value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
}
var init_html = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/html.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js
function raise() {
  if (this.nextSibling)
    this.parentNode.appendChild(this);
}
function raise_default() {
  return this.each(raise);
}
var init_raise = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/raise.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js
function lower() {
  if (this.previousSibling)
    this.parentNode.insertBefore(this, this.parentNode.firstChild);
}
function lower_default() {
  return this.each(lower);
}
var init_lower = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/lower.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js
function append_default(name) {
  var create2 = typeof name === "function" ? name : creator_default(name);
  return this.select(function() {
    return this.appendChild(create2.apply(this, arguments));
  });
}
var init_append = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/append.js"() {
    init_creator();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js
function constantNull() {
  return null;
}
function insert_default(name, before) {
  var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
  return this.select(function() {
    return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
  });
}
var init_insert = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/insert.js"() {
    init_creator();
    init_selector();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js
function remove() {
  var parent = this.parentNode;
  if (parent)
    parent.removeChild(this);
}
function remove_default() {
  return this.each(remove);
}
var init_remove = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/remove.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js
function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}
function clone_default(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}
var init_clone = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/clone.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js
function datum_default(value) {
  return arguments.length ? this.property("__data__", value) : this.node().__data__;
}
var init_datum = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/datum.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js
function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}
function parseTypenames2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0)
      name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name };
  });
}
function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on)
      return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i)
      on.length = i;
    else
      delete this.__on;
  };
}
function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on)
      for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
    this.addEventListener(typename.type, listener, options);
    o = { type: typename.type, name: typename.name, value, listener, options };
    if (!on)
      this.__on = [o];
    else
      on.push(o);
  };
}
function on_default(typename, value, options) {
  var typenames = parseTypenames2(typename + ""), i, n = typenames.length, t;
  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on)
      for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
    return;
  }
  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i)
    this.each(on(typenames[i], value, options));
  return this;
}
var init_on = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/on.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js
function dispatchEvent(node, type2, params) {
  var window2 = window_default(node), event = window2.CustomEvent;
  if (typeof event === "function") {
    event = new event(type2, params);
  } else {
    event = window2.document.createEvent("Event");
    if (params)
      event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
    else
      event.initEvent(type2, false, false);
  }
  node.dispatchEvent(event);
}
function dispatchConstant(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params);
  };
}
function dispatchFunction(type2, params) {
  return function() {
    return dispatchEvent(this, type2, params.apply(this, arguments));
  };
}
function dispatch_default2(type2, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
}
var init_dispatch2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/dispatch.js"() {
    init_window();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js
function* iterator_default() {
  for (var groups2 = this._groups, j = 0, m = groups2.length; j < m; ++j) {
    for (var group2 = groups2[j], i = 0, n = group2.length, node; i < n; ++i) {
      if (node = group2[i])
        yield node;
    }
  }
}
var init_iterator = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/iterator.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js
function Selection(groups2, parents) {
  this._groups = groups2;
  this._parents = parents;
}
function selection() {
  return new Selection([[document.documentElement]], root);
}
function selection_selection() {
  return this;
}
var root, selection_default;
var init_selection = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selection/index.js"() {
    init_select();
    init_selectAll();
    init_selectChild();
    init_selectChildren();
    init_filter2();
    init_data();
    init_enter();
    init_exit();
    init_join();
    init_merge2();
    init_order();
    init_sort2();
    init_call();
    init_nodes();
    init_node();
    init_size();
    init_empty();
    init_each();
    init_attr();
    init_style();
    init_property();
    init_classed();
    init_text();
    init_html();
    init_raise();
    init_lower();
    init_append();
    init_insert();
    init_remove();
    init_clone();
    init_datum();
    init_on();
    init_dispatch2();
    init_iterator();
    root = [null];
    Selection.prototype = selection.prototype = {
      constructor: Selection,
      select: select_default,
      selectAll: selectAll_default,
      selectChild: selectChild_default,
      selectChildren: selectChildren_default,
      filter: filter_default,
      data: data_default,
      enter: enter_default,
      exit: exit_default,
      join: join_default,
      merge: merge_default,
      selection: selection_selection,
      order: order_default,
      sort: sort_default,
      call: call_default,
      nodes: nodes_default,
      node: node_default,
      size: size_default,
      empty: empty_default,
      each: each_default,
      attr: attr_default,
      style: style_default,
      property: property_default,
      classed: classed_default,
      text: text_default,
      html: html_default,
      raise: raise_default,
      lower: lower_default,
      append: append_default,
      insert: insert_default,
      remove: remove_default,
      clone: clone_default,
      datum: datum_default,
      on: on_default,
      dispatch: dispatch_default2,
      [Symbol.iterator]: iterator_default
    };
    selection_default = selection;
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/select.js
function select_default2(selector) {
  return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
}
var init_select2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/select.js"() {
    init_selection();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/create.js
var init_create = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/create.js"() {
    init_creator();
    init_select2();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/local.js
function local() {
  return new Local();
}
function Local() {
  this._ = "@" + (++nextId).toString(36);
}
var nextId;
var init_local = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/local.js"() {
    nextId = 0;
    Local.prototype = local.prototype = {
      constructor: Local,
      get: function(node) {
        var id2 = this._;
        while (!(id2 in node))
          if (!(node = node.parentNode))
            return;
        return node[id2];
      },
      set: function(node, value) {
        return node[this._] = value;
      },
      remove: function(node) {
        return this._ in node && delete node[this._];
      },
      toString: function() {
        return this._;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/sourceEvent.js
function sourceEvent_default(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent)
    event = sourceEvent;
  return event;
}
var init_sourceEvent = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/sourceEvent.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/pointer.js
function pointer_default(event, node) {
  event = sourceEvent_default(event);
  if (node === void 0)
    node = event.currentTarget;
  if (node) {
    var svg2 = node.ownerSVGElement || node;
    if (svg2.createSVGPoint) {
      var point6 = svg2.createSVGPoint();
      point6.x = event.clientX, point6.y = event.clientY;
      point6 = point6.matrixTransform(node.getScreenCTM().inverse());
      return [point6.x, point6.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}
var init_pointer = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/pointer.js"() {
    init_sourceEvent();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/pointers.js
var init_pointers = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/pointers.js"() {
    init_pointer();
    init_sourceEvent();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selectAll.js
var init_selectAll2 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/selectAll.js"() {
    init_array2();
    init_selection();
  }
});

// node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/index.js
var init_src5 = __esm({
  "node_modules/.aspect_rules_js/d3-selection@3.0.0/node_modules/d3-selection/src/index.js"() {
    init_create();
    init_creator();
    init_local();
    init_matcher();
    init_namespace();
    init_namespaces();
    init_pointer();
    init_pointers();
    init_select2();
    init_selectAll2();
    init_selection();
    init_selector();
    init_selectorAll();
    init_style();
    init_window();
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/noevent.js
function noevent_default(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
var nonpassivecapture;
var init_noevent = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/noevent.js"() {
    nonpassivecapture = { capture: true, passive: false };
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/nodrag.js
function nodrag_default(view) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", noevent_default, nonpassivecapture);
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", noevent_default, nonpassivecapture);
  } else {
    root2.__noselect = root2.style.MozUserSelect;
    root2.style.MozUserSelect = "none";
  }
}
function yesdrag(view, noclick) {
  var root2 = view.document.documentElement, selection2 = select_default2(view).on("dragstart.drag", null);
  if (noclick) {
    selection2.on("click.drag", noevent_default, nonpassivecapture);
    setTimeout(function() {
      selection2.on("click.drag", null);
    }, 0);
  }
  if ("onselectstart" in root2) {
    selection2.on("selectstart.drag", null);
  } else {
    root2.style.MozUserSelect = root2.__noselect;
    delete root2.__noselect;
  }
}
var init_nodrag = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/nodrag.js"() {
    init_src5();
    init_noevent();
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/constant.js
var init_constant3 = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/event.js
function DragEvent(type2, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x: x3,
  y: y3,
  dx,
  dy,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type2, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    subject: { value: subject, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    identifier: { value: identifier, enumerable: true, configurable: true },
    active: { value: active, enumerable: true, configurable: true },
    x: { value: x3, enumerable: true, configurable: true },
    y: { value: y3, enumerable: true, configurable: true },
    dx: { value: dx, enumerable: true, configurable: true },
    dy: { value: dy, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
var init_event = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/event.js"() {
    DragEvent.prototype.on = function() {
      var value = this._.on.apply(this._, arguments);
      return value === this._ ? this : value;
    };
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/drag.js
var init_drag = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/drag.js"() {
    init_src4();
    init_src5();
    init_nodrag();
    init_noevent();
    init_constant3();
    init_event();
  }
});

// node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/index.js
var init_src6 = __esm({
  "node_modules/.aspect_rules_js/d3-drag@3.0.0/node_modules/d3-drag/src/index.js"() {
    init_drag();
    init_nodrag();
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition)
    prototype[key] = definition[key];
  return prototype;
}
var init_define = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/define.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/color.js
function Color() {
}
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format2) {
  var m, l;
  format2 = (format2 + "").trim().toLowerCase();
  return (m = reHex.exec(format2)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format2)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format2)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format2)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format2)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r, g, b, a2) {
  if (a2 <= 0)
    r = g = b = NaN;
  return new Rgb(r, g, b, a2);
}
function rgbConvert(o) {
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a2 = clampa(this.opacity);
  return `${a2 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a2 === 1 ? ")" : `, ${a2})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h, s2, l, a2) {
  if (a2 <= 0)
    h = s2 = l = NaN;
  else if (l <= 0 || l >= 1)
    h = s2 = NaN;
  else if (s2 <= 0)
    h = NaN;
  return new Hsl(h, s2, l, a2);
}
function hslConvert(o) {
  if (o instanceof Hsl)
    return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color))
    o = color(o);
  if (!o)
    return new Hsl();
  if (o instanceof Hsl)
    return o;
  o = o.rgb();
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, min4 = Math.min(r, g, b), max5 = Math.max(r, g, b), h = NaN, s2 = max5 - min4, l = (max5 + min4) / 2;
  if (s2) {
    if (r === max5)
      h = (g - b) / s2 + (g < b) * 6;
    else if (g === max5)
      h = (b - r) / s2 + 2;
    else
      h = (r - g) / s2 + 4;
    s2 /= l < 0.5 ? max5 + min4 : 2 - max5 - min4;
    h *= 60;
  } else {
    s2 = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s2, l, o.opacity);
}
function hsl(h, s2, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s2, l, opacity == null ? 1 : opacity);
}
function Hsl(h, s2, l, opacity) {
  this.h = +h;
  this.s = +s2;
  this.l = +l;
  this.opacity = +opacity;
}
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}
var darker, brighter, reI, reN, reP, reHex, reRgbInteger, reRgbPercent, reRgbaInteger, reRgbaPercent, reHslPercent, reHslaPercent, named;
var init_color = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/color.js"() {
    init_define();
    darker = 0.7;
    brighter = 1 / darker;
    reI = "\\s*([+-]?\\d+)\\s*";
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
    reHex = /^#([0-9a-f]{3,8})$/;
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
    named = {
      aliceblue: 15792383,
      antiquewhite: 16444375,
      aqua: 65535,
      aquamarine: 8388564,
      azure: 15794175,
      beige: 16119260,
      bisque: 16770244,
      black: 0,
      blanchedalmond: 16772045,
      blue: 255,
      blueviolet: 9055202,
      brown: 10824234,
      burlywood: 14596231,
      cadetblue: 6266528,
      chartreuse: 8388352,
      chocolate: 13789470,
      coral: 16744272,
      cornflowerblue: 6591981,
      cornsilk: 16775388,
      crimson: 14423100,
      cyan: 65535,
      darkblue: 139,
      darkcyan: 35723,
      darkgoldenrod: 12092939,
      darkgray: 11119017,
      darkgreen: 25600,
      darkgrey: 11119017,
      darkkhaki: 12433259,
      darkmagenta: 9109643,
      darkolivegreen: 5597999,
      darkorange: 16747520,
      darkorchid: 10040012,
      darkred: 9109504,
      darksalmon: 15308410,
      darkseagreen: 9419919,
      darkslateblue: 4734347,
      darkslategray: 3100495,
      darkslategrey: 3100495,
      darkturquoise: 52945,
      darkviolet: 9699539,
      deeppink: 16716947,
      deepskyblue: 49151,
      dimgray: 6908265,
      dimgrey: 6908265,
      dodgerblue: 2003199,
      firebrick: 11674146,
      floralwhite: 16775920,
      forestgreen: 2263842,
      fuchsia: 16711935,
      gainsboro: 14474460,
      ghostwhite: 16316671,
      gold: 16766720,
      goldenrod: 14329120,
      gray: 8421504,
      green: 32768,
      greenyellow: 11403055,
      grey: 8421504,
      honeydew: 15794160,
      hotpink: 16738740,
      indianred: 13458524,
      indigo: 4915330,
      ivory: 16777200,
      khaki: 15787660,
      lavender: 15132410,
      lavenderblush: 16773365,
      lawngreen: 8190976,
      lemonchiffon: 16775885,
      lightblue: 11393254,
      lightcoral: 15761536,
      lightcyan: 14745599,
      lightgoldenrodyellow: 16448210,
      lightgray: 13882323,
      lightgreen: 9498256,
      lightgrey: 13882323,
      lightpink: 16758465,
      lightsalmon: 16752762,
      lightseagreen: 2142890,
      lightskyblue: 8900346,
      lightslategray: 7833753,
      lightslategrey: 7833753,
      lightsteelblue: 11584734,
      lightyellow: 16777184,
      lime: 65280,
      limegreen: 3329330,
      linen: 16445670,
      magenta: 16711935,
      maroon: 8388608,
      mediumaquamarine: 6737322,
      mediumblue: 205,
      mediumorchid: 12211667,
      mediumpurple: 9662683,
      mediumseagreen: 3978097,
      mediumslateblue: 8087790,
      mediumspringgreen: 64154,
      mediumturquoise: 4772300,
      mediumvioletred: 13047173,
      midnightblue: 1644912,
      mintcream: 16121850,
      mistyrose: 16770273,
      moccasin: 16770229,
      navajowhite: 16768685,
      navy: 128,
      oldlace: 16643558,
      olive: 8421376,
      olivedrab: 7048739,
      orange: 16753920,
      orangered: 16729344,
      orchid: 14315734,
      palegoldenrod: 15657130,
      palegreen: 10025880,
      paleturquoise: 11529966,
      palevioletred: 14381203,
      papayawhip: 16773077,
      peachpuff: 16767673,
      peru: 13468991,
      pink: 16761035,
      plum: 14524637,
      powderblue: 11591910,
      purple: 8388736,
      rebeccapurple: 6697881,
      red: 16711680,
      rosybrown: 12357519,
      royalblue: 4286945,
      saddlebrown: 9127187,
      salmon: 16416882,
      sandybrown: 16032864,
      seagreen: 3050327,
      seashell: 16774638,
      sienna: 10506797,
      silver: 12632256,
      skyblue: 8900331,
      slateblue: 6970061,
      slategray: 7372944,
      slategrey: 7372944,
      snow: 16775930,
      springgreen: 65407,
      steelblue: 4620980,
      tan: 13808780,
      teal: 32896,
      thistle: 14204888,
      tomato: 16737095,
      turquoise: 4251856,
      violet: 15631086,
      wheat: 16113331,
      white: 16777215,
      whitesmoke: 16119285,
      yellow: 16776960,
      yellowgreen: 10145074
    };
    define_default(Color, color, {
      copy(channels) {
        return Object.assign(new this.constructor(), this, channels);
      },
      displayable() {
        return this.rgb().displayable();
      },
      hex: color_formatHex,
      // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHex8: color_formatHex8,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });
    define_default(Rgb, rgb, extend(Color, {
      brighter(k2) {
        k2 = k2 == null ? brighter : Math.pow(brighter, k2);
        return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
      },
      darker(k2) {
        k2 = k2 == null ? darker : Math.pow(darker, k2);
        return new Rgb(this.r * k2, this.g * k2, this.b * k2, this.opacity);
      },
      rgb() {
        return this;
      },
      clamp() {
        return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
      },
      displayable() {
        return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex,
      // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatHex8: rgb_formatHex8,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));
    define_default(Hsl, hsl, extend(Color, {
      brighter(k2) {
        k2 = k2 == null ? brighter : Math.pow(brighter, k2);
        return new Hsl(this.h, this.s, this.l * k2, this.opacity);
      },
      darker(k2) {
        k2 = k2 == null ? darker : Math.pow(darker, k2);
        return new Hsl(this.h, this.s, this.l * k2, this.opacity);
      },
      rgb() {
        var h = this.h % 360 + (this.h < 0) * 360, s2 = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s2, m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      clamp() {
        return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
      },
      displayable() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl() {
        const a2 = clampa(this.opacity);
        return `${a2 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a2 === 1 ? ")" : `, ${a2})`}`;
      }
    }));
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/math.js
var radians, degrees;
var init_math = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/math.js"() {
    radians = Math.PI / 180;
    degrees = 180 / Math.PI;
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/lab.js
function labConvert(o) {
  if (o instanceof Lab)
    return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl)
    return hcl2lab(o);
  if (!(o instanceof Rgb))
    o = rgbConvert(o);
  var r = rgb2lrgb(o.r), g = rgb2lrgb(o.g), b = rgb2lrgb(o.b), y3 = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x3, z;
  if (r === g && g === b)
    x3 = z = y3;
  else {
    x3 = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
    z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
  }
  return new Lab(116 * y3 - 16, 500 * (x3 - y3), 200 * (y3 - z), o.opacity);
}
function lab(l, a2, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a2, b, opacity == null ? 1 : opacity);
}
function Lab(l, a2, b, opacity) {
  this.l = +l;
  this.a = +a2;
  this.b = +b;
  this.opacity = +opacity;
}
function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}
function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}
function lrgb2rgb(x3) {
  return 255 * (x3 <= 31308e-7 ? 12.92 * x3 : 1.055 * Math.pow(x3, 1 / 2.4) - 0.055);
}
function rgb2lrgb(x3) {
  return (x3 /= 255) <= 0.04045 ? x3 / 12.92 : Math.pow((x3 + 0.055) / 1.055, 2.4);
}
function hclConvert(o) {
  if (o instanceof Hcl)
    return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab))
    o = labConvert(o);
  if (o.a === 0 && o.b === 0)
    return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
  var h = Math.atan2(o.b, o.a) * degrees;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}
function hcl(h, c3, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c3, l, opacity == null ? 1 : opacity);
}
function Hcl(h, c3, l, opacity) {
  this.h = +h;
  this.c = +c3;
  this.l = +l;
  this.opacity = +opacity;
}
function hcl2lab(o) {
  if (isNaN(o.h))
    return new Lab(o.l, 0, 0, o.opacity);
  var h = o.h * radians;
  return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
}
var K, Xn, Yn, Zn, t0, t1, t2, t3;
var init_lab = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/lab.js"() {
    init_define();
    init_color();
    init_math();
    K = 18;
    Xn = 0.96422;
    Yn = 1;
    Zn = 0.82521;
    t0 = 4 / 29;
    t1 = 6 / 29;
    t2 = 3 * t1 * t1;
    t3 = t1 * t1 * t1;
    define_default(Lab, lab, extend(Color, {
      brighter(k2) {
        return new Lab(this.l + K * (k2 == null ? 1 : k2), this.a, this.b, this.opacity);
      },
      darker(k2) {
        return new Lab(this.l - K * (k2 == null ? 1 : k2), this.a, this.b, this.opacity);
      },
      rgb() {
        var y3 = (this.l + 16) / 116, x3 = isNaN(this.a) ? y3 : y3 + this.a / 500, z = isNaN(this.b) ? y3 : y3 - this.b / 200;
        x3 = Xn * lab2xyz(x3);
        y3 = Yn * lab2xyz(y3);
        z = Zn * lab2xyz(z);
        return new Rgb(
          lrgb2rgb(3.1338561 * x3 - 1.6168667 * y3 - 0.4906146 * z),
          lrgb2rgb(-0.9787684 * x3 + 1.9161415 * y3 + 0.033454 * z),
          lrgb2rgb(0.0719453 * x3 - 0.2289914 * y3 + 1.4052427 * z),
          this.opacity
        );
      }
    }));
    define_default(Hcl, hcl, extend(Color, {
      brighter(k2) {
        return new Hcl(this.h, this.c, this.l + K * (k2 == null ? 1 : k2), this.opacity);
      },
      darker(k2) {
        return new Hcl(this.h, this.c, this.l - K * (k2 == null ? 1 : k2), this.opacity);
      },
      rgb() {
        return hcl2lab(this).rgb();
      }
    }));
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/cubehelix.js
function cubehelixConvert(o) {
  if (o instanceof Cubehelix)
    return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb))
    o = rgbConvert(o);
  var r = o.r / 255, g = o.g / 255, b = o.b / 255, l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB), bl = b - l, k2 = (E * (g - l) - C * bl) / D, s2 = Math.sqrt(k2 * k2 + bl * bl) / (E * l * (1 - l)), h = s2 ? Math.atan2(k2, bl) * degrees - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s2, l, o.opacity);
}
function cubehelix(h, s2, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s2, l, opacity == null ? 1 : opacity);
}
function Cubehelix(h, s2, l, opacity) {
  this.h = +h;
  this.s = +s2;
  this.l = +l;
  this.opacity = +opacity;
}
var A, B, C, D, E, ED, EB, BC_DA;
var init_cubehelix = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/cubehelix.js"() {
    init_define();
    init_color();
    init_math();
    A = -0.14861;
    B = 1.78277;
    C = -0.29227;
    D = -0.90649;
    E = 1.97294;
    ED = E * D;
    EB = E * B;
    BC_DA = B * C - D * A;
    define_default(Cubehelix, cubehelix, extend(Color, {
      brighter(k2) {
        k2 = k2 == null ? brighter : Math.pow(brighter, k2);
        return new Cubehelix(this.h, this.s, this.l * k2, this.opacity);
      },
      darker(k2) {
        k2 = k2 == null ? darker : Math.pow(darker, k2);
        return new Cubehelix(this.h, this.s, this.l * k2, this.opacity);
      },
      rgb() {
        var h = isNaN(this.h) ? 0 : (this.h + 120) * radians, l = +this.l, a2 = isNaN(this.s) ? 0 : this.s * l * (1 - l), cosh2 = Math.cos(h), sinh2 = Math.sin(h);
        return new Rgb(
          255 * (l + a2 * (A * cosh2 + B * sinh2)),
          255 * (l + a2 * (C * cosh2 + D * sinh2)),
          255 * (l + a2 * (E * cosh2)),
          this.opacity
        );
      }
    }));
  }
});

// node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/index.js
var init_src7 = __esm({
  "node_modules/.aspect_rules_js/d3-color@3.1.0/node_modules/d3-color/src/index.js"() {
    init_color();
    init_lab();
    init_cubehelix();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basis.js
function basis(t13, v0, v1, v2, v3) {
  var t22 = t13 * t13, t32 = t22 * t13;
  return ((1 - 3 * t13 + 3 * t22 - t32) * v0 + (4 - 6 * t22 + 3 * t32) * v1 + (1 + 3 * t13 + 3 * t22 - 3 * t32) * v2 + t32 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
var init_basis = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basis.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}
var init_basisClosed = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/basisClosed.js"() {
    init_basis();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js
var constant_default3;
var init_constant4 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/constant.js"() {
    constant_default3 = (x3) => () => x3;
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js
function linear(a2, d) {
  return function(t) {
    return a2 + t * d;
  };
}
function exponential(a2, b, y3) {
  return a2 = Math.pow(a2, y3), b = Math.pow(b, y3) - a2, y3 = 1 / y3, function(t) {
    return Math.pow(a2 + t * b, y3);
  };
}
function hue(a2, b) {
  var d = b - a2;
  return d ? linear(a2, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant_default3(isNaN(a2) ? b : a2);
}
function gamma(y3) {
  return (y3 = +y3) === 1 ? nogamma : function(a2, b) {
    return b - a2 ? exponential(a2, b, y3) : constant_default3(isNaN(a2) ? b : a2);
  };
}
function nogamma(a2, b) {
  var d = b - a2;
  return d ? linear(a2, d) : constant_default3(isNaN(a2) ? b : a2);
}
var init_color2 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/color.js"() {
    init_constant4();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
    for (i = 0; i < n; ++i) {
      color2 = rgb(colors[i]);
      r[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function(t) {
      color2.r = r(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgb_default, rgbBasis, rgbBasisClosed;
var init_rgb = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/rgb.js"() {
    init_src7();
    init_basis();
    init_basisClosed();
    init_color2();
    rgb_default = function rgbGamma(y3) {
      var color2 = gamma(y3);
      function rgb2(start2, end) {
        var r = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
        return function(t) {
          start2.r = r(t);
          start2.g = g(t);
          start2.b = b(t);
          start2.opacity = opacity(t);
          return start2 + "";
        };
      }
      rgb2.gamma = rgbGamma;
      return rgb2;
    }(1);
    rgbBasis = rgbSpline(basis_default);
    rgbBasisClosed = rgbSpline(basisClosed_default);
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/numberArray.js
var init_numberArray = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/numberArray.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/array.js
var init_array3 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/array.js"() {
    init_value();
    init_numberArray();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/date.js
var init_date = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/date.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js
function number_default(a2, b) {
  return a2 = +a2, b = +b, function(t) {
    return a2 * (1 - t) + b * t;
  };
}
var init_number2 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/number.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/object.js
var init_object = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/object.js"() {
    init_value();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js
function zero2(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string_default(a2, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s2 = [], q = [];
  a2 = a2 + "", b = b + "";
  while ((am = reA.exec(a2)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s2[i])
        s2[i] += bs;
      else
        s2[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s2[i])
        s2[i] += bm;
      else
        s2[++i] = bm;
    } else {
      s2[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s2[i])
      s2[i] += bs;
    else
      s2[++i] = bs;
  }
  return s2.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2)
      s2[(o = q[i2]).i] = o.x(t);
    return s2.join("");
  });
}
var reA, reB;
var init_string = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/string.js"() {
    init_number2();
    reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
    reB = new RegExp(reA.source, "g");
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/value.js
var init_value = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/value.js"() {
    init_src7();
    init_rgb();
    init_array3();
    init_date();
    init_number2();
    init_object();
    init_string();
    init_constant4();
    init_numberArray();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/discrete.js
var init_discrete = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/discrete.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hue.js
var init_hue = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hue.js"() {
    init_color2();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/round.js
var init_round = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/round.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js
function decompose_default(a2, b, c3, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a2 * a2 + b * b))
    a2 /= scaleX, b /= scaleX;
  if (skewX = a2 * c3 + b * d)
    c3 -= a2 * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c3 * c3 + d * d))
    c3 /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a2 * d < b * c3)
    a2 = -a2, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a2) * degrees2,
    skewX: Math.atan(skewX) * degrees2,
    scaleX,
    scaleY
  };
}
var degrees2, identity2;
var init_decompose = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/decompose.js"() {
    degrees2 = 180 / Math.PI;
    identity2 = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity2 : decompose_default(m.a, m.b, m.c, m.d, m.e, m.f);
}
function parseSvg(value) {
  if (value == null)
    return identity2;
  if (!svgNode)
    svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate()))
    return identity2;
  value = value.matrix;
  return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
}
var svgNode;
var init_parse = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/parse.js"() {
    init_decompose();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js
function interpolateTransform(parse, pxComma, pxParen, degParen) {
  function pop(s2) {
    return s2.length ? s2.pop() + " " : "";
  }
  function translate(xa, ya, xb, yb, s2, q) {
    if (xa !== xb || ya !== yb) {
      var i = s2.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb || yb) {
      s2.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }
  function rotate(a2, b, s2, q) {
    if (a2 !== b) {
      if (a2 - b > 180)
        b += 360;
      else if (b - a2 > 180)
        a2 += 360;
      q.push({ i: s2.push(pop(s2) + "rotate(", null, degParen) - 2, x: number_default(a2, b) });
    } else if (b) {
      s2.push(pop(s2) + "rotate(" + b + degParen);
    }
  }
  function skewX(a2, b, s2, q) {
    if (a2 !== b) {
      q.push({ i: s2.push(pop(s2) + "skewX(", null, degParen) - 2, x: number_default(a2, b) });
    } else if (b) {
      s2.push(pop(s2) + "skewX(" + b + degParen);
    }
  }
  function scale2(xa, ya, xb, yb, s2, q) {
    if (xa !== xb || ya !== yb) {
      var i = s2.push(pop(s2) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s2.push(pop(s2) + "scale(" + xb + "," + yb + ")");
    }
  }
  return function(a2, b) {
    var s2 = [], q = [];
    a2 = parse(a2), b = parse(b);
    translate(a2.translateX, a2.translateY, b.translateX, b.translateY, s2, q);
    rotate(a2.rotate, b.rotate, s2, q);
    skewX(a2.skewX, b.skewX, s2, q);
    scale2(a2.scaleX, a2.scaleY, b.scaleX, b.scaleY, s2, q);
    a2 = b = null;
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n)
        s2[(o = q[i]).i] = o.x(t);
      return s2.join("");
    };
  };
}
var interpolateTransformCss, interpolateTransformSvg;
var init_transform = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/transform/index.js"() {
    init_number2();
    init_parse();
    interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/zoom.js
function cosh(x3) {
  return ((x3 = Math.exp(x3)) + 1 / x3) / 2;
}
function sinh(x3) {
  return ((x3 = Math.exp(x3)) - 1 / x3) / 2;
}
function tanh(x3) {
  return ((x3 = Math.exp(2 * x3)) - 1) / (x3 + 1);
}
var epsilon2, zoom_default;
var init_zoom = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/zoom.js"() {
    epsilon2 = 1e-12;
    zoom_default = function zoomRho(rho, rho2, rho4) {
      function zoom(p0, p1) {
        var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2], dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, i, S;
        if (d2 < epsilon2) {
          S = Math.log(w1 / w0) / rho;
          i = function(t) {
            return [
              ux0 + t * dx,
              uy0 + t * dy,
              w0 * Math.exp(rho * t * S)
            ];
          };
        } else {
          var d1 = Math.sqrt(d2), b02 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b12 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1), r0 = Math.log(Math.sqrt(b02 * b02 + 1) - b02), r1 = Math.log(Math.sqrt(b12 * b12 + 1) - b12);
          S = (r1 - r0) / rho;
          i = function(t) {
            var s2 = t * S, coshr0 = cosh(r0), u4 = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s2 + r0) - sinh(r0));
            return [
              ux0 + u4 * dx,
              uy0 + u4 * dy,
              w0 * coshr0 / cosh(rho * s2 + r0)
            ];
          };
        }
        i.duration = S * 1e3 * rho / Math.SQRT2;
        return i;
      }
      zoom.rho = function(_) {
        var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
        return zoomRho(_1, _2, _4);
      };
      return zoom;
    }(Math.SQRT2, 2, 4);
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hsl.js
function hsl2(hue2) {
  return function(start2, end) {
    var h = hue2((start2 = hsl(start2)).h, (end = hsl(end)).h), s2 = nogamma(start2.s, end.s), l = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.h = h(t);
      start2.s = s2(t);
      start2.l = l(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  };
}
var hsl_default, hslLong;
var init_hsl = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hsl.js"() {
    init_src7();
    init_color2();
    hsl_default = hsl2(hue);
    hslLong = hsl2(nogamma);
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/lab.js
var init_lab2 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/lab.js"() {
    init_src7();
    init_color2();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hcl.js
function hcl2(hue2) {
  return function(start2, end) {
    var h = hue2((start2 = hcl(start2)).h, (end = hcl(end)).h), c3 = nogamma(start2.c, end.c), l = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.h = h(t);
      start2.c = c3(t);
      start2.l = l(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  };
}
var hcl_default, hclLong;
var init_hcl = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/hcl.js"() {
    init_src7();
    init_color2();
    hcl_default = hcl2(hue);
    hclLong = hcl2(nogamma);
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/cubehelix.js
function cubehelix2(hue2) {
  return function cubehelixGamma(y3) {
    y3 = +y3;
    function cubehelix3(start2, end) {
      var h = hue2((start2 = cubehelix(start2)).h, (end = cubehelix(end)).h), s2 = nogamma(start2.s, end.s), l = nogamma(start2.l, end.l), opacity = nogamma(start2.opacity, end.opacity);
      return function(t) {
        start2.h = h(t);
        start2.s = s2(t);
        start2.l = l(Math.pow(t, y3));
        start2.opacity = opacity(t);
        return start2 + "";
      };
    }
    cubehelix3.gamma = cubehelixGamma;
    return cubehelix3;
  }(1);
}
var cubehelix_default, cubehelixLong;
var init_cubehelix2 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/cubehelix.js"() {
    init_src7();
    init_color2();
    cubehelix_default = cubehelix2(hue);
    cubehelixLong = cubehelix2(nogamma);
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/piecewise.js
var init_piecewise = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/piecewise.js"() {
    init_value();
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/quantize.js
var init_quantize = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/quantize.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/index.js
var init_src8 = __esm({
  "node_modules/.aspect_rules_js/d3-interpolate@3.0.1/node_modules/d3-interpolate/src/index.js"() {
    init_value();
    init_array3();
    init_basis();
    init_basisClosed();
    init_date();
    init_discrete();
    init_hue();
    init_number2();
    init_numberArray();
    init_object();
    init_round();
    init_string();
    init_transform();
    init_zoom();
    init_rgb();
    init_hsl();
    init_lab2();
    init_hcl();
    init_cubehelix2();
    init_piecewise();
    init_quantize();
  }
});

// node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}
function clearNow() {
  clockNow = 0;
}
function Timer() {
  this._call = this._time = this._next = null;
}
function timer(callback, delay, time2) {
  var t = new Timer();
  t.restart(callback, delay, time2);
  return t;
}
function timerFlush() {
  now();
  ++frame;
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0)
      t._call.call(void 0, e);
    t = t._next;
  }
  --frame;
}
function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}
function poke() {
  var now2 = clock.now(), delay = now2 - clockLast;
  if (delay > pokeDelay)
    clockSkew -= delay, clockLast = now2;
}
function nap() {
  var t03, t13 = taskHead, t22, time2 = Infinity;
  while (t13) {
    if (t13._call) {
      if (time2 > t13._time)
        time2 = t13._time;
      t03 = t13, t13 = t13._next;
    } else {
      t22 = t13._next, t13._next = null;
      t13 = t03 ? t03._next = t22 : taskHead = t22;
    }
  }
  taskTail = t03;
  sleep(time2);
}
function sleep(time2) {
  if (frame)
    return;
  if (timeout)
    timeout = clearTimeout(timeout);
  var delay = time2 - clockNow;
  if (delay > 24) {
    if (time2 < Infinity)
      timeout = setTimeout(wake, time2 - clock.now() - clockSkew);
    if (interval)
      interval = clearInterval(interval);
  } else {
    if (!interval)
      clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}
var frame, timeout, interval, pokeDelay, taskHead, taskTail, clockLast, clockNow, clockSkew, clock, setFrame;
var init_timer = __esm({
  "node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/timer.js"() {
    frame = 0;
    timeout = 0;
    interval = 0;
    pokeDelay = 1e3;
    clockLast = 0;
    clockNow = 0;
    clockSkew = 0;
    clock = typeof performance === "object" && performance.now ? performance : Date;
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
      setTimeout(f, 17);
    };
    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time2) {
        if (typeof callback !== "function")
          throw new TypeError("callback is not a function");
        time2 = (time2 == null ? now() : +time2) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail)
            taskTail._next = this;
          else
            taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time2;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js
function timeout_default(callback, delay, time2) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart((elapsed) => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time2);
  return t;
}
var init_timeout = __esm({
  "node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/timeout.js"() {
    init_timer();
  }
});

// node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/interval.js
var init_interval = __esm({
  "node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/interval.js"() {
    init_timer();
  }
});

// node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/index.js
var init_src9 = __esm({
  "node_modules/.aspect_rules_js/d3-timer@3.0.1/node_modules/d3-timer/src/index.js"() {
    init_timer();
    init_timeout();
    init_interval();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/schedule.js
function schedule_default(node, name, id2, index2, group2, timing) {
  var schedules = node.__transition;
  if (!schedules)
    node.__transition = {};
  else if (id2 in schedules)
    return;
  create(node, id2, {
    name,
    index: index2,
    // For context during callback.
    group: group2,
    // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}
function init(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > CREATED)
    throw new Error("too late; already scheduled");
  return schedule;
}
function set2(node, id2) {
  var schedule = get2(node, id2);
  if (schedule.state > STARTED)
    throw new Error("too late; already running");
  return schedule;
}
function get2(node, id2) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id2]))
    throw new Error("transition not found");
  return schedule;
}
function create(node, id2, self) {
  var schedules = node.__transition, tween;
  schedules[id2] = self;
  self.timer = timer(schedule, 0, self.time);
  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start2, self.delay, self.time);
    if (self.delay <= elapsed)
      start2(elapsed - self.delay);
  }
  function start2(elapsed) {
    var i, j, n, o;
    if (self.state !== SCHEDULED)
      return stop();
    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name)
        continue;
      if (o.state === STARTED)
        return timeout_default(start2);
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      } else if (+i < id2) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }
    timeout_default(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING)
      return;
    self.state = STARTED;
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }
  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i = -1, n = tween.length;
    while (++i < n) {
      tween[i].call(node, t);
    }
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }
  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id2];
    for (var i in schedules)
      return;
    delete node.__transition;
  }
}
var emptyOn, emptyTween, CREATED, SCHEDULED, STARTING, STARTED, RUNNING, ENDING, ENDED;
var init_schedule = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/schedule.js"() {
    init_src4();
    init_src9();
    emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
    emptyTween = [];
    CREATED = 0;
    SCHEDULED = 1;
    STARTING = 2;
    STARTED = 3;
    RUNNING = 4;
    ENDING = 5;
    ENDED = 6;
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/interrupt.js
function interrupt_default(node, name) {
  var schedules = node.__transition, schedule, active, empty2 = true, i;
  if (!schedules)
    return;
  name = name == null ? null : name + "";
  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty2 = false;
      continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }
  if (empty2)
    delete node.__transition;
}
var init_interrupt = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/interrupt.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/interrupt.js
function interrupt_default2(name) {
  return this.each(function() {
    interrupt_default(this, name);
  });
}
var init_interrupt2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/interrupt.js"() {
    init_interrupt();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/tween.js
function tweenRemove(id2, name) {
  var tween0, tween1;
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }
    schedule.tween = tween1;
  };
}
function tweenFunction(id2, name, value) {
  var tween0, tween1;
  if (typeof value !== "function")
    throw new Error();
  return function() {
    var schedule = set2(this, id2), tween = schedule.tween;
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name, value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n)
        tween1.push(t);
    }
    schedule.tween = tween1;
  };
}
function tween_default(name, value) {
  var id2 = this._id;
  name += "";
  if (arguments.length < 2) {
    var tween = get2(this.node(), id2).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }
  return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
}
function tweenValue(transition2, name, value) {
  var id2 = transition2._id;
  transition2.each(function() {
    var schedule = set2(this, id2);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });
  return function(node) {
    return get2(node, id2).value[name];
  };
}
var init_tween = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/tween.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/interpolate.js
function interpolate_default(a2, b) {
  var c3;
  return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c3 = color(b)) ? (b = c3, rgb_default) : string_default)(a2, b);
}
var init_interpolate = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/interpolate.js"() {
    init_src7();
    init_src8();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/attr.js
function attrRemove2(name) {
  return function() {
    this.removeAttribute(name);
  };
}
function attrRemoveNS2(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}
function attrConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrConstantNS2(fullname, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function attrFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attrFunctionNS2(fullname, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null)
      return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function attr_default2(name, value) {
  var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value));
}
var init_attr2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/attr.js"() {
    init_src8();
    init_src5();
    init_tween();
    init_interpolate();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/attrTween.js
function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}
function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}
function attrTweenNS(fullname, value) {
  var t03, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t03 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t03;
  }
  tween._value = value;
  return tween;
}
function attrTween(name, value) {
  var t03, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t03 = (i0 = i) && attrInterpolate(name, i);
    return t03;
  }
  tween._value = value;
  return tween;
}
function attrTween_default(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  var fullname = namespace_default(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}
var init_attrTween = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/attrTween.js"() {
    init_src5();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/delay.js
function delayFunction(id2, value) {
  return function() {
    init(this, id2).delay = +value.apply(this, arguments);
  };
}
function delayConstant(id2, value) {
  return value = +value, function() {
    init(this, id2).delay = value;
  };
}
function delay_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
}
var init_delay = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/delay.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/duration.js
function durationFunction(id2, value) {
  return function() {
    set2(this, id2).duration = +value.apply(this, arguments);
  };
}
function durationConstant(id2, value) {
  return value = +value, function() {
    set2(this, id2).duration = value;
  };
}
function duration_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
}
var init_duration = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/duration.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/ease.js
function easeConstant(id2, value) {
  if (typeof value !== "function")
    throw new Error();
  return function() {
    set2(this, id2).ease = value;
  };
}
function ease_default(value) {
  var id2 = this._id;
  return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
}
var init_ease = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/ease.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/easeVarying.js
function easeVarying(id2, value) {
  return function() {
    var v2 = value.apply(this, arguments);
    if (typeof v2 !== "function")
      throw new Error();
    set2(this, id2).ease = v2;
  };
}
function easeVarying_default(value) {
  if (typeof value !== "function")
    throw new Error();
  return this.each(easeVarying(this._id, value));
}
var init_easeVarying = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/easeVarying.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/filter.js
function filter_default2(match) {
  if (typeof match !== "function")
    match = matcher_default(match);
  for (var groups2 = this._groups, m = groups2.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group2[i]) && match.call(node, node.__data__, i, group2)) {
        subgroup.push(node);
      }
    }
  }
  return new Transition(subgroups, this._parents, this._name, this._id);
}
var init_filter3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/filter.js"() {
    init_src5();
    init_transition2();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/merge.js
function merge_default2(transition2) {
  if (transition2._id !== this._id)
    throw new Error();
  for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge2 = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge2[i] = node;
      }
    }
  }
  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }
  return new Transition(merges, this._parents, this._name, this._id);
}
var init_merge3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/merge.js"() {
    init_transition2();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/on.js
function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0)
      t = t.slice(0, i);
    return !t || t === "start";
  });
}
function onFunction(id2, name, listener) {
  var on0, on1, sit = start(name) ? init : set2;
  return function() {
    var schedule = sit(this, id2), on = schedule.on;
    if (on !== on0)
      (on1 = (on0 = on).copy()).on(name, listener);
    schedule.on = on1;
  };
}
function on_default2(name, listener) {
  var id2 = this._id;
  return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
}
var init_on2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/on.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/remove.js
function removeFunction(id2) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition)
      if (+i !== id2)
        return;
    if (parent)
      parent.removeChild(this);
  };
}
function remove_default2() {
  return this.on("end.remove", removeFunction(this._id));
}
var init_remove2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/remove.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/select.js
function select_default3(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selector_default(select);
  for (var groups2 = this._groups, m = groups2.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group2[i]) && (subnode = select.call(node, node.__data__, i, group2))) {
        if ("__data__" in node)
          subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule_default(subgroup[i], name, id2, i, subgroup, get2(node, id2));
      }
    }
  }
  return new Transition(subgroups, this._parents, name, id2);
}
var init_select3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/select.js"() {
    init_src5();
    init_transition2();
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/selectAll.js
function selectAll_default3(select) {
  var name = this._name, id2 = this._id;
  if (typeof select !== "function")
    select = selectorAll_default(select);
  for (var groups2 = this._groups, m = groups2.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, node, i = 0; i < n; ++i) {
      if (node = group2[i]) {
        for (var children2 = select.call(node, node.__data__, i, group2), child, inherit2 = get2(node, id2), k2 = 0, l = children2.length; k2 < l; ++k2) {
          if (child = children2[k2]) {
            schedule_default(child, name, id2, k2, children2, inherit2);
          }
        }
        subgroups.push(children2);
        parents.push(node);
      }
    }
  }
  return new Transition(subgroups, parents, name, id2);
}
var init_selectAll3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/selectAll.js"() {
    init_src5();
    init_transition2();
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/selection.js
function selection_default2() {
  return new Selection2(this._groups, this._parents);
}
var Selection2;
var init_selection2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/selection.js"() {
    init_src5();
    Selection2 = selection_default.prototype.constructor;
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/style.js
function styleNull(name, interpolate) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}
function styleRemove2(name) {
  return function() {
    this.style.removeProperty(name);
  };
}
function styleConstant2(name, interpolate, value1) {
  var string00, string1 = value1 + "", interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
  };
}
function styleFunction2(name, interpolate, value) {
  var string00, string10, interpolate0;
  return function() {
    var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
    if (value1 == null)
      string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}
function styleMaybeRemove(id2, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
  return function() {
    var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
    if (on !== on0 || listener0 !== listener)
      (on1 = (on0 = on).copy()).on(event, listener0 = listener);
    schedule.on = on1;
  };
}
function style_default2(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
  return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
}
var init_style2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/style.js"() {
    init_src8();
    init_src5();
    init_schedule();
    init_tween();
    init_interpolate();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/styleTween.js
function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}
function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}
function styleTween_default(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}
var init_styleTween = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/styleTween.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/text.js
function textConstant2(value) {
  return function() {
    this.textContent = value;
  };
}
function textFunction2(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}
function text_default2(value) {
  return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
}
var init_text2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/text.js"() {
    init_tween();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/textTween.js
function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}
function textTween(value) {
  var t03, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0)
      t03 = (i0 = i) && textInterpolate(i);
    return t03;
  }
  tween._value = value;
  return tween;
}
function textTween_default(value) {
  var key = "text";
  if (arguments.length < 1)
    return (key = this.tween(key)) && key._value;
  if (value == null)
    return this.tween(key, null);
  if (typeof value !== "function")
    throw new Error();
  return this.tween(key, textTween(value));
}
var init_textTween = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/textTween.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/transition.js
function transition_default() {
  var name = this._name, id0 = this._id, id1 = newId();
  for (var groups2 = this._groups, m = groups2.length, j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, node, i = 0; i < n; ++i) {
      if (node = group2[i]) {
        var inherit2 = get2(node, id0);
        schedule_default(node, name, id1, i, group2, {
          time: inherit2.time + inherit2.delay + inherit2.duration,
          delay: 0,
          duration: inherit2.duration,
          ease: inherit2.ease
        });
      }
    }
  }
  return new Transition(groups2, this._parents, name, id1);
}
var init_transition = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/transition.js"() {
    init_transition2();
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/end.js
function end_default() {
  var on0, on1, that = this, id2 = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = { value: reject }, end = { value: function() {
      if (--size === 0)
        resolve();
    } };
    that.each(function() {
      var schedule = set2(this, id2), on = schedule.on;
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }
      schedule.on = on1;
    });
    if (size === 0)
      resolve();
  });
}
var init_end = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/end.js"() {
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/index.js
function Transition(groups2, parents, name, id2) {
  this._groups = groups2;
  this._parents = parents;
  this._name = name;
  this._id = id2;
}
function transition(name) {
  return selection_default().transition(name);
}
function newId() {
  return ++id;
}
var id, selection_prototype;
var init_transition2 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/transition/index.js"() {
    init_src5();
    init_attr2();
    init_attrTween();
    init_delay();
    init_duration();
    init_ease();
    init_easeVarying();
    init_filter3();
    init_merge3();
    init_on2();
    init_remove2();
    init_select3();
    init_selectAll3();
    init_selection2();
    init_style2();
    init_styleTween();
    init_text2();
    init_textTween();
    init_transition();
    init_tween();
    init_end();
    id = 0;
    selection_prototype = selection_default.prototype;
    Transition.prototype = transition.prototype = {
      constructor: Transition,
      select: select_default3,
      selectAll: selectAll_default3,
      selectChild: selection_prototype.selectChild,
      selectChildren: selection_prototype.selectChildren,
      filter: filter_default2,
      merge: merge_default2,
      selection: selection_default2,
      transition: transition_default,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: on_default2,
      attr: attr_default2,
      attrTween: attrTween_default,
      style: style_default2,
      styleTween: styleTween_default,
      text: text_default2,
      textTween: textTween_default,
      remove: remove_default2,
      tween: tween_default,
      delay: delay_default,
      duration: duration_default,
      ease: ease_default,
      easeVarying: easeVarying_default,
      end: end_default,
      [Symbol.iterator]: selection_prototype[Symbol.iterator]
    };
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/linear.js
var init_linear = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/linear.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/quad.js
var init_quad = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/quad.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js
function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
var init_cubic = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/cubic.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/poly.js
var exponent, polyIn, polyOut, polyInOut;
var init_poly = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/poly.js"() {
    exponent = 3;
    polyIn = function custom(e) {
      e = +e;
      function polyIn2(t) {
        return Math.pow(t, e);
      }
      polyIn2.exponent = custom;
      return polyIn2;
    }(exponent);
    polyOut = function custom2(e) {
      e = +e;
      function polyOut2(t) {
        return 1 - Math.pow(1 - t, e);
      }
      polyOut2.exponent = custom2;
      return polyOut2;
    }(exponent);
    polyInOut = function custom3(e) {
      e = +e;
      function polyInOut2(t) {
        return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
      }
      polyInOut2.exponent = custom3;
      return polyInOut2;
    }(exponent);
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/sin.js
var pi, halfPi;
var init_sin = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/sin.js"() {
    pi = Math.PI;
    halfPi = pi / 2;
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/math.js
function tpmt(x3) {
  return (Math.pow(2, -10 * x3) - 9765625e-10) * 1.0009775171065494;
}
var init_math2 = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/math.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/exp.js
var init_exp = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/exp.js"() {
    init_math2();
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/circle.js
var init_circle = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/circle.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/bounce.js
var b1, b2, b3, b4, b5, b6, b7, b8, b9, b0;
var init_bounce = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/bounce.js"() {
    b1 = 4 / 11;
    b2 = 6 / 11;
    b3 = 8 / 11;
    b4 = 3 / 4;
    b5 = 9 / 11;
    b6 = 10 / 11;
    b7 = 15 / 16;
    b8 = 21 / 22;
    b9 = 63 / 64;
    b0 = 1 / b1 / b1;
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/back.js
var overshoot, backIn, backOut, backInOut;
var init_back = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/back.js"() {
    overshoot = 1.70158;
    backIn = function custom4(s2) {
      s2 = +s2;
      function backIn2(t) {
        return (t = +t) * t * (s2 * (t - 1) + t);
      }
      backIn2.overshoot = custom4;
      return backIn2;
    }(overshoot);
    backOut = function custom5(s2) {
      s2 = +s2;
      function backOut2(t) {
        return --t * t * ((t + 1) * s2 + t) + 1;
      }
      backOut2.overshoot = custom5;
      return backOut2;
    }(overshoot);
    backInOut = function custom6(s2) {
      s2 = +s2;
      function backInOut2(t) {
        return ((t *= 2) < 1 ? t * t * ((s2 + 1) * t - s2) : (t -= 2) * t * ((s2 + 1) * t + s2) + 2) / 2;
      }
      backInOut2.overshoot = custom6;
      return backInOut2;
    }(overshoot);
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/elastic.js
var tau, amplitude, period, elasticIn, elasticOut, elasticInOut;
var init_elastic = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/elastic.js"() {
    init_math2();
    tau = 2 * Math.PI;
    amplitude = 1;
    period = 0.3;
    elasticIn = function custom7(a2, p) {
      var s2 = Math.asin(1 / (a2 = Math.max(1, a2))) * (p /= tau);
      function elasticIn2(t) {
        return a2 * tpmt(- --t) * Math.sin((s2 - t) / p);
      }
      elasticIn2.amplitude = function(a3) {
        return custom7(a3, p * tau);
      };
      elasticIn2.period = function(p2) {
        return custom7(a2, p2);
      };
      return elasticIn2;
    }(amplitude, period);
    elasticOut = function custom8(a2, p) {
      var s2 = Math.asin(1 / (a2 = Math.max(1, a2))) * (p /= tau);
      function elasticOut2(t) {
        return 1 - a2 * tpmt(t = +t) * Math.sin((t + s2) / p);
      }
      elasticOut2.amplitude = function(a3) {
        return custom8(a3, p * tau);
      };
      elasticOut2.period = function(p2) {
        return custom8(a2, p2);
      };
      return elasticOut2;
    }(amplitude, period);
    elasticInOut = function custom9(a2, p) {
      var s2 = Math.asin(1 / (a2 = Math.max(1, a2))) * (p /= tau);
      function elasticInOut2(t) {
        return ((t = t * 2 - 1) < 0 ? a2 * tpmt(-t) * Math.sin((s2 - t) / p) : 2 - a2 * tpmt(t) * Math.sin((s2 + t) / p)) / 2;
      }
      elasticInOut2.amplitude = function(a3) {
        return custom9(a3, p * tau);
      };
      elasticInOut2.period = function(p2) {
        return custom9(a2, p2);
      };
      return elasticInOut2;
    }(amplitude, period);
  }
});

// node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/index.js
var init_src10 = __esm({
  "node_modules/.aspect_rules_js/d3-ease@3.0.1/node_modules/d3-ease/src/index.js"() {
    init_linear();
    init_quad();
    init_cubic();
    init_poly();
    init_sin();
    init_exp();
    init_circle();
    init_bounce();
    init_back();
    init_elastic();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/transition.js
function inherit(node, id2) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id2])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id2} not found`);
    }
  }
  return timing;
}
function transition_default2(name) {
  var id2, timing;
  if (name instanceof Transition) {
    id2 = name._id, name = name._name;
  } else {
    id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }
  for (var groups2 = this._groups, m = groups2.length, j = 0; j < m; ++j) {
    for (var group2 = groups2[j], n = group2.length, node, i = 0; i < n; ++i) {
      if (node = group2[i]) {
        schedule_default(node, name, id2, i, group2, timing || inherit(node, id2));
      }
    }
  }
  return new Transition(groups2, this._parents, name, id2);
}
var defaultTiming;
var init_transition3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/transition.js"() {
    init_transition2();
    init_schedule();
    init_src10();
    init_src9();
    defaultTiming = {
      time: null,
      // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/index.js
var init_selection3 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/selection/index.js"() {
    init_src5();
    init_interrupt2();
    init_transition3();
    selection_default.prototype.interrupt = interrupt_default2;
    selection_default.prototype.transition = transition_default2;
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/active.js
var init_active = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/active.js"() {
    init_transition2();
    init_schedule();
  }
});

// node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/index.js
var init_src11 = __esm({
  "node_modules/.aspect_rules_js/d3-transition@3.0.1_d3-selection_3.0.0/node_modules/d3-transition/src/index.js"() {
    init_selection3();
    init_transition2();
    init_active();
    init_interrupt();
  }
});

// node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/constant.js
var init_constant5 = __esm({
  "node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/event.js
var init_event2 = __esm({
  "node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/event.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/noevent.js
var init_noevent2 = __esm({
  "node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/noevent.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/brush.js
function number1(e) {
  return [+e[0], +e[1]];
}
function number2(e) {
  return [number1(e[0]), number1(e[1])];
}
function type(t) {
  return { type: t };
}
var abs, max2, min2, X, Y, XY;
var init_brush = __esm({
  "node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/brush.js"() {
    init_src4();
    init_src6();
    init_src8();
    init_src5();
    init_src11();
    init_constant5();
    init_event2();
    init_noevent2();
    ({ abs, max: max2, min: min2 } = Math);
    X = {
      name: "x",
      handles: ["w", "e"].map(type),
      input: function(x3, e) {
        return x3 == null ? null : [[+x3[0], e[0][1]], [+x3[1], e[1][1]]];
      },
      output: function(xy) {
        return xy && [xy[0][0], xy[1][0]];
      }
    };
    Y = {
      name: "y",
      handles: ["n", "s"].map(type),
      input: function(y3, e) {
        return y3 == null ? null : [[e[0][0], +y3[0]], [e[1][0], +y3[1]]];
      },
      output: function(xy) {
        return xy && [xy[0][1], xy[1][1]];
      }
    };
    XY = {
      name: "xy",
      handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
      input: function(xy) {
        return xy == null ? null : number2(xy);
      },
      output: function(xy) {
        return xy;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/index.js
var init_src12 = __esm({
  "node_modules/.aspect_rules_js/d3-brush@3.0.0/node_modules/d3-brush/src/index.js"() {
    init_brush();
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/math.js
var pi2, halfPi2, tau2;
var init_math3 = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/math.js"() {
    pi2 = Math.PI;
    halfPi2 = pi2 / 2;
    tau2 = pi2 * 2;
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/chord.js
var init_chord = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/chord.js"() {
    init_math3();
  }
});

// node_modules/.aspect_rules_js/d3-path@3.1.0/node_modules/d3-path/src/path.js
function append(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0))
    throw new Error(`invalid digits: ${digits}`);
  if (d > 15)
    return append;
  const k2 = __pow(10, d);
  return function(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k2) / k2 + strings[i];
    }
  };
}
function path() {
  return new Path();
}
var pi3, tau3, epsilon, tauEpsilon, Path;
var init_path = __esm({
  "node_modules/.aspect_rules_js/d3-path@3.1.0/node_modules/d3-path/src/path.js"() {
    pi3 = Math.PI;
    tau3 = 2 * pi3;
    epsilon = 1e-6;
    tauEpsilon = tau3 - epsilon;
    Path = class {
      constructor(digits) {
        this._x0 = this._y0 = // start of current subpath
        this._x1 = this._y1 = null;
        this._ = "";
        this._append = digits == null ? append : appendRound(digits);
      }
      moveTo(x3, y3) {
        this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y3}`;
      }
      closePath() {
        if (this._x1 !== null) {
          this._x1 = this._x0, this._y1 = this._y0;
          this._append`Z`;
        }
      }
      lineTo(x3, y3) {
        this._append`L${this._x1 = +x3},${this._y1 = +y3}`;
      }
      quadraticCurveTo(x12, y1, x3, y3) {
        this._append`Q${+x12},${+y1},${this._x1 = +x3},${this._y1 = +y3}`;
      }
      bezierCurveTo(x12, y1, x22, y22, x3, y3) {
        this._append`C${+x12},${+y1},${+x22},${+y22},${this._x1 = +x3},${this._y1 = +y3}`;
      }
      arcTo(x12, y1, x22, y22, r) {
        x12 = +x12, y1 = +y1, x22 = +x22, y22 = +y22, r = +r;
        if (r < 0)
          throw new Error(`negative radius: ${r}`);
        let x02 = this._x1, y0 = this._y1, x21 = x22 - x12, y21 = y22 - y1, x01 = x02 - x12, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
        if (this._x1 === null) {
          this._append`M${this._x1 = x12},${this._y1 = y1}`;
        } else if (!(l01_2 > epsilon))
          ;
        else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._append`L${this._x1 = x12},${this._y1 = y1}`;
        } else {
          let x20 = x22 - x02, y20 = y22 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi3 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
          if (Math.abs(t01 - 1) > epsilon) {
            this._append`L${x12 + t01 * x01},${y1 + t01 * y01}`;
          }
          this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x12 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
        }
      }
      arc(x3, y3, r, a0, a1, ccw) {
        x3 = +x3, y3 = +y3, r = +r, ccw = !!ccw;
        if (r < 0)
          throw new Error(`negative radius: ${r}`);
        let dx = r * Math.cos(a0), dy = r * Math.sin(a0), x02 = x3 + dx, y0 = y3 + dy, cw = 1 ^ ccw, da2 = ccw ? a0 - a1 : a1 - a0;
        if (this._x1 === null) {
          this._append`M${x02},${y0}`;
        } else if (Math.abs(this._x1 - x02) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
          this._append`L${x02},${y0}`;
        }
        if (!r)
          return;
        if (da2 < 0)
          da2 = da2 % tau3 + tau3;
        if (da2 > tauEpsilon) {
          this._append`A${r},${r},0,1,${cw},${x3 - dx},${y3 - dy}A${r},${r},0,1,${cw},${this._x1 = x02},${this._y1 = y0}`;
        } else if (da2 > epsilon) {
          this._append`A${r},${r},0,${+(da2 >= pi3)},${cw},${this._x1 = x3 + r * Math.cos(a1)},${this._y1 = y3 + r * Math.sin(a1)}`;
        }
      }
      rect(x3, y3, w, h) {
        this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y3}h${w = +w}v${+h}h${-w}Z`;
      }
      toString() {
        return this._;
      }
    };
    path.prototype = Path.prototype;
  }
});

// node_modules/.aspect_rules_js/d3-path@3.1.0/node_modules/d3-path/src/index.js
var init_src13 = __esm({
  "node_modules/.aspect_rules_js/d3-path@3.1.0/node_modules/d3-path/src/index.js"() {
    init_path();
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/array.js
var slice2;
var init_array4 = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/array.js"() {
    slice2 = Array.prototype.slice;
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/constant.js
var init_constant6 = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/ribbon.js
var init_ribbon = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/ribbon.js"() {
    init_src13();
    init_array4();
    init_constant6();
    init_math3();
  }
});

// node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/index.js
var init_src14 = __esm({
  "node_modules/.aspect_rules_js/d3-chord@3.0.1/node_modules/d3-chord/src/index.js"() {
    init_chord();
    init_ribbon();
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/array.js
var array3, slice3;
var init_array5 = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/array.js"() {
    array3 = Array.prototype;
    slice3 = array3.slice;
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/ascending.js
var init_ascending2 = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/ascending.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/area.js
var init_area = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/area.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/constant.js
var init_constant7 = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/contains.js
var init_contains = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/contains.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/noop.js
var init_noop = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/noop.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/contours.js
var init_contours = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/contours.js"() {
    init_src2();
    init_array5();
    init_ascending2();
    init_area();
    init_constant7();
    init_contains();
    init_noop();
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/density.js
var init_density = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/density.js"() {
    init_src2();
    init_array5();
    init_constant7();
    init_contours();
  }
});

// node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/index.js
var init_src15 = __esm({
  "node_modules/.aspect_rules_js/d3-contour@4.0.2/node_modules/d3-contour/src/index.js"() {
    init_contours();
    init_density();
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/util.js
function vec(n) {
  return new Float64Array(n);
}
var epsilon4, resulterrbound;
var init_util = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/util.js"() {
    epsilon4 = 11102230246251565e-32;
    resulterrbound = (3 + 8 * epsilon4) * epsilon4;
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/orient2d.js
var ccwerrboundA, ccwerrboundB, ccwerrboundC, B2, C1, C2, D2, u;
var init_orient2d = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/orient2d.js"() {
    init_util();
    ccwerrboundA = (3 + 16 * epsilon4) * epsilon4;
    ccwerrboundB = (2 + 12 * epsilon4) * epsilon4;
    ccwerrboundC = (9 + 64 * epsilon4) * epsilon4 * epsilon4;
    B2 = vec(4);
    C1 = vec(8);
    C2 = vec(12);
    D2 = vec(16);
    u = vec(4);
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/orient3d.js
var o3derrboundA, o3derrboundB, o3derrboundC, bc, ca, ab, at_b, at_c, bt_c, bt_a, ct_a, ct_b, bct, cat, abt, u2, _8, _8b, _16, _12, fin, fin2;
var init_orient3d = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/orient3d.js"() {
    init_util();
    o3derrboundA = (7 + 56 * epsilon4) * epsilon4;
    o3derrboundB = (3 + 28 * epsilon4) * epsilon4;
    o3derrboundC = (26 + 288 * epsilon4) * epsilon4 * epsilon4;
    bc = vec(4);
    ca = vec(4);
    ab = vec(4);
    at_b = vec(4);
    at_c = vec(4);
    bt_c = vec(4);
    bt_a = vec(4);
    ct_a = vec(4);
    ct_b = vec(4);
    bct = vec(8);
    cat = vec(8);
    abt = vec(8);
    u2 = vec(4);
    _8 = vec(8);
    _8b = vec(8);
    _16 = vec(16);
    _12 = vec(12);
    fin = vec(192);
    fin2 = vec(192);
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/incircle.js
var iccerrboundA, iccerrboundB, iccerrboundC, bc2, ca2, ab2, aa, bb, cc, u3, v, axtbc, aytbc, bxtca, bytca, cxtab, cytab, abt2, bct2, cat2, abtt, bctt, catt, _82, _162, _16b, _16c, _32, _32b, _48, _64, fin3, fin22;
var init_incircle = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/incircle.js"() {
    init_util();
    iccerrboundA = (10 + 96 * epsilon4) * epsilon4;
    iccerrboundB = (4 + 48 * epsilon4) * epsilon4;
    iccerrboundC = (44 + 576 * epsilon4) * epsilon4 * epsilon4;
    bc2 = vec(4);
    ca2 = vec(4);
    ab2 = vec(4);
    aa = vec(4);
    bb = vec(4);
    cc = vec(4);
    u3 = vec(4);
    v = vec(4);
    axtbc = vec(8);
    aytbc = vec(8);
    bxtca = vec(8);
    bytca = vec(8);
    cxtab = vec(8);
    cytab = vec(8);
    abt2 = vec(8);
    bct2 = vec(8);
    cat2 = vec(8);
    abtt = vec(4);
    bctt = vec(4);
    catt = vec(4);
    _82 = vec(8);
    _162 = vec(16);
    _16b = vec(16);
    _16c = vec(16);
    _32 = vec(32);
    _32b = vec(32);
    _48 = vec(48);
    _64 = vec(64);
    fin3 = vec(1152);
    fin22 = vec(1152);
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/insphere.js
var isperrboundA, isperrboundB, isperrboundC, ab3, bc3, cd, de, ea, ac, bd, ce, da, eb, abc, bcd, cde, dea, eab, abd, bce, cda, deb, eac, adet, bdet, cdet, ddet, edet, abdet, cddet, cdedet, deter, _83, _8b2, _8c, _163, _24, _482, _48b, _96, _192, _384x, _384y, _384z, _768, xdet, ydet, zdet, fin4;
var init_insphere = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/esm/insphere.js"() {
    init_util();
    isperrboundA = (16 + 224 * epsilon4) * epsilon4;
    isperrboundB = (5 + 72 * epsilon4) * epsilon4;
    isperrboundC = (71 + 1408 * epsilon4) * epsilon4 * epsilon4;
    ab3 = vec(4);
    bc3 = vec(4);
    cd = vec(4);
    de = vec(4);
    ea = vec(4);
    ac = vec(4);
    bd = vec(4);
    ce = vec(4);
    da = vec(4);
    eb = vec(4);
    abc = vec(24);
    bcd = vec(24);
    cde = vec(24);
    dea = vec(24);
    eab = vec(24);
    abd = vec(24);
    bce = vec(24);
    cda = vec(24);
    deb = vec(24);
    eac = vec(24);
    adet = vec(1152);
    bdet = vec(1152);
    cdet = vec(1152);
    ddet = vec(1152);
    edet = vec(1152);
    abdet = vec(2304);
    cddet = vec(2304);
    cdedet = vec(3456);
    deter = vec(5760);
    _83 = vec(8);
    _8b2 = vec(8);
    _8c = vec(8);
    _163 = vec(16);
    _24 = vec(24);
    _482 = vec(48);
    _48b = vec(48);
    _96 = vec(96);
    _192 = vec(192);
    _384x = vec(384);
    _384y = vec(384);
    _384z = vec(384);
    _768 = vec(768);
    xdet = vec(96);
    ydet = vec(96);
    zdet = vec(96);
    fin4 = vec(1152);
  }
});

// node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/index.js
var init_robust_predicates = __esm({
  "node_modules/.aspect_rules_js/robust-predicates@3.0.3/node_modules/robust-predicates/index.js"() {
    init_orient2d();
    init_orient3d();
    init_incircle();
    init_insphere();
  }
});

// node_modules/.aspect_rules_js/delaunator@5.1.0/node_modules/delaunator/index.js
var EPSILON2, EDGE_STACK;
var init_delaunator = __esm({
  "node_modules/.aspect_rules_js/delaunator@5.1.0/node_modules/delaunator/index.js"() {
    init_robust_predicates();
    EPSILON2 = Math.pow(2, -52);
    EDGE_STACK = new Uint32Array(512);
  }
});

// node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/path.js
var init_path2 = __esm({
  "node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/path.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/polygon.js
var init_polygon = __esm({
  "node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/polygon.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/voronoi.js
var init_voronoi = __esm({
  "node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/voronoi.js"() {
    init_path2();
    init_polygon();
  }
});

// node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/delaunay.js
var tau4;
var init_delaunay = __esm({
  "node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/delaunay.js"() {
    init_delaunator();
    init_path2();
    init_polygon();
    init_voronoi();
    tau4 = 2 * Math.PI;
  }
});

// node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/index.js
var init_src16 = __esm({
  "node_modules/.aspect_rules_js/d3-delaunay@6.0.4/node_modules/d3-delaunay/src/index.js"() {
    init_delaunay();
    init_voronoi();
  }
});

// node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/dsv.js
function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + '] || ""';
  }).join(",") + "}");
}
function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}
function inferColumns(rows) {
  var columnSet = /* @__PURE__ */ Object.create(null), columns = [];
  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });
  return columns;
}
function pad(value, width) {
  var s2 = value + "", length = s2.length;
  return length < width ? new Array(width - length + 1).join(0) + s2 : s2;
}
function formatYear(year) {
  return year < 0 ? "-" + pad(-year, 6) : year > 9999 ? "+" + pad(year, 6) : pad(year, 4);
}
function formatDate(date) {
  var hours = date.getUTCHours(), minutes = date.getUTCMinutes(), seconds2 = date.getUTCSeconds(), milliseconds2 = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date" : formatYear(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2) + (milliseconds2 ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds2, 2) + "." + pad(milliseconds2, 3) + "Z" : seconds2 ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds2, 2) + "Z" : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z" : "");
}
function dsv_default(delimiter) {
  var reFormat = new RegExp('["' + delimiter + "\n\r]"), DELIMITER = delimiter.charCodeAt(0);
  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert)
        return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns || [];
    return rows;
  }
  function parseRows(text, f) {
    var rows = [], N = text.length, I = 0, n = 0, t, eof = N <= 0, eol = false;
    if (text.charCodeAt(N - 1) === NEWLINE)
      --N;
    if (text.charCodeAt(N - 1) === RETURN)
      --N;
    function token() {
      if (eof)
        return EOF;
      if (eol)
        return eol = false, EOL;
      var i, j = I, c3;
      if (text.charCodeAt(j) === QUOTE) {
        while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE)
          ;
        if ((i = I) >= N)
          eof = true;
        else if ((c3 = text.charCodeAt(I++)) === NEWLINE)
          eol = true;
        else if (c3 === RETURN) {
          eol = true;
          if (text.charCodeAt(I) === NEWLINE)
            ++I;
        }
        return text.slice(j + 1, i - 1).replace(/""/g, '"');
      }
      while (I < N) {
        if ((c3 = text.charCodeAt(i = I++)) === NEWLINE)
          eol = true;
        else if (c3 === RETURN) {
          eol = true;
          if (text.charCodeAt(I) === NEWLINE)
            ++I;
        } else if (c3 !== DELIMITER)
          continue;
        return text.slice(j, i);
      }
      return eof = true, text.slice(j, N);
    }
    while ((t = token()) !== EOF) {
      var row = [];
      while (t !== EOL && t !== EOF)
        row.push(t), t = token();
      if (f && (row = f(row, n++)) == null)
        continue;
      rows.push(row);
    }
    return rows;
  }
  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }
  function format2(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }
  function formatBody(rows, columns) {
    if (columns == null)
      columns = inferColumns(rows);
    return preformatBody(rows, columns).join("\n");
  }
  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }
  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }
  function formatValue(value) {
    return value == null ? "" : value instanceof Date ? formatDate(value) : reFormat.test(value += "") ? '"' + value.replace(/"/g, '""') + '"' : value;
  }
  return {
    parse,
    parseRows,
    format: format2,
    formatBody,
    formatRows,
    formatRow,
    formatValue
  };
}
var EOL, EOF, QUOTE, NEWLINE, RETURN;
var init_dsv = __esm({
  "node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/dsv.js"() {
    EOL = {};
    EOF = {};
    QUOTE = 34;
    NEWLINE = 10;
    RETURN = 13;
  }
});

// node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/csv.js
var csv, csvParse, csvParseRows, csvFormat, csvFormatBody, csvFormatRows, csvFormatRow, csvFormatValue;
var init_csv = __esm({
  "node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/csv.js"() {
    init_dsv();
    csv = dsv_default(",");
    csvParse = csv.parse;
    csvParseRows = csv.parseRows;
    csvFormat = csv.format;
    csvFormatBody = csv.formatBody;
    csvFormatRows = csv.formatRows;
    csvFormatRow = csv.formatRow;
    csvFormatValue = csv.formatValue;
  }
});

// node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/tsv.js
var tsv, tsvParse, tsvParseRows, tsvFormat, tsvFormatBody, tsvFormatRows, tsvFormatRow, tsvFormatValue;
var init_tsv = __esm({
  "node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/tsv.js"() {
    init_dsv();
    tsv = dsv_default("	");
    tsvParse = tsv.parse;
    tsvParseRows = tsv.parseRows;
    tsvFormat = tsv.format;
    tsvFormatBody = tsv.formatBody;
    tsvFormatRows = tsv.formatRows;
    tsvFormatRow = tsv.formatRow;
    tsvFormatValue = tsv.formatValue;
  }
});

// node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/autoType.js
var fixtz;
var init_autoType = __esm({
  "node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/autoType.js"() {
    fixtz = (/* @__PURE__ */ new Date("2019-01-01T00:00")).getHours() || (/* @__PURE__ */ new Date("2019-07-01T00:00")).getHours();
  }
});

// node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/index.js
var init_src17 = __esm({
  "node_modules/.aspect_rules_js/d3-dsv@3.0.1/node_modules/d3-dsv/src/index.js"() {
    init_dsv();
    init_csv();
    init_tsv();
    init_autoType();
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/blob.js
var init_blob = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/blob.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/buffer.js
var init_buffer = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/buffer.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/text.js
function responseText(response) {
  if (!response.ok)
    throw new Error(response.status + " " + response.statusText);
  return response.text();
}
function text_default3(input, init2) {
  return fetch(input, init2).then(responseText);
}
var init_text3 = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/text.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/dsv.js
function dsvParse(parse) {
  return function(input, init2, row) {
    if (arguments.length === 2 && typeof init2 === "function")
      row = init2, init2 = void 0;
    return text_default3(input, init2).then(function(response) {
      return parse(response, row);
    });
  };
}
var csv2, tsv2;
var init_dsv2 = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/dsv.js"() {
    init_src17();
    init_text3();
    csv2 = dsvParse(csvParse);
    tsv2 = dsvParse(tsvParse);
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/image.js
var init_image = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/image.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/json.js
var init_json = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/json.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/xml.js
function parser(type2) {
  return (input, init2) => text_default3(input, init2).then((text) => new DOMParser().parseFromString(text, type2));
}
var xml_default, html, svg;
var init_xml = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/xml.js"() {
    init_text3();
    xml_default = parser("application/xml");
    html = parser("text/html");
    svg = parser("image/svg+xml");
  }
});

// node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/index.js
var init_src18 = __esm({
  "node_modules/.aspect_rules_js/d3-fetch@3.0.1/node_modules/d3-fetch/src/index.js"() {
    init_blob();
    init_buffer();
    init_dsv2();
    init_image();
    init_json();
    init_text3();
    init_xml();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/center.js
var init_center = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/center.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/add.js
function add_default(d) {
  const x3 = +this._x.call(null, d), y3 = +this._y.call(null, d);
  return add(this.cover(x3, y3), x3, y3, d);
}
function add(tree, x3, y3, d) {
  if (isNaN(x3) || isNaN(y3))
    return tree;
  var parent, node = tree._root, leaf = { data: d }, x02 = tree._x0, y0 = tree._y0, x12 = tree._x1, y1 = tree._y1, xm, ym, xp, yp, right, bottom, i, j;
  if (!node)
    return tree._root = leaf, tree;
  while (node.length) {
    if (right = x3 >= (xm = (x02 + x12) / 2))
      x02 = xm;
    else
      x12 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right]))
      return parent[i] = leaf, tree;
  }
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x3 === xp && y3 === yp)
    return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x3 >= (xm = (x02 + x12) / 2))
      x02 = xm;
    else
      x12 = xm;
    if (bottom = y3 >= (ym = (y0 + y1) / 2))
      y0 = ym;
    else
      y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}
function addAll(data) {
  var d, i, n = data.length, x3, y3, xz = new Array(n), yz = new Array(n), x02 = Infinity, y0 = Infinity, x12 = -Infinity, y1 = -Infinity;
  for (i = 0; i < n; ++i) {
    if (isNaN(x3 = +this._x.call(null, d = data[i])) || isNaN(y3 = +this._y.call(null, d)))
      continue;
    xz[i] = x3;
    yz[i] = y3;
    if (x3 < x02)
      x02 = x3;
    if (x3 > x12)
      x12 = x3;
    if (y3 < y0)
      y0 = y3;
    if (y3 > y1)
      y1 = y3;
  }
  if (x02 > x12 || y0 > y1)
    return this;
  this.cover(x02, y0).cover(x12, y1);
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }
  return this;
}
var init_add = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/add.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/cover.js
function cover_default(x3, y3) {
  if (isNaN(x3 = +x3) || isNaN(y3 = +y3))
    return this;
  var x02 = this._x0, y0 = this._y0, x12 = this._x1, y1 = this._y1;
  if (isNaN(x02)) {
    x12 = (x02 = Math.floor(x3)) + 1;
    y1 = (y0 = Math.floor(y3)) + 1;
  } else {
    var z = x12 - x02 || 1, node = this._root, parent, i;
    while (x02 > x3 || x3 >= x12 || y0 > y3 || y3 >= y1) {
      i = (y3 < y0) << 1 | x3 < x02;
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0:
          x12 = x02 + z, y1 = y0 + z;
          break;
        case 1:
          x02 = x12 - z, y1 = y0 + z;
          break;
        case 2:
          x12 = x02 + z, y0 = y1 - z;
          break;
        case 3:
          x02 = x12 - z, y0 = y1 - z;
          break;
      }
    }
    if (this._root && this._root.length)
      this._root = node;
  }
  this._x0 = x02;
  this._y0 = y0;
  this._x1 = x12;
  this._y1 = y1;
  return this;
}
var init_cover = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/cover.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/data.js
function data_default2() {
  var data = [];
  this.visit(function(node) {
    if (!node.length)
      do
        data.push(node.data);
      while (node = node.next);
  });
  return data;
}
var init_data2 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/data.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/extent.js
function extent_default(_) {
  return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0], [this._x1, this._y1]];
}
var init_extent2 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/extent.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/quad.js
function quad_default(node, x02, y0, x12, y1) {
  this.node = node;
  this.x0 = x02;
  this.y0 = y0;
  this.x1 = x12;
  this.y1 = y1;
}
var init_quad2 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/quad.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/find.js
function find_default(x3, y3, radius) {
  var data, x02 = this._x0, y0 = this._y0, x12, y1, x22, y22, x32 = this._x1, y32 = this._y1, quads = [], node = this._root, q, i;
  if (node)
    quads.push(new quad_default(node, x02, y0, x32, y32));
  if (radius == null)
    radius = Infinity;
  else {
    x02 = x3 - radius, y0 = y3 - radius;
    x32 = x3 + radius, y32 = y3 + radius;
    radius *= radius;
  }
  while (q = quads.pop()) {
    if (!(node = q.node) || (x12 = q.x0) > x32 || (y1 = q.y0) > y32 || (x22 = q.x1) < x02 || (y22 = q.y1) < y0)
      continue;
    if (node.length) {
      var xm = (x12 + x22) / 2, ym = (y1 + y22) / 2;
      quads.push(
        new quad_default(node[3], xm, ym, x22, y22),
        new quad_default(node[2], x12, ym, xm, y22),
        new quad_default(node[1], xm, y1, x22, ym),
        new quad_default(node[0], x12, y1, xm, ym)
      );
      if (i = (y3 >= ym) << 1 | x3 >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    } else {
      var dx = x3 - +this._x.call(null, node.data), dy = y3 - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x02 = x3 - d, y0 = y3 - d;
        x32 = x3 + d, y32 = y3 + d;
        data = node.data;
      }
    }
  }
  return data;
}
var init_find = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/find.js"() {
    init_quad2();
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/remove.js
function remove_default3(d) {
  if (isNaN(x3 = +this._x.call(null, d)) || isNaN(y3 = +this._y.call(null, d)))
    return this;
  var parent, node = this._root, retainer, previous, next, x02 = this._x0, y0 = this._y0, x12 = this._x1, y1 = this._y1, x3, y3, xm, ym, right, bottom, i, j;
  if (!node)
    return this;
  if (node.length)
    while (true) {
      if (right = x3 >= (xm = (x02 + x12) / 2))
        x02 = xm;
      else
        x12 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2))
        y0 = ym;
      else
        y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right]))
        return this;
      if (!node.length)
        break;
      if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3])
        retainer = parent, j = i;
    }
  while (node.data !== d)
    if (!(previous = node, node = node.next))
      return this;
  if (next = node.next)
    delete node.next;
  if (previous)
    return next ? previous.next = next : delete previous.next, this;
  if (!parent)
    return this._root = next, this;
  next ? parent[i] = next : delete parent[i];
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer)
      retainer[j] = node;
    else
      this._root = node;
  }
  return this;
}
function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i)
    this.remove(data[i]);
  return this;
}
var init_remove3 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/remove.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/root.js
function root_default() {
  return this._root;
}
var init_root = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/root.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/size.js
function size_default2() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length)
      do
        ++size;
      while (node = node.next);
  });
  return size;
}
var init_size2 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/size.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/visit.js
function visit_default(callback) {
  var quads = [], q, node = this._root, child, x02, y0, x12, y1;
  if (node)
    quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x02 = q.x0, y0 = q.y0, x12 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x02 + x12) / 2, ym = (y0 + y1) / 2;
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x12, y1));
      if (child = node[2])
        quads.push(new quad_default(child, x02, ym, xm, y1));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x12, ym));
      if (child = node[0])
        quads.push(new quad_default(child, x02, y0, xm, ym));
    }
  }
  return this;
}
var init_visit = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/visit.js"() {
    init_quad2();
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/visitAfter.js
function visitAfter_default(callback) {
  var quads = [], next = [], q;
  if (this._root)
    quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x02 = q.x0, y0 = q.y0, x12 = q.x1, y1 = q.y1, xm = (x02 + x12) / 2, ym = (y0 + y1) / 2;
      if (child = node[0])
        quads.push(new quad_default(child, x02, y0, xm, ym));
      if (child = node[1])
        quads.push(new quad_default(child, xm, y0, x12, ym));
      if (child = node[2])
        quads.push(new quad_default(child, x02, ym, xm, y1));
      if (child = node[3])
        quads.push(new quad_default(child, xm, ym, x12, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}
var init_visitAfter = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/visitAfter.js"() {
    init_quad2();
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/x.js
function defaultX(d) {
  return d[0];
}
function x_default(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}
var init_x = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/x.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/y.js
function defaultY(d) {
  return d[1];
}
function y_default(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}
var init_y = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/y.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/quadtree.js
function quadtree(nodes, x3, y3) {
  var tree = new Quadtree(x3 == null ? defaultX : x3, y3 == null ? defaultY : y3, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}
function Quadtree(x3, y3, x02, y0, x12, y1) {
  this._x = x3;
  this._y = y3;
  this._x0 = x02;
  this._y0 = y0;
  this._x1 = x12;
  this._y1 = y1;
  this._root = void 0;
}
function leaf_copy(leaf) {
  var copy3 = { data: leaf.data }, next = copy3;
  while (leaf = leaf.next)
    next = next.next = { data: leaf.data };
  return copy3;
}
var treeProto;
var init_quadtree = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/quadtree.js"() {
    init_add();
    init_cover();
    init_data2();
    init_extent2();
    init_find();
    init_remove3();
    init_root();
    init_size2();
    init_visit();
    init_visitAfter();
    init_x();
    init_y();
    treeProto = quadtree.prototype = Quadtree.prototype;
    treeProto.copy = function() {
      var copy3 = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
      if (!node)
        return copy3;
      if (!node.length)
        return copy3._root = leaf_copy(node), copy3;
      nodes = [{ source: node, target: copy3._root = new Array(4) }];
      while (node = nodes.pop()) {
        for (var i = 0; i < 4; ++i) {
          if (child = node.source[i]) {
            if (child.length)
              nodes.push({ source: child, target: node.target[i] = new Array(4) });
            else
              node.target[i] = leaf_copy(child);
          }
        }
      }
      return copy3;
    };
    treeProto.add = add_default;
    treeProto.addAll = addAll;
    treeProto.cover = cover_default;
    treeProto.data = data_default2;
    treeProto.extent = extent_default;
    treeProto.find = find_default;
    treeProto.remove = remove_default3;
    treeProto.removeAll = removeAll;
    treeProto.root = root_default;
    treeProto.size = size_default2;
    treeProto.visit = visit_default;
    treeProto.visitAfter = visitAfter_default;
    treeProto.x = x_default;
    treeProto.y = y_default;
  }
});

// node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/index.js
var init_src19 = __esm({
  "node_modules/.aspect_rules_js/d3-quadtree@3.0.1/node_modules/d3-quadtree/src/index.js"() {
    init_quadtree();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/constant.js
var init_constant8 = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/jiggle.js
var init_jiggle = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/jiggle.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/collide.js
var init_collide = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/collide.js"() {
    init_src19();
    init_constant8();
    init_jiggle();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/link.js
var init_link = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/link.js"() {
    init_constant8();
    init_jiggle();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/lcg.js
var init_lcg = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/lcg.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/simulation.js
var initialAngle;
var init_simulation = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/simulation.js"() {
    init_src4();
    init_src9();
    init_lcg();
    initialAngle = Math.PI * (3 - Math.sqrt(5));
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/manyBody.js
var init_manyBody = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/manyBody.js"() {
    init_src19();
    init_constant8();
    init_jiggle();
    init_simulation();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/radial.js
var init_radial = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/radial.js"() {
    init_constant8();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/x.js
var init_x2 = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/x.js"() {
    init_constant8();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/y.js
var init_y2 = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/y.js"() {
    init_constant8();
  }
});

// node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/index.js
var init_src20 = __esm({
  "node_modules/.aspect_rules_js/d3-force@3.0.0/node_modules/d3-force/src/index.js"() {
    init_center();
    init_collide();
    init_link();
    init_manyBody();
    init_radial();
    init_simulation();
    init_x2();
    init_y2();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatDecimal.js
function formatDecimal_default(x3) {
  return Math.abs(x3 = Math.round(x3)) >= 1e21 ? x3.toLocaleString("en").replace(/,/g, "") : x3.toString(10);
}
function formatDecimalParts(x3, p) {
  if (!isFinite(x3) || x3 === 0)
    return null;
  var i = (x3 = p ? x3.toExponential(p - 1) : x3.toExponential()).indexOf("e"), coefficient = x3.slice(0, i);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x3.slice(i + 1)
  ];
}
var init_formatDecimal = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatDecimal.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/exponent.js
function exponent_default(x3) {
  return x3 = formatDecimalParts(Math.abs(x3)), x3 ? x3[1] : NaN;
}
var init_exponent = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/exponent.js"() {
    init_formatDecimal();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatGroup.js
function formatGroup_default(grouping, thousands) {
  return function(value, width) {
    var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
    while (i > 0 && g > 0) {
      if (length + g + 1 > width)
        g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width)
        break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}
var init_formatGroup = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatGroup.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatNumerals.js
function formatNumerals_default(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}
var init_formatNumerals = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatNumerals.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatSpecifier.js
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier)))
    throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
var re;
var init_formatSpecifier = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatSpecifier.js"() {
    re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
    formatSpecifier.prototype = FormatSpecifier.prototype;
    FormatSpecifier.prototype.toString = function() {
      return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
    };
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatTrim.js
function formatTrim_default(s2) {
  out:
    for (var n = s2.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s2[i]) {
        case ".":
          i0 = i1 = i;
          break;
        case "0":
          if (i0 === 0)
            i0 = i;
          i1 = i;
          break;
        default:
          if (!+s2[i])
            break out;
          if (i0 > 0)
            i0 = 0;
          break;
      }
    }
  return i0 > 0 ? s2.slice(0, i0) + s2.slice(i1 + 1) : s2;
}
var init_formatTrim = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatTrim.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatPrefixAuto.js
function formatPrefixAuto_default(x3, p) {
  var d = formatDecimalParts(x3, p);
  if (!d)
    return prefixExponent = void 0, x3.toPrecision(p);
  var coefficient = d[0], exponent2 = d[1], i = exponent2 - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent2 / 3))) * 3) + 1, n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x3, Math.max(0, p + i - 1))[0];
}
var prefixExponent;
var init_formatPrefixAuto = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatPrefixAuto.js"() {
    init_formatDecimal();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatRounded.js
function formatRounded_default(x3, p) {
  var d = formatDecimalParts(x3, p);
  if (!d)
    return x3 + "";
  var coefficient = d[0], exponent2 = d[1];
  return exponent2 < 0 ? "0." + new Array(-exponent2).join("0") + coefficient : coefficient.length > exponent2 + 1 ? coefficient.slice(0, exponent2 + 1) + "." + coefficient.slice(exponent2 + 1) : coefficient + new Array(exponent2 - coefficient.length + 2).join("0");
}
var init_formatRounded = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatRounded.js"() {
    init_formatDecimal();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatTypes.js
var formatTypes_default;
var init_formatTypes = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/formatTypes.js"() {
    init_formatDecimal();
    init_formatPrefixAuto();
    init_formatRounded();
    formatTypes_default = {
      "%": (x3, p) => (x3 * 100).toFixed(p),
      "b": (x3) => Math.round(x3).toString(2),
      "c": (x3) => x3 + "",
      "d": formatDecimal_default,
      "e": (x3, p) => x3.toExponential(p),
      "f": (x3, p) => x3.toFixed(p),
      "g": (x3, p) => x3.toPrecision(p),
      "o": (x3) => Math.round(x3).toString(8),
      "p": (x3, p) => formatRounded_default(x3 * 100, p),
      "r": formatRounded_default,
      "s": formatPrefixAuto_default,
      "X": (x3) => Math.round(x3).toString(16).toUpperCase(),
      "x": (x3) => Math.round(x3).toString(16)
    };
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/identity.js
function identity_default2(x3) {
  return x3;
}
var init_identity3 = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/identity.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/locale.js
function locale_default(locale3) {
  var group2 = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity_default2 : formatGroup_default(map3.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity_default2 : formatNumerals_default(map3.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "\u2212" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
  function newFormat(specifier, options) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign3 = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type2 = specifier.type;
    if (type2 === "n")
      comma = true, type2 = "g";
    else if (!formatTypes_default[type2])
      precision === void 0 && (precision = 12), trim = true, type2 = "g";
    if (zero3 || fill === "0" && align === "=")
      zero3 = true, fill = "0", align = "=";
    var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type2) ? "0" + type2.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type2) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
    var formatType = formatTypes_default[type2], maybeSuffix = /[defgprs%]/.test(type2);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type2) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format2(value) {
      var valuePrefix = prefix, valueSuffix = suffix, i, n, c3;
      if (type2 === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;
        var valueNegative = value < 0 || 1 / value < 0;
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
        if (trim)
          value = formatTrim_default(value);
        if (valueNegative && +value === 0 && sign3 !== "+")
          valueNegative = false;
        valuePrefix = (valueNegative ? sign3 === "(" ? sign3 : minus : sign3 === "-" || sign3 === "(" ? "" : sign3) + valuePrefix;
        valueSuffix = (type2 === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign3 === "(" ? ")" : "");
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c3 = value.charCodeAt(i), 48 > c3 || c3 > 57) {
              valueSuffix = (c3 === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }
      if (comma && !zero3)
        value = group2(value, Infinity);
      var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
      if (comma && zero3)
        value = group2(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format2.toString = function() {
      return specifier + "";
    };
    return format2;
  }
  function formatPrefix2(specifier, value) {
    var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k2 = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
    return function(value2) {
      return f(k2 * value2);
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}
var map3, prefixes;
var init_locale = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/locale.js"() {
    init_exponent();
    init_formatGroup();
    init_formatNumerals();
    init_formatSpecifier();
    init_formatTrim();
    init_formatTypes();
    init_formatPrefixAuto();
    init_identity3();
    map3 = Array.prototype.map;
    prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/defaultLocale.js
function defaultLocale(definition) {
  locale = locale_default(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}
var locale, format, formatPrefix;
var init_defaultLocale = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/defaultLocale.js"() {
    init_locale();
    defaultLocale({
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionFixed.js
var init_precisionFixed = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionFixed.js"() {
    init_exponent();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionPrefix.js
var init_precisionPrefix = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionPrefix.js"() {
    init_exponent();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionRound.js
var init_precisionRound = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/precisionRound.js"() {
    init_exponent();
  }
});

// node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/index.js
var init_src21 = __esm({
  "node_modules/.aspect_rules_js/d3-format@3.1.2/node_modules/d3-format/src/index.js"() {
    init_defaultLocale();
    init_locale();
    init_formatSpecifier();
    init_precisionFixed();
    init_precisionPrefix();
    init_precisionRound();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/math.js
function acos(x3) {
  return x3 > 1 ? 0 : x3 < -1 ? pi4 : Math.acos(x3);
}
function asin(x3) {
  return x3 > 1 ? halfPi3 : x3 < -1 ? -halfPi3 : Math.asin(x3);
}
var epsilon5, epsilon22, pi4, halfPi3, quarterPi, tau5, degrees3, radians2, abs3, atan, atan2, cos2, exp, log, sin2, sign, sqrt, tan;
var init_math4 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/math.js"() {
    epsilon5 = 1e-6;
    epsilon22 = 1e-12;
    pi4 = Math.PI;
    halfPi3 = pi4 / 2;
    quarterPi = pi4 / 4;
    tau5 = pi4 * 2;
    degrees3 = 180 / pi4;
    radians2 = pi4 / 180;
    abs3 = Math.abs;
    atan = Math.atan;
    atan2 = Math.atan2;
    cos2 = Math.cos;
    exp = Math.exp;
    log = Math.log;
    sin2 = Math.sin;
    sign = Math.sign || function(x3) {
      return x3 > 0 ? 1 : x3 < 0 ? -1 : 0;
    };
    sqrt = Math.sqrt;
    tan = Math.tan;
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/noop.js
function noop2() {
}
var init_noop2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/noop.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/stream.js
var init_stream = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/stream.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/area.js
var areaRingSum, areaSum;
var init_area2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/area.js"() {
    init_src2();
    init_math4();
    init_noop2();
    init_stream();
    areaRingSum = new Adder();
    areaSum = new Adder();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/cartesian.js
function cartesian(spherical2) {
  var lambda = spherical2[0], phi2 = spherical2[1], cosPhi = cos2(phi2);
  return [cosPhi * cos2(lambda), cosPhi * sin2(lambda), sin2(phi2)];
}
function cartesianCross(a2, b) {
  return [a2[1] * b[2] - a2[2] * b[1], a2[2] * b[0] - a2[0] * b[2], a2[0] * b[1] - a2[1] * b[0]];
}
function cartesianNormalizeInPlace(d) {
  var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}
var init_cartesian = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/cartesian.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/bounds.js
var init_bounds = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/bounds.js"() {
    init_src2();
    init_area2();
    init_cartesian();
    init_math4();
    init_stream();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/centroid.js
var init_centroid = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/centroid.js"() {
    init_src2();
    init_math4();
    init_noop2();
    init_stream();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/constant.js
var init_constant9 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/compose.js
var init_compose = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/compose.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/rotation.js
function rotationIdentity(lambda, phi2) {
  if (abs3(lambda) > pi4)
    lambda -= Math.round(lambda / tau5) * tau5;
  return [lambda, phi2];
}
var init_rotation = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/rotation.js"() {
    init_compose();
    init_math4();
    rotationIdentity.invert = rotationIdentity;
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/circle.js
var init_circle2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/circle.js"() {
    init_cartesian();
    init_constant9();
    init_math4();
    init_rotation();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/buffer.js
function buffer_default2() {
  var lines = [], line;
  return {
    point: function(x3, y3, m) {
      line.push([x3, y3, m]);
    },
    lineStart: function() {
      lines.push(line = []);
    },
    lineEnd: noop2,
    rejoin: function() {
      if (lines.length > 1)
        lines.push(lines.pop().concat(lines.shift()));
    },
    result: function() {
      var result = lines;
      lines = [];
      line = null;
      return result;
    }
  };
}
var init_buffer2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/buffer.js"() {
    init_noop2();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/pointEqual.js
function pointEqual_default(a2, b) {
  return abs3(a2[0] - b[0]) < epsilon5 && abs3(a2[1] - b[1]) < epsilon5;
}
var init_pointEqual = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/pointEqual.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rejoin.js
function Intersection(point6, points, other, entry) {
  this.x = point6;
  this.z = points;
  this.o = other;
  this.e = entry;
  this.v = false;
  this.n = this.p = null;
}
function rejoin_default(segments, compareIntersection2, startInside, interpolate, stream) {
  var subject = [], clip = [], i, n;
  segments.forEach(function(segment) {
    if ((n2 = segment.length - 1) <= 0)
      return;
    var n2, p0 = segment[0], p1 = segment[n2], x3;
    if (pointEqual_default(p0, p1)) {
      if (!p0[2] && !p1[2]) {
        stream.lineStart();
        for (i = 0; i < n2; ++i)
          stream.point((p0 = segment[i])[0], p0[1]);
        stream.lineEnd();
        return;
      }
      p1[0] += 2 * epsilon5;
    }
    subject.push(x3 = new Intersection(p0, segment, null, true));
    clip.push(x3.o = new Intersection(p0, null, x3, false));
    subject.push(x3 = new Intersection(p1, segment, null, false));
    clip.push(x3.o = new Intersection(p1, null, x3, true));
  });
  if (!subject.length)
    return;
  clip.sort(compareIntersection2);
  link(subject);
  link(clip);
  for (i = 0, n = clip.length; i < n; ++i) {
    clip[i].e = startInside = !startInside;
  }
  var start2 = subject[0], points, point6;
  while (1) {
    var current = start2, isSubject = true;
    while (current.v)
      if ((current = current.n) === start2)
        return;
    points = current.z;
    stream.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (i = 0, n = points.length; i < n; ++i)
            stream.point((point6 = points[i])[0], point6[1]);
        } else {
          interpolate(current.x, current.n.x, 1, stream);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (i = points.length - 1; i >= 0; --i)
            stream.point((point6 = points[i])[0], point6[1]);
        } else {
          interpolate(current.x, current.p.x, -1, stream);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    stream.lineEnd();
  }
}
function link(array4) {
  if (!(n = array4.length))
    return;
  var n, i = 0, a2 = array4[0], b;
  while (++i < n) {
    a2.n = b = array4[i];
    b.p = a2;
    a2 = b;
  }
  a2.n = b = array4[0];
  b.p = a2;
}
var init_rejoin = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rejoin.js"() {
    init_pointEqual();
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/polygonContains.js
function longitude(point6) {
  return abs3(point6[0]) <= pi4 ? point6[0] : sign(point6[0]) * ((abs3(point6[0]) + pi4) % tau5 - pi4);
}
function polygonContains_default(polygon, point6) {
  var lambda = longitude(point6), phi2 = point6[1], sinPhi = sin2(phi2), normal = [sin2(lambda), -cos2(lambda), 0], angle = 0, winding = 0;
  var sum4 = new Adder();
  if (sinPhi === 1)
    phi2 = halfPi3 + epsilon5;
  else if (sinPhi === -1)
    phi2 = -halfPi3 - epsilon5;
  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length))
      continue;
    var ring, m, point0 = ring[m - 1], lambda0 = longitude(point0), phi0 = point0[1] / 2 + quarterPi, sinPhi0 = sin2(phi0), cosPhi0 = cos2(phi0);
    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j], lambda1 = longitude(point1), phi1 = point1[1] / 2 + quarterPi, sinPhi1 = sin2(phi1), cosPhi1 = cos2(phi1), delta = lambda1 - lambda0, sign3 = delta >= 0 ? 1 : -1, absDelta = sign3 * delta, antimeridian = absDelta > pi4, k2 = sinPhi0 * sinPhi1;
      sum4.add(atan2(k2 * sign3 * sin2(absDelta), cosPhi0 * cosPhi1 + k2 * cos2(absDelta)));
      angle += antimeridian ? delta + sign3 * tau5 : delta;
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection2 = cartesianCross(normal, arc);
        cartesianNormalizeInPlace(intersection2);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection2[2]);
        if (phi2 > phiArc || phi2 === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }
  return (angle < -epsilon5 || angle < epsilon5 && sum4 < -epsilon22) ^ winding & 1;
}
var init_polygonContains = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/polygonContains.js"() {
    init_src2();
    init_cartesian();
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/index.js
function clip_default(pointVisible, clipLine, interpolate, start2) {
  return function(sink) {
    var line = clipLine(sink), ringBuffer = buffer_default2(), ringSink = clipLine(ringBuffer), polygonStarted = false, polygon, segments, ring;
    var clip = {
      point: point6,
      lineStart,
      lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip.point = point6;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;
        segments = merge(segments);
        var startInside = polygonContains_default(polygon, start2);
        if (segments.length) {
          if (!polygonStarted)
            sink.polygonStart(), polygonStarted = true;
          rejoin_default(segments, compareIntersection, startInside, interpolate, sink);
        } else if (startInside) {
          if (!polygonStarted)
            sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
        }
        if (polygonStarted)
          sink.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        sink.polygonStart();
        sink.lineStart();
        interpolate(null, null, 1, sink);
        sink.lineEnd();
        sink.polygonEnd();
      }
    };
    function point6(lambda, phi2) {
      if (pointVisible(lambda, phi2))
        sink.point(lambda, phi2);
    }
    function pointLine(lambda, phi2) {
      line.point(lambda, phi2);
    }
    function lineStart() {
      clip.point = pointLine;
      line.lineStart();
    }
    function lineEnd() {
      clip.point = point6;
      line.lineEnd();
    }
    function pointRing(lambda, phi2) {
      ring.push([lambda, phi2]);
      ringSink.point(lambda, phi2);
    }
    function ringStart() {
      ringSink.lineStart();
      ring = [];
    }
    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringSink.lineEnd();
      var clean = ringSink.clean(), ringSegments = ringBuffer.result(), i, n = ringSegments.length, m, segment, point7;
      ring.pop();
      polygon.push(ring);
      ring = null;
      if (!n)
        return;
      if (clean & 1) {
        segment = ringSegments[0];
        if ((m = segment.length - 1) > 0) {
          if (!polygonStarted)
            sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          for (i = 0; i < m; ++i)
            sink.point((point7 = segment[i])[0], point7[1]);
          sink.lineEnd();
        }
        return;
      }
      if (n > 1 && clean & 2)
        ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
      segments.push(ringSegments.filter(validSegment));
    }
    return clip;
  };
}
function validSegment(segment) {
  return segment.length > 1;
}
function compareIntersection(a2, b) {
  return ((a2 = a2.x)[0] < 0 ? a2[1] - halfPi3 - epsilon5 : halfPi3 - a2[1]) - ((b = b.x)[0] < 0 ? b[1] - halfPi3 - epsilon5 : halfPi3 - b[1]);
}
var init_clip = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/index.js"() {
    init_buffer2();
    init_rejoin();
    init_math4();
    init_polygonContains();
    init_src2();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/antimeridian.js
function clipAntimeridianLine(stream) {
  var lambda0 = NaN, phi0 = NaN, sign0 = NaN, clean;
  return {
    lineStart: function() {
      stream.lineStart();
      clean = 1;
    },
    point: function(lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi4 : -pi4, delta = abs3(lambda1 - lambda0);
      if (abs3(delta - pi4) < epsilon5) {
        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi3 : -halfPi3);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        stream.point(lambda1, phi0);
        clean = 0;
      } else if (sign0 !== sign1 && delta >= pi4) {
        if (abs3(lambda0 - sign0) < epsilon5)
          lambda0 -= sign0 * epsilon5;
        if (abs3(lambda1 - sign1) < epsilon5)
          lambda1 -= sign1 * epsilon5;
        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        clean = 0;
      }
      stream.point(lambda0 = lambda1, phi0 = phi1);
      sign0 = sign1;
    },
    lineEnd: function() {
      stream.lineEnd();
      lambda0 = phi0 = NaN;
    },
    clean: function() {
      return 2 - clean;
    }
  };
}
function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
  var cosPhi0, cosPhi1, sinLambda0Lambda1 = sin2(lambda0 - lambda1);
  return abs3(sinLambda0Lambda1) > epsilon5 ? atan((sin2(phi0) * (cosPhi1 = cos2(phi1)) * sin2(lambda1) - sin2(phi1) * (cosPhi0 = cos2(phi0)) * sin2(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
}
function clipAntimeridianInterpolate(from, to, direction, stream) {
  var phi2;
  if (from == null) {
    phi2 = direction * halfPi3;
    stream.point(-pi4, phi2);
    stream.point(0, phi2);
    stream.point(pi4, phi2);
    stream.point(pi4, 0);
    stream.point(pi4, -phi2);
    stream.point(0, -phi2);
    stream.point(-pi4, -phi2);
    stream.point(-pi4, 0);
    stream.point(-pi4, phi2);
  } else if (abs3(from[0] - to[0]) > epsilon5) {
    var lambda = from[0] < to[0] ? pi4 : -pi4;
    phi2 = direction * lambda / 2;
    stream.point(-lambda, phi2);
    stream.point(0, phi2);
    stream.point(lambda, phi2);
  } else {
    stream.point(to[0], to[1]);
  }
}
var antimeridian_default;
var init_antimeridian = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/antimeridian.js"() {
    init_clip();
    init_math4();
    antimeridian_default = clip_default(
      function() {
        return true;
      },
      clipAntimeridianLine,
      clipAntimeridianInterpolate,
      [-pi4, -halfPi3]
    );
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/circle.js
var init_circle3 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/circle.js"() {
    init_cartesian();
    init_circle2();
    init_math4();
    init_pointEqual();
    init_clip();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/line.js
var init_line = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/line.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rectangle.js
var clipMax, clipMin;
var init_rectangle = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/rectangle.js"() {
    init_math4();
    init_buffer2();
    init_line();
    init_rejoin();
    init_src2();
    clipMax = 1e9;
    clipMin = -clipMax;
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/extent.js
var init_extent3 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/clip/extent.js"() {
    init_rectangle();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/length.js
var init_length = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/length.js"() {
    init_src2();
    init_math4();
    init_noop2();
    init_stream();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/distance.js
var init_distance = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/distance.js"() {
    init_length();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/contains.js
var init_contains2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/contains.js"() {
    init_polygonContains();
    init_distance();
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/graticule.js
var init_graticule = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/graticule.js"() {
    init_src2();
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/interpolate.js
var init_interpolate2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/interpolate.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/identity.js
var init_identity4 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/identity.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/area.js
var areaSum2, areaRingSum2;
var init_area3 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/area.js"() {
    init_src2();
    init_math4();
    init_noop2();
    areaSum2 = new Adder();
    areaRingSum2 = new Adder();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/bounds.js
var x0, x1;
var init_bounds2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/bounds.js"() {
    init_noop2();
    x0 = Infinity;
    x1 = -x0;
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/centroid.js
var init_centroid2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/centroid.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/context.js
function PathContext(context) {
  this._context = context;
}
var init_context = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/context.js"() {
    init_math4();
    init_noop2();
    PathContext.prototype = {
      _radius: 4.5,
      pointRadius: function(_) {
        return this._radius = _, this;
      },
      polygonStart: function() {
        this._line = 0;
      },
      polygonEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line === 0)
          this._context.closePath();
        this._point = NaN;
      },
      point: function(x3, y3) {
        switch (this._point) {
          case 0: {
            this._context.moveTo(x3, y3);
            this._point = 1;
            break;
          }
          case 1: {
            this._context.lineTo(x3, y3);
            break;
          }
          default: {
            this._context.moveTo(x3 + this._radius, y3);
            this._context.arc(x3, y3, this._radius, 0, tau5);
            break;
          }
        }
      },
      result: noop2
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/measure.js
var lengthSum;
var init_measure = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/measure.js"() {
    init_src2();
    init_math4();
    init_noop2();
    lengthSum = new Adder();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/string.js
var init_string2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/string.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/index.js
var init_path3 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/path/index.js"() {
    init_identity4();
    init_stream();
    init_area3();
    init_bounds2();
    init_centroid2();
    init_context();
    init_measure();
    init_string2();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/transform.js
function transformer(methods) {
  return function(stream) {
    var s2 = new TransformStream();
    for (var key in methods)
      s2[key] = methods[key];
    s2.stream = stream;
    return s2;
  };
}
function TransformStream() {
}
var init_transform2 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/transform.js"() {
    TransformStream.prototype = {
      constructor: TransformStream,
      point: function(x3, y3) {
        this.stream.point(x3, y3);
      },
      sphere: function() {
        this.stream.sphere();
      },
      lineStart: function() {
        this.stream.lineStart();
      },
      lineEnd: function() {
        this.stream.lineEnd();
      },
      polygonStart: function() {
        this.stream.polygonStart();
      },
      polygonEnd: function() {
        this.stream.polygonEnd();
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/fit.js
var init_fit = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/fit.js"() {
    init_stream();
    init_bounds2();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/resample.js
var cosMinDistance;
var init_resample = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/resample.js"() {
    init_cartesian();
    init_math4();
    init_transform2();
    cosMinDistance = cos2(30 * radians2);
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/index.js
var transformRadians;
var init_projection = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/index.js"() {
    init_antimeridian();
    init_circle3();
    init_rectangle();
    init_compose();
    init_identity4();
    init_math4();
    init_rotation();
    init_transform2();
    init_fit();
    init_resample();
    transformRadians = transformer({
      point: function(x3, y3) {
        this.stream.point(x3 * radians2, y3 * radians2);
      }
    });
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conic.js
var init_conic = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conic.js"() {
    init_math4();
    init_projection();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/cylindricalEqualArea.js
var init_cylindricalEqualArea = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/cylindricalEqualArea.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicEqualArea.js
var init_conicEqualArea = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicEqualArea.js"() {
    init_math4();
    init_conic();
    init_cylindricalEqualArea();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/albers.js
var init_albers = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/albers.js"() {
    init_conicEqualArea();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/albersUsa.js
var init_albersUsa = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/albersUsa.js"() {
    init_math4();
    init_albers();
    init_conicEqualArea();
    init_fit();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthal.js
function azimuthalRaw(scale2) {
  return function(x3, y3) {
    var cx = cos2(x3), cy = cos2(y3), k2 = scale2(cx * cy);
    if (k2 === Infinity)
      return [2, 0];
    return [
      k2 * cy * sin2(x3),
      k2 * sin2(y3)
    ];
  };
}
function azimuthalInvert(angle) {
  return function(x3, y3) {
    var z = sqrt(x3 * x3 + y3 * y3), c3 = angle(z), sc = sin2(c3), cc2 = cos2(c3);
    return [
      atan2(x3 * sc, z * cc2),
      asin(z && y3 * sc / z)
    ];
  };
}
var init_azimuthal = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthal.js"() {
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthalEqualArea.js
var azimuthalEqualAreaRaw;
var init_azimuthalEqualArea = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthalEqualArea.js"() {
    init_math4();
    init_azimuthal();
    init_projection();
    azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
      return sqrt(2 / (1 + cxcy));
    });
    azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
      return 2 * asin(z / 2);
    });
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthalEquidistant.js
var azimuthalEquidistantRaw;
var init_azimuthalEquidistant = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/azimuthalEquidistant.js"() {
    init_math4();
    init_azimuthal();
    init_projection();
    azimuthalEquidistantRaw = azimuthalRaw(function(c3) {
      return (c3 = acos(c3)) && c3 / sin2(c3);
    });
    azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
      return z;
    });
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/mercator.js
function mercatorRaw(lambda, phi2) {
  return [lambda, log(tan((halfPi3 + phi2) / 2))];
}
var init_mercator = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/mercator.js"() {
    init_math4();
    init_rotation();
    init_projection();
    mercatorRaw.invert = function(x3, y3) {
      return [x3, 2 * atan(exp(y3)) - halfPi3];
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicConformal.js
var init_conicConformal = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicConformal.js"() {
    init_math4();
    init_conic();
    init_mercator();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/equirectangular.js
function equirectangularRaw(lambda, phi2) {
  return [lambda, phi2];
}
var init_equirectangular = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/equirectangular.js"() {
    init_projection();
    equirectangularRaw.invert = equirectangularRaw;
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicEquidistant.js
var init_conicEquidistant = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/conicEquidistant.js"() {
    init_math4();
    init_conic();
    init_equirectangular();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/equalEarth.js
function equalEarthRaw(lambda, phi2) {
  var l = asin(M * sin2(phi2)), l2 = l * l, l6 = l2 * l2 * l2;
  return [
    lambda * cos2(l) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))),
    l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2))
  ];
}
var A1, A2, A3, A4, M, iterations;
var init_equalEarth = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/equalEarth.js"() {
    init_projection();
    init_math4();
    A1 = 1.340264;
    A2 = -0.081106;
    A3 = 893e-6;
    A4 = 3796e-6;
    M = sqrt(3) / 2;
    iterations = 12;
    equalEarthRaw.invert = function(x3, y3) {
      var l = y3, l2 = l * l, l6 = l2 * l2 * l2;
      for (var i = 0, delta, fy, fpy; i < iterations; ++i) {
        fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y3;
        fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2);
        l -= delta = fy / fpy, l2 = l * l, l6 = l2 * l2 * l2;
        if (abs3(delta) < epsilon22)
          break;
      }
      return [
        M * x3 * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)) / cos2(l),
        asin(sin2(l) / M)
      ];
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/gnomonic.js
function gnomonicRaw(x3, y3) {
  var cy = cos2(y3), k2 = cos2(x3) * cy;
  return [cy * sin2(x3) / k2, sin2(y3) / k2];
}
var init_gnomonic = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/gnomonic.js"() {
    init_math4();
    init_azimuthal();
    init_projection();
    gnomonicRaw.invert = azimuthalInvert(atan);
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/identity.js
var init_identity5 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/identity.js"() {
    init_rectangle();
    init_identity4();
    init_transform2();
    init_fit();
    init_math4();
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/naturalEarth1.js
function naturalEarth1Raw(lambda, phi2) {
  var phi22 = phi2 * phi2, phi4 = phi22 * phi22;
  return [
    lambda * (0.8707 - 0.131979 * phi22 + phi4 * (-0.013791 + phi4 * (3971e-6 * phi22 - 1529e-6 * phi4))),
    phi2 * (1.007226 + phi22 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi22 - 5916e-6 * phi4)))
  ];
}
var init_naturalEarth1 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/naturalEarth1.js"() {
    init_projection();
    init_math4();
    naturalEarth1Raw.invert = function(x3, y3) {
      var phi2 = y3, i = 25, delta;
      do {
        var phi22 = phi2 * phi2, phi4 = phi22 * phi22;
        phi2 -= delta = (phi2 * (1.007226 + phi22 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi22 - 5916e-6 * phi4))) - y3) / (1.007226 + phi22 * (0.015085 * 3 + phi4 * (-0.044475 * 7 + 0.028874 * 9 * phi22 - 5916e-6 * 11 * phi4)));
      } while (abs3(delta) > epsilon5 && --i > 0);
      return [
        x3 / (0.8707 + (phi22 = phi2 * phi2) * (-0.131979 + phi22 * (-0.013791 + phi22 * phi22 * phi22 * (3971e-6 - 1529e-6 * phi22)))),
        phi2
      ];
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/orthographic.js
function orthographicRaw(x3, y3) {
  return [cos2(y3) * sin2(x3), sin2(y3)];
}
var init_orthographic = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/orthographic.js"() {
    init_math4();
    init_azimuthal();
    init_projection();
    orthographicRaw.invert = azimuthalInvert(asin);
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/stereographic.js
function stereographicRaw(x3, y3) {
  var cy = cos2(y3), k2 = 1 + cos2(x3) * cy;
  return [cy * sin2(x3) / k2, sin2(y3) / k2];
}
var init_stereographic = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/stereographic.js"() {
    init_math4();
    init_azimuthal();
    init_projection();
    stereographicRaw.invert = azimuthalInvert(function(z) {
      return 2 * atan(z);
    });
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/transverseMercator.js
function transverseMercatorRaw(lambda, phi2) {
  return [log(tan((halfPi3 + phi2) / 2)), -lambda];
}
var init_transverseMercator = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/projection/transverseMercator.js"() {
    init_math4();
    init_mercator();
    transverseMercatorRaw.invert = function(x3, y3) {
      return [-y3, 2 * atan(exp(x3)) - halfPi3];
    };
  }
});

// node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/index.js
var init_src22 = __esm({
  "node_modules/.aspect_rules_js/d3-geo@3.1.1/node_modules/d3-geo/src/index.js"() {
    init_area2();
    init_bounds();
    init_centroid();
    init_circle2();
    init_antimeridian();
    init_circle3();
    init_extent3();
    init_rectangle();
    init_contains2();
    init_distance();
    init_graticule();
    init_interpolate2();
    init_length();
    init_path3();
    init_albers();
    init_albersUsa();
    init_azimuthalEqualArea();
    init_azimuthalEquidistant();
    init_conicConformal();
    init_conicEqualArea();
    init_conicEquidistant();
    init_equalEarth();
    init_equirectangular();
    init_gnomonic();
    init_identity5();
    init_projection();
    init_mercator();
    init_naturalEarth1();
    init_orthographic();
    init_stereographic();
    init_transverseMercator();
    init_rotation();
    init_stream();
    init_transform2();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/cluster.js
var init_cluster = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/cluster.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/count.js
function count2(node) {
  var sum4 = 0, children2 = node.children, i = children2 && children2.length;
  if (!i)
    sum4 = 1;
  else
    while (--i >= 0)
      sum4 += children2[i].value;
  node.value = sum4;
}
function count_default() {
  return this.eachAfter(count2);
}
var init_count2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/count.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/each.js
function each_default2(callback, that) {
  let index2 = -1;
  for (const node of this) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
var init_each2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/each.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
function eachBefore_default(callback, that) {
  var node = this, nodes = [node], children2, i, index2 = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index2, this);
    if (children2 = node.children) {
      for (i = children2.length - 1; i >= 0; --i) {
        nodes.push(children2[i]);
      }
    }
  }
  return this;
}
var init_eachBefore = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachBefore.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
function eachAfter_default(callback, that) {
  var node = this, nodes = [node], next = [], children2, i, n, index2 = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children2 = node.children) {
      for (i = 0, n = children2.length; i < n; ++i) {
        nodes.push(children2[i]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index2, this);
  }
  return this;
}
var init_eachAfter = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachAfter.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/find.js
function find_default2(callback, that) {
  let index2 = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index2, this)) {
      return node;
    }
  }
}
var init_find2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/find.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sum.js
function sum_default(value) {
  return this.eachAfter(function(node) {
    var sum4 = +value(node.data) || 0, children2 = node.children, i = children2 && children2.length;
    while (--i >= 0)
      sum4 += children2[i].value;
    node.value = sum4;
  });
}
var init_sum2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sum.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sort.js
function sort_default2(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}
var init_sort3 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sort.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/path.js
function path_default2(end) {
  var start2 = this, ancestor = leastCommonAncestor(start2, end), nodes = [start2];
  while (start2 !== ancestor) {
    start2 = start2.parent;
    nodes.push(start2);
  }
  var k2 = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k2, 0, end);
    end = end.parent;
  }
  return nodes;
}
function leastCommonAncestor(a2, b) {
  if (a2 === b)
    return a2;
  var aNodes = a2.ancestors(), bNodes = b.ancestors(), c3 = null;
  a2 = aNodes.pop();
  b = bNodes.pop();
  while (a2 === b) {
    c3 = a2;
    a2 = aNodes.pop();
    b = bNodes.pop();
  }
  return c3;
}
var init_path4 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/path.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/ancestors.js
function ancestors_default() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}
var init_ancestors = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/ancestors.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/descendants.js
function descendants_default() {
  return Array.from(this);
}
var init_descendants = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/descendants.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/leaves.js
function leaves_default() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}
var init_leaves = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/leaves.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/links.js
function links_default() {
  var root2 = this, links = [];
  root2.each(function(node) {
    if (node !== root2) {
      links.push({ source: node.parent, target: node });
    }
  });
  return links;
}
var init_links = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/links.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/iterator.js
function* iterator_default2() {
  var node = this, current, next = [node], children2, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      yield node;
      if (children2 = node.children) {
        for (i = 0, n = children2.length; i < n; ++i) {
          next.push(children2[i]);
        }
      }
    }
  } while (next.length);
}
var init_iterator2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/iterator.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/index.js
function hierarchy(data, children2) {
  if (data instanceof Map) {
    data = [void 0, data];
    if (children2 === void 0)
      children2 = mapChildren;
  } else if (children2 === void 0) {
    children2 = objectChildren;
  }
  var root2 = new Node(data), node, nodes = [root2], child, childs, i, n;
  while (node = nodes.pop()) {
    if ((childs = children2(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }
  return root2.eachBefore(computeHeight);
}
function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}
function objectChildren(d) {
  return d.children;
}
function mapChildren(d) {
  return Array.isArray(d) ? d[1] : null;
}
function copyData(node) {
  if (node.data.value !== void 0)
    node.value = node.data.value;
  node.data = node.data.data;
}
function computeHeight(node) {
  var height = 0;
  do
    node.height = height;
  while ((node = node.parent) && node.height < ++height);
}
function Node(data) {
  this.data = data;
  this.depth = this.height = 0;
  this.parent = null;
}
var init_hierarchy = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/index.js"() {
    init_count2();
    init_each2();
    init_eachBefore();
    init_eachAfter();
    init_find2();
    init_sum2();
    init_sort3();
    init_path4();
    init_ancestors();
    init_descendants();
    init_leaves();
    init_links();
    init_iterator2();
    Node.prototype = hierarchy.prototype = {
      constructor: Node,
      count: count_default,
      each: each_default2,
      eachAfter: eachAfter_default,
      eachBefore: eachBefore_default,
      find: find_default2,
      sum: sum_default,
      sort: sort_default2,
      path: path_default2,
      ancestors: ancestors_default,
      descendants: descendants_default,
      leaves: leaves_default,
      links: links_default,
      copy: node_copy,
      [Symbol.iterator]: iterator_default2
    };
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/accessors.js
var init_accessors = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/accessors.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/constant.js
var init_constant10 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/lcg.js
var init_lcg2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/lcg.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/array.js
var init_array6 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/array.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/enclose.js
var init_enclose = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/enclose.js"() {
    init_array6();
    init_lcg2();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/siblings.js
var init_siblings = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/siblings.js"() {
    init_array6();
    init_lcg2();
    init_enclose();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/index.js
var init_pack = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/index.js"() {
    init_accessors();
    init_constant10();
    init_lcg2();
    init_siblings();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/round.js
var init_round2 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/round.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/dice.js
function dice_default(parent, x02, y0, x12, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k2 = parent.value && (x12 - x02) / parent.value;
  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x02, node.x1 = x02 += node.value * k2;
  }
}
var init_dice = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/dice.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/partition.js
var init_partition = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/partition.js"() {
    init_round2();
    init_dice();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/stratify.js
var init_stratify = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/stratify.js"() {
    init_accessors();
    init_hierarchy();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/tree.js
function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null;
  this.a = this;
  this.z = 0;
  this.m = 0;
  this.c = 0;
  this.s = 0;
  this.t = null;
  this.i = i;
}
var init_tree = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/tree.js"() {
    init_hierarchy();
    TreeNode.prototype = Object.create(Node.prototype);
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/slice.js
function slice_default(parent, x02, y0, x12, y1) {
  var nodes = parent.children, node, i = -1, n = nodes.length, k2 = parent.value && (y1 - y0) / parent.value;
  while (++i < n) {
    node = nodes[i], node.x0 = x02, node.x1 = x12;
    node.y0 = y0, node.y1 = y0 += node.value * k2;
  }
}
var init_slice = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/slice.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/squarify.js
function squarifyRatio(ratio, parent, x02, y0, x12, y1) {
  var rows = [], nodes = parent.children, row, nodeValue, i0 = 0, i1 = 0, n = nodes.length, dx, dy, value = parent.value, sumValue, minValue, maxValue, newRatio, minRatio, alpha, beta;
  while (i0 < n) {
    dx = x12 - x02, dy = y1 - y0;
    do
      sumValue = nodes[i1++].value;
    while (!sumValue && i1 < n);
    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue)
        minValue = nodeValue;
      if (nodeValue > maxValue)
        maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }
    rows.push(row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) });
    if (row.dice)
      dice_default(row, x02, y0, x12, value ? y0 += dy * sumValue / value : y1);
    else
      slice_default(row, x02, y0, value ? x02 += dx * sumValue / value : x12, y1);
    value -= sumValue, i0 = i1;
  }
  return rows;
}
var phi, squarify_default;
var init_squarify = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/squarify.js"() {
    init_dice();
    init_slice();
    phi = (1 + Math.sqrt(5)) / 2;
    squarify_default = function custom10(ratio) {
      function squarify(parent, x02, y0, x12, y1) {
        squarifyRatio(ratio, parent, x02, y0, x12, y1);
      }
      squarify.ratio = function(x3) {
        return custom10((x3 = +x3) > 1 ? x3 : 1);
      };
      return squarify;
    }(phi);
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/index.js
var init_treemap = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/index.js"() {
    init_round2();
    init_squarify();
    init_accessors();
    init_constant10();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/binary.js
var init_binary = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/binary.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/sliceDice.js
var init_sliceDice = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/sliceDice.js"() {
    init_dice();
    init_slice();
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/resquarify.js
var resquarify_default;
var init_resquarify = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/treemap/resquarify.js"() {
    init_dice();
    init_slice();
    init_squarify();
    resquarify_default = function custom11(ratio) {
      function resquarify(parent, x02, y0, x12, y1) {
        if ((rows = parent._squarify) && rows.ratio === ratio) {
          var rows, row, nodes, i, j = -1, n, m = rows.length, value = parent.value;
          while (++j < m) {
            row = rows[j], nodes = row.children;
            for (i = row.value = 0, n = nodes.length; i < n; ++i)
              row.value += nodes[i].value;
            if (row.dice)
              dice_default(row, x02, y0, x12, value ? y0 += (y1 - y0) * row.value / value : y1);
            else
              slice_default(row, x02, y0, value ? x02 += (x12 - x02) * row.value / value : x12, y1);
            value -= row.value;
          }
        } else {
          parent._squarify = rows = squarifyRatio(ratio, parent, x02, y0, x12, y1);
          rows.ratio = ratio;
        }
      }
      resquarify.ratio = function(x3) {
        return custom11((x3 = +x3) > 1 ? x3 : 1);
      };
      return resquarify;
    }(phi);
  }
});

// node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/index.js
var init_src23 = __esm({
  "node_modules/.aspect_rules_js/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/index.js"() {
    init_cluster();
    init_hierarchy();
    init_pack();
    init_siblings();
    init_enclose();
    init_partition();
    init_stratify();
    init_tree();
    init_treemap();
    init_binary();
    init_dice();
    init_slice();
    init_sliceDice();
    init_squarify();
    init_resquarify();
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/area.js
var init_area4 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/area.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/centroid.js
var init_centroid3 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/centroid.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/cross.js
var init_cross2 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/cross.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/hull.js
var init_hull = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/hull.js"() {
    init_cross2();
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/contains.js
var init_contains3 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/contains.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/length.js
var init_length2 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/length.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/index.js
var init_src24 = __esm({
  "node_modules/.aspect_rules_js/d3-polygon@3.0.1/node_modules/d3-polygon/src/index.js"() {
    init_area4();
    init_centroid3();
    init_hull();
    init_contains3();
    init_length2();
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/defaultSource.js
var defaultSource_default;
var init_defaultSource = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/defaultSource.js"() {
    defaultSource_default = Math.random;
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/uniform.js
var uniform_default;
var init_uniform = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/uniform.js"() {
    init_defaultSource();
    uniform_default = function sourceRandomUniform(source) {
      function randomUniform(min4, max5) {
        min4 = min4 == null ? 0 : +min4;
        max5 = max5 == null ? 1 : +max5;
        if (arguments.length === 1)
          max5 = min4, min4 = 0;
        else
          max5 -= min4;
        return function() {
          return source() * max5 + min4;
        };
      }
      randomUniform.source = sourceRandomUniform;
      return randomUniform;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/int.js
var int_default;
var init_int = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/int.js"() {
    init_defaultSource();
    int_default = function sourceRandomInt(source) {
      function randomInt(min4, max5) {
        if (arguments.length < 2)
          max5 = min4, min4 = 0;
        min4 = Math.floor(min4);
        max5 = Math.floor(max5) - min4;
        return function() {
          return Math.floor(source() * max5 + min4);
        };
      }
      randomInt.source = sourceRandomInt;
      return randomInt;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/normal.js
var normal_default;
var init_normal = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/normal.js"() {
    init_defaultSource();
    normal_default = function sourceRandomNormal(source) {
      function randomNormal(mu, sigma) {
        var x3, r;
        mu = mu == null ? 0 : +mu;
        sigma = sigma == null ? 1 : +sigma;
        return function() {
          var y3;
          if (x3 != null)
            y3 = x3, x3 = null;
          else
            do {
              x3 = source() * 2 - 1;
              y3 = source() * 2 - 1;
              r = x3 * x3 + y3 * y3;
            } while (!r || r > 1);
          return mu + sigma * y3 * Math.sqrt(-2 * Math.log(r) / r);
        };
      }
      randomNormal.source = sourceRandomNormal;
      return randomNormal;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/logNormal.js
var logNormal_default;
var init_logNormal = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/logNormal.js"() {
    init_defaultSource();
    init_normal();
    logNormal_default = function sourceRandomLogNormal(source) {
      var N = normal_default.source(source);
      function randomLogNormal() {
        var randomNormal = N.apply(this, arguments);
        return function() {
          return Math.exp(randomNormal());
        };
      }
      randomLogNormal.source = sourceRandomLogNormal;
      return randomLogNormal;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/irwinHall.js
var irwinHall_default;
var init_irwinHall = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/irwinHall.js"() {
    init_defaultSource();
    irwinHall_default = function sourceRandomIrwinHall(source) {
      function randomIrwinHall(n) {
        if ((n = +n) <= 0)
          return () => 0;
        return function() {
          for (var sum4 = 0, i = n; i > 1; --i)
            sum4 += source();
          return sum4 + i * source();
        };
      }
      randomIrwinHall.source = sourceRandomIrwinHall;
      return randomIrwinHall;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/bates.js
var bates_default;
var init_bates = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/bates.js"() {
    init_defaultSource();
    init_irwinHall();
    bates_default = function sourceRandomBates(source) {
      var I = irwinHall_default.source(source);
      function randomBates(n) {
        if ((n = +n) === 0)
          return source;
        var randomIrwinHall = I(n);
        return function() {
          return randomIrwinHall() / n;
        };
      }
      randomBates.source = sourceRandomBates;
      return randomBates;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/exponential.js
var exponential_default;
var init_exponential = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/exponential.js"() {
    init_defaultSource();
    exponential_default = function sourceRandomExponential(source) {
      function randomExponential(lambda) {
        return function() {
          return -Math.log1p(-source()) / lambda;
        };
      }
      randomExponential.source = sourceRandomExponential;
      return randomExponential;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/pareto.js
var pareto_default;
var init_pareto = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/pareto.js"() {
    init_defaultSource();
    pareto_default = function sourceRandomPareto(source) {
      function randomPareto(alpha) {
        if ((alpha = +alpha) < 0)
          throw new RangeError("invalid alpha");
        alpha = 1 / -alpha;
        return function() {
          return Math.pow(1 - source(), alpha);
        };
      }
      randomPareto.source = sourceRandomPareto;
      return randomPareto;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/bernoulli.js
var bernoulli_default;
var init_bernoulli = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/bernoulli.js"() {
    init_defaultSource();
    bernoulli_default = function sourceRandomBernoulli(source) {
      function randomBernoulli(p) {
        if ((p = +p) < 0 || p > 1)
          throw new RangeError("invalid p");
        return function() {
          return Math.floor(source() + p);
        };
      }
      randomBernoulli.source = sourceRandomBernoulli;
      return randomBernoulli;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/geometric.js
var geometric_default;
var init_geometric = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/geometric.js"() {
    init_defaultSource();
    geometric_default = function sourceRandomGeometric(source) {
      function randomGeometric(p) {
        if ((p = +p) < 0 || p > 1)
          throw new RangeError("invalid p");
        if (p === 0)
          return () => Infinity;
        if (p === 1)
          return () => 1;
        p = Math.log1p(-p);
        return function() {
          return 1 + Math.floor(Math.log1p(-source()) / p);
        };
      }
      randomGeometric.source = sourceRandomGeometric;
      return randomGeometric;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/gamma.js
var gamma_default;
var init_gamma = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/gamma.js"() {
    init_defaultSource();
    init_normal();
    gamma_default = function sourceRandomGamma(source) {
      var randomNormal = normal_default.source(source)();
      function randomGamma(k2, theta) {
        if ((k2 = +k2) < 0)
          throw new RangeError("invalid k");
        if (k2 === 0)
          return () => 0;
        theta = theta == null ? 1 : +theta;
        if (k2 === 1)
          return () => -Math.log1p(-source()) * theta;
        var d = (k2 < 1 ? k2 + 1 : k2) - 1 / 3, c3 = 1 / (3 * Math.sqrt(d)), multiplier = k2 < 1 ? () => Math.pow(source(), 1 / k2) : () => 1;
        return function() {
          do {
            do {
              var x3 = randomNormal(), v2 = 1 + c3 * x3;
            } while (v2 <= 0);
            v2 *= v2 * v2;
            var u4 = 1 - source();
          } while (u4 >= 1 - 0.0331 * x3 * x3 * x3 * x3 && Math.log(u4) >= 0.5 * x3 * x3 + d * (1 - v2 + Math.log(v2)));
          return d * v2 * multiplier() * theta;
        };
      }
      randomGamma.source = sourceRandomGamma;
      return randomGamma;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/beta.js
var beta_default;
var init_beta = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/beta.js"() {
    init_defaultSource();
    init_gamma();
    beta_default = function sourceRandomBeta(source) {
      var G = gamma_default.source(source);
      function randomBeta(alpha, beta) {
        var X2 = G(alpha), Y2 = G(beta);
        return function() {
          var x3 = X2();
          return x3 === 0 ? 0 : x3 / (x3 + Y2());
        };
      }
      randomBeta.source = sourceRandomBeta;
      return randomBeta;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/binomial.js
var binomial_default;
var init_binomial = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/binomial.js"() {
    init_defaultSource();
    init_beta();
    init_geometric();
    binomial_default = function sourceRandomBinomial(source) {
      var G = geometric_default.source(source), B3 = beta_default.source(source);
      function randomBinomial(n, p) {
        n = +n;
        if ((p = +p) >= 1)
          return () => n;
        if (p <= 0)
          return () => 0;
        return function() {
          var acc = 0, nn = n, pp = p;
          while (nn * pp > 16 && nn * (1 - pp) > 16) {
            var i = Math.floor((nn + 1) * pp), y3 = B3(i, nn - i + 1)();
            if (y3 <= pp) {
              acc += i;
              nn -= i;
              pp = (pp - y3) / (1 - y3);
            } else {
              nn = i - 1;
              pp /= y3;
            }
          }
          var sign3 = pp < 0.5, pFinal = sign3 ? pp : 1 - pp, g = G(pFinal);
          for (var s2 = g(), k2 = 0; s2 <= nn; ++k2)
            s2 += g();
          return acc + (sign3 ? k2 : nn - k2);
        };
      }
      randomBinomial.source = sourceRandomBinomial;
      return randomBinomial;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/weibull.js
var weibull_default;
var init_weibull = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/weibull.js"() {
    init_defaultSource();
    weibull_default = function sourceRandomWeibull(source) {
      function randomWeibull(k2, a2, b) {
        var outerFunc;
        if ((k2 = +k2) === 0) {
          outerFunc = (x3) => -Math.log(x3);
        } else {
          k2 = 1 / k2;
          outerFunc = (x3) => Math.pow(x3, k2);
        }
        a2 = a2 == null ? 0 : +a2;
        b = b == null ? 1 : +b;
        return function() {
          return a2 + b * outerFunc(-Math.log1p(-source()));
        };
      }
      randomWeibull.source = sourceRandomWeibull;
      return randomWeibull;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/cauchy.js
var cauchy_default;
var init_cauchy = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/cauchy.js"() {
    init_defaultSource();
    cauchy_default = function sourceRandomCauchy(source) {
      function randomCauchy(a2, b) {
        a2 = a2 == null ? 0 : +a2;
        b = b == null ? 1 : +b;
        return function() {
          return a2 + b * Math.tan(Math.PI * source());
        };
      }
      randomCauchy.source = sourceRandomCauchy;
      return randomCauchy;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/logistic.js
var logistic_default;
var init_logistic = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/logistic.js"() {
    init_defaultSource();
    logistic_default = function sourceRandomLogistic(source) {
      function randomLogistic(a2, b) {
        a2 = a2 == null ? 0 : +a2;
        b = b == null ? 1 : +b;
        return function() {
          var u4 = source();
          return a2 + b * Math.log(u4 / (1 - u4));
        };
      }
      randomLogistic.source = sourceRandomLogistic;
      return randomLogistic;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/poisson.js
var poisson_default;
var init_poisson = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/poisson.js"() {
    init_defaultSource();
    init_binomial();
    init_gamma();
    poisson_default = function sourceRandomPoisson(source) {
      var G = gamma_default.source(source), B3 = binomial_default.source(source);
      function randomPoisson(lambda) {
        return function() {
          var acc = 0, l = lambda;
          while (l > 16) {
            var n = Math.floor(0.875 * l), t = G(n)();
            if (t > l)
              return acc + B3(n - 1, l / t)();
            acc += n;
            l -= t;
          }
          for (var s2 = -Math.log1p(-source()), k2 = 0; s2 <= l; ++k2)
            s2 -= Math.log1p(-source());
          return acc + k2;
        };
      }
      randomPoisson.source = sourceRandomPoisson;
      return randomPoisson;
    }(defaultSource_default);
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/lcg.js
var eps;
var init_lcg3 = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/lcg.js"() {
    eps = 1 / 4294967296;
  }
});

// node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/index.js
var init_src25 = __esm({
  "node_modules/.aspect_rules_js/d3-random@3.0.1/node_modules/d3-random/src/index.js"() {
    init_uniform();
    init_int();
    init_normal();
    init_logNormal();
    init_bates();
    init_irwinHall();
    init_exponential();
    init_pareto();
    init_bernoulli();
    init_geometric();
    init_binomial();
    init_gamma();
    init_beta();
    init_weibull();
    init_cauchy();
    init_logistic();
    init_poisson();
    init_lcg3();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/init.js
var init_init = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/init.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/ordinal.js
var implicit;
var init_ordinal = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/ordinal.js"() {
    init_src2();
    init_init();
    implicit = Symbol("implicit");
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/band.js
var init_band = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/band.js"() {
    init_src2();
    init_init();
    init_ordinal();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/constant.js
var init_constant11 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/number.js
var init_number3 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/number.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/continuous.js
var init_continuous = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/continuous.js"() {
    init_src2();
    init_src8();
    init_constant11();
    init_number3();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/tickFormat.js
var init_tickFormat = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/tickFormat.js"() {
    init_src2();
    init_src21();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/linear.js
var init_linear2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/linear.js"() {
    init_src2();
    init_continuous();
    init_init();
    init_tickFormat();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/identity.js
var init_identity6 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/identity.js"() {
    init_linear2();
    init_number3();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/nice.js
var init_nice2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/nice.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/log.js
var init_log = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/log.js"() {
    init_src2();
    init_src21();
    init_nice2();
    init_continuous();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/symlog.js
var init_symlog = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/symlog.js"() {
    init_linear2();
    init_continuous();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/pow.js
var init_pow = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/pow.js"() {
    init_linear2();
    init_continuous();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/radial.js
var init_radial2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/radial.js"() {
    init_continuous();
    init_init();
    init_linear2();
    init_number3();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/quantile.js
var init_quantile2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/quantile.js"() {
    init_src2();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/quantize.js
var init_quantize2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/quantize.js"() {
    init_src2();
    init_linear2();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/threshold.js
var init_threshold = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/threshold.js"() {
    init_src2();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/interval.js
function timeInterval(floori, offseti, count3, field) {
  function interval2(date) {
    return floori(date = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date)), date;
  }
  interval2.floor = (date) => {
    return floori(date = /* @__PURE__ */ new Date(+date)), date;
  };
  interval2.ceil = (date) => {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };
  interval2.round = (date) => {
    const d0 = interval2(date), d1 = interval2.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };
  interval2.offset = (date, step) => {
    return offseti(date = /* @__PURE__ */ new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };
  interval2.range = (start2, stop, step) => {
    const range2 = [];
    start2 = interval2.ceil(start2);
    step = step == null ? 1 : Math.floor(step);
    if (!(start2 < stop) || !(step > 0))
      return range2;
    let previous;
    do
      range2.push(previous = /* @__PURE__ */ new Date(+start2)), offseti(start2, step), floori(start2);
    while (previous < start2 && start2 < stop);
    return range2;
  };
  interval2.filter = (test) => {
    return timeInterval((date) => {
      if (date >= date)
        while (floori(date), !test(date))
          date.setTime(date - 1);
    }, (date, step) => {
      if (date >= date) {
        if (step < 0)
          while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {
            }
          }
        else
          while (--step >= 0) {
            while (offseti(date, 1), !test(date)) {
            }
          }
      }
    });
  };
  if (count3) {
    interval2.count = (start2, end) => {
      t02.setTime(+start2), t12.setTime(+end);
      floori(t02), floori(t12);
      return Math.floor(count3(t02, t12));
    };
    interval2.every = (step) => {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval2 : interval2.filter(field ? (d) => field(d) % step === 0 : (d) => interval2.count(0, d) % step === 0);
    };
  }
  return interval2;
}
var t02, t12;
var init_interval2 = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/interval.js"() {
    t02 = /* @__PURE__ */ new Date();
    t12 = /* @__PURE__ */ new Date();
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/millisecond.js
var millisecond, milliseconds;
var init_millisecond = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/millisecond.js"() {
    init_interval2();
    millisecond = timeInterval(() => {
    }, (date, step) => {
      date.setTime(+date + step);
    }, (start2, end) => {
      return end - start2;
    });
    millisecond.every = (k2) => {
      k2 = Math.floor(k2);
      if (!isFinite(k2) || !(k2 > 0))
        return null;
      if (!(k2 > 1))
        return millisecond;
      return timeInterval((date) => {
        date.setTime(Math.floor(date / k2) * k2);
      }, (date, step) => {
        date.setTime(+date + step * k2);
      }, (start2, end) => {
        return (end - start2) / k2;
      });
    };
    milliseconds = millisecond.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/duration.js
var durationSecond, durationMinute, durationHour, durationDay, durationWeek, durationMonth, durationYear;
var init_duration2 = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/duration.js"() {
    durationSecond = 1e3;
    durationMinute = durationSecond * 60;
    durationHour = durationMinute * 60;
    durationDay = durationHour * 24;
    durationWeek = durationDay * 7;
    durationMonth = durationDay * 30;
    durationYear = durationDay * 365;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/second.js
var second, seconds;
var init_second = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/second.js"() {
    init_interval2();
    init_duration2();
    second = timeInterval((date) => {
      date.setTime(date - date.getMilliseconds());
    }, (date, step) => {
      date.setTime(+date + step * durationSecond);
    }, (start2, end) => {
      return (end - start2) / durationSecond;
    }, (date) => {
      return date.getUTCSeconds();
    });
    seconds = second.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/minute.js
var timeMinute, timeMinutes, utcMinute, utcMinutes;
var init_minute = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/minute.js"() {
    init_interval2();
    init_duration2();
    timeMinute = timeInterval((date) => {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
    }, (date, step) => {
      date.setTime(+date + step * durationMinute);
    }, (start2, end) => {
      return (end - start2) / durationMinute;
    }, (date) => {
      return date.getMinutes();
    });
    timeMinutes = timeMinute.range;
    utcMinute = timeInterval((date) => {
      date.setUTCSeconds(0, 0);
    }, (date, step) => {
      date.setTime(+date + step * durationMinute);
    }, (start2, end) => {
      return (end - start2) / durationMinute;
    }, (date) => {
      return date.getUTCMinutes();
    });
    utcMinutes = utcMinute.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/hour.js
var timeHour, timeHours, utcHour, utcHours;
var init_hour = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/hour.js"() {
    init_interval2();
    init_duration2();
    timeHour = timeInterval((date) => {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
    }, (date, step) => {
      date.setTime(+date + step * durationHour);
    }, (start2, end) => {
      return (end - start2) / durationHour;
    }, (date) => {
      return date.getHours();
    });
    timeHours = timeHour.range;
    utcHour = timeInterval((date) => {
      date.setUTCMinutes(0, 0, 0);
    }, (date, step) => {
      date.setTime(+date + step * durationHour);
    }, (start2, end) => {
      return (end - start2) / durationHour;
    }, (date) => {
      return date.getUTCHours();
    });
    utcHours = utcHour.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/day.js
var timeDay, timeDays, utcDay, utcDays, unixDay, unixDays;
var init_day = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/day.js"() {
    init_interval2();
    init_duration2();
    timeDay = timeInterval(
      (date) => date.setHours(0, 0, 0, 0),
      (date, step) => date.setDate(date.getDate() + step),
      (start2, end) => (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationDay,
      (date) => date.getDate() - 1
    );
    timeDays = timeDay.range;
    utcDay = timeInterval((date) => {
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCDate(date.getUTCDate() + step);
    }, (start2, end) => {
      return (end - start2) / durationDay;
    }, (date) => {
      return date.getUTCDate() - 1;
    });
    utcDays = utcDay.range;
    unixDay = timeInterval((date) => {
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCDate(date.getUTCDate() + step);
    }, (start2, end) => {
      return (end - start2) / durationDay;
    }, (date) => {
      return Math.floor(date / durationDay);
    });
    unixDays = unixDay.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/week.js
function timeWeekday(i) {
  return timeInterval((date) => {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setDate(date.getDate() + step * 7);
  }, (start2, end) => {
    return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}
function utcWeekday(i) {
  return timeInterval((date) => {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, (start2, end) => {
    return (end - start2) / durationWeek;
  });
}
var timeSunday, timeMonday, timeTuesday, timeWednesday, timeThursday, timeFriday, timeSaturday, timeSundays, timeMondays, timeTuesdays, timeWednesdays, timeThursdays, timeFridays, timeSaturdays, utcSunday, utcMonday, utcTuesday, utcWednesday, utcThursday, utcFriday, utcSaturday, utcSundays, utcMondays, utcTuesdays, utcWednesdays, utcThursdays, utcFridays, utcSaturdays;
var init_week = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/week.js"() {
    init_interval2();
    init_duration2();
    timeSunday = timeWeekday(0);
    timeMonday = timeWeekday(1);
    timeTuesday = timeWeekday(2);
    timeWednesday = timeWeekday(3);
    timeThursday = timeWeekday(4);
    timeFriday = timeWeekday(5);
    timeSaturday = timeWeekday(6);
    timeSundays = timeSunday.range;
    timeMondays = timeMonday.range;
    timeTuesdays = timeTuesday.range;
    timeWednesdays = timeWednesday.range;
    timeThursdays = timeThursday.range;
    timeFridays = timeFriday.range;
    timeSaturdays = timeSaturday.range;
    utcSunday = utcWeekday(0);
    utcMonday = utcWeekday(1);
    utcTuesday = utcWeekday(2);
    utcWednesday = utcWeekday(3);
    utcThursday = utcWeekday(4);
    utcFriday = utcWeekday(5);
    utcSaturday = utcWeekday(6);
    utcSundays = utcSunday.range;
    utcMondays = utcMonday.range;
    utcTuesdays = utcTuesday.range;
    utcWednesdays = utcWednesday.range;
    utcThursdays = utcThursday.range;
    utcFridays = utcFriday.range;
    utcSaturdays = utcSaturday.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/month.js
var timeMonth, timeMonths, utcMonth, utcMonths;
var init_month = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/month.js"() {
    init_interval2();
    timeMonth = timeInterval((date) => {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setMonth(date.getMonth() + step);
    }, (start2, end) => {
      return end.getMonth() - start2.getMonth() + (end.getFullYear() - start2.getFullYear()) * 12;
    }, (date) => {
      return date.getMonth();
    });
    timeMonths = timeMonth.range;
    utcMonth = timeInterval((date) => {
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCMonth(date.getUTCMonth() + step);
    }, (start2, end) => {
      return end.getUTCMonth() - start2.getUTCMonth() + (end.getUTCFullYear() - start2.getUTCFullYear()) * 12;
    }, (date) => {
      return date.getUTCMonth();
    });
    utcMonths = utcMonth.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/year.js
var timeYear, timeYears, utcYear, utcYears;
var init_year = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/year.js"() {
    init_interval2();
    timeYear = timeInterval((date) => {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setFullYear(date.getFullYear() + step);
    }, (start2, end) => {
      return end.getFullYear() - start2.getFullYear();
    }, (date) => {
      return date.getFullYear();
    });
    timeYear.every = (k2) => {
      return !isFinite(k2 = Math.floor(k2)) || !(k2 > 0) ? null : timeInterval((date) => {
        date.setFullYear(Math.floor(date.getFullYear() / k2) * k2);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
      }, (date, step) => {
        date.setFullYear(date.getFullYear() + step * k2);
      });
    };
    timeYears = timeYear.range;
    utcYear = timeInterval((date) => {
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCFullYear(date.getUTCFullYear() + step);
    }, (start2, end) => {
      return end.getUTCFullYear() - start2.getUTCFullYear();
    }, (date) => {
      return date.getUTCFullYear();
    });
    utcYear.every = (k2) => {
      return !isFinite(k2 = Math.floor(k2)) || !(k2 > 0) ? null : timeInterval((date) => {
        date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k2) * k2);
        date.setUTCMonth(0, 1);
        date.setUTCHours(0, 0, 0, 0);
      }, (date, step) => {
        date.setUTCFullYear(date.getUTCFullYear() + step * k2);
      });
    };
    utcYears = utcYear.range;
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/ticks.js
function ticker(year, month, week, day, hour, minute) {
  const tickIntervals = [
    [second, 1, durationSecond],
    [second, 5, 5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute, 1, durationMinute],
    [minute, 5, 5 * durationMinute],
    [minute, 15, 15 * durationMinute],
    [minute, 30, 30 * durationMinute],
    [hour, 1, durationHour],
    [hour, 3, 3 * durationHour],
    [hour, 6, 6 * durationHour],
    [hour, 12, 12 * durationHour],
    [day, 1, durationDay],
    [day, 2, 2 * durationDay],
    [week, 1, durationWeek],
    [month, 1, durationMonth],
    [month, 3, 3 * durationMonth],
    [year, 1, durationYear]
  ];
  function ticks2(start2, stop, count3) {
    const reverse2 = stop < start2;
    if (reverse2)
      [start2, stop] = [stop, start2];
    const interval2 = count3 && typeof count3.range === "function" ? count3 : tickInterval(start2, stop, count3);
    const ticks3 = interval2 ? interval2.range(start2, +stop + 1) : [];
    return reverse2 ? ticks3.reverse() : ticks3;
  }
  function tickInterval(start2, stop, count3) {
    const target = Math.abs(stop - start2) / count3;
    const i = bisector(([, , step2]) => step2).right(tickIntervals, target);
    if (i === tickIntervals.length)
      return year.every(tickStep(start2 / durationYear, stop / durationYear, count3));
    if (i === 0)
      return millisecond.every(Math.max(tickStep(start2, stop, count3), 1));
    const [t, step] = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
    return t.every(step);
  }
  return [ticks2, tickInterval];
}
var utcTicks, utcTickInterval, timeTicks, timeTickInterval;
var init_ticks2 = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/ticks.js"() {
    init_src2();
    init_duration2();
    init_millisecond();
    init_second();
    init_minute();
    init_hour();
    init_day();
    init_week();
    init_month();
    init_year();
    [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcSunday, unixDay, utcHour, utcMinute);
    [timeTicks, timeTickInterval] = ticker(timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute);
  }
});

// node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/index.js
var init_src26 = __esm({
  "node_modules/.aspect_rules_js/d3-time@3.1.0/node_modules/d3-time/src/index.js"() {
    init_interval2();
    init_millisecond();
    init_second();
    init_minute();
    init_hour();
    init_day();
    init_week();
    init_month();
    init_year();
    init_ticks2();
  }
});

// node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/locale.js
function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}
function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}
function newDate(y3, m, d) {
  return { y: y3, m, d, H: 0, M: 0, S: 0, L: 0 };
}
function formatLocale(locale3) {
  var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
  var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "f": formatMicroseconds,
    "g": formatYearISO,
    "G": formatFullYearISO,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "q": formatQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatSeconds,
    "u": formatWeekdayNumberMonday,
    "U": formatWeekNumberSunday,
    "V": formatWeekNumberISO,
    "w": formatWeekdayNumberSunday,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear2,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };
  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "f": formatUTCMicroseconds,
    "g": formatUTCYearISO,
    "G": formatUTCFullYearISO,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "q": formatUTCQuarter,
    "Q": formatUnixTimestamp,
    "s": formatUnixTimestampSeconds,
    "S": formatUTCSeconds,
    "u": formatUTCWeekdayNumberMonday,
    "U": formatUTCWeekNumberSunday,
    "V": formatUTCWeekNumberISO,
    "w": formatUTCWeekdayNumberSunday,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };
  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "f": parseMicroseconds,
    "g": parseYear,
    "G": parseFullYear,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "q": parseQuarter,
    "Q": parseUnixTimestamp,
    "s": parseUnixTimestampSeconds,
    "S": parseSeconds,
    "u": parseWeekdayNumberMonday,
    "U": parseWeekNumberSunday,
    "V": parseWeekNumberISO,
    "w": parseWeekdayNumberSunday,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);
  function newFormat(specifier, formats2) {
    return function(date) {
      var string = [], i = -1, j = 0, n = specifier.length, c3, pad3, format2;
      if (!(date instanceof Date))
        date = /* @__PURE__ */ new Date(+date);
      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad3 = pads[c3 = specifier.charAt(++i)]) != null)
            c3 = specifier.charAt(++i);
          else
            pad3 = c3 === "e" ? " " : "0";
          if (format2 = formats2[c3])
            c3 = format2(date, pad3);
          string.push(c3);
          j = i + 1;
        }
      }
      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }
  function newParse(specifier, Z) {
    return function(string) {
      var d = newDate(1900, void 0, 1), i = parseSpecifier(d, specifier, string += "", 0), week, day;
      if (i != string.length)
        return null;
      if ("Q" in d)
        return new Date(d.Q);
      if ("s" in d)
        return new Date(d.s * 1e3 + ("L" in d ? d.L : 0));
      if (Z && !("Z" in d))
        d.Z = 0;
      if ("p" in d)
        d.H = d.H % 12 + d.p * 12;
      if (d.m === void 0)
        d.m = "q" in d ? d.q : 0;
      if ("V" in d) {
        if (d.V < 1 || d.V > 53)
          return null;
        if (!("w" in d))
          d.w = 1;
        if ("Z" in d) {
          week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
          week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week);
          week = utcDay.offset(week, (d.V - 1) * 7);
          d.y = week.getUTCFullYear();
          d.m = week.getUTCMonth();
          d.d = week.getUTCDate() + (d.w + 6) % 7;
        } else {
          week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
          week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week);
          week = timeDay.offset(week, (d.V - 1) * 7);
          d.y = week.getFullYear();
          d.m = week.getMonth();
          d.d = week.getDate() + (d.w + 6) % 7;
        }
      } else if ("W" in d || "U" in d) {
        if (!("w" in d))
          d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
        day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }
      return localDate(d);
    };
  }
  function parseSpecifier(d, specifier, string, j) {
    var i = 0, n = specifier.length, m = string.length, c3, parse;
    while (i < n) {
      if (j >= m)
        return -1;
      c3 = specifier.charCodeAt(i++);
      if (c3 === 37) {
        c3 = specifier.charAt(i++);
        parse = parses[c3 in pads ? specifier.charAt(i++) : c3];
        if (!parse || (j = parse(d, string, j)) < 0)
          return -1;
      } else if (c3 != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }
  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }
  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }
  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }
  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }
  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }
  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }
  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }
  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }
  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }
  function formatQuarter(d) {
    return 1 + ~~(d.getMonth() / 3);
  }
  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }
  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }
  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }
  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }
  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }
  function formatUTCQuarter(d) {
    return 1 + ~~(d.getUTCMonth() / 3);
  }
  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() {
        return specifier;
      };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", false);
      p.toString = function() {
        return specifier;
      };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() {
        return specifier;
      };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier += "", true);
      p.toString = function() {
        return specifier;
      };
      return p;
    }
  };
}
function pad2(value, fill, width) {
  var sign3 = value < 0 ? "-" : "", string = (sign3 ? -value : value) + "", length = string.length;
  return sign3 + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}
function requote(s2) {
  return s2.replace(requoteRe, "\\$&");
}
function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}
function formatLookup(names) {
  return new Map(names.map((name, i) => [name.toLowerCase(), i]));
}
function parseWeekdayNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}
function parseWeekdayNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.u = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberISO(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.V = +n[0], i + n[0].length) : -1;
}
function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}
function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}
function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2e3), i + n[0].length) : -1;
}
function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}
function parseQuarter(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
}
function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}
function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}
function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}
function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}
function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}
function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}
function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}
function parseMicroseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 6));
  return n ? (d.L = Math.floor(n[0] / 1e3), i + n[0].length) : -1;
}
function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}
function parseUnixTimestamp(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.Q = +n[0], i + n[0].length) : -1;
}
function parseUnixTimestampSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.s = +n[0], i + n[0].length) : -1;
}
function formatDayOfMonth(d, p) {
  return pad2(d.getDate(), p, 2);
}
function formatHour24(d, p) {
  return pad2(d.getHours(), p, 2);
}
function formatHour12(d, p) {
  return pad2(d.getHours() % 12 || 12, p, 2);
}
function formatDayOfYear(d, p) {
  return pad2(1 + timeDay.count(timeYear(d), d), p, 3);
}
function formatMilliseconds(d, p) {
  return pad2(d.getMilliseconds(), p, 3);
}
function formatMicroseconds(d, p) {
  return formatMilliseconds(d, p) + "000";
}
function formatMonthNumber(d, p) {
  return pad2(d.getMonth() + 1, p, 2);
}
function formatMinutes(d, p) {
  return pad2(d.getMinutes(), p, 2);
}
function formatSeconds(d, p) {
  return pad2(d.getSeconds(), p, 2);
}
function formatWeekdayNumberMonday(d) {
  var day = d.getDay();
  return day === 0 ? 7 : day;
}
function formatWeekNumberSunday(d, p) {
  return pad2(timeSunday.count(timeYear(d) - 1, d), p, 2);
}
function dISO(d) {
  var day = d.getDay();
  return day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
}
function formatWeekNumberISO(d, p) {
  d = dISO(d);
  return pad2(timeThursday.count(timeYear(d), d) + (timeYear(d).getDay() === 4), p, 2);
}
function formatWeekdayNumberSunday(d) {
  return d.getDay();
}
function formatWeekNumberMonday(d, p) {
  return pad2(timeMonday.count(timeYear(d) - 1, d), p, 2);
}
function formatYear2(d, p) {
  return pad2(d.getFullYear() % 100, p, 2);
}
function formatYearISO(d, p) {
  d = dISO(d);
  return pad2(d.getFullYear() % 100, p, 2);
}
function formatFullYear(d, p) {
  return pad2(d.getFullYear() % 1e4, p, 4);
}
function formatFullYearISO(d, p) {
  var day = d.getDay();
  d = day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
  return pad2(d.getFullYear() % 1e4, p, 4);
}
function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad2(z / 60 | 0, "0", 2) + pad2(z % 60, "0", 2);
}
function formatUTCDayOfMonth(d, p) {
  return pad2(d.getUTCDate(), p, 2);
}
function formatUTCHour24(d, p) {
  return pad2(d.getUTCHours(), p, 2);
}
function formatUTCHour12(d, p) {
  return pad2(d.getUTCHours() % 12 || 12, p, 2);
}
function formatUTCDayOfYear(d, p) {
  return pad2(1 + utcDay.count(utcYear(d), d), p, 3);
}
function formatUTCMilliseconds(d, p) {
  return pad2(d.getUTCMilliseconds(), p, 3);
}
function formatUTCMicroseconds(d, p) {
  return formatUTCMilliseconds(d, p) + "000";
}
function formatUTCMonthNumber(d, p) {
  return pad2(d.getUTCMonth() + 1, p, 2);
}
function formatUTCMinutes(d, p) {
  return pad2(d.getUTCMinutes(), p, 2);
}
function formatUTCSeconds(d, p) {
  return pad2(d.getUTCSeconds(), p, 2);
}
function formatUTCWeekdayNumberMonday(d) {
  var dow = d.getUTCDay();
  return dow === 0 ? 7 : dow;
}
function formatUTCWeekNumberSunday(d, p) {
  return pad2(utcSunday.count(utcYear(d) - 1, d), p, 2);
}
function UTCdISO(d) {
  var day = d.getUTCDay();
  return day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
}
function formatUTCWeekNumberISO(d, p) {
  d = UTCdISO(d);
  return pad2(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
}
function formatUTCWeekdayNumberSunday(d) {
  return d.getUTCDay();
}
function formatUTCWeekNumberMonday(d, p) {
  return pad2(utcMonday.count(utcYear(d) - 1, d), p, 2);
}
function formatUTCYear(d, p) {
  return pad2(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCYearISO(d, p) {
  d = UTCdISO(d);
  return pad2(d.getUTCFullYear() % 100, p, 2);
}
function formatUTCFullYear(d, p) {
  return pad2(d.getUTCFullYear() % 1e4, p, 4);
}
function formatUTCFullYearISO(d, p) {
  var day = d.getUTCDay();
  d = day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
  return pad2(d.getUTCFullYear() % 1e4, p, 4);
}
function formatUTCZone() {
  return "+0000";
}
function formatLiteralPercent() {
  return "%";
}
function formatUnixTimestamp(d) {
  return +d;
}
function formatUnixTimestampSeconds(d) {
  return Math.floor(+d / 1e3);
}
var pads, numberRe, percentRe, requoteRe;
var init_locale2 = __esm({
  "node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/locale.js"() {
    init_src26();
    pads = { "-": "", "_": " ", "0": "0" };
    numberRe = /^\s*\d+/;
    percentRe = /^%/;
    requoteRe = /[\\^$*+?|[\]().{}]/g;
  }
});

// node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/defaultLocale.js
function defaultLocale2(definition) {
  locale2 = formatLocale(definition);
  timeFormat = locale2.format;
  timeParse = locale2.parse;
  utcFormat = locale2.utcFormat;
  utcParse = locale2.utcParse;
  return locale2;
}
var locale2, timeFormat, timeParse, utcFormat, utcParse;
var init_defaultLocale2 = __esm({
  "node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/defaultLocale.js"() {
    init_locale2();
    defaultLocale2({
      dateTime: "%x, %X",
      date: "%-m/%-d/%Y",
      time: "%-I:%M:%S %p",
      periods: ["AM", "PM"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    });
  }
});

// node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/isoFormat.js
function formatIsoNative(date) {
  return date.toISOString();
}
var isoSpecifier, formatIso;
var init_isoFormat = __esm({
  "node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/isoFormat.js"() {
    init_defaultLocale2();
    isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";
    formatIso = Date.prototype.toISOString ? formatIsoNative : utcFormat(isoSpecifier);
  }
});

// node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/isoParse.js
function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}
var parseIso;
var init_isoParse = __esm({
  "node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/isoParse.js"() {
    init_isoFormat();
    init_defaultLocale2();
    parseIso = +/* @__PURE__ */ new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : utcParse(isoSpecifier);
  }
});

// node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/index.js
var init_src27 = __esm({
  "node_modules/.aspect_rules_js/d3-time-format@4.1.0/node_modules/d3-time-format/src/index.js"() {
    init_defaultLocale2();
    init_locale2();
    init_isoFormat();
    init_isoParse();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/time.js
var init_time = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/time.js"() {
    init_src26();
    init_src27();
    init_continuous();
    init_init();
    init_nice2();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/utcTime.js
var init_utcTime = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/utcTime.js"() {
    init_src26();
    init_src27();
    init_time();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/sequential.js
var init_sequential = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/sequential.js"() {
    init_src8();
    init_continuous();
    init_init();
    init_linear2();
    init_log();
    init_symlog();
    init_pow();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/sequentialQuantile.js
var init_sequentialQuantile = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/sequentialQuantile.js"() {
    init_src2();
    init_continuous();
    init_init();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/diverging.js
var init_diverging = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/diverging.js"() {
    init_src8();
    init_continuous();
    init_init();
    init_linear2();
    init_log();
    init_sequential();
    init_symlog();
    init_pow();
  }
});

// node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/index.js
var init_src28 = __esm({
  "node_modules/.aspect_rules_js/d3-scale@4.0.2/node_modules/d3-scale/src/index.js"() {
    init_band();
    init_identity6();
    init_linear2();
    init_log();
    init_symlog();
    init_ordinal();
    init_pow();
    init_radial2();
    init_quantile2();
    init_quantize2();
    init_threshold();
    init_time();
    init_utcTime();
    init_sequential();
    init_sequentialQuantile();
    init_diverging();
    init_tickFormat();
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/colors.js
function colors_default(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n)
    colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}
var init_colors = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/colors.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/category10.js
var category10_default;
var init_category10 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/category10.js"() {
    init_colors();
    category10_default = colors_default("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Accent.js
var Accent_default;
var init_Accent = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Accent.js"() {
    init_colors();
    Accent_default = colors_default("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Dark2.js
var Dark2_default;
var init_Dark2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Dark2.js"() {
    init_colors();
    Dark2_default = colors_default("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/observable10.js
var observable10_default;
var init_observable10 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/observable10.js"() {
    init_colors();
    observable10_default = colors_default("4269d0efb118ff725c6cc5b03ca951ff8ab7a463f297bbf59c6b4e9498a0");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Paired.js
var Paired_default;
var init_Paired = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Paired.js"() {
    init_colors();
    Paired_default = colors_default("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Pastel1.js
var Pastel1_default;
var init_Pastel1 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Pastel1.js"() {
    init_colors();
    Pastel1_default = colors_default("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Pastel2.js
var Pastel2_default;
var init_Pastel2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Pastel2.js"() {
    init_colors();
    Pastel2_default = colors_default("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set1.js
var Set1_default;
var init_Set1 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set1.js"() {
    init_colors();
    Set1_default = colors_default("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set2.js
var Set2_default;
var init_Set2 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set2.js"() {
    init_colors();
    Set2_default = colors_default("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set3.js
var Set3_default;
var init_Set3 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Set3.js"() {
    init_colors();
    Set3_default = colors_default("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Tableau10.js
var Tableau10_default;
var init_Tableau10 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/categorical/Tableau10.js"() {
    init_colors();
    Tableau10_default = colors_default("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/ramp.js
var ramp_default;
var init_ramp = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/ramp.js"() {
    init_src8();
    ramp_default = (scheme28) => rgbBasis(scheme28[scheme28.length - 1]);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/BrBG.js
var scheme, BrBG_default;
var init_BrBG = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/BrBG.js"() {
    init_colors();
    init_ramp();
    scheme = new Array(3).concat(
      "d8b365f5f5f55ab4ac",
      "a6611adfc27d80cdc1018571",
      "a6611adfc27df5f5f580cdc1018571",
      "8c510ad8b365f6e8c3c7eae55ab4ac01665e",
      "8c510ad8b365f6e8c3f5f5f5c7eae55ab4ac01665e",
      "8c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e",
      "8c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e",
      "5430058c510abf812ddfc27df6e8c3c7eae580cdc135978f01665e003c30",
      "5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30"
    ).map(colors_default);
    BrBG_default = ramp_default(scheme);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PRGn.js
var scheme2, PRGn_default;
var init_PRGn = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PRGn.js"() {
    init_colors();
    init_ramp();
    scheme2 = new Array(3).concat(
      "af8dc3f7f7f77fbf7b",
      "7b3294c2a5cfa6dba0008837",
      "7b3294c2a5cff7f7f7a6dba0008837",
      "762a83af8dc3e7d4e8d9f0d37fbf7b1b7837",
      "762a83af8dc3e7d4e8f7f7f7d9f0d37fbf7b1b7837",
      "762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b7837",
      "762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b7837",
      "40004b762a839970abc2a5cfe7d4e8d9f0d3a6dba05aae611b783700441b",
      "40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b"
    ).map(colors_default);
    PRGn_default = ramp_default(scheme2);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PiYG.js
var scheme3, PiYG_default;
var init_PiYG = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PiYG.js"() {
    init_colors();
    init_ramp();
    scheme3 = new Array(3).concat(
      "e9a3c9f7f7f7a1d76a",
      "d01c8bf1b6dab8e1864dac26",
      "d01c8bf1b6daf7f7f7b8e1864dac26",
      "c51b7de9a3c9fde0efe6f5d0a1d76a4d9221",
      "c51b7de9a3c9fde0eff7f7f7e6f5d0a1d76a4d9221",
      "c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221",
      "c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221",
      "8e0152c51b7dde77aef1b6dafde0efe6f5d0b8e1867fbc414d9221276419",
      "8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419"
    ).map(colors_default);
    PiYG_default = ramp_default(scheme3);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PuOr.js
var scheme4, PuOr_default;
var init_PuOr = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/PuOr.js"() {
    init_colors();
    init_ramp();
    scheme4 = new Array(3).concat(
      "998ec3f7f7f7f1a340",
      "5e3c99b2abd2fdb863e66101",
      "5e3c99b2abd2f7f7f7fdb863e66101",
      "542788998ec3d8daebfee0b6f1a340b35806",
      "542788998ec3d8daebf7f7f7fee0b6f1a340b35806",
      "5427888073acb2abd2d8daebfee0b6fdb863e08214b35806",
      "5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b35806",
      "2d004b5427888073acb2abd2d8daebfee0b6fdb863e08214b358067f3b08",
      "2d004b5427888073acb2abd2d8daebf7f7f7fee0b6fdb863e08214b358067f3b08"
    ).map(colors_default);
    PuOr_default = ramp_default(scheme4);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdBu.js
var scheme5, RdBu_default;
var init_RdBu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdBu.js"() {
    init_colors();
    init_ramp();
    scheme5 = new Array(3).concat(
      "ef8a62f7f7f767a9cf",
      "ca0020f4a58292c5de0571b0",
      "ca0020f4a582f7f7f792c5de0571b0",
      "b2182bef8a62fddbc7d1e5f067a9cf2166ac",
      "b2182bef8a62fddbc7f7f7f7d1e5f067a9cf2166ac",
      "b2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac",
      "b2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac",
      "67001fb2182bd6604df4a582fddbc7d1e5f092c5de4393c32166ac053061",
      "67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061"
    ).map(colors_default);
    RdBu_default = ramp_default(scheme5);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdGy.js
var scheme6, RdGy_default;
var init_RdGy = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdGy.js"() {
    init_colors();
    init_ramp();
    scheme6 = new Array(3).concat(
      "ef8a62ffffff999999",
      "ca0020f4a582bababa404040",
      "ca0020f4a582ffffffbababa404040",
      "b2182bef8a62fddbc7e0e0e09999994d4d4d",
      "b2182bef8a62fddbc7ffffffe0e0e09999994d4d4d",
      "b2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d",
      "b2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d",
      "67001fb2182bd6604df4a582fddbc7e0e0e0bababa8787874d4d4d1a1a1a",
      "67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a"
    ).map(colors_default);
    RdGy_default = ramp_default(scheme6);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdYlBu.js
var scheme7, RdYlBu_default;
var init_RdYlBu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdYlBu.js"() {
    init_colors();
    init_ramp();
    scheme7 = new Array(3).concat(
      "fc8d59ffffbf91bfdb",
      "d7191cfdae61abd9e92c7bb6",
      "d7191cfdae61ffffbfabd9e92c7bb6",
      "d73027fc8d59fee090e0f3f891bfdb4575b4",
      "d73027fc8d59fee090ffffbfe0f3f891bfdb4575b4",
      "d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4",
      "d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4",
      "a50026d73027f46d43fdae61fee090e0f3f8abd9e974add14575b4313695",
      "a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695"
    ).map(colors_default);
    RdYlBu_default = ramp_default(scheme7);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdYlGn.js
var scheme8, RdYlGn_default;
var init_RdYlGn = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/RdYlGn.js"() {
    init_colors();
    init_ramp();
    scheme8 = new Array(3).concat(
      "fc8d59ffffbf91cf60",
      "d7191cfdae61a6d96a1a9641",
      "d7191cfdae61ffffbfa6d96a1a9641",
      "d73027fc8d59fee08bd9ef8b91cf601a9850",
      "d73027fc8d59fee08bffffbfd9ef8b91cf601a9850",
      "d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850",
      "d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850",
      "a50026d73027f46d43fdae61fee08bd9ef8ba6d96a66bd631a9850006837",
      "a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837"
    ).map(colors_default);
    RdYlGn_default = ramp_default(scheme8);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/Spectral.js
var scheme9, Spectral_default;
var init_Spectral = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/diverging/Spectral.js"() {
    init_colors();
    init_ramp();
    scheme9 = new Array(3).concat(
      "fc8d59ffffbf99d594",
      "d7191cfdae61abdda42b83ba",
      "d7191cfdae61ffffbfabdda42b83ba",
      "d53e4ffc8d59fee08be6f59899d5943288bd",
      "d53e4ffc8d59fee08bffffbfe6f59899d5943288bd",
      "d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd",
      "d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd",
      "9e0142d53e4ff46d43fdae61fee08be6f598abdda466c2a53288bd5e4fa2",
      "9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2"
    ).map(colors_default);
    Spectral_default = ramp_default(scheme9);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/BuGn.js
var scheme10, BuGn_default;
var init_BuGn = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/BuGn.js"() {
    init_colors();
    init_ramp();
    scheme10 = new Array(3).concat(
      "e5f5f999d8c92ca25f",
      "edf8fbb2e2e266c2a4238b45",
      "edf8fbb2e2e266c2a42ca25f006d2c",
      "edf8fbccece699d8c966c2a42ca25f006d2c",
      "edf8fbccece699d8c966c2a441ae76238b45005824",
      "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45005824",
      "f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b"
    ).map(colors_default);
    BuGn_default = ramp_default(scheme10);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/BuPu.js
var scheme11, BuPu_default;
var init_BuPu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/BuPu.js"() {
    init_colors();
    init_ramp();
    scheme11 = new Array(3).concat(
      "e0ecf49ebcda8856a7",
      "edf8fbb3cde38c96c688419d",
      "edf8fbb3cde38c96c68856a7810f7c",
      "edf8fbbfd3e69ebcda8c96c68856a7810f7c",
      "edf8fbbfd3e69ebcda8c96c68c6bb188419d6e016b",
      "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d6e016b",
      "f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b"
    ).map(colors_default);
    BuPu_default = ramp_default(scheme11);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/GnBu.js
var scheme12, GnBu_default;
var init_GnBu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/GnBu.js"() {
    init_colors();
    init_ramp();
    scheme12 = new Array(3).concat(
      "e0f3dba8ddb543a2ca",
      "f0f9e8bae4bc7bccc42b8cbe",
      "f0f9e8bae4bc7bccc443a2ca0868ac",
      "f0f9e8ccebc5a8ddb57bccc443a2ca0868ac",
      "f0f9e8ccebc5a8ddb57bccc44eb3d32b8cbe08589e",
      "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe08589e",
      "f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081"
    ).map(colors_default);
    GnBu_default = ramp_default(scheme12);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/OrRd.js
var scheme13, OrRd_default;
var init_OrRd = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/OrRd.js"() {
    init_colors();
    init_ramp();
    scheme13 = new Array(3).concat(
      "fee8c8fdbb84e34a33",
      "fef0d9fdcc8afc8d59d7301f",
      "fef0d9fdcc8afc8d59e34a33b30000",
      "fef0d9fdd49efdbb84fc8d59e34a33b30000",
      "fef0d9fdd49efdbb84fc8d59ef6548d7301f990000",
      "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301f990000",
      "fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000"
    ).map(colors_default);
    OrRd_default = ramp_default(scheme13);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuBuGn.js
var scheme14, PuBuGn_default;
var init_PuBuGn = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuBuGn.js"() {
    init_colors();
    init_ramp();
    scheme14 = new Array(3).concat(
      "ece2f0a6bddb1c9099",
      "f6eff7bdc9e167a9cf02818a",
      "f6eff7bdc9e167a9cf1c9099016c59",
      "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
      "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
      "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
      "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
    ).map(colors_default);
    PuBuGn_default = ramp_default(scheme14);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuBu.js
var scheme15, PuBu_default;
var init_PuBu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuBu.js"() {
    init_colors();
    init_ramp();
    scheme15 = new Array(3).concat(
      "ece7f2a6bddb2b8cbe",
      "f1eef6bdc9e174a9cf0570b0",
      "f1eef6bdc9e174a9cf2b8cbe045a8d",
      "f1eef6d0d1e6a6bddb74a9cf2b8cbe045a8d",
      "f1eef6d0d1e6a6bddb74a9cf3690c00570b0034e7b",
      "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0034e7b",
      "fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858"
    ).map(colors_default);
    PuBu_default = ramp_default(scheme15);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuRd.js
var scheme16, PuRd_default;
var init_PuRd = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/PuRd.js"() {
    init_colors();
    init_ramp();
    scheme16 = new Array(3).concat(
      "e7e1efc994c7dd1c77",
      "f1eef6d7b5d8df65b0ce1256",
      "f1eef6d7b5d8df65b0dd1c77980043",
      "f1eef6d4b9dac994c7df65b0dd1c77980043",
      "f1eef6d4b9dac994c7df65b0e7298ace125691003f",
      "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125691003f",
      "f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f"
    ).map(colors_default);
    PuRd_default = ramp_default(scheme16);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/RdPu.js
var scheme17, RdPu_default;
var init_RdPu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/RdPu.js"() {
    init_colors();
    init_ramp();
    scheme17 = new Array(3).concat(
      "fde0ddfa9fb5c51b8a",
      "feebe2fbb4b9f768a1ae017e",
      "feebe2fbb4b9f768a1c51b8a7a0177",
      "feebe2fcc5c0fa9fb5f768a1c51b8a7a0177",
      "feebe2fcc5c0fa9fb5f768a1dd3497ae017e7a0177",
      "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a0177",
      "fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a"
    ).map(colors_default);
    RdPu_default = ramp_default(scheme17);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlGnBu.js
var scheme18, YlGnBu_default;
var init_YlGnBu = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlGnBu.js"() {
    init_colors();
    init_ramp();
    scheme18 = new Array(3).concat(
      "edf8b17fcdbb2c7fb8",
      "ffffcca1dab441b6c4225ea8",
      "ffffcca1dab441b6c42c7fb8253494",
      "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
      "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
      "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
      "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
    ).map(colors_default);
    YlGnBu_default = ramp_default(scheme18);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlGn.js
var scheme19, YlGn_default;
var init_YlGn = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlGn.js"() {
    init_colors();
    init_ramp();
    scheme19 = new Array(3).concat(
      "f7fcb9addd8e31a354",
      "ffffccc2e69978c679238443",
      "ffffccc2e69978c67931a354006837",
      "ffffccd9f0a3addd8e78c67931a354006837",
      "ffffccd9f0a3addd8e78c67941ab5d238443005a32",
      "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443005a32",
      "ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529"
    ).map(colors_default);
    YlGn_default = ramp_default(scheme19);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlOrBr.js
var scheme20, YlOrBr_default;
var init_YlOrBr = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlOrBr.js"() {
    init_colors();
    init_ramp();
    scheme20 = new Array(3).concat(
      "fff7bcfec44fd95f0e",
      "ffffd4fed98efe9929cc4c02",
      "ffffd4fed98efe9929d95f0e993404",
      "ffffd4fee391fec44ffe9929d95f0e993404",
      "ffffd4fee391fec44ffe9929ec7014cc4c028c2d04",
      "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c028c2d04",
      "ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506"
    ).map(colors_default);
    YlOrBr_default = ramp_default(scheme20);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlOrRd.js
var scheme21, YlOrRd_default;
var init_YlOrRd = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/YlOrRd.js"() {
    init_colors();
    init_ramp();
    scheme21 = new Array(3).concat(
      "ffeda0feb24cf03b20",
      "ffffb2fecc5cfd8d3ce31a1c",
      "ffffb2fecc5cfd8d3cf03b20bd0026",
      "ffffb2fed976feb24cfd8d3cf03b20bd0026",
      "ffffb2fed976feb24cfd8d3cfc4e2ae31a1cb10026",
      "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cb10026",
      "ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026"
    ).map(colors_default);
    YlOrRd_default = ramp_default(scheme21);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Blues.js
var scheme22, Blues_default;
var init_Blues = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Blues.js"() {
    init_colors();
    init_ramp();
    scheme22 = new Array(3).concat(
      "deebf79ecae13182bd",
      "eff3ffbdd7e76baed62171b5",
      "eff3ffbdd7e76baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed63182bd08519c",
      "eff3ffc6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594",
      "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b"
    ).map(colors_default);
    Blues_default = ramp_default(scheme22);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Greens.js
var scheme23, Greens_default;
var init_Greens = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Greens.js"() {
    init_colors();
    init_ramp();
    scheme23 = new Array(3).concat(
      "e5f5e0a1d99b31a354",
      "edf8e9bae4b374c476238b45",
      "edf8e9bae4b374c47631a354006d2c",
      "edf8e9c7e9c0a1d99b74c47631a354006d2c",
      "edf8e9c7e9c0a1d99b74c47641ab5d238b45005a32",
      "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45005a32",
      "f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b"
    ).map(colors_default);
    Greens_default = ramp_default(scheme23);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Greys.js
var scheme24, Greys_default;
var init_Greys = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Greys.js"() {
    init_colors();
    init_ramp();
    scheme24 = new Array(3).concat(
      "f0f0f0bdbdbd636363",
      "f7f7f7cccccc969696525252",
      "f7f7f7cccccc969696636363252525",
      "f7f7f7d9d9d9bdbdbd969696636363252525",
      "f7f7f7d9d9d9bdbdbd969696737373525252252525",
      "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525",
      "fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000"
    ).map(colors_default);
    Greys_default = ramp_default(scheme24);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Purples.js
var scheme25, Purples_default;
var init_Purples = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Purples.js"() {
    init_colors();
    init_ramp();
    scheme25 = new Array(3).concat(
      "efedf5bcbddc756bb1",
      "f2f0f7cbc9e29e9ac86a51a3",
      "f2f0f7cbc9e29e9ac8756bb154278f",
      "f2f0f7dadaebbcbddc9e9ac8756bb154278f",
      "f2f0f7dadaebbcbddc9e9ac8807dba6a51a34a1486",
      "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a34a1486",
      "fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d"
    ).map(colors_default);
    Purples_default = ramp_default(scheme25);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Reds.js
var scheme26, Reds_default;
var init_Reds = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Reds.js"() {
    init_colors();
    init_ramp();
    scheme26 = new Array(3).concat(
      "fee0d2fc9272de2d26",
      "fee5d9fcae91fb6a4acb181d",
      "fee5d9fcae91fb6a4ade2d26a50f15",
      "fee5d9fcbba1fc9272fb6a4ade2d26a50f15",
      "fee5d9fcbba1fc9272fb6a4aef3b2ccb181d99000d",
      "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181d99000d",
      "fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d"
    ).map(colors_default);
    Reds_default = ramp_default(scheme26);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Oranges.js
var scheme27, Oranges_default;
var init_Oranges = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-single/Oranges.js"() {
    init_colors();
    init_ramp();
    scheme27 = new Array(3).concat(
      "fee6cefdae6be6550d",
      "feeddefdbe85fd8d3cd94701",
      "feeddefdbe85fd8d3ce6550da63603",
      "feeddefdd0a2fdae6bfd8d3ce6550da63603",
      "feeddefdd0a2fdae6bfd8d3cf16913d948018c2d04",
      "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d948018c2d04",
      "fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704"
    ).map(colors_default);
    Oranges_default = ramp_default(scheme27);
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/cividis.js
var init_cividis = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/cividis.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/cubehelix.js
var cubehelix_default2;
var init_cubehelix3 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/cubehelix.js"() {
    init_src7();
    init_src8();
    cubehelix_default2 = cubehelixLong(cubehelix(300, 0.5, 0), cubehelix(-240, 0.5, 1));
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/rainbow.js
var warm, cool, c;
var init_rainbow = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/rainbow.js"() {
    init_src7();
    init_src8();
    warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
    cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.5, 0.8));
    c = cubehelix();
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/sinebow.js
var c2, pi_1_3, pi_2_3;
var init_sinebow = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/sinebow.js"() {
    init_src7();
    c2 = rgb();
    pi_1_3 = Math.PI / 3;
    pi_2_3 = Math.PI * 2 / 3;
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/turbo.js
var init_turbo = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/turbo.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/viridis.js
function ramp(range2) {
  var n = range2.length;
  return function(t) {
    return range2[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}
var viridis_default, magma, inferno, plasma;
var init_viridis = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/sequential-multi/viridis.js"() {
    init_colors();
    viridis_default = ramp(colors_default("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
    magma = ramp(colors_default("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
    inferno = ramp(colors_default("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
    plasma = ramp(colors_default("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));
  }
});

// node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/index.js
var init_src29 = __esm({
  "node_modules/.aspect_rules_js/d3-scale-chromatic@3.1.0/node_modules/d3-scale-chromatic/src/index.js"() {
    init_category10();
    init_Accent();
    init_Dark2();
    init_observable10();
    init_Paired();
    init_Pastel1();
    init_Pastel2();
    init_Set1();
    init_Set2();
    init_Set3();
    init_Tableau10();
    init_BrBG();
    init_PRGn();
    init_PiYG();
    init_PuOr();
    init_RdBu();
    init_RdGy();
    init_RdYlBu();
    init_RdYlGn();
    init_Spectral();
    init_BuGn();
    init_BuPu();
    init_GnBu();
    init_OrRd();
    init_PuBuGn();
    init_PuBu();
    init_PuRd();
    init_RdPu();
    init_YlGnBu();
    init_YlGn();
    init_YlOrBr();
    init_YlOrRd();
    init_Blues();
    init_Greens();
    init_Greys();
    init_Purples();
    init_Reds();
    init_Oranges();
    init_cividis();
    init_cubehelix3();
    init_rainbow();
    init_sinebow();
    init_turbo();
    init_viridis();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/constant.js
var init_constant12 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/constant.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/math.js
var cos3, sin3, sqrt3, epsilon6, pi5, halfPi4, tau6;
var init_math5 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/math.js"() {
    cos3 = Math.cos;
    sin3 = Math.sin;
    sqrt3 = Math.sqrt;
    epsilon6 = 1e-12;
    pi5 = Math.PI;
    halfPi4 = pi5 / 2;
    tau6 = 2 * pi5;
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/path.js
var init_path5 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/path.js"() {
    init_src13();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/arc.js
var init_arc = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/arc.js"() {
    init_constant12();
    init_math5();
    init_path5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/array.js
var slice4;
var init_array7 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/array.js"() {
    slice4 = Array.prototype.slice;
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/linear.js
function Linear(context) {
  this._context = context;
}
function linear_default(context) {
  return new Linear(context);
}
var init_linear3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/linear.js"() {
    Linear.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
          default:
            this._context.lineTo(x3, y3);
            break;
        }
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/point.js
var init_point = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/point.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/line.js
var init_line2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/line.js"() {
    init_array7();
    init_constant12();
    init_linear3();
    init_path5();
    init_point();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/area.js
var init_area5 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/area.js"() {
    init_array7();
    init_constant12();
    init_linear3();
    init_line2();
    init_path5();
    init_point();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/descending.js
var init_descending2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/descending.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/identity.js
var init_identity7 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/identity.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/pie.js
var init_pie = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/pie.js"() {
    init_array7();
    init_constant12();
    init_descending2();
    init_identity7();
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/radial.js
function Radial(curve) {
  this._curve = curve;
}
function curveRadial(curve) {
  function radial2(context) {
    return new Radial(curve(context));
  }
  radial2._curve = curve;
  return radial2;
}
var curveRadialLinear;
var init_radial3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/radial.js"() {
    init_linear3();
    curveRadialLinear = curveRadial(linear_default);
    Radial.prototype = {
      areaStart: function() {
        this._curve.areaStart();
      },
      areaEnd: function() {
        this._curve.areaEnd();
      },
      lineStart: function() {
        this._curve.lineStart();
      },
      lineEnd: function() {
        this._curve.lineEnd();
      },
      point: function(a2, r) {
        this._curve.point(r * Math.sin(a2), r * -Math.cos(a2));
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/lineRadial.js
var init_lineRadial = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/lineRadial.js"() {
    init_radial3();
    init_line2();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/areaRadial.js
var init_areaRadial = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/areaRadial.js"() {
    init_radial3();
    init_area5();
    init_lineRadial();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/pointRadial.js
var init_pointRadial = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/pointRadial.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/bump.js
var init_bump = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/bump.js"() {
    init_pointRadial();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/link.js
var init_link2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/link.js"() {
    init_array7();
    init_constant12();
    init_bump();
    init_path5();
    init_point();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/asterisk.js
var sqrt32;
var init_asterisk = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/asterisk.js"() {
    init_math5();
    sqrt32 = sqrt3(3);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/circle.js
var init_circle4 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/circle.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/cross.js
var init_cross3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/cross.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/diamond.js
var tan30, tan30_2;
var init_diamond = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/diamond.js"() {
    init_math5();
    tan30 = sqrt3(1 / 3);
    tan30_2 = tan30 * 2;
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/diamond2.js
var init_diamond2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/diamond2.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/plus.js
var init_plus = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/plus.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/square.js
var init_square = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/square.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/square2.js
var init_square2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/square2.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/star.js
var kr, kx, ky;
var init_star = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/star.js"() {
    init_math5();
    kr = sin3(pi5 / 10) / sin3(7 * pi5 / 10);
    kx = sin3(tau6 / 10) * kr;
    ky = -cos3(tau6 / 10) * kr;
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/triangle.js
var sqrt33;
var init_triangle = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/triangle.js"() {
    init_math5();
    sqrt33 = sqrt3(3);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/triangle2.js
var sqrt34;
var init_triangle2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/triangle2.js"() {
    init_math5();
    sqrt34 = sqrt3(3);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/wye.js
var s, k, a;
var init_wye = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/wye.js"() {
    init_math5();
    s = sqrt3(3) / 2;
    k = 1 / sqrt3(12);
    a = (k / 2 + 1) * 3;
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/times.js
var init_times = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol/times.js"() {
    init_math5();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol.js
var init_symbol = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/symbol.js"() {
    init_constant12();
    init_path5();
    init_asterisk();
    init_circle4();
    init_cross3();
    init_diamond();
    init_diamond2();
    init_plus();
    init_square();
    init_square2();
    init_star();
    init_triangle();
    init_triangle2();
    init_wye();
    init_times();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/noop.js
function noop_default2() {
}
var init_noop3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/noop.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basis.js
function point2(that, x3, y3) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x3) / 6,
    (that._y0 + 4 * that._y1 + y3) / 6
  );
}
function Basis(context) {
  this._context = context;
}
var init_basis2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basis.js"() {
    Basis.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._y0 = this._y1 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 3:
            point2(this, this._x1, this._y1);
          case 2:
            this._context.lineTo(this._x1, this._y1);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6);
          default:
            point2(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = x3;
        this._y0 = this._y1, this._y1 = y3;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basisClosed.js
function BasisClosed(context) {
  this._context = context;
}
var init_basisClosed2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basisClosed.js"() {
    init_noop3();
    init_basis2();
    BasisClosed.prototype = {
      areaStart: noop_default2,
      areaEnd: noop_default2,
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 1: {
            this._context.moveTo(this._x2, this._y2);
            this._context.closePath();
            break;
          }
          case 2: {
            this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
            this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
            this._context.closePath();
            break;
          }
          case 3: {
            this.point(this._x2, this._y2);
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            break;
          }
        }
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._x2 = x3, this._y2 = y3;
            break;
          case 1:
            this._point = 2;
            this._x3 = x3, this._y3 = y3;
            break;
          case 2:
            this._point = 3;
            this._x4 = x3, this._y4 = y3;
            this._context.moveTo((this._x0 + 4 * this._x1 + x3) / 6, (this._y0 + 4 * this._y1 + y3) / 6);
            break;
          default:
            point2(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = x3;
        this._y0 = this._y1, this._y1 = y3;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basisOpen.js
function BasisOpen(context) {
  this._context = context;
}
var init_basisOpen = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/basisOpen.js"() {
    init_basis2();
    BasisOpen.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._y0 = this._y1 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || this._line !== 0 && this._point === 3)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            var x02 = (this._x0 + 4 * this._x1 + x3) / 6, y0 = (this._y0 + 4 * this._y1 + y3) / 6;
            this._line ? this._context.lineTo(x02, y0) : this._context.moveTo(x02, y0);
            break;
          case 3:
            this._point = 4;
          default:
            point2(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = x3;
        this._y0 = this._y1, this._y1 = y3;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/bundle.js
function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}
var bundle_default;
var init_bundle = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/bundle.js"() {
    init_basis2();
    Bundle.prototype = {
      lineStart: function() {
        this._x = [];
        this._y = [];
        this._basis.lineStart();
      },
      lineEnd: function() {
        var x3 = this._x, y3 = this._y, j = x3.length - 1;
        if (j > 0) {
          var x02 = x3[0], y0 = y3[0], dx = x3[j] - x02, dy = y3[j] - y0, i = -1, t;
          while (++i <= j) {
            t = i / j;
            this._basis.point(
              this._beta * x3[i] + (1 - this._beta) * (x02 + t * dx),
              this._beta * y3[i] + (1 - this._beta) * (y0 + t * dy)
            );
          }
        }
        this._x = this._y = null;
        this._basis.lineEnd();
      },
      point: function(x3, y3) {
        this._x.push(+x3);
        this._y.push(+y3);
      }
    };
    bundle_default = function custom12(beta) {
      function bundle(context) {
        return beta === 1 ? new Basis(context) : new Bundle(context, beta);
      }
      bundle.beta = function(beta2) {
        return custom12(+beta2);
      };
      return bundle;
    }(0.85);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinal.js
function point3(that, x3, y3) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x3),
    that._y2 + that._k * (that._y1 - y3),
    that._x2,
    that._y2
  );
}
function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
var cardinal_default;
var init_cardinal = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinal.js"() {
    Cardinal.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x2, this._y2);
            break;
          case 3:
            point3(this, this._x1, this._y1);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
            this._x1 = x3, this._y1 = y3;
            break;
          case 2:
            this._point = 3;
          default:
            point3(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    cardinal_default = function custom13(tension) {
      function cardinal(context) {
        return new Cardinal(context, tension);
      }
      cardinal.tension = function(tension2) {
        return custom13(+tension2);
      };
      return cardinal;
    }(0);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinalClosed.js
function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
var cardinalClosed_default;
var init_cardinalClosed = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinalClosed.js"() {
    init_noop3();
    init_cardinal();
    CardinalClosed.prototype = {
      areaStart: noop_default2,
      areaEnd: noop_default2,
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 1: {
            this._context.moveTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
          case 2: {
            this._context.lineTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
          case 3: {
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            this.point(this._x5, this._y5);
            break;
          }
        }
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._x3 = x3, this._y3 = y3;
            break;
          case 1:
            this._point = 2;
            this._context.moveTo(this._x4 = x3, this._y4 = y3);
            break;
          case 2:
            this._point = 3;
            this._x5 = x3, this._y5 = y3;
            break;
          default:
            point3(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    cardinalClosed_default = function custom14(tension) {
      function cardinal(context) {
        return new CardinalClosed(context, tension);
      }
      cardinal.tension = function(tension2) {
        return custom14(+tension2);
      };
      return cardinal;
    }(0);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinalOpen.js
function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}
var cardinalOpen_default;
var init_cardinalOpen = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/cardinalOpen.js"() {
    init_cardinal();
    CardinalOpen.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        if (this._line || this._line !== 0 && this._point === 3)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
            break;
          case 3:
            this._point = 4;
          default:
            point3(this, x3, y3);
            break;
        }
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    cardinalOpen_default = function custom15(tension) {
      function cardinal(context) {
        return new CardinalOpen(context, tension);
      }
      cardinal.tension = function(tension2) {
        return custom15(+tension2);
      };
      return cardinal;
    }(0);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRom.js
function point4(that, x3, y3) {
  var x12 = that._x1, y1 = that._y1, x22 = that._x2, y22 = that._y2;
  if (that._l01_a > epsilon6) {
    var a2 = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a, n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x12 = (x12 * a2 - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a2 - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }
  if (that._l23_a > epsilon6) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a, m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x22 = (x22 * b + that._x1 * that._l23_2a - x3 * that._l12_2a) / m;
    y22 = (y22 * b + that._y1 * that._l23_2a - y3 * that._l12_2a) / m;
  }
  that._context.bezierCurveTo(x12, y1, x22, y22, that._x2, that._y2);
}
function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
var catmullRom_default;
var init_catmullRom = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRom.js"() {
    init_math5();
    init_cardinal();
    CatmullRom.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x2, this._y2);
            break;
          case 3:
            this.point(this._x2, this._y2);
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        if (this._point) {
          var x23 = this._x2 - x3, y23 = this._y2 - y3;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
          default:
            point4(this, x3, y3);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    catmullRom_default = function custom16(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
      }
      catmullRom.alpha = function(alpha2) {
        return custom16(+alpha2);
      };
      return catmullRom;
    }(0.5);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRomClosed.js
function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
var catmullRomClosed_default;
var init_catmullRomClosed = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRomClosed.js"() {
    init_cardinalClosed();
    init_noop3();
    init_catmullRom();
    CatmullRomClosed.prototype = {
      areaStart: noop_default2,
      areaEnd: noop_default2,
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 1: {
            this._context.moveTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
          case 2: {
            this._context.lineTo(this._x3, this._y3);
            this._context.closePath();
            break;
          }
          case 3: {
            this.point(this._x3, this._y3);
            this.point(this._x4, this._y4);
            this.point(this._x5, this._y5);
            break;
          }
        }
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        if (this._point) {
          var x23 = this._x2 - x3, y23 = this._y2 - y3;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            this._x3 = x3, this._y3 = y3;
            break;
          case 1:
            this._point = 2;
            this._context.moveTo(this._x4 = x3, this._y4 = y3);
            break;
          case 2:
            this._point = 3;
            this._x5 = x3, this._y5 = y3;
            break;
          default:
            point4(this, x3, y3);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    catmullRomClosed_default = function custom17(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
      }
      catmullRom.alpha = function(alpha2) {
        return custom17(+alpha2);
      };
      return catmullRom;
    }(0.5);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRomOpen.js
function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}
var catmullRomOpen_default;
var init_catmullRomOpen = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/catmullRomOpen.js"() {
    init_cardinalOpen();
    init_catmullRom();
    CatmullRomOpen.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
        this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
      },
      lineEnd: function() {
        if (this._line || this._line !== 0 && this._point === 3)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        if (this._point) {
          var x23 = this._x2 - x3, y23 = this._y2 - y3;
          this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
        }
        switch (this._point) {
          case 0:
            this._point = 1;
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);
            break;
          case 3:
            this._point = 4;
          default:
            point4(this, x3, y3);
            break;
        }
        this._l01_a = this._l12_a, this._l12_a = this._l23_a;
        this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
        this._x0 = this._x1, this._x1 = this._x2, this._x2 = x3;
        this._y0 = this._y1, this._y1 = this._y2, this._y2 = y3;
      }
    };
    catmullRomOpen_default = function custom18(alpha) {
      function catmullRom(context) {
        return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
      }
      catmullRom.alpha = function(alpha2) {
        return custom18(+alpha2);
      };
      return catmullRom;
    }(0.5);
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/linearClosed.js
function LinearClosed(context) {
  this._context = context;
}
var init_linearClosed = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/linearClosed.js"() {
    init_noop3();
    LinearClosed.prototype = {
      areaStart: noop_default2,
      areaEnd: noop_default2,
      lineStart: function() {
        this._point = 0;
      },
      lineEnd: function() {
        if (this._point)
          this._context.closePath();
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        if (this._point)
          this._context.lineTo(x3, y3);
        else
          this._point = 1, this._context.moveTo(x3, y3);
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/monotone.js
function sign2(x3) {
  return x3 < 0 ? -1 : 1;
}
function slope3(that, x22, y22) {
  var h0 = that._x1 - that._x0, h1 = x22 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y22 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign2(s0) + sign2(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}
function point5(that, t03, t13) {
  var x02 = that._x0, y0 = that._y0, x12 = that._x1, y1 = that._y1, dx = (x12 - x02) / 3;
  that._context.bezierCurveTo(x02 + dx, y0 + dx * t03, x12 - dx, y1 - dx * t13, x12, y1);
}
function MonotoneX(context) {
  this._context = context;
}
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
function ReflectContext(context) {
  this._context = context;
}
var init_monotone = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/monotone.js"() {
    MonotoneX.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        switch (this._point) {
          case 2:
            this._context.lineTo(this._x1, this._y1);
            break;
          case 3:
            point5(this, this._t0, slope2(this, this._t0));
            break;
        }
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        var t13 = NaN;
        x3 = +x3, y3 = +y3;
        if (x3 === this._x1 && y3 === this._y1)
          return;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
            break;
          case 2:
            this._point = 3;
            point5(this, slope2(this, t13 = slope3(this, x3, y3)), t13);
            break;
          default:
            point5(this, this._t0, t13 = slope3(this, x3, y3));
            break;
        }
        this._x0 = this._x1, this._x1 = x3;
        this._y0 = this._y1, this._y1 = y3;
        this._t0 = t13;
      }
    };
    (MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x3, y3) {
      MonotoneX.prototype.point.call(this, y3, x3);
    };
    ReflectContext.prototype = {
      moveTo: function(x3, y3) {
        this._context.moveTo(y3, x3);
      },
      closePath: function() {
        this._context.closePath();
      },
      lineTo: function(x3, y3) {
        this._context.lineTo(y3, x3);
      },
      bezierCurveTo: function(x12, y1, x22, y22, x3, y3) {
        this._context.bezierCurveTo(y1, x12, y22, x22, y3, x3);
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/natural.js
function Natural(context) {
  this._context = context;
}
function controlPoints(x3) {
  var i, n = x3.length - 1, m, a2 = new Array(n), b = new Array(n), r = new Array(n);
  a2[0] = 0, b[0] = 2, r[0] = x3[0] + 2 * x3[1];
  for (i = 1; i < n - 1; ++i)
    a2[i] = 1, b[i] = 4, r[i] = 4 * x3[i] + 2 * x3[i + 1];
  a2[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x3[n - 1] + x3[n];
  for (i = 1; i < n; ++i)
    m = a2[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a2[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i)
    a2[i] = (r[i] - a2[i + 1]) / b[i];
  b[n - 1] = (x3[n] + a2[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i)
    b[i] = 2 * x3[i + 1] - a2[i + 1];
  return [a2, b];
}
var init_natural = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/natural.js"() {
    Natural.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x = [];
        this._y = [];
      },
      lineEnd: function() {
        var x3 = this._x, y3 = this._y, n = x3.length;
        if (n) {
          this._line ? this._context.lineTo(x3[0], y3[0]) : this._context.moveTo(x3[0], y3[0]);
          if (n === 2) {
            this._context.lineTo(x3[1], y3[1]);
          } else {
            var px = controlPoints(x3), py = controlPoints(y3);
            for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
              this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x3[i1], y3[i1]);
            }
          }
        }
        if (this._line || this._line !== 0 && n === 1)
          this._context.closePath();
        this._line = 1 - this._line;
        this._x = this._y = null;
      },
      point: function(x3, y3) {
        this._x.push(+x3);
        this._y.push(+y3);
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/step.js
function Step(context, t) {
  this._context = context;
  this._t = t;
}
var init_step = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/curve/step.js"() {
    Step.prototype = {
      areaStart: function() {
        this._line = 0;
      },
      areaEnd: function() {
        this._line = NaN;
      },
      lineStart: function() {
        this._x = this._y = NaN;
        this._point = 0;
      },
      lineEnd: function() {
        if (0 < this._t && this._t < 1 && this._point === 2)
          this._context.lineTo(this._x, this._y);
        if (this._line || this._line !== 0 && this._point === 1)
          this._context.closePath();
        if (this._line >= 0)
          this._t = 1 - this._t, this._line = 1 - this._line;
      },
      point: function(x3, y3) {
        x3 = +x3, y3 = +y3;
        switch (this._point) {
          case 0:
            this._point = 1;
            this._line ? this._context.lineTo(x3, y3) : this._context.moveTo(x3, y3);
            break;
          case 1:
            this._point = 2;
          default: {
            if (this._t <= 0) {
              this._context.lineTo(this._x, y3);
              this._context.lineTo(x3, y3);
            } else {
              var x12 = this._x * (1 - this._t) + x3 * this._t;
              this._context.lineTo(x12, this._y);
              this._context.lineTo(x12, y3);
            }
            break;
          }
        }
        this._x = x3, this._y = y3;
      }
    };
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/none.js
var init_none = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/none.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/none.js
var init_none2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/none.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/stack.js
var init_stack = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/stack.js"() {
    init_array7();
    init_constant12();
    init_none();
    init_none2();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/expand.js
var init_expand = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/expand.js"() {
    init_none();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/diverging.js
var init_diverging2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/diverging.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/silhouette.js
var init_silhouette = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/silhouette.js"() {
    init_none();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/wiggle.js
var init_wiggle = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/offset/wiggle.js"() {
    init_none();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/appearance.js
var init_appearance = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/appearance.js"() {
    init_none2();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/ascending.js
var init_ascending3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/ascending.js"() {
    init_none2();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/descending.js
var init_descending3 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/descending.js"() {
    init_ascending3();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/insideOut.js
var init_insideOut = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/insideOut.js"() {
    init_appearance();
    init_ascending3();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/reverse.js
var init_reverse2 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/order/reverse.js"() {
    init_none2();
  }
});

// node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/index.js
var init_src30 = __esm({
  "node_modules/.aspect_rules_js/d3-shape@3.2.0/node_modules/d3-shape/src/index.js"() {
    init_arc();
    init_area5();
    init_line2();
    init_pie();
    init_areaRadial();
    init_lineRadial();
    init_pointRadial();
    init_link2();
    init_symbol();
    init_asterisk();
    init_circle4();
    init_cross3();
    init_diamond();
    init_diamond2();
    init_plus();
    init_square();
    init_square2();
    init_star();
    init_triangle();
    init_triangle2();
    init_wye();
    init_times();
    init_basisClosed2();
    init_basisOpen();
    init_basis2();
    init_bump();
    init_bundle();
    init_cardinalClosed();
    init_cardinalOpen();
    init_cardinal();
    init_catmullRomClosed();
    init_catmullRomOpen();
    init_catmullRom();
    init_linearClosed();
    init_linear3();
    init_monotone();
    init_natural();
    init_step();
    init_stack();
    init_expand();
    init_diverging2();
    init_none();
    init_silhouette();
    init_wiggle();
    init_appearance();
    init_ascending3();
    init_descending3();
    init_insideOut();
    init_none2();
    init_reverse2();
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/constant.js
var constant_default11;
var init_constant13 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/constant.js"() {
    constant_default11 = (x3) => () => x3;
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/event.js
function ZoomEvent(type2, {
  sourceEvent,
  target,
  transform: transform2,
  dispatch: dispatch2
}) {
  Object.defineProperties(this, {
    type: { value: type2, enumerable: true, configurable: true },
    sourceEvent: { value: sourceEvent, enumerable: true, configurable: true },
    target: { value: target, enumerable: true, configurable: true },
    transform: { value: transform2, enumerable: true, configurable: true },
    _: { value: dispatch2 }
  });
}
var init_event3 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/event.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js
function Transform(k2, x3, y3) {
  this.k = k2;
  this.x = x3;
  this.y = y3;
}
function transform(node) {
  while (!node.__zoom)
    if (!(node = node.parentNode))
      return identity5;
  return node.__zoom;
}
var identity5;
var init_transform3 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/transform.js"() {
    Transform.prototype = {
      constructor: Transform,
      scale: function(k2) {
        return k2 === 1 ? this : new Transform(this.k * k2, this.x, this.y);
      },
      translate: function(x3, y3) {
        return x3 === 0 & y3 === 0 ? this : new Transform(this.k, this.x + this.k * x3, this.y + this.k * y3);
      },
      apply: function(point6) {
        return [point6[0] * this.k + this.x, point6[1] * this.k + this.y];
      },
      applyX: function(x3) {
        return x3 * this.k + this.x;
      },
      applyY: function(y3) {
        return y3 * this.k + this.y;
      },
      invert: function(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
      },
      invertX: function(x3) {
        return (x3 - this.x) / this.k;
      },
      invertY: function(y3) {
        return (y3 - this.y) / this.k;
      },
      rescaleX: function(x3) {
        return x3.copy().domain(x3.range().map(this.invertX, this).map(x3.invert, x3));
      },
      rescaleY: function(y3) {
        return y3.copy().domain(y3.range().map(this.invertY, this).map(y3.invert, y3));
      },
      toString: function() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
      }
    };
    identity5 = new Transform(1, 0, 0);
    transform.prototype = Transform.prototype;
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/noevent.js
function nopropagation3(event) {
  event.stopImmediatePropagation();
}
function noevent_default3(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
var init_noevent3 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/noevent.js"() {
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/zoom.js
function defaultFilter(event) {
  return (!event.ctrlKey || event.type === "wheel") && !event.button;
}
function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}
function defaultTransform() {
  return this.__zoom || identity5;
}
function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 2e-3) * (event.ctrlKey ? 10 : 1);
}
function defaultTouchable() {
  return navigator.maxTouchPoints || "ontouchstart" in this;
}
function defaultConstrain(transform2, extent2, translateExtent) {
  var dx0 = transform2.invertX(extent2[0][0]) - translateExtent[0][0], dx1 = transform2.invertX(extent2[1][0]) - translateExtent[1][0], dy0 = transform2.invertY(extent2[0][1]) - translateExtent[0][1], dy1 = transform2.invertY(extent2[1][1]) - translateExtent[1][1];
  return transform2.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}
function zoom_default2() {
  var filter3 = defaultFilter, extent2 = defaultExtent, constrain = defaultConstrain, wheelDelta = defaultWheelDelta, touchable = defaultTouchable, scaleExtent = [0, Infinity], translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]], duration = 250, interpolate = zoom_default, listeners = dispatch_default("start", "zoom", "end"), touchstarting, touchfirst, touchending, touchDelay = 500, wheelDelay = 150, clickDistance2 = 0, tapDistance = 10;
  function zoom(selection2) {
    selection2.property("__zoom", defaultTransform).on("wheel.zoom", wheeled, { passive: false }).on("mousedown.zoom", mousedowned).on("dblclick.zoom", dblclicked).filter(touchable).on("touchstart.zoom", touchstarted).on("touchmove.zoom", touchmoved).on("touchend.zoom touchcancel.zoom", touchended).style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }
  zoom.transform = function(collection, transform2, point6, event) {
    var selection2 = collection.selection ? collection.selection() : collection;
    selection2.property("__zoom", defaultTransform);
    if (collection !== selection2) {
      schedule(collection, transform2, point6, event);
    } else {
      selection2.interrupt().each(function() {
        gesture(this, arguments).event(event).start().zoom(null, typeof transform2 === "function" ? transform2.apply(this, arguments) : transform2).end();
      });
    }
  };
  zoom.scaleBy = function(selection2, k2, p, event) {
    zoom.scaleTo(selection2, function() {
      var k0 = this.__zoom.k, k1 = typeof k2 === "function" ? k2.apply(this, arguments) : k2;
      return k0 * k1;
    }, p, event);
  };
  zoom.scaleTo = function(selection2, k2, p, event) {
    zoom.transform(selection2, function() {
      var e = extent2.apply(this, arguments), t03 = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p, p1 = t03.invert(p0), k1 = typeof k2 === "function" ? k2.apply(this, arguments) : k2;
      return constrain(translate(scale2(t03, k1), p0, p1), e, translateExtent);
    }, p, event);
  };
  zoom.translateBy = function(selection2, x3, y3, event) {
    zoom.transform(selection2, function() {
      return constrain(this.__zoom.translate(
        typeof x3 === "function" ? x3.apply(this, arguments) : x3,
        typeof y3 === "function" ? y3.apply(this, arguments) : y3
      ), extent2.apply(this, arguments), translateExtent);
    }, null, event);
  };
  zoom.translateTo = function(selection2, x3, y3, p, event) {
    zoom.transform(selection2, function() {
      var e = extent2.apply(this, arguments), t = this.__zoom, p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity5.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x3 === "function" ? -x3.apply(this, arguments) : -x3,
        typeof y3 === "function" ? -y3.apply(this, arguments) : -y3
      ), e, translateExtent);
    }, p, event);
  };
  function scale2(transform2, k2) {
    k2 = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k2));
    return k2 === transform2.k ? transform2 : new Transform(k2, transform2.x, transform2.y);
  }
  function translate(transform2, p0, p1) {
    var x3 = p0[0] - p1[0] * transform2.k, y3 = p0[1] - p1[1] * transform2.k;
    return x3 === transform2.x && y3 === transform2.y ? transform2 : new Transform(transform2.k, x3, y3);
  }
  function centroid(extent3) {
    return [(+extent3[0][0] + +extent3[1][0]) / 2, (+extent3[0][1] + +extent3[1][1]) / 2];
  }
  function schedule(transition2, transform2, point6, event) {
    transition2.on("start.zoom", function() {
      gesture(this, arguments).event(event).start();
    }).on("interrupt.zoom end.zoom", function() {
      gesture(this, arguments).event(event).end();
    }).tween("zoom", function() {
      var that = this, args = arguments, g = gesture(that, args).event(event), e = extent2.apply(that, args), p = point6 == null ? centroid(e) : typeof point6 === "function" ? point6.apply(that, args) : point6, w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]), a2 = that.__zoom, b = typeof transform2 === "function" ? transform2.apply(that, args) : transform2, i = interpolate(a2.invert(p).concat(w / a2.k), b.invert(p).concat(w / b.k));
      return function(t) {
        if (t === 1)
          t = b;
        else {
          var l = i(t), k2 = w / l[2];
          t = new Transform(k2, p[0] - l[0] * k2, p[1] - l[1] * k2);
        }
        g.zoom(null, t);
      };
    });
  }
  function gesture(that, args, clean) {
    return !clean && that.__zooming || new Gesture(that, args);
  }
  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent2.apply(that, args);
    this.taps = 0;
  }
  Gesture.prototype = {
    event: function(event) {
      if (event)
        this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform2) {
      if (this.mouse && key !== "mouse")
        this.mouse[1] = transform2.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch")
        this.touch0[1] = transform2.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch")
        this.touch1[1] = transform2.invert(this.touch1[0]);
      this.that.__zoom = transform2;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type2) {
      var d = select_default2(this.that).datum();
      listeners.call(
        type2,
        this.that,
        new ZoomEvent(type2, {
          sourceEvent: this.sourceEvent,
          target: zoom,
          type: type2,
          transform: this.that.__zoom,
          dispatch: listeners
        }),
        d
      );
    }
  };
  function wheeled(event, ...args) {
    if (!filter3.apply(this, arguments))
      return;
    var g = gesture(this, args).event(event), t = this.__zoom, k2 = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))), p = pointer_default(event);
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    } else if (t.k === k2)
      return;
    else {
      g.mouse = [p, t.invert(p)];
      interrupt_default(this);
      g.start();
    }
    noevent_default3(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale2(t, k2), g.mouse[0], g.mouse[1]), g.extent, translateExtent));
    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }
  function mousedowned(event, ...args) {
    if (touchending || !filter3.apply(this, arguments))
      return;
    var currentTarget = event.currentTarget, g = gesture(this, args, true).event(event), v2 = select_default2(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true), p = pointer_default(event, currentTarget), x02 = event.clientX, y0 = event.clientY;
    nodrag_default(event.view);
    nopropagation3(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt_default(this);
    g.start();
    function mousemoved(event2) {
      noevent_default3(event2);
      if (!g.moved) {
        var dx = event2.clientX - x02, dy = event2.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event2).zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer_default(event2, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }
    function mouseupped(event2) {
      v2.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event2.view, g.moved);
      noevent_default3(event2);
      g.event(event2).end();
    }
  }
  function dblclicked(event, ...args) {
    if (!filter3.apply(this, arguments))
      return;
    var t03 = this.__zoom, p0 = pointer_default(event.changedTouches ? event.changedTouches[0] : event, this), p1 = t03.invert(p0), k1 = t03.k * (event.shiftKey ? 0.5 : 2), t13 = constrain(translate(scale2(t03, k1), p0, p1), extent2.apply(this, args), translateExtent);
    noevent_default3(event);
    if (duration > 0)
      select_default2(this).transition().duration(duration).call(schedule, t13, p0, event);
    else
      select_default2(this).call(zoom.transform, t13, p0, event);
  }
  function touchstarted(event, ...args) {
    if (!filter3.apply(this, arguments))
      return;
    var touches = event.touches, n = touches.length, g = gesture(this, args, event.changedTouches.length === n).event(event), started, i, t, p;
    nopropagation3(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0)
        g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2])
        g.touch1 = p, g.taps = 0;
    }
    if (touchstarting)
      touchstarting = clearTimeout(touchstarting);
    if (started) {
      if (g.taps < 2)
        touchfirst = p[0], touchstarting = setTimeout(function() {
          touchstarting = null;
        }, touchDelay);
      interrupt_default(this);
      g.start();
    }
  }
  function touchmoved(event, ...args) {
    if (!this.__zooming)
      return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t, p, l;
    noevent_default3(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer_default(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier)
        g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier)
        g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1], p1 = g.touch1[0], l1 = g.touch1[1], dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp, dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale2(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    } else if (g.touch0)
      p = g.touch0[0], l = g.touch0[1];
    else
      return;
    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }
  function touchended(event, ...args) {
    if (!this.__zooming)
      return;
    var g = gesture(this, args).event(event), touches = event.changedTouches, n = touches.length, i, t;
    nopropagation3(event);
    if (touchending)
      clearTimeout(touchending);
    touchending = setTimeout(function() {
      touchending = null;
    }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier)
        delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier)
        delete g.touch1;
    }
    if (g.touch1 && !g.touch0)
      g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0)
      g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      if (g.taps === 2) {
        t = pointer_default(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select_default2(this).on("dblclick.zoom");
          if (p)
            p.apply(this, arguments);
        }
      }
    }
  }
  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant_default11(+_), zoom) : wheelDelta;
  };
  zoom.filter = function(_) {
    return arguments.length ? (filter3 = typeof _ === "function" ? _ : constant_default11(!!_), zoom) : filter3;
  };
  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant_default11(!!_), zoom) : touchable;
  };
  zoom.extent = function(_) {
    return arguments.length ? (extent2 = typeof _ === "function" ? _ : constant_default11([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent2;
  };
  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };
  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };
  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };
  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };
  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };
  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };
  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };
  zoom.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
  };
  return zoom;
}
var init_zoom2 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/zoom.js"() {
    init_src4();
    init_src6();
    init_src8();
    init_src5();
    init_src11();
    init_constant13();
    init_event3();
    init_transform3();
    init_noevent3();
  }
});

// node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/index.js
var init_src31 = __esm({
  "node_modules/.aspect_rules_js/d3-zoom@3.0.0/node_modules/d3-zoom/src/index.js"() {
    init_zoom2();
    init_transform3();
  }
});

// node_modules/.aspect_rules_js/d3@7.9.0/node_modules/d3/src/index.js
var init_src32 = __esm({
  "node_modules/.aspect_rules_js/d3@7.9.0/node_modules/d3/src/index.js"() {
    init_src2();
    init_src3();
    init_src12();
    init_src14();
    init_src7();
    init_src15();
    init_src16();
    init_src4();
    init_src6();
    init_src17();
    init_src10();
    init_src18();
    init_src20();
    init_src21();
    init_src22();
    init_src23();
    init_src8();
    init_src13();
    init_src24();
    init_src19();
    init_src25();
    init_src28();
    init_src29();
    init_src5();
    init_src30();
    init_src26();
    init_src27();
    init_src9();
    init_src11();
    init_src31();
  }
});

// web/src/model/generator.js
function hexToPixel(q, r) {
  const x3 = HEX_SIZE * (1.5 * q);
  const y3 = HEX_SIZE * (Math.sqrt(3) * r + Math.sqrt(3) / 2 * q);
  return { x: x3, y: y3 };
}
function hexCorners(center) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = Math.PI / 180 * angleDeg;
    corners.push([
      center.x + HEX_SIZE * Math.cos(angleRad),
      center.y + HEX_SIZE * Math.sin(angleRad)
    ]);
  }
  return corners;
}
function mapBounds(precincts) {
  const pad3 = HEX_SIZE * 1.2;
  const xs = precincts.map((p) => p.center.x);
  const ys = precincts.map((p) => p.center.y);
  const minX = Math.min(...xs) - pad3;
  const maxX = Math.max(...xs) + pad3;
  const minY = Math.min(...ys) - pad3;
  const maxY = Math.max(...ys) + pad3;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}
var HEX_SIZE, HEX_DIRECTIONS;
var init_generator = __esm({
  "web/src/model/generator.js"() {
    HEX_SIZE = 36;
    HEX_DIRECTIONS = [
      [1, 0],
      // edge 0: lower-right
      [0, 1],
      // edge 1: down
      [-1, 1],
      // edge 2: lower-left
      [-1, 0],
      // edge 3: upper-left
      [0, -1],
      // edge 4: up
      [1, -1]
      // edge 5: upper-right
    ];
  }
});

// web/src/model/types.js
var DISTRICT_COLORS, PARTY_COLORS, PARTY_LABELS;
var init_types = __esm({
  "web/src/model/types.js"() {
    DISTRICT_COLORS = [
      "#4e79a7",
      "#f28e2b",
      "#e15759",
      "#76b7b2",
      "#59a14f"
    ];
    PARTY_COLORS = {
      R: "#e94560",
      D: "#3a7bd5",
      L: "#f0c040",
      G: "#50c878",
      I: "#a0a0a0"
    };
    PARTY_LABELS = {
      R: "Red Party",
      D: "Blue Party",
      L: "Libertarian",
      G: "Green",
      I: "Independent"
    };
  }
});

// web/src/simulation/validity.js
function computeValidityStats(precincts, assignments, districtCount, rules) {
  var _a, _b;
  const totalPopulation = precincts.reduce((s2, p) => s2 + p.population, 0);
  const idealPopulation = districtCount > 0 ? totalPopulation / districtCount : 0;
  const tolerance = rules.population_tolerance;
  let unassignedCount = 0;
  for (const v2 of assignments.values()) {
    if (v2 === null)
      unassignedCount++;
  }
  const popByDistrict = /* @__PURE__ */ new Map();
  for (let d = 1; d <= districtCount; d++)
    popByDistrict.set(d, 0);
  for (const [precinctId, distId] of assignments) {
    if (distId !== null) {
      const pc = precincts[precinctId];
      if (pc !== void 0) {
        popByDistrict.set(distId, ((_a = popByDistrict.get(distId)) != null ? _a : 0) + pc.population);
      }
    }
  }
  const districtPop = [];
  for (let d = 1; d <= districtCount; d++) {
    const pop = (_b = popByDistrict.get(d)) != null ? _b : 0;
    const deviationPct = idealPopulation > 0 ? (pop - idealPopulation) / idealPopulation * 100 : 0;
    let status = "ok";
    if (deviationPct > tolerance * 100)
      status = "over";
    else if (deviationPct < -(tolerance * 100))
      status = "under";
    districtPop.push({ districtId: d, population: pop, deviationPct, status });
  }
  let contiguity = null;
  if (rules.contiguity !== "allowed") {
    contiguity = /* @__PURE__ */ new Map();
    for (let d = 1; d <= districtCount; d++) {
      contiguity.set(d, isContiguous(precincts, assignments, d));
    }
  }
  return { idealPopulation, totalPopulation, unassignedCount, districtPop, contiguity };
}
function isContiguous(precincts, assignments, districtId) {
  const inDistrict = [];
  for (const [pid, did] of assignments) {
    if (did === districtId)
      inDistrict.push(pid);
  }
  if (inDistrict.length <= 1)
    return true;
  const inSet = new Set(inDistrict);
  const visited = /* @__PURE__ */ new Set();
  const queue = [inDistrict[0]];
  visited.add(inDistrict[0]);
  while (queue.length > 0) {
    const curr = queue.shift();
    const p = precincts[curr];
    if (p === void 0)
      continue;
    for (const nbId of p.neighbors) {
      if (nbId !== null && inSet.has(nbId) && !visited.has(nbId)) {
        visited.add(nbId);
        queue.push(nbId);
      }
    }
  }
  return visited.size === inSet.size;
}
var init_validity = __esm({
  "web/src/simulation/validity.js"() {
  }
});

// web/src/render/mapRenderer.ts
function hexPolygonPath(p) {
  const corners = hexCorners(p.center);
  return `M${corners.map((c3) => c3.join(",")).join("L")}Z`;
}
function computeBoundarySegments(precincts, assignments) {
  var _a;
  const segments = [];
  for (const p of precincts) {
    const pDist = assignments.get(p.id);
    const corners = hexCorners(p.center);
    for (let i = 0; i < 6; i++) {
      const nId = (_a = p.neighbors[i]) != null ? _a : null;
      const c0 = corners[i];
      const c1 = corners[(i + 1) % 6];
      if (c0 === void 0 || c1 === void 0)
        continue;
      if (nId === null) {
        segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
        continue;
      }
      if (pDist !== assignments.get(nId)) {
        segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
      }
    }
  }
  return segments;
}
function computeCountySegments(precincts) {
  var _a;
  const segments = [];
  for (const p of precincts) {
    const corners = hexCorners(p.center);
    for (let i = 0; i < 6; i++) {
      const nId = (_a = p.neighbors[i]) != null ? _a : null;
      if (nId === null || nId < p.id)
        continue;
      const neighbor = precincts[nId];
      if (neighbor === void 0)
        continue;
      if (p.county_id === void 0 && neighbor.county_id === void 0)
        continue;
      if (p.county_id === neighbor.county_id)
        continue;
      const c0 = corners[i];
      const c1 = corners[(i + 1) % 6];
      if (c0 === void 0 || c1 === void 0)
        continue;
      segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
    }
  }
  return segments;
}
function renderResults(container, state) {
  if (state.simulationResult === null || state.simulationResult.districtResults.length === 0) {
    container.innerHTML = '<div style="color:#606080;font-size:0.85rem;">Draw districts to see results</div>';
    return;
  }
  const { districtResults } = state.simulationResult;
  const html2 = districtResults.map((r) => {
    var _a;
    const color2 = (_a = DISTRICT_COLORS[r.districtId - 1]) != null ? _a : "#888";
    const winnerColor = PARTY_COLORS[r.winner];
    const winnerLabel = PARTY_LABELS[r.winner];
    const dPct = (r.voteTotals.D * 100).toFixed(1);
    const rPct = (r.voteTotals.R * 100).toFixed(1);
    const marginPct = (r.margin * 100).toFixed(1);
    return `
      <div class="result-district" style="border-left-color:${color2}">
        <div class="dist-name">District ${r.districtId}</div>
        <div class="winner-badge" style="background:${winnerColor};color:#fff">${winnerLabel} +${marginPct}%</div>
        <div class="vote-bar" style="--d-pct:${dPct}%"></div>
        <div class="vote-details">
          Blue ${dPct}% \xB7 Red ${rPct}% \xB7 ${r.precinctCount} precincts \xB7 pop ${r.population.toLocaleString()}
        </div>
      </div>`;
  }).join("");
  container.innerHTML = html2;
}
function renderLegend(container, districtCount) {
  const items = Array.from({ length: districtCount }, (_, i) => {
    var _a;
    const color2 = (_a = DISTRICT_COLORS[i]) != null ? _a : "#888";
    return `<div class="legend-item">
      <div class="legend-swatch" style="background:${color2}"></div>
      <span>District ${i + 1}</span>
    </div>`;
  });
  container.innerHTML = items.join("");
}
function renderDistrictButtons(container, districtCount, activeDistrict, onSelect) {
  var _a;
  container.innerHTML = "";
  for (let i = 1; i <= districtCount; i++) {
    const color2 = (_a = DISTRICT_COLORS[i - 1]) != null ? _a : "#888";
    const btn = document.createElement("button");
    btn.className = `district-btn${i === activeDistrict ? " active" : ""}`;
    btn.textContent = `District ${i}`;
    btn.style.background = color2;
    btn.style.color = "#fff";
    btn.addEventListener("click", () => onSelect(i));
    container.appendChild(btn);
  }
}
function renderValidityPanel(container, state, rules) {
  var _a, _b;
  const { precincts, assignments, districtCount } = state;
  const stats = computeValidityStats(precincts, assignments, districtCount, rules);
  let html2 = "";
  const unassignedCls = stats.unassignedCount > 0 ? "validity-warn" : "validity-ok";
  const unassignedLabel = stats.unassignedCount === 1 ? "1 precinct" : `${stats.unassignedCount} precincts`;
  html2 += `<div class="validity-row ${unassignedCls}">`;
  html2 += `<span>Unassigned</span><span class="validity-badge">${unassignedLabel}</span>`;
  html2 += `</div>`;
  html2 += `<div class="validity-section-label">Population balance</div>`;
  for (const d of stats.districtPop) {
    const color2 = (_a = DISTRICT_COLORS[d.districtId - 1]) != null ? _a : "#888";
    const sign3 = d.deviationPct >= 0 ? "+" : "";
    const cls = d.status === "ok" ? "validity-ok" : "validity-error";
    const statusLabel = d.status === "ok" ? "ok" : d.status;
    html2 += `<div class="validity-row ${cls}" style="border-left-color:${color2}">`;
    html2 += `<span>D${d.districtId}: ${d.population.toLocaleString()}</span>`;
    html2 += `<span class="validity-badge">${sign3}${d.deviationPct.toFixed(1)}% ${statusLabel}</span>`;
    html2 += `</div>`;
  }
  if (stats.contiguity !== null) {
    html2 += `<div class="validity-section-label">Contiguity</div>`;
    for (const [did, ok] of stats.contiguity) {
      const color2 = (_b = DISTRICT_COLORS[did - 1]) != null ? _b : "#888";
      const cls = ok ? "validity-ok" : rules.contiguity === "required" ? "validity-error" : "validity-warn";
      const label = ok ? "Connected" : "Non-contiguous";
      html2 += `<div class="validity-row ${cls}" style="border-left-color:${color2}">`;
      html2 += `<span>D${did}</span><span class="validity-badge">${label}</span>`;
      html2 += `</div>`;
    }
  }
  container.innerHTML = html2;
}
var _SvgMapRenderer, SvgMapRenderer;
var init_mapRenderer = __esm({
  "web/src/render/mapRenderer.ts"() {
    init_src32();
    init_generator();
    init_types();
    init_validity();
    _SvgMapRenderer = class _SvgMapRenderer {
      constructor(svgEl, getState, paintStroke, setActiveDistrict) {
        __publicField(this, "svg");
        __publicField(this, "zoomGroup");
        __publicField(this, "countyBorderGroup");
        __publicField(this, "borderGroup");
        __publicField(this, "hexGroup");
        __publicField(this, "previewBorderGroup");
        __publicField(this, "getState");
        __publicField(this, "paintStroke");
        __publicField(this, "setActiveDistrict");
        // Brush state
        __publicField(this, "isPainting", false);
        __publicField(this, "strokePrecincts", /* @__PURE__ */ new Set());
        __publicField(this, "strokeDistrict", 1);
        // Snapshot of assignments at stroke start — used to compute preview boundaries
        __publicField(this, "strokeSnapshot", null);
        // Hover state — tracks which path is currently highlighted
        __publicField(this, "hoveredPath", null);
        // View mode — render concern only, not game state
        __publicField(this, "viewMode", "districts");
        // Population range — cached once (precincts are immutable)
        __publicField(this, "popMin", 0);
        __publicField(this, "popMax", 1);
        // Zoom state (GAME-009)
        __publicField(this, "zoomBehavior");
        __publicField(this, "initialTransform", identity5);
        __publicField(this, "currentK", 1);
        // County border overlay (GAME-012): computed once at load, toggled on/off
        __publicField(this, "countySegments", []);
        __publicField(this, "countyBordersVisible", false);
        this.getState = getState;
        this.paintStroke = paintStroke;
        this.setActiveDistrict = setActiveDistrict;
        this.svg = select_default2(svgEl);
        this.zoomGroup = this.svg.append("g").attr("class", "zoom-layer");
        this.borderGroup = this.zoomGroup.append("g").attr("class", "borders");
        this.hexGroup = this.zoomGroup.append("g").attr("class", "hexes");
        this.countyBorderGroup = this.zoomGroup.append("g").attr("class", "county-borders");
        this.previewBorderGroup = this.zoomGroup.append("g").attr("class", "preview-borders");
        const pops = getState().precincts.map((p) => p.population);
        this.popMin = Math.min(...pops);
        this.popMax = Math.max(...pops);
        this.countySegments = computeCountySegments(getState().precincts);
        this.initZoom();
        this.initBrushEvents();
        this.initHoverEvents();
      }
      setViewMode(mode2) {
        this.viewMode = mode2;
        this.render();
      }
      setCountyBordersVisible(visible) {
        this.countyBordersVisible = visible;
        if (visible) {
          this.renderCountyBorders();
        } else {
          this.countyBorderGroup.selectAll("line.county-boundary").remove();
        }
      }
      renderCountyBorders() {
        this.countyBorderGroup.selectAll("line.county-boundary").data(this.countySegments).join(
          (enter) => enter.append("line").attr("class", "county-boundary").attr("stroke-linecap", "round"),
          (update) => update,
          (exit) => exit.remove()
        ).attr("x1", (d) => d.x1).attr("y1", (d) => d.y1).attr("x2", (d) => d.x2).attr("y2", (d) => d.y2).attr("stroke", "#606060").attr("stroke-width", _SvgMapRenderer.COUNTY_BASE_WIDTH / this.currentK).attr("stroke-dasharray", `${6 / this.currentK},${4 / this.currentK}`).attr("opacity", 0.7);
      }
      // ─── Zoom init (GAME-009) ─────────────────────────────────────────────────
      /**
       * Replaces the Sprint 1 viewBox approach. Computes an initial transform that
       * fits the scenario in the SVG container, then applies d3.zoom() to the SVG
       * with right-click-drag pan and scroll-wheel zoom. Left-click is filtered out
       * so the paint brush is unaffected. Keyboard: =+ zoom in, - zoom out, 0 reset.
       */
      initZoom() {
        const svgNode2 = this.svg.node();
        const { precincts } = this.getState();
        const bounds = mapBounds(precincts);
        const svgRect = svgNode2.getBoundingClientRect();
        const svgW = svgRect.width > 0 ? svgRect.width : 800;
        const svgH = svgRect.height > 0 ? svgRect.height : 600;
        const padding = 20;
        const fitScale = Math.min(
          (svgW - padding * 2) / bounds.width,
          (svgH - padding * 2) / bounds.height
        );
        const tx = (svgW - bounds.width * fitScale) / 2 - bounds.minX * fitScale;
        const ty = (svgH - bounds.height * fitScale) / 2 - bounds.minY * fitScale;
        this.initialTransform = identity5.translate(tx, ty).scale(fitScale);
        this.currentK = fitScale;
        this.zoomBehavior = zoom_default2().scaleExtent([fitScale, fitScale * 8]).filter((event) => {
          if (event.type === "wheel")
            return true;
          if (event instanceof MouseEvent && event.type === "mousedown") {
            return event.button === 2;
          }
          return false;
        }).on("zoom", (event) => {
          this.currentK = event.transform.k;
          this.zoomGroup.attr("transform", event.transform.toString());
          const bw = _SvgMapRenderer.BOUNDARY_BASE_WIDTH / this.currentK;
          this.borderGroup.selectAll("line.boundary").attr("stroke-width", bw);
          const pw = _SvgMapRenderer.PREVIEW_BASE_WIDTH / this.currentK;
          this.previewBorderGroup.selectAll("line.preview-boundary").attr("stroke-width", pw);
        });
        svgNode2.addEventListener("contextmenu", (e) => e.preventDefault());
        this.svg.call(this.zoomBehavior);
        this.svg.call(this.zoomBehavior.transform, this.initialTransform);
        document.addEventListener("keydown", (e) => {
          const target = e.target;
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
            return;
          if (e.key === "=" || e.key === "+") {
            e.preventDefault();
            this.svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 1.3);
          } else if (e.key === "-") {
            e.preventDefault();
            this.svg.transition().duration(200).call(this.zoomBehavior.scaleBy, 1 / 1.3);
          } else if (e.key === "0") {
            e.preventDefault();
            this.svg.transition().duration(300).call(this.zoomBehavior.transform, this.initialTransform);
          }
        });
      }
      // ─── Main render ──────────────────────────────────────────────────────────
      /** Called on every committed state change. Reconciles fills and solid boundaries. */
      render() {
        const { precincts, assignments } = this.getState();
        this.hexGroup.selectAll("path.hex").data(precincts, (d) => String(d.id)).join(
          (enter) => enter.append("path").attr("class", "hex").attr("data-precinct-id", (d) => String(d.id)).attr("d", (d) => hexPolygonPath(d)).attr("stroke", "none").attr("stroke-width", 0.5).style("cursor", "crosshair"),
          (update) => update,
          (exit) => exit.remove()
        ).attr("fill", (d) => this.hexFill(d, assignments)).attr("opacity", (d) => this.hexOpacity(d, assignments));
        this.renderBoundaries(computeBoundarySegments(precincts, assignments));
      }
      renderBoundaries(segments) {
        const strokeWidth = _SvgMapRenderer.BOUNDARY_BASE_WIDTH / this.currentK;
        this.borderGroup.selectAll("line.boundary").data(segments).join(
          (enter) => enter.append("line").attr("class", "boundary").attr("stroke-linecap", "round"),
          (update) => update,
          (exit) => exit.remove()
        ).attr("x1", (d) => d.x1).attr("y1", (d) => d.y1).attr("x2", (d) => d.x2).attr("y2", (d) => d.y2).attr("stroke", "#ffffff").attr("stroke-width", strokeWidth).attr("opacity", 0.6).attr("stroke-dasharray", null);
      }
      // ─── Boundary preview (during drag) ───────────────────────────────────────
      /**
       * Renders the preview boundary (where the boundary will be after this stroke)
       * as a dashed overlay in previewBorderGroup. The committed solid boundaries in
       * borderGroup are untouched — so old (solid) and new (dashed) are visible together.
       */
      updateBoundaryPreview() {
        if (this.strokeSnapshot === null)
          return;
        const { precincts } = this.getState();
        const previewAssignments = new Map(this.strokeSnapshot);
        for (const id2 of this.strokePrecincts) {
          previewAssignments.set(id2, this.strokeDistrict);
        }
        const segments = computeBoundarySegments(precincts, previewAssignments);
        const strokeWidth = _SvgMapRenderer.PREVIEW_BASE_WIDTH / this.currentK;
        this.previewBorderGroup.selectAll("line.preview-boundary").data(segments).join(
          (enter) => enter.append("line").attr("class", "preview-boundary").attr("stroke-linecap", "round"),
          (update) => update,
          (exit) => exit.remove()
        ).attr("x1", (d) => d.x1).attr("y1", (d) => d.y1).attr("x2", (d) => d.x2).attr("y2", (d) => d.y2).attr("stroke", "#ffffff").attr("stroke-width", strokeWidth).attr("stroke-dasharray", `${5 / this.currentK},${4 / this.currentK}`).attr("opacity", 0.85);
      }
      clearBoundaryPreview() {
        this.previewBorderGroup.selectAll("line.preview-boundary").remove();
      }
      // ─── Hover events ─────────────────────────────────────────────────────────
      /**
       * Single delegated mousemove/mouseout on the SVG.
       * Hover only sets stroke/opacity — never fill — so clearHover never needs to
       * restore fill (which would clobber in-progress paint visuals).
       */
      initHoverEvents() {
        const svgNode2 = this.svg.node();
        svgNode2.addEventListener("mousemove", (event) => {
          var _a;
          const target = event.target;
          if (!target.classList.contains("hex")) {
            this.clearHover();
            return;
          }
          const path2 = target;
          const d = select_default2(path2).datum();
          if (d === void 0)
            return;
          if (this.hoveredPath !== path2) {
            this.clearHover();
            this.hoveredPath = path2;
            select_default2(path2).attr("stroke", "#ffffff").attr("stroke-width", 1.5 / this.currentK).attr("opacity", 0.95);
            const { assignments } = this.getState();
            const dId = assignments.get(d.id);
            const infoPanel = document.getElementById("precinct-info");
            if (infoPanel !== null) {
              const precinctLabel = (_a = d.name) != null ? _a : `Precinct ${d.id}`;
              const distLabel = dId != null ? `District ${dId}` : "Unassigned";
              const topParty = ["D", "R", "L", "G", "I"].reduce(
                (a2, b) => d.partyShare[a2] > d.partyShare[b] ? a2 : b
              );
              const leanLabel = `${PARTY_LABELS[topParty]} (${(d.partyShare[topParty] * 100).toFixed(1)}%)`;
              let groupsHtml = "";
              if (d.groupShares && d.groupShares.length > 1) {
                const lines = d.groupShares.map(
                  (g) => `${g.name}: ${(g.share * 100).toFixed(0)}%`
                );
                groupsHtml = `<br><span style="color:#8898b0">` + lines.join("<br>") + `</span>`;
              }
              infoPanel.innerHTML = `<div class="precinct-name">${precinctLabel}</div><div class="precinct-detail">${distLabel}<br>Pop: ${d.population.toLocaleString()}<br>Lean: ${leanLabel}` + groupsHtml + `</div>`;
            }
          }
        });
        svgNode2.addEventListener("mouseout", (event) => {
          if (!svgNode2.contains(event.relatedTarget)) {
            this.clearHover();
            this.clearPrecinctInfo();
          }
        });
      }
      /** Restore placeholder text when no precinct is hovered. */
      clearPrecinctInfo() {
        const infoPanel = document.getElementById("precinct-info");
        if (infoPanel !== null) {
          infoPanel.innerHTML = '<div class="precinct-placeholder">Hover over a precinct to see details.<br>Click and drag to paint districts.</div>';
        }
      }
      /** Restores stroke/opacity only — never fill (hover never changes fill). */
      clearHover() {
        if (this.hoveredPath === null)
          return;
        const path2 = this.hoveredPath;
        this.hoveredPath = null;
        const { assignments } = this.getState();
        const d = select_default2(path2).datum();
        if (d !== void 0) {
          select_default2(path2).attr("stroke", "none").attr("stroke-width", 0.5).attr("opacity", this.hexOpacity(d, assignments));
        }
      }
      // ─── Brush events ─────────────────────────────────────────────────────────
      /** Delegated brush events — mousedown/mousemove on SVG, mouseup on window. */
      initBrushEvents() {
        const svgNode2 = this.svg.node();
        svgNode2.addEventListener("mousedown", (event) => {
          if (event.button !== 0)
            return;
          const target = event.target;
          if (!target.classList.contains("hex"))
            return;
          const path2 = target;
          const d = select_default2(path2).datum();
          if (d === void 0)
            return;
          const { activeDistrict, assignments } = this.getState();
          this.isPainting = true;
          this.strokeDistrict = activeDistrict;
          this.strokePrecincts = /* @__PURE__ */ new Set([d.id]);
          this.strokeSnapshot = new Map(assignments);
          this.setActiveDistrict(activeDistrict);
          this.applyPaintVisual(path2, activeDistrict);
          this.updateBoundaryPreview();
        });
        svgNode2.addEventListener("mousemove", (event) => {
          if (!this.isPainting)
            return;
          const target = event.target;
          if (!target.classList.contains("hex"))
            return;
          const path2 = target;
          const d = select_default2(path2).datum();
          if (d === void 0 || this.strokePrecincts.has(d.id))
            return;
          this.strokePrecincts.add(d.id);
          this.applyPaintVisual(path2, this.strokeDistrict);
          this.updateBoundaryPreview();
        });
        window.addEventListener("mouseup", () => {
          if (!this.isPainting)
            return;
          this.isPainting = false;
          this.clearBoundaryPreview();
          this.strokeSnapshot = null;
          const ids = Array.from(this.strokePrecincts);
          if (ids.length > 0) {
            this.paintStroke(ids, this.strokeDistrict);
          }
          this.strokePrecincts = /* @__PURE__ */ new Set();
        });
      }
      /**
       * Directly sets hex fill during a drag stroke (no store update — committed on mouseup).
       * Skipped in lean mode: lean color is intrinsic to the precinct, not the assignment,
       * so there is no hex-color feedback in lean mode; boundary preview is the signal.
       */
      applyPaintVisual(path2, districtId) {
        var _a;
        if (this.viewMode === "lean")
          return;
        const d = select_default2(path2).datum();
        const base = (_a = DISTRICT_COLORS[districtId - 1]) != null ? _a : "#2a2a3e";
        const c3 = hsl(base);
        if (d !== void 0 && this.popMax > this.popMin) {
          const normPop = (d.population - this.popMin) / (this.popMax - this.popMin);
          c3.l = 0.55 - normPop * 0.3;
        }
        select_default2(path2).attr("fill", c3.formatHex()).attr("opacity", 0.75);
      }
      // ─── Fill / opacity helpers ───────────────────────────────────────────────
      hexFill(d, assignments) {
        var _a;
        if (this.viewMode === "lean") {
          const lean = d.partyShare.D - d.partyShare.R;
          const t = (lean + 1) / 2;
          return RdBu_default(t);
        }
        const dId = assignments.get(d.id);
        if (dId == null)
          return "#2a2a3e";
        const base = (_a = DISTRICT_COLORS[dId - 1]) != null ? _a : "#2a2a3e";
        const normPop = this.popMax > this.popMin ? (d.population - this.popMin) / (this.popMax - this.popMin) : 0.5;
        const c3 = hsl(base);
        c3.l = 0.55 - normPop * 0.3;
        return c3.formatHex();
      }
      hexOpacity(d, assignments) {
        if (this.viewMode === "lean")
          return 0.9;
        const dId = assignments.get(d.id);
        return dId != null ? 0.75 : 0.35;
      }
    };
    // current zoom scale; stroke widths divided by this
    // Base stroke widths (apparent px at any zoom level)
    __publicField(_SvgMapRenderer, "BOUNDARY_BASE_WIDTH", 2);
    __publicField(_SvgMapRenderer, "PREVIEW_BASE_WIDTH", 2.5);
    __publicField(_SvgMapRenderer, "COUNTY_BASE_WIDTH", 3);
    SvgMapRenderer = _SvgMapRenderer;
  }
});

// node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/vanilla.mjs
var createStoreImpl, createStore;
var init_vanilla = __esm({
  "node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/vanilla.mjs"() {
    createStoreImpl = (createState) => {
      let state;
      const listeners = /* @__PURE__ */ new Set();
      const setState = (partial, replace) => {
        const nextState = typeof partial === "function" ? partial(state) : partial;
        if (!Object.is(nextState, state)) {
          const previousState = state;
          state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
          listeners.forEach((listener) => listener(state, previousState));
        }
      };
      const getState = () => state;
      const getInitialState = () => initialState;
      const subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      };
      const api = { setState, getState, getInitialState, subscribe };
      const initialState = state = createState(setState, getState, api);
      return api;
    };
    createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;
  }
});

// node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/react.mjs
import React from "react";
var init_react = __esm({
  "node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/react.mjs"() {
    init_vanilla();
  }
});

// node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/index.mjs
var init_esm = __esm({
  "node_modules/.aspect_rules_js/zustand@5.0.12/node_modules/zustand/esm/index.mjs"() {
    init_vanilla();
    init_react();
  }
});

// node_modules/.aspect_rules_js/zundo@2.3.0_zustand_5.0.12/node_modules/zundo/dist/index.js
var temporalStateCreator, temporal;
var init_dist = __esm({
  "node_modules/.aspect_rules_js/zundo@2.3.0_zustand_5.0.12/node_modules/zundo/dist/index.js"() {
    init_esm();
    temporalStateCreator = (userSet, userGet, options) => {
      const stateCreator = (set3, get3) => {
        return {
          pastStates: (options == null ? void 0 : options.pastStates) || [],
          futureStates: (options == null ? void 0 : options.futureStates) || [],
          undo: (steps = 1) => {
            var _a, _b;
            if (get3().pastStates.length) {
              const currentState = ((_a = options == null ? void 0 : options.partialize) == null ? void 0 : _a.call(options, userGet())) || userGet();
              const statesToApply = get3().pastStates.splice(-steps, steps);
              const nextState = statesToApply.shift();
              userSet(nextState);
              set3({
                pastStates: get3().pastStates,
                futureStates: get3().futureStates.concat(
                  ((_b = options == null ? void 0 : options.diff) == null ? void 0 : _b.call(options, currentState, nextState)) || currentState,
                  statesToApply.reverse()
                )
              });
            }
          },
          redo: (steps = 1) => {
            var _a, _b;
            if (get3().futureStates.length) {
              const currentState = ((_a = options == null ? void 0 : options.partialize) == null ? void 0 : _a.call(options, userGet())) || userGet();
              const statesToApply = get3().futureStates.splice(-steps, steps);
              const nextState = statesToApply.shift();
              userSet(nextState);
              set3({
                pastStates: get3().pastStates.concat(
                  ((_b = options == null ? void 0 : options.diff) == null ? void 0 : _b.call(options, currentState, nextState)) || currentState,
                  statesToApply.reverse()
                ),
                futureStates: get3().futureStates
              });
            }
          },
          clear: () => set3({ pastStates: [], futureStates: [] }),
          isTracking: true,
          pause: () => set3({ isTracking: false }),
          resume: () => set3({ isTracking: true }),
          setOnSave: (_onSave) => set3({ _onSave }),
          // Internal properties
          _onSave: options == null ? void 0 : options.onSave,
          _handleSet: (pastState, replace, currentState, deltaState) => {
            var _a, _b;
            if ((options == null ? void 0 : options.limit) && get3().pastStates.length >= (options == null ? void 0 : options.limit)) {
              get3().pastStates.shift();
            }
            (_b = (_a = get3())._onSave) == null ? void 0 : _b.call(_a, pastState, currentState);
            set3({
              pastStates: get3().pastStates.concat(deltaState || pastState),
              futureStates: []
            });
          }
        };
      };
      return stateCreator;
    };
    temporal = (config, options) => {
      const configWithTemporal = (set3, get3, store) => {
        var _a, _b;
        store.temporal = createStore(
          ((_a = options == null ? void 0 : options.wrapTemporal) == null ? void 0 : _a.call(options, temporalStateCreator(set3, get3, options))) || temporalStateCreator(set3, get3, options)
        );
        const curriedHandleSet = ((_b = options == null ? void 0 : options.handleSet) == null ? void 0 : _b.call(
          options,
          store.temporal.getState()._handleSet
        )) || store.temporal.getState()._handleSet;
        const temporalHandleSet = (pastState) => {
          var _a2, _b2, _c;
          if (!store.temporal.getState().isTracking)
            return;
          const currentState = ((_a2 = options == null ? void 0 : options.partialize) == null ? void 0 : _a2.call(options, get3())) || get3();
          const deltaState = (_b2 = options == null ? void 0 : options.diff) == null ? void 0 : _b2.call(options, pastState, currentState);
          if (
            // Don't call handleSet if state hasn't changed, as determined by diff fn or equality fn
            !// If the user has provided a diff function but nothing has been changed, deltaState will be null
            (deltaState === null || // If the user has provided an equality function, use it
            ((_c = options == null ? void 0 : options.equality) == null ? void 0 : _c.call(options, pastState, currentState)))
          ) {
            curriedHandleSet(
              pastState,
              void 0,
              currentState,
              deltaState
            );
          }
        };
        const setState = store.setState;
        store.setState = (...args) => {
          var _a2;
          const pastState = ((_a2 = options == null ? void 0 : options.partialize) == null ? void 0 : _a2.call(options, get3())) || get3();
          setState(...args);
          temporalHandleSet(pastState);
        };
        return config(
          // Modify the set function to call the userlandSet function
          (...args) => {
            var _a2;
            const pastState = ((_a2 = options == null ? void 0 : options.partialize) == null ? void 0 : _a2.call(options, get3())) || get3();
            set3(...args);
            temporalHandleSet(pastState);
          },
          get3,
          store
        );
      };
      return configWithTemporal;
    };
  }
});

// web/src/model/adapter.js
function scenarioToSpike(scenario) {
  const districtIndexMap = /* @__PURE__ */ new Map();
  scenario.districts.forEach((d, i) => {
    districtIndexMap.set(d.id, i + 1);
  });
  const posMap = /* @__PURE__ */ new Map();
  scenario.precincts.forEach((pc, i) => {
    const pos = pc.position;
    if ("q" in pos)
      posMap.set(`${pos.q},${pos.r}`, i);
  });
  const precincts = scenario.precincts.map((pc, i) => {
    var _a, _b, _c, _d;
    const pos = pc.position;
    const q = "q" in pos ? pos.q : 0;
    const r = "q" in pos ? pos.r : 0;
    const center = hexToPixel(q, r);
    const neighbors = HEX_DIRECTIONS.map(([dq, dr]) => {
      const idx = posMap.get(`${q + dq},${r + dr}`);
      return idx !== void 0 ? idx : null;
    });
    const firstPartyId = (_a = scenario.parties[0]) == null ? void 0 : _a.id;
    const secondPartyId = (_b = scenario.parties[1]) == null ? void 0 : _b.id;
    let firstShare = 0;
    let secondShare = 0;
    for (const g of pc.demographic_groups) {
      const vs = g.vote_shares;
      if (firstPartyId)
        firstShare += g.population_share * ((_c = vs[firstPartyId]) != null ? _c : 0);
      if (secondPartyId)
        secondShare += g.population_share * ((_d = vs[secondPartyId]) != null ? _d : 0);
    }
    const partyShare = {
      R: Math.round(firstShare * 1e3) / 1e3,
      D: Math.round(secondShare * 1e3) / 1e3,
      L: 0,
      G: 0,
      I: 0
    };
    const winner = partyShare.D >= partyShare.R ? "D" : "R";
    const margin = Math.round(Math.abs(partyShare.D - partyShare.R) * 100) / 100;
    const spikePrecinct = {
      id: i,
      coord: { q, r },
      center,
      neighbors,
      population: pc.total_population,
      partyShare,
      previousResult: { winner, margin },
      demographics: { male: 0.49, female: 0.49, nonbinary: 0.02 }
    };
    if (pc.name !== void 0)
      spikePrecinct.name = pc.name;
    if (pc.county_id !== void 0)
      spikePrecinct.county_id = pc.county_id;
    if (pc.demographic_groups.length > 1) {
      spikePrecinct.groupShares = pc.demographic_groups.map((g) => {
        var _a2;
        const entry = {
          name: (_a2 = g.name) != null ? _a2 : g.id,
          share: g.population_share
        };
        if (g.dimensions)
          entry.dimensions = g.dimensions;
        return entry;
      });
    }
    return spikePrecinct;
  });
  const assignments = /* @__PURE__ */ new Map();
  scenario.precincts.forEach((pc, i) => {
    var _a;
    const sDistId = pc.initial_district_id;
    const spikeDistId = sDistId != null ? (_a = districtIndexMap.get(sDistId)) != null ? _a : null : null;
    assignments.set(i, spikeDistId);
  });
  return { precincts, assignments, districtCount: scenario.districts.length };
}
var init_adapter = __esm({
  "web/src/model/adapter.js"() {
    init_generator();
  }
});

// web/src/simulation/election.js
function zeroShare() {
  return { R: 0, D: 0, L: 0, G: 0, I: 0 };
}
function pluralityWinner(share) {
  let best = "R";
  for (const p of ALL_PARTIES) {
    if (share[p] > share[best]) {
      best = p;
    }
  }
  return best;
}
function simulateDistrict(districtId, precincts, assignments) {
  var _a;
  const inDistrict = precincts.filter((p) => assignments.get(p.id) === districtId);
  const voteTotals = zeroShare();
  let totalPop = 0;
  for (const p of inDistrict) {
    totalPop += p.population;
    for (const party of ALL_PARTIES) {
      voteTotals[party] += p.partyShare[party] * p.population;
    }
  }
  if (totalPop > 0) {
    for (const party of ALL_PARTIES) {
      voteTotals[party] /= totalPop;
    }
  }
  const winner = pluralityWinner(voteTotals);
  const sorted = ALL_PARTIES.slice().sort((a2, b) => voteTotals[b] - voteTotals[a2]);
  const runnerUp = (_a = sorted[1]) != null ? _a : "R";
  const margin = voteTotals[winner] - voteTotals[runnerUp];
  return {
    districtId,
    winner,
    voteTotals,
    totalVotes: totalPop,
    margin: Math.round(margin * 1e3) / 1e3,
    precinctCount: inDistrict.length,
    population: totalPop
  };
}
function runElection(state) {
  var _a;
  const activeDistricts = /* @__PURE__ */ new Set();
  for (const [, dId] of state.assignments) {
    if (dId !== null) {
      activeDistricts.add(dId);
    }
  }
  const districtResults = [];
  for (const dId of Array.from(activeDistricts).sort((a2, b) => a2 - b)) {
    districtResults.push(simulateDistrict(dId, state.precincts, state.assignments));
  }
  const seatsByParty = {};
  for (const r of districtResults) {
    const current = (_a = seatsByParty[r.winner]) != null ? _a : 0;
    seatsByParty[r.winner] = current + 1;
  }
  return { districtResults, seatsByParty };
}
var ALL_PARTIES;
var init_election = __esm({
  "web/src/simulation/election.js"() {
    ALL_PARTIES = ["R", "D", "L", "G", "I"];
  }
});

// web/src/store/gameStore.ts
function cloneAssignments(m) {
  return new Map(m);
}
function createGameStore(scenario) {
  const { precincts, assignments, districtCount } = scenarioToSpike(scenario);
  const initialAssignments = new Map(assignments);
  const initialState = {
    precincts,
    districtCount,
    assignments,
    activeDistrict: 1,
    simulationResult: null
  };
  initialState.simulationResult = runElection(initialState);
  const store = createStore()(
    temporal(
      (set3, get3) => __spreadProps(__spreadValues({}, initialState), {
        setActiveDistrict(id2) {
          set3({ activeDistrict: id2 });
        },
        paintPrecinct(precinctId) {
          const { assignments: assignments2, activeDistrict } = get3();
          const current = assignments2.get(precinctId);
          if (current === activeDistrict)
            return;
          const next = cloneAssignments(assignments2);
          next.set(precinctId, activeDistrict);
          set3({
            assignments: next,
            simulationResult: runElection(__spreadProps(__spreadValues({}, get3()), { assignments: next }))
          });
        },
        paintStroke(precinctIds, district) {
          if (precinctIds.length === 0)
            return;
          const { assignments: assignments2 } = get3();
          const next = cloneAssignments(assignments2);
          let changed = false;
          for (const id2 of precinctIds) {
            if (next.get(id2) !== district) {
              next.set(id2, district);
              changed = true;
            }
          }
          if (!changed)
            return;
          set3({
            assignments: next,
            simulationResult: runElection(__spreadProps(__spreadValues({}, get3()), { assignments: next }))
          });
        },
        resetToInitial() {
          const restored = new Map(initialAssignments);
          set3({
            assignments: restored,
            simulationResult: runElection(__spreadProps(__spreadValues({}, get3()), { assignments: restored }))
          });
        },
        restoreAssignments(assignments2, activeDistrict) {
          const restored = new Map(assignments2);
          set3({
            assignments: restored,
            activeDistrict,
            simulationResult: runElection(__spreadProps(__spreadValues({}, get3()), { assignments: restored }))
          });
        }
      }),
      {
        // zundo: equality check — prevents storing a new history entry if assignments unchanged
        equality: (a2, b) => {
          if (a2.assignments === b.assignments)
            return true;
          if (a2.assignments.size !== b.assignments.size)
            return false;
          for (const [k2, v2] of a2.assignments) {
            if (b.assignments.get(k2) !== v2)
              return false;
          }
          return true;
        }
      }
    )
  );
  return { store };
}
var init_gameStore = __esm({
  "web/src/store/gameStore.ts"() {
    init_dist();
    init_vanilla();
    init_adapter();
    init_election();
  }
});

// web/src/simulation/evaluate.js
function applyOp(actual, op, threshold2) {
  switch (op) {
    case "lt":
      return actual < threshold2;
    case "lte":
      return actual <= threshold2;
    case "eq":
      return Math.abs(actual - threshold2) < 1e-9;
    case "gte":
      return actual >= threshold2;
    case "gt":
      return actual > threshold2;
  }
}
function computeDistrictCompactness(precincts, assignments, districtCount) {
  const scores = [];
  for (let d = 1; d <= districtCount; d++) {
    const inDistrict = /* @__PURE__ */ new Set();
    for (const [pid, did] of assignments) {
      if (did === d)
        inDistrict.add(pid);
    }
    if (inDistrict.size === 0) {
      scores.push(0);
      continue;
    }
    let interior = 0;
    let total = 0;
    for (const pid of inDistrict) {
      const p = precincts[pid];
      if (!p)
        continue;
      for (const nbId of p.neighbors) {
        total++;
        if (nbId !== null && inDistrict.has(nbId))
          interior++;
      }
    }
    scores.push(total > 0 ? interior / total : 0);
  }
  return scores;
}
function matchesGroupFilter(group2, filter3) {
  var _a;
  if ("group_ids" in filter3) {
    return filter3.group_ids.includes(group2.id);
  }
  return ((_a = group2.dimensions) == null ? void 0 : _a[filter3.dimension]) === filter3.value;
}
function computeDistrictGroupShares(scenarioPrecincts, assignments, districtCount, filter3) {
  const shares = [];
  for (let d = 1; d <= districtCount; d++) {
    let groupPop = 0;
    let totalPop = 0;
    for (const [pid, did] of assignments) {
      if (did !== d)
        continue;
      const sp = scenarioPrecincts[pid];
      if (sp === void 0)
        continue;
      totalPop += sp.total_population;
      for (const g of sp.demographic_groups) {
        if (matchesGroupFilter(g, filter3)) {
          groupPop += g.population_share * sp.total_population;
        }
      }
    }
    shares.push(totalPop > 0 ? groupPop / totalPop : 0);
  }
  return shares;
}
function evaluateCriteria(criteria, validityStats, simResult, rules, precincts, assignments, districtCount, partyIdToKey, scenarioPrecincts = []) {
  var _a, _b, _c, _d;
  let compactnessScores = null;
  function getCompactness() {
    if (compactnessScores === null) {
      compactnessScores = computeDistrictCompactness(precincts, assignments, districtCount);
    }
    return compactnessScores;
  }
  const criterionResults = [];
  for (const sc of criteria) {
    let passed = false;
    let detail;
    const c3 = sc.criterion;
    switch (c3.type) {
      case "district_count": {
        const allAssigned = validityStats.unassignedCount === 0;
        const districtsInUse = simResult.districtResults.length;
        passed = allAssigned && districtsInUse === districtCount;
        if (!passed) {
          if (!allAssigned) {
            detail = `${validityStats.unassignedCount} precinct(s) unassigned`;
          } else {
            detail = `only ${districtsInUse} of ${districtCount} districts have precincts`;
          }
        }
        break;
      }
      case "population_balance": {
        const failing = validityStats.districtPop.filter((d) => d.status !== "ok");
        passed = failing.length === 0;
        if (!passed) {
          const worst = failing[0];
          const sign3 = worst.deviationPct >= 0 ? "+" : "";
          detail = `District ${worst.districtId}: ${sign3}${worst.deviationPct.toFixed(1)}% (tolerance \xB1${(rules.population_tolerance * 100).toFixed(0)}%)`;
        }
        break;
      }
      case "compactness": {
        const scores = getCompactness();
        const minScore = scores.length > 0 ? Math.min(...scores) : 0;
        passed = applyOp(minScore, c3.operator, c3.threshold);
        const opLabel = { lt: "<", lte: "\u2264", eq: "=", gte: "\u2265", gt: ">" };
        detail = `min district score: ${(minScore * 100).toFixed(1)}% (required ${opLabel[c3.operator]}${(c3.threshold * 100).toFixed(0)}%)`;
        break;
      }
      case "seat_count": {
        const key = (_a = partyIdToKey.get(c3.party)) != null ? _a : String(c3.party);
        const seats = (_b = simResult.seatsByParty[key]) != null ? _b : 0;
        passed = applyOp(seats, c3.operator, c3.count);
        const opLabel = { lt: "<", lte: "\u2264", eq: "=", gte: "\u2265", gt: ">" };
        detail = `${key}: ${seats} seat(s) (required ${opLabel[c3.operator]}${c3.count})`;
        break;
      }
      case "safe_seats": {
        const key = (_c = partyIdToKey.get(c3.party)) != null ? _c : String(c3.party);
        const safeCount = simResult.districtResults.filter((dr) => dr.winner === key && dr.margin >= c3.margin).length;
        passed = safeCount >= c3.min_count;
        detail = `${key}: ${safeCount} safe seat(s) with margin \u2265${(c3.margin * 100).toFixed(0)}% (required \u2265${c3.min_count})`;
        break;
      }
      case "competitive_seats": {
        const competitive = simResult.districtResults.filter((dr) => dr.margin <= c3.margin).length;
        passed = competitive >= c3.min_count;
        detail = `${competitive} competitive seat(s) with margin \u2264${(c3.margin * 100).toFixed(0)}% (required \u2265${c3.min_count})`;
        break;
      }
      case "efficiency_gap": {
        let rWasted = 0;
        let dWasted = 0;
        let allVotes = 0;
        for (const dr of simResult.districtResults) {
          const rVotes = dr.voteTotals.R * dr.totalVotes;
          const dVotes = dr.voteTotals.D * dr.totalVotes;
          allVotes += dr.totalVotes;
          if (dr.winner === "R") {
            rWasted += Math.max(0, rVotes - dr.totalVotes * 0.5);
            dWasted += dVotes;
          } else if (dr.winner === "D") {
            dWasted += Math.max(0, dVotes - dr.totalVotes * 0.5);
            rWasted += rVotes;
          } else {
            rWasted += rVotes;
            dWasted += dVotes;
          }
        }
        const rawGap = allVotes > 0 ? (rWasted - dWasted) / allVotes : 0;
        const absGap = Math.abs(rawGap);
        passed = applyOp(absGap, c3.operator, c3.threshold);
        const opLabel2 = { lt: "<", lte: "\u2264", eq: "=", gte: "\u2265", gt: ">" };
        const direction = rawGap >= 0 ? "R-disadvantaged" : "D-disadvantaged";
        detail = `efficiency gap: ${(absGap * 100).toFixed(1)}% (${direction}; required ${opLabel2[c3.operator]}${(c3.threshold * 100).toFixed(0)}%)`;
        break;
      }
      case "mean_median": {
        const key = (_d = partyIdToKey.get(c3.party)) != null ? _d : String(c3.party);
        const shares = simResult.districtResults.map((dr) => {
          var _a2;
          return (_a2 = dr.voteTotals[key]) != null ? _a2 : 0;
        });
        if (shares.length === 0) {
          passed = false;
          detail = "no districts to evaluate";
          break;
        }
        const mean2 = shares.reduce((a2, b) => a2 + b, 0) / shares.length;
        const sorted = shares.slice().sort((a2, b) => a2 - b);
        const n = sorted.length;
        const median2 = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
        const diff = mean2 - median2;
        passed = applyOp(diff, c3.operator, c3.threshold);
        const opLabel3 = { lt: "<", lte: "\u2264", eq: "=", gte: "\u2265", gt: ">" };
        const sign3 = diff >= 0 ? "+" : "";
        detail = `${key}: mean ${(mean2 * 100).toFixed(1)}% \u2212 median ${(median2 * 100).toFixed(1)}% = ${sign3}${(diff * 100).toFixed(1)}% (required ${opLabel3[c3.operator]}${(c3.threshold * 100).toFixed(0)}%)`;
        break;
      }
      case "majority_minority": {
        if (scenarioPrecincts.length === 0) {
          passed = false;
          detail = "majority_minority requires scenario precincts (not provided)";
          break;
        }
        const groupShares = computeDistrictGroupShares(scenarioPrecincts, assignments, districtCount, c3.group_filter);
        const qualifying = groupShares.filter((s2) => s2 >= c3.min_eligible_share).length;
        passed = qualifying >= c3.min_districts;
        detail = `${qualifying} of ${districtCount} district(s) have target group \u2265${(c3.min_eligible_share * 100).toFixed(0)}% (required ${c3.min_districts})`;
        break;
      }
    }
    const entry = {
      criterionId: sc.id,
      required: sc.required,
      description: sc.description,
      passed
    };
    if (detail !== void 0)
      entry.detail = detail;
    criterionResults.push(entry);
  }
  const overallPass = criterionResults.filter((r) => r.required).every((r) => r.passed);
  return { criterionResults, overallPass };
}
function isMapSubmittable(validityStats, rules) {
  if (validityStats.unassignedCount > 0)
    return false;
  if (validityStats.districtPop.some((d) => d.status !== "ok"))
    return false;
  if (rules.contiguity === "required" && validityStats.contiguity !== null) {
    for (const ok of validityStats.contiguity.values()) {
      if (!ok)
        return false;
    }
  }
  return true;
}
var init_evaluate = __esm({
  "web/src/simulation/evaluate.js"() {
  }
});

// web/src/model/progress.js
function saveWip(wip) {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify(wip));
  } catch (e) {
  }
}
function loadWip() {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    if (raw === null)
      return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && typeof parsed.scenarioId === "string" && typeof parsed.assignments === "object" && parsed.assignments !== null && typeof parsed.activeDistrict === "number") {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
}
function clearWip() {
  try {
    localStorage.removeItem(WIP_KEY);
  } catch (e) {
  }
}
function serializeProgress(progress) {
  return JSON.stringify({ completed: progress.completed });
}
function deserializeProgress(json) {
  try {
    const raw = JSON.parse(json);
    if (typeof raw === "object" && raw !== null && "completed" in raw && Array.isArray(raw.completed)) {
      const arr = raw.completed;
      return { completed: arr.filter((x3) => typeof x3 === "string") };
    }
  } catch (e) {
  }
  return { completed: [] };
}
function markCompleted(progress, scenarioId) {
  if (progress.completed.includes(scenarioId))
    return progress;
  return { completed: [...progress.completed, scenarioId] };
}
function isCompleted(progress, scenarioId) {
  return progress.completed.includes(scenarioId);
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw === null)
      return { completed: [] };
    return deserializeProgress(raw);
  } catch (e) {
    return { completed: [] };
  }
}
function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, serializeProgress(progress));
  } catch (e) {
  }
}
var PROGRESS_KEY, WIP_KEY;
var init_progress = __esm({
  "web/src/model/progress.js"() {
    PROGRESS_KEY = "redistricting-sim-progress";
    WIP_KEY = "redistricting-sim-wip";
  }
});

// web/src/main.ts
var require_main = __commonJS({
  "web/src/main.ts"(exports) {
    init_loader();
    init_mapRenderer();
    init_gameStore();
    init_evaluate();
    init_validity();
    init_progress();
    var BASE_PATH = window.location.pathname.replace(/\/[^/]*$/, "/");
    function baseUrl(path2) {
      return BASE_PATH + path2.replace(/^\//, "");
    }
    var SCENARIO_MANIFEST = [
      { id: "tutorial-002", title: "Millbrook County: Three-District Challenge" },
      { id: "scenario-002", title: "Clearwater County: The Governor's Map" },
      { id: "scenario-003", title: "Riverport: The Packing Problem" },
      { id: "scenario-004", title: "Lakeview: Cracking the Opposition" },
      { id: "scenario-005", title: "Valle Verde: A Voice for the Valley" },
      { id: "scenario-006", title: "Harden the Map" },
      { id: "scenario-007", title: "The Reform Map" },
      { id: "scenario-008", title: "Both Sides Unhappy" },
      { id: "scenario-009", title: "Cats vs. Dogs" }
    ];
    var svgEl = document.getElementById("map-svg");
    var resultsEl = document.getElementById("results-container");
    var validityEl = document.getElementById("validity-container");
    var legendEl = document.getElementById("legend-container");
    var districtBtnsEl = document.getElementById("district-buttons");
    var btnUndo = document.getElementById("btn-undo");
    var btnRedo = document.getElementById("btn-redo");
    var btnViewToggle = document.getElementById("btn-view-toggle");
    var btnCountyToggle = document.getElementById("btn-county-toggle");
    var btnReset = document.getElementById("btn-reset");
    var resetConfirm = document.getElementById("reset-confirm");
    var btnResetConfirm = document.getElementById("btn-reset-confirm");
    var btnResetCancel = document.getElementById("btn-reset-cancel");
    var appHeader = document.getElementById("app-header");
    var mainEl = document.getElementById("main");
    var scenarioSelectEl = document.getElementById("scenario-select");
    var scenarioCardsEl = document.getElementById("scenario-cards");
    var btnSubmit = document.getElementById("btn-submit");
    var resultScreen = document.getElementById("result-screen");
    var resultVerdict = document.getElementById("result-verdict");
    var resultSubtitle = document.getElementById("result-subtitle");
    var resultCriteriaList = document.getElementById("result-criteria-list");
    var btnKeepDrawing = document.getElementById("btn-keep-drawing");
    var btnNextScenario = document.getElementById("btn-next-scenario");
    var introScreen = document.getElementById("intro-screen");
    var charNameEl = document.getElementById("char-name");
    var charRoleEl = document.getElementById("char-role");
    var charMotivationEl = document.getElementById("char-motivation");
    var introSlideHeading = document.getElementById("intro-slide-heading");
    var introSlideBody = document.getElementById("intro-slide-body");
    var objectiveText = document.getElementById("objective-text");
    var introProgress = document.getElementById("intro-progress");
    var btnIntroPrev = document.getElementById("btn-intro-prev");
    var btnIntroNext = document.getElementById("btn-intro-next");
    var btnIntroStart = document.getElementById("btn-intro-start");
    var btnIntroSkip = document.getElementById("btn-intro-skip");
    if (svgEl === null || resultsEl === null || validityEl === null || legendEl === null || districtBtnsEl === null || btnUndo === null || btnRedo === null || btnViewToggle === null || btnCountyToggle === null || btnReset === null || resetConfirm === null || btnResetConfirm === null || btnResetCancel === null || appHeader === null || mainEl === null) {
      throw new Error("Required DOM elements not found");
    }
    var DEBUG_KEY = "redistricting-sim-debug";
    var debugParam = new URLSearchParams(window.location.search).get("debug");
    if (debugParam === "off") {
      try {
        sessionStorage.removeItem(DEBUG_KEY);
      } catch (e) {
      }
    } else if (debugParam !== null) {
      try {
        sessionStorage.setItem(DEBUG_KEY, "1");
      } catch (e) {
      }
    }
    var IS_DEBUG = debugParam !== null && debugParam !== "off" || sessionStorage.getItem(DEBUG_KEY) === "1";
    (() => __async(exports, null, function* () {
      var _a, _b, _c, _d, _e;
      let progress = loadProgress();
      function renderScenarioCards() {
        if (!scenarioCardsEl)
          return;
        const wip = loadWip();
        scenarioCardsEl.innerHTML = "";
        SCENARIO_MANIFEST.forEach((entry, i) => {
          var _a2, _b2;
          const completed = isCompleted(progress, entry.id);
          const unlocked = i === 0 || isCompleted(progress, (_b2 = (_a2 = SCENARIO_MANIFEST[i - 1]) == null ? void 0 : _a2.id) != null ? _b2 : "");
          const locked = !unlocked;
          const inProgress = (wip == null ? void 0 : wip.scenarioId) === entry.id;
          const card = document.createElement("div");
          card.className = `scenario-card${locked ? " locked" : ""}`;
          const titleEl = document.createElement("div");
          titleEl.className = "sc-title";
          titleEl.textContent = entry.title;
          const statusEl = document.createElement("div");
          const statusLabel = inProgress ? "In Progress" : completed ? "Completed" : unlocked ? "Ready" : "Locked";
          const statusClass = inProgress ? "in-progress" : completed ? "completed" : unlocked ? "unlocked" : "locked";
          statusEl.className = `sc-status ${statusClass}`;
          statusEl.textContent = statusLabel;
          const playBtn = document.createElement("button");
          playBtn.className = `sc-play-btn ${inProgress ? "continue" : completed ? "replay" : unlocked ? "play" : "locked-btn"}`;
          playBtn.textContent = inProgress ? "Continue" : completed ? "Play Again" : unlocked ? "Play" : "Locked";
          playBtn.disabled = locked;
          if (!locked) {
            playBtn.addEventListener("click", () => {
              const currentWip = loadWip();
              if (currentWip && currentWip.scenarioId !== entry.id) {
                showWipWarning(currentWip.scenarioId, entry.id);
              } else {
                window.location.assign(`${BASE_PATH}?s=${entry.id}`);
              }
            });
          }
          card.appendChild(titleEl);
          card.appendChild(statusEl);
          card.appendChild(playBtn);
          scenarioCardsEl.appendChild(card);
        });
      }
      function showWipWarning(wipScenarioId, targetId) {
        var _a2, _b2;
        const modal = document.getElementById("wip-warning-modal");
        const text = document.getElementById("wip-warning-text");
        const confirmBtn = document.getElementById("wip-warning-confirm");
        const cancelBtn = document.getElementById("wip-warning-cancel");
        if (!modal || !text || !confirmBtn || !cancelBtn)
          return;
        const wipTitle = (_b2 = (_a2 = SCENARIO_MANIFEST.find((e) => e.id === wipScenarioId)) == null ? void 0 : _a2.title) != null ? _b2 : wipScenarioId;
        text.textContent = `You have unsaved progress in "${wipTitle}". Switching scenarios will discard it.`;
        modal.classList.remove("hidden");
        const onConfirm = () => {
          cleanup();
          clearWip();
          window.location.assign(`${BASE_PATH}?s=${targetId}`);
        };
        const onCancel = () => {
          cleanup();
          modal.classList.add("hidden");
        };
        function cleanup() {
          confirmBtn.removeEventListener("click", onConfirm);
          cancelBtn.removeEventListener("click", onCancel);
        }
        confirmBtn.addEventListener("click", onConfirm);
        cancelBtn.addEventListener("click", onCancel);
      }
      function showScenarioSelect() {
        var _a2, _b2, _c2;
        renderScenarioCards();
        scenarioSelectEl == null ? void 0 : scenarioSelectEl.classList.remove("hidden");
        (_a2 = document.getElementById("btn-reset-campaign")) == null ? void 0 : _a2.addEventListener("click", () => {
          if (!confirm("Reset all progress? This will erase completion status and any in-progress work."))
            return;
          progress = { completed: [] };
          saveProgress(progress);
          clearWip();
          renderScenarioCards();
        });
        (_b2 = document.getElementById("btn-about")) == null ? void 0 : _b2.addEventListener("click", () => {
          var _a3;
          scenarioSelectEl == null ? void 0 : scenarioSelectEl.classList.add("hidden");
          (_a3 = document.getElementById("about-screen")) == null ? void 0 : _a3.classList.remove("hidden");
        });
        (_c2 = document.getElementById("btn-about-close")) == null ? void 0 : _c2.addEventListener("click", () => {
          var _a3;
          (_a3 = document.getElementById("about-screen")) == null ? void 0 : _a3.classList.add("hidden");
          scenarioSelectEl == null ? void 0 : scenarioSelectEl.classList.remove("hidden");
        });
      }
      const urlParams = new URLSearchParams(window.location.search);
      const requestedId = (_a = urlParams.get("s")) != null ? _a : "";
      const requestedEntry = SCENARIO_MANIFEST.find(
        (e) => e.id === requestedId
      );
      let entryToLoad;
      if (requestedId !== "" && requestedEntry === void 0) {
        showScenarioSelect();
        return;
      } else if (requestedEntry !== void 0) {
        const idx = SCENARIO_MANIFEST.indexOf(requestedEntry);
        const locked = idx > 0 && !isCompleted(progress, (_c = (_b = SCENARIO_MANIFEST[idx - 1]) == null ? void 0 : _b.id) != null ? _c : "");
        if (locked && !IS_DEBUG) {
          showScenarioSelect();
          return;
        }
        entryToLoad = requestedEntry;
      } else if (progress.completed.length > 0 || loadWip() !== null) {
        showScenarioSelect();
        return;
      } else {
        entryToLoad = SCENARIO_MANIFEST[0];
      }
      let json;
      try {
        const resp = yield fetch(baseUrl(`scenarios/${entryToLoad.id}.json`));
        if (!resp.ok)
          throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        json = yield resp.json();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[GAME-032] Failed to fetch scenario "${entryToLoad.id}":`, e);
        document.body.insertAdjacentHTML(
          "afterbegin",
          `<div style="position:fixed;inset:0;background:#0d1b2e;color:#c0d0e8;padding:2em;font-family:system-ui;z-index:999;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;">
				<h1 style="color:#e94560;font-size:1.4rem;">Scenario Failed to Load</h1>
				<p style="max-width:600px;text-align:center;">Could not fetch scenario <strong>${entryToLoad.id}</strong>.</p>
				<pre style="background:#16213e;padding:12px 16px;border-radius:6px;max-width:600px;overflow-x:auto;font-size:0.8rem;color:#e94560;white-space:pre-wrap;">${msg}</pre>
				<button onclick="window.location.assign(window.location.pathname.replace(/\\/[^/]*$/,'/'))" style="padding:8px 20px;background:#1a3a5c;color:#c0d0e8;border:1px solid #2a5a8c;border-radius:6px;cursor:pointer;">\u2190 Back to Scenarios</button>
			</div>`
        );
        return;
      }
      let scenario;
      try {
        scenario = loadScenario(json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[GAME-032] Scenario "${entryToLoad.id}" validation failed:`, e);
        document.body.insertAdjacentHTML(
          "afterbegin",
          `<div style="position:fixed;inset:0;background:#0d1b2e;color:#c0d0e8;padding:2em;font-family:system-ui;z-index:999;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;">
				<h1 style="color:#e94560;font-size:1.4rem;">Scenario Failed to Load</h1>
				<p style="max-width:600px;text-align:center;">Scenario <strong>${entryToLoad.id}</strong> could not be loaded due to a validation error.</p>
				<pre style="background:#16213e;padding:12px 16px;border-radius:6px;max-width:600px;overflow-x:auto;font-size:0.8rem;color:#e94560;white-space:pre-wrap;">${msg}</pre>
				<button onclick="window.location.assign(window.location.pathname.replace(/\\/[^/]*$/,'/'))" style="padding:8px 20px;background:#1a3a5c;color:#c0d0e8;border:1px solid #2a5a8c;border-radius:6px;cursor:pointer;">\u2190 Back to Scenarios</button>
			</div>`
        );
        return;
      }
      const { store } = createGameStore(scenario);
      const temporalStore = store.temporal;
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        window["__gameStore"] = store;
      }
      let isRestoringWip = false;
      let wipTimer = null;
      const savedWip = loadWip();
      if (savedWip !== null && savedWip.scenarioId === scenario.id) {
        isRestoringWip = true;
        const restoredMap = new Map(
          Object.entries(savedWip.assignments).map(([k2, v2]) => [Number(k2), v2])
        );
        store.getState().restoreAssignments(restoredMap, savedWip.activeDistrict);
        temporalStore.getState().clear();
        isRestoringWip = false;
      }
      function flushWipSave() {
        if (wipTimer !== null)
          clearTimeout(wipTimer);
        wipTimer = null;
        const { assignments, activeDistrict } = store.getState();
        const assignmentsRecord = {};
        for (const [k2, v2] of assignments) {
          if (v2 !== null)
            assignmentsRecord[String(k2)] = v2;
        }
        const wip = {
          scenarioId: scenario.id,
          assignments: assignmentsRecord,
          activeDistrict
        };
        saveWip(wip);
      }
      function scheduleWipSave() {
        if (isRestoringWip)
          return;
        if (wipTimer !== null)
          clearTimeout(wipTimer);
        wipTimer = setTimeout(() => {
          wipTimer = null;
          flushWipSave();
        }, 800);
      }
      const renderer = new SvgMapRenderer(
        svgEl,
        () => store.getState(),
        (ids, district) => store.getState().paintStroke(ids, district),
        (id2) => store.getState().setActiveDistrict(id2)
      );
      const SPIKE_PARTY_KEYS = ["R", "D", "L", "G", "I"];
      const partyIdToKey = /* @__PURE__ */ new Map();
      scenario.parties.forEach((p, i) => {
        var _a2;
        partyIdToKey.set(p.id, (_a2 = SPIKE_PARTY_KEYS[i]) != null ? _a2 : "I");
      });
      function updateUI() {
        const state = store.getState();
        const { pastStates, futureStates } = temporalStore.getState();
        renderer.render();
        renderResults(resultsEl, state);
        renderValidityPanel(validityEl, state, scenario.rules);
        renderLegend(legendEl, state.districtCount);
        renderDistrictButtons(districtBtnsEl, state.districtCount, state.activeDistrict, (id2) => {
          store.getState().setActiveDistrict(id2);
        });
        btnUndo.disabled = pastStates.length === 0;
        btnRedo.disabled = futureStates.length === 0;
        const validity = computeValidityStats(
          state.precincts,
          state.assignments,
          state.districtCount,
          scenario.rules
        );
        btnSubmit.disabled = !isMapSubmittable(validity, scenario.rules);
      }
      let introController = null;
      function showEditor() {
        introController == null ? void 0 : introController.abort();
        introController = null;
        introScreen == null ? void 0 : introScreen.classList.add("hidden");
        appHeader.style.display = "";
        mainEl.style.display = "";
      }
      function startScenarioIntro() {
        var _a2, _b2, _c2;
        const slides = (_b2 = (_a2 = scenario.narrative) == null ? void 0 : _a2.intro_slides) != null ? _b2 : [];
        if (slides.length === 0 || introScreen === null) {
          showEditor();
          return;
        }
        introController == null ? void 0 : introController.abort();
        introController = new AbortController();
        const { signal } = introController;
        const { character, objective } = scenario.narrative;
        if (charNameEl)
          charNameEl.textContent = character.name;
        if (charRoleEl)
          charRoleEl.textContent = character.role;
        if (charMotivationEl)
          charMotivationEl.textContent = (_c2 = character.motivation) != null ? _c2 : "";
        if (objectiveText)
          objectiveText.textContent = objective;
        let currentSlide = 0;
        function renderSlide(index2) {
          var _a3;
          const slide = slides[index2];
          if (!slide)
            return;
          if (introSlideHeading)
            introSlideHeading.textContent = (_a3 = slide.heading) != null ? _a3 : "";
          if (introSlideBody)
            introSlideBody.textContent = slide.body;
          if (introProgress)
            introProgress.textContent = `${index2 + 1} / ${slides.length}`;
          if (btnIntroPrev)
            btnIntroPrev.disabled = index2 === 0;
          const isLast = index2 === slides.length - 1;
          if (btnIntroNext)
            btnIntroNext.style.display = isLast ? "none" : "";
          if (btnIntroStart)
            btnIntroStart.classList.toggle("visible", isLast);
        }
        renderSlide(0);
        introScreen.classList.remove("hidden");
        btnIntroPrev == null ? void 0 : btnIntroPrev.addEventListener("click", () => {
          if (currentSlide > 0)
            renderSlide(--currentSlide);
        }, { signal });
        btnIntroNext == null ? void 0 : btnIntroNext.addEventListener("click", () => {
          if (currentSlide < slides.length - 1)
            renderSlide(++currentSlide);
        }, { signal });
        const startHandler = () => showEditor();
        btnIntroStart == null ? void 0 : btnIntroStart.addEventListener("click", startHandler, { signal });
        btnIntroSkip == null ? void 0 : btnIntroSkip.addEventListener("click", startHandler, { signal });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape")
            showEditor();
        }, { signal });
      }
      btnUndo.addEventListener("click", () => {
        temporalStore.getState().undo();
      });
      btnRedo.addEventListener("click", () => {
        temporalStore.getState().redo();
      });
      let currentViewMode = "districts";
      btnViewToggle.addEventListener("click", () => {
        currentViewMode = currentViewMode === "districts" ? "lean" : "districts";
        renderer.setViewMode(currentViewMode);
        btnViewToggle.textContent = currentViewMode === "districts" ? "Switch to Partisan Lean" : "Switch to Districts";
      });
      let countyBordersVisible = false;
      btnCountyToggle.addEventListener("click", () => {
        countyBordersVisible = !countyBordersVisible;
        renderer.setCountyBordersVisible(countyBordersVisible);
        btnCountyToggle.textContent = countyBordersVisible ? "Hide County Borders" : "Show County Borders";
        btnCountyToggle.classList.toggle("active", countyBordersVisible);
      });
      btnReset.addEventListener("click", () => {
        resetConfirm.classList.add("visible");
        btnReset.disabled = true;
      });
      btnResetCancel.addEventListener("click", () => {
        resetConfirm.classList.remove("visible");
        btnReset.disabled = false;
      });
      btnResetConfirm.addEventListener("click", () => {
        store.getState().resetToInitial();
        temporalStore.getState().clear();
        resetConfirm.classList.remove("visible");
        btnReset.disabled = false;
      });
      function showResultScreen() {
        if (!resultScreen || !resultVerdict || !resultSubtitle || !resultCriteriaList)
          return;
        const state = store.getState();
        if (state.simulationResult === null)
          return;
        const validity = computeValidityStats(
          state.precincts,
          state.assignments,
          state.districtCount,
          scenario.rules
        );
        const evalResult = evaluateCriteria(
          scenario.success_criteria,
          validity,
          state.simulationResult,
          scenario.rules,
          state.precincts,
          state.assignments,
          state.districtCount,
          partyIdToKey,
          scenario.precincts
        );
        resultVerdict.textContent = evalResult.overallPass ? "Map Passed!" : "Map Failed";
        resultVerdict.className = evalResult.overallPass ? "pass" : "fail";
        resultSubtitle.textContent = evalResult.overallPass ? "All required criteria met." : "One or more required criteria were not met.";
        resultCriteriaList.innerHTML = "";
        for (const cr of evalResult.criterionResults) {
          const cls = cr.passed ? "passed" : cr.required ? "failed-required" : "failed-optional";
          const row = document.createElement("div");
          row.className = `result-criterion ${cls}`;
          const iconEl = document.createElement("span");
          iconEl.className = "rc-icon";
          iconEl.textContent = cr.passed ? "\u2713" : "\u2717";
          const body = document.createElement("div");
          body.className = "rc-body";
          const desc = document.createElement("div");
          desc.className = "rc-desc";
          desc.textContent = cr.description;
          body.appendChild(desc);
          if (cr.detail) {
            const detail = document.createElement("div");
            detail.className = "rc-detail";
            detail.textContent = cr.detail;
            body.appendChild(detail);
          }
          const badge = document.createElement("span");
          badge.className = "rc-badge";
          badge.textContent = cr.passed ? "PASS" : cr.required ? "FAIL" : "OPTIONAL";
          row.appendChild(iconEl);
          row.appendChild(body);
          row.appendChild(badge);
          resultCriteriaList.appendChild(row);
        }
        btnKeepDrawing.style.display = "";
        btnNextScenario.style.display = evalResult.overallPass ? "" : "none";
        if (evalResult.overallPass) {
          progress = markCompleted(progress, scenario.id);
          saveProgress(progress);
          clearWip();
        }
        resultScreen.classList.remove("hidden");
      }
      btnSubmit.addEventListener("click", () => {
        showResultScreen();
      });
      const btnDebugWin = document.getElementById("btn-debug-win");
      if (btnDebugWin && IS_DEBUG) {
        btnDebugWin.style.display = "";
        btnDebugWin.addEventListener("click", () => {
          var _a2;
          progress = markCompleted(progress, scenario.id);
          saveProgress(progress);
          clearWip();
          const allComplete = SCENARIO_MANIFEST.every((e) => isCompleted(progress, e.id));
          if (allComplete) {
            (_a2 = document.getElementById("wrap-up-screen")) == null ? void 0 : _a2.classList.remove("hidden");
          } else {
            window.location.assign(BASE_PATH);
          }
        });
      }
      btnKeepDrawing.addEventListener("click", () => {
        resultScreen.classList.add("hidden");
      });
      (_d = document.getElementById("btn-back-to-scenarios")) == null ? void 0 : _d.addEventListener("click", () => {
        flushWipSave();
        window.location.assign(BASE_PATH);
      });
      btnNextScenario.addEventListener("click", () => {
        var _a2;
        const allComplete = SCENARIO_MANIFEST.every((e) => isCompleted(progress, e.id));
        if (allComplete) {
          resultScreen.classList.add("hidden");
          (_a2 = document.getElementById("wrap-up-screen")) == null ? void 0 : _a2.classList.remove("hidden");
        } else {
          window.location.assign(BASE_PATH);
        }
      });
      (_e = document.getElementById("btn-wrap-up-replay")) == null ? void 0 : _e.addEventListener("click", () => {
        window.location.assign(BASE_PATH);
      });
      store.subscribe(() => {
        updateUI();
        scheduleWipSave();
      });
      temporalStore.subscribe(() => updateUI());
      updateUI();
      startScenarioIntro();
    }))();
  }
});
export default require_main();
//# sourceMappingURL=bundle.js.map
