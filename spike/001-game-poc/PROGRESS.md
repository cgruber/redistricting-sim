working-dir: /Users/cgruber/Projects/github/cgruber/redistricting-sim/spike/001-game-poc/
status: In Progress
AC:
  [ ] ~50-precinct hex grid rendered as SVG polygons
  [ ] Precincts paintable into districts via brush stroke
  [ ] At least 2 districts, boundaries visible
  [ ] Election simulation runs after each edit, results shown
  [ ] Undo/redo of at least one brush stroke
  [ ] npm install && npm start works
  [ ] No server — fully static/client-side
decisions:
  Population distribution: Using a Gaussian mixture model approach with 2–3 epicenters
  placed at fixed grid positions. Each precinct's population is the sum of weighted
  Gaussian contributions from each epicenter (exp(-d²/2σ²)), scaled so total population
  across the grid falls in a plausible range. This is the standard "informed simple"
  approach used in synthetic geography literature — cheap to compute, produces realistic
  dense urban cores with sparse periphery, and epicenters can be tuned independently.
  Partisan lean uses a 2D sinusoidal gradient (low-frequency noise via overlapping sine
  waves at different angles) to ensure spatial coherence without hardcoding real-world
  urban/rural stereotypes.
  Undo/redo: Using zundo (zustand-travel is not a real package; zundo is the established
  Zustand undo/redo middleware).
blockers: none
