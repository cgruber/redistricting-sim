<!--COMPRESSED v2; source:2026-04-27-dimensional-dot-map-design-research.md-->
§META
date:2026-04-27 researcher:claude(design-researcher) branch:main repo:cgruber/redistricting-sim
topic:dimensional-dot-map-model-design status:complete
tags:ux-design,cartography,dot-density,accessibility,color-encoding,game-design,demographic-visualization

§ABBREV
DDM=dimensional-dot-map DRA=Dave's Redistricting App
A=OptionA B=OptionB C=OptionC D=OptionD E=OptionE F=OptionF
WCAG=Web Content Accessibility Guidelines
cable=Cable-UVA-2013-racial-dot-map
TypeA=categorical-multigroup TypeB=partisan-spectrum TypeC=continuous-scalar TypeD=binary-ternary
PSM=proportional-symbol-map

§SUMMARY
NOTE: DESIGN-003 deferred dot density; subsequent design discussion adopted it as primary
population encoding — this research takes that as given.
$DDM (dot count=population, dot color=active demographic dimension, user-switchable dimension)
combines $cable encoding + Victoria3 switchable-overlay interaction — no existing tool does
all 4 simultaneously. Random dot placement within hexes is cartographic standard +
perceptually correct for aggregated precinct data. 3 encoding modes cover all dimension types:
categorical(race/party) | scalar(income/age) | count-modifier(turnout). Accessibility requires
Tol/Okabe-Ito palette discipline, tooltip-as-authoritative-source, keyboard focus on precincts.

ADDENDUM: Dot SIZE as scalar encoding investigated. Bertin identifies size as the only
inherently quantitative retinal variable; $PSM tradition (Flannery 1971) establishes it for
magnitude encoding. At 2–6px radius: ~3–4 coarse ordinal steps only (not continuous scale).
Size+color simultaneous = separable conjunction — each readable independently but not
preattentively together. Theoretically coherent dimensional-type taxonomy (categorical→color,
scalar→size, count→dotcount, lean→fill-blend) is design-team-facing, NOT self-evident to
general audiences without legend/tutorial.

Recommend $B (adaptive 3-mode taxonomy, scalar via color) + accessibility provisions from $D.
$F (bivariate size+color) deferred to v1.1; taxonomy adopted as internal design guide.

§FINDINGS

§F1_PRECEDENTS
cable: 308M dots, 5 racial groups, random placement, fixed-dimension, static — foundational;
  no dimension toggle, no interactivity beyond pan/zoom; UNIFORM dot size (size not used)
NYT-2018(Gamio): precinct dot density, D/R partisan dots, ~1dot/250votes — closest published
  precedent to partisan lean encoding; single dimension, fixed at publication; uniform dot size
WaPo: similar precinct-level partisan dot density; fixed at publication; uniform dot size

Redistricting tools — NONE use dot density:
  $DRA+Districtr+DistrictBuilder+Redistricting-Game: all flat fills; demographics in side panels

Strategy games — NO dot density; closest is Victoria3:
  Victoria3(2022): pop objects→switchable color by culture|religion|ideology on map overlays
    [KEY: exact interaction model this game needs — switch what color means — but uses bar fills]
  Civ6: flat political fills; separate yield icon overlays
  Cities:Skylines: flat zone fills; separate data overlay modes

$PSM PRIOR ART (for dot size encoding):
  Bertin 1967: SIZE is the ONLY inherently quantitative retinal variable — "more/less of
    something"; involuntary interpretation; cannot be misread as nominal/categorical
  Flannery 1971: foundational $PSM study; subjects systematically underestimate area ratios;
    correction factor: power exponent 0.5716 on radius; implemented in ArcGIS Pro
  Bivariate $PSM: size = primary variable (quantity/magnitude); color = secondary (category
    or 2nd scalar); documented in PSU GEOG486 + Axis Maps guide
  GEOG486 (PSU): size+color = "separable conjunction" — each readable independently;
    challenge: "different visual variables make multiple vars hard to directly compare"
  KEY GAP: conventional dot density maps hold dot SIZE constant — count is the magnitude.
    Variable dot size within a dot density field = hybrid of two traditions with thin precedent.
    No existing dot density map (cable, NYT, WaPo) uses variable dot size.

