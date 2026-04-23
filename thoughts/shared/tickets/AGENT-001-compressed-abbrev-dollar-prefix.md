---
id: AGENT-001
title: Apply $abr dollar-prefix convention to all compressed docs
area: docs, agents
status: open
created: 2026-04-23
---

## Summary

The `.compressed.md` convention requires that all §ABBREV key references in the body of a compressed document use the `$abr` dollar-prefix format (e.g. `$ts/tickets/` not `ts/tickets/`, `$pc` not bare `pc`). This makes abbreviation expansions unambiguous at a glance.

The following files were written without applying this convention and need a pass:

- `thoughts/shared/vision/game-vision.compressed.md` — abbreviations: `pc`, `seg`, `dist`, `FPTP`, `VRA`, `v1`
- `thoughts/shared/research/2026-04-23-agent-team-and-workflow-design.compressed.md` — abbreviations: `PM`, `GES`, `ARCH`, `WD`, `VDA`, `TDDB`, `TDDF`, `CB`, `CF`, `DR`, `EER`, `SR`, `A11Y`, `CFR`, `LR`, `BS`, `ts`, `nfr`

Exception per convention: literal tool/target names that share a prefix (e.g. `grpc_kotlin`, `ktfmt`) stay as literals. Also watch for prose words that could be mistaken for abbreviations.

## Current State

Both files use bare abbreviation names in their bodies. Functionally correct but not convention-compliant.

## Goals / Acceptance Criteria

- [ ] All §ABBREV key references in `game-vision.compressed.md` use `$abr` format
- [ ] All §ABBREV key references in `2026-04-23-agent-team-and-workflow-design.compressed.md` use `$abr` format
- [ ] Any other `.compressed.md` files added in the future follow the convention from creation

## References

- Convention: `feedback_compressed_abbrev_format.md` in session memory
- Flagged by: critique agent on PR #1
