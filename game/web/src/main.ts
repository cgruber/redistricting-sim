/**
 * Application entry point.
 * Fetches the active scenario JSON on demand (chosen via URL ?s= param or
 * manifest position), validates it through loadScenario(), builds the Zustand
 * store, wires D3 renderer and DOM controls.
 *
 * The WASM kernel (Rust → wasm-bindgen no-modules) is loaded by index.html
 * before this bundle executes.
 */

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
import {
	loadProgress,
	saveProgress,
	markCompleted,
	isCompleted,
	loadWip,
	saveWip,
	clearWip,
	type WipState,
} from "./model/progress.js";

// ─── Scenario manifest (GAME-021) ─────────────────────────────────────────────
// Static list of all available scenarios in play order.
// Add an entry here + drop the JSON in /scenarios/ to wire a new scenario.

const SCENARIO_MANIFEST = [
	{ id: "tutorial-002", title: "Millbrook County: Three-District Challenge" },
	{ id: "scenario-002", title: "Clearwater County: The Governor's Map" },
	{ id: "scenario-003", title: "Riverport: The Packing Problem" },
	{ id: "scenario-004", title: "Lakeview: Cracking the Opposition" },
	{ id: "scenario-005", title: "Valle Verde: A Voice for the Valley" },
] as const;

type ManifestEntry = (typeof SCENARIO_MANIFEST)[number];

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
	mainEl === null
) {
	throw new Error("Required DOM elements not found");
}

// ─── Async init ───────────────────────────────────────────────────────────────

