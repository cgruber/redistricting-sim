/**
 * Guided-overlay engine (GAME-076, designed in DESIGN-012).
 *
 * Runs a registered step script for a `guided: true` scenario: shows a coach panel over
 * the editor, highlights a control, optionally pauses input (pointer-events cascade), can
 * `reveal` a control that started hidden, and advances through the script. Activation,
 * skip/persist, and the T1 paint-only script live here.
 *
 * Input-pause uses the pointer-events cascade (NOT a z-index spotlight): the editor roots
 * (#app-header + #main) get `pointer-events: none`, the highlight target gets
 * `pointer-events: auto` (a descendant re-enables even under a disabled ancestor), and the
 * panel/Skip live at <body> level so they're always clickable.
 */

import type { Scenario } from "../model/scenario.js";
import type { GameStore } from "../store/gameStore.js";

export type AdvanceTrigger =
	| { on: "next" }
	| { on: "click-target" }
	| { on: "any-map-click" }
	| { on: "paint-count"; district: number; n: number }
	| { on: "submit" }
	| { on: "auto"; ms: number };

export interface TutorialStep {
	text: string;
	/** Selector(s) to ring + keep interactive this step. */
	highlight?: string | string[];
	/** Selector(s) to un-hide for this step (start hidden on load). */
	reveal?: string | string[];
	advance: AdvanceTrigger;
}

const PANEL_ID = "tutorial-panel";

/** Teardown of the currently-running overlay (if any), so Reset can restart it in place. */
let activeOverlayTeardown: (() => void) | null = null;

// ─── Step scripts (keyed by scenario id) ──────────────────────────────────────

/** tutorial-001 — paint-only welcome (DESIGN-012). Selectors are current as of GAME-097. */
const TUTORIAL_001: TutorialStep[] = [
	{
		text: "Welcome. This whole county is **District 1** — your job is to split it into two.",
		advance: { on: "next" },
	},
	{
		text: "Pick **District 2** from the painter on the left.",
		highlight: '[data-district="2"]',
		advance: { on: "click-target" },
	},
	{
		text: "Now click precincts on the map to paint them into District 2.",
		highlight: "#map-svg",
		advance: { on: "paint-count", district: 2, n: 5 },
	},
	{
		text: "Changed your mind? **Undo** steps back.",
		highlight: "#btn-undo",
		advance: { on: "next" },
	},
	{
		text: "When the county is split into two districts, hit **Submit**.",
		highlight: "#btn-submit",
		advance: { on: "submit" },
	},
];

/**
 * tutorial-002 — "A Legal Map" (DESIGN-012). Introduces the structural rules
 * (balanced population + contiguity) and the Map Validity panel that reports them.
 * Still pre-electoral: no views, no election result. The validity panel is the star.
 * Selectors: `#district-toolbar` = left paint toolbar, `#map-svg` = map,
 * `#validity-container` = the Map Validity panel, `#btn-submit` = submit.
 */
const TUTORIAL_002: TutorialStep[] = [
	{
		text: "Bigger map — and now there are **rules**. A **legal** map needs two things: districts roughly equal in population, and each one a single connected piece.",
		advance: { on: "next" },
	},
	{
		text: "Paint your three districts like before — pick a district, then click precincts.",
		highlight: ["#district-toolbar", "#map-svg"],
		advance: { on: "paint-count", district: 2, n: 5 },
	},
	{
		text: "Watch the **Map Validity** panel — it flags a district that's too big, too small, or split in two, and turns all green when the map is **legal**.",
		highlight: "#validity-container",
		advance: { on: "next" },
	},
	{
		text: "That's the goal. Hit **Done**, then the map's yours: even the districts out until the **Map Validity** panel is all green, and **Submit** once it's a legal map.",
		advance: { on: "next" },
	},
];

