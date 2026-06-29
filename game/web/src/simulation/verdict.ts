/**
 * Win/star verdict — pure projection of evaluate + validity results (GAME-110).
 *
 * The central game output: given per-criterion results and validity stats,
 * decide whether the player won, how many stars they earned, and which
 * structural validity failures to surface. Extracted out of the untested
 * main.ts controller so the off-by-one star rule and the skip-when-equivalent
 * validity-row rule are unit-tested.
 *
 * No DOM, no Zustand, no closures over `scenario`. All inputs are plain data.
 */

import type { CriterionId } from "../model/scenario.js";
import type { CriterionResult } from "./evaluate.js";
import type { ValidityStats } from "./validity.js";

/**
 * Stars earned for a finished map.
 *
 * 1 star for meeting every required criterion (on a valid map), plus 1 per
 * passed optional criterion. An invalid map or any failed required criterion
 * earns 0.
 */
export function computeStarCount(criterionResults: CriterionResult[], mapIsValid: boolean): number {
	const allRequiredPass = criterionResults.every((cr) => !cr.required || cr.passed);
	if (!mapIsValid || !allRequiredPass) return 0;
	return 1 + criterionResults.filter((cr) => !cr.required && cr.passed).length;
}

/**
 * Maximum stars achievable for a scenario: 1 base + 1 per optional criterion.
 * Based on scenario structure, independent of the player's actual results.
 */
export function computeMaxStars(criterionResults: CriterionResult[]): number {
	return 1 + criterionResults.filter((cr) => !cr.required).length;
}

/**
 * Build synthetic CriterionResult rows for hard validity constraints that the
 * map violates (GAME-059). These are prepended to the result criteria list so
 * players can see exactly which structural issues need fixing.
 *
 * Pure: the caller passes the set of scenario success-criterion *types* so a
 * validity row can be suppressed when an equivalent success criterion already
 * surfaces the same failure (avoiding a duplicate row).
 */
export function buildValidityRows(
	validity: ValidityStats,
	scenarioCriterionTypes: ReadonlySet<string>,
): CriterionResult[] {
	const rows: CriterionResult[] = [];

	if (validity.unassignedCount > 0 && !scenarioCriterionTypes.has("district_count")) {
		rows.push({
			criterionId: "validity:all-assigned" as CriterionId,
			required: true,
			description: "All precincts must be assigned to a district",
			passed: false,
			detail: `${validity.unassignedCount} precinct(s) unassigned`,
		});
	}

	// Population balance is opt-in via a population_balance criterion (see
	// isMapSubmittable): when present it appears in evalResult already; when absent
	// it isn't a constraint. Either way there is no synthetic balance validity row.

	if (validity.contiguity !== null) {
		for (const [distId, ok] of validity.contiguity) {
			if (!ok) {
				rows.push({
					criterionId: `validity:contiguity-${distId}` as CriterionId,
					required: true,
					description: `District ${distId} must be contiguous`,
					passed: false,
					detail: `District ${distId} is split into disconnected pieces`,
				});
			}
		}
	}

	return rows;
}
