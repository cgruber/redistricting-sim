import type { PartialScenario } from "../model/scenario.js";
import type { GroupId, PartyId } from "../model/scenario.js";
import type { DemographicsSpec, ZoneFilter, CountyLabelSpec } from "./spec-types.js";
import { makePrng } from "./prng.js";

function hexDist(q: number, r: number): number {
  const s = -q - r;
  return (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
}

function matchesFilter(filter: ZoneFilter, q: number, r: number): boolean {
  if (filter.default) return true;
  if (filter.q_lte !== undefined && q > filter.q_lte) return false;
  if (filter.q_gte !== undefined && q < filter.q_gte) return false;
  if (filter.hex_dist_lte !== undefined && hexDist(q, r) > filter.hex_dist_lte) return false;
  return true;
}

export function addDemographics(
  partial: PartialScenario,
  spec: DemographicsSpec,
): PartialScenario {
  const prng = makePrng(spec.seed);
  const primaryParty = spec.parties[0] as PartyId;
  const secondaryParty = spec.parties[1] as PartyId;

  const precincts = partial.precincts.map(p => {
    const pos = p.position;
    if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position`);
    const { q, r } = pos;

    const zone = spec.zones.find(z => matchesFilter(z.filter, q, r));
    if (!zone) throw new Error(`No zone matched precinct ${p.id} at q=${q} r=${r}`);

    const rawJitter = prng.nextDouble(-spec.jitter, spec.jitter);
    const primaryBase = zone.party_base[primaryParty] ?? 0;
    const primaryShare = Math.min(1, Math.max(0, primaryBase + rawJitter));
    const secondaryShare = 1 - primaryShare;

    const turnout = prng.nextDouble(spec.turnout.min, spec.turnout.max);

    const groupId = `${p.id}-${spec.group.id_suffix}` as GroupId;

    return {
      ...p,
      demographic_groups: [
        {
          id: groupId,
          ...(spec.group.name !== undefined ? { name: spec.group.name } : {}),
          population_share: 1.0,
          vote_shares: {
            [primaryParty]: primaryShare,
            [secondaryParty]: secondaryShare,
          } as Record<PartyId, number>,
          turnout_rate: turnout,
        },
      ],
    };
  });

  return { ...partial, precincts };
}

export function assignCounties(
  partial: PartialScenario,
  countyLabels: CountyLabelSpec[],
): PartialScenario {
  const precincts = partial.precincts.map(p => {
    const pos = p.position;
    if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position`);
    const { q, r } = pos;

    const label = countyLabels.find(cl => matchesFilter(cl.filter, q, r));
    if (!label) throw new Error(`No county label matched precinct ${p.id} at q=${q} r=${r}`);

    return { ...p, county_id: label.id };
  });

  return { ...partial, precincts };
}