/**
 * tutorial-003 — "Reading the Vote" (DESIGN-012 / GAME-098). The first electoral layer:
 * the engine's `reveal` action is used for the first time here. The election-result panel
 * and the Lean view are revealed **together** (lean = who voters favor; the result = who
 * wins — a causal pair), then the County view. The result is shown to *read* (repaint and
 * watch it move), not to exploit — the objective stays mechanical (district_count).
 *
 * Reveal targets (start hidden on load, surfaced as their step fires): `#filter-lean`,
 * `#results-heading` + `#results-container`, `#filter-county`.
 *
 * NOTE: the City view step (DESIGN-012 step 5) is descoped until the city-limits overlay
 * (GAME-096) ships — there is no `#filter-city` yet. The map already carries an urban core,
 * so that step can be added later without a map change.
 */
const TUTORIAL_003: TutorialStep[] = [
	{
		text: "A new map, with some geography — a river runs through the Bend. It's just scenery; your districts can cross it freely.",
		advance: { on: "next" },
	},
	{
		text: "Until now every voter was the same. They're not. Click **Lean** to colour each precinct by who its voters favour — and the **election result** panel (just appeared) shows what that produces, district by district.",
		reveal: ["#filter-lean", "#results-heading", "#results-container"],
		highlight: "#filter-lean",
		advance: { on: "click-target" },
	},
	{
		text: "Repaint a district and watch the result move. The lines you draw decide who wins.",
		highlight: "#results-container",
		advance: { on: "paint-count", district: 2, n: 5 },
	},
	{
		text: "**County** borders are the old administrative lines. Like the river, they're **cosmetic** — they don't affect your districts at all; they just help you read the map and ground where things are.",
		reveal: "#filter-county",
		highlight: "#filter-county",
		advance: { on: "click-target" },
	},
	{
		text: "That's the whole picture. Hit **Done**, then draw your three districts — balanced and connected — and **Submit** once the **Map Validity** panel is all green.",
		advance: { on: "next" },
	},
];

/**
 * tutorial-004 — "Synthesis" (DESIGN-012 / GAME-099). A light orientation over a fuller map
 * with every tool visible from the start (nothing hidden, no `reveal`): orient → paint → a
 * closing "Done" beat that releases the player. Like T2/T3, it ends on **Done**, not an
 * in-overlay Submit — the final step is frozen (no highlight), so clicking Done ends the
 * tutorial and unlocks everything, and the player pans/inspects/submits on their own. The player
 * synthesises T1–T3 (connected districts, read the lean + result) — a milestone, not the last
 * rung: T5 (multi-party) and T6 (independent) still follow before the campaign.
 */
const TUTORIAL_004: TutorialStep[] = [
	{
		text: "Putting it together — everything you've learned so far, one map. Nothing's hidden: the **Map Validity** panel, the **Lean** view, the **County** borders, and the **election result** are all here from the start.",
		advance: { on: "next" },
	},
	{
		text: "Get going — pick **District 2** and paint a full district's worth of precincts into it, keeping it connected. Watch the counter; glance at the result to see who your lines elect.",
		highlight: ["#district-toolbar", "#map-svg"],
		advance: { on: "paint-count", district: 2, n: 32 },
	},
	{
		text: "You've drawn a district — you've got this. Hit **Done** and the map is yours: pan around, watch the **Map Validity** panel, and **Submit** when your four districts are balanced and connected. That's every tool, one map — the whole craft is yours now.",
		advance: { on: "next" },
	},
];

/**
 * tutorial-005 — "A Three-Way Race" (GAME-120). A light orientation over the multiparty map
 * (public tutorial, rung 5): three PARTIES contesting every district, leans hung on real geography
 * (GAME-119) and outcomes as named candidates (GAME-117). Everything is visible from the start
 * (nothing hidden, no `reveal`), like T4. The one new beat is the balance twist — the dense city
 * needs the SMALLER district — taught by having the player paint the compact centre first. Ends
 * on **Done** (frozen final step), releasing the player to carve the wings and Submit on their own.
 */
