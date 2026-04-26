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
import { evaluateCriteria, isMapSubmittable } from "./simulation/evaluate.js";
import { computeValidityStats } from "./simulation/validity.js";
import { loadProgress, saveProgress, markCompleted, isCompleted } from "./model/progress.js";

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
const appHeader = document.getElementById("app-header") as HTMLElement | null;
const mainEl = document.getElementById("main") as HTMLElement | null;
const wasmStatusBar = document.getElementById("wasm-status-bar") as HTMLElement | null;

// Scenario select refs (GAME-018)
const scenarioSelectEl = document.getElementById("scenario-select") as HTMLElement | null;
const scenarioCardsEl = document.getElementById("scenario-cards") as HTMLElement | null;

// Submit + result screen refs (GAME-017)
const btnSubmit = document.getElementById("btn-submit") as HTMLButtonElement | null;
const resultScreen = document.getElementById("result-screen") as HTMLElement | null;
const resultVerdict = document.getElementById("result-verdict") as HTMLElement | null;
const resultSubtitle = document.getElementById("result-subtitle") as HTMLElement | null;
const resultCriteriaList = document.getElementById("result-criteria-list") as HTMLElement | null;
const btnKeepDrawing = document.getElementById("btn-keep-drawing") as HTMLButtonElement | null;
const btnNextScenario = document.getElementById("btn-next-scenario") as HTMLButtonElement | null;

