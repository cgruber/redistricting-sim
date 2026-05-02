---
id: GAME-063
title: Asset pipeline — directory structure, Bazel integration, deployable inclusion
area: game, build, infrastructure
status: open
created: 2026-05-02
---

## Summary

Establish the asset directory structure and Bazel build integration needed to serve
character SVGs and audio clips as part of the deployed game. Currently the deployable
zip contains only HTML, CSS, JS, WASM, and scenario JSON. This ticket adds the
infrastructure that GAME-060 (sprites), GAME-061 (audio), and GAME-062 (reaction
system) depend on.

## Current State

No `assets/` directory exists. The `//web:deployable` genrule copies a fixed set of
file types. There is no mechanism to serve SVG character art or audio clips.

## Goals / Acceptance Criteria

- [ ] `game/web/assets/characters/` directory created (placeholder file acceptable)
- [ ] `game/web/assets/audio/` directory created (placeholder file acceptable)
- [ ] Bazel filegroup declared for asset files
- [ ] `//web:deployable` genrule updated to include assets in the zip under `assets/`
- [ ] `//web:e2e_test` data deps updated so asset files are available during tests
- [ ] Dev server serves assets at `/assets/characters/` and `/assets/audio/`
- [ ] Verified: `bazel build //web:deployable` produces zip with correct `assets/` subtree

## References

- `game/web/BUILD.bazel` — `deployable` genrule, `e2e_test` data deps
- `thoughts/shared/tickets/GAME-060-character-sprite-assets.md` — depends on this
- `thoughts/shared/tickets/GAME-061-audio-clips.md` — depends on this
- `thoughts/shared/tickets/GAME-062-character-reaction-system.md` — depends on this
