---
id: DESIGN-014
title: Non-partisan content framing — guidelines and content audit
area: design, content, legal
status: open
created: 2026-05-18
---

## Summary

This game's core value proposition is educational — teaching how redistricting works, not
advocating for a political outcome. That value is undermined if the scenario narratives,
resources list, or framing appear to take sides on contested legal and political questions.
This ticket defines content guidelines for presenting contested redistricting topics (VRA,
majority-minority districts, partisan gerrymandering) in a genuinely non-partisan way, and
applies them to existing content and all new scenarios in DESIGN-013.

Non-partisan framing is not the same as "both sides" framing. It means: present what courts
held, what the legal standards are, and what the genuine constitutional tensions are — without
editorializing about whether those outcomes were correct.

## Core principles

**Source standards:**
- Cite primary sources (court opinions, DOJ documents, Census Bureau data) wherever possible
- Academic and methodological sources are acceptable (Princeton Gerrymandering Project,
  MIT Election Lab, Gary King's ecological inference work, Redistricting Data Hub)
- Advocacy organization sources (Brennan Center, NAACP LDF, Heritage Foundation, etc.) should
  be removed from the about page / resources list or balanced with opposing-perspective sources
  — they are credible legally but signal partisanship to players

**Scenario narrative language:**
- "The Supreme Court held X" not "The Supreme Court wrongly held X" or "correctly held X"
- "Some argue X; others argue Y" for contested policy conclusions
- "The law currently requires X" rather than implying the law should require something different
- Describe effects factually ("this district has 48% Black voters") not normatively
  ("this district fails Black voters")
- Avoid loaded political vocabulary: "voter suppression," "rigging," "fair maps" — use the
  legal/technical terms instead

**Scenario naming:**
- Avoid names that embed a political judgment — "The Colorblind Trap" implies the colorblind
  principle is a trap, which is a contested political conclusion
- Better: descriptive names that frame the mechanic, not the outcome
  - "The 55% Problem" → acceptable (describes a legal threshold issue)
  - "The Colorblind Trap" → rename to "Drawing Without Data" or "The Proxy Problem"
  - DESIGN-013 names to be finalized per these guidelines

**The genuine tension — acknowledge it:**
The Equal Protection Clause's prohibition on racial classification and the VRA's mandate to
remedy racial discrimination in voting are both real constitutional principles with serious
jurisprudential histories. The game should surface this tension — it IS the educational
lesson — without resolving which principle is correct. A good frame: "The law has changed how
it balances these two principles over time. Here's what each approach produces in practice."

## About page / resources audit

Current about page resources list should be reviewed:
- Remove or balance any sources that are primarily advocacy organizations
- Add: primary source links (key court opinions on Oyez or Justia)
- Add: academic sources (Princeton Gerrymandering Project, Redistricting Data Hub)
- Keep or remove NAACP LDF / Brennan Center depending on whether opposing-perspective
  sources can be added alongside them; if not, replace with primary sources
- The game's own framing statement on the about page should be audited for political valence

## Scope of audit

**Existing scenarios to review:**
- Valle Verde (scenario-005): majority_minority narrative — check for loaded framing
- Harden the Map: incumbency protection framing
- Reform Map: "neutral rules" framing — "neutral" is itself a contested term in redistricting
- Any scenario where the winning condition implies a political judgment

**New content covered by this ticket:**
- DESIGN-013 scenario narratives (Scenario A and B) must comply with these guidelines
  before GAME-078 implementation begins
- Tutorial-001 / tutorial-002 overlay text (DESIGN-012) should be reviewed

## Goals / Acceptance Criteria

- [x] Content principles documented (this ticket) — reviewed and approved before use
- [x] About page resources list audited; Brennan Center + FairVote removed; replaced with Princeton Gerrymandering Project + Redistricting Data Hub (Loyola kept)
- [x] About page framing statement reviewed — no changes needed; "better questions, not predetermined answers" framing is sound
- [x] Valle Verde scenario narrative reviewed; "fairness law" → "this legal requirement" (one edit)
- [x] Reform Map narrative reviewed; "Reformers have long argued" → "Proponents of independent redistricting have long argued"
- [x] Naming guidelines applied to DESIGN-013 scenario names ("The Proxy Problem" replacing "The Colorblind Trap")
- [x] Harden the Map (scenario-006) narrative reviewed — incumbency protection framing is intentional storytelling; editorial tone reflects the character's partisan perspective appropriately; no neutrality violation; no changes needed
- [x] Tutorial-001/002 overlay text (DESIGN-012) — overlay text not yet authored; this review gate cannot be applied until DESIGN-012 content is written; deferred to the DESIGN-012 authoring phase
- [ ] All new scenario narratives (DESIGN-013) reviewed against guidelines before GAME-078 — PENDING: narratives not yet written; gate to be applied when DESIGN-013 content is authored

## References

- Research: `thoughts/shared/research/2026-05-18-vra-legal-political-landscape.md`
- DESIGN-013 — VRA scenario design (apply guidelines before authoring narratives)
- GAME-078 — VRA scenario implementation (trails this for narrative content)
- `game/web/index.html` — about page content
- LEGAL-001 — prior content risk assessment
