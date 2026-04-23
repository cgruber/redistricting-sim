---
id: AGENT-001
title: Apply $abr dollar-prefix convention to all compressed docs
area: docs, agents
status: resolved
created: 2026-04-23
---

## Summary

The `.compressed.md` convention requires that all §ABBREV key references in the body of a compressed document use the `$abr` dollar-prefix format (e.g. `$ts/tickets/` not `ts/tickets/`, `$pc` not bare `pc`). This makes abbreviation expansions unambiguous at a glance.

The following files were written without applying this convention and need a pass:

- `thoughts/shared/vision/game-vision.compressed.md` — abbreviations: `pc`, `seg`, `dist`, `FPTP`, `VRA`, `v1`
- `thoughts/shared/research/2026-04-23-agent-team-and-workflow-design.compressed.md` — abbreviations: `PM`, `GES`, `ARCH`, `WD`, `VDA`, `TDDB`, `TDDF`, `CB`, `CF`, `DR`, `EER`, `SR`, `A11Y`, `CFR`, `LR`, `BS`, `ts`, `nfr`

Exception per convention: literal tool/target names that share a prefix (e.g. `grpc_kotlin`, `ktfmt`) stay as literals. Also watch for prose words that could be mistaken for abbreviations.

## Resolution

All §ABBREV key references in both files prefixed with `$`. Merged in PR #2.
Third criterion (future files) is a standing convention, not a one-time task.

## Goals / Acceptance Criteria

- [x] All §ABBREV key references in `game-vision.compressed.md` use `$abr` format
- [x] All §ABBREV key references in `2026-04-23-agent-team-and-workflow-design.compressed.md` use `$abr` format
- [x] Any other `.compressed.md` files added in the future follow the convention from creation

## References

- Convention: `feedback_compressed_abbrev_format.md` in session memory
- Flagged by: critique agent on PR #1
