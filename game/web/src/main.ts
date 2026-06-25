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
import type { Scenario, CriterionId, CharacterType, Criterion } from "./model/scenario.js";
import { type MapRenderer, type ViewMode, SvgMapRenderer } from "./render/mapRenderer.js";
import {
	renderDistrictButtons,
	renderResults,
	renderValidityPanel,
} from "./render/panels.js";
import { startTutorialOverlay } from "./tutorial/overlay.js";
import { createGameStore } from "./store/gameStore.js";
import {
	evaluateCriteria,
	isMapSubmittable,
	computeDistrictGroupShares,
	groupFilterLabel,
	type CriterionResult,
	type DistrictDemoStat,
} from "./simulation/evaluate.js";
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
import { CAMPAIGN_REGISTRY, getCampaign, loadLastPlayedScenario, saveLastPlayedScenario } from "./model/campaigns.js";
import { initAssets, assetUrl } from "./assets.js";
import { getCriterionIcon } from "./criterion-icons.js";
import { preload, play, setMuted, isMuted } from "./audio/audioPlayer.js";

// ─── Scenario manifest (GAME-021) ─────────────────────────────────────────────
// Static list of all available scenarios in play order.
// Add an entry here + drop the JSON in /scenarios/ to wire a new scenario.

const SCENARIO_MANIFEST = [
	{ id: "tutorial-002", title: "A Legal Map: Millbrook County" },
	{ id: "scenario-002", title: "Clearwater Valley: The Governor's Map" },
	{ id: "scenario-003", title: "Riverport: The Packing Problem" },
	{ id: "scenario-004", title: "Lakeview: Cracking the Opposition" },
	{ id: "scenario-005", title: "Valle Verde: A Voice for the Valley" },
	{ id: "scenario-006", title: "Harden the Map" },
	{ id: "scenario-007", title: "The Reform Map" },
	{ id: "scenario-008", title: "Both Sides Unhappy" },
	{ id: "scenario-009", title: "Cats vs. Dogs" },
	{ id: "tutorial-003", title: "Hawthorn Bend: Reading the Vote" },
	{ id: "tutorial-004", title: "Fairhaven: Putting It Together" },
] as const;

type ManifestEntry = (typeof SCENARIO_MANIFEST)[number];

// Scenarios that exist as JSON + content but are only reachable via a campaign (not shown in
// the fallback all-scenarios list). Add an entry here when a new scenario ships campaign-only.
const CAMPAIGN_ONLY_SCENARIOS: { id: string; title: string }[] = [
	{ id: "tutorial-001", title: "Welcome to Redistricting: Millbrook County" },
];

const MANIFEST_BY_ID = new Map<string, { id: string; title: string }>([
	...SCENARIO_MANIFEST.map((e) => [e.id, e] as [string, { id: string; title: string }]),
	...CAMPAIGN_ONLY_SCENARIOS.map((e) => [e.id, e] as [string, { id: string; title: string }]),
]);

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const svgEl = document.getElementById("map-svg") as SVGSVGElement | null;
const resultsEl = document.getElementById("results-container") as HTMLElement | null;
const validityEl = document.getElementById("validity-container") as HTMLElement | null;
const districtBtnsEl = document.getElementById("district-buttons") as HTMLElement | null;
const btnUndo = document.getElementById("btn-undo") as HTMLButtonElement | null;
const btnRedo = document.getElementById("btn-redo") as HTMLButtonElement | null;
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
let skipClickHandler: (() => void) | null = null;
const resultVerdict = document.getElementById("result-verdict") as HTMLElement | null;
const resultSubtitle = document.getElementById("result-subtitle") as HTMLElement | null;
const resultCriteriaList = document.getElementById("result-criteria-list") as HTMLElement | null;
const resultEpilogue = document.getElementById("result-epilogue") as HTMLElement | null;
const resultMain = document.getElementById("result-main") as HTMLElement | null;
const resultDebrief = document.getElementById("result-debrief") as HTMLElement | null;
const btnContinue = document.getElementById("btn-continue") as HTMLButtonElement | null;
const btnDebriefBack = document.getElementById("btn-debrief-back") as HTMLButtonElement | null;
const btnDebriefNext = document.getElementById("btn-debrief-next") as HTMLButtonElement | null;
const btnKeepDrawing = document.getElementById("btn-keep-drawing") as HTMLButtonElement | null;
const btnNextScenario = document.getElementById("btn-next-scenario") as HTMLButtonElement | null;
const resultStars = document.getElementById("result-stars") as HTMLElement | null;
const resultRevealControls = document.getElementById("result-reveal-controls") as HTMLElement | null;
const btnRevealSkip = document.getElementById("btn-reveal-skip") as HTMLButtonElement | null;
const btnMuteAudio = document.getElementById("btn-mute-audio") as HTMLButtonElement | null;

// Render multi-paragraph prose (newline-separated) as <p> elements so paragraphs get
// real spacing (single "\n" under pre-wrap/pre-line otherwise butts them together).
function renderProse(el: HTMLElement, text: string): void {
	el.textContent = "";
	for (const para of text.split(/\n+/)) {
		const trimmed = para.trim();
		if (!trimmed) continue;
		const p = document.createElement("p");
		p.textContent = trimmed;
		el.appendChild(p);
	}
}

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
	districtBtnsEl === null ||
	btnUndo === null ||
	btnRedo === null ||
	btnReset === null ||
	resetConfirm === null ||
	btnResetConfirm === null ||
	btnResetCancel === null ||
	appHeader === null ||
	mainEl === null
) {
	throw new Error("Required DOM elements not found");
}

// ─── Debug mode: sticky via sessionStorage ───────────────────────────────────
// Once ?debug is used, it stays active for the tab session so navigations
// (force-win → select → next scenario) don't lose it.
const DEBUG_KEY = "redistricting-sim-debug";
const debugParam = new URLSearchParams(window.location.search).get("debug");
if (debugParam === "off") {
	try { sessionStorage.removeItem(DEBUG_KEY); } catch { /* ignore */ }
} else if (debugParam !== null) {
	try { sessionStorage.setItem(DEBUG_KEY, "1"); } catch { /* ignore */ }
}
const IS_DEBUG = (debugParam !== null && debugParam !== "off") ||
	sessionStorage.getItem(DEBUG_KEY) === "1";

// ─── Async init ───────────────────────────────────────────────────────────────