const TUTORIAL_005: TutorialStep[] = [
	{
		text: "A three-cornered race. Three PARTIES run across the Bend — **Ken** out west, **Ryu** in the city, **Chun-Li** out east — each with a candidate in every district. Everything's here from the start: the **Lean** view, the **election result**, and the **Map Validity** panel.",
		advance: { on: "next" },
	},
	{
		text: "Click **Lean** to colour each precinct by the party its voters favour. Three bases show up — Ken orange in the west, Ryu purple in the centre, Chun-Li teal in the east. That's who you're drawing around.",
		highlight: "#filter-lean",
		advance: { on: "click-target" },
	},
	{
		text: "One catch before you carve: Hawthorn city holds most of the people. Three equal-width columns and the middle bursts the balance limit — the **crowded centre needs the smaller district**. Pick **District 2** and paint the city core into a tight central district; let the rural wings run wide.",
		highlight: ["#district-toolbar", "#map-svg"],
		advance: { on: "paint-count", district: 2, n: 18 },
	},
	{
		text: "That's the centre. Hit **Done** and the map is yours — carve the west and east wings, keep all three balanced and connected, and **Submit** when the **Map Validity** panel is green. Can you give each party a seat?",
		advance: { on: "next" },
	},
];

/**
 * tutorial-006 — "The Hollow's Own" (GAME-121). A light orientation over the home-base independent
 * map (public tutorial, rung 6 — the final rung): two major parties contest every district, and
 * Dhalsim — an INDEPENDENT — is on the ballot only in the district holding his home (the ⌂ pin),
 * though his lean shows map-wide. Everything is visible from the start (like T4/T5). The one new
 * beat is the lean-vs-ballot distinction — taught by having the player gather the eastern Hollow
 * (around the ⌂ pin) into one district so Dhalsim is both on the ballot AND holds the votes. Ends
 * on **Done** (frozen final step), releasing the player to carve the rest and Submit.
 */
const TUTORIAL_006: TutorialStep[] = [
	{
		text: "Hollowmere. Two parties run everywhere — **Ken** out west, **Ryu** through the centre — but the eastern Hollow has its own: **Dhalsim**, an independent. Everything's here from the start: the **Lean** view, the **election result**, and the **Map Validity** panel.",
		advance: { on: "next" },
	},
	{
		text: "Click **Lean** to colour each precinct by who its voters favour. Dhalsim's teal fills the east — that's who *favours* him. But find the **⌂ pin**: that's his home, and an independent is on the **ballot only in the district that holds it**. Lean is map-wide; the ballot is home-only.",
		highlight: "#filter-lean",
		advance: { on: "click-target" },
	},
	{
		text: "So give the Hollow a voice: pick **District 3** and paint the eastern precincts — the teal ones, around the **⌂ pin** — into it. Keep his home and his base together and Dhalsim is both on the ballot *and* ahead.",
		highlight: ["#district-toolbar", "#map-svg"],
		advance: { on: "paint-count", district: 3, n: 20 },
	},
	{
		text: "That's the Hollow together. Hit **Done** and the map is yours — carve the west and centre into the other two districts, keep all three balanced and connected, and **Submit**. Watch the result: with his home and base in one district, Dhalsim carries the Hollow. (Split it across districts instead, and his voice slips away.)",
		advance: { on: "next" },
	},
];

