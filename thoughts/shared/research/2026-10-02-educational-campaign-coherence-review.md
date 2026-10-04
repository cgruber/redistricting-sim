---
date: 2026-10-02
researcher: agent (owner-requested pre-playtest review)
git_commit: d50cdbd8 (main + PR #343 head)
branch: edu-campaign-review
repository: cgruber/redistricting-sim
topic: Holistic coherence and quality review of the Educational Campaign (pre-playtest)
tags: [educational-campaign, content, narrative, neutrality, ux, playtest]
status: complete
last_updated: 2026-10-02
last_updated_by: agent
---

# Educational Campaign — Coherence & Quality Review (pre-playtest)

## Purpose and method

The owner is stepping back from playtesting for a while and asked for a holistic pass over the
Educational Campaign: does it hang together as a curriculum, and are there quality problems that
would otherwise only surface in playtest? The brief was explicit: catch what would slip into
playtest, **don't invent problems**.

Method:

- Read every player-facing string in the nine educational scenarios (motivation, intro slides,
  objective, criterion descriptions), the wrap-up screen, and the About page.
- Clicked every intro briefing at desktop (1280×720) and phone (375×812) sizes on `serve-local`.
- Ran the e2e "compact" assignments for scenario-007 and scenario-008 in the browser and read the
  result screen.
- Reproduced the end-of-campaign flow for the tutorial campaign.
- Checked existing tickets (GAME-078, GAME-113, GAME-123, DESIGN-014) so already-tracked issues
  aren't re-reported.

Each finding below is tagged **verified** (reproduced or read directly) or **judgment** (an
editorial call, stated with the yardstick it is measured against so it can be rejected quickly).

Campaign order (from `game/web/src/model/campaigns.ts`): 002 → 003 → 004 → 005 (Valle Verde) →
010 (Vera County) → 006 → 007 → 008 → 009.

## Tier 1 — Fixed in this pass (PR #343)

1. **Intro briefing controls unreachable when the card is taller than the viewport** — verified,
   fixed, regression-tested. `#intro-screen` centered its card with `align-items: center` while
   `body` is `overflow: hidden`, so a tall card overflowed both edges and the Next/Start button
   could sit off-screen with no way to scroll. Measured overflow of the nav button:
   - 1280×720: scenario-010 slide 3 (36px).
   - 375×812: scenario-005 slide 3 (69px), scenario-008 (6–7px), scenario-010 every slide
     (49 / 29 / 240 / 14px).
   Fix: the card centers via `margin: auto` and the screen scrolls (`game/web/styles.css`,
   `#intro-screen` / `#intro-card` / `#btn-intro-skip`). Skip is `position: fixed` with an opaque
   backing in the screen's color, so on phones scrolling text passes beneath it rather than
   colliding with the label (checked at 375×812 on 010 slide 3, top and mid-scroll; desktop
   unchanged). New e2e at 375×812 clicks through all of
   scenario-010's slides (`game/web/e2e/scenarios.spec.ts`, "intro briefing: on a phone-sized
   viewport…"); it was confirmed red without the fix and green with it.
2. **Stale test names/comments** — verified, fixed. The scenario-005 smoke test was still named for
   the "VRA character" after Valle Verde stopped naming the VRA; the scenario-007 winnability
   comment cited the wrong tolerance and threshold.
3. **Valle Verde / Vera County narrative pass** (owner-directed): Valle Verde no longer names the
   VRA; Vera County gains the callback and the "plays out as if the fight were already won"
   caveat.

## Tier 2 — Verified bug, not yet fixed (GAME-131)

### Tutorial completion shows the educational wrap-up

**Verified on `serve-local`.** Load `?s=tutorial-006&campaign=tutorial&debug`, force-win, Continue,
then "Next Scenario →". The wrap-up screen appears with:

> You've completed every scenario. You've drawn maps that packed voters, cracked communities,
> protected incumbents, satisfied reformers, and proven that no set of rules can make
> redistricting apolitical.

Cause: `goToNextScenario()` (`game/web/src/main.ts:1880`) shows the single static
`#wrap-up-screen` (`game/web/index.html:140`) whenever the active campaign list runs out, and that
copy was written for the educational arc. **Beta is affected per the deployed build** (not
clicked through on beta itself): beta serves v0.0.17 (`beta/deployment-metadata.json` on
`web_deploy`), whose `campaigns.ts` has the tutorial ungated with tutorial-006 last, whose
deployed `index.html` carries the same wrap-up text, and whose `main.ts` differs from current main
by one unrelated line. A tutorial graduate has done none of those things, and "every scenario" is false while the
educational campaign shows as coming soon.

The wrap-up copy has two further problems even for the educational campaign it was written for:

- It predates the VRA arc (005 / 010) and doesn't mention it.
- **Judgment:** "proven that no set of rules can make redistricting apolitical" states a contested
  conclusion. Yardsticks: the About page promises "better questions, not predetermined answers",
  and DESIGN-014's "Some argue X; others argue Y" for contested policy conclusions.

Needs an owner copy decision (per-campaign wrap-up text, and what the educational one should say),
so it is ticketed rather than fixed here.

## Tier 3 — Structural observations for the owner's call

These are not bugs. Each is something a playtester would likely notice; whether it is a problem is
a design call.

### 3.1 Only one of nine educational scenarios has a debrief

All six tutorials have a win-screen epilogue (the GAME-094 "teaching debrief"). Of the nine
educational scenarios only scenario-002 has one, so eight end on a pass/fail screen with no
reflection. The GAME-078 plan (`thoughts/shared/plans/2026-07-09-game-078-vra-arc.md:172`) makes
the debrief the place to "hand the value-debate to the player" for the VRA scenarios; the same
logic arguably applies to every scenario that ends on a contested question (006, 007/008).
(Vera County's both-sides epilogue is already tracked as GAME-078 Increment 2.) Verified: counted
from the scenario JSONs.

### 3.2 Scenarios 007 and 008 teach the same lesson back to back

Verified text overlap:

- Both: independent commission, "No partisan data allowed", compact + equal population +
  contiguous, both prompted by a court order.
- 007 slide 3: "Neutral rules don't produce neutral outcomes. They produce different outcomes." /
  "It's not a bug in your map — it's a feature of where people live."
- 008 slide 2: "neutral rules don't produce neutral outcomes. They produce outcomes driven by
  geography." / slide 3: "This is not a bug in your map. It's a feature of representative
  democracy that no one has solved."

The maps differ (Ken 50.4% of the vote in 007, 60.9% in 008). Running each scenario's e2e compact
assignment: 007 passed with efficiency gap 9.1% (Ryu disadvantaged) — inside its optional ≤15%
bonus; 008 passed with efficiency gap 28.3% (Ryu disadvantaged) — failing its optional ≤10% bonus.
On efficiency gap alone, 008 demonstrates the geography effect strongly and 007 only weakly. Seat
counts were not read, and one assignment per map is not a distribution.

Options (owner call): merge them, or differentiate 007 (e.g. make it the "neutral map looks fine
here" control and 008 the "same rules, lopsided geography" contrast — which the numbers already
roughly support, but the text doesn't say).

### 3.3 008's narrative has Ken complaining despite a ~61% vote share

Verified text, slide 3: "Ryu will say the compact map packed their voters unfairly. Ken will say
their geographic spread deserves more representation. Both arguments will have merit." On the
compact map measured above, Ken is the party *advantaged* by the efficiency gap; a playtester who
looks at the result may find Ken's complaint doesn't match what they see.

### 3.4 "No partisan data allowed" is not enforced in 007/008

Both say it (007's objective: "No partisan data required — or allowed."), but the partisan-lean
view and election results remain available. Per-scenario flags already exist
(`hide_view_toolbar`, `hide_election_results`; tutorial-001 uses them). Enforcing would be a
gameplay change, so owner call. Verified: flags exist and are unset for 007/008.

### 3.5 Scenarios 002 and 003 both teach packing back to back

Weaker overlap than 3.2 — 003 adds the efficiency gap as a measure. Noted only because a
playtester moving 002 → 003 may feel déjà vu. Judgment.

### 3.6 The player always gerrymanders for Ken in the partisan scenarios

**Judgment.** In 002, 003 and 004 the player draws for Ken (rural/suburban) against Ryu (urban).
Only 009 (Cats vs Dogs, comic skin) puts the player on the urban-majority side. Ken and Ryu are
fictional, but the rural/urban split maps onto real partisan geography, so a player may read a
pattern: one side is always the one doing the gerrymandering. Yardstick: DESIGN-014's aim that
content not "appear to take sides". Cheapest mitigation would be swapping the instigating party in
one of 002–004; GAME-123 (partisan realism tuning) is adjacent but doesn't cover this.

### 3.7 Loaded wording

**Judgment**, measured against DESIGN-014 "Scenario narrative language":

- 008 objective: "Watch both sides declare the process rigged." DESIGN-014 lists "rigging" by name
  as loaded vocabulary to avoid. It's the parties' characterization rather than the narrator's,
  but it's in the objective line.
- 006 motivation: "The voters don't need to know the details." Editorializes the deal as
  deceptive.
- 006 slide 3 "What the Voters Lose" gives only the case against safe seats (primaries, lost
  accountability). DESIGN-014: "Some argue X; others argue Y." The usual counter-arguments
  (stability, seniority, constituent service, fewer wasted votes per district) are absent.

## Tier 4 — Minor, record only

- **Vera County slide 3 is long on phones** (~1.7 screens at 375×812). Now scrollable (Tier 1 fix),
  but a candidate for trimming.
- **Unlock order relocks 006 for existing players.** Unlock is "previous entry completed"
  (`main.ts:294`, `:550`). Inserting 010 between 005 and 006 means a player who had completed
  through 006 now finds 006 locked behind 010. Only affects dev/local progress (educational is
  coming soon on beta), so low stakes.
- **Optional bonus attainability is untested for most scenarios** — only 002's verdict stars are
  covered by e2e. A bonus that can't be achieved would only show up in playtest. Low priority.

## Checked and clean

- Same overlay class as Tier 1 at 375×812: the result screen (scenario-007, five criteria) keeps
  Keep Drawing / Back to Menu / Next Scenario on-screen — the criteria list scrolls inside the card
  (GAME-094); scenario-002's debrief keeps its buttons on-screen. The wrap-up card is four lines
  and was not measured at phone width.

- Campaign description's "nine scenarios" matches the list.
- Population-balance descriptions match each scenario's `population_tolerance`.
- All nine have winnability e2e tests.
- 009's "about 60%" Cat share — actual 58.1%, fine.
- 010's "Latino voters" objective wording is consistent with the GAME-113 owner model (population
  figures are the turned-out voting population).
- Compactness / efficiency-gap threshold labeling is already tracked in GAME-113; partisan realism
  tuning in GAME-123.

## Owner decision list

| # | Item | Decision needed |
|---|---|---|
| 2 | Wrap-up text (GAME-131) | Per-campaign wrap-up copy; what the educational one should conclude |
| 3.1 | Debriefs on 8 of 9 scenarios | Write them for v1.0, or accept pass/fail endings |
| 3.2 / 3.3 | 007 vs 008 overlap; Ken's complaint in 008 | Merge, differentiate, or keep |
| 3.4 | Enforce "no partisan data" in 007/008 | Gameplay change or not |
| 3.6 | Player always draws for Ken in 002–004 | Swap one, or accept |
| 3.7 | "rigged", 006's one-sided slide | Reword or keep |
