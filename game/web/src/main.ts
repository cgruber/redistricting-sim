/**
 * Application entry point.
 * Wires together the Zustand store, D3 renderer, and DOM controls.
 * D3 owns the SVG DOM; Zustand owns state.
 *
 * The WASM kernel (Rust → wasm-bindgen no-modules) is loaded by index.html
 * before this bundle. The global wasm_bindgen object is declared below.
 */

// WASM kernel — provided by wasm_calc_bindgen.js (no-modules target).
// index.html initialises the WASM binary before this bundle executes.
declare const wasm_bindgen: { add(a: number, b: number): number };

import {
	type MapRenderer,
	type ViewMode,
	SvgMapRenderer,
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

const renderer: MapRenderer = new SvgMapRenderer(
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

let currentViewMode: ViewMode = "districts";
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

// ─── WASM kernel diagnostic ───────────────────────────────────────────────────
// Verifies the Rust→WASM pipeline is wired end-to-end.
// wasm_bindgen is initialised by index.html before this bundle runs.

const wasmEl = document.getElementById("wasm-status");
if (wasmEl !== null) {
	wasmEl.textContent = `WASM kernel: add(2, 3) = ${wasm_bindgen.add(2, 3)}`;
}
