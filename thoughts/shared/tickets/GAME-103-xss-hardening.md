---
id: GAME-103
title: Client-side injection hardening — escape scenario strings at innerHTML sinks, tighten CSP
area: game, security
status: open
created: 2026-06-27
---

## Summary

Scenario-derived strings reach `innerHTML` sinks unescaped, and the CSP backstop is weakened
by `data:` in `script-src`. Not a live XSS today (scenarios are same-origin, team-authored,
id-constrained to a hardcoded manifest), but it becomes an execution vector the moment any
less-trusted text flows through — and the roadmap (scenario import, the GAME-092 editor,
user-named saves) points exactly there. One shared helper closes all sinks. From the
2026-06-27 quality review (top-10 #6).

## Current State

- `panels.ts:28-40` builds an HTML string for results; `winnerLabel` and party labels derive
  from `scenario.parties[].name` (validated only by type-only `requireString`).
- `mapRenderer.ts:1149-1160` builds the hover precinct-info panel from `d.name`,
  `d.county_name`, party label, and per-group `g.name` — all scenario strings, unescaped, on
  the highest-frequency interaction.
- `main.ts:444-453` (`showLoadError`) interpolates `e.message` and `bodyHtml` into
  `insertAdjacentHTML` and wires the back button via an inline `onclick` on `backUrl`.
- `index.html:10` CSP `script-src` includes `data:` (only to satisfy the importmap react
  shim at `283-290`), letting any HTML-injection point load arbitrary script via
  `<script src="data:text/javascript,…">`.

## Goals / Acceptance Criteria

- [ ] Add one shared `escapeHtml()` (or prefer `createElement` + `textContent`) helper and use it for every dynamic scenario string at the three sinks above; keep only numeric/static parts as markup.
- [ ] `showLoadError` builds dynamic parts via `createElement`/`textContent` and wires the back button via `addEventListener`, not inline `onclick`.
- [ ] Replace the two `data:text/javascript` importmap entries with same-origin stub module files (e.g. `./react-stub.js` exporting `export default {}`), then remove `data:` from `script-src`.
- [ ] CSP remains functional (GA still loads; no console CSP violations) after the change.

## Test Coverage

- [ ] Unit test (jsdom or pure-helper extraction): a party/county/group name containing `<img src=x onerror=…>` renders as inert text, not an element, at each sink.
- [ ] e2e smoke: result screen and hover panel still render correctly for a shipped scenario; no CSP violation in console logs.

## References

- Review: `thoughts/shared/research/2026-06-27-codebase-quality-review.md` (Theme 3)
- `game/web/src/render/panels.ts`, `game/web/src/render/mapRenderer.ts`, `game/web/src/main.ts`, `game/web/index.html`
- Related: GAME-092 (scenario editor — arms the threat model), CodeQL (already runs)
