/**
 * Zustand store with zundo undo/redo middleware.
 *
 * State mutations only inside set() callbacks — never mutate state objects directly.
 * Undo/redo tracks assignment diffs (not full state snapshots) via zundo's temporal store.
 */

import { temporal } from "zundo";
import { createStore } from "zustand/vanilla";
import { generatePrecincts } from "../model/generator.js";
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
}

// ─── Initial state ───────────────────────────────────────────────────────────

function buildInitialState(): GameState {
	const precincts = generatePrecincts(42);
	const assignments: AssignmentMap = new Map();
	// Initialise all precincts as unassigned
	for (const p of precincts) {
		assignments.set(p.id, null);
	}

	// Assign first half to district 1, second half to district 2 as starting point
	// (so the user has something to work with immediately)
	const half = Math.floor(precincts.length / 2);
	for (let i = 0; i < precincts.length; i++) {
		const p = precincts[i];
		if (p !== undefined) {
			assignments.set(p.id, i < half ? 1 : 2);
		}
	}

	const initialState: GameState = {
		precincts,
		districtCount: 4,
		assignments,
		activeDistrict: 1,
		simulationResult: null,
	};

	// Run initial simulation
	initialState.simulationResult = runElection(initialState);
	return initialState;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clone an AssignmentMap (Map is reference-typed; we need immutable updates) */
function cloneAssignments(m: AssignmentMap): AssignmentMap {
	return new Map(m);
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGameStore = createStore<GameStore>()(
	temporal(
		(set, get) => ({
			...buildInitialState(),

			setActiveDistrict(id: DistrictId) {
				set({ activeDistrict: id });
			},

			paintPrecinct(precinctId: number) {
				const { assignments, activeDistrict } = get();
				const current = assignments.get(precinctId);
				if (current === activeDistrict) return; // no-op

				const next = cloneAssignments(assignments);
				next.set(precinctId, activeDistrict);
				const partial: Pick<GameState, "assignments"> & {
					simulationResult: GameState["simulationResult"];
				} = {
					assignments: next,
					simulationResult: runElection({ ...get(), assignments: next }),
				};
				set(partial);
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
				const nextState = { ...get(), assignments: next };
				set({
					assignments: next,
					simulationResult: runElection(nextState),
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

/** Access the temporal (undo/redo) API */
export const useTemporalStore = () => useGameStore.temporal;
