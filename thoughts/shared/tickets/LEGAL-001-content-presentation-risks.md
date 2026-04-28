---
id: LEGAL-001
title: Content presentation legal risk research
area: legal, content, presentation
status: resolved
created: 2026-04-24
---

## Summary

The demographic group model (see ADR `decisions/2026-04-24-demographic-group-model.md`)
deliberately gives the simulation engine no vocabulary for demographic dimensions and
no restriction on which dimensions may carry voter eligibility restrictions. Content
guidance is delegated to the authoring tool, which can warn on specific recognized
dimension names.

This raises a legal and reputational question that requires domain expertise:

> Does the game's failure to warn — or inability to warn — when an unrecognized
> dimension name is used to restrict voter eligibility constitute accidental
> endorsement of discriminatory practices? Does partial warning coverage (known
> dimensions warned; unknown dimensions silent) create worse liability than either
> warning on everything or warning on nothing?

## Current State

Not researched. Decision deferred at time of ADR authoring.

## Goals / Acceptance Criteria

- [ ] Consult with a lawyer or legal advisor familiar with educational software,
      election law, and content liability
- [ ] Determine whether blanket disclaimer language ("this simulator may be used
      to model illegal or hypothetical scenarios; the game does not endorse any
      depicted restriction of voting rights") is sufficient
- [ ] Determine whether partial-coverage warnings (known bad dimensions) create
      greater liability than blanket disclaimers
- [ ] Determine whether open-source status affects liability exposure
- [ ] Produce a recommendation: blanket disclaimer only / partial warnings + disclaimer /
      full vocabulary required / other
- [ ] If recommendation requires engine changes, open a follow-up implementation ticket

## Context

- The authoring tool (post-v1) will warn on recognized dimension names when used with
  eligibility restrictions (e.g., `race`, `gender`, `religion`)
- Unrecognized dimension names (e.g., `hive_affiliation`, or `ethnicity` spelled
  differently) receive no special treatment
- The game's own pre-built scenarios do not use eligibility restrictions on legally
  protected classes
- The project is open-source; hardcoded vocabulary restrictions are circumventable

## References

- ADR: `thoughts/shared/decisions/2026-04-24-demographic-group-model.md`
- Game vision: `thoughts/shared/vision/game-vision.md` (§Political Neutrality and Framing)
