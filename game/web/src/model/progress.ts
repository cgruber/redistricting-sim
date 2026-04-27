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
