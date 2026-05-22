---
id: GAME-083
title: Unassigned precinct visual feedback
area: GAME
status: open
created: 2026-05-20
---

## Summary

Precincts that have not yet been assigned to a district have no visual distinction
from assigned ones (other than their district color). On a large circular map like
tutorial-003, the default state is difficult to read and provides no feedback
about population balance or assignment progress.

## Current State

- Unassigned precincts show no distinct background color
- No border/outline distinguishes unassigned from assigned precincts
- Population density is not visually conveyed on unassigned hexes

## Goals / Acceptance Criteria

- [ ] Unassigned precincts render with a distinct fill — a white-to-dark-grey gradient
      or flat neutral colour that clearly signals "not yet assigned"
- [ ] The unassigned fill is visually distinct from all four district colours
- [ ] When a precinct is assigned to a district it transitions cleanly to the district colour
- [ ] (Optional) Population density hinted via shade within the neutral range

## References

- Raised after tutorial-003 expansion to 127 precincts (R=6 circle) made the
  lack of feedback obvious on load
