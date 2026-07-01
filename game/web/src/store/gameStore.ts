/**
 * Zustand store with zundo undo/redo middleware.
 *
 * State mutations only inside set() callbacks — never mutate state objects directly.
 * Undo/redo (zundo temporal store) snapshots only the assignments map (plus the
 * simulationResult consistent with it), via `partialize`. A new history entry is
 * recorded only when assignments actually change (the `equality` gate), and the
 * undo stack is capped at `limit` entries. Because snapshots exclude
 * `activeDistrict`, undo/redo restores assignments without disturbing the
 * player's current brush selection.
 *
 * GAME-005: Store is no longer created at module load. Call createGameStore(scenario)
 * after loading and validating the scenario JSON.
 */

import { temporal } from "zundo";
import { createStore } from "zustand/vanilla";
import { scenarioToRuntime } from "../model/adapter.js";
import type { Scenario } from "../model/scenario.js";
import type { AssignmentMap, DistrictId, GameState } from "../model/runtime.js";
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
	const { precincts, parties, assignments, districtCount, terrainTiles, riverEdges } =
		scenarioToRuntime(scenario);

	// Snapshot of initial assignments — used by resetToInitial() to restore scenario start state
	const initialAssignments: AssignmentMap = new Map(assignments);

	const initialState: GameState = {
		precincts,
		parties,
		districtCount,
		assignments,
		activeDistrict: 1,
		simulationResult: null,
		terrainTiles,
		riverEdges,
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
				// Snapshot only assignments (+ the consistent simulationResult) so undo/redo
				// never reverts the active district / brush selection. zustand merge-set
				// preserves the rest of state (activeDistrict, precincts, …).
				// INVARIANT (load-bearing): simulationResult is written in the SAME set() as
				// assignments — paint, restoreAssignments, and reset all recompute it via
				// runElection on the assignments path — so each snapshot's result matches its
				// board and undo restores a consistent pair. A future independent
				// simulationResult write would desync undo; keep it on the assignments path
				// or drop it from partialize.
				partialize: (state) => ({
					assignments: state.assignments,
					simulationResult: state.simulationResult,
				}),
				// Cap history so long sessions don't grow the undo stack unboundedly.
				limit: 100,
				// zundo: equality check — prevents storing a new history entry if assignments unchanged.
				// With partialize present, the args are the partialized shape.
				equality: (a: { assignments: AssignmentMap }, b: { assignments: AssignmentMap }) => {
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
