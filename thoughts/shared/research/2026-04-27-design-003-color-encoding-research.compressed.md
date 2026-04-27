<!--COMPRESSED v1; source:2026-04-27-design-003-color-encoding-research.md-->
§META
date:2026-04-27 researcher:claude(design-researcher) branch:main repo:cgruber/redistricting-sim
topic:DESIGN-003-districts-view-color-encoding status:complete
tags:ux-design,cartography,color-encoding,accessibility,game-design

§ABBREV
DRA=Dave's Redistricting App EG=efficiency-gap A=OptionA B=OptionB C=OptionC D=OptionD
WCAG=Web Content Accessibility Guidelines

§SUMMARY
Two competing data dims (district-identity+population-density) encoded in same channel
(color-lightness) degrade each other — sprint demo confirmed this empirically; Bertin+Ware
predict it. $A (flat district color, no gradient) is correct for v1: maximizes boundary
readability, simplifies colorblind-safe palette, offloads population to sidebar+tooltip where
already accessible. $C is sound architecture for later; $B+D not recommended for v1.

§FINDINGS

§F1_COGNITIVE_LOAD
Bertin visual-variables: hue→nominal(which category?) lightness→ordinal(how much?)
When both modulated on same polygon: viewer must perform conjunction search (serial, high-effort)
to answer either question. Preattentive categorical pop-out lost.
Sprint feedback ("reads as heat map") = textbook hue-lightness interference confirmation.
$B tones down gradient but does not resolve semantic ambiguity; ongoing tuning risk.
Principle: 2 independent dims → independent channels | or separate views.
For polygon fills (shape/texture/orientation limited) → view separation($C) | tooltip/sidebar.

§F2_PRECEDENTS
Redistricting tools — all use flat fills for district assignment:
  $DRA: flat hues; pop-balance in sidebar stats; partisan lean = separate overlay mode
  Districtr: flat fills; demographics in side panel
  Redistricting Game(USC 2007): flat fills; info in side panels
  DistrictBuilder: flat fills; statistics in sidebar

Strategy/sim games — assignment layer flat; quantitative data = separate toggle layer:
  Civ VI: political-map=flat hues; yield overlays=separate toggle(icons/overlay colors)
  Cities:Skylines: zone-view=flat fills; density/traffic/pollution=separate overlay modes
  XCOM tactical: terrain=flat categorical; environmental-effects=separate particle overlay

Pattern: primary-action layer = flat categorical → maximizes discriminability.
Quantitative secondary → tooltip | sidebar | deliberate overlay mode.

§F3_ACCESSIBILITY
Colorblind-safe qualitative palettes(ColorBrewer,Paul Tol) designed for uniform lightness.
Modulating lightness for density: breaks tuned hue-distances; pale hues converge for colorblind.
$A: select 1 certified 8-hue qualitative palette(e.g. ColorBrewer Set2 | Tol Bright) → holds
  throughout; no per-scenario tuning as population distribution changes.
$B: requires continuous validation that lightness range doesn't collapse hue discrimination →
  burden grows with district count.
WCAG 1.4.1: color not sole conveyor of info. Flat fills satisfy if boundaries/labels present.
  Gradient-encoded population = second info layer with no non-color backup → additional concern.

§F4_OPTION_C
Sound architecture in principle(GIS standard: ArcGIS/QGIS/Kepler use layer toggles).
Not warranted for v1 because:
  1. Population already accessible via tooltip+sidebar validity panel (2 paths)
  2. Player task ≠ continuous density monitoring; periodic balance-check → sidebar sufficient
  3. 3 view modes → UI discoverability burden; 2(Districts+Partisan) already meaningful load
  4. $A cleanly positions codebase for $C later — no technical debt from gradient approach
Natural trigger for $C: malapportionment scenario where population distribution = primary
  teaching surface (pre-Reynolds v. Sims "one person one vote"), not just balance constraint.

§RECOMMENDATION
Choose: $A — flat district color, no population encoding in Districts view.

Rationale: eliminates hue-lightness interference; aligns with all domain precedents; removes
colorblind-palette maintenance burden; no information gap (data already in tooltip+sidebar);
architecture open to $C later.

Conditions for different choice:
  $C: add when malapportionment scenario exists — population spatial reasoning = primary task
  $B: only if playtesting confirms specific player confusion tooltip+sidebar can't resolve;
      empirical confirmation required, not preemptive; lightness range ≤0.10 if adopted
  $D: not for v1 — rendering complexity, dot-size accessibility issues, sidebar already covers

§REFS
Bertin 1967/1983 Semiology of Graphics — visual variables taxonomy
Ware 2004/2013 Information Visualization — conjunction search; channel independence
ColorBrewer: colorbrewer2.org — qualitative 8-class safe palettes
Tol 2021 SRON/EPS/TN/09-002 — colorblind-safe palette sets
WCAG 2.1 SC 1.4.1 — Use of Color: w3.org/TR/WCAG21/
$DRA: davesredistricting.org — flat fills confirmed
Districtr: districtr.org — flat fills confirmed
Redistricting Game USC 2007 — flat fills in drawing mode
DistrictBuilder(Public Mapping) — flat fills + sidebar stats
Civ VI 2016 — political map flat; yield overlays separate toggle
Cities:Skylines 2015 — zone view flat; data layers separate overlay