(async () => {
	let progress = loadProgress();

	// ── Scenario select screen (GAME-018 / GAME-021) ──────────────────────────
	// Rendered from the static manifest + localStorage progress.
	// Card clicks navigate to /?s=<id> so the page reloads cleanly with the
	// chosen scenario — avoids tearing down and rebuilding store + renderer in-place.

	function renderScenarioCards() {
		if (!scenarioCardsEl) return;
		const wip = loadWip();
		scenarioCardsEl.innerHTML = "";
		SCENARIO_MANIFEST.forEach((entry, i) => {
			const completed = isCompleted(progress, entry.id);
			const unlocked = i === 0 || isCompleted(progress, SCENARIO_MANIFEST[i - 1]?.id ?? "");
			const locked = !unlocked;
			const inProgress = !completed && wip?.scenarioId === entry.id;

			const card = document.createElement("div");
			card.className = `scenario-card${locked ? " locked" : ""}`;

			const titleEl = document.createElement("div");
			titleEl.className = "sc-title";
			titleEl.textContent = entry.title;

			const statusEl = document.createElement("div");
			const statusLabel = completed ? "Completed" : inProgress ? "In Progress" : unlocked ? "Ready" : "Locked";
			const statusClass = completed ? "completed" : inProgress ? "in-progress" : unlocked ? "unlocked" : "locked";
			statusEl.className = `sc-status ${statusClass}`;
			statusEl.textContent = statusLabel;

			const playBtn = document.createElement("button");
			playBtn.className = `sc-play-btn ${completed ? "replay" : inProgress ? "continue" : unlocked ? "play" : "locked-btn"}`;
			playBtn.textContent = completed ? "Play Again" : inProgress ? "Continue" : unlocked ? "Play" : "Locked";
			playBtn.disabled = locked;
			if (!locked) {
				playBtn.addEventListener("click", () => {
					window.location.assign(`/?s=${entry.id}`);
				});
			}

			card.appendChild(titleEl);
			card.appendChild(statusEl);
			card.appendChild(playBtn);
			scenarioCardsEl.appendChild(card);
		});
	}

	function showScenarioSelect() {
		renderScenarioCards();
		scenarioSelectEl?.classList.remove("hidden");
	}

	// ── Startup routing (GAME-021) ────────────────────────────────────────────
	// Priority: explicit ?s= param > returning-player select screen > first scenario.

	const urlParams = new URLSearchParams(window.location.search);
	const requestedId = urlParams.get("s") ?? "";
	const requestedEntry: ManifestEntry | undefined = SCENARIO_MANIFEST.find(
		(e) => e.id === requestedId,
	);

	let entryToLoad: ManifestEntry;
	if (requestedEntry !== undefined) {
		// Explicit scenario requested via URL — play it directly
		entryToLoad = requestedEntry;
	} else if (progress.completed.length > 0 || loadWip() !== null) {
		// Returning player (has completed or in-progress scenario) — show select screen
		showScenarioSelect();
		return;
	} else {
		// New player — start with the first scenario
		entryToLoad = SCENARIO_MANIFEST[0];
	}

	// ── Fetch + validate scenario JSON ────────────────────────────────────────
	let json: unknown;
	try {
		const resp = await fetch(`/scenarios/${entryToLoad.id}.json`);
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

	// Expose store for e2e tests on localhost — lets tests call paintStroke/setActiveDistrict
	// without simulating individual mouse events on every precinct.
	// Gated to localhost so production deployments do not expose a solve shortcut.
	if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
		(window as unknown as Record<string, unknown>)["__gameStore"] = store;
	}

	// ── WIP save/restore (GAME-007) ───────────────────────────────────────────

	// isRestoringWip prevents scheduleWipSave() from firing during the restore call.
	// (store.subscribe is wired later, so this guard is defensive — it makes the
	// invariant explicit regardless of future code reordering.)
	let isRestoringWip = false;
	let wipTimer: ReturnType<typeof setTimeout> | null = null;

	// Restore in-progress state from a previous session if it matches this scenario.
	const savedWip = loadWip();
	if (savedWip !== null && savedWip.scenarioId === scenario.id) {
		isRestoringWip = true;
		const restoredMap = new Map<number, number | null>(
			Object.entries(savedWip.assignments).map(([k, v]) => [Number(k), v]),
		);
		store.getState().restoreAssignments(restoredMap, savedWip.activeDistrict);
		// Wipe undo history so the player doesn't undo back before the restored state.
		temporalStore.getState().clear();
		isRestoringWip = false;
	}
	function scheduleWipSave() {
		if (isRestoringWip) return;
		if (wipTimer !== null) clearTimeout(wipTimer);
		wipTimer = setTimeout(() => {
			wipTimer = null;
			const { assignments, activeDistrict } = store.getState();
			const assignmentsRecord: Record<string, number> = {};
			for (const [k, v] of assignments) {
				if (v !== null) assignmentsRecord[String(k)] = v;
			}
			const wip: WipState = {
				scenarioId: scenario.id,
				assignments: assignmentsRecord,
				activeDistrict,
			};
			saveWip(wip);
		}, 800);
	}

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

		const validity = computeValidityStats(
			state.precincts,
			state.assignments,
			state.districtCount,
			scenario.rules,
		);
		btnSubmit!.disabled = !isMapSubmittable(validity, scenario.rules);
	}

	// ── Intro screen (GAME-016) ───────────────────────────────────────────────
	// AbortController lets startScenarioIntro() be safely called multiple times:
	// each call cancels the previous intro's event listeners before re-wiring.
	let introController: AbortController | null = null;

	function showEditor() {
		introController?.abort();
		introController = null;
		introScreen?.classList.add("hidden");
		appHeader!.style.display = "";
		mainEl!.style.display = "";
	}

	function startScenarioIntro() {
		const slides = scenario.narrative?.intro_slides ?? [];

		if (slides.length === 0 || introScreen === null) {
			showEditor();
			return;
		}

		introController?.abort();
		introController = new AbortController();
		const { signal } = introController;

		const { character, objective } = scenario.narrative!;
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
		introScreen.classList.remove("hidden");

		btnIntroPrev?.addEventListener("click", () => {
			if (currentSlide > 0) renderSlide(--currentSlide);
		}, { signal });
		btnIntroNext?.addEventListener("click", () => {
			if (currentSlide < slides.length - 1) renderSlide(++currentSlide);
		}, { signal });
		const startHandler = () => showEditor();
		btnIntroStart?.addEventListener("click", startHandler, { signal });
		btnIntroSkip?.addEventListener("click", startHandler, { signal });
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Escape") showEditor();
		}, { signal });
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
			scenario.precincts,
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

		// ── GAME-018: persist completion on pass ──────────────────────────────────
		if (evalResult.overallPass) {
			progress = markCompleted(progress, scenario.id);
			saveProgress(progress);
			// GAME-007: clear the WIP for this scenario — it's done.
			clearWip();
		}

		resultScreen.classList.remove("hidden");
	}

	btnSubmit!.addEventListener("click", () => {
		showResultScreen();
	});

	btnKeepDrawing!.addEventListener("click", () => {
		resultScreen!.classList.add("hidden");
	});

	// "Next Scenario" → navigate back to root so routing re-evaluates with
	// updated progress and shows the select screen (or next unlocked scenario).
	btnNextScenario!.addEventListener("click", () => {
		window.location.assign("/");
	});

	// ── Subscribe to state changes ────────────────────────────────────────────
	store.subscribe(() => {
		updateUI();
		scheduleWipSave();
	});
	temporalStore.subscribe(() => updateUI());

	// ── Initial render + intro ────────────────────────────────────────────────
	updateUI();
	startScenarioIntro();
})();
