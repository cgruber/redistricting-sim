---
id: BUILD-003
title: Research optimal spawn_strategy configuration for aspect_rules_ts on macOS
area: build, typescript
status: open
created: 2026-04-25
---

## Summary

During CI bring-up (PR #46) we discovered that `aspect_rules_ts` + `--spawn_strategy=local` causes
multiple `ts_project` targets in the same Bazel package to race on shared outputs (EACCES). We
worked around this with `--strategy=TsProject=sandboxed`, but the root interaction between
`darwin-sandbox`, `aspect_rules_ts` internal copy actions, and per-package multi-target layouts
deserves documented, principled guidance.

## Current State

`.bazelrc` ci config uses:
```
build:ci --spawn_strategy=local           # avoids darwin-sandbox CopyFile/CopyDirectory failures
build:ci --strategy=TsProject=sandboxed  # avoids multi-target output races
```

This works, but was arrived at empirically. It is not clear whether:
- There are other action types beyond `TsProject` that need sandboxing
- There are known `aspect_rules_ts` recommendations for this exact scenario
- The per-package multi-target layout is itself an anti-pattern under these rules
- `--strategy=CopyFile=local --strategy=CopyDirectory=local` (with global sandboxed) would be cleaner

## Goals / Acceptance Criteria

- [ ] Review aspect_rules_ts docs/GitHub issues for guidance on spawn strategy with multi-target packages
- [ ] Identify the canonical set of action types that fail under `darwin-sandbox` on macOS
- [ ] Determine whether `--strategy=TsProject=sandboxed` is the right scalpel or if there's a better approach
- [ ] Determine if having multiple `ts_project` targets sharing a `tsconfig.json` (without per-target `include`) is an anti-pattern
- [ ] Update `.bazelrc` and/or BUILD files if a better configuration is found
- [ ] Document findings in a research doc (`thoughts/shared/research/`) so the decision is auditable

## References

- PR #46: switch spawn strategy, fix tsc compilation under local strategy
- `game/.bazelrc` — current ci config
- `game/web/src/model/BUILD.bazel` — multi-target package that triggered the race
- `game/web/src/model/tsconfig.json` — `"types": []` workaround for implicit @types discovery
