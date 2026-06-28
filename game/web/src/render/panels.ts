import type { ScenarioRules } from "../model/scenario.js";
import { PARTY_COLORS, PARTY_LABELS, districtColor, type PartyKey } from "../model/types.js";
import type { DistrictDemoStat } from "../simulation/evaluate.js";
import { computeValidityStats } from "../simulation/validity.js";
import type { GameStore } from "../store/gameStore.js";

export function renderResults(
	container: HTMLElement,
	state: GameStore,
	partyLabels?: Partial<Record<PartyKey, string>>,
): void {
	if (state.simulationResult === null || state.simulationResult.districtResults.length === 0) {
		container.innerHTML =
			'<div style="color:#606080;font-size:0.85rem;">Draw districts to see results</div>';
		return;
	}

	const labels: Record<PartyKey, string> = { ...PARTY_LABELS, ...partyLabels };
	const { districtResults } = state.simulationResult;
	const html = districtResults
		.map((r) => {
			const color = districtColor(r.districtId);
			const winnerColor = PARTY_COLORS[r.winner];
			const winnerLabel = labels[r.winner];
			const dPct = (r.voteTotals.D * 100).toFixed(1);
			const rPct = (r.voteTotals.R * 100).toFixed(1);
			const marginPct = (r.margin * 100).toFixed(1);
			return `
      <div class="result-district" style="border-left-color:${color}">
        <div class="dist-name">District ${r.districtId}</div>
        <div class="winner-badge" style="background:${winnerColor};color:#fff">${winnerLabel} +${marginPct}%</div>
        <div class="vote-bar" style="--d-pct:${dPct}%"></div>
        <div class="vote-details">
          ${labels.D} ${dPct}% · ${labels.R} ${rPct}% · ${r.precinctCount} precincts · pop ${r.population.toLocaleString()}
        </div>
      </div>`;
		})
		.join("");

	container.innerHTML = html;
}

export function renderDistrictButtons(
	container: HTMLElement,
	districtCount: number,
	activeDistrict: number,
	onSelect: (id: number) => void,
	demoStat?: DistrictDemoStat,
): void {
	container.innerHTML = "";
	for (let i = 1; i <= districtCount; i++) {
		const color = districtColor(i);

		const wrapper = document.createElement("div");
		wrapper.className = "district-btn-wrap";

		const btn = document.createElement("button");
		btn.className = `district-btn${i === activeDistrict ? " active" : ""}`;
		btn.style.background = color;
		btn.style.color = "#fff";
		btn.setAttribute("aria-label", `Paint District ${i}`);
		btn.setAttribute("data-tip", `District ${i}`);
		btn.setAttribute("data-district", String(i)); // stable hook for the tutorial overlay (GAME-076)
		// Number shows when the toolbar is collapsed; full label when expanded.
		const num = document.createElement("span");
		num.className = "district-num";
		num.textContent = String(i);
		const label = document.createElement("span");
		label.className = "district-label";
		label.textContent = `District ${i}`;
		btn.append(num, label);
		btn.addEventListener("click", () => onSelect(i));
		wrapper.appendChild(btn);

		if (demoStat) {
			const share = demoStat.shares[i - 1] ?? 0;
			const pct = Math.round(share * 100);
			const thresholdPct = Math.round(demoStat.threshold * 100);
			const met = pct >= thresholdPct;
			const stat = document.createElement("div");
			stat.className = `district-demo-stat${met ? " met" : ""}`;
			stat.textContent = `${pct}% ${demoStat.label}`;
			wrapper.appendChild(stat);
		}

		container.appendChild(wrapper);
	}
}

export function renderValidityPanel(
	container: HTMLElement,
	state: GameStore,
	rules: ScenarioRules,
	showBalance = true,
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

	// Population balance — only when the scenario actually gates on it (a
	// population_balance success criterion). Pre-electoral tutorials that don't
	// enforce balance must not show a constraint the player isn't held to.
	if (showBalance) {
	html += `<div class="validity-section-label">Population balance</div>`;
	for (const d of stats.districtPop) {
		const color = districtColor(d.districtId);
		const sign = d.deviationPct >= 0 ? "+" : "";
		const cls = d.status === "ok" ? "validity-ok" : "validity-error";
		const statusLabel = d.status === "ok" ? "ok" : d.status;
		html += `<div class="validity-row ${cls}" style="border-left-color:${color}">`;
		html += `<span>D${d.districtId}: ${d.population.toLocaleString()}</span>`;
		html += `<span class="validity-badge">${sign}${d.deviationPct.toFixed(1)}% ${statusLabel}</span>`;
		html += `</div>`;
	}
	}

	// Contiguity (skipped when "allowed")
	if (stats.contiguity !== null) {
		html += `<div class="validity-section-label">Contiguity</div>`;
		for (const [did, ok] of stats.contiguity) {
			const color = districtColor(did);
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
