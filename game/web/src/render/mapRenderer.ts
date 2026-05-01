/**
 * D3 SVG renderer for the hex precinct map.
 *
 * Uses the data join pattern (selection.data(data).join(...)) — not manual append loops.
 * Reads state from the Zustand store; does not mutate it.
 *
 * SVG layer order (bottom → top, all inside zoomGroup):
 *   countyBorderGroup  — county boundary overlay (GAME-012; dashed gray; off by default)
 *   borderGroup        — committed district boundaries (solid white)
 *   hexGroup           — precinct fills
 *   previewBorderGroup — in-stroke boundary preview (dashed white)
 *
 * Pan/zoom (GAME-009):
 *   d3.zoom() applied to the SVG; pan and zoom share one transform on zoomGroup.
 *   Scroll wheel → zoom. Right-click drag → pan. Keyboard: =/+ zoom in, - zoom out, 0 reset.
 *   Filter allows only scroll and right-click; left-click passes through to the paint brush.
 *   Stroke widths scale inversely with zoom so apparent width stays constant.
 *
 * All persistent event listeners are registered once in the constructor via delegation
 * on the SVG node. Nothing is re-registered in render().
 */

import * as d3 from "d3";
import { hexCorners, mapBounds } from "../model/hex-geometry.js";
import type { Precinct } from "../model/types.js";
import { DISTRICT_COLORS, PARTY_LABELS } from "../model/types.js";
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

// ─── County boundary segment computation (GAME-012) ──────────────────────────

/**
 * Computes county boundary segments once at load time.
 * An edge between two adjacent precincts is a county boundary if their county_id values differ.
 * Each internal edge is counted once (lower-ID precinct draws the segment).
 * Outer edges (nId === null) are not county boundaries.
 */
function computeCountySegments(precincts: Precinct[]): Segment[] {
	const segments: Segment[] = [];
	for (const p of precincts) {
		const corners = hexCorners(p.center);
		for (let i = 0; i < 6; i++) {
			const nId = p.neighbors[i] ?? null;
			if (nId === null || nId < p.id) continue; // skip outer edges and already-drawn edges
			const neighbor = precincts[nId];
			if (neighbor === undefined) continue;
			if (p.county_id === undefined && neighbor.county_id === undefined) continue;
			if (p.county_id === neighbor.county_id) continue;
			const c0 = corners[i];
			const c1 = corners[(i + 1) % 6];
			if (c0 === undefined || c1 === undefined) continue;
			segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
		}
	}
	return segments;
}

// ─── Renderer class ──────────────────────────────────────────────────────────

export class SvgMapRenderer implements MapRenderer {
	private svg: SVGSel;
	private zoomGroup: GSel;
	private countyBorderGroup: GSel;
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

	// Zoom state (GAME-009)
	private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;
	private initialTransform: d3.ZoomTransform = d3.zoomIdentity;
	private currentK = 1; // current zoom scale; stroke widths divided by this

	// Base stroke widths (apparent px at any zoom level)
	private static readonly BOUNDARY_BASE_WIDTH = 2;
	private static readonly PREVIEW_BASE_WIDTH = 2.5;
	private static readonly COUNTY_BASE_WIDTH = 3;

	// Zoom parameters
	private static readonly ZOOM_STEP = 1.3;
	private static readonly MAX_ZOOM_MULTIPLIER = 8;
	private static readonly VIEWPORT_PADDING = 20;
	private static readonly FALLBACK_SVG_WIDTH = 800;
	private static readonly FALLBACK_SVG_HEIGHT = 600;
	private static readonly ZOOM_DURATION_SHORT = 200;
	private static readonly ZOOM_DURATION_RESET = 300;

	// Opacity values
	private static readonly BOUNDARY_OPACITY = 0.6;
	private static readonly COUNTY_OPACITY = 0.7;
	private static readonly PREVIEW_OPACITY = 0.85;
	private static readonly LEAN_OPACITY = 0.9;
	private static readonly ASSIGNED_OPACITY = 0.75;
	private static readonly UNASSIGNED_OPACITY = 0.35;
	private static readonly HOVER_OPACITY = 0.95;
	private static readonly HOVER_STROKE_WIDTH = 1.5;

