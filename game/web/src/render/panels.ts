import { escapeHtml } from "../model/escape-html.js";
import type { PartyId, ScenarioRules } from "../model/scenario.js";
import { districtColor } from "../model/runtime.js";
import { candidateForDistrict, partyColor, partyLabel } from "../model/party.js";
import type { DistrictDemoStat } from "../simulation/evaluate.js";
import { computeValidityStats } from "../simulation/validity.js";
import type { GameStore } from "../store/gameStore.js";

export function renderResults(
	container: HTMLElement,
	state: GameStore,
	partyNames?: Partial<Record<PartyId, string>>,
	partyColors?: Partial<Record<PartyId, string>>,
	partyCandidates?: Partial<Record<PartyId, string[]>>,
): void {
	if (state.simulationResult === null || state.simulationResult.districtResults.length === 0) {
		container.innerHTML =
			'<div style="color:#606080;font-size:0.85rem;">Draw districts to see results</div>';
		return;
	}

	const parties = state.parties;
	// The two lean parties used for the 2-party vote bar / detail line — the
	// scenario's first two parties (party1, party2). Multiparty scenarios (GAME-112)
	// take the all-parties branch below instead.
	const party1 = parties[0]!;
	const party2 = parties[1] ?? party1;
	const isMultiparty = parties.length > 2;
	// Party labels derive from scenario.parties[].name — escape before interpolating
	// into innerHTML markup (GAME-103). Colors are the scenario's authored hex, else
	// the palette fallback (GAME-043).
	const labelOf = (p: PartyId): string => escapeHtml(partyNames?.[p] ?? partyLabel(parties, p));
	const colorOf = (p: PartyId): string => partyColors?.[p] ?? partyColor(parties, p);
	// The seat is held by a named CANDIDATE when authored (GAME-117): candidates are
	// indexed by districtId − 1 (ids are 1-based). Falls back to the party name, so a
	// scenario without candidates reads exactly as before.
	const winnerOfDistrict = (p: PartyId, districtId: number): string => {
		const name = candidateForDistrict(partyCandidates?.[p], districtId);
		return name !== undefined ? escapeHtml(name) : labelOf(p);
	};

	const { districtResults } = state.simulationResult;
	const html = districtResults
		.map((r) => {
			const color = districtColor(r.districtId);
			const winnerColor = colorOf(r.winner);
			const winnerLabel = winnerOfDistrict(r.winner, r.districtId);
			const marginPct = (r.margin * 100).toFixed(1);

			if (isMultiparty) {
				// Every party, ranked by share: a proportional multi-segment bar in each
				// party's color + a full breakdown, so a third bloc (e.g. an independent)
				// is visible in each district even when it doesn't win.
				const ranked = parties
					.map((p) => ({ p, pct: (r.voteTotals[p] ?? 0) * 100 }))
					.sort((a, b) => b.pct - a.pct);
				const segments = ranked
					.map(
						({ p, pct }) =>
							`<span style="width:${pct.toFixed(1)}%;background:${colorOf(p)}"></span>`,
					)
					.join("");
				const details = ranked.map(({ p, pct }) => `${labelOf(p)} ${pct.toFixed(1)}%`).join(" · ");
				return `
      <div class="result-district" style="border-left-color:${color}">
        <div class="dist-name">District ${r.districtId}</div>
        <div class="winner-badge" style="background:${winnerColor};color:#fff">${winnerLabel} +${marginPct}%</div>
        <div class="vote-bar-multi">${segments}</div>
        <div class="vote-details">
          ${details} · ${r.precinctCount} precincts · pop ${r.population.toLocaleString()}
        </div>
      </div>`;
			}

			// 2-party card (unchanged from pre-GAME-112).
			const p2Label = labelOf(party2);
			const p1Label = labelOf(party1);
			const p2Pct = ((r.voteTotals[party2] ?? 0) * 100).toFixed(1);
			const p1Pct = ((r.voteTotals[party1] ?? 0) * 100).toFixed(1);
			return `
      <div class="result-district" style="border-left-color:${color}">
        <div class="dist-name">District ${r.districtId}</div>
        <div class="winner-badge" style="background:${winnerColor};color:#fff">${winnerLabel} +${marginPct}%</div>
        <div class="vote-bar" style="--d-pct:${p2Pct}%"></div>
        <div class="vote-details">
          ${p2Label} ${p2Pct}% · ${p1Label} ${p1Pct}% · ${r.precinctCount} precincts · pop ${r.population.toLocaleString()}
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
