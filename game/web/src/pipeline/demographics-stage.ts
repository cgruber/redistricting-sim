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
	// Proximity to an arbitrary anchor (GAME-119): within `within` hexes of `near`.
	// Axial hex distance is translation-invariant, so the distance from the anchor is
	// hexDist of the component-wise difference. `near` and `within` are a pair — one
	// without the other is a malformed filter, so fail fast on authored specs.
	if (filter.near !== undefined || filter.within !== undefined) {
		if (filter.near === undefined || filter.within === undefined) {
			throw new Error("Zone filter `near` and `within` must be specified together");
		}
		if (hexDist(q - filter.near.q, r - filter.near.r) > filter.within) return false;
	}
	return true;
}

/**
 * N-party vote-share model (GAME-116): the PRIMARY party (`parties[0]`) gets
 * `base + jitter` (clamped); the remainder `(1 − primary)` is split among the
 * other parties by their `party_base` values as WEIGHTS — proportional when any
 * are specified, otherwise equally.
 *
 * `party_base` for a non-primary party is a WEIGHT over the remainder, NOT an
 * absolute share: author all N bases to sum to ~1.0 (with the primary) for the
 * numbers to be realized literally (e.g. `{ken: 0.55, ryu: 0.37, ind: 0.08}`).
 * The primary party alone carries the seeded jitter.
 *
 * Byte-identical for the 2-party case: with only the primary base specified, the
 * single other party has weightSum 0 → gets `remainder / 1 = (1 − primary) × 1.0`,
 * which is bit-identical to the pre-GAME-116 `secondary = 1 − primary`.
 */
export function addDemographics(partial: PartialScenario, spec: DemographicsSpec): PartialScenario {
	const prng = makePrng(spec.seed);
	const parties = spec.parties as PartyId[];
	const primaryParty = parties[0]!;
	const otherParties = parties.slice(1);

	const precincts = partial.precincts.map((p) => {
		const pos = p.position;
		if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position`);
		const { q, r } = pos;

		const zone = spec.zones.find((z) => matchesFilter(z.filter, q, r));
		if (!zone) throw new Error(`No zone matched precinct ${p.id} at q=${q} r=${r}`);

		// One jitter draw (primary only), then the turnout draw — order preserved
		// from the 2-party version so seeded output is byte-identical at N=2.
		const rawJitter = prng.nextDouble(-spec.jitter, spec.jitter);
		const primaryBase = zone.party_base[primaryParty] ?? 0;
		const primaryShare = Math.min(1, Math.max(0, primaryBase + rawJitter));
		const remainder = 1 - primaryShare;

		const weights = otherParties.map((op) => zone.party_base[op] ?? 0);
		const weightSum = weights.reduce((a, b) => a + b, 0);

		const vote_shares = { [primaryParty]: primaryShare } as Record<PartyId, number>;
		otherParties.forEach((op, i) => {
			const w = weightSum > 0 ? weights[i]! / weightSum : 1 / otherParties.length;
			vote_shares[op] = remainder * w;
		});

		const turnout = prng.nextDouble(spec.turnout.min, spec.turnout.max);

		const groupId = `${p.id}-${spec.group.id_suffix}` as GroupId;

		return {
			...p,
			demographic_groups: [
				{
					id: groupId,
					...(spec.group.name !== undefined ? { name: spec.group.name } : {}),
					population_share: 1.0,
					vote_shares,
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
	const precincts = partial.precincts.map((p) => {
		const pos = p.position;
		if (!("q" in pos)) throw new Error(`Precinct ${p.id} has no hex position`);
		const { q, r } = pos;

		const label = countyLabels.find((cl) => matchesFilter(cl.filter, q, r));
		if (!label) throw new Error(`No county label matched precinct ${p.id} at q=${q} r=${r}`);

		return { ...p, county_id: label.id };
	});

	return { ...partial, precincts };
}
