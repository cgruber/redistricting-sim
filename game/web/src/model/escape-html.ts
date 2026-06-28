/**
 * escape-html.ts — minimal HTML-entity escaping for untrusted strings that are
 * interpolated into innerHTML/insertAdjacentHTML markup (GAME-103).
 *
 * Scenario-derived strings (party names, precinct / county / group names) flow
 * into HTML string templates at several sinks. They are same-origin and
 * team-authored today, but the roadmap (scenario import, the GAME-092 editor,
 * user-named saves) turns these into an execution vector. Escaping the five
 * HTML-significant characters renders any injected markup inert.
 *
 * Pure function: no DOM, no globals — unit-testable under Node.
 */
export function escapeHtml(s: string): string {
	// `&` MUST be replaced first, otherwise the ampersands introduced by the
	// later replacements get double-escaped.
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
