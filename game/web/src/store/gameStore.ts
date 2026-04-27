/**
 * Zustand store with zundo undo/redo middleware.
 *
 * State mutations only inside set() callbacks — never mutate state objects directly.
 * Undo/redo tracks assignment diffs (not full state snapshots) via zundo's temporal store.
 *
 * GAME-005: Store is no longer created at module load. Call createGameStore(scenario)
 * after loading and validating the scenario JSON.
 */

import { temporal } from "zundo";
import { createStore } from "zustand/vanilla";
import { scenarioToSpike } from "../model/adapter.js";
import type { Scenario } from "../model/scenario.js";
import type { AssignmentMap, DistrictId, GameState } from "../model/types.js";
import { runElection } from "../simulation/election.js";

// ─── Store shape ─────────────────────────────────────────────────────────────

export interface GameStore extends GameState {
	/** Set the active district being painted */
	setActiveDistrict: (id: DistrictId) => void;
	/** Assign a single precinct to the active district; triggers re-simulation */
	paintPrecinct: (precinctId: number) => void;
	/** Assign a batch of precincts (one brush stroke) as a single undo step */
	paintStroke: (precinctIds: number[], district: DistrictId) => void;
	/** Restore all assignments to the scenario's initial state */
	resetToInitial: () => void;
	/** Restore a previously saved assignment map (e.g. from WIP storage) */
	restoreAssignments: (assignments: AssignmentMap, activeDistrict: DistrictId) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clone an AssignmentMap (Map is reference-typed; we need immutable updates) */
function cloneAssignments(m: AssignmentMap): AssignmentMap {
	return new Map(m);
}

// ─── Store factory ───────────────────────────────────────────────────────────

/**
 * Create a new game store from a loaded Scenario.
 * Called once in main.ts after fetching + validating the scenario JSON.
 */
export function createGameStore(scenario: Scenario) {
	const { precincts, assignments, districtCount } = scenarioToSpike(scenario);

	// Snapshot of initial assignments — used by resetToInitial() to restore scenario start state
	const initialAssignments: AssignmentMap = new Map(assignments);

	const initialState: GameState = {
		precincts,
		districtCount,
		assignments,
		activeDistrict: 1,
		simulationResult: null,
	};
	initialState.simulationResult = runElection(initialState);

	const store = createStore<GameStore>()(
		temporal(
			(set, get) => ({
				...initialState,

				setActiveDistrict(id: DistrictId) {
					set({ activeDistrict: id });
				},

				paintPrecinct(precinctId: number) {
					const { assignments, activeDistrict } = get();
					const current = assignments.get(precinctId);
					if (current === activeDistrict) return; // no-op

					const next = cloneAssignments(assignments);
					next.set(precinctId, activeDistrict);
					set({
						assignments: next,
						simulationResult: runElection({ ...get(), assignments: next }),
					});
				},

				paintStroke(precinctIds: number[], district: DistrictId) {
					if (precinctIds.length === 0) return;
					const { assignments } = get();
					const next = cloneAssignments(assignments);
					let changed = false;
					for (const id of precinctIds) {
						if (next.get(id) !== district) {
							next.set(id, district);
							changed = true;
						}
					}
					if (!changed) return;
					set({
						assignments: next,
						simulationResult: runElection({ ...get(), assignments: next }),
					});
				},

				resetToInitial() {
					const restored = new Map(initialAssignments);
					set({
						assignments: restored,
						simulationResult: runElection({ ...get(), assignments: restored }),
					});
				},

				restoreAssignments(assignments: AssignmentMap, activeDistrict: DistrictId) {
					const restored = new Map(assignments);
					set({
						assignments: restored,
						activeDistrict,
						simulationResult: runElection({ ...get(), assignments: restored }),
					});
				},
			}),
			{
				// zundo: equality check — prevents storing a new history entry if assignments unchanged
				equality: (a: GameStore, b: GameStore) => {
					if (a.assignments === b.assignments) return true;
					if (a.assignments.size !== b.assignments.size) return false;
					for (const [k, v] of a.assignments) {
						if (b.assignments.get(k) !== v) return false;
					}
					return true;
				},
			},
		),
	);

	return { store };
}