const SCRIPTS: Record<string, TutorialStep[]> = {
	"tutorial-001": TUTORIAL_001,
	"tutorial-002": TUTORIAL_002,
	"tutorial-003": TUTORIAL_003,
	"tutorial-004": TUTORIAL_004,
	"tutorial-005": TUTORIAL_005,
	"tutorial-006": TUTORIAL_006,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function asArray(sel?: string | string[]): string[] {
	if (sel === undefined) return [];
	return Array.isArray(sel) ? sel : [sel];
}

function selectorsToElements(sel?: string | string[]): HTMLElement[] {
	const out: HTMLElement[] = [];
	for (const s of asArray(sel)) {
		document.querySelectorAll<HTMLElement>(s).forEach((el) => out.push(el));
	}
	return out;
}

/** Minimal **bold** → <strong> for coach copy (author-controlled text). */
function renderText(el: HTMLElement, text: string): void {
	el.innerHTML = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function completeKey(id: string): string {
	return `tutorial-${id}-complete`;
}

/**
 * Keyboard-safe map lock (GAME-105). `inert` on #map-svg removes it from the tab order and
 * blocks pointer + a11y — so a keyboard user can't focus the SVG and trip its number-key
 * paint handler during a frozen tutorial step. Restored (with tabindex="0") on paint steps
 * and on teardown.
 *
 * NOTE: `inert` is an IDL property of HTMLElement only, NOT SVGElement — `svg.inert = true`
 * would write a no-op JS expando. We must use the content attribute, which is namespace-
 * agnostic and applies to the SVG. We also blur() explicitly: neither the attribute nor
 * tabindex drops focus the SVG already holds (e.g. carried over from a prior paint step).
 */
function setMapKeyboardLock(locked: boolean): void {
	const svg = document.getElementById("map-svg");
	if (!svg) return;
	if (locked) {
		svg.setAttribute("inert", "");
		svg.setAttribute("tabindex", "-1");
		svg.blur(); // drop focus retained from a prior paint step
	} else {
		svg.removeAttribute("inert");
		svg.setAttribute("tabindex", "0"); // restore the editor's default focusability
	}
}

// ─── Engine ──────────────────────────────────────────────────────────────────

interface StoreLike {
	getState(): GameStore;
	subscribe(listener: () => void): () => void;
}

/**
 * Start the guided overlay for a scenario, if it opts in (`guided: true`) and has a
 * registered script. No-op otherwise. Respects the per-scenario "complete" flag so a
 * returning player isn't re-coached; `?resetTutorial=1` forces it (and clears the flags).
 */
export function startTutorialOverlay(scenario: Scenario, store: StoreLike): void {
	if (scenario.guided !== true) return;
	const script = SCRIPTS[scenario.id];
	if (!script || script.length === 0) return;

	const params = new URLSearchParams(window.location.search);
	if (params.get("resetTutorial") === "1") {
		clearTutorialFlags();
	} else if (isComplete(scenario.id)) {
		return;
	}

	runOverlay(scenario.id, script, store);
}

/**
 * Restart the guided overlay from step 1, in place — used by Reset, so resetting a tutorial
 * zeroes the whole scenario (map *and* guidance), not just the painted map. No-op for
 * non-guided scenarios or those without a script. Tears down any running overlay first and
 * clears the per-scenario "complete" flag so the coach reappears.
 */
export function restartTutorialOverlay(scenario: Scenario, store: StoreLike): void {
	if (scenario.guided !== true) return;
	const script = SCRIPTS[scenario.id];
	if (!script || script.length === 0) return;
	activeOverlayTeardown?.();
	try {
		localStorage.removeItem(completeKey(scenario.id));
	} catch {
		/* ignore */
	}
	runOverlay(scenario.id, script, store);
}

function isComplete(id: string): boolean {
	try {
		return localStorage.getItem(completeKey(id)) === "1";
	} catch {
		return false;
	}
}

function clearTutorialFlags(): void {
	try {
		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k && k.startsWith("tutorial-") && k.endsWith("-complete")) keys.push(k);
		}
		keys.forEach((k) => localStorage.removeItem(k));
	} catch {
		/* ignore */
	}
}

