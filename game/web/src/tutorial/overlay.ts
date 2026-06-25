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
  /** Selector(s) to ring + (when paused) keep interactive. */
  highlight?: string | string[];
  /** Selector(s) to un-hide for this step (start hidden on load). */
  reveal?: string | string[];
  /** Block all input except the highlight target(s) while this step is shown. */
  pauseInput?: boolean;
  advance: AdvanceTrigger;
}

const PANEL_ID = "tutorial-panel";

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
    pauseInput: true,
    advance: { on: "click-target" },
  },
  {
    text: "Now click precincts on the map to paint them into District 2.",
    highlight: "#map-svg",
    pauseInput: true,
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
    text: "Watch the **Map Validity** panel — it flags a district that's too big, too small, or split in two.",
    highlight: "#validity-container",
    advance: { on: "next" },
  },
  {
    text: "Even out the populations and keep each district connected until the panel's all green.",
    highlight: "#validity-container",
    advance: { on: "next" },
  },
  {
    text: "Legal map? Hit **Submit**.",
    highlight: "#btn-submit",
    advance: { on: "submit" },
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
    text: "Until now every voter was the same. They're not. **Lean** colors each precinct by who its voters favor — and this is what that produces: the **election result**, district by district.",
    reveal: ["#filter-lean", "#results-heading", "#results-container"],
    highlight: ["#filter-lean", "#results-container"],
    advance: { on: "next" },
  },
  {
    text: "Repaint a district and watch the result move. The lines you draw decide who wins.",
    highlight: "#results-container",
    advance: { on: "paint-count", district: 2, n: 5 },
  },
  {
    text: "**County** borders show the old administrative lines — another way to read the map.",
    reveal: "#filter-county",
    highlight: "#filter-county",
    pauseInput: true,
    advance: { on: "click-target" },
  },
  {
    text: "That's the whole picture. Draw your three districts and hit **Submit**.",
    highlight: ["#district-toolbar", "#btn-submit"],
    advance: { on: "submit" },
  },
];

/**
 * tutorial-004 — "Capstone" (DESIGN-012 / GAME-099). A light orientation over a fuller map
 * with every tool visible from the start (nothing hidden, no `reveal`): orient → paint →
 * submit, then step back. The player synthesises T1–T3 — draw connected districts, read the
 * lean + result — as the bridge to the real campaign scenarios.
 */
const TUTORIAL_004: TutorialStep[] = [
  {
    text: "The capstone — everything you've learned, one map. Nothing's hidden: the **Map Validity** panel, the **Lean** view, the **County** borders, and the **election result** are all here from the start.",
    advance: { on: "next" },
  },
  {
    text: "Draw your four districts the way you have all along. Keep each one connected, and glance at the result to see who your lines elect — there's no score to chase here.",
    highlight: ["#district-toolbar", "#map-svg"],
    advance: { on: "paint-count", district: 2, n: 5 },
  },
  {
    text: "When your map's done, hit **Submit**. Then on to the real thing.",
    highlight: "#btn-submit",
    advance: { on: "submit" },
  },
];

const SCRIPTS: Record<string, TutorialStep[]> = {
  "tutorial-001": TUTORIAL_001,
  "tutorial-002": TUTORIAL_002,
  "tutorial-003": TUTORIAL_003,
  "tutorial-004": TUTORIAL_004,
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
  const controls = document.createElement("div");
  controls.className = "tutorial-controls";
  const nextBtn = document.createElement("button");
  nextBtn.className = "tutorial-next";
  nextBtn.textContent = "Next →";
  const skipBtn = document.createElement("button");
  skipBtn.className = "tutorial-skip";
  skipBtn.textContent = "Skip tutorial";
  controls.append(nextBtn, skipBtn);
  panel.append(textEl, controls);
  document.body.appendChild(panel);

  nextBtn.addEventListener("click", () => {
    if (script[stepIdx]?.advance.on === "next") advance();
  }, { signal: overlayAc.signal });
  skipBtn.addEventListener("click", () => finish(), { signal: overlayAc.signal });
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") finish();
  }, { signal: overlayAc.signal });

  function clearStepDecorations(): void {
    stepCleanup?.();
    stepCleanup = null;
    document.querySelectorAll(".tutorial-highlight").forEach((el) =>
      el.classList.remove("tutorial-highlight"),
    );
    document.querySelectorAll(".tutorial-interactive").forEach((el) =>
      el.classList.remove("tutorial-interactive"),
    );
    editorRoots.forEach((r) => r.classList.remove("tutorial-paused"));
  }

  function finish(): void {
    clearStepDecorations();
    overlayAc.abort();
    panel.remove();
    document.querySelectorAll(".tutorial-reveal-hidden").forEach((el) =>
      el.classList.remove("tutorial-reveal-hidden"),
    );
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

    if (step.pauseInput) {
      editorRoots.forEach((r) => r.classList.add("tutorial-paused"));
      targets.forEach((el) => el.classList.add("tutorial-interactive"));
    }

    nextBtn.style.display = step.advance.on === "next" ? "" : "none";

    stepCleanup = setupAdvance(step, targets, advance, store);
  }

  renderStep();
}

/** Wire the step's advance trigger; returns a cleanup that tears down its listeners. */
function setupAdvance(
  step: TutorialStep,
  targets: HTMLElement[],
  advance: () => void,
  store: StoreLike,
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
      // Already satisfied? (defensive) — advance on next tick.
      const unsub = store.subscribe(() => {
        if (count() >= n) {
          unsub();
          advance();
        }
      });
      return () => unsub();
    }
    case "auto": {
      const t = window.setTimeout(() => advance(), step.advance.ms);
      return () => window.clearTimeout(t);
    }
  }
}
