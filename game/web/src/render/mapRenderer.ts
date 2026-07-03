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
import { escapeHtml } from "../model/escape-html.js";
import { HEX_DIRECTIONS, HEX_SIZE, hexCorners, mapBounds } from "../model/hex-geometry.js";
import type { PartyId } from "../model/scenario.js";
import type { Precinct, TerrainTileRuntime } from "../model/runtime.js";
import { districtColor } from "../model/runtime.js";
import { partyColor, partyLabel, winnerOf } from "../model/party.js";
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
	/** Toggle hex coordinate labels (debug overlay). */
	setCoordLabelsVisible(visible: boolean): void;
	/** Provide the scenario's ordered party list + display names for the
	 *  precinct-info panel and lean view (GAME-043). */
	setParties(parties: PartyId[], names: Partial<Record<PartyId, string>>): void;
	/** Reset the zoom/pan to the initial fitted vantage point (used by Reset). */
	resetView(): void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type SVGSel = d3.Selection<SVGSVGElement, unknown, null, undefined>;
// D3's append returns a Selection with parent type null when chained from select(element)
type GSel = d3.Selection<SVGGElement, unknown, null, undefined>;
type Segment = { x1: number; y1: number; x2: number; y2: number };
type Point2D = [number, number];

// ─── River chain building (GAME-082) ─────────────────────────────────────────

/**
 * Group river-edge corner-pair segments into connected chains so each chain
 * can be rendered as a single smoothed SVG path rather than N separate lines.
 *
 * Two segments are considered connected when they share a corner (same pixel
 * coordinates). Corners that appear in exactly 2 segments are interior to a
 * chain; corners that appear in 1 segment are chain endpoints; corners with
 * degree >= 3 are Y/T junctions where chains terminate (each branch becomes
 * its own chain — visually they meet at the junction).
 *
 * Walking strategy: start from each endpoint (degree-1 corner) and follow
 * unvisited segments through degree-2 corners. After all endpoint-rooted walks
 * complete, any remaining unvisited segments form closed loops or branches at
 * junctions — emit those as their own chains from an arbitrary starting point.
 */
function buildRiverChains(segs: [Point2D, Point2D][]): Point2D[][] {
	// Quantize corner coordinates to handle hexCorners() float drift.
	// 2 decimals = 0.01 px precision — well below any real edge mismatch.
	const key = (p: Point2D): string => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

	// corner-key → indices of segments touching that corner
	const cornerToSegs = new Map<string, number[]>();
	segs.forEach((seg, i) => {
		for (const c of seg) {
			const k = key(c);
			if (!cornerToSegs.has(k)) cornerToSegs.set(k, []);
			cornerToSegs.get(k)!.push(i);
		}
	});

	const visited = new Set<number>();
	const chains: Point2D[][] = [];

	const walk = (startSeg: number, startCorner: Point2D): Point2D[] => {
		const points: Point2D[] = [startCorner];
		let segIdx = startSeg;
		let corner = startCorner;
		while (!visited.has(segIdx)) {
			visited.add(segIdx);
			const seg = segs[segIdx];
			if (seg === undefined) break;
			const other = key(seg[0]) === key(corner) ? seg[1] : seg[0];
			points.push(other);
			const candidates = (cornerToSegs.get(key(other)) ?? []).filter((s) => !visited.has(s));
			if (candidates.length !== 1) break; // endpoint, junction, or dead end
			segIdx = candidates[0]!;
			corner = other;
		}
		return points;
	};

	// Pass 1: start from endpoints (degree-1 corners) — these are the natural
	// chain heads and produce the longest/cleanest chains.
	for (const [k, ss] of cornerToSegs) {
		if (ss.length !== 1) continue;
		const segIdx = ss[0]!;
		if (visited.has(segIdx)) continue;
		const seg = segs[segIdx]!;
		const startCorner = key(seg[0]) === k ? seg[0] : seg[1];
		chains.push(walk(segIdx, startCorner));
	}
	// Pass 2: any remaining unvisited segments belong to closed loops or live
	// past a junction. Emit each as its own chain from an arbitrary start.
	segs.forEach((seg, i) => {
		if (visited.has(i)) return;
		chains.push(walk(i, seg[0]));
	});

	return chains;
}

// ─── Polygon path helper ─────────────────────────────────────────────────────

function hexPolygonPath(p: Precinct): string {
	const corners = hexCorners(p.center);
	return `M${corners.map((c) => c.join(",")).join("L")}Z`;
}

// ─── Boundary segment computation ────────────────────────────────────────────

/**
 * Returns all boundary segments for the given assignment map.
 * A segment is drawn for every hex edge where the two adjacent precincts
 * belong to different districts, and for every grid-boundary edge — EXCEPT
 * edges that face a terrain tile (sea/lake/mountain). Those edges represent
 * "the end of the usable map" rather than a district boundary, and the
 * terrain-intrusion fill (in terrainOverlayGroup) covers them visually.
 */