function runOverlay(id: string, script: TutorialStep[], store: StoreLike): void {
	const overlayAc = new AbortController();
	let stepIdx = 0;
	let stepCleanup: (() => void) | null = null;

	// Reveal targets start hidden; un-hidden as their step fires.
	const revealEls = new Set<HTMLElement>();
	for (const step of script) {
		for (const el of selectorsToElements(step.reveal)) revealEls.add(el);
	}
	revealEls.forEach((el) => el.classList.add("tutorial-reveal-hidden"));

	const editorRoots = [
		document.getElementById("app-header"),
		document.getElementById("main"),
	].filter((el): el is HTMLElement => el !== null);

	// ── Panel (body-level coach bar) ─────────────────────────────────────────────
	const panel = document.createElement("div");
	panel.id = PANEL_ID;
	panel.setAttribute("role", "dialog");
	panel.setAttribute("aria-live", "polite");
	panel.setAttribute("aria-label", "Tutorial");
	const textEl = document.createElement("div");
	textEl.className = "tutorial-text";
	// Live progress line for paint-count steps ("District 2 — 4 / 32 painted"). Hidden otherwise.
	const progressEl = document.createElement("div");
	progressEl.className = "tutorial-progress";
	progressEl.style.display = "none";
	const controls = document.createElement("div");
	controls.className = "tutorial-controls";
	const nextBtn = document.createElement("button");
	nextBtn.className = "tutorial-next";
	nextBtn.textContent = "Next →";
	const skipBtn = document.createElement("button");
	skipBtn.className = "tutorial-skip";
	skipBtn.textContent = "Skip tutorial";
	controls.append(nextBtn, skipBtn);
	panel.append(textEl, progressEl, controls);
	document.body.appendChild(panel);

	nextBtn.addEventListener(
		"click",
		() => {
			if (script[stepIdx]?.advance.on === "next") advance();
		},
		{ signal: overlayAc.signal },
	);
	skipBtn.addEventListener("click", () => finish(), { signal: overlayAc.signal });
	document.addEventListener(
		"keydown",
		(e: KeyboardEvent) => {
			if (e.key === "Escape") finish();
		},
		{ signal: overlayAc.signal },
	);

	function clearStepDecorations(): void {
		stepCleanup?.();
		stepCleanup = null;
		document
			.querySelectorAll(".tutorial-highlight")
			.forEach((el) => el.classList.remove("tutorial-highlight"));
		document
			.querySelectorAll(".tutorial-interactive")
			.forEach((el) => el.classList.remove("tutorial-interactive"));
		editorRoots.forEach((r) => r.classList.remove("tutorial-paused"));
		// GAME-105: lift the keyboard lock on the map (the overlay is done with this step).
		setMapKeyboardLock(false);
	}

	// Tear down the overlay DOM/listeners WITHOUT marking it complete (used by restart).
	function teardown(): void {
		clearStepDecorations();
		overlayAc.abort();
		panel.remove();
		document
			.querySelectorAll(".tutorial-reveal-hidden")
			.forEach((el) => el.classList.remove("tutorial-reveal-hidden"));
		if (activeOverlayTeardown === teardown) activeOverlayTeardown = null;
	}
	activeOverlayTeardown = teardown;

	function finish(): void {
		teardown();
		try {
			localStorage.setItem(completeKey(id), "1");
		} catch {
			/* ignore */
		}
	}

	function advance(): void {
		clearStepDecorations();
		stepIdx += 1;
		if (stepIdx >= script.length) {
			finish();
			return;
		}
		renderStep();
	}

	function renderStep(): void {
		const step = script[stepIdx]!;
		renderText(textEl, step.text);

		// Reveal (un-hide) this step's targets.
		selectorsToElements(step.reveal).forEach((el) => el.classList.remove("tutorial-reveal-hidden"));

		const targets = selectorsToElements(step.highlight);
		targets.forEach((el) => el.classList.add("tutorial-highlight"));

		// Input is locked while the coach is up: only the highlighted target(s) stay clickable, plus
		// Next/Skip at body level. The map + painter unlock ONLY on steps that ask the player to paint
		// (paint-count / any-map-click). So an intro or "watch the panel" step freezes everything but
		// Next/Skip — the player can't wander off and knock a control into an unexpected state — and a
		// closing "Done" beat (next-advance, no highlight) is frozen too, releasing the editor on Done.
		editorRoots.forEach((r) => r.classList.add("tutorial-paused"));
		const paints = step.advance.on === "paint-count" || step.advance.on === "any-map-click";
		const paintTargets = paints ? selectorsToElements(["#map-svg", "#district-toolbar"]) : [];
		[...targets, ...paintTargets].forEach((el) => el.classList.add("tutorial-interactive"));
		// GAME-105: keyboard-safe lock. `.tutorial-paused` (pointer-events:none) only blocks the
		// mouse; the map's keydown handler stays live whenever #map-svg holds focus, so a keyboard
		// user could paint during a frozen step. On non-paint steps make #map-svg `inert` (auto-
		// blurs it, drops it from tab order, blocks pointer); on paint steps the map stays live.
		// The district toolbar is left to `.tutorial-interactive` (its buttons only change the
		// active district, not assignments) so click-target steps like "pick District 2" still work.
		setMapKeyboardLock(!paints);

		// On the final step the "Next" button reads "Done" — it finishes the tutorial (and unlocks
		// the editor) rather than stepping forward.
		nextBtn.textContent = stepIdx === script.length - 1 ? "Done" : "Next →";
		nextBtn.style.display = step.advance.on === "next" ? "" : "none";

		// Paint-count steps show a live "X / N painted" counter so the player can see the goal and
		// their progress toward it (the step otherwise looks locked until the unseen threshold trips).
		const isPaintCount = step.advance.on === "paint-count";
		progressEl.style.display = isPaintCount ? "" : "none";
		if (!isPaintCount) progressEl.classList.remove("tutorial-progress-complete");
		const reportProgress = (text: string, done: boolean) => {
			progressEl.textContent = text;
			progressEl.classList.toggle("tutorial-progress-complete", done);
		};

		stepCleanup = setupAdvance(step, targets, advance, store, reportProgress);
	}

	renderStep();
}

