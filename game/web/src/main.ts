/**
 * Application entry point.
 * Fetches tutorial-001.json, validates it through loadScenario(), builds the
 * Zustand store, wires D3 renderer and DOM controls.
 *
 * The WASM kernel (Rust → wasm-bindgen no-modules) is loaded by index.html
 * before this bundle. The global wasm_bindgen object is declared below.
 */

// WASM kernel — provided by wasm_calc_bindgen.js (no-modules target).
// index.html initialises the WASM binary before this bundle executes.
declare const wasm_bindgen: { add(a: number, b: number): number };

import { loadScenario } from "./model/loader.js";
import type { Scenario } from "./model/scenario.js";
import {
	type MapRenderer,
	type ViewMode,
	SvgMapRenderer,
	renderDistrictButtons,
	renderLegend,
	renderResults,
	renderValidityPanel,
} from "./render/mapRenderer.js";
import { createGameStore } from "./store/gameStore.js";

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const svgEl = document.getElementById("map-svg") as SVGSVGElement | null;
const resultsEl = document.getElementById("results-container") as HTMLElement | null;
const validityEl = document.getElementById("validity-container") as HTMLElement | null;
const legendEl = document.getElementById("legend-container") as HTMLElement | null;
const districtBtnsEl = document.getElementById("district-buttons") as HTMLElement | null;
const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement | null;
const btnRedo = document.getElementById("btn-redo") as HTMLButtonElement | null;
const btnViewToggle = document.getElementById("btn-view-toggle") as HTMLButtonElement | null;
const btnCountyToggle = document.getElementById("btn-county-toggle") as HTMLButtonElement | null;
const btnReset = document.getElementById("btn-reset") as HTMLButtonElement | null;
const resetConfirm = document.getElementById("reset-confirm") as HTMLElement | null;
const btnResetConfirm = document.getElementById("btn-reset-confirm") as HTMLButtonElement | null;
const btnResetCancel = document.getElementById("btn-reset-cancel") as HTMLButtonElement | null;

if (
	svgEl === null ||
	resultsEl === null ||
	validityEl === null ||
	legendEl === null ||
	districtBtnsEl === null ||
	btnUndo === null ||
	btnRedo === null ||
	btnViewToggle === null ||
	btnCountyToggle === null ||
	btnReset === null ||
	resetConfirm === null ||
	btnResetConfirm === null ||
	btnResetCancel === null
) {
	throw new Error("Required DOM elements not found");
}

// ─── WASM kernel diagnostic ───────────────────────────────────────────────────
// Verifies the Rust→WASM pipeline is wired end-to-end.
// wasm_bindgen is initialised by index.html before this bundle runs.

const wasmEl = document.getElementById("wasm-status");
if (wasmEl !== null) {
	wasmEl.textContent = `WASM kernel: add(2, 3) = ${wasm_bindgen.add(2, 3)}`;
}

// ─── Async init ───────────────────────────────────────────────────────────────

(async () => {
	// ── Load scenario JSON ────────────────────────────────────────────────────
	let json: unknown;
	try {
		const resp = await fetch("/scenarios/tutorial-001.json");
		if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
		json = (await resp.json()) as unknown;
	} catch (e) {
		console.error("[GAME-005] Failed to fetch scenario:", e);
		document.body.insertAdjacentHTML(
			"afterbegin",
			`<div style="color:#e94560;padding:1em;font-family:monospace">
        Scenario load failed — check console for details.
      </div>`,
		);
		return;
	}

	// ── Validate + parse ──────────────────────────────────────────────────────
	let scenario: Scenario;
	try {
		scenario = loadScenario(json);
	} catch (e) {
		console.error("[GAME-005] Scenario validation failed:", e);
		document.body.insertAdjacentHTML(
			"afterbegin",
			`<div style="color:#e94560;padding:1em;font-family:monospace">
        Scenario validation failed — check console for details.
      </div>`,
		);
		return;
	}

	// ── Build store from scenario ─────────────────────────────────────────────
	const { store } = createGameStore(scenario);
	const temporalStore = store.temporal;

	// ── Create renderer ───────────────────────────────────────────────────────
	const renderer: MapRenderer = new SvgMapRenderer(
		svgEl!,
		() => store.getState(),
		(ids, district) => store.getState().paintStroke(ids, district),
		(id) => store.getState().setActiveDistrict(id),
	);

	// ── Update cycle ──────────────────────────────────────────────────────────
	function updateUI() {
		const state = store.getState();
		const { pastStates, futureStates } = temporalStore.getState();

		renderer.render();

		renderResults(resultsEl!, state);
		renderValidityPanel(validityEl!, state, scenario.rules);
		renderLegend(legendEl!, state.districtCount);
		renderDistrictButtons(districtBtnsEl!, state.districtCount, state.activeDistrict, (id) => {
			store.getState().setActiveDistrict(id);
		});

		btnUndo!.disabled = pastStates.length === 0;
		btnRedo!.disabled = futureStates.length === 0;
	}

	// ── Undo / Redo buttons ───────────────────────────────────────────────────
	btnUndo!.addEventListener("click", () => {
		temporalStore.getState().undo();
	});

	btnRedo!.addEventListener("click", () => {
		temporalStore.getState().redo();
	});

	// ── View toggle ───────────────────────────────────────────────────────────
	let currentViewMode: ViewMode = "districts";
	btnViewToggle!.addEventListener("click", () => {
		currentViewMode = currentViewMode === "districts" ? "lean" : "districts";
		renderer.setViewMode(currentViewMode);
		btnViewToggle!.textContent =
			currentViewMode === "districts" ? "Switch to Partisan Lean" : "Switch to Districts";
	});

	// ── County border toggle (GAME-012) ───────────────────────────────────────
	let countyBordersVisible = false;
	btnCountyToggle!.addEventListener("click", () => {
		countyBordersVisible = !countyBordersVisible;
		renderer.setCountyBordersVisible(countyBordersVisible);
		btnCountyToggle!.textContent = countyBordersVisible ? "Hide County Borders" : "Show County Borders";
		btnCountyToggle!.classList.toggle("active", countyBordersVisible);
	});

	// ── Reset ─────────────────────────────────────────────────────────────────
	btnReset!.addEventListener("click", () => {
		resetConfirm!.classList.add("visible");
		btnReset!.disabled = true;
	});

	btnResetCancel!.addEventListener("click", () => {
		resetConfirm!.classList.remove("visible");
		btnReset!.disabled = false;
	});

	btnResetConfirm!.addEventListener("click", () => {
		store.getState().resetToInitial();
		temporalStore.getState().clear();
		resetConfirm!.classList.remove("visible");
		btnReset!.disabled = false;
	});


	// ── Subscribe to state changes ────────────────────────────────────────────
	store.subscribe(() => updateUI());
	temporalStore.subscribe(() => updateUI());

	// ── Initial render ────────────────────────────────────────────────────────
	updateUI();
})();
