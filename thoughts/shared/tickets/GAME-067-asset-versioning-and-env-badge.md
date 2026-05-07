---
id: GAME-067
title: Asset URL versioning + environment version badge
area: game, build, deployment
status: open
created: 2026-05-06
---

## Summary

Static assets (PNGs, audio) are served at fixed URLs that don't change between
deploys. Browsers cache them aggressively, causing stale content to appear even
after a new deploy. This ticket adds a lightweight runtime versioning layer:
`initAssets()` fetches `deployment-metadata.json` (itself cache-busted with a
timestamp) at startup and appends `?v=<version>` to all asset URLs via
`assetUrl()`. Additionally, a small version badge is painted on screen in dev
and staging so it is always obvious which build is being tested.

## Current State

- Asset URLs are bare strings (e.g. `assets/characters/governor-wm/sheet.png`)
- No cache-busting in place; stale PNGs and audio served after deploy until
  browser cache expires
- No visible build version in dev/staging; requires polling `deployment-metadata.json`
  manually to confirm the right version is live

## Goals / Acceptance Criteria

- [x] `src/assets.ts`: `initAssets()` fetches `deployment-metadata.json?t=<now>`,
      stores version + environment; `assetUrl(path)` appends `?v=<version>`
- [x] `main.ts`: awaits `initAssets()` at the top of the async IIFE; governor
      sprite URL uses `assetUrl()`
- [x] Version badge rendered in bottom-left corner on non-production hostnames
      (dev.pastthepost.gg, staging.pastthepost.gg, localhost); hidden on production
- [x] Badge shows `<env>  <version>` in monospace, unobtrusive styling
- [x] Graceful no-op when metadata unavailable (local file server, offline);
      assets load without `?v=` suffix, no badge shown
- [ ] Audio clip URLs in `main.ts` use `assetUrl()` once GAME-061 wires audio

## Test Coverage

- [ ] e2e: version badge visible on dev hostname after page load
- [ ] e2e: asset URLs contain `?v=<version>` param when metadata available
- [ ] e2e: no badge visible on production hostname (N/A for e2e — verified manually)

## References

- `game/web/src/assets.ts` — new module
- `game/web/src/main.ts` — `initAssets()` call, `assetUrl()` usage
- `game/web/styles.css` — `#version-badge` styles
- `game/release.main.kts` — writes `deployment-metadata.json` during deploy
- `BUILD-009-content-hash-bundle.md` — longer-term CDN-safe solution (content-hashed filenames)
