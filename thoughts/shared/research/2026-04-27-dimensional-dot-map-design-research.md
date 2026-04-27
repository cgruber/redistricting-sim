---
date: 2026-04-27
researcher: claude (design-researcher)
branch: main
repository: cgruber/redistricting-sim
topic: Dimensional dot map model — dot density overlay design for multi-dimensional demographic encoding
tags: ux-design, cartography, dot-density, accessibility, color-encoding, game-design, demographic-visualization
status: complete
---

## Summary

*Note: DESIGN-003 (color encoding research, 2026-04-27) deferred dot density overlay to a
future version. Subsequent design discussion adopted dot density as the primary population
encoding strategy. This research takes that decision as given and focuses on how to implement
the dimensional dot map model correctly.*

The dimensional dot map model — dots within each hex precinct where count encodes population
and color encodes the active demographic dimension — has strong precedent in Cable's racial dot
map (2013) but extends it in a direction for which few direct precedents exist: user-switchable
dimensional encoding on an interactive map. Random dot placement within hexes is the standard
cartographic approach and reads well at distance; sorted/clustered placement is effectively
embedded micro-charting and breaks the population metaphor.

An addendum to this research incorporates dot SIZE as a candidate visual variable for encoding
scalar/magnitude demographic dimensions (income, age, turnout). Bertin (1967) identifies size
as the only truly quantitative visual variable, and the proportional symbol map tradition
(Flannery 1971) has decades of practice applying it. However, at the 2–6px radius range of this
game's dot rendering, size discrimination is constrained to 3–4 coarse ordinal steps, not a
continuous scale. Used simultaneously with dot color (color = categorical group membership,
size = scalar intensity), size+color creates a bivariate proportional dot layer — an established
cartographic form with known legibility tradeoffs for general audiences.

The research proposes a dimensional type taxonomy — categorical/compositional, scalar/magnitude,
density/count, spatial lean — as a visual design framing device. Each dimensional type maps to a
different dot attribute (color, size, count), which is theoretically coherent (Bertin's retinal
variables) but requires explicit in-game legend/tutorial support to be learnable by a general
audience without cartographic background.

The full system requires a small taxonomy of 2–3 encoding modes (categorical multi-group,
continuous scalar, count-modifier) that covers all demographic dimension types uniformly, rather
than one-off treatment per dimension. Accessibility for 5–7 color categorical dot schemes
requires palette discipline, shape/symbol fallback in high-contrast mode, and treating the
tooltip as the authoritative data carrier — not the dot layer.

---

## Findings

### 1. Precedents and Prior Art

#### Cable's Racial Dot Map (UVA, 2013) and Descendants

Dustin Cable's racial dot map (demographics.virginia.edu, 2013, now mirrored as
racialdotmap.demographics.virginia.edu) is the foundational reference for this encoding
strategy. Each dot represents one person; dot color encodes racial/ethnic group (White, Black,
Hispanic, Asian, Other — five values). The map renders 308 million dots over the continental
US at multiple zoom levels using tile-based rendering. At the national scale, color blending
produces a gestalt perception of regional demographic composition. At the neighborhood scale,
individual dots become legible.

Key properties of the Cable map relevant to this project:
- Fixed dimension: the map always shows race. There is no user toggle to a different dimension.
- Static (no interactivity beyond pan/zoom): the map is a visual artifact, not a game.
- Random placement within Census block: dots are placed uniformly at random within each block's
  polygon. No sorting or clustering by group within blocks.
- Dot size: uniform. All dots are the same size — size is not used as a visual variable.

**Descendants and relatives:**
- The *New York Times* 2018 map "An Extremely Detailed Map of the 2016 Election Results"
  (Gamio) uses dot density for partisan vote breakdown at the precinct level — one dot per
  ~250 votes, colored Red/Blue. This is the closest existing precedent to this project's
  partisan lean encoding: dots represent voters, color = party.
- The *Washington Post* uses similar precinct-level dot density encoding for election coverage,
  with dots colored by winning margin rather than raw vote share.
- Neither the NYT nor WaPo implementations allow switching the color dimension — each map is
  fixed at publication time. Neither uses variable dot size.

**Key gap**: no existing public tool implements user-switchable dot color dimension on an
interactive map. The dimensional dot map model is novel in that respect. None of these maps
use dot size as a variable — all hold dot size constant and vary only count and color.

#### Proportional Symbol Maps — Prior Art for Size as a Scalar Encoding

The proportional symbol map tradition is the established cartographic form for encoding
scalar/magnitude data using symbol size. Key properties and precedents:

- **Bertin (1967/1983), *Semiology of Graphics*:** Bertin's taxonomy of visual variables
  identifies SIZE as the only variable that is inherently quantitative — it can be matched
  precisely to a numerical value in a way that viewers interpret as "more/less of something."
  Hue is selective (nominal/categorical); lightness is ordered (ordinal/sequential); size is
  quantitative. This makes size the theoretically correct channel for scalar magnitude data.
  Bertin specifically notes that large symbols "look like more of something" — the interpretation
  is involuntary and difficult to override.