/** Wire the step's advance trigger; returns a cleanup that tears down its listeners. */
function setupAdvance(
	step: TutorialStep,
	targets: HTMLElement[],
	advance: () => void,
	store: StoreLike,
	reportProgress: (text: string, done: boolean) => void,
): () => void {
	switch (step.advance.on) {
		case "next":
			return () => {};
		case "click-target": {
			const ac = new AbortController();
			targets.forEach((el) =>
				el.addEventListener("click", () => advance(), { signal: ac.signal, once: false }),
			);
			return () => ac.abort();
		}
		case "any-map-click": {
			const ac = new AbortController();
			document.getElementById("map-svg")?.addEventListener("click", () => advance(), {
				signal: ac.signal,
			});
			return () => ac.abort();
		}
		case "submit": {
			const ac = new AbortController();
			document.getElementById("btn-submit")?.addEventListener("click", () => advance(), {
				signal: ac.signal,
			});
			return () => ac.abort();
		}
		case "paint-count": {
			const { district, n } = step.advance;
			const count = () => {
				let c = 0;
				for (const d of store.getState().assignments.values()) if (d === district) c += 1;
				return c;
			};
			let advanceTimer = 0;
			let fired = false;
			let unsub = () => {};
			const tick = () => {
				const c = count();
				const done = c >= n;
				reportProgress(`District ${district} — ${Math.min(c, n)} / ${n} painted`, done);
				if (done && !fired) {
					fired = true;
					unsub();
					// A short beat so the player sees the count reach the target before painting freezes
					// and the coach advances to the closing "Done" step.
					advanceTimer = window.setTimeout(() => advance(), 450);
				}
			};
			unsub = store.subscribe(tick);
			tick(); // initial count + display (also handles an already-satisfied step)
			return () => {
				unsub();
				if (advanceTimer) window.clearTimeout(advanceTimer);
			};
		}
		case "auto": {
			const t = window.setTimeout(() => advance(), step.advance.ms);
			return () => window.clearTimeout(t);
		}
	}
}
