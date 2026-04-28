---
date: 2026-04-28
researcher: claude
repository: redistricting-sim
topic: Content presentation legal risk assessment for v1 release
tags: [legal, content, release, disclaimer]
status: complete
last_updated: 2026-04-28
last_updated_by: claude
---

# Content Presentation Legal Risk Assessment — v1 Release

## Scope

This assessment covers the v1 release of "Past the Post," an educational
redistricting simulator. It does NOT cover the future community authoring tool
(post-v1), which has a materially different risk profile.

## v1 Content Inventory

The v1 game ships with:
- 9 pre-authored scenarios + 1 tutorial (all content by project team)
- Fictional party names: Ken/Ryu (8 scenarios), Cat/Dog (1 scenario)
- Fictional region names (Clearwater County, Riverport, etc.)
- One scenario (005 Valle Verde) uses ethnicity as a demographic dimension
  (Latino/Anglo) to teach VRA concepts — no eligibility restrictions applied
- About page with explicit educational and non-partisan framing
- No user-generated content capability
- No eligibility restrictions on any demographic group in any scenario
- Open-source (MIT license anticipated)

## Risk Analysis

### 1. Partisan bias / political endorsement

**Risk level: LOW.**

The game presents redistricting from multiple perspectives: partisan operative
(scenarios 002-004, 006, 009), reform commissioner (007-008), VRA compliance
(005). No party maps to a real-world party. The about page explicitly states
the game is "not advocacy for or against any political party, position, or
reform proposal."

**Mitigation already in place**: About page framing, fictional parties, symmetric
scenario design (both parties get gerrymandering scenarios).

### 2. Racial/ethnic content sensitivity

**Risk level: LOW-MODERATE.**

Scenario 005 (Valle Verde) models a majority-minority district using
Latino/Anglo demographic groups. This directly teaches Section 2 of the Voting
Rights Act — a real law with real implications. The scenario is carefully framed:
the player is a court-appointed coordinator fixing a VRA violation, not choosing
to discriminate.

**Potential concern**: A player could interpret the scenario as trivializing the
real-world impact of VRA compliance. The narrative text addresses this explicitly
("Even compliance with a fairness law reshapes who wins and loses").

**Mitigation**: The scenario narrative provides educational context. No scenario
depicts voter suppression or eligibility restrictions.

### 3. Eligibility restrictions / discriminatory modeling

**Risk level: NONE for v1.**

The original LEGAL-001 concern was about the authoring tool allowing users to
create scenarios with arbitrary eligibility restrictions. This is entirely
post-v1. The v1 game engine supports demographic groups but has no eligibility
restriction feature in any shipped scenario.

### 4. Educational use in schools

**Risk level: LOW.**

The game is explicitly designed for secondary education and engaged adults.
Scenario narratives provide context for each exercise. The about page links to
diverse external resources. Teachers would likely present specific scenarios
with classroom discussion.

**Potential concern**: A student playing unsupervised might encounter the
bipartisan gerrymander (scenario 006) or the packing/cracking scenarios without
understanding the ethical implications. The narrative text in each scenario
addresses this, but it's not mandatory reading.

### 5. Open-source liability

**Risk level: VERY LOW.**

The MIT license (if used) includes standard disclaimer of warranty. The
open-source nature means anyone can modify the code, but the project's own
content is carefully curated. Forks that add problematic content are not the
project's responsibility.

## Recommendations

### For v1 release (required):

1. **Add a disclaimer to the about page** (alongside existing framing):
   "The scenarios in this campaign use fictional data. They do not model
   real elections, real voters, or real communities. Redistricting in practice
   is governed by federal and state law."

2. **Add a brief disclaimer to scenario-005 (Valle Verde)** intro text:
   "This scenario uses simplified demographic data to illustrate VRA concepts.
   Real-world redistricting involves far more complex demographic analysis and
   legal requirements."

3. **Choose and apply a license**: MIT or Apache 2.0. Include standard
   warranty disclaimer.

### For post-v1 (when authoring tool ships):

4. Revisit LEGAL-001 in full — the authoring tool changes the risk profile
   significantly by enabling user-generated content with arbitrary dimensions.

5. Consider: blanket disclaimer on all user-created scenarios, moderation
   policy for shared scenarios, and whether to restrict eligibility restriction
   modeling.

## Conclusion

The v1 release has low legal risk. The content is pre-authored, educational,
non-partisan, and uses fictional entities. Two small disclaimer additions
(about page + Valle Verde intro) provide adequate framing. A formal legal
review is recommended before the authoring tool ships (post-v1) but is not
blocking for v1.
