---
id: GAME-006
title: Compressed scenario format and efficient delivery
area: game, build
status: resolved
created: 2026-04-25
---

## Summary

Reduce scenario download size. Two concerns addressed together: (1) HTTP-level
compression for bundled v1 scenarios served with the app; (2) a defined portable
compressed file format for future downloadable/community scenarios.

## Current State

Scenarios are plain JSON. No compression strategy defined. For v1, scenarios will
be bundled as static assets. Community/downloadable scenarios are post-v1 but the
format decision should be made before the loader is finalised.

## Goals / Acceptance Criteria

**Part A — HTTP delivery (v1 bundled scenarios):**
- [ ] Vite build configured to emit scenarios with gzip (`.gz`) or brotli (`.br`)
  pre-compressed alongside the originals, OR confirm that the v1 host (Vite dev
  server + production serve target) serves static JSON with `Content-Encoding: gzip`
  automatically
- [ ] Decision documented: either "HTTP compression is sufficient; no format change"
  or "explicit `.scenarioz` format adopted" — with rationale
- [ ] If HTTP compression is confirmed sufficient for v1: this AC closes Part A;
  no loader changes needed

**Part B — Portable compressed format (for future downloadable scenarios):**
- [ ] Define a compressed scenario file format: a gzip-compressed JSON file,
  file extension `.scenarioz` (or `.scenario.gz`; decide and document)
- [ ] `loadScenario` (GAME-002) extended to accept a `Uint8Array` (compressed) in
  addition to parsed JSON, using the browser's `DecompressionStream` API
  (no third-party dependency required for gzip in modern browsers)
- [ ] Format version and magic-bytes convention documented in the scenario spec
  (`thoughts/shared/decisions/2026-04-24-scenario-data-format.md`) as a note
- [ ] Format decision documented in the scenario spec as a note

**Sprint placement**: after GAME-002; before any community scenario work.
Can be deferred to Sprint 3–4 if HTTP compression satisfies v1 delivery needs.

## Notes

- Browser `DecompressionStream` (gzip) is available in all modern browsers
  (Chrome 80+, Firefox 113+, Safari 16.4+). No polyfill needed for desktop-first v1.
- If scenarios stay under ~50 KB uncompressed, plain JSON + HTTP gzip is likely
  sufficient for v1 and Part B can be deferred to whenever community scenarios land.
- Community scenario sharing (post-v1) will use the `.scenarioz` format defined here.
- Avoid MessagePack, CBOR, or other binary formats — JSON is human-readable and
  debuggable; gzip compression ratios on JSON are already very good (~70–80%).

## Resolution (2026-04-28)

**Part A resolved**: HTTP compression is sufficient for v1. Scenario JSON files
range from 19KB (tutorial-001) to 106KB (scenario-005, 2 demographic groups).
With gzip, these compress to ~3-15KB each. Any production static host
(GH Pages, Netlify, Vercel) serves gzip automatically. The dev server
(python3 http.server) doesn't, but that's acceptable for development.

**Part B deferred**: `.scenarioz` format deferred to when community scenario
sharing is implemented. No loader changes needed for v1.

**Decision**: No code changes required. HTTP gzip handles delivery; JSON stays
as the canonical format. Document this in the scenario data format spec.

## References

- Spec: `thoughts/shared/decisions/2026-04-24-scenario-data-format.md`
- Loader ticket: GAME-002
- Game vision §V1_SCOPE (scenarios bundled; community sharing post-v1)
