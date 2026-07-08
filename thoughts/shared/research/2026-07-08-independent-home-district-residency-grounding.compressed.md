<!--COMPRESSED v1; source:2026-07-08-independent-home-district-residency-grounding.md-->
§META
date:2026-07-08 researcher:Claude(Opus4.8)+Christian-Jackson-Gruber git_commit:ca9ddbeb302e
branch:main repo:cgruber/redistricting-sim
topic:grounding T006 home-base independent(home=running district) in real residency law
tags:[research,content,tutorial-006,independent,residency,legal,neutrality,education] status:complete

§ABBREV
T006=tutorial-006 ind=independent leg=state-legislator res=residency
office-res=must-live-in-district-to-HOLD-seat cand-res=must-live-in-district-to-FILE/RUN

§QUESTION
T006 models Dhalsim(ind) as on-ballot ONLY in district holding his home precinct(⌂); lean shows
map-wide but he can only WIN where home lands→lines decide which race he's in. Owner: "home precinct
= running district — hedge for gameplay in messier legal reality(explain that) OR validate w/ real
rules(explain that)?" → is "run where you live" real, a hedge, or both?

§VERDICT
BOTH — grounded in real law + honest simplification. Load-bearing real rule = office-holding NOT filing:
- EVERY US state requires a state leg to LIVE IN the district they REPRESENT(hold seat). Universal,
  always-true; exactly what mechanic leans on(home's district = seat you can win).
- Whether a CANDIDATE must ALREADY live there to RUN varies by state → game's "on-ballot-only-at-home"
  = simplification of office-res rule, not literal every-state candidacy rule.
- US HOUSE exception: STATE res only, NOT district (Art I §2 cl2 "Inhabitant of that State"). Mechanic
  does NOT hold for Congress; it's a state-legislature rule.
Answers both owner options: validated(state legs) AND simplified(candidacy timing varies; House looser).

§FINDINGS
1. OFFICE-RES universal: all 50 states require state leg resident of district represented. The rule
   mechanic depends on — win/hold seat only where you live; redistricting moves lines around fixed
   home = the T006 lesson.
2. CANDIDACY TIMING varies(NCSL "Legislator Qualifications"): ~13 states require district res AT
   FILING; ~37 only BY election/taking-office. Duration ≈30 days(Nevada)→a few years(Massachusetts
   longer Senate req), most cluster 1–2 yrs. WISCONSIN = clean split: need NOT live in district to be
   CANDIDATE; legal address required only by OATH-of-office → "on-ballot-only-where-you-live" NOT
   literally true everywhere = game's simplification of "must live there to HOLD seat".
3. US HOUSE: state res only(Art I §2 cl2), not district → incumbents "DRAWN OUT"/"PAIRED" when maps
   redrawn(home ends outside new lines; run elsewhere/move/retire). Same force T006 dramatises(lines
   decide which race a fixed home is in), minus a federal district-res bar.

§INGAME
One sentence added to T006 epilogue(debrief after pass), inserted BEFORE existing closing thesis(thesis
stays last line). Exact wording:
  "That home-only rule is a simplification of real law: nearly every state requires a legislator to
   live in the district they represent, so which district a home falls into decides where its candidate
   can win — the U.S. House is looser, asking only that a member live somewhere in the state."
Design choices:
- "legislator…represent" NOT "candidate…run": office-res is universal; cand-res true only ~13 states +
  false for House. Accurate always-true claim + fits mechanic(Dhalsim only WINS where home is).
- named "a simplification of real law" = owner's ask(disclose hedge + validate in one breath).
- neutral/factual/no-advocacy(DESIGN-014). States mechanism+real rule; no position on res rules.
Debrief=right surface(teaches after fact); terse map footnote(panels.ts:117 ⌂) left as-is(too small).

§REUSE
- "live in district to HOLD seat" = safe universal claim; anything stronger(must live to run/file) is
  state-specific → hedge/scope to state legs.
- US HOUSE = standing exception to district-res framings; remember for Congressional-map scenarios +
  VRA arc(federal-district territory).
- "DRAWN OUT"/"PAIRED" incumbents = real citable phenomenon mapping onto "lines decide which race a home
  is in" → candidate hook for future incumbency/line-drawing scenario.

§REFS
game/scenarios/tutorial-006.spec.yaml — mechanic(parties[dhalsim]: independent:true, home:{q:3,r:-1})
  + pedagogy header; epilogue grounding note added
game/scenarios/tutorial-006.json — generated; narrative.epilogue edited in sync
game/web/src/render/panels.ts:117 — ⌂ footnote(left as-is; too terse for legal grounding)
GAME-118 — home-base ind mechanic(on-ballot-only-at-home, home resolved per run)
GAME-121 — authored T006(first authored use of ind mechanic)
GAME-130 — this grounding note(resolves)

§SOURCES
NCSL "Legislator Qualifications" — district-res by state; ~13 at-filing vs ~37 by-election/office;
  durations ≈30 days→few yrs. Primary for candidacy-timing figures.
US Const Art I §2 cl2 — House "Inhabitant of that State"(state res only, not district).
Wisconsin(via PBS Wisconsin coverage) — candidate need NOT live in district to RUN; legal address
  required only by OATH. Illustrates candidacy-vs-office split.
Redistricting practice — incumbents "drawn out"/"paired" when lines redrawn around fixed homes.
NOTE: figures from GAME-130 research pass(WebSearch + NCSL WebFetch); re-fetch NCSL for exact per-state
  counts if formal citation needed(state rules change).
