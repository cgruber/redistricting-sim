import type { ScenarioRules } from "../model/scenario.js";
import { DISTRICT_COLORS, PARTY_COLORS, PARTY_LABELS } from "../model/types.js";
import { computeValidityStats } from "../simulation/validity.js";
import type { GameStore } from "../store/gameStore.js";

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

export function renderValidityPanel(
	container: HTMLElement,
	state: GameStore,
	rules: ScenarioRules,
): void {
	const { precincts, assignments, districtCount } = state;
	const stats = computeValidityStats(precincts, assignments, districtCount, rules);

	let html = "";

	// Unassigned count
	const unassignedCls = stats.unassignedCount > 0 ? "validity-warn" : "validity-ok";
	const unassignedLabel =
		stats.unassignedCount === 1 ? "1 precinct" : `${stats.unassignedCount} precincts`;
	html += `<div class="validity-row ${unassignedCls}">`;
	html += `<span>Unassigned</span><span class="validity-badge">${unassignedLabel}</span>`;
	html += `</div>`;

	// Population balance
	html += `<div class="validity-section-label">Population balance</div>`;
	for (const d of stats.districtPop) {
		const color = DISTRICT_COLORS[d.districtId - 1] ?? "#888";
		const sign = d.deviationPct >= 0 ? "+" : "";
		const cls = d.status === "ok" ? "validity-ok" : "validity-error";
		const statusLabel = d.status === "ok" ? "ok" : d.status;
		html += `<div class="validity-row ${cls}" style="border-left-color:${color}">`;
		html += `<span>D${d.districtId}: ${d.population.toLocaleString()}</span>`;
		html += `<span class="validity-badge">${sign}${d.deviationPct.toFixed(1)}% ${statusLabel}</span>`;
		html += `</div>`;
	}

	// Contiguity (skipped when "allowed")
	if (stats.contiguity !== null) {
		html += `<div class="validity-section-label">Contiguity</div>`;
		for (const [did, ok] of stats.contiguity) {
			const color = DISTRICT_COLORS[did - 1] ?? "#888";
			const cls = ok
				? "validity-ok"
				: rules.contiguity === "required"
					? "validity-error"
					: "validity-warn";
			const label = ok ? "Connected" : "Non-contiguous";
			html += `<div class="validity-row ${cls}" style="border-left-color:${color}">`;
			html += `<span>D${did}</span><span class="validity-badge">${label}</span>`;
			html += `</div>`;
		}
	}

	container.innerHTML = html;
}