- **Flannery (1971)**, "The Relative Effectiveness of Some Common Graduated Point Symbols in the
  Presentation of Quantitative Data:" The foundational empirical study of proportional symbol
  maps. Subjects systematically *underestimate* the area ratio between large and small circles.
  Flannery's correction factor (power exponent 0.5716 applied to circle radius) partially
  compensates for this bias; it is still implemented in ArcGIS Pro (the "Appearance Compensation
  (Flannery)" checkbox). The implication: even in the best case, proportional size encoding is
  subject to systematic perceptual error for area judgments.

- **Bivariate proportional symbol maps:** The established form for combining size and color on a
  single point symbol. Size encodes one variable (typically quantity/magnitude); color/hue encodes
  a second variable (typically category or a second scalar). This form is documented in GEOG 486
  (PSU Cartography and Visualization course) and by Axis Maps. Standard design guidance:
  - Size communicates the primary variable; color communicates the secondary variable.
  - Legend must explicitly explain both dimensions simultaneously.
  - Interpretation challenge: "as the visual variables of size and color are quite different, this
    can make it challenging for the multiple variables on the map to be directly compared by
    readers" (Axis Maps bivariate proportional symbols guide).

**Key gap regarding dot density specifically:** In conventional dot density maps, dot SIZE is
held constant — count is the magnitude encoding. Introducing variable dot size within a dot
density map creates a hybrid of two cartographic traditions (dot density + proportional symbol)
for which there is thin direct precedent. The Cable map, the Gamio/NYT map, and all dot density
election coverage use uniform dot size. Using variable dot size in a dot density layer is a
novel extension of both traditions.

#### Election Redistricting Tools

- **Dave's Redistricting App (DRA):** Uses flat fills for district assignment; choropleth
  overlays for partisan lean. Does not use dot density for any data dimension.
- **Districtr:** Flat fills for district assignment; demographic data in side panels only. No
  dot density layer.
- **The Redistricting Game (USC Annenberg, 2007):** Flat fills; all quantitative data in side
  panels. No dot density.
- **Representable:** Similar to Districtr — flat fills, side panel demographics.

None of these tools use dot density overlays. The dimensional dot map model would be novel
among redistricting educational tools.

#### Strategy Games with Demographic Overlays

- **Civilization VI (2016):** Political map mode uses flat hues per civilization. No dot density
  for any layer. Demographic concepts (population, culture, religion) are shown as per-tile
  icons or numeric yields, never as dot density.
- **Victoria 3 (2022):** Models population as explicit "pops" (population groups with
  attributes: culture, religion, ideology, occupation). The map can show pop composition via
  colored bar overlays on provinces. No dot density — pops are abstracted to bar fills. This
  is the closest strategy-game precedent to the dimensional concept: the same underlying pop
  objects can be colored by different attributes (culture vs. religion vs. ideology). Victoria 3
  does exactly the "switch what the color means" interaction, but with bar fills, not dots.
- **Crusader Kings III (2020):** Similar to Victoria 3 — choropleth overlays switchable by
  dimension (culture, religion, development). No dot density.
- **SimCity / Cities: Skylines:** Zone view uses flat fills; data layers (traffic, pollution,
  land value) are choropleth overlays. No dot density.

**Victoria 3 is the most relevant strategy-game precedent** for the "switch what color
means" interaction, despite using bars rather than dots.

#### Academic Cartography

- **Bunge's dot density maps (1960s):** William Bunge's Detroit work placed dots representing
  individuals with attributes (income, race) to reveal spatial inequality. The method was
  static and single-dimension per map.
- **Dorling Cartograms:** Scale each area's size to population, then use color for a secondary
  attribute. Comparable to dot density in separating population (size) from a second variable
  (color). Interactive versions exist (e.g., worldmapper.org), and some allow switching the
  color dimension — a relevant but inexact precedent.
- **Dasymetric mapping:** Redistributes census data within zones using ancillary data about
  where population actually lives. Relevant to dot placement within hexes (random vs. informed),
  though this game does not have the sub-precinct spatial data to implement dasymetric methods.
- **Kimerling (2009), "Dotting the Dot Map, Revisited":** The canonical modern treatment of dot
  density map design. Establishes that random placement within enumeration units is standard and
  perceptually appropriate for the statistical aggregation that enumeration-unit data represents.
  Kimerling notes that sorted or clustered placement within units misrepresents the spatial
  randomness of individuals within those units.

#### Summary of What's Novel

The dimensional dot map model as specified combines:
1. Dot count = population (Cable)
2. Dot color = demographic dimension (Cable, fixed to race; this project generalizes)
3. User-switchable color dimension (Victoria 3's interaction model applied to dots)
4. Layered with flat district fill underneath (independent categorical channel)

The addendum adds a potential fifth element:
5. Dot size = scalar magnitude dimension (Bertin/Flannery proportional symbol tradition, applied
   to individual dots within a dot density layer — a hybrid with thin direct precedent)

No existing public tool or game implements all four of the original elements together. The
design is a coherent combination of well-understood individual techniques, but the combination
is novel. The variable-size extension (element 5) is further from established practice and
requires additional design justification.

---

### 2. Random vs. Sorted Dot Placement — Tradeoffs

#### Standard Cartographic Practice: Random

Kimerling (2009) and Robinson et al. (1995) *Elements of Cartography* establish random
placement as standard for dot density maps within enumeration units. The rationale:

1. **Epistemological honesty:** The cartographer knows that 1,400 people live in a precinct.
   The cartographer does not know *where within the precinct* they live. Random placement
   faithfully represents this uncertainty — it makes no claim about sub-precinct spatial
   distribution. Sorted placement implies that Democrats live on the left side of the precinct,
   which is a spatial claim the data does not support.

2. **Gestalt color mixing at distance:** When dots of different colors are randomly intermixed,
   the human visual system performs additive mixing at normal viewing distances. A 60/40 D/R
   precinct with randomly placed dots reads as a predominantly blue area with red visible —
   this is the intended perceptual output. This is the same mechanism that makes halftone
   printing and television pixels work. Dithering and halftone literature (Bayer 1973; Ulichney
   1987) confirm that random or quasi-random mixing produces the most accurate perceived color
   mix with the fewest visual artifacts.

3. **Scale-appropriate legibility:** At the scale of 300 hexes on a browser map, individual
   hexes are small. The dot density within each hex will produce a color texture, not
   individually legible points. Random mixing produces an accurate color texture. Sorted
   placement produces a striped or segmented texture that looks like a bar chart embedded in
   each hex — a different visual idiom that conflicts with the "individuals in space" metaphor.

#### Sorted/Clustered Placement

Sorting dots by demographic group within each hex is equivalent to embedding a micro-bar-chart
or micro-pie-chart in each hex. The technique has independent precedents:

- **Small multiples / sparklines (Tufte 1983):** Embedding miniature charts within map regions.
  Tufte advocates for small multiples but recommends sufficient size for legibility — hexes in
  a 300-precinct map are unlikely to be large enough for sorted dot clusters to be distinctly
  readable.
- **Chernoff faces, glyph maps:** Embedding data glyphs in map cells. Well-documented as
  effective only when cells are large enough to render the glyph (typically 40+ pixels diameter).

**Perceptual tradeoffs of sorted placement:**
- At zoom level showing the full map: sorted pattern produces a patchwork or striped texture
  that reads as "some precincts have two parties, some have one" — the relative proportions
  are not readable, only presence/absence. This is *less* informative than the color mix from
  random placement.
- At zoom level showing a few precincts: sorted dots become legible as proportional regions.
  This is the one scale where sorting helps legibility.
- Sorting introduces an arbitrary spatial assignment (which side is "left"?) that could be
  read as meaningful geographic variation within the precinct.

#### User-Toggleable Placement (Option C)

The prior art for toggle between random and sorted dot placement is thin. No established tool
implements this exact interaction. The closest analogues:

- **Scatterplot jitter toggles:** Some data visualization tools (Tableau, Observable Plot) allow
  toggling between jittered and non-jittered scatter layouts. The perceptual purpose is similar
  (random distribution vs. structured layout), but the context is non-geographic.
- **Dot plot to bar chart transitions:** Animated transitions between dot distributions and
  summary statistics (bar or box plots) exist in data journalism (e.g., NYT "You Draw It"
  series). These are transitions between chart types, not within a map.

**Assessment of toggle viability:** A toggle is technically straightforward but introduces UI
complexity without a clear player need. The game's educational purpose is about district
boundaries, not within-precinct demographic precision. The sorted mode serves a use case
(reading within-precinct proportions at high zoom) that is secondary to the game's core
mechanics. If implemented, it should be a secondary control (not prominent in the main UI)
and default to random.

#### Recommendation within this finding

Random placement is correct as the primary and default mode. It is perceptually accurate for
the statistical nature of the data, consistent with cartographic standards, and reads better
at the scale this game operates. Sorted mode could be offered as a zoom-dependent or
user-togglable secondary mode, but adds complexity for marginal educational benefit. The
tooltip and sidebar should be the authoritative source for within-precinct proportions —
not the dot arrangement.

---

### 3. Handling Different Dimensional Types

The game's demographic dimensions span structurally different data types that do not all
respond well to the same visual encoding. The goal is a small taxonomy of encoding modes —
ideally 2–3 — that covers the full range without one-off treatment per dimension.

#### Dimensional Type Taxonomy

**Type A — Categorical multi-group (mutually exclusive, 3–7 values)**
Examples: race/ethnicity (White, Black, Hispanic, Asian, Other), party affiliation (D, R, L,
Other), religion (if modeled).

Properties: groups are mutually exclusive; each person belongs to exactly one group; the
question is "what fraction belongs to each group?"

Encoding: Dot color per group. Each group gets a hue. Within each precinct hex, dots are
colored proportionally to group membership — a 60% White, 25% Black, 15% Hispanic precinct
places dots in those proportions with those three hues. Standard dot density map encoding.
This is the Cable racial dot map model.

Challenge: 7 simultaneous hues strains colorblind-safe palette selection (see Section 5).
Practical limit is 5 perceptually distinct, colorblind-safe hues. Dimensions with more than
5 groups should be collapsed (e.g., fold smaller groups into "Other").

**Type B — Partisan spectrum (vote shares, 2–4+ parties, continuous)**
Examples: D/R two-party vote share; D/R/L/Other multi-party share.

While partisan lean appears similar to Type A (categorical by party), its nature is different:
vote shares are proportional data, and the relevant question is "where does this precinct fall
on the partisan spectrum?" rather than "how many people belong to each party?" The two-party
case collapses to a single continuous dimension (D-R spread), for which the RdBu diverging
palette already exists as the established encoding (used in DRA, NYT, WaPo, and this game's
existing Partisan Lean view mode).

For the dot layer, partisan encoding can be treated as Type A (dot color = reported party
affiliation or vote preference) but it should be flagged that partisan lean as a continuous
spectrum is better read via the precinct fill (the existing RdBu Partisan Lean mode) than
via dot color. The dot layer in partisan mode primarily adds population information — the
fill already handles the lean.

**Type C — Continuous scalar (ordered, single dimension)**
Examples: turnout rate (0–100%), median income, median age, educational attainment.

Properties: single numeric value per precinct; no group membership; the question is "how
high or low is this value?"

Encoding option 1 (color): All dots within a precinct take the same color, and that color
reflects the precinct's scalar value on a single-hue sequential palette (e.g., light→dark).
This is equivalent to a choropleth encoded at the dot layer rather than the fill.

Encoding option 2 (size): Dot radius varies proportionally to the scalar value. A wealthier
precinct = larger dots; an older precinct = larger dots; a higher-turnout precinct = larger
dots. Dot count still represents population. This is discussed further in Section 6 (dot size
encoding).

Alternative encoding for turnout specifically: turnout affects the *number* of dots shown
rather than their color or size. A 100% turnout precinct shows all population dots; a 50%
turnout precinct shows half. This is the most natural encoding for turnout — "these are the
people who actually voted" — but requires separating the concept of "all residents" (total
dot count) from "voters" (turnout-weighted dot count), which may require two dot layers or a
clear UI toggle between population and electorate modes.

**Type D — Binary or ternary (2–3 values, not mutually exclusive)**
Examples: gender (binary or ternary if nonbinary is modeled), urban/rural classification.

Properties: each person belongs to one of 2–3 categories; the encoding challenge is that the
resulting palette is simpler but the educational relevance of showing gender alone is limited
(as noted in the brief — gender doesn't predict voting without turnout and preference data).

Encoding: Same as Type A but with 2–3 hues. For gender, if shown as a separate dimension,
this produces a dot map that reads as a sex ratio per precinct, which is a valid demographic
indicator. However, gender is likely better shown as a modifier to another dimension (e.g.,
show female turnout vs. male turnout, or partisan lean split by gender) — a compound
encoding that this v1 system cannot cleanly support with a single dot color channel.

**Practical recommendation — 3 encoding modes:**

| Mode        | Dimensional types     | Dot color                          | Dot count       |
|-------------|-----------------------|------------------------------------|-----------------|
| Categorical | Race, party, religion | One hue per group, proportional    | = population    |
| Scalar      | Turnout, income, age  | Single-hue sequential per precinct (or: neutral if size is active) | = population (or = voters for turnout) |
| Partisan    | D/R/L vote share      | Party hues per dot, proportional   | = population    |

"Partisan" is separated from "Categorical" because the existing Partisan Lean view mode
handles the lean encoding; the dot layer in partisan mode should be clearly differentiated
from the existing RdBu fill.

For dimensions that do not fit cleanly into these three modes (e.g., compound gender×party
encoding), the recommendation is to defer or handle via tooltip/sidebar rather than force
the dot layer to encode something it cannot cleanly represent.

---

### 4. Sidebar and Tooltip Consistency

#### The Problem with the Current "68% D Lean" Summary

A single-number partisan lean summary (68% D) is problematic for multiple reasons:
- It collapses a multi-party distribution to a single scalar without disclosing what it is
  measuring (two-party D share? D margin over R? D share of all votes?).
- It does not show the full distribution (if there is a 10% third-party vote, that is invisible).
- It does not indicate population (a 68% D precinct of 200 people affects a district very
  differently than a 68% D precinct of 4,000 people).
- It is ambiguous under different dimensional modes — the sidebar must show consistent
  information across all active dot modes.

#### Prior Art: Compact Multi-Group Proportion Display

**Stacked horizontal bar charts** are the standard compact format for multi-group proportions
in sidebar contexts. The New York Times election results pages (2016–2024) use stacked
horizontal bars for party vote shares at the county/state level. The format's advantages:
- Proportional area encoding — the relative widths directly represent shares.
- Color-consistent with the map — same party colors appear in bar segments and dots.
- Compact vertical footprint — a single bar row with percentage labels fits in a narrow panel.
- Extensible to 4–5 parties without losing legibility.

**Small pie charts** have known readability problems:
- Angular judgments are less accurate than length judgments (Cleveland & McGill 1984).
- At sidebar scale (typically 200–300px wide), pie charts with 5+ slices become illegible.
- Color-coding a pie chart requires the same palette as the map, which is appropriate, but
  the small size limits label placement.

**Treemaps at small scale** (sometimes used in data journalism) have similar small-size
problems — the hierarchical structure adds visual complexity without adding information for
flat categorical distributions.

**Labeled percentage lists** (e.g., "D: 52%, R: 34%, L: 8%, Other: 6%") are the most
accessible format for screen readers and keyboard users. They work well for 4–5 groups but
become unwieldy at 7+. They should be present alongside the visual encoding as text
alternatives, not as the sole format.

#### Recommended Sidebar Format

For each demographic dimension shown:
1. **Title row:** Dimension name (e.g., "Partisan Lean", "Race/Ethnicity", "Voter Turnout")
2. **Stacked horizontal bar:** One colored segment per group, widths proportional to shares;
   color matches dot encoding on map
3. **Percentage labels:** Key groups labeled directly on bar or below (threshold: show label
   if share > 8%)
4. **Population note:** "Population: N" or "Voters: N (TK% turnout)" — the absolute count
   that contextualizes the proportions

For the tooltip (on hover over a precinct):
- Precinct name/ID
- District assignment (with district color swatch)
- Population count
- The same stacked bar at smaller scale (or percentage list if bar is too small)
- Current dimension summary

This ensures that the dot layer and the sidebar/tooltip always show the same underlying
data in consistent visual form — dot proportions match bar segment widths.

#### Consistency Under Dimension Switching

When the user switches from "Partisan Lean" to "Race/Ethnicity" view:
- The dots on the map change color (party colors → racial/ethnic group colors)
- The sidebar stacked bar must change accordingly (same bar position, new segment colors
  and labels)
- The tooltip stacked bar updates to match

The dimension selector (whatever UI element controls the active dot color dimension) should
be visually linked to the sidebar — ideally, the sidebar legend and the dimension selector
are the same element or share a visual relationship (e.g., same title text, same color
swatches). This reduces the risk of the player looking at one dimension's dots while reading
another dimension's sidebar numbers.

---

### 5. Accessibility

#### The Challenge of Multi-Color Dot Schemes

Dot density maps with 5–7 categorical colors present the most demanding accessibility case
in this design. Individual dots at the rendering scale of a 300-hex map will be small (likely
4–8px diameter at normal zoom). Small colored dots are subject to:
- **Color confusion under color vision deficiency:** Deuteranopia (red-green) affects ~8% of
  male users; protanopia affects ~1%; tritanopia (blue-yellow) is rarer (~0.01%) but exists.
  A D (blue) / R (red) dot scheme fails immediately for deuteranopes and protanopes.
- **Size effects on hue perception:** Small dots have lower color saturation perceived by the
  visual system than large areas of the same hue. A palette designed for polygon fills may
  not translate to small dots — hues that are distinct at polygon scale may converge at dot
  scale.

#### Existing Multi-Color Dot Map Accessibility Strategies

Cable's racial dot map uses five colors for racial groups. The map's authors acknowledged
accessibility concerns but did not provide a colorblind mode — a known limitation of the
original. Several subsequent users have criticized it on accessibility grounds. No public
tool has solved multi-category dot density accessibility definitively.

**Strategies documented in the literature:**

**1. Palette restriction (most practical):**
Limit categorical dot encoding to 4–5 groups maximum. Use Paul Tol's "Bright" or "High
Contrast" palettes or ColorBrewer qualitative sets that are tested under deuteranopia
simulation. The 2-party partisan case (D/R) can be made colorblind-safe by shifting from
pure red/blue to orange/blue (deuteranope-safe) or using shape encoding for a second
redundant cue.

**2. Shape/symbol redundant encoding:**
Use different dot shapes (circle, square, triangle, diamond) in addition to color, one shape
per demographic group. This makes groups distinguishable without relying solely on color.
Limits: (a) small dot sizes reduce shape legibility; (b) 5–7 distinct recognizable small
shapes is at the edge of what is perceptually feasible; (c) rendering complexity increases.

**3. Pattern fills (for larger features, not dots):**
Pattern fills (hatching, stippling) are an alternative to color for area fills — well-suited
for colorblind accessibility at the precinct fill level. Not applicable to individual dots.

**4. High-contrast mode with outline dots:**
Render dots with a high-contrast border (white or black outline) to improve visibility
against varying background fill colors. The fill color of the dot encodes group; the outline
ensures the dot is visible regardless of the underlying district fill color.

**5. Opacity / density differentiation:**
For cases where only two groups need to be distinguished (e.g., D/R partisan split), use
opacity variation rather than hue — full opacity = one group, semi-transparent = the other.
Limited to two groups; does not generalize to 5+ categories.

**6. Tooltip as authoritative carrier:**
The most robust accessibility strategy: design the dot layer as *supplemental* visual
texture, not as the primary information carrier. The tooltip and sidebar carry the authoritative
data (precise percentages and counts). A user who cannot distinguish dot colors still has
full access to the data through hover interaction. This requires that the tooltip be keyboard-
accessible (focusable precincts navigable by keyboard) per WCAG 2.1 SC 4.1.3 (Status
Messages) and 2.4.3 (Focus Order).

#### Recommended Accessibility Approach

**For v1:**
1. Use Paul Tol's "Bright" 7-color palette for categorical dimensions, tested under deuteranopia
   and protanopia simulation (available at personal.sron.nl/~pault/). Limit to 5 simultaneous
   hues; fold remaining groups into "Other."
2. Partisan encoding specifically: shift from pure red/blue to orange (#E66100) / blue (#5D3A9B)
   (Okabe-Ito palette, designed for colorblind-safe categorical distinction).
3. Add white outline (1px) to all dots to ensure dot visibility against colored fills.
4. Ensure tooltip is keyboard-focusable; all dot-layer information is also available as text.
5. Document that color is supplemental — the dot layer adds visual texture; numbers in tooltip
   and sidebar are the authoritative data source.

**For a later high-contrast mode:**
- Add a shape toggle (dots become squares/triangles/circles by group)
- Offer a high-contrast palette with black/white/pattern texture encoding as an alternative
  to hue-based encoding

---

### 6. Dot Size as a Scalar Encoding — Prior Art, Perceptual Limits, and Dual Encoding

#### Framing: The Addendum Question

The addendum proposes that for scalar/magnitude demographic dimensions — median age, median
household income, turnout rate — dot SIZE (radius) may be a more natural encoding than dot
color. The intuition: a precinct with an older population gets larger dots; a wealthier precinct
gets larger dots; a high-turnout precinct gets larger dots. Dot count still represents population;
dot color can remain neutral or encode a categorical dimension simultaneously.

Three research questions:
1. Is there prior art for dot size encoding in dot density maps?
2. What are the perceptual limits of size encoding at the 2–6px radius range?
3. Can size and color be used simultaneously without creating an unworkable conjunction problem?

#### Prior Art: Proportional Symbol Maps

The proportional symbol map tradition (Flannery 1971, Robinson et al. 1995, Bertin 1967) is
the established cartographic use of size to encode scalar magnitude. Bertin identifies size
as the only visual variable that is inherently quantitative — viewers interpret it as "more/less
of something" without instruction. This is theoretically sound for scalar dimensions.

However, conventional dot density maps hold dot size constant. Size encodes nothing — count
is the magnitude channel. Cable, the Gamio/NYT maps, and all survey-linked dot density
election maps use uniform dot size. Using variable dot size *within* a dot density layer —
where count also varies — creates a hybrid of two traditions:
- Dot density: count = population
- Proportional symbol: size = attribute magnitude

This hybrid has thin direct precedent in published cartography. PSU GEOG 486 (Multivariate Dot
and Proportional Symbol Maps) documents bivariate designs that combine proportional symbol maps
with choropleth or other layers — but these typically place proportional symbols ON TOP OF
another map layer, not vary the size of individual dots within a dot density field. The
perceptual result of varying dot sizes within a density field (where a viewer must simultaneously
read "many dots here = many people" and "bigger dots here = older population") is documented
as challenging for non-expert readers.

The closest published form is the **bivariate proportional symbol map**, which sizes point
symbols by one variable and colors them by another. The Axis Maps guide on bivariate
proportional symbols notes the interpretation challenge directly: readers must decompose two
simultaneously active visual variables that operate on different channels (size → magnitude;
color → category), and this decomposition is not automatic for general audiences.

#### Perceptual Limits of Size Encoding at Small Dot Sizes

The 2–6px radius range (4–12px diameter) presents significant perceptual constraints.

**Weber's law and just-noticeable differences for area:**
Weber's law states that the minimum detectable change in a stimulus is proportional to the
baseline magnitude. For visual area, the Weber fraction is approximately 0.06–0.12 — that is,
a circle must change in area by roughly 6–12% to be reliably detected as different. At small
sizes, this means:
- A 2px radius dot has area ≈ 12.6 sq px
- A 3px radius dot has area ≈ 28.3 sq px (≈ 2.25x area change — well above detection threshold)
- But in a field of mixed-size dots under simultaneous population-count variation, the
  signal-to-noise ratio drops sharply. A viewer cannot easily separate "this dot is bigger
  (older precinct)" from "this region has more dots (denser population)."

**Stevens' power law for area:**
Stevens (1957) showed that perceived magnitude follows a power function of physical magnitude.
For visual area, the exponent is approximately 0.7–0.87 (sublinear), meaning viewers
consistently underestimate the difference between large and small areas. Flannery's (1971)
correction factor (exponent 0.5716 applied to radius) was developed specifically to compensate
for this bias in proportional circle maps. At the very small sizes in this game's dot layer
(4–12px diameter), the Flannery correction is untested — most proportional symbol research
was conducted with symbols 20–100px in diameter.

**Discriminable size steps at 2–6px radius:**
Combining Weber fraction considerations and practical rendering constraints:
- At 2px radius: a 3px radius dot is a 2.25x area increase — detectable but marginal in a
  mixed-density field.
- At 3px radius: a 5px radius dot is a 2.78x area increase — clearly larger in isolation;
  discriminable against other dots of known baseline.
- Practical discriminable steps in the 2–6px range: approximately 3–4 coarse ordinal levels
  (e.g., small/medium/large/extra-large), not a continuous scale.

**Implication:** Dot size at this scale works as a coarse ordinal encoding — "this precinct's
population skews older" reads clearly; "this precinct's median age is 52 vs. 48" does not.
This is acceptable for the educational game's purpose (gestalt impressions of demographic
distribution), but the design must not imply precision. Legend labels should use qualitative
ordinal terms ("younger / older", "lower income / higher income") rather than numeric scales.

**Minimum functional size:**
Below 4px diameter, dots become difficult to distinguish as distinct marks, and size variation
within that range is nearly imperceptible. 2px radius (4px diameter) is effectively the floor
for the entire dot layer. At 2px radius minimum, size variation from 2–4px radius (4–8px
diameter) gives approximately 2–3 discriminable steps. At 4–6px radius range, 3–4 steps
are feasible if the legend clearly establishes the scale.

#### Simultaneous Size + Color Encoding — Conjunction Search Analysis

The critical design question: if size encodes a scalar dimension (income, age) and color
simultaneously encodes a categorical dimension (race, party), does the viewer face an
unworkable conjunction search problem?

**The standard finding:** Ware (2004/2013, *Information Visualization*) establishes that hue
and size are both preattentive *individually* — a uniquely colored dot pops out from a field;
a uniquely large dot pops out from a field. However, the conjunction of the two ("find the
large red dot") is NOT preattentive — it requires serial search (Treisman & Gelade 1980,
Feature Integration Theory). This is the conjunction search problem.

**The GEOG 486 finding on separability:** PSU GEOG 486 (Multivariate Dot and Proportional
Symbol Maps) characterizes size + color value (lightness) as a "separable conjunction" —
both visual variables are dissociative (each can be analyzed independently of the other).
This means a viewer CAN read size without being confused by color, and read color without
being confused by size — but doing so requires conscious, sequential effort, not automatic
parallel processing.

**For this game's design:**

The design intent matters here. If the user is expected to switch between "viewing the color
dimension" and "viewing the size dimension" — that is, always attending to one at a time —
then the conjunction load is reduced. The viewer who is looking at racial distribution ignores
dot size; the viewer who is looking at income ignores dot color. This is workable IF:
1. The legend makes it unambiguous which channel encodes which variable.
2. The interface signals which dimension is "active" (e.g., a highlighted legend entry).
3. The two encodings are not active simultaneously as primary reading tasks.

If, however, the design intends that a viewer read BOTH at once (e.g., "find precincts where
the population is old AND predominantly Black"), the conjunction search is real and will slow
comprehension significantly for a general audience.

**The "always visible" problem:** Variable dot size is visually always present — it cannot be
toggled off without switching to a different rendering mode. If size encodes income and color
encodes race, then whenever the player is looking at the racial dimension, they also see the
income encoding (larger/smaller dots). This ambient second dimension competes for attention
and may interfere with clean reading of either dimension. This is the more significant
practical concern than the formal conjunction search problem.

**Assessment:** Size + color simultaneous encoding is viable at coarse granularity (3–4 size
steps + 5 hue categories) for a user who understands the dual encoding — but it exceeds what
can be learned at a glance by a general audience without explicit tutorial support. The legend
must be permanently visible and must simultaneously show the size scale and the color scale.
A player encountering the map cold will not know whether dot size variation is a rendering
artifact, a population density signal, or an attribute encoding.

#### Dimensional Type Taxonomy as a Visual Design Framing Device

The addendum proposes a dimensional type taxonomy as a visual design categorization:

| Dimensional type | Examples | Dot attribute |
|---|---|---|
| **Categorical/compositional** | Race, party affiliation, gender | Dot color |
| **Scalar/magnitude** | Income, age, educational attainment | Dot size |
| **Density/count** | Population | Dot count |
| **Spatial lean** | Partisan lean (derived from compositional) | Dot color blend / precinct fill |

This taxonomy maps directly to Bertin's (1967) retinal variables:
- Hue → nominal (categorical, associative, selective) — "this group vs. that group"
- Size → quantitative (ordered, proportional) — "more/less of something"
- Count (position/density) → quantitative magnitude at aggregate level

The theoretical coherence of the taxonomy is strong: Bertin would recognize it as a faithful
application of his framework. Hue for category; size for magnitude; count for quantity.

**The learnability question for a general audience:**

The taxonomy requires internalizing three rules:
1. Color = what kind of group (categorical)
2. Size = how intense/high (scalar magnitude)
3. Count = how many people (population)

These are three conceptually distinct rules, each operating on a different visual channel.
Cartographers learn this framework; general audiences typically do not have it. Research on
map reading by non-experts (MacEachren 1995, *How Maps Work*) finds that naive users interpret
visual salience holistically — a large dot is "more important," not "older" — without explicit
framing. For this game's audience (general public, educational context), the taxonomy will NOT
be self-evident from the map alone.

**Conclusion on taxonomy as framing device:** The taxonomy is visually coherent as a design
categorization — it is theoretically grounded, non-contradictory, and extensible. It is NOT
self-interpreting for a general audience. Its utility is for the design team (ensuring
consistent assignment of dimensions to channels) and for the in-game legend/tutorial (which
must explicitly teach the mapping). If the legend/tutorial adequately explains the encoding,
the taxonomy can work for players. If players encounter the map without instruction, the
simultaneous use of different dot attributes for different dimensions will create more confusion
than clarity.

**Recommendation on taxonomy:** Adopt the taxonomy as a design guide document, not as a
player-facing explanatory device. The in-game legend should express the rules in natural
language ("dot colors show racial composition; dot sizes show median income") rather than
presenting the taxonomy category names. The rules need to be stated explicitly, not implied
by visual convention alone.

---

## Options

The following options describe concrete design configurations for the full dimensional dot map
system. The original five options (A–E) are preserved; a new Option F (Bivariate Dot —
Size+Color) is added to address the addendum's dot size proposal.

---

### Option A — Uniform Scatter (Minimal, Cable-faithful)

**Dot placement:** Random within hex, always. No sorting mode.

**Dimensional encoding:**
- One encoding mode: categorical multi-group. Each dimension's values are treated as
  categorical groups with hue assignment.
- Continuous scalars (income, age) are binned into 4–5 ranges and treated as categorical.
- Turnout is treated as a scalar overlay: dot count is modulated by turnout rate (dots shown
  = population × turnout rate), not by color.
- Dot size: uniform. No size variation.

**Sidebar format:** Stacked horizontal bar (single bar, colored segments) + "N people" note.
Tooltip: percentage list (text) + population count.

**Accessibility:** Paul Tol Bright palette, 5-hue max. White dot outlines. Tooltip as
authoritative source. No shape encoding.

**Tradeoffs:** Simplest to implement; most consistent (one algorithm for all cases); but
collapses continuous dimensions into bins, losing distributional information. Turnout as
count modifier is non-obvious to players ("why are there fewer dots here?").

---

### Option B — Adaptive Encoding (3-Mode Taxonomy)

**Dot placement:** Random within hex. No sorting mode.

**Dimensional encoding (3 modes, selected automatically based on dimension type):**
- *Categorical mode:* race/ethnicity, party affiliation — dot color per group, proportional.
  Dot size: uniform.
- *Scalar mode:* income, age, educational attainment — all dots in hex same single-hue color
  on sequential scale; color encodes precinct-level scalar value. Dot size: uniform.
- *Modifier mode:* turnout — dot count reflects turnout-adjusted population; all dots same
  neutral color; the count IS the message. Dot size: uniform.

**Sidebar format:** Stacked horizontal bar for categorical; single-value bar with endpoint
labels for scalar; turnout shown as "X% turnout — N of M registered voters voted."

**Tooltip:** Dimension-appropriate compact summary (bar for categorical; number + bar
position for scalar; N/M fraction for turnout).

**Accessibility:** Paul Tol Bright palette for categorical; Viridis or single-hue sequential
(SRON rainbow-free) for scalar. White dot outlines for all modes. Tooltip keyboard-accessible.

**Tradeoffs:** Most semantically appropriate encoding per dimension type; requires implementing
3 rendering modes; player must understand mode transitions as they switch dimensions.

---

### Option C — Uniform Scatter with Sort Toggle

**Dot placement:** Random by default. User toggle (small icon in map controls) switches to
sorted-by-group placement within each hex.

**Dimensional encoding:** Same as Option A (categorical, with binning for continuous).
Dot size: uniform.

**Sidebar format:** Same as Option A.

**Accessibility:** Same as Option A.

**Tradeoffs:** Adds a UI control (sort toggle) that benefits zoom-in exploration but adds
cognitive overhead. Random mode serves 90% of gameplay; sorted mode is useful only at high
zoom for players investigating within-precinct composition. Sort toggle default-off; visible
only when zoomed in past a threshold (e.g., fewer than 15 precincts visible) to reduce
UI noise.

---

### Option D — Adaptive Encoding with Shape Accessibility Mode

**Dot placement:** Random within hex. No sorting.

**Dimensional encoding:** Same as Option B (3-mode taxonomy). Dot size: uniform.

**Sidebar format:** Same as Option B.

**Accessibility:** Full shape-encoding redundancy:
- Categorical mode: each group gets a unique shape (circle/square/triangle/diamond/hexagon)
  in addition to hue. Shape encoding toggleable via accessibility settings.
- Scalar mode: unaffected (no shape needed; single hue per precinct, all dots same shape).
- Turnout mode: unaffected (count is the encoding).
- High-contrast mode: black/white palette with shape encoding replaces hue encoding entirely.

**Tradeoffs:** Most accessible design; but shape encoding at small dot sizes (4–8px) is
marginally effective and requires careful size calibration. Rendering at the 300-hex scale
will require dots to be 8–10px minimum to make shapes distinguishable — which may be larger
than the hex can comfortably contain at full-map zoom. Implementation complexity is highest
of all options.

---

### Option E — Dot Layer as Texture Only (Minimal Semantic Load)

**Dot placement:** Random within hex.

**Dimensional encoding:** Dot color always encodes population group membership (categorical),
but color encoding is deliberately subdued (low saturation, secondary visual weight). Dots
function primarily as population texture; dimensional color is a "bonus" layer, not the
primary reading. Dot size: uniform.

The dimensional encoding is explicit in the sidebar and tooltip; the dot color is a
confirmatory visual aid, not the primary source of information. This inverts the design
emphasis: dots = "people are here" (primary); dot color = "these are the people" (secondary).

**Sidebar format:** Full stacked bar with percentage labels and absolute counts. The sidebar
is the primary dimensional display; the dot layer is visual texture.

**Accessibility:** Low-saturation dots with high-contrast outlines. Colorblind accessibility
is managed by the sidebar being authoritative (not the dot color). Colorblind users can ignore
dot colors and rely on sidebar/tooltip entirely without losing information.

**Tradeoffs:** Most accessible semantically (dot color is supplemental, not required reading).
May frustrate players who expect the dot layer to carry more information — they may not realize
there is dimensional information encoded in the dot colors. Requires clear UI guidance ("dot
colors show [dimension]") to ensure players understand the encoding is present.

---

### Option F — Bivariate Dot (Size = Scalar, Color = Categorical)

**Dot placement:** Random within hex.

**Dimensional encoding:**
- Dot color encodes a categorical dimension (race/ethnicity, party affiliation) as in
  categorical mode — one hue per group, proportional within each hex.
- Dot size encodes a scalar dimension simultaneously — all dots in a hex are scaled to the
  same radius, which reflects the precinct's scalar value (income, age, etc.) on a 3–4 step
  ordinal scale: small / medium / large / extra-large.
- Dot count encodes population as in all other options.
- The result is a bivariate dot density layer: color reads racial/party composition; size reads
  the intensity of the selected scalar attribute; count reads population.

**Size scale design:**
- Size levels: 3–4 ordinal steps, not a continuous scale (see Section 6 perceptual limits).
- Radius range: 2px (smallest) → 5px (largest) within the hex constraint.
- Flannery correction (power 0.5716) applied to radius scaling for compensation.
- Legend: permanent, simultaneous color + size legend (matrix or dual-legend layout).
- Labels: qualitative ordinal terms ("younger / older", "lower / higher income"), not numeric.

**Sidebar format:**
- Two rows: (1) categorical dimension stacked bar + (2) scalar dimension bar/label with size
  swatch showing the dot radius for this precinct.
- Population note as in other options.

**Accessibility:**
- Same palette constraints as Option B (Tol Bright / Okabe-Ito for color; ≤5 hues).
- Size variation is colorblind-neutral — it adds information not dependent on color vision.
- Dual-legend must be permanently visible; tooltip must explicitly state both dimensions
  ("Median income: high (large dots); Race: 45% Black, 30% White, 25% Hispanic").
- Players who cannot read size variation reliably still have full data in tooltip/sidebar.

**Tradeoffs:**
- Theoretically the most informationally dense option — two demographic dimensions active
  simultaneously without a mode switch.
- Requires internalizing two simultaneous encoding rules (color = category, size = magnitude),
  which is documented as non-trivial for general audiences without tutorial support.
- The "always visible" problem: size encoding is always on; even when reading the color
  dimension, size variation competes for attention.
- At small hex sizes (300 precincts, full-map zoom), dot size variation at 2–5px is subtle;
  benefit accrues mainly at medium-to-high zoom levels.
- Not recommended as a v1 starting point. Best evaluated after v1 playtesting reveals whether
  players successfully read single-channel dot encoding; if so, dual-channel may be a v1.1
  enhancement.
- Conjunction search: color + size is a separable conjunction (per GEOG 486 / Roth 2015) —
  each channel can be read independently but not preattentively together. This is workable but
  requires explicit in-game legend support.

---

## Recommendation

**Adopt Option B — Adaptive Encoding (3-Mode Taxonomy)** as the design target, with
accessibility provisions borrowed from Option D.

**Rationale:**

1. **Semantic accuracy.** Each dimensional type (categorical, scalar, turnout modifier) is
   encoded in the visual channel most appropriate to its data structure. Binning continuous
   data into fake categories (Options A, C) loses information and misrepresents the data type.
   A stacked bar that shows "Income: $40K–$60K (most common)" is less accurate and less
   educational than a dot layer that encodes income as a sequential color scale per precinct.

2. **Consistency with stated educational goals.** The game aims to teach how demographic
   composition affects electoral outcomes. Accurate encoding of dimensional types supports
   accurate understanding. Approximate encoding (binning, fake categories) risks teaching
   the wrong lessons.

3. **Manageable implementation scope.** Three rendering modes (categorical, scalar, modifier)
   map cleanly to 3 rendering code paths. Each mode is well-defined and can be implemented
   independently. The alternative (one-off encoding per dimension) is harder to maintain as
   dimensions are added.

4. **Sidebar consistency.** Option B's three sidebar formats (stacked bar for categorical,
   single-value bar for scalar, N/M fraction for turnout) are dimension-appropriate and
   avoid the "68% D lean" ambiguity problem by showing full distributions.

**On dot size (Option F):** Option F is not recommended for v1, but it is a coherent and
theoretically grounded extension. The dimensional type taxonomy (categorical → color; scalar
→ size; count → dot count; partisan lean → fill blend) is well-supported by Bertin's retinal
variable framework and by the proportional symbol map tradition. The barriers to v1 adoption are:
- Perceptual limits at 2–6px radius constrain size to 3–4 ordinal steps; precise magnitude
  reading is not achievable at this rendering scale.
- General audiences cannot decode dual dot encoding (size + color simultaneously) without
  explicit tutorial instruction; this is a UI/UX burden that exceeds v1 scope.
- The "always visible" problem: size encoding competes with color reading even when the player
  is attending to the color dimension.

Option F should be revisited at v1.1 if: (a) playtesting shows players successfully reading
single-channel dot encoding and asking for more information density; (b) a specific scenario
requires a scalar dimension (e.g., income or age) and a categorical dimension (e.g., race) to
be readable simultaneously to understand the educational point; (c) rendering resolution
permits dots at 5–8px radius at normal zoom.

**On the dimensional type taxonomy:** The taxonomy (categorical → color; scalar → size;
count → dot count; lean → fill blend) is adopted as an internal design guide. It should not
be presented as player-facing terminology. In-game legends and tutorial text should express
the rules in plain language: "dot colors show [dimension]", "dot sizes show [scalar]",
"dot count shows population." The taxonomy is a consistency tool for the design team, not a
self-explanatory visual convention for players.

**Accessibility conditions:**
- Use Paul Tol Bright or Okabe-Ito palettes for categorical; limit to 5 simultaneous hues.
- Add white 1px outlines to all dots.
- Add shape-encoding as an accessibility mode (can be a v1.1 enhancement).
- Ensure tooltip is keyboard-focusable and carries full text data.
- Treat dot color as supplemental, not sole carrier — document this in UI tooltip help text.

**Conditions under which a different option is preferred:**
- **Option A** is appropriate if implementation timeline is short and dimensional variety in
  v1 scenarios is limited to party and race (both categorical). Binning continuous data is
  acceptable if continuous scalar dimensions are not in v1 scenarios.
- **Option D** is preferable to Option B if the game's player audience includes users with
  significant color vision deficiency and accessibility is a primary v1 requirement. The shape
  encoding overhead is justified if the target audience requires it.
- **Option E** is appropriate if playtesting reveals that players are over-reading the dot
  layer and ignoring the sidebar — shifting the semantic weight to the sidebar would correct
  this. It should not be the starting choice, but could be a simplification if needed.
- **Option F** is appropriate at v1.1 or later, specifically for scenarios requiring two
  simultaneous demographic dimensions; requires tutorial/legend support and rendering at
  sufficient zoom to make 3–4 size steps discriminable.

---

## References

**Cartographic theory and dot density:**
- Kimerling, A.J. (2009). "Dotting the Dot Map, Revisited." *Cartographic Perspectives*, 64.
  — Canonical treatment of dot placement algorithms; random vs. non-random placement.
- Robinson, A., Morrison, J., Muehrcke, P., Kimerling, A.J., & Guptill, S. (1995).
  *Elements of Cartography* (6th ed.). Wiley. — Standard cartographic dot density map design.
- Bertin, J. (1967/1983). *Semiology of Graphics*. University of Wisconsin Press.
  — Visual variables taxonomy; hue=nominal, lightness=ordinal/quantitative, size=quantitative;
  size is the only variable inherently interpretable as a ratio/magnitude.
- Ware, C. (2004/2013). *Information Visualization: Perception for Design*. Morgan Kaufmann.
  — Conjunction search; preattentive separability; channel independence.
- Tufte, E. (1983). *The Visual Display of Quantitative Information*. Graphics Press.
  — Small multiples; sparklines; data density principles.
- MacEachren, A. (1995). *How Maps Work: Representation, Visualization, and Design*.
  Guilford Press. — Map reading by non-experts; naive vs. expert user interpretation.
- Roth, R.E. (2015). "Interactive Maps: What We Know and What We Need to Know."
  *Journal of Spatial Information Science*. — Visual variable conjunctions and separability.

**Proportional symbol maps and size encoding:**
- Flannery, J.J. (1971). "The Relative Effectiveness of Some Common Graduated Point Symbols
  in the Presentation of Quantitative Data." *The Canadian Cartographer*, 8(2), 96–109.
  — Foundational empirical study; systematic underestimation of circle area; Flannery correction
  factor (exponent 0.5716); relevant to size-encoded dot design.
- PSU GEOG 486 Cartography and Visualization, "Multivariate Dot and Proportional Symbol Maps."
  courses.ems.psu.edu/geog486/node/901 — Bivariate proportional symbol map design; size +
  color simultaneous encoding; separable conjunction; legend design requirements.
- Axis Maps, "Bivariate Proportional Symbols." axismaps.com/guide/bivariate-proportional-symbols
  — Practical bivariate design guidance; interpretation challenge for general audiences.

**Perceptual limits:**
- Stevens, S.S. (1957). "On the Psychophysical Law." *Psychological Review*, 64(3), 153–181.
  — Power law for perceived magnitude; area exponent ~0.7–0.87 (sublinear).
- Cleveland, W.S. & McGill, R. (1984). "Graphical Perception." *JASA*, 79(387).
  — Accuracy of different visual encodings; length > angle (bars > pies); area judgment accuracy.
- Treisman, A. & Gelade, G. (1980). "A Feature Integration Theory of Attention."
  *Cognitive Psychology*, 12(1), 97–136. — Conjunction search; preattentive features vs.
  conjunction targets; serial vs. parallel search.

**Dot density map precedents:**
- Cable, D. (2013). "The Racial Dot Map." Weldon Cooper Center for Public Service, UVA.
  demographics.virginia.edu — foundational dot density demographic map; one dot per person,
  five racial group colors, random placement within Census block; uniform dot size.
- Gamio, L. (2018). "An Extremely Detailed Map of the 2016 Election Results." *New York Times*.
  — Precinct-level dot density for partisan vote breakdown; closest published precedent to
  partisan lean encoding in this game; uniform dot size.

**Game design precedents:**
- Victoria 3 (2022). Paradox Interactive. — Switchable demographic overlay dimension (culture/
  religion/ideology) on the same underlying "pop" objects; closest game precedent to
  user-switchable dot color dimension.
- Civilization VI (2016). Firaxis / 2K Games. — Political map flat fills; separate yield
  overlays; example of correct primary/secondary layer separation.
- Cities: Skylines (2015). Colossal Order / Paradox Interactive. — Zone view flat fills;
  separate overlay modes for quantitative data.

**Election redistricting tools:**
- Dave's Redistricting App: davesredistricting.org — flat fills; no dot density.
- Districtr: districtr.org — flat fills; demographics in side panel.
- The Redistricting Game (USC Annenberg, 2007) — flat fills; side panels.

**Color accessibility:**
- Tol, P. (2021). "Colour Schemes." SRON Technical Note SRON/EPS/TN/09-002.
  personal.sron.nl/~pault/ — Paul Tol palettes (Bright, High Contrast, Muted).
- Okabe, M. & Ito, K. (2008). "Color Universal Design (CUD)." jfly.uni-koeln.de/color/
  — Okabe-Ito 8-color palette for colorblind-safe categorical encoding.
- Brewer, C. (2003). ColorBrewer. colorbrewer2.org — Qualitative 8-class safe palettes.
- WCAG 2.1 SC 1.4.1 — Use of Color; 2.4.3 — Focus Order; 4.1.3 — Status Messages.
  w3.org/TR/WCAG21/

**Halftone and dithering (dot mixing theory):**
- Bayer, B.E. (1973). "An Optimum Method for Two-Level Rendition of Continuous-Tone Pictures."
  *IEEE ICASSP*. — Ordered dither; basis for understanding color mixing via dot patterns.
- Ulichney, R. (1987). *Digital Halftoning*. MIT Press. — Comprehensive treatment of dot
  pattern perception; random vs. ordered dithering perceptual tradeoffs.

**Dorling cartograms:**
- Dorling, D. (1996). *Area Cartograms: Their Use and Creation.* CATMOG 59.
  — Population-scaled area cartograms; comparable channel separation to dot density.
- worldmapper.org — Interactive Dorling cartogram tool with switchable data dimensions.