	// Lightness coefficients for population-density district color shading
	// District hex lightness = HEX_LIGHTNESS_BASE − normPop × HEX_LIGHTNESS_RANGE
	private static readonly HEX_LIGHTNESS_BASE = 0.55;
	private static readonly HEX_LIGHTNESS_RANGE = 0.30;

	// Dash patterns (on,off in map units before zoom correction)
	private static readonly COUNTY_DASH_ON = 6;
	private static readonly COUNTY_DASH_OFF = 4;
	private static readonly PREVIEW_DASH_ON = 5;
	private static readonly PREVIEW_DASH_OFF = 4;

	// County border overlay (GAME-012): computed once at load, toggled on/off
	private countySegments: Segment[] = [];
	private countyBordersVisible = false;

	// Keyboard precinct navigation state
	private focusedPrecinctId: number | null = null;
	private keyboardFocusPath: SVGPathElement | null = null;

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

		// Zoom group wraps all map layers so the single transform drives pan/zoom.
		// Layer order (bottom → top inside zoomGroup): district borders, hexes, county borders, preview.
		// County borders must sit above hexes so filled hex paths don't obscure them.
		this.zoomGroup = this.svg.append("g").attr("class", "zoom-layer");
		this.borderGroup = this.zoomGroup.append("g").attr("class", "borders");
		this.hexGroup = this.zoomGroup.append("g").attr("class", "hexes");
		this.countyBorderGroup = this.zoomGroup.append("g").attr("class", "county-borders");
		this.previewBorderGroup = this.zoomGroup.append("g").attr("class", "preview-borders");

		const pops = getState().precincts.map((p) => p.population);
		this.popMin = Math.min(...pops);
		this.popMax = Math.max(...pops);

		this.countySegments = computeCountySegments(getState().precincts);

