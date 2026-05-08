---
id: DESIGN-011
title: Per-criterion character roster and sprite design
area: design
status: open
created: 2026-05-07
---

## Summary

The result screen reveals criteria one-by-one, each with a small animated character reacting neutral → approve/disapprove. This ticket defines the fixed character roster and drives the sprite design exercise for the four types not yet built. The governor sprite (neutral/approve/disapprove) is already complete and serves as the visual reference for all others.

## Roster

| Key | Role | Appears when | Status |
|---|---|---|---|
| `governor` | The governor | Criteria owned by the governor | **Sprites done** |
| `commissioner` | Reform/bipartisan commissioner | Bipartisan criteria; basic validity (contiguity, population balance, all-assigned) | Needs design |
| `party` | Party operative cluster — color-skinned per party | Partisan seat/margin criteria; color applied at render time via party palette | Needs design |
| `judge` | Judge in robes | Court-ordered / lawsuit-driven criteria | Needs design |
| `legislator` | Abstract legislative symbol | Criteria imposed by statute / new law | Needs design |

The `instigator` is not a sixth type — it is a *role* declared in each scenario that resolves to one of the five types above at render time (e.g. a scenario's instigator may be `party`, `governor`, `judge`, etc.).

## Visual Design Notes

### party
- A small scrum of three similarly-cute figures, pressed together, waving flags
- The flags (and optionally clothing edges or trim) carry the party's palette shade — the figures themselves stay neutral so the sprite works in any party color
- Style should match the governor's character aesthetic at a smaller scale
- Three poses per party color: neutral (flags lowered or relaxed), approve (flags raised, celebratory), disapprove (flags lowered, dejected)

### judge
- Single robed figure
- Black robes — no wig (reflects John Marshall-era US tradition; black robes customary in many US courts, mandated in some states)
- Three poses: neutral, approve (nod / gavel down favorably), disapprove (gavel down / dismissive gesture)

### legislator
- Abstract / institutional rather than a specific person
- Could represent the legislature as a body — consider: a small building facade (capitol dome), a gavel on a podium, or a small assembly of figures with a scroll/bill
- Whichever treatment is chosen, it must animate clearly between neutral and verdict states
- Three poses: neutral, approve (bill signed / light on), disapprove (bill struck / light off or X)

### commissioner
- Single suited figure, similar style to the governor
- Distinguishing prop: clipboard, folder, or similar item indicating regulatory/oversight role
- Three poses: neutral, approve, disapprove

## Sprite Format

Follow the governor sprite sheet convention:
- Single horizontal strip: [neutral | approve | disapprove]
- Fixed row height (200px canonical; row-scale usage will CSS-resize)
- Each pose a fixed pixel width (document exact offsets in code when integrated)
- File naming: `character-<key>.png` in `game/assets/characters/`

## Acceptance Criteria

- [ ] Roster table above confirmed/updated with any design-phase changes
- [ ] `party` sprite sheet produced with at least one reference color; tinting approach documented
- [ ] `judge` sprite sheet produced (neutral/approve/disapprove)
- [ ] `legislator` treatment decided and sprite sheet produced
- [ ] `commissioner` sprite sheet produced
- [ ] All four sprite sheets follow governor format and are committed to `game/assets/characters/`
- [ ] GAME-069 (structural implementation) can replace checkboxes with real sprites

## References

- GAME-060 — character sprite assets (broader sprite work)
- GAME-069 — structural implementation (schema, row-level rendering, placeholder)
- DESIGN-009 — character reaction visual style (prior research)
- Governor sprite: `game/assets/characters/character-governor.png`
