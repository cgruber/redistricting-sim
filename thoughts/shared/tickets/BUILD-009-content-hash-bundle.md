---
id: BUILD-009
title: Content-hashed bundle filenames for cache-safe deploys
area: build, deployment
status: open
created: 2026-04-30
---

## Summary

Replace the fixed `bundle.js` output filename with a content-hashed filename
(e.g. `bundle-a3f9c2.js`) so browsers and CDNs automatically invalidate stale
cached files on every deploy. The current setup uses a 30-day `max-age` on
`bundle.js` with no cache-busting, requiring users to manually clear browser
data after a new deploy.

A query-string kludge (`bundle.js?v=<version>`) was applied in `release.main.kts`
as a short-term fix (see References). This ticket tracks the proper solution.

## Current State

- esbuild outputs `bundle.js` (fixed name, configured in `web/BUILD.bazel`)
- Server (openresty/pixie-sh) sets `Cache-Control: public, max-age=2592000` on
  all `.js` files
- `index.html` hard-codes `<script src="bundle.js">`
- Result: browsers cache the old bundle for up to 30 days after a new deploy

Workaround in place: `release.main.kts` patches `index.html` at deploy time to
use `bundle.js?v=<version>`. This works as long as `index.html` itself is served
with short/no cache (currently served without explicit cache headers, so browsers
use heuristic caching — still fragile).

## Goals / Acceptance Criteria

- [ ] esbuild output renamed to `[name]-[hash].js` (esbuild `entry_names` option)
- [ ] Build step injects the hashed filename into `index.html` `<script>` tag
  (either via esbuild's HTML injection or a Bazel genrule post-processing step)
- [ ] `index.html` served with `Cache-Control: no-cache` (requires infra/server config change — coordinate with infra repo)
- [ ] `bundle-[hash].js` served with `Cache-Control: public, max-age=31536000, immutable`
- [ ] `release.main.kts` query-string kludge removed once this is in place
- [ ] e2e tests continue to pass (bundle filename change must not break test harness)

## References

- `game/web/BUILD.bazel` — esbuild target (`name = "app"`, `output = "bundle.js"`)
- `game/web/index.html` — hard-codes `<script src="bundle.js">`
- `game/release.main.kts` — deploy-time query-string kludge (search for BUILD-009)
- `thoughts/shared/tickets/DIST-001-steam-deployment-research.md` — deployment infra context
