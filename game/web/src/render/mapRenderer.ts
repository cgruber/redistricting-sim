/**
 * D3 SVG renderer for the hex precinct map.
 *
 * Uses the data join pattern (selection.data(data).join(...)) — not manual append loops.
 * Reads state from the Zustand store; does not mutate it.
 *
 * SVG layer order (bottom → top):
 *   borderGroup      — committed district boundaries (solid white)
 *   hexGroup         — precinct fills
 *   previewBorderGroup — in-stroke boundary preview (dashed white)
 *
 * All persistent event listeners are registered once in the constructor via delegation
 * on the SVG node. Nothing is re-registered in render().
 */

import * as d3 from "d3";
import { hexCorners, mapBounds } from "../model/generator.js";
import type { Precinct } from "../model/types.js";
import { DISTRICT_COLORS, PARTY_COLORS, PARTY_LABELS } from "../model/types.js";
import type { GameStore } from "../store/gameStore.js";

// ─── Public interface ─────────────────────────────────────────────────────────

/** View mode toggle — render concern only, not game state */
export type ViewMode = "districts" | "lean";

/**
 * Renderer-agnostic interface for the hex precinct map.
 * Game logic (main.ts, store) must depend only on this interface.
 * SvgMapRenderer is the v1 implementation; a Canvas+SVG hybrid may replace it
 * at >800 precincts without callers needing to change.
 */
export interface MapRenderer {
	render(): void;
	setViewMode(mode: ViewMode): void;
	/**
	 * Toggle the county border overlay layer.
	 * No-op in SvgMapRenderer until county_id data is present in scenarios;
	 * included from v1 so callers are already written to the interface.
	 */
	setCountyBordersVisible(visible: boolean): void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type SVGSel = d3.Selection<SVGSVGElement, unknown, null, undefined>;
// D3's append returns a Selection with parent type null when chained from select(element)
type GSel = d3.Selection<SVGGElement, unknown, null, undefined>;
type Segment = { x1: number; y1: number; x2: number; y2: number };

// ─── Polygon path helper ─────────────────────────────────────────────────────

function hexPolygonPath(p: Precinct): string {
	const corners = hexCorners(p.center);
	return `M${corners.map((c) => c.join(",")).join("L")}Z`;
}

// ─── Boundary segment computation ────────────────────────────────────────────

/**
 * Returns all boundary segments for the given assignment map.
 * A segment is drawn for every hex edge where the two adjacent precincts
 * belong to different districts, and for every grid-boundary edge.
 */
function computeBoundarySegments(
	precincts: Precinct[],
	assignments: Map<number, number | null>,
): Segment[] {
	const segments: Segment[] = [];
	for (const p of precincts) {
		const pDist = assignments.get(p.id);
		const corners = hexCorners(p.center);
		for (let i = 0; i < 6; i++) {
			const nId = p.neighbors[i] ?? null;
			const c0 = corners[i];
			const c1 = corners[(i + 1) % 6];
			if (c0 === undefined || c1 === undefined) continue;
			if (nId === null) {
				segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
				continue;
			}
			if (pDist !== assignments.get(nId)) {
				segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
			}
		}
	}
	return segments;
}

// ─── Renderer class ──────────────────────────────────────────────────────────

export class SvgMapRenderer implements MapRenderer {
	private svg: SVGSel;
	private borderGroup: GSel;
	private hexGroup: GSel;
	private previewBorderGroup: GSel;
	private getState: () => GameStore;
	private paintStroke: GameStore["paintStroke"];
	private setActiveDistrict: GameStore["setActiveDistrict"];

	// Brush state
	private isPainting = false;
	private strokePrecincts: Set<number> = new Set();
	private strokeDistrict = 1;
	// Snapshot of assignments at stroke start — used to compute preview boundaries
	private strokeSnapshot: Map<number, number | null> | null = null;

	// Hover state — tracks which path is currently highlighted
	private hoveredPath: SVGPathElement | null = null;

	// View mode — render concern only, not game state
	private viewMode: ViewMode = "districts";

	// Population range — cached once (precincts are immutable)
	private popMin = 0;
	private popMax = 1;

