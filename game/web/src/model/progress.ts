/**
 * Player progress persistence (GAME-018 / GAME-007).
 *
 * Two concerns:
 *   1. Completion tracking — which scenarios the player has finished.
 *      Persisted under PROGRESS_KEY as JSON (GAME-018).
 *   2. In-progress WIP state — the current assignment map for an active
 *      scenario so the player can resume after a page reload (GAME-007).
 *      Persisted under WIP_KEY as JSON. One WIP at a time; overwritten
 *      when the player switches scenarios.
 *
 * Pure serialization functions take/return plain values — testable in Node
 * without mocking localStorage. The load/save/clear functions call
 * localStorage directly.
 */

const PROGRESS_KEY = "redistricting-sim-progress";
const WIP_KEY = "redistricting-sim-wip";

// ─── WIP types + I/O ─────────────────────────────────────────────────────────

export interface WipState {
	/** Which scenario the player was in the middle of */
	scenarioId: string;
	/**
	 * Serialized assignment map: precinct ID (as string key, JSON requirement)
	 * → district ID (number).
	 */
	assignments: Record<string, number>;
	/** Which district button was active when the state was saved */
	activeDistrict: number;
}

export function saveWip(wip: WipState): void {
	try {
		localStorage.setItem(WIP_KEY, JSON.stringify(wip));
	} catch {
		// storage unavailable (private browsing quota, etc.) — silently ignore
	}
}

export function loadWip(): WipState | null {
	try {
		const raw = localStorage.getItem(WIP_KEY);
		if (raw === null) return null;
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			typeof (parsed as { scenarioId?: unknown }).scenarioId === "string" &&
			typeof (parsed as { assignments?: unknown }).assignments === "object" &&
			(parsed as { assignments?: unknown }).assignments !== null &&
			typeof (parsed as { activeDistrict?: unknown }).activeDistrict === "number"
		) {
			return parsed as WipState;
		}
		return null;
	} catch {
		return null;
	}
}

export function clearWip(): void {
	try {
		localStorage.removeItem(WIP_KEY);
	} catch {
		// ignore
	}
}

// ─── Pure WIP reconciliation (GAME-106) ──────────────────────────────────────

/**
 * Reconcile a saved WIP assignment record against the freshly-seeded scenario
 * assignment map.
 *
 * WIP is keyed only by scenarioId, and scenarios are regenerated under the same
 * id, so a stale WIP can reference precinct ids / districts that no longer exist.
 * `flushWipSave` also drops null (unassigned) precincts — so a restore built from
 * the saved record alone is MISSING those keys, which makes
 * `computeValidityStats` undercount unassigned precincts (it counts `=== null`
 * over present keys; a missing key is never counted) and silently bypass the
 * "all precincts assigned" win-gate.
 *
 * This function fixes both: it starts from `base` (the full, freshly-seeded
 * scenario map — every precinct present, usually null) and overlays a saved
 * entry ONLY when the precinct id exists in `base` (drops stale precincts) AND
 * the district is an integer in `1..districtCount` (drops stale/out-of-range
 * districts). Every base precinct id is therefore present in the result, so
 * nulls are preserved and the unassigned count stays correct.
 *
 * @param base freshly-seeded scenario map (precinct id → district id | null)
 * @param saved serialized WIP record (string precinct id → district number)
 * @param districtCount number of districts in the loaded scenario
 */
export function reconcileWipAssignments(
	base: ReadonlyMap<number, number | null>,
	saved: Record<string, number>,
	districtCount: number,
): Map<number, number | null> {
	const result = new Map(base);
	for (const [key, value] of Object.entries(saved)) {
		const precinctId = Number(key);
		if (!result.has(precinctId)) continue; // stale precinct — not in this scenario
		if (!Number.isInteger(value) || value < 1 || value > districtCount) continue; // stale/out-of-range district
		result.set(precinctId, value);
	}
	return result;
}

/**
 * Clamp a saved active-district selection into the loaded scenario's range.
 * Returns `saved` when it is an integer in `1..districtCount`, else falls back
 * to district 1.
 */
export function clampActiveDistrict(saved: number, districtCount: number): number {
	if (Number.isInteger(saved) && saved >= 1 && saved <= districtCount) return saved;
	return 1;
}

// ─── Completion tracking ──────────────────────────────────────────────────────

export interface Progress {
	/** Set of scenario IDs that have been completed at least once */
	completed: string[];
}

// ─── Pure serialization ───────────────────────────────────────────────────────

export function serializeProgress(progress: Progress): string {
	return JSON.stringify({ completed: progress.completed });
}

export function deserializeProgress(json: string): Progress {
	try {
		const raw = JSON.parse(json) as unknown;
		if (
			typeof raw === "object" &&
			raw !== null &&
			"completed" in raw &&
			Array.isArray((raw as { completed: unknown }).completed)
		) {
			const arr = (raw as { completed: unknown[] }).completed;
			return { completed: arr.filter((x): x is string => typeof x === "string") };
		}
	} catch {
		// malformed JSON — return empty
	}
	return { completed: [] };
}

export function markCompleted(progress: Progress, scenarioId: string): Progress {
	if (progress.completed.includes(scenarioId)) return progress;
	return { completed: [...progress.completed, scenarioId] };
}

export function isCompleted(progress: Progress, scenarioId: string): boolean {
	return progress.completed.includes(scenarioId);
}

// ─── localStorage I/O ─────────────────────────────────────────────────────────

export function loadProgress(): Progress {
	try {
		const raw = localStorage.getItem(PROGRESS_KEY);
		if (raw === null) return { completed: [] };
		return deserializeProgress(raw);
	} catch {
		return { completed: [] };
	}
}

export function saveProgress(progress: Progress): void {
	try {
		localStorage.setItem(PROGRESS_KEY, serializeProgress(progress));
	} catch {
		// storage quota exceeded or private browsing — silently ignore
	}
}
