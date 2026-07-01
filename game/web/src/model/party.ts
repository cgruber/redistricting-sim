/**
 * Party-agnostic vote-share helpers and color palette (GAME-043).
 *
 * Retires the fixed `PartyKey = R|D|L|G|I` / `PartyShare {R,D,L,G,I}` spike
 * representation in favour of shares keyed by the scenario's arbitrary `PartyId`.
 * Every winner/margin/seat computation sources its party order from the scenario's
 * `parties` list rather than a global constant.
 *
 * Pure data — no DOM, no D3, no side effects.
 */

import type { PartyId } from "./scenario.js";

/**
 * Partisan vote share keyed by PartyId: floats 0.0–1.0 summing to 1.0.
 * Every party in the scenario is present; a plain object (not a Map) so it
 * serializes cleanly into zundo undo snapshots (GAME-106).
 */
export type PartyShare = Record<PartyId, number>;

/**
 * Zero-initialised PartyShare over the scenario's party list.
 */
export function zeroShare(parties: PartyId[]): PartyShare {
	const share = {} as PartyShare;
	for (const p of parties) share[p] = 0;
	return share;
}

/**
 * Plurality winner of a PartyShare over the scenario's ordered party list.
 *
 * CANONICAL TIE-BREAK RULE (GAME-104): ties resolve to the party that comes
 * FIRST in the scenario's `parties` order. Implementation: seed best = parties[0]
 * and replace only on a strict `>`, so an equal share never displaces an
 * earlier-listed party. This reproduces the pre-GAME-043 R>D>L>G>I determinism
 * because the first scenario party mapped to R (first slot) under the old fixed
 * keys. This matches the authoritative election simulation (election.ts), so the
 * displayed winner always follows the computed result — one tie-break direction
 * everywhere.
 */
export function winnerOf(share: PartyShare, parties: PartyId[]): PartyId {
	let best = parties[0]!;
	for (const p of parties) {
		if ((share[p] ?? 0) > (share[best] ?? 0)) {
			best = p;
		}
	}
	return best;
}

/**
 * Party display color palette, indexed by the scenario's party order. These are
 * the pre-GAME-043 PARTY_COLORS hexes in R,D,L,G,I order — aligned with the PuOr
 * lean-view palette so party badges and the lean map share a color language
 * (party 1 → orange, party 2 → purple).
 *
 * GAME-043 keeps colors palette-by-index; scenario-authored `Party.color` is a
 * later PR (GAME-043 PR 2 / GAME-112).
 */
export const PARTY_PALETTE: readonly string[] = [
	"#c96d00", // party 1 (was R): orange
	"#7b35a8", // party 2 (was D): purple
	"#f0c040", // party 3 (was L)
	"#50c878", // party 4 (was G)
	"#a0a0a0", // party 5 (was I)
] as const;

/**
 * Resolve a party's display color from the palette by its position in the
 * scenario's ordered party list. Fallback grey for a party outside the palette
 * range (>5 parties — impossible today).
 */
export function partyColor(parties: PartyId[], partyId: PartyId): string {
	const idx = parties.indexOf(partyId);
	return PARTY_PALETTE[idx] ?? "#a0a0a0";
}

/** Party display labels — fallbacks used when a scenario does not supply party
 *  names, indexed by party order. Generic "Party N" avoids color-name confusion
 *  since party colors vary by scenario.
 */
export const PARTY_LABELS: readonly string[] = [
	"Party 1",
	"Party 2",
	"Party 3",
	"Party 4",
	"Party 5",
] as const;

/**
 * Resolve a party's fallback display label from its position in the scenario's
 * ordered party list. Callers should prefer the scenario's authored party name;
 * this is the last-resort fallback.
 */
export function partyLabel(parties: PartyId[], partyId: PartyId): string {
	const idx = parties.indexOf(partyId);
	return PARTY_LABELS[idx] ?? String(partyId);
}
