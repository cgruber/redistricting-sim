/**
 * Application entry point.
 * Wires together the Zustand store, D3 renderer, and DOM controls.
 * D3 owns the SVG DOM; Zustand owns state.
 */

import {
	MapRenderer,
	renderDistrictButtons,
	renderLegend,
	renderResults,
} from "./render/mapRenderer.js";
import { useGameStore, useTemporalStore } from "./store/gameStore.js";

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const svgEl = document.getElementById("map-svg") as SVGSVGElement | null;
const resultsEl = document.getElementById("results-container") as HTMLElement | null;
const legendEl = document.getElementById("legend-container") as HTMLElement | null;
const districtBtnsEl = document.getElementById("district-buttons") as HTMLElement | null;
const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement | null;
const btnRedo = document.getElementById("btn-redo") as HTMLButtonElement | null;
const btnViewToggle = document.getElementById("btn-view-toggle") as HTMLButtonElement | null;

if (
	svgEl === null ||
	resultsEl === null ||
	legendEl === null ||
	districtBtnsEl === null ||
	btnUndo === null ||
	btnRedo === null ||
	btnViewToggle === null
) {
	throw new Error("Required DOM elements not found");
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

const store = useGameStore;

const renderer = new MapRenderer(
	svgEl,
	() => store.getState(),
	(ids, district) => store.getState().paintStroke(ids, district),
	(id) => store.getState().setActiveDistrict(id),
);

// ─── Update cycle ─────────────────────────────────────────────────────────────

function updateUI() {
	const state = store.getState();
	const temporal = useTemporalStore();
	const { pastStates, futureStates } = temporal.getState();

	renderer.render();

	if (resultsEl !== null) {
		renderResults(resultsEl, state);
	}

	if (legendEl !== null) {
		renderLegend(legendEl, state.districtCount);
	}

	if (districtBtnsEl !== null) {
		renderDistrictButtons(districtBtnsEl, state.districtCount, state.activeDistrict, (id) => {
			store.getState().setActiveDistrict(id);
		});
	}

	if (btnUndo !== null) {
		btnUndo.disabled = pastStates.length === 0;
	}
	if (btnRedo !== null) {
		btnRedo.disabled = futureStates.length === 0;
	}
}

// ─── Undo / Redo buttons ─────────────────────────────────────────────────────

btnUndo.addEventListener("click", () => {
	useTemporalStore().getState().undo();
});

btnRedo.addEventListener("click", () => {
	useTemporalStore().getState().redo();
});

let currentViewMode: "districts" | "lean" = "districts";
btnViewToggle.addEventListener("click", () => {
	currentViewMode = currentViewMode === "districts" ? "lean" : "districts";
	renderer.setViewMode(currentViewMode);
	btnViewToggle.textContent =
		currentViewMode === "districts" ? "View: Partisan Lean" : "View: Districts";
});

// ─── Subscribe to state changes ───────────────────────────────────────────────

store.subscribe(() => updateUI());
useTemporalStore().subscribe(() => updateUI());

// ─── Initial render ───────────────────────────────────────────────────────────

updateUI();
