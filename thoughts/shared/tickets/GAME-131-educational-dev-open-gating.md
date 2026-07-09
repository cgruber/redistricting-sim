---
id: GAME-131
title: educational campaign — open on the dev deploy, coming-soon on beta/production (env-conditional gating)
area: game (UX, deployment, campaign)
status: open
created: 2026-07-09
---

## Summary

The educational campaign renders as a static **"coming soon"** placeholder on every channel
(GAME-128) while the arc is authored. To develop and test the educational arc — the VRA/Callais
scenarios (GAME-078 / DESIGN-013) — on the **dev deploy** without exposing it on **beta** before it
is finished, make the coming-soon gate **env-conditional**:

- **OPEN** (interactive, playable) on the dev deploy (any `dev.` host) — no `?debug` needed, so the
  owner can just visit `dev.pastthepost.gg` and play through the arc.
- **CLOSED** (coming-soon placeholder) on beta, staging, production, and a default local build.
- `?debug` opens a `comingSoon` campaign on **any** host (developer override; same philosophy as the
  GAME-115 `debugOnly` / `IS_DEBUG` reveal).

The gate is keyed on the **runtime hostname**, deliberately **not** `import.meta.env.DEV`: the dev
deploy is a production `vite build`, where `import.meta.env.DEV` is `false` — a build-mode check
would wrongly render the card **closed** on the very deployment meant to preview it. Data stays
declarative (educational keeps `comingSoon: true`); a pure `rendersAsComingSoon(campaign, hostname,
isDebug)` decides the render. Scope boundary: gating only — no VRA content, no new scenarios.

## Current State

GAME-128 added `comingSoon?: boolean` to the `Campaign` model and set it on the educational
campaign; `showCampaignSelect` (`main.ts`) checks `campaign.comingSoon` **statically** and renders a
non-interactive placeholder. There is no per-channel gating: flipping the flag off would expose the
unfinished arc on the next **beta** release, and leaving it on keeps the arc unplayable on **dev**
(where the owner wants to test it). The debug-detection mechanism (`IS_DEBUG`, GAME-115) is already a
runtime signal (`?debug` param + `sessionStorage`), not a build-time env var — so a runtime gate is
the consistent, correct shape.

## Design note (deliberate, so it isn't surprising)

- **localhost is closed by default.** A default `serve-local` build mirrors beta (coming-soon); to
  preview the OPEN state locally, append `?debug`. This keeps the beta-facing render exercised by the
  existing GAME-128 e2e (which runs on localhost) and lets the owner eyeball **both** states locally.
- The dev deploy (`dev.*`) is the channel that opens with no `?debug` — that is the owner's on-the-road
  test surface (`dev.pastthepost.gg`).
- Fail-closed: any host that is not a recognized preview host → coming-soon. Beta/staging/production
  are closed by the default, not by enumeration, so a mis-typed host can never accidentally open.

## Goals / acceptance criteria

- [ ] Educational card is **OPEN** (interactive: `role=button`, tab order, scenario count, navigates
      to `?campaign=educational`) on the dev deploy (`dev.` host), with no `?debug`.
- [ ] Educational card is **CLOSED** (coming-soon placeholder) on beta, staging, production, and a
      default local build.
- [ ] `?debug` opens a `comingSoon` campaign on any host (developer/owner override).
- [ ] Gate keyed on the **runtime hostname** (`window.location.hostname`), not `import.meta.env.DEV`.
- [ ] Fail-closed: any unrecognized host → coming-soon.
- [ ] Data stays declarative — educational still carries `comingSoon: true`; a pure
      `rendersAsComingSoon` computes the render decision (no per-campaign special-casing in `main.ts`).

## Test Coverage

- [ ] Unit (`campaigns_test.ts`):
      - `isPreviewHost`: `dev.*` → true; beta / staging / production / localhost / `127.0.0.1` /
        empty → false.
      - `rendersAsComingSoon` (educational): open on `dev.*` (no debug); closed on beta / staging /
        production; closed on localhost-default and open on localhost with `?debug`; open on **any**
        host with `?debug`. A non-`comingSoon` campaign (tutorial) is never a placeholder.
- [ ] e2e (`campaign-select.spec.ts`):
      - Existing GAME-128 coming-soon test stays green on localhost-default (`/?view=campaigns`).
      - New open-state test (`/?view=campaigns&debug`): educational card is interactive
        (`role=button`), shows the scenario count, hides "coming soon", and clicking navigates to
        `?campaign=educational`.
- [ ] Full local `bazel test //game/...` green.
- [ ] Preview-verified on serve-local: `/?view=campaigns` = coming-soon; `/?view=campaigns&debug` =
      interactive/open.

## References

- `game/web/src/model/campaigns.ts` — `isPreviewHost`, `rendersAsComingSoon` (new pure gate)
- `game/web/src/main.ts` — `showCampaignSelect` render gate (was `if (campaign.comingSoon)`)
- `game/web/src/model/campaigns_test.ts`, `game/web/e2e/campaign-select.spec.ts` — tests
- GAME-128 — `comingSoon` flag + static coming-soon placeholder render (this generalizes it)
- GAME-115 — `debugOnly` / `?debug` `IS_DEBUG` runtime detection (the override signal reused here)
- GAME-078 / DESIGN-013 — the educational VRA/Callais arc being developed behind this gate
- DESIGN-014 — non-partisan framing (the arc-content gate, separate from this menu gate)
