---
id: GAME-091
title: Scenario-002 reframed as the campaign's reapportionment opener (narrative + debrief + old-map + river)
area: game, content, UX
status: resolved
created: 2026-06-23
---

## Summary

Massage scenario-002's intro and result screens to actually teach the gerrymandering
lesson. The GAME-088 field made the lesson stronger: Ryu now wins the county popular
vote (~51%) yet Ken can take 3 of 4 seats by packing — the clearest possible
demonstration of votes ≠ seats. The old intro was also factually stale for the new
field (it referenced a "southeast corner" Ryu bloc that no longer exists).

**Playtested + accepted (2026-06-24):** owner played scenario-002 through to a win;
map, intro, and instructions are correct and the difficulty reads fine ("not even
terribly hard with the instructions"). One follow-up surfaced: the result screen
overflows the viewport once the epilogue is shown → filed GAME-094.

## Resolution

- New schema field `narrative.epilogue` (plain text), plumbed through spec-types →
  assembler → scenario schema → loader, and rendered on the result screen as a
  teaching debrief revealed after a winning verdict (`#result-epilogue`, styled).
- scenario-002 intro slides rewritten to teach: votes-vs-seats, then packing (with
  cracking named). Motivation/objective updated to the new field (Ryu leads votes).
- Epilogue debrief explains packing/cracking neutrally (education, not advocacy —
  fictional Ken/Ryu parties; per DESIGN-014 framing intent).
- e2e: scenario-002 winnability test asserts the debrief appears on a win.
- **Reapportionment framing** (differentiates 002 from 003, which also taught packing):
  region renamed "Clearwater County" → "Clearwater Valley" (it holds three counties);
  intro tells the old-3-county-map → east-bank boom → 4th seat → flip 2-1 to 3-1 story.
- **"Old map" start**: initial assignment = the three counties (City→d1/East→d2/West→d3),
  d4 empty for the player to carve. Two west-edge city precincts moved to West county so
  the split reads ~West 41k / City 64k / East 40k.
- **Cosmetic river** tracing the W/E county border + the Ken/Ryu split through the city;
  county borders render over rivers.
- Manual finishing lives in `scenario-002.overlay.{json,jq}`, applied after
  generate_scenario — scenario-002 stays reproducible (regenerate → re-apply overlay).

## References

- `game/scenarios/scenario-002.spec.yaml` (narrative block)
- `game/web/src/model/scenario.ts`, `loader.ts`, `pipeline/assembler.ts`, `spec-types.ts`
- `game/web/index.html`, `game/web/src/main.ts`, `game/web/styles.css`
- Built on GAME-088/089 (PR #267). Relates to DESIGN-014 (non-partisan framing).