Academic:
  Kimerling 2009: canonical dot placement; random-within-enumeration-unit = standard
  Dorling cartograms(worldmapper.org): population-scaled area, some support switchable color dim
  Bunge 1960s: static single-dim dot maps for Detroit inequality work
  Dasymetric mapping: sub-unit informed placement (no sub-precinct spatial data available here)
  MacEachren 1995: naive users interpret visual salience holistically — "large = more important",
    not "large = older"; expert/naive gap is significant for multi-encoding designs

NOVELTY: $DDM combines (1)dot-count=population (2)dot-color=demographic-dim (3)user-switchable
color-dim (4)layered under flat district fill → no existing tool does all 4. Addendum adds
potential (5)dot-size=scalar-magnitude — hybrid with thin direct precedent; further from
established practice than elements 1–4.

§F2_DOT_PLACEMENT
RANDOM (standard):
  Kimerling + Robinson: random placement within enumeration unit = cartographic standard
  Rationale: cartographer knows precinct-total, not sub-precinct locations → random = honest
  Gestalt mixing: random intermix → additive color mixing at distance (halftone principle)
    Bayer 1973 + Ulichney 1987: random/quasi-random dithering → most accurate perceived color mix
  60/40 D/R → reads as blue scatter with red visible ← correct perceptual output
  At 300-hex scale: hex size small → dots produce color texture, not individually legible points

SORTED (clustered by group within hex):
  Equivalent to embedding micro-bar-chart in each hex
  Tufte 1983 small multiples: require sufficient size for legibility; ~40px diameter minimum
  At full-map zoom: patchwork/striped texture → reads presence/absence not proportions
    → LESS informative than random color mix
  At high zoom (few precincts visible): sorted clusters readable as proportional regions
    → only scale where sorting helps
  Spatial artifact: sorted assigns arbitrary within-precinct geography (D-side vs R-side)
    → spatial claim data does not support; breaks "individuals in space" metaphor

TOGGLE (random↔sorted):
  Prior art: thin — no established map tool implements this exact toggle
  Closest: Tableau/Observable jitter toggles; NYT dot-plot↔bar transitions (different context)
  Assessment: technically straightforward but marginal player value; game = district boundaries,
    not within-precinct proportions; tooltip+sidebar = authoritative for proportions
  If implemented: secondary control; default random; visible only when zoom shows <15 precincts

VERDICT: random = default + correct; sorted = marginal v1 value; tooltip = authoritative source

§F3_DIMENSIONAL_TYPES
4 structural types require 3 encoding modes:

$TypeA categorical-multigroup (race/ethnicity 5-7 groups, party affiliation):
  Mutually exclusive; "what fraction per group?"
  Encoding: dot color per group, proportional count within hex; dot size UNIFORM
  Limit: max 5 simultaneous hues (colorblind constraint); fold extras to "Other"

$TypeB partisan-spectrum (D/R/L/other vote shares, continuous):
  Appears categorical but has continuous-spectrum nature (D-R spread = 1-dim)
  Two-party case → existing RdBu Partisan Lean fill mode already handles lean
  Dot layer in partisan mode: adds population; use party-hue dots proportionally
  Note: RdBu fill + party dots → can double-encode; must differentiate visually

$TypeC continuous-scalar (turnout%, income, age, education):
  Single numeric per precinct; "how high/low?"
  Encoding A (color): all dots in hex same color on single-hue sequential scale
    → choropleth at dot layer; dot size UNIFORM
  Encoding B (size): dot radius varies by scalar → see §F6 for perceptual limits + tradeoffs
  Encoding C (turnout-specific): dot count = population × turnout rate → "these are the voters"
    [requires clear UI: "population mode" vs "electorate mode"]

$TypeD binary-ternary (gender, urban/rural):
  2-3 hues; educational value limited alone; gender best as compound modifier (gender×party,
  gender×turnout) → compound encoding not cleanly supported by single dot-color channel
  → defer or handle via tooltip/sidebar

