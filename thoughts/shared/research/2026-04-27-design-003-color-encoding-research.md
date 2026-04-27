---
date: 2026-04-27
researcher: claude (design-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: DESIGN-003 — Districts view color encoding and population density display
tags: ux-design, cartography, color-encoding, accessibility, game-design
status: complete
---

## Summary

When two independent data dimensions — district identity and population density — are encoded
in the same visual channel (color lightness), each signal degrades the other's readability.
Sprint 1 demo feedback confirms this empirically; cartographic theory and game design precedent
both predict it. For the Districts view in v1, **Option A (flat district color, no population
encoding)** is the correct choice: it maximizes boundary readability, simplifies colorblind-safe
palette design, and offloads population data to the sidebar and tooltip where it is already
accessible and contextually appropriate.

---

## Findings

### 1. Cognitive Load and Layered Visual Encoding

Jacques Bertin's theory of visual variables (1967) classifies visual channels by the properties
they communicate most reliably. *Hue* is selective and associative — it answers "which category
does this belong to?" Lightness (value) is *ordered* — it answers "how much of this is here?"
These are semantically distinct roles. When both are modulated simultaneously on the same mark,
the viewer must perform a cognitive *conjunction search* to answer either question: to determine
district membership, they must mentally subtract the lightness variation; to read density, they
must mentally normalize across hues. Colin Ware's *Information Visualization: Perception for
Design* identifies conjunction search as an intrinsically serial, high-effort operation compared
to the preattentive pop-out that flat categorical color provides.

In the specific context of the Districts view:
- District identity is the *primary* cognitive task: players must reliably determine which
  district a precinct belongs to in order to draw and evaluate boundaries.
- Population density is *secondary* context: the player consults it for balance checking, not
  for moment-to-moment boundary decisions.

When lightness variation is added to the district hues, the map shifts from a categorical map
to an appearance resembling a choropleth or heat map. The categorical (hue) signal becomes
harder to read because hue discrimination degrades at low lightness (dark colors collapse toward
indistinguishable near-black) and at high lightness (pale pastels converge toward white). The
sprint demo feedback — "reads more as a population heat map than a district map" — is textbook
confirmation of this interference. Toning down the gradient (Option B) does not eliminate the
interference; it reduces it, but imposes ongoing tuning risk and does not resolve the semantic
ambiguity.

The general principle: when two data dimensions must be shown simultaneously, they should be
encoded in *independent* channels (e.g., hue for category, shape for secondary attribute) or
separated into distinct views. For polygon fills — where shape, texture, and orientation options
are limited — view separation (Option C) or tooltip/sidebar delegation is the standard answer.

### 2. Game Design and Cartographic Precedents

A consistent pattern emerges across all relevant precedents: primary assignment views use flat
fills; secondary quantitative data is placed in a separate layer or tooltip.

**Election redistricting tools:**

- **Dave's Redistricting App (DRA):** Districts view uses flat, distinct hues per district with
  no lightness gradient. Population balance is shown in a sidebar statistics panel, not encoded
  in the fill color. A separate "Partisan Lean" overlay uses the RdBu diverging palette —
  treated as a dedicated mode, not a simultaneous layer.
- **Districtr:** Flat colored fills for district assignment. Population and demographic data
  surface in side panels and are not encoded in the map fill.
- **The Redistricting Game (USC, 2007):** Flat district fills for the drawing view. Secondary
  information (demographic, partisan) is in side panels.
- **DistrictBuilder (Public Mapping Project):** Flat district fills; statistics in sidebar panel.

The pattern is uniform: every redistricting tool in the domain treats the district assignment
layer as flat-colored, and moves quantitative secondary data to side panels or separate overlay
modes. This is not coincidence — it reflects the same principle that the assignment view's job
is to answer "which district?" clearly.

**Strategy and simulation games:**

- **Civilization (all entries):** Political map mode uses flat hues per civilization/nation.
  Yield overlays (food/production/gold) are a separate toggle layer using icons or overlay colors
  distinct from the political fill — never blended into the political fill itself.
- **SimCity / Cities: Skylines:** Zone view (residential/commercial/industrial) uses flat colored
  fills. Density, traffic, pollution, and land value are each separate overlay modes accessed
  through a dedicated data views menu.
- **XCOM tactical maps:** Terrain types (cover, elevation) use flat categorical fills for the
  action layer; environmental effects (smoke, fire) are rendered as separate particle/overlay
  layers, not blended into the base tile color.

The structural lesson across all precedents: the *primary action layer* (the surface where the
player makes decisions) uses flat categorical color to maximize discriminability. Quantitative
secondary data is either a tooltip, a sidebar, or a separate overlay mode the player activates
deliberately.

### 3. Accessibility

Encoding two variables simultaneously in hue + lightness creates significant colorblind-safety
challenges:

- Colorblind-safe qualitative palettes (ColorBrewer, Paul Tol palettes) are designed for
  *uniform lightness*. The standard 8-class qualitative safe set (e.g., ColorBrewer `Set2` or
  `Paired`) achieves discriminability by selecting hues that remain distinguishable under
  deuteranopia, protanopia, and tritanopia — but only at the palette's designed lightness level.
- If lightness is modulated for population density, the carefully tuned hue distances no longer
  hold. A pale blue and a pale orange that are distinguishable at full saturation may converge
  toward indistinct pastels at high lightness.
- WCAG 1.4.1 (Use of Color) requires that color not be the sole means of conveying information.
  Flat district fills satisfy this if district labels or boundary lines are also present. A
  gradient fill that encodes population adds a second information layer that has *no* non-color
  backup, creating an additional WCAG concern.

Option A (flat fills) allows the team to select a single 8-hue qualitative palette (e.g.,
ColorBrewer `Set2` or Paul Tol's `Bright`) that is certified colorblind-safe, and that
palette's properties hold throughout the application. No per-scenario tuning is needed as
population distributions change. Option B requires continuous validation that the lightness
range used does not collapse hue discrimination for colorblind users — a burden that grows with
the number of districts.

### 4. Option C Viability (Third View Mode)

Option C (dedicated Population view as a third toggle) is a sound architectural decision in
principle. It achieves clean separation of concerns: Districts view is unambiguously categorical;
Population view is unambiguously quantitative. The GIS and data visualization tradition favors
this approach (ArcGIS, QGIS, Kepler.gl all use layer toggles for independent data dimensions).

For v1 of this game, however, Option C is not yet warranted. The reasons:

1. **Population data is already accessible via two other paths.** The hover tooltip provides
   per-precinct population. The sidebar validity panel shows per-district population balance
   with deviation percentages. Players who need population context have it without a mode switch.

2. **The player's task does not require continuous population monitoring.** Population balance
   is checked periodically (after drawing a block of precincts) rather than cell-by-cell. This
   is well-served by the sidebar panel, which updates continuously. Embedding it in the map is
   only valuable if the player needs to spatially reason about density in real time while
   drawing — which is a GIS analyst's workflow, not an educational game player's.

3. **Three view modes adds a UI discoverability burden.** Players must learn which mode they are
   in, why the colors changed, and how to switch back. For a game targeting a general audience,
   two modes (Districts, Partisan Lean) is already a meaningful cognitive load. A third mode
   should be deferred until there is a scenario where population distribution is a *primary*
   teaching objective, not just a constraint.

4. **Option C does not preclude adding it later.** Starting with Option A cleanly positions the
   codebase for Option C if needed. The rendering path remains flat; a population-choropleth mode
   can be added as a third toggle without any technical debt from the gradient approach.

The natural trigger for revisiting Option C: a future scenario teaching *malapportionment* (the
pre-*Reynolds v. Sims* era, "one person, one vote" violations) where population distribution is
itself the subject of manipulation. In that scenario, a Population view mode would be a primary
teaching surface, not secondary context.

---

## Recommendation

**Adopt Option A: flat district color, no population density encoding in Districts view.**

Rationale:
- Eliminates the hue-lightness interference that is causing the "heat map" misread confirmed
  in sprint feedback.
- Aligns with every redistricting tool and strategy game in the domain: assignment views are
  flat; quantitative data goes to separate panels or modes.
- Removes ongoing colorblind-palette maintenance burden: one well-chosen 8-hue qualitative
  palette works without per-scenario tuning.
- Population data is already accessible via tooltip and sidebar panel — there is no information
  gap created by removing gradient encoding.
- Leaves the architecture open to Option C later without any technical debt.

**Conditions under which a different option would be preferred:**

- **Option C** becomes worth adding when the game includes a malapportionment scenario or any
  scenario where *spatial reasoning about population distribution* is the primary player task
  (not just a balance constraint). At that point a dedicated Population mode would be a teaching
  surface, justifying its UI cost.
- **Option B** is not recommended for v1. If future playtesting reveals a specific player
  confusion ("I don't know that precincts have different populations") that tooltip + sidebar
  cannot resolve, Option B with a minimal, explicitly documented lightness range (≤0.10) could be
  reconsidered — but only after the player confusion is confirmed empirically, not preemptively.
- **Option D** (stipple overlay) is not recommended for v1. It adds rendering complexity,
  introduces its own accessibility issues (small dots are hard to distinguish at small hex size),
  and serves the same population-data purpose that the sidebar already fulfills.

---

## References

- Bertin, J. (1967/1983). *Semiology of Graphics*. University of Wisconsin Press. (Visual
  variables taxonomy: hue=nominal, lightness=ordinal/quantitative)
- Ware, C. (2004/2013). *Information Visualization: Perception for Design*. Morgan Kaufmann.
  (Conjunction search; preattentive separability; channel independence)
- Brewer, C. (2003). ColorBrewer. colorbrewer2.org. (Qualitative 8-class safe palettes for
  cartographic use)
- Tol, P. (2021). "Colour Schemes." SRON Technical Note SRON/EPS/TN/09-002. (Paul Tol's
  colorblind-safe palette sets)
- WCAG 2.1 Success Criterion 1.4.1 — Use of Color. w3.org/TR/WCAG21/
- Dave's Redistricting App: davesredistricting.org — Districts view uses flat fills; partisan
  data in separate overlay.
- Districtr: districtr.org — Flat fills for district assignment; demographics in side panel.
- The Redistricting Game (USC Annenberg, 2007): flat fills in drawing mode.
- DistrictBuilder (Public Mapping Project): flat fills; statistics in sidebar panel.
- Civilization VI (2016): Political map mode — flat hues; yield overlays as separate toggle.
- Cities: Skylines (2015): Zone view — flat fills; data layers as separate overlay modes.
