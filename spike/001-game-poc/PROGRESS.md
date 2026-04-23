working-dir: /Users/cgruber/Projects/github/cgruber/redistricting-sim/spike/001-game-poc/
status: Complete
AC:
  [x] ~50-precinct hex grid rendered as SVG polygons (7×8=56 cells, flat-top hex)
  [x] Precincts paintable into districts via brush stroke
  [x] At least 2 districts, boundaries visible (4 districts available; white boundary edges)
  [x] Election simulation runs after each edit, results shown (sidebar panel)
  [x] Undo/redo of at least one brush stroke (zundo temporal store)
  [x] npm install && npm start works (Vite dev server, 84ms startup)
  [x] No server — fully static/client-side
decisions:
  Population distribution: Gaussian mixture model, 2–3 epicenters, exp(-d²/2σ²) falloff.
  Partisan lean: 3 overlapping sinusoidal waves (low-freq, random angles/phases), no
  urban/rural stereotypes. Undo/redo: zundo (zustand-travel is not a real package).
  AssignmentMap as Map<id, DistrictId|null>: works but note JSON serialisation concern
  for production (see SPIKE-REPORT.md). Full zundo snapshots (not diffs) for simplicity.
blockers: none