3-MODE TAXONOMY (primary recommendation):
  Mode       | Dimensions          | Dot color                        | Dot size | Dot count
  -----------|---------------------|----------------------------------|----------|------------------
  Categorical | Race, party         | One hue/group, proportional      | Uniform  | = population
  Scalar      | Income, age, educ  | Single-hue sequential per hex    | Uniform  | = population
  Modifier    | Turnout             | Neutral                          | Uniform  | = pop×turnout-rate

§F4_SIDEBAR_TOOLTIP
Problem with "68%D lean":
  Collapses multi-party dist to single scalar; method unclear (2-party share? margin? all-vote?);
  hides third-party votes; omits population count; ambiguous across dimension modes

Prior art — compact multi-group proportion formats:
  Stacked horizontal bar (NYT election pages 2016–2024): proportional segment widths;
    color-consistent with map; compact vertical footprint; extends to 4-5 parties ← BEST
  Small pie: angular judgments < length (Cleveland+McGill 1984); 5+ slices → illegible at sidebar scale
  Treemap small-scale: hierarchical complexity adds noise; no benefit for flat categorical distributions
  Labeled percentage list: most screen-reader accessible; unwieldy at 7+ groups; should accompany visual

Recommended sidebar format per hover:
  1. Title: dimension name ("Partisan Lean" | "Race/Ethnicity" | "Voter Turnout")
  2. Stacked horizontal bar: colored segments ∝ group shares; colors match dot encoding
  3. % labels: show if share > 8%
  4. Population note: "Population: N" | "Voters: N (TK% turnout)"
  [For scalar dim active: single-value bar + size swatch if $F active]

Tooltip (precinct hover):
  Precinct ID + district (color swatch) + population + mini stacked bar + current dim summary

Consistency requirement: dimension switch → dots change color + sidebar bar changes → same
underlying data in both views. Dimension selector UI should visually link to sidebar legend
(shared title, shared color swatches).

§F5_ACCESSIBILITY
Challenge: 5-7 categorical dot colors at 4-8px dot size → small dots have lower perceived
saturation than large areas; carefully tuned hue distances may not transfer.
Deuteranopia (~8% male): D(blue)/R(red) fails immediately. Protanopia (~1%): similar failure.