	constructor(
		svgEl: SVGSVGElement,
		getState: () => GameStore,
		paintStroke: GameStore["paintStroke"],
		setActiveDistrict: GameStore["setActiveDistrict"],
	) {
		this.getState = getState;
		this.paintStroke = paintStroke;
		this.setActiveDistrict = setActiveDistrict;

		this.svg = d3.select(svgEl);
		// Layer order matters: borderGroup behind hexes, previewBorderGroup on top
		this.borderGroup = this.svg.append("g").attr("class", "borders");
		this.hexGroup = this.svg.append("g").attr("class", "hexes");
		this.previewBorderGroup = this.svg.append("g").attr("class", "preview-borders");

		const pops = getState().precincts.map((p) => p.population);
		this.popMin = Math.min(...pops);
		this.popMax = Math.max(...pops);

		this.initViewBox();
		this.initBrushEvents();
		this.initHoverEvents();
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
		this.render();
	}

	setCountyBordersVisible(_visible: boolean) {
		// No-op until county_id data is present in scenarios.
	}

	private initViewBox() {
		const { precincts } = this.getState();
		const bounds = mapBounds(precincts);
		this.svg.attr("viewBox", `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
	}

	// ─── Main render ──────────────────────────────────────────────────────────

	/** Called on every committed state change. Reconciles fills and solid boundaries. */
	render() {
		const { precincts, assignments } = this.getState();

		this.hexGroup
			.selectAll<SVGPathElement, Precinct>("path.hex")
			.data(precincts, (d) => String(d.id))
			.join(
				(enter) =>
					enter
						.append("path")
						.attr("class", "hex")
						.attr("d", (d) => hexPolygonPath(d))
						.attr("stroke", "none")
						.attr("stroke-width", 0.5)
						.style("cursor", "crosshair"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("fill", (d) => this.hexFill(d, assignments))
			.attr("opacity", (d) => this.hexOpacity(d, assignments));

		this.renderBoundaries(computeBoundarySegments(precincts, assignments));
	}

	private renderBoundaries(segments: Segment[]) {
		this.borderGroup
			.selectAll<SVGLineElement, Segment>("line.boundary")
			.data(segments)
			.join(
				(enter) => enter.append("line").attr("class", "boundary").attr("stroke-linecap", "round"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("x1", (d) => d.x1)
			.attr("y1", (d) => d.y1)
			.attr("x2", (d) => d.x2)
			.attr("y2", (d) => d.y2)
			.attr("stroke", "#ffffff")
			.attr("stroke-width", 1.5)
			.attr("opacity", 0.6)
			.attr("stroke-dasharray", null);
	}

	// ─── Boundary preview (during drag) ───────────────────────────────────────

	/**
	 * Renders the preview boundary (where the boundary will be after this stroke)
	 * as a dashed overlay in previewBorderGroup. The committed solid boundaries in
	 * borderGroup are untouched — so old (solid) and new (dashed) are visible together.
	 */
	private updateBoundaryPreview() {
		if (this.strokeSnapshot === null) return;
		const { precincts } = this.getState();

		// Apply pending stroke on top of the snapshot
		const previewAssignments = new Map(this.strokeSnapshot);
		for (const id of this.strokePrecincts) {
			previewAssignments.set(id, this.strokeDistrict);
		}

		const segments = computeBoundarySegments(precincts, previewAssignments);

		this.previewBorderGroup
			.selectAll<SVGLineElement, Segment>("line.preview-boundary")
			.data(segments)
			.join(
				(enter) =>
					enter
						.append("line")
						.attr("class", "preview-boundary")
						.attr("stroke-linecap", "round"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("x1", (d) => d.x1)
			.attr("y1", (d) => d.y1)
			.attr("x2", (d) => d.x2)
			.attr("y2", (d) => d.y2)
			.attr("stroke", "#ffffff")
			.attr("stroke-width", 2)
			.attr("stroke-dasharray", "5,4")
			.attr("opacity", 0.85);
	}

	private clearBoundaryPreview() {
		this.previewBorderGroup.selectAll("line.preview-boundary").remove();
	}

	// ─── Hover events ─────────────────────────────────────────────────────────

	/**
	 * Single delegated mousemove/mouseout on the SVG.
	 * Hover only sets stroke/opacity — never fill — so clearHover never needs to
	 * restore fill (which would clobber in-progress paint visuals).
	 */
	private initHoverEvents() {
		const svgNode = this.svg.node()!;

		svgNode.addEventListener("mousemove", (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.classList.contains("hex")) {
				this.clearHover();
				return;
			}
			const path = target as SVGPathElement;
			const d = d3.select<SVGPathElement, Precinct>(path).datum();
			if (d === undefined) return;

			if (this.hoveredPath !== path) {
				this.clearHover();
				this.hoveredPath = path;
				d3.select(path).attr("stroke", "#ffffff").attr("stroke-width", 1.5).attr("opacity", 0.95);

				const { assignments } = this.getState();
				const dId = assignments.get(d.id);
				const bar = document.getElementById("status-bar");
				if (bar !== null) {
					const distLabel = dId != null ? `District ${dId}` : "Unassigned";
					const topParty = (["D", "R", "L", "G", "I"] as const).reduce((a, b) =>
						d.partyShare[a] > d.partyShare[b] ? a : b,
					);
					bar.textContent = `Precinct ${d.id} | ${distLabel} | Pop: ${d.population.toLocaleString()} | Lean: ${PARTY_LABELS[topParty]} (${(d.partyShare[topParty] * 100).toFixed(1)}%)`;
				}
			}
		});

		svgNode.addEventListener("mouseout", (event: MouseEvent) => {
			if (!svgNode.contains(event.relatedTarget as Node | null)) {
				this.clearHover();
			}
		});
	}

	/** Restores stroke/opacity only — never fill (hover never changes fill). */
	private clearHover() {
		if (this.hoveredPath === null) return;
		const path = this.hoveredPath;
		this.hoveredPath = null;
		const { assignments } = this.getState();
		const d = d3.select<SVGPathElement, Precinct>(path).datum();
		if (d !== undefined) {
			d3.select(path)
				.attr("stroke", "none")
				.attr("stroke-width", 0.5)
				.attr("opacity", this.hexOpacity(d, assignments));
		}
	}

	// ─── Brush events ─────────────────────────────────────────────────────────

	/** Delegated brush events — mousedown/mousemove on SVG, mouseup on window. */
	private initBrushEvents() {
		const svgNode = this.svg.node()!;

		svgNode.addEventListener("mousedown", (event: MouseEvent) => {
			const target = event.target as Element;
			if (!target.classList.contains("hex")) return;
			const path = target as SVGPathElement;
			const d = d3.select<SVGPathElement, Precinct>(path).datum();
			if (d === undefined) return;

			const { activeDistrict, assignments } = this.getState();
			this.isPainting = true;
			this.strokeDistrict = activeDistrict;
			this.strokePrecincts = new Set([d.id]);
			this.strokeSnapshot = new Map(assignments);
			this.setActiveDistrict(activeDistrict);
			this.applyPaintVisual(path, activeDistrict);
			this.updateBoundaryPreview();
		});

		svgNode.addEventListener("mousemove", (event: MouseEvent) => {
			if (!this.isPainting) return;
			const target = event.target as Element;
			if (!target.classList.contains("hex")) return;
			const path = target as SVGPathElement;
			const d = d3.select<SVGPathElement, Precinct>(path).datum();
			if (d === undefined || this.strokePrecincts.has(d.id)) return;

			this.strokePrecincts.add(d.id);
			this.applyPaintVisual(path, this.strokeDistrict);
			this.updateBoundaryPreview();
		});

		window.addEventListener("mouseup", () => {
			if (!this.isPainting) return;
			this.isPainting = false;
			this.clearBoundaryPreview();
			this.strokeSnapshot = null;
			const ids = Array.from(this.strokePrecincts);
			if (ids.length > 0) {
				// Single store commit → single undo step; render() reconciles the DOM
				this.paintStroke(ids, this.strokeDistrict);
			}
			this.strokePrecincts = new Set();
		});
	}

	/**
	 * Directly sets hex fill during a drag stroke (no store update — committed on mouseup).
	 * Skipped in lean mode: lean color is intrinsic to the precinct, not the assignment,
	 * so there is no hex-color feedback in lean mode; boundary preview is the signal.
	 */
	private applyPaintVisual(path: SVGPathElement, districtId: number) {
		if (this.viewMode === "lean") return;
		const d = d3.select<SVGPathElement, Precinct>(path).datum();
		const base = DISTRICT_COLORS[districtId - 1] ?? "#2a2a3e";
		const c = d3.hsl(base);
		if (d !== undefined && this.popMax > this.popMin) {
			const normPop = (d.population - this.popMin) / (this.popMax - this.popMin);
			c.l = 0.55 - normPop * 0.30;
		}
		d3.select(path).attr("fill", c.formatHex()).attr("opacity", 0.75);
	}

	// ─── Fill / opacity helpers ───────────────────────────────────────────────

	private hexFill(d: Precinct, assignments: GameStore["assignments"]): string {
		if (this.viewMode === "lean") {
			const lean = d.partyShare.D - d.partyShare.R;
			const t = (lean + 1) / 2; // 0 = full R (red), 1 = full D (blue)
			return d3.interpolateRdBu(t);
		}
		const dId = assignments.get(d.id);
		if (dId == null) return "#2a2a3e";
		const base = DISTRICT_COLORS[dId - 1] ?? "#2a2a3e";
		const normPop =
			this.popMax > this.popMin
				? (d.population - this.popMin) / (this.popMax - this.popMin)
				: 0.5;
		const c = d3.hsl(base);
		c.l = 0.55 - normPop * 0.30;
		return c.formatHex();
	}

	private hexOpacity(d: Precinct, assignments: GameStore["assignments"]): number {
		if (this.viewMode === "lean") return 0.9;
		const dId = assignments.get(d.id);
		return dId != null ? 0.75 : 0.35;
	}
}

// ─── Election results renderer ────────────────────────────────────────────────

export function renderResults(container: HTMLElement, state: GameStore): void {
	if (state.simulationResult === null || state.simulationResult.districtResults.length === 0) {
		container.innerHTML =
			'<div style="color:#606080;font-size:0.85rem;">Draw districts to see results</div>';
		return;
	}

	const { districtResults } = state.simulationResult;
	const html = districtResults
		.map((r) => {
			const color = DISTRICT_COLORS[r.districtId - 1] ?? "#888";
			const winnerColor = PARTY_COLORS[r.winner];
			const winnerLabel = PARTY_LABELS[r.winner];
			const dPct = (r.voteTotals.D * 100).toFixed(1);
			const rPct = (r.voteTotals.R * 100).toFixed(1);
			const marginPct = (r.margin * 100).toFixed(1);
			return `
      <div class="result-district" style="border-left-color:${color}">
        <div class="dist-name">District ${r.districtId}</div>
        <div class="winner-badge" style="background:${winnerColor};color:#fff">${winnerLabel} +${marginPct}%</div>
        <div class="vote-bar" style="--d-pct:${dPct}%"></div>
        <div class="vote-details">
          Blue ${dPct}% · Red ${rPct}% · ${r.precinctCount} precincts · pop ${r.population.toLocaleString()}
        </div>
      </div>`;
		})
		.join("");

	container.innerHTML = html;
}

export function renderLegend(container: HTMLElement, districtCount: number): void {
	const items = Array.from({ length: districtCount }, (_, i) => {
		const color = DISTRICT_COLORS[i] ?? "#888";
		return `<div class="legend-item">
      <div class="legend-swatch" style="background:${color}"></div>
      <span>District ${i + 1}</span>
    </div>`;
	});
	container.innerHTML = items.join("");
}

export function renderDistrictButtons(
	container: HTMLElement,
	districtCount: number,
	activeDistrict: number,
	onSelect: (id: number) => void,
): void {
	container.innerHTML = "";
	for (let i = 1; i <= districtCount; i++) {
		const color = DISTRICT_COLORS[i - 1] ?? "#888";
		const btn = document.createElement("button");
		btn.className = `district-btn${i === activeDistrict ? " active" : ""}`;
		btn.textContent = `District ${i}`;
		btn.style.background = color;
		btn.style.color = "#fff";
		btn.addEventListener("click", () => onSelect(i));
		container.appendChild(btn);
	}
}
