/**
 * Player progress persistence (GAME-018).
 *
 * Tracks which scenario IDs the player has completed. Persisted to
 * localStorage under STORAGE_KEY as JSON.
 *
 * Pure serialization functions (serializeProgress / deserializeProgress)
 * take/return plain values — testable in Node without mocking localStorage.
 * The loadProgress / saveProgress functions call localStorage directly.
 */

const STORAGE_KEY = "redistricting-sim-progress";

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
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return { completed: [] };
		return deserializeProgress(raw);
	} catch {
		return { completed: [] };
	}
}

export function saveProgress(progress: Progress): void {
	try {
		localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
	} catch {
		// storage quota exceeded or private browsing — silently ignore
	}
}