Strategies:
  1. Palette restriction: max 5 simultaneous hues; Tol Bright | Okabe-Ito; tested under
     deuteranopia+protanopia simulation
     Partisan: shift red→orange(#E66100)/blue(#5D3A9B) — Okabe-Ito; deuteranope-safe
  2. Shape/symbol redundant: circle|square|triangle|diamond|hexagon per group (toggle-able)
     Limit: legible only if dots ≥8-10px; increases rendering complexity
  3. White 1px outline on all dots: visibility against varying district fill colors
  4. Tooltip-as-authoritative: dot layer = supplemental visual texture; tooltip+sidebar =
     authoritative data; colorblind user can ignore dot colors without info loss
     → requires tooltip keyboard-accessible (WCAG 2.4.3 Focus Order; 4.1.3 Status Messages)
  5. High-contrast mode (v1.1): shape toggle replaces | supplements hue encoding;
     black/white/pattern palette as alternative to hue-based encoding
  NOTE: dot SIZE variation (if active) is colorblind-neutral — adds info without color dependency.
    But size variation does NOT solve the color discrimination problem; it adds a second independent
    dimension, not a substitute for the color channel.

$cable acknowledged accessibility issues but provided no colorblind mode —
known unresolved gap in the primary precedent.

§F6_DOT_SIZE_ENCODING (ADDENDUM)

PRIOR ART:
  Bertin 1967: SIZE = only inherently quantitative visual variable; involuntary "more/less"
    interpretation; correct channel for scalar/ordinal magnitude
  Flannery 1971: systematic area underestimation; correction exponent 0.5716; valid for
    20-100px symbols; untested at 4-12px dot size range of this game
  Bivariate $PSM: size(magnitude) + color(category) on same symbol — documented form;
    "separable conjunction"; requires explicit dual legend; general audience challenge
  KEY GAP: no existing dot density map varies dot size — cable/NYT/WaPo all hold size constant.
    Variable-size within dot density = hybrid tradition; thin direct precedent.

PERCEPTUAL LIMITS AT 2-6px RADIUS (4-12px diameter):
  Weber fraction for area: ~6-12% area change required for reliable detection
    2px→3px radius = 2.25x area change ← above detection threshold in isolation;
      but in mixed-density dot field, signal/noise drops sharply
  Stevens power law for area: exponent ~0.7-0.87 (sublinear) → systematic underestimation;
    Flannery correction untested below 20px diameter
  Practical discriminable steps in 2-6px radius range: ~3-4 COARSE ORDINAL levels
    (small/medium/large/XL) — NOT a continuous scale
  Implication: size at this scale = ordinal gestalt encoding ("older/younger precinct")
    NOT ratio/precise magnitude encoding; legend must use qualitative ordinal labels
  Floor: below 4px diameter, dots barely legible as marks; size variation below that = imperceptible
  At 4-6px radius: 3-4 steps feasible with permanent legend establishing scale

SIZE + COLOR SIMULTANEOUS (conjunction analysis):
  Ware 2004: hue preattentive alone; size preattentive alone;
    CONJUNCTION (large red) = NOT preattentive → requires serial search
  GEOG486 / Roth 2015: size + color = SEPARABLE conjunction — each readable independently
    but NOT automatically integrated; conscious sequential effort required
  
  DESIGN INTENT MATTERS:
    If user attends to one dimension at a time (color mode | size mode) → conjunction load reduced;
      viable IF: (a) legend makes encoding unambiguous; (b) UI signals which dim is "active";
      (c) both encodings not simultaneously required as primary reading tasks
    If user expected to read both simultaneously ("find old+Black precincts") → serial search;
      will slow general audience comprehension significantly
  
  "ALWAYS VISIBLE" PROBLEM: dot size variation is always on; cannot be toggled independently.
    If size=income and color=race: when reading racial dimension, income size variation competes
    for attention → more significant practical concern than formal conjunction search
  
  ASSESSMENT: viable at coarse granularity (3-4 size steps + 5 hue categories) for users
    who understand dual encoding — NOT self-decodable at a glance; requires permanent legend
    + tutorial; general audience will conflate size variation with rendering artifact or
    population density if not explicitly instructed

DIMENSIONAL TYPE TAXONOMY (addendum framing device):
  | Type                   | Examples                    | Dot attribute       |
  |------------------------|-----------------------------|---------------------|
  | Categorical/compositional | Race, party, gender      | Dot COLOR           |
  | Scalar/magnitude       | Income, age, attainment     | Dot SIZE            |
  | Density/count          | Population                  | Dot COUNT           |
  | Spatial lean           | Partisan lean (derived)     | Color blend / fill  |

  Theoretical grounding: maps directly to Bertin retinal variables:
    hue→nominal/categorical; size→quantitative; count→density/magnitude
  COHERENCE: theoretically sound; Bertin would recognize this as faithful application
  LEARNABILITY (general audience): NOT self-evident; MacEachren 1995 — naive users interpret
    salience holistically; 3 rules to internalize (color=kind, size=intensity, count=how-many)
    exceeds what players discover without explicit instruction
  ASSESSMENT: adopt as INTERNAL DESIGN GUIDE (team consistency tool), NOT player-facing convention.
    In-game legend/tutorial must state rules in plain language, not taxonomy terms.
    Taxonomy utility: ensures consistent assignment of dims to channels as new dims added.

§OPTIONS

$A Uniform-Scatter (minimal, Cable-faithful):
  Placement: random, always; no sort; dot size UNIFORM
  Encoding: 1 mode — categorical only; continuous dims binned to 4-5 ranges; turnout→count modifier
  Sidebar: stacked bar + "N people"; tooltip: % list + count
  Accessibility: Tol Bright 5-hue max; white outlines; tooltip authoritative; no shapes
  Tradeoffs: simplest impl; continuous→bins loses information; turnout-as-count non-obvious

$B Adaptive-Encoding (3-mode taxonomy) [RECOMMENDED]:
  Placement: random, always; no sort; dot size UNIFORM
  Encoding: categorical(race/party→hue-per-group) | scalar(income/age→sequential single-hue)
             | modifier(turnout→count)
  Sidebar: categorical→stacked bar | scalar→single-value bar+endpoint labels
           | turnout→"N of M voters (TK%)"
  Tooltip: dimension-appropriate compact summary per mode
  Accessibility: Tol Bright + Okabe-Ito for categorical; Viridis|SRON-rainbow-free for scalar;
                 white outlines; keyboard-focusable tooltip

$C Uniform-Scatter-with-Sort-Toggle:
  Placement: random default; user toggle→sorted-by-group within hex; dot size UNIFORM
  Encoding: same as $A (categorical + binning)
  Sidebar: same as $A
  Accessibility: same as $A
  Tradeoffs: sort toggle useful only at high zoom; default-off; show only when <15 precincts visible

$D Adaptive-Encoding-with-Shape-Accessibility:
  Placement: random; dot size UNIFORM
  Encoding: same as $B (3-mode)
  Sidebar: same as $B
  Accessibility: full shape redundancy — each group gets unique shape in addition to hue;
    shape toggle-able via accessibility settings; high-contrast mode: shape+B&W replaces hue
  Tradeoffs: most accessible; dots need ≥8-10px for shape legibility at 300-hex scale;
    highest rendering complexity

$E Dot-Layer-as-Texture-Only:
  Placement: random; dot size UNIFORM
  Encoding: categorical with deliberately subdued color (low saturation, secondary visual weight)
    dots = "people here" (primary); dot color = "who they are" (supplemental)
  Sidebar: full stacked bar + absolute counts; sidebar = PRIMARY dimensional display
  Accessibility: low-saturation dots + high-contrast outlines; colorblind users rely on
    sidebar/tooltip; dot color not required reading
  Tradeoffs: most accessible semantically; may frustrate players who expect dot layer to carry
    more info; requires UI guidance ("dot colors show [dimension]")

$F Bivariate-Dot (size=scalar, color=categorical) [v1.1 candidate]:
  Placement: random; dot size VARIABLE by precinct-level scalar
  Encoding:
    dot color = categorical dim (race/party, hue-per-group, proportional within hex)
    dot size = scalar dim (income/age), ALL dots in hex same radius; 3-4 ordinal steps
               2px(min)→5px(max) range; Flannery correction applied
    dot count = population (as always)
  Size labels: qualitative ordinal only ("younger/older", "lower/higher income"), not numeric
  Sidebar: TWO rows: (1) categorical stacked bar (2) scalar bar/label + size swatch showing
    this precinct's dot radius; dual-legend PERMANENTLY VISIBLE
  Tooltip: explicitly states both dims ("Median income: high (large dots); Race: 45% Black…")
  Accessibility: same palette as $B; size variation = colorblind-neutral additional channel;
    dual-legend required; tooltip carries both dims for users who cannot read size variation
  Tradeoffs:
    + Theoretically most informationally dense; two dims simultaneously without mode switch
    + Bertin-coherent; $PSM tradition supports this channel assignment
    − "always visible" problem: size encoding competes with color reading even in color-mode
    − 3-4 size steps only at 2-6px range; no precision; ordinal gestalt only
    − General audience: two encoding rules simultaneously → tutorial required; not self-evident
    − Benefit mainly at medium/high zoom; subtle at 300-precinct full-map zoom
    − NOT recommended for v1. Revisit at v1.1 if: players successfully read single-channel
      encoding; scenario requires simultaneous scalar+categorical dims; dots render at ≥5px radius

§RECOMMENDATION
Choose: $B Adaptive-Encoding + accessibility provisions from $D

Rationale:
  1. Semantic accuracy: each dim type encoded in most appropriate channel; binning continuous
     dims (A/C/E) loses info + misrepresents data type
  2. Educational alignment: accurate dimensional encoding → accurate learning about demo→electoral
  3. Manageable impl: 3 rendering modes = 3 code paths; one-off-per-dim harder to maintain
  4. Sidebar consistency: 3 sidebar formats match 3 encoding modes; eliminates "68%D" ambiguity

On $F (dot size / bivariate):
  NOT recommended for v1. Barriers: perceptual limits (3-4 ordinal steps only at 2-6px);
  general audience cannot decode dual encoding without tutorial; "always visible" problem;
  Revisit at v1.1 if rendering scale + playtesting support it.

On dimensional type taxonomy:
  ADOPT as internal design guide (team consistency tool).
  NOT player-facing — in-game legend/tutorial states rules in plain language:
    "dot colors show [dimension]" | "dot sizes show [scalar]" | "dot count shows population"
  Utility: consistent channel assignment as new dims added; prevents ad-hoc one-off treatments.

Accessibility minimums:
  Tol Bright | Okabe-Ito for categorical; ≤5 simultaneous hues
  Partisan shift: red→#E66100 orange / blue→#5D3A9B
  White 1px outlines on all dots
  Tooltip keyboard-focusable; full text data in tooltip
  Doc: dot color = supplemental; tooltip+sidebar = authoritative

Conditions for different choice:
  $A: if v1 scenarios limited to party+race (both categorical) + timeline short
  $D: if player audience has significant CVD prevalence + accessibility = primary v1 req
  $E: if playtesting reveals players over-reading dot layer and ignoring sidebar
  $F: at v1.1 when rendering scale + playtesting confirm readiness for dual encoding

§REFS
Kimerling 2009 "Dotting the Dot Map Revisited" Cartographic Perspectives 64 — dot placement standard
Robinson+al 1995 Elements of Cartography 6th ed — dot density map design
Bertin 1967/1983 Semiology of Graphics — visual variables taxonomy; SIZE=only quantitative variable
Ware 2004/2013 Information Visualization — conjunction search; channel independence
Tufte 1983 Visual Display of Quantitative Information — small multiples; data density
Bayer 1973 IEEE ICASSP "Optimum Method for Two-Level Rendition" — ordered dither; dot mixing
Ulichney 1987 Digital Halftoning MIT Press — random vs ordered dithering perceptual tradeoffs
MacEachren 1995 How Maps Work Guilford Press — naive map reader behavior; holistic salience interpretation
Roth 2015 "Interactive Maps" J.Spatial Info Science — visual variable conjunctions; separability

Flannery 1971 Canadian Cartographer 8(2) — $PSM foundational study; underestimation; correction exponent
PSU GEOG486 "Multivariate Dot and Proportional Symbol Maps" courses.ems.psu.edu/geog486/node/901
  — bivariate $PSM; size+color simultaneous; separable conjunction; legend requirements
Axis Maps "Bivariate Proportional Symbols" axismaps.com/guide/bivariate-proportional-symbols
  — bivariate design guide; general audience interpretation challenge
Stevens 1957 "On the Psychophysical Law" Psychological Review 64(3) — power law; area exponent ~0.7-0.87
Cleveland+McGill 1984 JASA 79(387) — graphical perception; length > angle; area judgment accuracy
Treisman+Gelade 1980 "Feature Integration Theory" Cognitive Psychology 12(1) — conjunction search; serial vs parallel

cable: demographics.virginia.edu — one dot/person, 5 racial groups, random placement, fixed dim, UNIFORM SIZE
NYT-Gamio 2018 — precinct dot density D/R; ~1dot/250votes; closest published partisan precedent; uniform size
Victoria3(2022 Paradox): pop objects, switchable color dim (culture|religion|ideology) — key game precedent
Civ6(2016 Firaxis): political flat fills; yield overlays separate — correct layer separation
Cities:Skylines(2015 Colossal Order): zone flat fills; data overlay modes separate
$DRA: davesredistricting.org — flat fills; no dot density
Districtr: districtr.org — flat fills; demographics side panel
Redistricting Game USC 2007 — flat fills; side panels
worldmapper.org — Dorling cartograms; some switchable color dim (incomplete precedent)

Tol 2021 SRON/EPS/TN/09-002 personal.sron.nl/~pault/ — Bright+High-Contrast+Muted palettes
Okabe+Ito 2008 CUD jfly.uni-koeln.de/color/ — 8-color colorblind-safe categorical palette
ColorBrewer colorbrewer2.org — qualitative 8-class safe palettes
WCAG 2.1 SC 1.4.1(Use of Color) 2.4.3(Focus Order) 4.1.3(Status Messages) w3.org/TR/WCAG21/
Dorling 1996 Area Cartograms CATMOG 59 — population-scaled areas; channel separation concept
