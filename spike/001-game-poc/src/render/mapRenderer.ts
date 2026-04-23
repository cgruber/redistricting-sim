/**
 * D3 SVG renderer for the hex precinct map.
 *
 * Uses the data join pattern (selection.data(data).join(...)) — not manual append loops.
 * Reads state from the Zustand store; does not mutate it.
 * Brush painting is wired here (mouse event handlers call store actions).
 */

import * as d3 from "d3";
import { hexCorners, mapBounds } from "../model/generator.js";
import type { Precinct } from "../model/types.js";
import { DISTRICT_COLORS, PARTY_COLORS, PARTY_LABELS } from "../model/types.js";
import type { GameStore } from "../store/gameStore.js";

// ─── Types ───────────────────────────────────────────────────────────────────

type SVGSel = d3.Selection<SVGSVGElement, unknown, null, undefined>;
// D3's append returns a Selection with parent type null when chained from select(element)
type GSel = d3.Selection<SVGGElement, unknown, null, undefined>;

// ─── Polygon path helper ─────────────────────────────────────────────────────

function hexPolygonPath(p: Precinct): string {
	const corners = hexCorners(p.center);
	return `M${corners.map((c) => c.join(",")).join("L")}Z`;
}

// ─── Renderer class ──────────────────────────────────────────────────────────

export class MapRenderer {
	private svg: SVGSel;
	private hexGroup: GSel;
	private borderGroup: GSel;
	private getState: () => GameStore;
	private paintStroke: GameStore["paintStroke"];
	private setActiveDistrict: GameStore["setActiveDistrict"];

	// Brush state
	private isPainting = false;
	private strokePrecincts: Set<number> = new Set();
	private strokeDistrict = 1;

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
		this.borderGroup = this.svg.append("g").attr("class", "borders");
		this.hexGroup = this.svg.append("g").attr("class", "hexes");

		this.initViewBox();
		this.initBrushEvents();
	}

	private initViewBox() {
		const { precincts } = this.getState();
		const bounds = mapBounds(precincts);
		this.svg.attr("viewBox", `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
		this.svg.attr("width", "100%").attr("height", "100%");
	}

	/** Main render — called any time state changes */
	render() {
		const state = this.getState();
		const { precincts, assignments, activeDistrict } = state;

		// ── Hex fill polygons (data join) ──────────────────────────────────────
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
			.attr("fill", (d) => {
				const dId = assignments.get(d.id);
				if (dId === null || dId === undefined) return "#2a2a3e";
				const color = DISTRICT_COLORS[dId - 1];
				return color ?? "#2a2a3e";
			})
			.attr("opacity", (d) => {
				const dId = assignments.get(d.id);
				return dId !== null && dId !== undefined ? 0.75 : 0.35;
			})
			.on("mouseenter", (_event, d) => {
				const dId = assignments.get(d.id);
				const distLabel = dId !== null && dId !== undefined ? `District ${dId}` : "Unassigned";
				const bar = document.getElementById("status-bar");
				if (bar !== null) {
					const topParty = (["D", "R", "L", "G", "I"] as const).reduce((a, b) =>
						d.partyShare[a] > d.partyShare[b] ? a : b,
					);
					bar.textContent = `Precinct ${d.id} | ${distLabel} | Pop: ${d.population.toLocaleString()} | Lean: ${PARTY_LABELS[topParty]} (${(d.partyShare[topParty] * 100).toFixed(1)}%)`;
				}
				// Highlight on hover
				d3.select<SVGPathElement, Precinct>(
					this.hexGroup
						.selectAll<SVGPathElement, Precinct>("path.hex")
						.filter((p) => p.id === d.id)
						.node() as SVGPathElement,
				)
					.attr("stroke", "#ffffff")
					.attr("stroke-width", 1.5)
					.attr("opacity", 0.95);
			})
			.on("mouseleave", (_event, d) => {
				const dId = assignments.get(d.id);
				d3.select<SVGPathElement, Precinct>(
					this.hexGroup
						.selectAll<SVGPathElement, Precinct>("path.hex")
						.filter((p) => p.id === d.id)
						.node() as SVGPathElement,
				)
					.attr("stroke", "none")
					.attr("stroke-width", 0.5)
					.attr("opacity", dId !== null && dId !== undefined ? 0.75 : 0.35);
			})
			.on("mousedown", (_event, d) => {
				this.isPainting = true;
				this.strokeDistrict = activeDistrict;
				this.strokePrecincts = new Set([d.id]);
				this.setActiveDistrict(activeDistrict);
			})
			.on("mousemove", (_event, d) => {
				if (!this.isPainting) return;
				this.strokePrecincts.add(d.id);
			});

		// ── District boundary edges ────────────────────────────────────────────
		this.renderBoundaries(precincts, assignments);
	}

	private renderBoundaries(precincts: Precinct[], assignments: GameStore["assignments"]) {
		// Collect boundary segments: edges between precincts in different districts
		const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

		for (const p of precincts) {
			const pDist = assignments.get(p.id);
			const corners = hexCorners(p.center);

			for (let i = 0; i < 6; i++) {
				// Each edge is shared with a neighbor
				// The 6 neighbor directions correspond to edge indices
				// We only draw the edge if the neighbor belongs to a different district
				// (or is unassigned / out-of-bounds)
				// neighbors[i] is null if there is no neighbor across edge i (grid boundary).
				// Index i aligns with edge i (corner[i] → corner[i+1]) by construction.
				const nId = p.neighbors[i] ?? null;
				const c0 = corners[i];
				const c1 = corners[(i + 1) % 6];
				if (c0 === undefined || c1 === undefined) continue;

				if (nId === null) {
					// Grid boundary edge — always draw
					segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
					continue;
				}
				const nDist = assignments.get(nId);
				if (pDist !== nDist) {
					// District boundary edge — draw
					segments.push({ x1: c0[0], y1: c0[1], x2: c1[0], y2: c1[1] });
				}
			}
		}

		this.borderGroup
			.selectAll<SVGLineElement, (typeof segments)[number]>("line.boundary")
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
			.attr("opacity", 0.6);
	}

	/** Bind mouse-up on window to commit stroke */
	private initBrushEvents() {
		window.addEventListener("mouseup", () => {
			if (!this.isPainting) return;
			this.isPainting = false;
			const ids = Array.from(this.strokePrecincts);
			if (ids.length > 0) {
				this.paintStroke(ids, this.strokeDistrict);
			}
			this.strokePrecincts = new Set();
		});
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