(async () => {
	initAssets();

	let progress = loadProgress();

	// ── Campaign context (GAME-048) ───────────────────────────────────────────
	// Parse ?campaign=<id> early so renderScenarioCards and routing can use it.
	const urlParams = new URLSearchParams(window.location.search);
	const campaignParam = (urlParams.get("campaign") ?? "").replace(/[^a-z0-9-]/g, "");
	const activeCampaign = campaignParam !== "" ? getCampaign(campaignParam) : undefined;
	// Unknown campaign ID → redirect to main menu rather than falling back to all scenarios.
	if (campaignParam !== "" && activeCampaign === undefined) {
		window.location.replace("./");
		return;
	}
	// When a campaign is active, show only that campaign's scenarios in manifest order.
	const activeList: ReadonlyArray<{ id: string; title: string }> = activeCampaign
		? (activeCampaign.scenarioIds
				.map((id) => MANIFEST_BY_ID.get(id))
				.filter((e): e is { id: string; title: string } => e !== undefined))
		: (SCENARIO_MANIFEST as ReadonlyArray<{ id: string; title: string }>);

	// URL and label for returning from a scenario — preserves campaign context if present.
	const backUrl = campaignParam !== "" ? `./?campaign=${campaignParam}` : "./";
	const backLabel = campaignParam !== "" ? "← Back to Scenarios" : "← Main Menu";

	// ── Scenario select screen (GAME-018 / GAME-021) ──────────────────────────
	// Rendered from the static manifest + localStorage progress.
	// Card clicks navigate to /?s=<id> so the page reloads cleanly with the
	// chosen scenario — avoids tearing down and rebuilding store + renderer in-place.

	function renderScenarioCards() {
		if (!scenarioCardsEl) return;
		const wip = loadWip();
		scenarioCardsEl.innerHTML = "";
		activeList.forEach((entry, i) => {
			const completed = isCompleted(progress, entry.id);
			const unlocked = i === 0 || isCompleted(progress, activeList[i - 1]?.id ?? "");
			const locked = !unlocked;
			const inProgress = wip?.scenarioId === entry.id;

			const card = document.createElement("div");
			card.className = `scenario-card${locked ? " locked" : ""}`;

			const titleEl = document.createElement("div");
			titleEl.className = "sc-title";
			titleEl.textContent = entry.title;

			const statusEl = document.createElement("div");
			const statusLabel = inProgress ? "In Progress" : completed ? "Completed" : unlocked ? "Ready" : "Locked";
			const statusClass = inProgress ? "in-progress" : completed ? "completed" : unlocked ? "unlocked" : "locked";
			statusEl.className = `sc-status ${statusClass}`;
			statusEl.textContent = statusLabel;

			const playBtn = document.createElement("button");
			playBtn.className = `sc-play-btn ${inProgress ? "continue" : completed ? "replay" : unlocked ? "play" : "locked-btn"}`;
			playBtn.textContent = inProgress ? "Continue" : completed ? "Play Again" : unlocked ? "Play" : "Locked";
			playBtn.disabled = locked;
			if (!locked) {
				playBtn.addEventListener("click", () => {
					const currentWip = loadWip();
					if (currentWip && currentWip.scenarioId !== entry.id) {
						// Warn: switching will discard in-progress work on a different scenario
						showWipWarning(currentWip.scenarioId, entry.id);
					} else {
						const dest = activeCampaign
							? `./?s=${entry.id}&campaign=${campaignParam}`
							: `./?s=${entry.id}`;
						window.location.assign(dest);
					}
				});
			}

			card.appendChild(titleEl);
			card.appendChild(statusEl);
			card.appendChild(playBtn);
			scenarioCardsEl.appendChild(card);
		});
	}

	function showWipWarning(wipScenarioId: string, targetId: string) {
		const modal = document.getElementById("wip-warning-modal");
		const text = document.getElementById("wip-warning-text");
		const confirmBtn = document.getElementById("wip-warning-confirm");
		const cancelBtn = document.getElementById("wip-warning-cancel");
		if (!modal || !text || !confirmBtn || !cancelBtn) return;
		const wipTitle = SCENARIO_MANIFEST.find((e) => e.id === wipScenarioId)?.title ?? wipScenarioId;
		text.textContent = `You have unsaved progress in "${wipTitle}". Switching scenarios will discard it.`;
		modal.classList.remove("hidden");
		const onConfirm = () => {
			cleanup();
			clearWip();
			const dest = activeCampaign
				? `./?s=${targetId}&campaign=${campaignParam}`
				: `./?s=${targetId}`;
			window.location.assign(dest);
		};
		const onCancel = () => {
			cleanup();
			modal.classList.add("hidden");
		};
		function cleanup() {
			confirmBtn!.removeEventListener("click", onConfirm);
			cancelBtn!.removeEventListener("click", onCancel);
		}
		confirmBtn.addEventListener("click", onConfirm);
		cancelBtn.addEventListener("click", onCancel);
	}

	function buildContinueUrl(scenarioId: string): string {
		for (const campaign of CAMPAIGN_REGISTRY) {
			if (campaign.scenarioIds.includes(scenarioId)) {
				return `./?s=${scenarioId}&campaign=${campaign.id}`;
			}
		}
		return `./?s=${scenarioId}`;
	}

	function showCampaignSelect() {
		const el = document.getElementById("campaign-select");
		if (!el) return;

		const cardsEl = document.getElementById("campaign-cards");
		if (cardsEl) {
			cardsEl.innerHTML = "";
			for (const campaign of CAMPAIGN_REGISTRY) {
				const completed = campaign.scenarioIds.filter((id) => isCompleted(progress, id)).length;
				const total = campaign.scenarioIds.length;
				const card = document.createElement("div");
				card.className = "campaign-card";
				card.setAttribute("role", "button");
				card.setAttribute("tabindex", "0");
				card.setAttribute("aria-label", campaign.title);

				const heading = document.createElement("h2");
				heading.textContent = campaign.title;
				const desc = document.createElement("p");
				desc.textContent = campaign.description;
				const prog = document.createElement("div");
				prog.className = "campaign-progress";
				prog.textContent = `${completed} / ${total} scenarios complete`;
				card.append(heading, desc, prog);

				const navigate = () => window.location.assign(`./?campaign=${campaign.id}`);
				card.addEventListener("click", navigate);
				card.addEventListener("keydown", (e: KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(); }
				});
				cardsEl.appendChild(card);
			}
		}

		document.getElementById("btn-campaign-back")?.addEventListener("click", () => {
			window.location.assign("./");
		});

		el.classList.remove("hidden");
	}

	function showMainMenu() {
		const mainMenuEl = document.getElementById("main-menu");
		if (!mainMenuEl) return;

		const lastPlayedId = loadLastPlayedScenario();
		const continueBtn = document.getElementById("btn-main-continue") as HTMLButtonElement | null;
		if (continueBtn) {
			if (lastPlayedId !== null) {
				continueBtn.disabled = false;
				continueBtn.addEventListener("click", () => {
					window.location.assign(buildContinueUrl(lastPlayedId));
				});
			} else {
				continueBtn.disabled = true;
			}
		}

		document.getElementById("btn-main-new-campaign")?.addEventListener("click", () => {
			window.location.assign("./?view=campaigns");
		});

		document.getElementById("btn-main-about")?.addEventListener("click", () => {
			mainMenuEl.classList.add("hidden");
			document.getElementById("about-screen")?.classList.remove("hidden");
		});

		document.getElementById("btn-about-close")?.addEventListener("click", () => {
			document.getElementById("about-screen")?.classList.add("hidden");
			mainMenuEl.classList.remove("hidden");
		});

		mainMenuEl.classList.remove("hidden");
	}

	function showScenarioSelect() {
		renderScenarioCards();
		scenarioSelectEl?.classList.remove("hidden");

		// Back button — visible only when a campaign is active (GAME-048)
		const backBtn = document.getElementById("btn-back-to-campaign") as HTMLButtonElement | null;
		if (backBtn) {
			backBtn.hidden = !activeCampaign;
			if (activeCampaign) {
				backBtn.addEventListener("click", () => {
					window.location.assign("./?view=campaigns");
				});
			}
		}

		// Reset campaign button — clears all progress and WIP
		document.getElementById("btn-reset-campaign")?.addEventListener("click", () => {
			if (!confirm("Reset all progress? This will erase completion status and any in-progress work.")) return;
			progress = { completed: [] };
			saveProgress(progress);
			clearWip();
			renderScenarioCards();
		});

	}

	// ── Startup routing (GAME-021 / GAME-048) ────────────────────────────────
	// Priority: explicit ?s= param > scenario select screen (for all other cases).
	// When ?campaign= is set, only scenarios in activeList are accessible.

	const requestedId = urlParams.get("s") ?? "";
	const requestedEntry = activeList.find((e) => e.id === requestedId);

	let entryToLoad: { id: string; title: string };
	if (requestedId !== "" && requestedEntry === undefined) {
		// Unknown scenario ID (or outside active campaign's list).
		// Stay in campaign context if one is active; otherwise fall back to main menu.
		if (activeCampaign) {
			showScenarioSelect();
		} else {
			window.location.replace("./");
		}
		return;
	} else if (requestedEntry !== undefined) {
		// Check unlock: scenario must be first in activeList, or previous entry completed (unless debug)
		const idx = activeList.findIndex((e) => e.id === requestedId);
		const locked = idx > 0 && !isCompleted(progress, activeList[idx - 1]?.id ?? "");
		if (locked && !IS_DEBUG) {
			// In campaign context → show campaign's scenario select; otherwise → main menu
			if (activeCampaign) {
				showScenarioSelect();
			} else {
				window.location.replace("./");
			}
			return;
		}
		entryToLoad = requestedEntry;
	} else {
		const view = urlParams.get("view") ?? "";
		if (campaignParam !== "") {
			showScenarioSelect();
		} else if (view === "campaigns") {
			showCampaignSelect();
		} else if (view === "scenarios") {
			// Legacy URL — redirect to main menu
			window.location.replace("./");
			return;
		} else {
			showMainMenu();
		}
		return;
	}

	// ── Fetch + validate scenario JSON ────────────────────────────────────────

	function showLoadError(bodyHtml: string, errorMsg: string): void {
		document.body.insertAdjacentHTML(
			"afterbegin",
			`<div style="position:fixed;inset:0;background:#0d1b2e;color:#c0d0e8;padding:2em;font-family:system-ui;z-index:999;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;">
				<h1 style="color:#e94560;font-size:1.4rem;">Scenario Failed to Load</h1>
				<p style="max-width:600px;text-align:center;">${bodyHtml}</p>
				<pre style="background:#16213e;padding:12px 16px;border-radius:6px;max-width:600px;overflow-x:auto;font-size:0.8rem;color:#e94560;white-space:pre-wrap;">${errorMsg}</pre>
				<button onclick="window.location.assign('${backUrl}')" style="padding:8px 20px;background:#1a3a5c;color:#c0d0e8;border:1px solid #2a5a8c;border-radius:6px;cursor:pointer;">${backLabel}</button>
			</div>`,
		);
	}

	saveLastPlayedScenario(entryToLoad.id);

	let json: unknown;
	try {
		const resp = await fetch(`./scenarios/${entryToLoad.id}.json`);
		if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
		json = (await resp.json()) as unknown;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error(`[GAME-032] Failed to fetch scenario "${entryToLoad.id}":`, e);
		showLoadError(`Could not fetch scenario <strong>${entryToLoad.id}</strong>.`, msg);
		return;
	}

	let scenario: Scenario;
	try {
		scenario = loadScenario(json);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		console.error(`[GAME-032] Scenario "${entryToLoad.id}" validation failed:`, e);
		showLoadError(`Scenario <strong>${entryToLoad.id}</strong> could not be loaded due to a validation error.`, msg);
		return;
	}

	// GAME-080: detect majority_minority criterion for live district demographic stat
	type MMCriterion = Extract<Criterion, { type: "majority_minority" }>;
	const majorityMinorityCriterion = scenario.success_criteria
		.map((sc) => sc.criterion)
		.find((c): c is MMCriterion => c.type === "majority_minority");

	// ── Preload audio clips (GAME-062) ───────────────────────────────────────
	{
		const clips: Record<string, string> = {};
		for (const type of ["governor", "commissioner", "legislator"] as const) {
			for (const gender of ["m", "f"] as const) {
				for (const state of ["approve", "disapprove"] as const) {
					const name = `${type}-${state}-${gender}`;
					clips[name] = assetUrl(`assets/audio/${name}.mp3`);
				}
			}
		}
		for (const type of ["judge", "party"] as const) {
			for (const state of ["approve", "neutral", "disapprove"] as const) {
				const name = `${type}-${state}`;
				clips[name] = assetUrl(`assets/audio/${name}.mp3`);
			}
		}
		preload(clips);
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
	function flushWipSave() {
		if (wipTimer !== null) clearTimeout(wipTimer);
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
	}

	function scheduleWipSave() {
		if (isRestoringWip) return;
		if (wipTimer !== null) clearTimeout(wipTimer);
		wipTimer = setTimeout(() => {
			wipTimer = null;
			flushWipSave();
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

	// ── Party labels derived from scenario data (GAME-055) ───────────────────
	// Override the hardcoded PARTY_LABELS fallbacks with scenario party names.
	const partyLabels: Partial<Record<"R" | "D" | "L" | "G" | "I", string>> = {};
	scenario.parties.forEach((p) => {
		const key = partyIdToKey.get(p.id);
		if (key !== undefined) partyLabels[key as "R" | "D" | "L" | "G" | "I"] = p.name;
	});
	renderer.setPartyLabels(partyLabels);

	// Panel applicability (GAME-097): only surface UI for things this scenario
	// actually involves. Pre-electoral tutorials hide the outcome prediction
	// (scenario.hide_election_results); the validity panel shows a constraint only
	// when the scenario gates on it — population balance only with a
	// population_balance criterion, contiguity only when rules.contiguity !==
	// "allowed". Never show a constraint the player isn't held to.
	const showResults = scenario.hide_election_results !== true;
	const hasBalanceCriterion = scenario.success_criteria.some(
		(c) => c.criterion.type === "population_balance",
	);
	const showValidity = hasBalanceCriterion || scenario.rules.contiguity !== "allowed";
	if (!showResults) {
		document.getElementById("results-heading")?.style.setProperty("display", "none");
		resultsEl!.style.display = "none";
	}
	if (!showValidity) {
		document.getElementById("validity-heading")?.style.setProperty("display", "none");
		validityEl!.style.display = "none";
	}

	// ── Update cycle ──────────────────────────────────────────────────────────
	function updateUI() {
		const state = store.getState();
		const { pastStates, futureStates } = temporalStore.getState();

		renderer.render();

		if (showResults) renderResults(resultsEl!, state, partyLabels);
		if (showValidity) renderValidityPanel(validityEl!, state, scenario.rules, hasBalanceCriterion);

		let demoStat: DistrictDemoStat | undefined;
		if (majorityMinorityCriterion) {
			demoStat = {
				shares: computeDistrictGroupShares(
					scenario.precincts,
					state.assignments,
					state.districtCount,
					majorityMinorityCriterion.group_filter,
				),
				label: groupFilterLabel(majorityMinorityCriterion.group_filter),
				threshold: majorityMinorityCriterion.min_eligible_share,
			};
		}

		renderDistrictButtons(districtBtnsEl!, state.districtCount, state.activeDistrict, (id) => {
			store.getState().setActiveDistrict(id);
		}, demoStat);

		btnUndo!.disabled = pastStates.length === 0;
		btnRedo!.disabled = futureStates.length === 0;

		// GAME-059: Submit button is always enabled — validity gate removed.
		btnSubmit!.disabled = false;
	}

	// ── Intro screen (GAME-016) ───────────────────────────────────────────────
	// AbortController lets startScenarioIntro() be safely called multiple times:
	// each call cancels the previous intro's event listeners before re-wiring.
	let introController: AbortController | null = null;

	function showEditor() {
		introController?.abort();
		introController = null;
		introScreen?.classList.add("hidden");
		document.getElementById("main-menu")?.classList.add("hidden");
		appHeader!.style.display = "";
		mainEl!.style.display = "";
		// GAME-076: kick off the guided walkthrough (no-op unless scenario.guided + a script).
		// rAF so the just-shown editor has laid out before the overlay highlights anything.
		requestAnimationFrame(() => startTutorialOverlay(scenario, store));
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
			if (introSlideBody) renderProse(introSlideBody, slide.body);
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

	// ── Keyboard shortcuts for undo/redo (GAME-008 accessibility) ──────────────
	document.addEventListener("keydown", (e: KeyboardEvent) => {
		const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
		const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
		if (isCtrlOrCmd && e.key === "z") {
			e.preventDefault();
			temporalStore.getState().undo();
		} else if (isCtrlOrCmd && (e.key === "y" || (isMac && e.shiftKey && e.key === "z"))) {
			e.preventDefault();
			temporalStore.getState().redo();
		} else if (IS_DEBUG && e.key === "c" && !isCtrlOrCmd && !e.shiftKey && !e.altKey) {
			const tag = (e.target as Element | null)?.tagName ?? "";
			if (tag !== "INPUT" && tag !== "TEXTAREA") toggleCoordLabels();
		}
	});

	// ── Undo / Redo buttons ───────────────────────────────────────────────────
	btnUndo!.addEventListener("click", () => {
		temporalStore.getState().undo();
	});

	btnRedo!.addEventListener("click", () => {
		temporalStore.getState().redo();
	});

	// ── Map view filter toolbar (GAME-093) ────────────────────────────────────
	// Two axes: precinct coloring (districts | lean — mutually exclusive radio) and
	// independent boundary overlays (county borders — toggle).
	const filterDistricts = document.getElementById("filter-districts") as HTMLButtonElement | null;
	const filterLean = document.getElementById("filter-lean") as HTMLButtonElement | null;
	const filterCounty = document.getElementById("filter-county") as HTMLButtonElement | null;

	let currentViewMode: ViewMode = "districts";
	function applyViewMode(mode: ViewMode) {
		currentViewMode = mode;
		renderer.setViewMode(mode);
		filterDistricts?.classList.toggle("active", mode === "districts");
		filterDistricts?.setAttribute("aria-checked", String(mode === "districts"));
		filterLean?.classList.toggle("active", mode === "lean");
		filterLean?.setAttribute("aria-checked", String(mode === "lean"));
	}
	filterDistricts?.addEventListener("click", () => applyViewMode("districts"));
	filterLean?.addEventListener("click", () => applyViewMode("lean"));

	let countyBordersVisible = false;
	function applyCounty(visible: boolean) {
		countyBordersVisible = visible;
		renderer.setCountyBordersVisible(visible);
		filterCounty?.classList.toggle("active", visible);
		filterCounty?.setAttribute("aria-pressed", String(visible));
	}
	filterCounty?.addEventListener("click", () => applyCounty(!countyBordersVisible));

	// Expand/collapse: labels beside icons by default; collapse to icon-only.
	const mapFilters = document.getElementById("map-filters");
	const mapFiltersToggle = document.getElementById("map-filters-toggle");
	const FILTERS_COLLAPSED_KEY = "redistricting-sim-filters-collapsed";
	function applyFiltersCollapsed(collapsed: boolean) {
		mapFilters?.classList.toggle("collapsed", collapsed);
		mapFilters?.classList.toggle("expanded", !collapsed);
		mapFiltersToggle?.setAttribute("aria-expanded", String(!collapsed));
		mapFiltersToggle?.setAttribute("aria-label", collapsed ? "Expand view filters" : "Collapse view filters");
		mapFiltersToggle?.setAttribute("data-tip", collapsed ? "Expand" : "Collapse");
		try { localStorage.setItem(FILTERS_COLLAPSED_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ }
	}
	let filtersCollapsed = false;
	try { filtersCollapsed = localStorage.getItem(FILTERS_COLLAPSED_KEY) === "1"; } catch { /* ignore */ }
	applyFiltersCollapsed(filtersCollapsed);
	// Paint-only tutorials (the welcome) have no alternate views worth showing — hide the
	// whole view toolbar.
	if (scenario.hide_view_toolbar) mapFilters?.style.setProperty("display", "none");
	mapFiltersToggle?.addEventListener("click", () => {
		filtersCollapsed = !filtersCollapsed;
		applyFiltersCollapsed(filtersCollapsed);
	});

	// ── District paint toolbar expand/collapse (GAME-095) ──────────────────────
	const districtToolbar = document.getElementById("district-toolbar");
	const districtToolbarToggle = document.getElementById("district-toolbar-toggle");
	const DISTRICTS_COLLAPSED_KEY = "redistricting-sim-districts-collapsed";
	function applyDistrictsCollapsed(collapsed: boolean, persist = true) {
		districtToolbar?.classList.toggle("collapsed", collapsed);
		districtToolbar?.classList.toggle("expanded", !collapsed);
		districtToolbarToggle?.setAttribute("aria-expanded", String(!collapsed));
		districtToolbarToggle?.setAttribute("aria-label", collapsed ? "Expand district painter" : "Collapse district painter");
		districtToolbarToggle?.setAttribute("data-tip", collapsed ? "Expand" : "Collapse");
		if (persist) { try { localStorage.setItem(DISTRICTS_COLLAPSED_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ } }
	}
	let districtsCollapsed = false;
	try { districtsCollapsed = localStorage.getItem(DISTRICTS_COLLAPSED_KEY) === "1"; } catch { /* ignore */ }
	// Paint-only tutorials keep the painter open (it's the primary chrome and now doubles
	// as the legend) regardless of, and without clobbering, the saved preference.
	if (scenario.hide_view_toolbar) { districtsCollapsed = false; applyDistrictsCollapsed(false, false); }
	else applyDistrictsCollapsed(districtsCollapsed);
	districtToolbarToggle?.addEventListener("click", () => {
		districtsCollapsed = !districtsCollapsed;
		applyDistrictsCollapsed(districtsCollapsed);
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

	/**
	 * Build synthetic CriterionResult rows for hard validity constraints that the
	 * map violates (GAME-059).  These are prepended to the result criteria list so
	 * players can see exactly which structural issues need fixing.
	 */
	function buildValidityRows(validity: ReturnType<typeof computeValidityStats>): CriterionResult[] {
		const rows: CriterionResult[] = [];
		// Skip a validity row if the scenario already has a success criterion of the
		// equivalent type — that criterion will appear in evalResult and already shows
		// the failure, so the validity row would be a duplicate.
		const scenarioCriterionTypes = new Set(scenario.success_criteria.map(sc => sc.criterion.type));

		if (validity.unassignedCount > 0 && !scenarioCriterionTypes.has("district_count")) {
			rows.push({
				criterionId: "validity:all-assigned" as CriterionId,
				required: true,
				description: "All precincts must be assigned to a district",
				passed: false,
				detail: `${validity.unassignedCount} precinct(s) unassigned`,
			});
		}

		// Population balance is opt-in via a population_balance criterion (see
		// isMapSubmittable): when present it appears in evalResult already; when absent
		// it isn't a constraint. Either way there is no synthetic balance validity row.

		if (validity.contiguity !== null) {
			for (const [distId, ok] of validity.contiguity) {
				if (!ok) {
					rows.push({
						criterionId: `validity:contiguity-${distId}` as CriterionId,
						required: true,
						description: `District ${distId} must be contiguous`,
						passed: false,
						detail: `District ${distId} is split into disconnected pieces`,
					});
				}
			}
		}

		return rows;
	}

	function computeStarCount(criterionResults: CriterionResult[], mapIsValid: boolean): number {
		const allRequiredPass = criterionResults.every(cr => !cr.required || cr.passed);
		if (!mapIsValid || !allRequiredPass) return 0;
		return 1 + criterionResults.filter(cr => !cr.required && cr.passed).length;
	}

	// GAME-069/GAME-062: Sprite sheet layout constants.
	// Governor sheet: 1376×752px (unique dimensions).
	// Pose columns: neutral 0–400, approve 400–880, disapprove 880–1376.
	const GOV_ROW_SCALE = 84 / 752;
	const GOV_SHEET = { neutral: { x: 0, w: 400 }, approve: { x: 400, w: 480 }, disapprove: { x: 880, w: 496 } };

	// All other character sheets: 1408×768px. Pose boundaries measured via mid-gap split on each variant.
	const CHAR_ROW_SCALE = 84 / 768;
	type PoseCols = { neutral: { x: number; w: number }; approve: { x: number; w: number }; disapprove: { x: number; w: number } };
	const CHAR_POSES: Record<string, PoseCols> = {
		"commissioner-wm": { neutral: { x: 0, w: 458 }, approve: { x: 458, w: 482 }, disapprove: { x: 940, w: 468 } },
		"commissioner-wf": { neutral: { x: 0, w: 451 }, approve: { x: 451, w: 481 }, disapprove: { x: 932, w: 476 } },
		"commissioner-bf": { neutral: { x: 0, w: 462 }, approve: { x: 462, w: 492 }, disapprove: { x: 954, w: 454 } },
		"judge":           { neutral: { x: 0, w: 463 }, approve: { x: 463, w: 480 }, disapprove: { x: 943, w: 465 } },
		"judge-lm":        { neutral: { x: 0, w: 469 }, approve: { x: 469, w: 467 }, disapprove: { x: 936, w: 472 } },
		"judge-naf":       { neutral: { x: 0, w: 464 }, approve: { x: 464, w: 473 }, disapprove: { x: 937, w: 471 } },
		"legislator-wm":   { neutral: { x: 0, w: 435 }, approve: { x: 435, w: 499 }, disapprove: { x: 934, w: 474 } },
		"legislator-wf":   { neutral: { x: 0, w: 419 }, approve: { x: 419, w: 479 }, disapprove: { x: 898, w: 510 } },
		"legislator-bm":   { neutral: { x: 0, w: 420 }, approve: { x: 420, w: 522 }, disapprove: { x: 942, w: 466 } },
		"party":           { neutral: { x: 0, w: 467 }, approve: { x: 467, w: 473 }, disapprove: { x: 940, w: 468 } },
	};

	// Placeholder SVG for non-governor character types.
	function charPlaceholderSvg(state: "neutral" | "approve" | "disapprove"): string {
		if (state === "neutral") {
			return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
				<rect x="4" y="4" width="24" height="24" rx="3" fill="none" stroke="#5060a0" stroke-width="2"/>
			</svg>`;
		}
		if (state === "approve") {
			return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
				<rect x="4" y="4" width="24" height="24" rx="3" fill="none" stroke="#4caf80" stroke-width="2"/>
				<polyline points="8,17 13,22 24,10" fill="none" stroke="#4caf80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`;
		}
		return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
			<rect x="4" y="4" width="24" height="24" rx="3" fill="none" stroke="#e94560" stroke-width="2"/>
			<line x1="10" y1="10" x2="22" y2="22" stroke="#e94560" stroke-width="2.5" stroke-linecap="round"/>
			<line x1="22" y1="10" x2="10" y2="22" stroke="#e94560" stroke-width="2.5" stroke-linecap="round"/>
		</svg>`;
	}

	// Build the neutral and verdict child elements for a per-row character slot.
	// Returns {neutral, verdict} — both appended to the slot container.
	function buildCharSlotChildren(
		slot: HTMLElement,
		charType: CharacterType,
		passed: boolean,
	): { neutral: HTMLElement; verdict: HTMLElement } {
		const neutralEl = document.createElement("div");
		neutralEl.className = "rc-char-neutral";
		const verdictEl = document.createElement("div");
		verdictEl.className = "rc-char-verdict";
		verdictEl.style.opacity = "0";

		// Demographic variant: read from scenario, fall back to "" (generic/no-suffix).
		const demo = scenario.character_demographics?.[charType] ?? "";

		if (charType === "governor") {
			const n = GOV_SHEET.neutral;
			const v = passed ? GOV_SHEET.approve : GOV_SHEET.disapprove;
			const govDemo = demo || "wm"; // loader enforces non-empty; fallback guards stale/direct scenarios
			const img = assetUrl(`assets/characters/governor-${govDemo}/sheet.png`);
			const makeSprite = (col: { x: number; w: number }, label: string): HTMLElement => {
				const s = document.createElement("div");
				s.className = "character-sprite character-governor character-sprite--row";
				s.setAttribute("role", "img");
				s.setAttribute("aria-label", label);
				s.style.width = `${Math.round(col.w * GOV_ROW_SCALE)}px`;
				s.style.backgroundImage = `url('${img}')`;
				s.style.backgroundPosition = `-${Math.round(col.x * GOV_ROW_SCALE)}px 0%`;
				s.style.backgroundSize = `${Math.round(1376 * GOV_ROW_SCALE)}px 84px`;
				return s;
			};
			neutralEl.appendChild(makeSprite(n, "Character awaiting verdict"));
			verdictEl.appendChild(makeSprite(v, passed ? "Approves" : "Disapproves"));
		} else {
			// Non-governor: resolve asset directory and pose data per type + demographic.
			const dir =
				charType === "party" ? "party" :
				charType === "commissioner" ? `commissioner-${demo || "wm"}` :
				charType === "judge" ? (demo ? `judge-${demo}` : "judge") :
				charType === "legislator" ? `legislator-${demo || "wm"}` :
				null;
			const poses = dir ? CHAR_POSES[dir] : null;
			if (poses) {
				const n = poses.neutral;
				const v = passed ? poses.approve : poses.disapprove;
				const img = assetUrl(`assets/characters/${dir}/sheet.png`);
				// Fixed viewport width = max pose width (scaled) so neutral→verdict doesn't shift position.
				const vw = Math.round(Math.max(poses.neutral.w, poses.approve.w, poses.disapprove.w) * CHAR_ROW_SCALE);
				const makeCharSprite = (col: { x: number; w: number }, label: string): HTMLElement => {
					const s = document.createElement("div");
					s.className = "character-sprite character-sprite--row";
					s.setAttribute("role", "img");
					s.setAttribute("aria-label", label);
					s.style.width = `${vw}px`;
					// Center pose column within fixed viewport so feet align between states.
					const bgX = -(col.x * CHAR_ROW_SCALE) + (vw - col.w * CHAR_ROW_SCALE) / 2;
					s.style.backgroundImage = `url('${img}')`;
					s.style.backgroundPosition = `${bgX.toFixed(1)}px 0px`;
					s.style.backgroundSize = `${Math.round(1408 * CHAR_ROW_SCALE)}px 84px`;
					return s;
				};
				neutralEl.appendChild(makeCharSprite(n, "Character awaiting verdict"));
				verdictEl.appendChild(makeCharSprite(v, passed ? "Approves" : "Disapproves"));
			} else {
				// Unknown/future character type — keep placeholder SVG as fallback.
				neutralEl.innerHTML = charPlaceholderSvg("neutral");
				verdictEl.innerHTML = charPlaceholderSvg(passed ? "approve" : "disapprove");
			}
		}

		slot.appendChild(neutralEl);
		slot.appendChild(verdictEl);
		return { neutral: neutralEl, verdict: verdictEl };
	}

	// Cross-fade a character slot from neutral to verdict.
	function transitionCharSlot(neutral: HTMLElement, verdict: HTMLElement): void {
		neutral.style.opacity = "0";
		verdict.style.opacity = "1";
	}

	function showResultScreen(debugForcePass = false) {
		if (!resultScreen || !resultVerdict || !resultSubtitle || !resultCriteriaList) return;
		if (skipClickHandler) { btnRevealSkip?.removeEventListener("click", skipClickHandler); skipClickHandler = null; }

		const state = store.getState();
		if (state.simulationResult === null) return;

		const validity = computeValidityStats(
			state.precincts,
			state.assignments,
			state.districtCount,
			scenario.rules,
		);

		// GAME-059: detect invalid map before running criterion evaluation.
		// GAME-097: population balance is a hard gate only when the scenario enforces it
		// (has a population_balance criterion) — paint-only tutorials don't.
		let mapIsValid = isMapSubmittable(validity, scenario.rules, hasBalanceCriterion);

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

		// GAME-059: overall pass requires a valid map AND all required criteria passing.
		let overallPass = mapIsValid && evalResult.overallPass;

		if (debugForcePass) {
			mapIsValid = true;
			overallPass = true;
		}

		// GAME-073: verdict starts hidden; revealed progressively during criteria reveal.
		resultVerdict.textContent = "";
		resultVerdict.className = "";
		resultVerdict.style.opacity = "0";
		resultSubtitle.textContent = "";
		resultSubtitle.style.opacity = "0";
		// GAME-094: reset to the results view; clear/hide the debrief second panel.
		if (resultEpilogue) resultEpilogue.textContent = "";
		resultMain?.classList.remove("hidden");
		resultDebrief?.classList.add("hidden");
		if (btnContinue) btnContinue.style.display = "none";
		if (resultStars) { resultStars.innerHTML = ""; resultStars.classList.add("hidden"); }
		// maxStars based on scenario structure (not forced-pass); stars computed from actual results.
		const maxStars = 1 + evalResult.criterionResults.filter(cr => !cr.required).length;
		const stars = debugForcePass ? maxStars : computeStarCount(evalResult.criterionResults, mapIsValid);

		// Build criterion-type lookup (criterionId → Criterion["type"]) for icon dispatch.
		const criterionTypeMap = new Map<string, string>();
		for (const sc of scenario.success_criteria) {
			criterionTypeMap.set(sc.id as string, sc.criterion.type);
		}

		// GAME-069: build character info map (criterionId → resolved CharacterType + party_id).
		// "instigator" refs resolve through scenario.instigator_character.
		const charInfoMap = new Map<string, { type: CharacterType; party_id?: string }>();
		for (const sc of scenario.success_criteria) {
			const raw = sc.character;
			let charType: CharacterType;
			if (!raw) {
				charType = "commissioner";
			} else if (raw === "instigator") {
				charType = scenario.instigator_character ?? "commissioner";
			} else {
				charType = raw;
			}
			const entry: { type: CharacterType; party_id?: string } = { type: charType };
			if (sc.party_id !== undefined) entry.party_id = sc.party_id as string;
			charInfoMap.set(sc.id as string, entry);
		}

		// GAME-059: for invalid maps, prepend validity failure rows before scenario criteria.
		const validityRows = mapIsValid ? [] : buildValidityRows(validity);
		const criterionRows = debugForcePass
			? evalResult.criterionResults.map(cr => ({ ...cr, passed: true }))
			: evalResult.criterionResults;
		const allRows: CriterionResult[] = [...validityRows, ...criterionRows];

		resultCriteriaList.innerHTML = "";

		// Resolve character info for a row (validity rows default to commissioner).
		function resolveCharInfo(cr: CriterionResult): { type: CharacterType; party_id?: string } {
			return charInfoMap.get(cr.criterionId as string) ?? { type: "commissioner" };
		}

		// Row timing constants — shared by main reveal and per-row debug replay.
		const ROW_FADE_MS = 300;
		const ROW_HOLD_MS = 1200;
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		// All active setTimeout handles — cleared by skip, Keep Drawing, and debug replay.
		let activeTimeouts: ReturnType<typeof setTimeout>[] = [];

		// GAME-073: deferred verdict — shown only after first required-fail or all rows complete.
		let verdictShown = false;

		function renderStars(el: HTMLElement, earned: number, max: number): void {
			el.innerHTML = "";
			el.setAttribute("aria-label", `${earned} of ${max} star${max !== 1 ? "s" : ""}`);
			for (let i = 1; i <= max; i++) {
				const s = document.createElement("span");
				s.className = `result-star ${i <= earned ? "filled" : "empty"}`;
				s.setAttribute("aria-hidden", "true");
				s.textContent = i <= earned ? "★" : "☆";
				el.appendChild(s);
			}
		}

		// GAME-094: on a win, route the teaching debrief (narrative.epilogue) to a
		// second panel via "Continue →"; with no epilogue, go straight to "Next Scenario →".
		function preparePostWin(pass: boolean): void {
			const epilogue = pass ? scenario.narrative?.epilogue : undefined;
			if (resultEpilogue) {
				if (epilogue) renderProse(resultEpilogue, epilogue);
				else resultEpilogue.textContent = "";
			}
			if (btnContinue) btnContinue.style.display = pass && epilogue ? "" : "none";
			btnNextScenario!.style.display = pass && !epilogue ? "" : "none";
		}

		function revealVerdict(pass: boolean, starCount: number): void {
			if (verdictShown) return;
			verdictShown = true;
			resultVerdict!.textContent = pass ? "Map Passed!" : "Map Failed";
			resultVerdict!.className = pass ? "pass" : "fail";
			resultVerdict!.style.opacity = "1";
			resultSubtitle!.textContent = pass
				? "All required criteria met."
				: mapIsValid
					? "One or more required criteria were not met."
					: "The map has structural issues that must be fixed.";
			resultSubtitle!.style.opacity = "1";
			if (pass && resultStars) {
				renderStars(resultStars, starCount, maxStars);
				resultStars.classList.remove("hidden");
			}
			preparePostWin(pass);
			if (pass) {
				play("tada");
			} else {
				// Delay so the criterion's disapprove audio (playing in finalizeRow) finishes first.
				setTimeout(() => play("womp-womp"), 400);
			}
		}

		function finalizeVerdict(): void {
			if (!verdictShown) revealVerdict(overallPass, stars);
		}

		// Snap a row to its final verdict state.
		function finalizeRow(row: HTMLElement, withAudio = false): void {
			if (row.dataset["finalized"] === "true") return;
			row.dataset["finalized"] = "true";
			const passed = row.dataset["passed"] === "true";
			const required = row.dataset["required"] === "true";
			const verdictCls = passed ? "passed" : required ? "failed-required" : "failed-optional";
			row.className = `result-criterion ${verdictCls}`;
			row.style.opacity = "1";
			row.style.animation = "none";
			const badge = row.querySelector<HTMLSpanElement>(".rc-badge")!;
			badge.classList.remove("rc-checking");
			badge.textContent = passed ? "PASS" : required ? "FAIL" : "OPTIONAL";
			// Transition character slot neutral → verdict.
			const neutral = row.querySelector<HTMLElement>(".rc-char-neutral");
			const verdict = row.querySelector<HTMLElement>(".rc-char-verdict");
			if (neutral && verdict) transitionCharSlot(neutral, verdict);
			// GAME-073: reveal failure banner on first required-criterion fail.
			if (!passed && required) revealVerdict(false, 0);
			if (withAudio) {
				const type = row.dataset["charType"] ?? "";
				const democode = row.dataset["charDemo"] ?? "";
				const audioState = passed ? "approve" : "disapprove";
				// Governor/commissioner/legislator: gender-keyed clips.
				// Judge: dedicated gavel clips.
				// Party: party-approve / party-disapprove (disapprove is a stub — GAME-071).
				let clipName: string;
				if (type === "governor" || type === "commissioner" || type === "legislator") {
					const gender = democode.length >= 2 ? democode.slice(-1) : "";
					clipName = (gender === "m" || gender === "f")
						? `${type}-${audioState}-${gender}`
						: `${type}-${audioState}`;
				} else if (type === "judge") {
					clipName = `judge-${audioState}`;
				} else {
					// party
					clipName = passed ? "party-approve" : "party-disapprove";
				}
				play(clipName);
			}
		}

		// Recompute the top-level verdict/subtitle/Next Scenario button/stars from current row states.
		// Called after a debug replay changes a single criterion's result.
		function syncOverallVerdict(): void {
			if (!resultVerdict || !resultSubtitle || !resultCriteriaList) return;
			const rows = Array.from(resultCriteriaList.querySelectorAll<HTMLElement>(".result-criterion"));
			const anyRequiredFailed = rows.some(r => r.classList.contains("failed-required"));
			const nowPass = !anyRequiredFailed;
			verdictShown = true;
			resultVerdict.textContent = nowPass ? "Map Passed!" : "Map Failed";
			resultVerdict.className = nowPass ? "pass" : "fail";
			resultVerdict.style.opacity = "1";
			resultSubtitle.textContent = nowPass
				? "All required criteria met."
				: "One or more required criteria were not met.";
			resultSubtitle.style.opacity = "1";
			preparePostWin(nowPass);
			if (resultStars) {
				if (nowPass) {
					const optionalPassed = rows.filter(r =>
						r.dataset["required"] === "false" && r.dataset["passed"] === "true"
					).length;
					renderStars(resultStars, 1 + optionalPassed, maxStars);
					resultStars.classList.remove("hidden");
				} else {
					resultStars.classList.add("hidden");
				}
			}
		}

		// Debug: reset a single row to pending and re-run its reveal with a forced result.
		// Cancels any in-flight animations (main reveal or a prior replay) before starting.
		function debugReplayRow(row: HTMLElement, newPassed: boolean): void {
			// Finalize any in-flight reveal before starting. Calling skipClickHandler()
			// snaps all pending rows to their natural results so only this row gets the
			// debug override — prevents future rows from being abandoned in rc-pending.
			if (skipClickHandler) {
				btnRevealSkip?.removeEventListener("click", skipClickHandler);
				skipClickHandler(); // finalizes all pending rows + clears activeTimeouts
			} else {
				for (const t of activeTimeouts) clearTimeout(t);
				activeTimeouts = [];
			}
			row.dataset["passed"] = String(newPassed);
			row.dataset["finalized"] = "false";
			row.className = "result-criterion rc-pending";
			row.style.opacity = "";
			// Force CSS animation reset: clear → reflow → re-trigger.
			row.style.animation = "none";
			void row.offsetHeight;
			// Rebuild char slot for new verdict.
			const charType = (row.dataset["charType"] ?? "commissioner") as CharacterType;
			const charSlot = row.querySelector<HTMLElement>(".rc-char")!;
			charSlot.innerHTML = "";
			buildCharSlotChildren(charSlot, charType, newPassed);
			// Reset badge.
			const badge = row.querySelector<HTMLSpanElement>(".rc-badge")!;
			badge.className = "rc-badge rc-checking";
			badge.textContent = "CHECKING…";
			// Register a cancel hook so Keep Drawing can abort this animation too.
			skipClickHandler = () => {
				for (const t of activeTimeouts) clearTimeout(t);
				activeTimeouts = [];
				skipClickHandler = null;
			};
			if (reducedMotion) {
				finalizeRow(row, /*withAudio=*/ true);
				syncOverallVerdict();
				skipClickHandler = null;
			} else {
				const t1 = setTimeout(() => {
					row.classList.remove("rc-pending");
					row.style.animation = `criterionReveal ${ROW_FADE_MS}ms ease forwards`;
					const t2 = setTimeout(() => {
						finalizeRow(row, /*withAudio=*/ true);
						syncOverallVerdict();
						skipClickHandler = null;
					}, ROW_HOLD_MS);
					activeTimeouts.push(t2);
				}, 50);
				activeTimeouts.push(t1);
			}
		}

		// Build a criterion row element.
		// final=true → already in pass/fail state (reduced-motion or skip path).
		// final=false → starts in rc-pending/CHECKING state; JS reveals it later.
		function buildRowElement(cr: CriterionResult, final: boolean): HTMLElement {
			const verdictCls = cr.passed
				? "passed"
				: cr.required
					? "failed-required"
					: "failed-optional";

			const row = document.createElement("div");
			row.className = final ? `result-criterion ${verdictCls}` : "result-criterion rc-pending";
			row.dataset["passed"] = String(cr.passed);
			row.dataset["required"] = String(cr.required);
			row.dataset["finalized"] = String(final);

			// GAME-069: per-row character slot.
			const charInfo = resolveCharInfo(cr);
			const charSlot = document.createElement("div");
			charSlot.className = "rc-char";
			buildCharSlotChildren(charSlot, charInfo.type, cr.passed);
			row.dataset["charType"] = charInfo.type;
			row.dataset["charDemo"] = scenario.character_demographics?.[charInfo.type] ?? "";
			if (final) {
				charSlot.querySelector<HTMLElement>(".rc-char-neutral")!.style.opacity = "0";
				charSlot.querySelector<HTMLElement>(".rc-char-verdict")!.style.opacity = "1";
			}

			const iconEl = document.createElement("span");
			iconEl.className = "rc-icon";
			const criterionType = criterionTypeMap.get(cr.criterionId as string) ?? (cr.criterionId as string);
			iconEl.innerHTML = getCriterionIcon(cr.criterionId as string, criterionType);

			const body = document.createElement("div");
			body.className = "rc-body";

			const charLabel = document.createElement("div");
			charLabel.className = "rc-char-label";
			charLabel.textContent = charInfo.type + ":";
			body.appendChild(charLabel);

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
			badge.className = final ? "rc-badge" : "rc-badge rc-checking";
			badge.textContent = final
				? (cr.passed ? "PASS" : cr.required ? "FAIL" : "OPTIONAL")
				: "CHECKING…";

			row.appendChild(iconEl);
			row.appendChild(body);
			row.appendChild(badge);
			row.appendChild(charSlot);

			if (IS_DEBUG) {
				const dbgCtrl = document.createElement("div");
				dbgCtrl.className = "rc-debug-ctrl";
				const btnDbgPass = document.createElement("button");
				btnDbgPass.className = "rc-debug-pass";
				btnDbgPass.textContent = "✓ pass";
				btnDbgPass.addEventListener("click", () => debugReplayRow(row, true));
				const btnDbgFail = document.createElement("button");
				btnDbgFail.className = "rc-debug-fail";
				btnDbgFail.textContent = "✗ fail";
				btnDbgFail.addEventListener("click", () => debugReplayRow(row, false));
				dbgCtrl.appendChild(btnDbgPass);
				dbgCtrl.appendChild(btnDbgFail);
				row.appendChild(dbgCtrl);
			}

			return row;
		}

		// GAME-059: "Fix It" label for invalid maps, "Keep Drawing" otherwise.
		// "Next Scenario" visibility is deferred to revealVerdict (GAME-073).
		btnKeepDrawing!.textContent = mapIsValid ? "← Keep Drawing" : "← Fix It";
		btnKeepDrawing!.style.display = "";
		btnNextScenario!.style.display = "none";

		if (reducedMotion) {
			// Instant path: all rows in final state with verdict character poses immediately.
			for (const cr of allRows) {
				resultCriteriaList.appendChild(buildRowElement(cr, /*final=*/ true));
			}
			// GAME-073: reveal verdict immediately in reduced-motion mode.
			revealVerdict(overallPass, stars);
		} else {
			// Animated path: sequential reveal — each row fades in CHECKING, then flips to verdict.
			// GAME-068: each row fully resolves before the next starts (no simultaneous CHECKING).
			// Chain delay = 300ms fade + 1200ms hold + 150ms flip + 900ms settle = 2550ms per row.
			// ROW_SETTLE_MS gives audio clips space to finish before the next row starts.
			const ROW_FLIP_MS = 150;
			const ROW_SETTLE_MS = 900;
			const ROW_CHAIN_MS = ROW_FADE_MS + ROW_HOLD_MS + ROW_FLIP_MS + ROW_SETTLE_MS; // 2550ms

			const rowElements: HTMLElement[] = [];
			for (const cr of allRows) {
				const row = buildRowElement(cr, /*final=*/ false);
				resultCriteriaList.appendChild(row);
				rowElements.push(row);
			}

			// Show Skip button; hide it when reveal completes naturally.
			if (resultRevealControls) resultRevealControls.style.display = "";

			let chainDelay = 0;

			for (let i = 0; i < rowElements.length; i++) {
				const row = rowElements[i]!;
				const rowStart = chainDelay;

				const t1 = setTimeout(() => {
					// Phase 1: animate row in with CHECKING badge.
					row.classList.remove("rc-pending");
					row.style.animation = `criterionReveal ${ROW_FADE_MS}ms ease forwards`;

					const t2 = setTimeout(() => {
						// Phase 2: flip to final verdict with pop.
						finalizeRow(row, /*withAudio=*/ true);
						// Only pop the badge when it is visible; passed rows hide the badge via display:none.
						const passed = row.dataset["passed"] === "true";
						if (!passed) {
							const badge = row.querySelector<HTMLSpanElement>(".rc-badge")!;
							badge.classList.add("rc-pop");
							badge.addEventListener("animationend", () => badge.classList.remove("rc-pop"), { once: true });
						}

						if (i === rowElements.length - 1) {
							const tDone = setTimeout(() => {
								btnRevealSkip?.removeEventListener("click", skipHandler);
								finalizeVerdict(); // GAME-073: reveal success banner after all rows done
								if (resultRevealControls) resultRevealControls.style.display = "none";
								skipClickHandler = null;
							}, 800);
							activeTimeouts.push(tDone);
						}
					}, ROW_HOLD_MS);
					activeTimeouts.push(t2);
				}, rowStart);
				activeTimeouts.push(t1);

				// Next row starts only after this row has fully resolved.
				chainDelay += ROW_CHAIN_MS;
			}

			// Skip button: clear all pending timeouts, finalize all rows immediately.
			const skipHandler = () => {
				for (const t of activeTimeouts) clearTimeout(t);
				activeTimeouts = [];
				for (const row of rowElements) finalizeRow(row);
				finalizeVerdict(); // GAME-073: reveal banner after skip
				if (resultRevealControls) resultRevealControls.style.display = "none";
				skipClickHandler = null;
			};
			skipClickHandler = skipHandler;
			btnRevealSkip?.addEventListener("click", skipHandler, { once: true });
		}

		// ── GAME-018: persist completion on pass ──────────────────────────────────
		if (overallPass) {
			progress = markCompleted(progress, scenario.id);
			saveProgress(progress);
			// GAME-007: clear the WIP for this scenario — it's done.
			clearWip();
		}

		syncMuteButton();
		resultScreen.classList.remove("hidden");
	}

	function syncMuteButton(): void {
		if (!btnMuteAudio) return;
		const muted = isMuted();
		btnMuteAudio.textContent = muted ? "Unmute" : "Mute";
		btnMuteAudio.setAttribute("aria-pressed", String(muted));
	}

	btnMuteAudio?.addEventListener("click", () => {
		setMuted(!isMuted());
		syncMuteButton();
	});

	btnSubmit!.addEventListener("click", () => {
		showResultScreen();
	});

	// ── Debug force-win: visible only with ?debug in URL ─────────────────────
	// Opens the result screen with all criteria forced to pass, so the full
	// reveal animation and audio can be tested without solving the map.
	const btnDebugWin = document.getElementById("btn-debug-win") as HTMLButtonElement | null;
	if (btnDebugWin && IS_DEBUG) {
		btnDebugWin.style.display = "";
		btnDebugWin.addEventListener("click", () => {
			showResultScreen(/*debugForcePass=*/ true);
		});
	}

	const btnDebugCoords = document.getElementById("btn-debug-coords") as HTMLButtonElement | null;
	let coordLabelsOn = false;
	const toggleCoordLabels = () => {
		coordLabelsOn = !coordLabelsOn;
		renderer.setCoordLabelsVisible(coordLabelsOn);
		if (btnDebugCoords) btnDebugCoords.textContent = coordLabelsOn ? "⌖ Coords ON [C]" : "⌖ Coords [C]";
	};
	if (btnDebugCoords && IS_DEBUG) {
		btnDebugCoords.style.display = "";
		btnDebugCoords.addEventListener("click", toggleCoordLabels);
	}

	btnKeepDrawing!.addEventListener("click", () => {
		// Cancel any in-progress criteria reveal (timeouts + audio) before leaving.
		if (skipClickHandler) {
			btnRevealSkip?.removeEventListener("click", skipClickHandler);
			skipClickHandler();
		}
		resultScreen!.classList.add("hidden");
	});

	// Nav-back submenu (GAME-051)
	const navBackTrigger = document.getElementById("btn-nav-back-trigger") as HTMLButtonElement | null;
	const navBackMenu = document.getElementById("nav-back-menu") as HTMLElement | null;
	const btnBackToScenarios = document.getElementById("btn-back-to-scenarios") as HTMLButtonElement | null;
	const btnBackToMainMenu = document.getElementById("btn-back-to-main-menu") as HTMLButtonElement | null;

	// Hide "Return to Scenarios" when no campaign context is active.
	if (!activeCampaign && btnBackToScenarios) btnBackToScenarios.hidden = true;

	// When only one option, drop the dropdown affordance and act as a plain button.
	if (!activeCampaign && navBackTrigger) {
		navBackTrigger.textContent = "← Main Menu";
		navBackTrigger.removeAttribute("aria-haspopup");
		navBackTrigger.removeAttribute("aria-expanded");
		navBackTrigger.addEventListener("click", () => {
			flushWipSave();
			window.location.assign("./");
		});
	} else {
		function closeNavMenu() {
			navBackMenu?.setAttribute("hidden", "");
			navBackTrigger?.setAttribute("aria-expanded", "false");
		}

		navBackTrigger?.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = !navBackMenu?.hasAttribute("hidden");
			if (isOpen) {
				closeNavMenu();
			} else {
				navBackMenu?.removeAttribute("hidden");
				navBackTrigger.setAttribute("aria-expanded", "true");
			}
		});

		document.addEventListener("click", closeNavMenu);
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Escape") closeNavMenu();
		});

		btnBackToScenarios?.addEventListener("click", () => {
			flushWipSave();
			window.location.assign(backUrl);
		});

		btnBackToMainMenu?.addEventListener("click", () => {
			flushWipSave();
			window.location.assign("./");
		});
	}

	// "Next Scenario" → if all scenarios complete, show wrap-up; else select screen.
	function goToNextScenario() {
		const allComplete = SCENARIO_MANIFEST.every((e) => isCompleted(progress, e.id));
		if (allComplete) {
			resultScreen!.classList.add("hidden");
			document.getElementById("wrap-up-screen")?.classList.remove("hidden");
		} else {
			window.location.assign(backUrl);
		}
	}
	btnNextScenario!.addEventListener("click", goToNextScenario);
	btnDebriefNext?.addEventListener("click", goToNextScenario);

	// GAME-094: "Continue →" swaps the results view for the teaching debrief panel.
	btnContinue?.addEventListener("click", () => {
		resultMain?.classList.add("hidden");
		resultDebrief?.classList.remove("hidden");
	});
	btnDebriefBack?.addEventListener("click", () => {
		resultDebrief?.classList.add("hidden");
		resultMain?.classList.remove("hidden");
	});

	// Wrap-up "Play Again" → back to select screen
	document.getElementById("btn-wrap-up-replay")?.addEventListener("click", () => {
		window.location.assign(backUrl);
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