		this.initZoom();
		this.initBrushEvents();
		this.initKeyboardNav();
		this.initHoverEvents();
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
		this.render();
	}

	setCountyBordersVisible(visible: boolean) {
		this.countyBordersVisible = visible;
		if (visible) {
			this.renderCountyBorders();
		} else {
			this.countyBorderGroup.selectAll("line.county-boundary").remove();
		}
	}

	private renderCountyBorders() {
		this.countyBorderGroup
			.selectAll<SVGLineElement, Segment>("line.county-boundary")
			.data(this.countySegments)
			.join(
				(enter) =>
					enter
						.append("line")
						.attr("class", "county-boundary")
						.attr("stroke-linecap", "round"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("x1", (d) => d.x1)
			.attr("y1", (d) => d.y1)
			.attr("x2", (d) => d.x2)
			.attr("y2", (d) => d.y2)
			.attr("stroke", "#606060")
			.attr("stroke-width", SvgMapRenderer.COUNTY_BASE_WIDTH / this.currentK)
			.attr("stroke-dasharray", `${SvgMapRenderer.COUNTY_DASH_ON / this.currentK},${SvgMapRenderer.COUNTY_DASH_OFF / this.currentK}`)
			.attr("opacity", SvgMapRenderer.COUNTY_OPACITY);
	}

	// ─── Zoom init (GAME-009) ─────────────────────────────────────────────────

	/**
	 * Replaces the Sprint 1 viewBox approach. Computes an initial transform that
	 * fits the scenario in the SVG container, then applies d3.zoom() to the SVG
	 * with right-click-drag pan and scroll-wheel zoom. Left-click is filtered out
	 * so the paint brush is unaffected. Keyboard: =+ zoom in, - zoom out, 0 reset.
	 */
	private initZoom() {
		const svgNode = this.svg.node()!;
		const { precincts } = this.getState();
		const bounds = mapBounds(precincts);

		// SVG element fills its container; getBoundingClientRect gives pixel dims.
		const svgRect = svgNode.getBoundingClientRect();
		const svgW = svgRect.width > 0 ? svgRect.width : SvgMapRenderer.FALLBACK_SVG_WIDTH;
		const svgH = svgRect.height > 0 ? svgRect.height : SvgMapRenderer.FALLBACK_SVG_HEIGHT;

		const padding = SvgMapRenderer.VIEWPORT_PADDING;

		// Compute the scale that fits the scenario within the SVG with padding.
		const fitScale = Math.min(
			(svgW - padding * 2) / bounds.width,
			(svgH - padding * 2) / bounds.height,
		);

		// Translate so the scenario is centered.
		const tx = (svgW - bounds.width * fitScale) / 2 - bounds.minX * fitScale;
		const ty = (svgH - bounds.height * fitScale) / 2 - bounds.minY * fitScale;

		this.initialTransform = d3.zoomIdentity.translate(tx, ty).scale(fitScale);
		this.currentK = fitScale;

		this.zoomBehavior = d3
			.zoom<SVGSVGElement, unknown>()
			// Floor = full scenario view; ceiling = MAX_ZOOM_MULTIPLIER× (3-4 precincts fill screen)
			.scaleExtent([fitScale, fitScale * SvgMapRenderer.MAX_ZOOM_MULTIPLIER])
			// Only allow scroll-wheel zoom and right-click (button 2) drag pan.
			// Left-click mousedown passes through to the paint brush unchanged.
			.filter((event: Event) => {
				if (event.type === "wheel") return true;
				if (event instanceof MouseEvent && event.type === "mousedown") {
					return event.button === 2;
				}
				return false;
			})
			.on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
				this.currentK = event.transform.k;
				this.zoomGroup.attr("transform", event.transform.toString());
				// Scale stroke widths inversely so apparent width stays constant.
				const bw = SvgMapRenderer.BOUNDARY_BASE_WIDTH / this.currentK;
				this.borderGroup
					.selectAll<SVGLineElement, Segment>("line.boundary")
					.attr("stroke-width", bw);
				const pw = SvgMapRenderer.PREVIEW_BASE_WIDTH / this.currentK;
				this.previewBorderGroup
					.selectAll<SVGLineElement, Segment>("line.preview-boundary")
					.attr("stroke-width", pw);
				if (this.keyboardFocusPath !== null) {
					d3.select(this.keyboardFocusPath)
						.attr("stroke-width", 2 / this.currentK)
						.attr("stroke-dasharray", `${4 / this.currentK},${2 / this.currentK}`);
				}
			});

		// Prevent context menu on right-click so drag-pan isn't interrupted.
		svgNode.addEventListener("contextmenu", (e) => e.preventDefault());

		// Apply zoom behavior; set the initial transform (fits scenario to viewport).
		this.svg.call(this.zoomBehavior);
		this.svg.call(this.zoomBehavior.transform, this.initialTransform);

		// Keyboard shortcuts: =+ zoom in, - zoom out, 0 reset to fit view.
		document.addEventListener("keydown", (e: KeyboardEvent) => {
			const target = e.target as Element;
			if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
			if (e.key === "=" || e.key === "+") {
				e.preventDefault();
				this.svg.transition().duration(SvgMapRenderer.ZOOM_DURATION_SHORT).call(this.zoomBehavior.scaleBy, SvgMapRenderer.ZOOM_STEP);
			} else if (e.key === "-") {
				e.preventDefault();
				this.svg.transition().duration(SvgMapRenderer.ZOOM_DURATION_SHORT).call(this.zoomBehavior.scaleBy, 1 / SvgMapRenderer.ZOOM_STEP);
			} else if (e.key === "0") {
				e.preventDefault();
				this.svg
					.transition()
					.duration(SvgMapRenderer.ZOOM_DURATION_RESET)
					.call(this.zoomBehavior.transform, this.initialTransform);
			}
		});
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
						.attr("data-precinct-id", (d) => String(d.id))
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
		const strokeWidth = SvgMapRenderer.BOUNDARY_BASE_WIDTH / this.currentK;
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
			.attr("stroke-width", strokeWidth)
			.attr("opacity", SvgMapRenderer.BOUNDARY_OPACITY)
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
		const strokeWidth = SvgMapRenderer.PREVIEW_BASE_WIDTH / this.currentK;

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
			.attr("stroke-width", strokeWidth)
			.attr("stroke-dasharray", `${SvgMapRenderer.PREVIEW_DASH_ON / this.currentK},${SvgMapRenderer.PREVIEW_DASH_OFF / this.currentK}`)
			.attr("opacity", SvgMapRenderer.PREVIEW_OPACITY);
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
				if (path === this.keyboardFocusPath) return;
				this.hoveredPath = path;
				d3.select(path)
					.attr("stroke", "#ffffff")
					.attr("stroke-width", SvgMapRenderer.HOVER_STROKE_WIDTH / this.currentK)
					.attr("opacity", SvgMapRenderer.HOVER_OPACITY);

				const { assignments } = this.getState();
				const dId = assignments.get(d.id);
				const infoPanel = document.getElementById("precinct-info");
				if (infoPanel !== null) {
					const precinctLabel = d.name ?? `Precinct ${d.id}`;
					const distLabel = dId != null ? `District ${dId}` : "Unassigned";
					const topParty = (["D", "R", "L", "G", "I"] as const).reduce((a, b) =>
						d.partyShare[a] > d.partyShare[b] ? a : b,
					);
					const leanLabel = `${PARTY_LABELS[topParty]} (${(d.partyShare[topParty] * 100).toFixed(1)}%)`;
					let groupsHtml = "";
					if (d.groupShares && d.groupShares.length > 1) {
						const lines = d.groupShares.map(
							(g) => `${g.name}: ${(g.share * 100).toFixed(0)}%`,
						);
						groupsHtml = `<br><span style="color:#8898b0">` + lines.join("<br>") + `</span>`;
					}
					infoPanel.innerHTML =
						`<div class="precinct-name">${precinctLabel}</div>` +
						`<div class="precinct-detail">` +
						`${distLabel}<br>` +
						`Pop: ${d.population.toLocaleString()}<br>` +
						`Lean: ${leanLabel}` +
						groupsHtml +
						`</div>`;
				}
			}
		});

		svgNode.addEventListener("mouseout", (event: MouseEvent) => {
			if (!svgNode.contains(event.relatedTarget as Node | null)) {
				this.clearHover();
				this.clearPrecinctInfo();
			}
		});
	}

	/** Restore placeholder text when no precinct is hovered. */
	private clearPrecinctInfo() {
		const infoPanel = document.getElementById("precinct-info");
		if (infoPanel !== null) {
			infoPanel.innerHTML =
				'<div class="precinct-placeholder">Hover over a precinct to see details.<br>Click and drag to paint districts.</div>';
		}
	}

	/** Restores stroke/opacity only — never fill (hover never changes fill). */
	private clearHover() {
		if (this.hoveredPath === null) return;
		if (this.hoveredPath === this.keyboardFocusPath) {
			this.hoveredPath = null;
			return;
		}
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
			// Only handle left-click (button 0); right-click is consumed by d3.zoom pan.
			if (event.button !== 0) return;
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
			c.l = SvgMapRenderer.HEX_LIGHTNESS_BASE - normPop * SvgMapRenderer.HEX_LIGHTNESS_RANGE;
		}
		d3.select(path).attr("fill", c.formatHex()).attr("opacity", SvgMapRenderer.ASSIGNED_OPACITY);
	}

	// ─── Fill / opacity helpers ───────────────────────────────────────────────

	private hexFill(d: Precinct, assignments: GameStore["assignments"]): string {
		if (this.viewMode === "lean") {
			const lean = d.partyShare.D - d.partyShare.R;
			// PuOr (purple-orange): CVD-safe diverging palette; avoids party color collision.
			// t=0 → orange (R-leaning), t=1 → purple (D-leaning). Clamped to [0.1,0.9] for dark-bg contrast.
			// Source: ColorBrewer (Brewer 2003) https://colorbrewer2.org/
			const t = Math.max(0.1, Math.min(0.9, (lean + 1) / 2));
			return d3.interpolatePuOr(t);
		}
		const dId = assignments.get(d.id);
		if (dId == null) return "#2a2a3e";
		const base = DISTRICT_COLORS[dId - 1] ?? "#2a2a3e";
		const normPop =
			this.popMax > this.popMin
				? (d.population - this.popMin) / (this.popMax - this.popMin)
				: 0.5;
		const c = d3.hsl(base);
		c.l = SvgMapRenderer.HEX_LIGHTNESS_BASE - normPop * SvgMapRenderer.HEX_LIGHTNESS_RANGE;
		return c.formatHex();
	}

	private hexOpacity(d: Precinct, assignments: GameStore["assignments"]): number {
		if (this.viewMode === "lean") return SvgMapRenderer.LEAN_OPACITY;
		const dId = assignments.get(d.id);
		return dId != null ? SvgMapRenderer.ASSIGNED_OPACITY : SvgMapRenderer.UNASSIGNED_OPACITY;
	}

	// ─── Keyboard precinct navigation (GAME-008) ──────────────────────────────

	private initKeyboardNav() {
		const svgNode = this.svg.node()!;

		svgNode.addEventListener("keydown", (e: KeyboardEvent) => {
			const { precincts, activeDistrict, districtCount } = this.getState();
			if (precincts.length === 0) return;

			// Initialize focus to first precinct if none selected
			if (this.focusedPrecinctId === null) {
				this.setKeyboardFocus(precincts[0]!.id, precincts);
				return;
			}

			const current = precincts.find(p => p.id === this.focusedPrecinctId);
			if (current === undefined) return;

			// Arrow key → neighbor direction mapping for flat-top hex grid
			// Try primary then secondary direction to handle diagonal movement
			const dirMap: Record<string, number[]> = {
				ArrowUp:    [4],
				ArrowDown:  [1],
				ArrowRight: [5, 0],
				ArrowLeft:  [3, 2],
			};

			const dirs = dirMap[e.key];
			if (dirs !== undefined) {
				e.preventDefault();
				for (const dir of dirs) {
					const nId = current.neighbors[dir];
					if (nId !== null && nId !== undefined) {
						this.setKeyboardFocus(nId, precincts);
						break;
					}
				}
				return;
			}

			// Number keys 1–5: assign focused precinct to that district
			const num = parseInt(e.key, 10);
			if (num >= 1 && num <= districtCount) {
				e.preventDefault();
				this.paintStroke([this.focusedPrecinctId], num);
				const { precincts } = this.getState();
				this.setKeyboardFocus(this.focusedPrecinctId, precincts);
				return;
			}

			// Space: assign to active district
			if (e.key === " ") {
				e.preventDefault();
				this.paintStroke([this.focusedPrecinctId], activeDistrict);
				const { precincts } = this.getState();
				this.setKeyboardFocus(this.focusedPrecinctId, precincts);
			}
		});

		// Clear keyboard focus when SVG loses focus
		svgNode.addEventListener("blur", () => {
			this.clearKeyboardFocus();
		});
	}

	private setKeyboardFocus(precinctId: number, precincts: Precinct[]) {
		this.clearKeyboardFocus();
		this.focusedPrecinctId = precinctId;

		// Find the SVG path element for this precinct
		const path = this.hexGroup
			.select<SVGPathElement>(`path.hex[data-precinct-id="${precinctId}"]`)
			.node();
		if (path === null) return;
		this.keyboardFocusPath = path;

		// Yellow dashed focus ring — distinct from hover (white) and district fills
		d3.select(path)
			.attr("stroke", "#F0E442")
			.attr("stroke-width", 2 / this.currentK)
			.attr("stroke-dasharray", `${4 / this.currentK},${2 / this.currentK}`);

		// Update SVG aria-label with current precinct context
		const p = precincts.find(pr => pr.id === precinctId);
		if (p !== undefined) {
			const { assignments } = this.getState();
			const dId = assignments.get(p.id);
			const distLabel = dId != null ? `district ${dId}` : "unassigned";
			const label = p.name ?? `Precinct ${p.id}`;
			this.svg.attr("aria-label",
				`District map — focused: ${label}, ${distLabel}. ` +
				`Arrow keys navigate. Number keys 1–5 assign district. Space assigns active district.`
			);
		}
	}

	private clearKeyboardFocus() {
		if (this.keyboardFocusPath !== null) {
			const path = this.keyboardFocusPath;
			this.keyboardFocusPath = null;
			this.focusedPrecinctId = null;
			const { assignments } = this.getState();
			const d = d3.select<SVGPathElement, Precinct>(path).datum();
			if (d !== undefined) {
				d3.select(path)
					.attr("stroke", "none")
					.attr("stroke-dasharray", null)
					.attr("stroke-width", 0.5)
					.attr("opacity", this.hexOpacity(d, assignments));
			}
			// Restore default aria-label
			this.svg.attr("aria-label",
				"District map. Use mouse or keyboard to paint precincts. " +
				"Arrow keys navigate precincts, number keys 1–5 assign to a district."
			);
		}
	}
}