// Intro screen refs (GAME-016)
const introScreen = document.getElementById("intro-screen") as HTMLElement | null;
const charNameEl = document.getElementById("char-name") as HTMLElement | null;
const charRoleEl = document.getElementById("char-role") as HTMLElement | null;
const charMotivationEl = document.getElementById("char-motivation") as HTMLElement | null;
const introSlideHeading = document.getElementById("intro-slide-heading") as HTMLElement | null;
const introSlideBody = document.getElementById("intro-slide-body") as HTMLElement | null;
const objectiveText = document.getElementById("objective-text") as HTMLElement | null;
const introProgress = document.getElementById("intro-progress") as HTMLElement | null;
const btnIntroPrev = document.getElementById("btn-intro-prev") as HTMLButtonElement | null;
const btnIntroNext = document.getElementById("btn-intro-next") as HTMLButtonElement | null;
const btnIntroStart = document.getElementById("btn-intro-start") as HTMLButtonElement | null;
const btnIntroSkip = document.getElementById("btn-intro-skip") as HTMLButtonElement | null;

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
	btnResetCancel === null ||
	appHeader === null ||
	mainEl === null ||
	wasmStatusBar === null
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

	// ── Intro screen (GAME-016) ───────────────────────────────────────────────
	const slides = scenario.narrative?.intro_slides ?? [];

	// escHandler declared here so showEditor() can remove it regardless of
	// which dismissal path (Start Drawing, Skip, or Escape) fires first.
	let escHandler: ((e: KeyboardEvent) => void) | null = null;

	function showEditor() {
		if (escHandler !== null) {
			document.removeEventListener("keydown", escHandler);
			escHandler = null;
		}
		introScreen?.classList.add("hidden");
		appHeader!.style.display = "";
		mainEl!.style.display = "";
		wasmStatusBar!.style.display = "";
	}

	if (slides.length === 0 || introScreen === null) {
		// No narrative slides — go straight to editor
		showEditor();
	} else {
		const { character, objective } = scenario.narrative!;

		// Populate static character info
		if (charNameEl) charNameEl.textContent = character.name;
		if (charRoleEl) charRoleEl.textContent = character.role;
		if (charMotivationEl) charMotivationEl.textContent = character.motivation ?? "";
		if (objectiveText) objectiveText.textContent = objective;

		let currentSlide = 0;

		function renderSlide(index: number) {
			const slide = slides[index];
			if (!slide) return;
			if (introSlideHeading) introSlideHeading.textContent = slide.heading ?? "";
			if (introSlideBody) introSlideBody.textContent = slide.body;
			if (introProgress) introProgress.textContent = `${index + 1} / ${slides.length}`;

			if (btnIntroPrev) btnIntroPrev.disabled = index === 0;

			const isLast = index === slides.length - 1;
			if (btnIntroNext) btnIntroNext.style.display = isLast ? "none" : "";
			if (btnIntroStart) btnIntroStart.classList.toggle("visible", isLast);
		}

		renderSlide(0);

		btnIntroPrev?.addEventListener("click", () => {
			if (currentSlide > 0) renderSlide(--currentSlide);
		});

		btnIntroNext?.addEventListener("click", () => {
			if (currentSlide < slides.length - 1) renderSlide(++currentSlide);
		});

		const startHandler = () => showEditor();
		btnIntroStart?.addEventListener("click", startHandler);
		btnIntroSkip?.addEventListener("click", startHandler);

		// Escape key skips intro; cleaned up by showEditor() on any dismissal path
		escHandler = (e: KeyboardEvent) => {
			if (e.key === "Escape") showEditor();
		};
		document.addEventListener("keydown", escHandler);
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

	// ── Party ID → spike PartyKey mapping (for criteria evaluation) ──────────
	// First scenario party → "R", second → "D", rest → "L"/"G"/"I"
	const SPIKE_PARTY_KEYS = ["R", "D", "L", "G", "I"] as const;
	const partyIdToKey = new Map<string, string>();
	scenario.parties.forEach((p, i) => {
		partyIdToKey.set(p.id, SPIKE_PARTY_KEYS[i] ?? "I");
	});

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

		// Enable Submit only when the map meets all hard validity constraints
		const validity = computeValidityStats(
			state.precincts,
			state.assignments,
			state.districtCount,
			scenario.rules,
		);
		btnSubmit!.disabled = !isMapSubmittable(validity, scenario.rules);
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

	// ── Submit / Evaluation (GAME-017) ────────────────────────────────────────
	function showResultScreen() {
		if (!resultScreen || !resultVerdict || !resultSubtitle || !resultCriteriaList) return;

		const state = store.getState();
		if (state.simulationResult === null) return;

		const validity = computeValidityStats(
			state.precincts,
			state.assignments,
			state.districtCount,
			scenario.rules,
		);
		const evalResult = evaluateCriteria(
			scenario.success_criteria,
			validity,
			state.simulationResult,
			scenario.rules,
			state.precincts,
			state.assignments,
			state.districtCount,
			partyIdToKey,
		);

		resultVerdict.textContent = evalResult.overallPass ? "Map Passed!" : "Map Failed";
		resultVerdict.className = evalResult.overallPass ? "pass" : "fail";
		resultSubtitle.textContent = evalResult.overallPass
			? "All required criteria met."
			: "One or more required criteria were not met.";

		resultCriteriaList.innerHTML = "";
		for (const cr of evalResult.criterionResults) {
			const cls = cr.passed
				? "passed"
				: cr.required
					? "failed-required"
					: "failed-optional";

			const row = document.createElement("div");
			row.className = `result-criterion ${cls}`;

			const iconEl = document.createElement("span");
			iconEl.className = "rc-icon";
			iconEl.textContent = cr.passed ? "✓" : "✗";

			const body = document.createElement("div");
			body.className = "rc-body";

			const desc = document.createElement("div");
			desc.className = "rc-desc";
			desc.textContent = cr.description;
			body.appendChild(desc);

			if (cr.detail) {
				const detail = document.createElement("div");
				detail.className = "rc-detail";
				detail.textContent = cr.detail;
				body.appendChild(detail);
			}

			const badge = document.createElement("span");
			badge.className = "rc-badge";
			badge.textContent = cr.passed ? "PASS" : cr.required ? "FAIL" : "OPTIONAL";

			row.appendChild(iconEl);
			row.appendChild(body);
			row.appendChild(badge);
			resultCriteriaList.appendChild(row);
		}

		btnKeepDrawing!.style.display = "";
		btnNextScenario!.style.display = evalResult.overallPass ? "" : "none";

		resultScreen.classList.remove("hidden");
	}

	btnSubmit!.addEventListener("click", () => {
		showResultScreen();
	});

	btnKeepDrawing!.addEventListener("click", () => {
		resultScreen!.classList.add("hidden");
	});

	// "Next Scenario" is a placeholder until GAME-018 adds the select screen
	btnNextScenario!.addEventListener("click", () => {
		resultScreen!.classList.add("hidden");
	});

	// ── Subscribe to state changes ────────────────────────────────────────────
	store.subscribe(() => updateUI());
	temporalStore.subscribe(() => updateUI());

	// ── Initial render ────────────────────────────────────────────────────────
	updateUI();
})();