function computeBoundarySegments(
	precincts: Precinct[],
	assignments: Map<number, number | null>,
	terrainFacingEdges?: Set<string>,
): Segment[] {
	const segments: Segment[] = [];
	for (const p of precincts) {
		const pDist = assignments.get(p.index);
		const corners = hexCorners(p.center);
		for (let i = 0; i < 6; i++) {
			const nId = p.neighbors[i] ?? null;
			const c0 = corners[i];
			const c1 = corners[(i + 1) % 6];
			if (c0 === undefined || c1 === undefined) continue;
			if (nId === null) {
				// Skip terrain-facing outer edges — the intrusion fill replaces them.
				if (terrainFacingEdges?.has(`${p.index}:${i}`)) continue;
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

/**
 * Build a set of `precinctId:edgeIndex` keys for every precinct edge that faces a
 * terrain tile (sea / lake / mountain). Used by computeBoundarySegments to suppress
 * the white district-boundary line on edges that are "off the map."
 */
function computeTerrainFacingEdges(
	precincts: Precinct[],
	terrainTiles: TerrainTileRuntime[] | undefined,
): Set<string> {
	const set = new Set<string>();
	if (!terrainTiles || terrainTiles.length === 0) return set;
	const tilePosSet = new Set<string>(terrainTiles.map((t) => `${t.coord.q},${t.coord.r}`));
	for (const p of precincts) {
		for (let i = 0; i < 6; i++) {
			const dir = HEX_DIRECTIONS[i];
			if (!dir) continue;
			const key = `${p.coord.q + dir[0]},${p.coord.r + dir[1]}`;
			if (tilePosSet.has(key)) set.add(`${p.index}:${i}`);
		}
	}
	return set;
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
			if (nId === null || nId < p.index) continue; // skip outer edges and already-drawn edges
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
	private terrainGroup: GSel;
	private countyBorderGroup: GSel;
	private borderGroup: GSel;
	private hexGroup: GSel;
	private terrainOverlayGroup: GSel;
	private hoverHighlightGroup: GSel;
	private riverGroup: GSel;
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
	private static readonly TERRAIN_BOUNDARY_WIDTH = 2;
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
	// Terrain boundary sits above hex fills (no hex-fill attenuation); lower opacity
	// compensates so it appears the same visual weight as district boundaries below hex fills.
	private static readonly TERRAIN_BOUNDARY_OPACITY = 0.4;
	private static readonly COUNTY_OPACITY = 0.9;
	private static readonly PREVIEW_OPACITY = 0.85;
	private static readonly LEAN_OPACITY = 0.9;
	private static readonly ASSIGNED_OPACITY = 0.75;
	private static readonly UNASSIGNED_OPACITY = 0.35;
	private static readonly HOVER_OPACITY = 0.95;
	private static readonly HOVER_STROKE_WIDTH = 1.5;

	// Lightness coefficients for population-density district color shading
	// District hex lightness = HEX_LIGHTNESS_BASE − normPop × HEX_LIGHTNESS_RANGE
	private static readonly HEX_LIGHTNESS_BASE = 0.55;
	private static readonly HEX_LIGHTNESS_RANGE = 0.3;

	// Multiparty (3+) lean shading (GAME-112): a precinct is painted its plurality
	// party's color, its lightness pulled toward LEAN_PALE_L as the plurality margin
	// over the runner-up shrinks toward 0 — a ≥LEAN_FULL_MARGIN lead reads full-saturation.
	private static readonly LEAN_FULL_MARGIN = 0.4;
	private static readonly LEAN_PALE_L = 0.82;

	// Dash patterns (on,off in map units before zoom correction)
	// Short dashes + wide gaps so an underlying white district border shows through.
	private static readonly COUNTY_DASH_ON = 3;
	private static readonly COUNTY_DASH_OFF = 5;
	private static readonly PREVIEW_DASH_ON = 5;
	private static readonly PREVIEW_DASH_OFF = 4;

	// County border overlay (GAME-012): computed once at load, toggled on/off
	private countySegments: Segment[] = [];
	// Edges that face a terrain tile — set of "precinctId:edgeIndex" keys. Used to suppress
	// the district boundary line on these edges (the terrain intrusion fill covers them).
	private terrainFacingEdges: Set<string> = new Set();
	private countyBordersVisible = false;
	private parties: PartyId[] = [];
	private partyNames: Partial<Record<PartyId, string>> = {};
	private coordLabelsVisible = false;
	private coordLabelsRendered = false;
	private coordLabelGroup!: GSel;

	// Terrain styling (DESIGN-008): fills, glyphs, opacity for sea/lake/mountain tiles
	private static readonly TERRAIN_FILL_SEA = "#3a7fc1";
	private static readonly TERRAIN_FILL_LAKE = "#4dd0e1";
	private static readonly TERRAIN_FILL_MOUNTAIN = "#6b7280";
	private static readonly TERRAIN_GLYPH_SEA = "∿";
	private static readonly TERRAIN_GLYPH_MOUNTAIN = "△";
	private static readonly TERRAIN_GLYPH_COLOR = "rgba(255,255,255,0.45)";
	private static readonly TERRAIN_GLYPH_FONT_SIZE = 22; // pixel size at 1× zoom
	private static readonly RIVER_STROKE = "#4dd0e1";
	private static readonly RIVER_BASE_WIDTH = 9;
	private static readonly RIVER_OPACITY = 0.9;
	// Coast/foothill render as filled intrusion shapes (not strokes). The intrusion's curved
	// inner edge bulges this many pixels into the precinct at its deepest point (at the edge
	// midpoint). Filled with the exact terrain-tile color (TERRAIN_FILL_SEA / TERRAIN_FILL_MOUNTAIN).
	private static readonly COAST_INTRUSION_DEPTH = 5;
	private static readonly FOOTHILL_INTRUSION_DEPTH = 6;
	private static readonly LAKE_INTRUSION_DEPTH = 5;
	private static readonly COORD_LABEL_FONT_SIZE = 9; // apparent px at any zoom level

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
		// Layer order (bottom → top inside zoomGroup):
		//   terrainGroup        — non-precinct tiles (sea/lake/mountain), bottom
		//   borderGroup         — committed district boundaries (solid white)
		//   hexGroup            — precinct fills
		//   terrainOverlayGroup — coast/foothill intrusion fills + lake blobs (above hex fills)
		//   riverGroup          — blue river strokes along hex edges (above precincts)
		//   countyBorderGroup   — county boundary overlay (dashed gray; off by default; over rivers)
		//   previewBorderGroup  — in-stroke boundary preview (top)
		// Note on riverGroup placement: DESIGN-008 describes rivers as "above hex fills but
		// below district outlines". In this renderer borderGroup is *below* hexGroup (district
		// boundaries shine through semi-transparent hex fills), so the spec's two constraints
		// are mutually exclusive. We choose "above hex fills" because rivers must be visible
		// as natural geographic boundaries. County borders sit above rivers so administrative
		// lines read as drawn over the geography (county lines often follow rivers).
		this.zoomGroup = this.svg.append("g").attr("class", "zoom-layer");
		this.terrainGroup = this.zoomGroup.append("g").attr("class", "terrain");
		this.borderGroup = this.zoomGroup.append("g").attr("class", "borders");
		this.hexGroup = this.zoomGroup.append("g").attr("class", "hexes");
		this.terrainOverlayGroup = this.zoomGroup.append("g").attr("class", "terrain-overlay");
		this.hoverHighlightGroup = this.zoomGroup.append("g").attr("class", "hover-highlight");
		this.riverGroup = this.zoomGroup.append("g").attr("class", "rivers");
		this.countyBorderGroup = this.zoomGroup.append("g").attr("class", "county-borders");
		this.previewBorderGroup = this.zoomGroup.append("g").attr("class", "preview-borders");
		this.coordLabelGroup = this.zoomGroup
			.append("g")
			.attr("class", "coord-labels")
			.attr("display", "none");

		const pops = getState().precincts.map((p) => p.population);
		this.popMin = Math.min(...pops);
		this.popMax = Math.max(...pops);

		this.countySegments = computeCountySegments(getState().precincts);
		this.terrainFacingEdges = computeTerrainFacingEdges(
			getState().precincts,
			getState().terrainTiles,
		);

		this.initZoom();
		this.initBrushEvents();
		this.initKeyboardNav();
		this.initHoverEvents();

		// One-shot terrain rendering — terrain is immutable per scenario.
		this.renderTerrainTiles();
		this.renderRivers();
		this.renderTerrainEdges();
	}

	setViewMode(mode: ViewMode) {
		this.viewMode = mode;
		this.render();
	}

	resetView() {
		// Snap the zoom/pan back to the initial fitted vantage point (same as the "0" shortcut).
		this.svg
			.transition()
			.duration(SvgMapRenderer.ZOOM_DURATION_RESET)
			.call(this.zoomBehavior.transform, this.initialTransform);
	}

	setCountyBordersVisible(visible: boolean) {
		this.countyBordersVisible = visible;
		if (visible) {
			this.renderCountyBorders();
		} else {
			this.countyBorderGroup.selectAll("line.county-boundary").remove();
		}
	}

	setCoordLabelsVisible(visible: boolean) {
		this.coordLabelsVisible = visible;
		this.renderCoordLabels();
	}

	setParties(parties: PartyId[], names: Partial<Record<PartyId, string>>) {
		this.parties = parties;
		this.partyNames = names;
	}

	private renderCoordLabels() {
		if (!this.coordLabelsRendered) {
			const { precincts, terrainTiles } = this.getState();
			const fs = SvgMapRenderer.COORD_LABEL_FONT_SIZE / this.currentK;
			const sw = 3 / this.currentK;
			const labelAttrs = <
				T extends {
					coord: { q: number; r: number };
					center: { x: number; y: number };
				},
			>(
				sel: d3.Selection<SVGTextElement, T, SVGGElement, unknown>,
			) =>
				sel
					.attr("text-anchor", "middle")
					.attr("dominant-baseline", "central")
					.attr("font-family", "monospace")
					.attr("font-size", fs)
					.attr("fill", "white")
					.attr("stroke", "rgba(0,0,0,0.75)")
					.attr("stroke-width", sw)
					.attr("paint-order", "stroke")
					.attr("pointer-events", "none");

			labelAttrs(
				this.coordLabelGroup
					.selectAll<SVGTextElement, Precinct>("text.coord-label")
					.data(precincts)
					.join("text")
					.attr("class", "coord-label")
					.attr("x", (d) => d.center.x)
					.attr("y", (d) => d.center.y),
			).text((d) => `${d.coord.q},${d.coord.r}`);

			// Terrain tiles (mountain/sea/lake) are not precincts — label them separately.
			labelAttrs(
				this.coordLabelGroup
					.selectAll<SVGTextElement, TerrainTileRuntime>("text.coord-label-tile")
					.data(terrainTiles ?? [])
					.join("text")
					.attr("class", "coord-label-tile")
					.attr("x", (d) => d.center.x)
					.attr("y", (d) => d.center.y),
			).text((d) => `${d.coord.q},${d.coord.r}`);

			this.coordLabelsRendered = true;
		}
		this.coordLabelGroup.attr("display", this.coordLabelsVisible ? null : "none");
	}

	private renderCountyBorders() {
		this.countyBorderGroup
			.selectAll<SVGLineElement, Segment>("line.county-boundary")
			.data(this.countySegments)
			.join(
				(enter) =>
					enter.append("line").attr("class", "county-boundary").attr("stroke-linecap", "round"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("x1", (d) => d.x1)
			.attr("y1", (d) => d.y1)
			.attr("x2", (d) => d.x2)
			.attr("y2", (d) => d.y2)
			.attr("stroke", "#1c1c1c")
			.attr("stroke-width", SvgMapRenderer.COUNTY_BASE_WIDTH / this.currentK)
			.attr(
				"stroke-dasharray",
				`${SvgMapRenderer.COUNTY_DASH_ON / this.currentK},${SvgMapRenderer.COUNTY_DASH_OFF / this.currentK}`,
			)
			.attr("opacity", SvgMapRenderer.COUNTY_OPACITY);
	}

	// ─── Terrain rendering (GAME-075) ─────────────────────────────────────────

	private terrainFill(type: TerrainTileRuntime["type"]): string {
		switch (type) {
			case "sea":
				return SvgMapRenderer.TERRAIN_FILL_SEA;
			case "lake":
				return SvgMapRenderer.TERRAIN_FILL_LAKE;
			case "mountain":
				return SvgMapRenderer.TERRAIN_FILL_MOUNTAIN;
		}
	}

	private terrainGlyph(type: TerrainTileRuntime["type"]): string {
		// DESIGN-008: lake glyph is optional and is omitted here — the aqua fill alone
		// distinguishes lakes from the darker sea, and white-on-aqua has low contrast.
		switch (type) {
			case "sea":
				return SvgMapRenderer.TERRAIN_GLYPH_SEA;
			case "lake":
				return "";
			case "mountain":
				return SvgMapRenderer.TERRAIN_GLYPH_MOUNTAIN;
		}
	}

	private renderTerrainTiles() {
		const tiles = this.getState().terrainTiles ?? [];
		if (tiles.length === 0) return;

		// One group per tile so the fill polygon and glyph stay paired.
		const tileGroups = this.terrainGroup
			.selectAll<SVGGElement, TerrainTileRuntime>("g.terrain-tile")
			.data(tiles, (_d, i) => String(i))
			.join("g")
			.attr("class", (d) => `terrain-tile terrain-${d.type}`)
			.attr("data-terrain-type", (d) => d.type)
			.style("pointer-events", "none"); // non-interactive — no hover, no click

		// Hex polygon fill
		tileGroups
			.selectAll<SVGPathElement, TerrainTileRuntime>("path.terrain-fill")
			.data((d) => [d])
			.join("path")
			.attr("class", "terrain-fill")
			.attr("d", (d) => {
				const corners = hexCorners(d.center);
				return `M${corners.map((c) => c.join(",")).join("L")}Z`;
			})
			.attr("fill", (d) => this.terrainFill(d.type))
			.attr("stroke", "none");

		// Glyph centered in the tile
		tileGroups
			.selectAll<SVGTextElement, TerrainTileRuntime>("text.terrain-glyph")
			.data((d) => [d])
			.join("text")
			.attr("class", "terrain-glyph")
			.attr("x", (d) => d.center.x)
			.attr("y", (d) => d.center.y)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline", "central")
			.attr("font-size", SvgMapRenderer.TERRAIN_GLYPH_FONT_SIZE)
			.attr("fill", SvgMapRenderer.TERRAIN_GLYPH_COLOR)
			.text((d) => this.terrainGlyph(d.type));
	}

	private renderRivers() {
		const { precincts, riverEdges } = this.getState();
		if (!riverEdges || riverEdges.length === 0) return;

		// 1. Convert each river edge to its corner pair.
		const segs: [Point2D, Point2D][] = [];
		for (const [aIdx, bIdx] of riverEdges) {
			const a = precincts[aIdx];
			if (a === undefined) {
				console.warn(`renderRivers: river_edge references unknown precinct index ${aIdx}`);
				continue;
			}
			const edge = a.neighbors.findIndex((n) => n === bIdx);
			if (edge < 0) {
				console.warn(`renderRivers: precinct ${aIdx} is not a geometric neighbor of ${bIdx}`);
				continue;
			}
			const corners = hexCorners(a.center);
			const c0 = corners[edge];
			const c1 = corners[(edge + 1) % 6];
			if (c0 === undefined || c1 === undefined) continue;
			segs.push([c0, c1]);
		}

		// 2. Build chains of connected segments by walking the corner graph.
		const chains = buildRiverChains(segs);

		// 3. Render each chain as a smoothed SVG path. d3.curveCardinal with
		//    tension 0.4 passes through every corner with moderate swing — more
		//    visible meander through hex vertices than curveBasis's tighter
		//    approximation, while still avoiding the sharp Catmull-Rom overshoot
		//    at sharp turns.
		const lineGen = d3
			.line<Point2D>()
			.x((p) => p[0])
			.y((p) => p[1])
			.curve(d3.curveCardinal.tension(0.4));

		this.riverGroup
			.selectAll<SVGPathElement, Point2D[]>("path.river-chain")
			.data(chains)
			.join("path")
			.attr("class", "river-chain")
			.attr("d", (d) => lineGen(d) ?? "")
			.attr("fill", "none")
			.attr("stroke", SvgMapRenderer.RIVER_STROKE)
			.attr("stroke-width", SvgMapRenderer.RIVER_BASE_WIDTH / this.currentK)
			.attr("stroke-linecap", "round")
			.attr("stroke-linejoin", "round")
			.attr("opacity", SvgMapRenderer.RIVER_OPACITY)
			.style("pointer-events", "none");
	}

	private renderTerrainEdges() {
		// For each coast/foothill precinct, draw an "intrusion" — a filled closed shape that
		// looks like the adjacent terrain has bled into the precinct. The shape is bounded by
		//   - the hex edge (flat outer boundary; the district boundary line is suppressed here)
		//   - an inward curving inner boundary built from multiple sample points with slight
		//     irregularity ("crinkly" not perfectly circular)
		// Filled with the EXACT same color as the adjacent terrain tile.
		//
		// Additionally: when TWO adjacent edges of the same precinct face the same terrain
		// type, the shared corner would otherwise be a pointy bit of land sticking out between
		// two intrusions. We render a "corner cap" (filled rounded shape) at those corners to
		// chop off the point and merge the two intrusions visually.
		//
		const { precincts, terrainTiles } = this.getState();
		if (!terrainTiles || terrainTiles.length === 0) return;

		const tilePosMap = new Map<string, TerrainTileRuntime["type"]>();
		for (const tile of terrainTiles) tilePosMap.set(`${tile.coord.q},${tile.coord.r}`, tile.type);

		interface IntrusionShape {
			terrainType: "sea" | "mountain" | "lake";
			path: string;
			boundaryPath: string;
		}
		interface CornerCap {
			cx: number;
			cy: number;
			r: number;
			terrainType: "sea" | "mountain" | "lake";
		}
		// SVG arc tracing the district-facing edge of a corner cap (the 120° interior arc).
		interface CapArc {
			path: string;
			terrainType: "sea" | "mountain" | "lake";
		}
		const intrusions: IntrusionShape[] = [];
		const cornerCaps: CornerCap[] = [];
		const capArcs: CapArc[] = [];

		// Curve generator for the inner (eaten-away) boundary. d3.curveBasis approximates the
		// sample points smoothly without rigidly passing through them — gives a "crinkly but
		// not jagged" feel when the depth profile has small ripples.
		const innerCurve = d3
			.line<Point2D>()
			.x((p) => p[0])
			.y((p) => p[1])
			.curve(d3.curveBasis);

		// Per-variant inward-depth profile sampled at fixed t along the edge.
		// Profile entries are (t, depth-multiplier). Endpoints anchor at depth 0 (the
		// outer hex edge corners) so adjacent intrusions meet cleanly at corners.
		// "smooth": symmetric with a slight midpoint dip — gentle coastline ripple.
		// "rugged": asymmetric with two unequal peaks — feels like an uneven mountain edge.
		const profileSmooth: ReadonlyArray<[number, number]> = [
			[0, 0],
			[0.13, 0.5],
			[0.27, 0.95],
			[0.42, 0.58],
			[0.55, 1.05],
			[0.68, 0.52],
			[0.8, 0.9],
			[0.92, 0.42],
			[1, 0],
		];
		const profileRugged: ReadonlyArray<[number, number]> = [
			[0, 0],
			[0.12, 0.72],
			[0.25, 1.2],
			[0.38, 0.38],
			[0.52, 1.25],
			[0.65, 0.32],
			[0.78, 1.1],
			[0.9, 0.55],
			[1, 0],
		];

		const buildIntrusionAndBoundary = (
			c0: Point2D,
			c1: Point2D,
			center: { x: number; y: number },
			depth: number,
			profile: ReadonlyArray<[number, number]>,
		): { fillPath: string; boundaryPath: string } => {
			// Inward unit normal: from edge midpoint toward hex center.
			const midX = (c0[0] + c1[0]) / 2;
			const midY = (c0[1] + c1[1]) / 2;
			const dx = center.x - midX;
			const dy = center.y - midY;
			const len = Math.hypot(dx, dy) || 1;
			const nx = dx / len;
			const ny = dy / len;
			// Build inner-curve sample points from c1 back to c0 (reverse t so we walk c1 → c0).
			// Sample 0 is at c1 (t=1, depth 0); last sample is at c0 (t=0, depth 0).
			const innerPts: Point2D[] = profile.map(([tAlong, dProfile]) => {
				const t = 1 - tAlong;
				const ex = c0[0] + t * (c1[0] - c0[0]);
				const ey = c0[1] + t * (c1[1] - c0[1]);
				const off = depth * dProfile;
				return [ex + nx * off, ey + ny * off];
			});
			// Fill uses ALL sample points (curve must reach both corners to close the shape).
			const innerFull = innerCurve(innerPts) ?? "";
			const innerContinued = innerFull.replace(/^M/, "L");
			const fillPath = `M${c0[0]},${c0[1]} L${c1[0]},${c1[1]}${innerContinued} Z`;
			// Boundary uses the full inner curve including endpoints. Corner caps are rendered
			// beneath the boundary curves so the line remains visible at capped corners.
			const boundaryPath = innerPts.length >= 2 ? (innerCurve(innerPts) ?? "") : "";
			return { fillPath, boundaryPath };
		};

		for (const p of precincts) {
			if (
				!p.terrainAnnotation?.coast &&
				!p.terrainAnnotation?.foothill &&
				!p.terrainAnnotation?.lakeside
			)
				continue;
			const corners = hexCorners(p.center);
			// First pass: per-edge intrusion shapes
			for (let i = 0; i < 6; i++) {
				const dir = HEX_DIRECTIONS[i];
				if (dir === undefined) continue;
				const nKey = `${p.coord.q + dir[0]},${p.coord.r + dir[1]}`;
				const tileType = tilePosMap.get(nKey);
				if (tileType === undefined) continue;
				const matches =
					(p.terrainAnnotation?.coast === true && tileType === "sea") ||
					(p.terrainAnnotation?.foothill === true && tileType === "mountain") ||
					(p.terrainAnnotation?.lakeside === true && tileType === "lake");
				if (!matches) continue;
				const c0 = corners[i];
				const c1 = corners[(i + 1) % 6];
				if (c0 === undefined || c1 === undefined) continue;
				if (tileType === "sea") {
					const { fillPath, boundaryPath } = buildIntrusionAndBoundary(
						c0,
						c1,
						p.center,
						SvgMapRenderer.COAST_INTRUSION_DEPTH,
						profileSmooth,
					);
					intrusions.push({ terrainType: "sea", path: fillPath, boundaryPath });
				} else if (tileType === "lake") {
					const { fillPath, boundaryPath } = buildIntrusionAndBoundary(
						c0,
						c1,
						p.center,
						SvgMapRenderer.LAKE_INTRUSION_DEPTH,
						profileSmooth,
					);
					intrusions.push({
						terrainType: "lake",
						path: fillPath,
						boundaryPath,
					});
				} else {
					const { fillPath, boundaryPath } = buildIntrusionAndBoundary(
						c0,
						c1,
						p.center,
						SvgMapRenderer.FOOTHILL_INTRUSION_DEPTH,
						profileRugged,
					);
					intrusions.push({
						terrainType: "mountain",
						path: fillPath,
						boundaryPath,
					});
				}
			}
			// Second pass: corner caps + cap boundary arcs. Corner i is shared between
			// edge (i+5)%6 (which ENDS at corner i) and edge i (which STARTS at corner i).
			// If both face the same terrain type (sea or mountain), add a filled circle at
			// the corner to chop off the pointy bit, and a 120° arc tracing the district-
			// facing edge of that cap as the district boundary at the corner.
			for (let i = 0; i < 6; i++) {
				const leftEdge = (i + 5) % 6;
				const rightEdge = i;
				const lDir = HEX_DIRECTIONS[leftEdge];
				const rDir = HEX_DIRECTIONS[rightEdge];
				if (!lDir || !rDir) continue;
				const lType = tilePosMap.get(`${p.coord.q + lDir[0]},${p.coord.r + lDir[1]}`);
				const rType = tilePosMap.get(`${p.coord.q + rDir[0]},${p.coord.r + rDir[1]}`);
				if (lType !== rType) continue;
				if (lType !== "sea" && lType !== "mountain" && lType !== "lake") continue;
				const capCenter = corners[i];
				if (capCenter === undefined) continue;
				const r =
					lType === "sea" || lType === "lake"
						? SvgMapRenderer.COAST_INTRUSION_DEPTH + 4
						: SvgMapRenderer.FOOTHILL_INTRUSION_DEPTH + 4;
				cornerCaps.push({
					cx: capCenter[0],
					cy: capCenter[1],
					r,
					terrainType: lType,
				});

				// Compute the arc endpoints from the direction the adjacent intrusion boundary
				// curves EXIT the cap circle — not from the hex edge directions. Using the edge
				// directions would make the arc endpoints land inside the intrusion fills (terrain
				// territory), causing the white arc to draw over sea/mountain color.
				//
				// Each intrusion boundary curve at its cap end has depth 0 at capCenter and its
				// first non-zero sample slightly inward from the edge. The vector from capCenter
				// toward that sample gives the exit direction; we project it to radius r on the cap.
				//
				// Profile first-sample fractions (tAlong from the capCenter end of each intrusion):
				//   left intrusion c1=capCenter: first sample at tAlong=0.18 (smooth) or 0.15 (rugged)
				//   right intrusion c0=capCenter: last sample before capCenter at tAlong=0.85/0.82
				//     → distance from capCenter = (1-tAlong)*edgeLen, so tFrac = 0.15 (smooth) or 0.18 (rugged)
				const leftAdj = corners[(i - 1 + 6) % 6];
				const rightAdj = corners[(i + 1) % 6];
				if (leftAdj === undefined || rightAdj === undefined) continue;

				const depthVal =
					lType === "mountain"
						? SvgMapRenderer.FOOTHILL_INTRUSION_DEPTH
						: lType === "lake"
							? SvgMapRenderer.LAKE_INTRUSION_DEPTH
							: SvgMapRenderer.COAST_INTRUSION_DEPTH;
				const [tFracL, dProfL] =
					lType === "mountain" ? ([0.12, 0.72] as const) : ([0.13, 0.5] as const);
				const [tFracR, dProfR] =
					lType === "mountain" ? ([0.1, 0.55] as const) : ([0.08, 0.42] as const);

				// Inward normal for left edge (from leftAdj to capCenter)
				const lMidX = (leftAdj[0] + capCenter[0]) / 2,
					lMidY = (leftAdj[1] + capCenter[1]) / 2;
				const lNLen = Math.hypot(p.center.x - lMidX, p.center.y - lMidY) || 1;
				const lNx = (p.center.x - lMidX) / lNLen,
					lNy = (p.center.y - lMidY) / lNLen;

				// Inward normal for right edge (from capCenter to rightAdj)
				const rMidX = (capCenter[0] + rightAdj[0]) / 2,
					rMidY = (capCenter[1] + rightAdj[1]) / 2;
				const rNLen = Math.hypot(p.center.x - rMidX, p.center.y - rMidY) || 1;
				const rNx = (p.center.x - rMidX) / rNLen,
					rNy = (p.center.y - rMidY) / rNLen;

				// Exit direction = along-edge component + inward component, projected to radius r
				const lDx = tFracL * (leftAdj[0] - capCenter[0]) + depthVal * dProfL * lNx;
				const lDy = tFracL * (leftAdj[1] - capCenter[1]) + depthVal * dProfL * lNy;
				const lDLen = Math.hypot(lDx, lDy) || 1;
				const startX = capCenter[0] + (r * lDx) / lDLen;
				const startY = capCenter[1] + (r * lDy) / lDLen;

				const rDx = tFracR * (rightAdj[0] - capCenter[0]) + depthVal * dProfR * rNx;
				const rDy = tFracR * (rightAdj[1] - capCenter[1]) + depthVal * dProfR * rNy;
				const rDLen = Math.hypot(rDx, rDy) || 1;
				const endX = capCenter[0] + (r * rDx) / rDLen;
				const endY = capCenter[1] + (r * rDy) / rDLen;

				// Sweep: cross product of exit directions → positive in SVG (y-down) = CW = sweep 1.
				const cross = lDx * rDy - lDy * rDx;
				const sweep = cross > 0 ? 1 : 0;
				// Arc spans less than 120° (interior minus inward offsets) → large-arc-flag=0.
				capArcs.push({
					path: `M${startX},${startY} A${r},${r} 0 0,${sweep} ${endX},${endY}`,
					terrainType: lType,
				});
			}
		}

		const fillForIntrusion = (t: "sea" | "mountain" | "lake"): string =>
			t === "sea"
				? SvgMapRenderer.TERRAIN_FILL_SEA
				: t === "lake"
					? SvgMapRenderer.TERRAIN_FILL_LAKE
					: SvgMapRenderer.TERRAIN_FILL_MOUNTAIN;

		// Layer order (bottom → top within terrainOverlayGroup):
		// 1. Intrusion fills — terrain color, cover hex edge area
		// 2. Intrusion boundary curves — white, full inner curve reaching hex corners
		// 3. Corner cap fills — terrain color, sits on top of boundary curves and hides
		//    the boundary curve endpoint that falls inside the cap (at the hex corner)
		// 4. Cap boundary arcs — white 120° arc tracing the district-facing edge of each cap

		this.terrainOverlayGroup
			.selectAll<SVGPathElement, IntrusionShape>("path.terrain-edge")
			.data(intrusions)
			.join("path")
			.attr("class", (d) => `terrain-edge terrain-edge-${d.terrainType}`)
			.attr("d", (d) => d.path)
			.attr("fill", (d) => fillForIntrusion(d.terrainType))
			.attr("stroke", "none")
			.style("pointer-events", "none");

		// Intrusion boundary curves: full inner curve (reaches hex corners). The endpoint
		// inside the cap will be hidden by the cap fill rendered next.
		this.terrainOverlayGroup
			.selectAll<SVGPathElement, IntrusionShape>("path.terrain-boundary")
			.data(intrusions)
			.join("path")
			.attr("class", (d) => `terrain-boundary terrain-boundary-${d.terrainType}`)
			.attr("d", (d) => d.boundaryPath)
			.attr("fill", "none")
			.attr("stroke", "#ffffff")
			.attr("stroke-width", SvgMapRenderer.TERRAIN_BOUNDARY_WIDTH / this.currentK)
			.attr("stroke-linecap", "round")
			.attr("opacity", SvgMapRenderer.TERRAIN_BOUNDARY_OPACITY)
			.style("pointer-events", "none");

		// Corner cap fills: hide the part of the intrusion boundary curves that falls
		// inside the cap (the depth-0 endpoint at the hex corner).
		this.terrainOverlayGroup
			.selectAll<SVGCircleElement, CornerCap>("circle.terrain-corner-cap")
			.data(cornerCaps)
			.join("circle")
			.attr("class", (d) => `terrain-corner-cap terrain-corner-cap-${d.terrainType}`)
			.attr("cx", (d) => d.cx)
			.attr("cy", (d) => d.cy)
			.attr("r", (d) => d.r)
			.attr("fill", (d) => fillForIntrusion(d.terrainType))
			.attr("stroke", "none")
			.style("pointer-events", "none");

		// Cap boundary arcs: white 120° arc tracing the district-facing visible edge of each cap.
		this.terrainOverlayGroup
			.selectAll<SVGPathElement, CapArc>("path.terrain-cap-arc")
			.data(capArcs)
			.join("path")
			.attr("class", (d) => `terrain-cap-arc terrain-cap-arc-${d.terrainType}`)
			.attr("d", (d) => d.path)
			.attr("fill", "none")
			.attr("stroke", "#ffffff")
			.attr("stroke-width", SvgMapRenderer.TERRAIN_BOUNDARY_WIDTH / this.currentK)
			.attr("stroke-linecap", "round")
			.attr("opacity", SvgMapRenderer.TERRAIN_BOUNDARY_OPACITY)
			.style("pointer-events", "none");
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
				// Terrain feature stroke widths also scale inversely.
				this.riverGroup
					.selectAll<SVGPathElement, Point2D[]>("path.river-chain")
					.attr("stroke-width", SvgMapRenderer.RIVER_BASE_WIDTH / this.currentK);
				// Coast/foothill render as filled <path> (no stroke, no scaling needed).
				// Terrain-boundary curves and cap arcs (district outline along terrain edge).
				const tbw = SvgMapRenderer.TERRAIN_BOUNDARY_WIDTH / this.currentK;
				this.terrainOverlayGroup
					.selectAll<SVGPathElement, unknown>("path.terrain-boundary")
					.attr("stroke-width", tbw);
				this.terrainOverlayGroup
					.selectAll<SVGPathElement, unknown>("path.terrain-cap-arc")
					.attr("stroke-width", tbw);
				// Hover edge highlights (only present while a precinct is hovered).
				this.hoverHighlightGroup
					.selectAll<SVGLineElement, unknown>("line.hover-edge")
					.attr("stroke-width", SvgMapRenderer.HOVER_STROKE_WIDTH / this.currentK);
				this.countyBorderGroup
					.selectAll<SVGLineElement, Segment>("line.county-boundary")
					.attr("stroke-width", SvgMapRenderer.COUNTY_BASE_WIDTH / this.currentK)
					.attr(
						"stroke-dasharray",
						`${SvgMapRenderer.COUNTY_DASH_ON / this.currentK},${SvgMapRenderer.COUNTY_DASH_OFF / this.currentK}`,
					);
				if (this.keyboardFocusPath !== null) {
					d3.select(this.keyboardFocusPath)
						.attr("stroke-width", 2 / this.currentK)
						.attr("stroke-dasharray", `${4 / this.currentK},${2 / this.currentK}`);
				}
				if (this.coordLabelsRendered) {
					const fs = SvgMapRenderer.COORD_LABEL_FONT_SIZE / this.currentK;
					this.coordLabelGroup
						.selectAll("text.coord-label, text.coord-label-tile")
						.attr("font-size", fs)
						.attr("stroke-width", 3 / this.currentK);
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
			// GAME-105: this zoom shortcut is bound to `document`, so it would otherwise fire
			// while a modal (result dialog) is open over the map, or during a frozen tutorial
			// step — both mark the map (or an editor ancestor) `inert`. Honour that.
			if (svgNode.closest("[inert]")) return;
			if (e.key === "=" || e.key === "+") {
				e.preventDefault();
				this.svg
					.transition()
					.duration(SvgMapRenderer.ZOOM_DURATION_SHORT)
					.call(this.zoomBehavior.scaleBy, SvgMapRenderer.ZOOM_STEP);
			} else if (e.key === "-") {
				e.preventDefault();
				this.svg
					.transition()
					.duration(SvgMapRenderer.ZOOM_DURATION_SHORT)
					.call(this.zoomBehavior.scaleBy, 1 / SvgMapRenderer.ZOOM_STEP);
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
			.data(precincts, (d) => String(d.index))
			.join(
				(enter) =>
					enter
						.append("path")
						.attr("class", "hex")
						.attr("data-precinct-id", (d) => String(d.index))
						.attr("d", (d) => hexPolygonPath(d))
						.attr("stroke", "none")
						.attr("stroke-width", 0.5)
						.style("cursor", "crosshair"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("fill", (d) => this.hexFill(d, assignments))
			.attr("opacity", (d) => this.hexOpacity(d, assignments));

		this.renderBoundaries(computeBoundarySegments(precincts, assignments, this.terrainFacingEdges));
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

		const segments = computeBoundarySegments(
			precincts,
			previewAssignments,
			this.terrainFacingEdges,
		);
		const strokeWidth = SvgMapRenderer.PREVIEW_BASE_WIDTH / this.currentK;

		this.previewBorderGroup
			.selectAll<SVGLineElement, Segment>("line.preview-boundary")
			.data(segments)
			.join(
				(enter) =>
					enter.append("line").attr("class", "preview-boundary").attr("stroke-linecap", "round"),
				(update) => update,
				(exit) => exit.remove(),
			)
			.attr("x1", (d) => d.x1)
			.attr("y1", (d) => d.y1)
			.attr("x2", (d) => d.x2)
			.attr("y2", (d) => d.y2)
			.attr("stroke", "#ffffff")
			.attr("stroke-width", strokeWidth)
			.attr(
				"stroke-dasharray",
				`${SvgMapRenderer.PREVIEW_DASH_ON / this.currentK},${SvgMapRenderer.PREVIEW_DASH_OFF / this.currentK}`,
			)
			.attr("opacity", SvgMapRenderer.PREVIEW_OPACITY);
	}

	private clearBoundaryPreview() {
		this.previewBorderGroup.selectAll("line.preview-boundary").remove();
	}

	// ─── Hover events ─────────────────────────────────────────────────────────

	/**
	 * Single delegated mousemove/mouseout on the SVG.
	 * Hover brightens opacity and draws edge highlights in hoverHighlightGroup for
	 * non-terrain-facing edges only — terrain-facing edges are skipped so the highlight
	 * doesn't float over intrusion fills or show clipped corners at corner caps.
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
				d3.select(path).attr("opacity", SvgMapRenderer.HOVER_OPACITY);

				// Draw highlight segments only on non-terrain-facing edges, in
				// hoverHighlightGroup (above terrainOverlayGroup) so they're visible
				// over district boundary lines but never over terrain fills.
				const corners = hexCorners(d.center);
				const segs: Segment[] = [];
				for (let i = 0; i < 6; i++) {
					if (this.terrainFacingEdges.has(`${d.index}:${i}`)) continue;
					const c0 = corners[i],
						c1 = corners[(i + 1) % 6];
					if (c0 && c1) segs.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
				}
				this.hoverHighlightGroup
					.selectAll<SVGLineElement, Segment>("line.hover-edge")
					.data(segs)
					.join("line")
					.attr("class", "hover-edge")
					.attr("x1", (s) => s.x1)
					.attr("y1", (s) => s.y1)
					.attr("x2", (s) => s.x2)
					.attr("y2", (s) => s.y2)
					.attr("stroke", "#ffffff")
					.attr("stroke-width", SvgMapRenderer.HOVER_STROKE_WIDTH / this.currentK)
					.attr("stroke-linecap", "round")
					.attr("opacity", SvgMapRenderer.BOUNDARY_OPACITY)
					.style("pointer-events", "none");

				const { assignments } = this.getState();
				const dId = assignments.get(d.index);
				const infoPanel = document.getElementById("precinct-info");
				if (infoPanel !== null) {
					// Precinct / county / group / party names are scenario-derived
					// strings reaching innerHTML — escape them (GAME-103). Numeric
					// and `District N` / `Precinct N` fallbacks stay as markup.
					const precinctLabel = d.name != null ? escapeHtml(d.name) : `Precinct ${d.index}`;
					const distLabel = dId != null ? `District ${dId}` : "Unassigned";
					const topParty = winnerOf(d.voteShare, this.parties);
					const partyName = escapeHtml(
						this.partyNames[topParty] ?? partyLabel(this.parties, topParty),
					);
					const leanLabel = `${partyName} (${((d.voteShare[topParty] ?? 0) * 100).toFixed(1)}%)`;
					// Per-precinct vote breakdown (GAME-112): for 3+ party scenarios the single
					// "Lean" leader hides the split, so show a proportional bar in each party's
					// color + every party's share. 2-party scenarios keep the leader-only line.
					let breakdownHtml = "";
					if (this.parties.length > 2) {
						const ranked = this.parties
							.map((p) => ({ p, pct: (d.voteShare[p] ?? 0) * 100 }))
							.sort((a, b) => b.pct - a.pct);
						const bar = ranked
							.map(
								({ p, pct }) =>
									`<span style="width:${pct.toFixed(1)}%;background:${partyColor(this.parties, p)}"></span>`,
							)
							.join("");
						const legend = ranked
							.map(
								({ p, pct }) =>
									`${escapeHtml(this.partyNames[p] ?? partyLabel(this.parties, p))} ${pct.toFixed(0)}%`,
							)
							.join(" · ");
						breakdownHtml =
							`<div class="vote-bar-multi" style="margin:5px 0 3px">${bar}</div>` +
							`<span style="color:#8898b0">${legend}</span>`;
					}
					let groupsHtml = "";
					if (d.groupShares && d.groupShares.length > 1) {
						const lines = d.groupShares.map(
							(g) => `${escapeHtml(g.name)}: ${(g.share * 100).toFixed(0)}%`,
						);
						groupsHtml = `<br><span style="color:#8898b0">` + lines.join("<br>") + `</span>`;
					}
					const countyHtml = d.county_name
						? `<span style="color:#8898b0">${escapeHtml(d.county_name)}</span><br>`
						: "";
					infoPanel.innerHTML =
						`<div class="precinct-name">${precinctLabel}</div>` +
						`<div class="precinct-detail">` +
						countyHtml +
						`${distLabel}<br>` +
						`Pop: ${d.population.toLocaleString()}<br>` +
						`Lean: ${leanLabel}` +
						breakdownHtml +
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

	/** Restores hex opacity and removes hover edge segments. Never touches fill. */
	private clearHover() {
		if (this.hoveredPath === null) return;
		this.hoverHighlightGroup.selectAll("line.hover-edge").remove();
		if (this.hoveredPath === this.keyboardFocusPath) {
			this.hoveredPath = null;
			return;
		}
		const path = this.hoveredPath;
		this.hoveredPath = null;
		const { assignments } = this.getState();
		const d = d3.select<SVGPathElement, Precinct>(path).datum();
		if (d !== undefined) {
			d3.select(path).attr("opacity", this.hexOpacity(d, assignments));
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
			this.strokePrecincts = new Set([d.index]);
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
			if (d === undefined || this.strokePrecincts.has(d.index)) return;

			this.strokePrecincts.add(d.index);
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
		const base = districtColor(districtId);
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
			// 3+ parties (GAME-112): a two-party diverging gradient can't represent a
			// third bloc, so paint each precinct its PLURALITY party's colour, shaded by
			// how dominant that plurality is (margin over the runner-up) — a stronghold
			// reads saturated, a contested precinct pale, restoring the strength cue the
			// PuOr scale gives. Two-party scenarios keep the PuOr gradient below unchanged
			// (T1–T4 + the educational scenarios).
			if (this.parties.length > 2) {
				const top = winnerOf(d.voteShare, this.parties);
				const sorted = this.parties.map((p) => d.voteShare[p] ?? 0).sort((a, b) => b - a);
				const margin = (sorted[0] ?? 0) - (sorted[1] ?? 0);
				const strength = Math.min(1, margin / SvgMapRenderer.LEAN_FULL_MARGIN);
				const c = d3.hsl(partyColor(this.parties, top));
				c.l = c.l + (1 - strength) * (SvgMapRenderer.LEAN_PALE_L - c.l);
				return c.formatHex();
			}
			// Lean between the two lean parties (scenario party1/party2). For a 2-party
			// scenario this is party2 − party1, identical to the pre-GAME-043 D − R.
			const party1 = this.parties[0];
			const party2 = this.parties[1];
			const p1Share = party1 !== undefined ? (d.voteShare[party1] ?? 0) : 0;
			const p2Share = party2 !== undefined ? (d.voteShare[party2] ?? 0) : 0;
			const lean = p2Share - p1Share;
			// PuOr (purple-orange): CVD-safe diverging palette; avoids party color collision.
			// t=0 → orange (party1-leaning), t=1 → purple (party2-leaning). Clamped to [0.1,0.9] for dark-bg contrast.
			// Source: ColorBrewer (Brewer 2003) https://colorbrewer2.org/
			const t = Math.max(0.1, Math.min(0.9, (lean + 1) / 2));
			return d3.interpolatePuOr(t);
		}
		const dId = assignments.get(d.index);
		if (dId == null) return "#2a2a3e";
		const base = districtColor(dId);
		const normPop =
			this.popMax > this.popMin ? (d.population - this.popMin) / (this.popMax - this.popMin) : 0.5;
		const c = d3.hsl(base);
		c.l = SvgMapRenderer.HEX_LIGHTNESS_BASE - normPop * SvgMapRenderer.HEX_LIGHTNESS_RANGE;
		return c.formatHex();
	}

	private hexOpacity(d: Precinct, assignments: GameStore["assignments"]): number {
		if (this.viewMode === "lean") return SvgMapRenderer.LEAN_OPACITY;
		const dId = assignments.get(d.index);
		return dId != null ? SvgMapRenderer.ASSIGNED_OPACITY : SvgMapRenderer.UNASSIGNED_OPACITY;
	}

	// ─── Keyboard precinct navigation (GAME-008) ──────────────────────────────

	private initKeyboardNav() {
		const svgNode = this.svg.node()!;

		svgNode.addEventListener("keydown", (e: KeyboardEvent) => {
			// GAME-105: keyboard-safe tutorial lock. The map is marked `inert` during frozen
			// (non-paint) tutorial steps. `inert` on an SVG root isn't reliably enforced for
			// keydown by every browser, so bail explicitly — a keyboard user must not paint
			// while the coach has the map locked.
			if (svgNode.hasAttribute("inert")) return;
			const { precincts, activeDistrict, districtCount } = this.getState();
			if (precincts.length === 0) return;

			// Initialize focus to first precinct if none selected
			if (this.focusedPrecinctId === null) {
				this.setKeyboardFocus(precincts[0]!.index, precincts);
				return;
			}

			const current = precincts.find((p) => p.index === this.focusedPrecinctId);
			if (current === undefined) return;

			// Arrow key → neighbor direction mapping for flat-top hex grid
			// Try primary then secondary direction to handle diagonal movement
			const dirMap: Record<string, number[]> = {
				ArrowUp: [4],
				ArrowDown: [1],
				ArrowRight: [5, 0],
				ArrowLeft: [3, 2],
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
			const num = Number.parseInt(e.key, 10);
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
		const p = precincts.find((pr) => pr.index === precinctId);
		if (p !== undefined) {
			const { assignments, districtCount } = this.getState();
			const dId = assignments.get(p.index);
			const distLabel = dId != null ? `district ${dId}` : "unassigned";
			const label = p.name ?? `Precinct ${p.index}`;
			this.svg.attr(
				"aria-label",
				`District map — focused: ${label}, ${distLabel}. ` +
					`Arrow keys navigate. Number keys 1–${districtCount} assign district. Space assigns active district.`,
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
			const { districtCount } = this.getState();
			this.svg.attr(
				"aria-label",
				"District map. Use mouse or keyboard to paint precincts. " +
					`Arrow keys navigate precincts, number keys 1–${districtCount} assign to a district.`,
			);
		}
	}
}
