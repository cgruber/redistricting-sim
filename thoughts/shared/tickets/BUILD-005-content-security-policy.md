---
id: BUILD-005
title: Content Security Policy meta tag for production
area: build, security
status: open
created: 2026-04-27
---

## Summary

Add a CSP meta tag to `game/web/index.html` to harden against XSS and
injection in production deploys. The game is a pure static SPA with no
external fetches, so a restrictive CSP is straightforward.

## Current State

No CSP. The game serves from static hosting (local dev server, future
GH Pages/Netlify). All scripts are same-origin; WASM loaded locally;
no CDN dependencies.

## Goals / Acceptance Criteria

- [ ] Add `<meta http-equiv="Content-Security-Policy">` to index.html `<head>`
- [ ] Policy: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src data: blob:; connect-src 'self'; base-uri 'self'; form-action 'self'`
- [ ] `'unsafe-inline'` for styles is temporary — remove after BUILD-006 extracts styles
- [ ] No console CSP errors in dev tools on any scenario
- [ ] e2e smoke test: page loads without CSP violations

## Notes

- `'wasm-unsafe-eval'` required for wasm-bindgen WASM execution
- `'unsafe-inline'` for styles stays until BUILD-006 extracts inline `<style>` to CSS file
- SRI (subresource integrity) deferred — Bazel rebuilds change hashes each build, making
  static SRI attributes impractical without build-time hash injection

## References

- TRIAGE-001 security analysis (2026-04-27)
- BUILD-006 — extract inline styles (enables dropping `'unsafe-inline'`)
