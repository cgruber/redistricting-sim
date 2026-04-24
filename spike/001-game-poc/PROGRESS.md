working-dir: /Users/cgruber/Projects/github/cgruber/redistricting-sim/spike/001-game-poc/
status: Complete — all AC verified manually
AC:
  [x] ~50-precinct hex grid rendered as SVG polygons (7×8=56 cells, flat-top hex)
  [x] Precincts paintable into districts via brush stroke (live visual feedback during drag)
  [x] At least 2 districts, boundaries visible (4 districts available; white boundary edges)
  [x] Election simulation runs after each edit, results shown (sidebar panel)
  [x] Undo/redo of at least one brush stroke (zundo temporal store — manually verified)
  [x] npm install && npm start works (Vite dev server, ~85ms startup)
  [x] No server — fully static/client-side
extra-validated:
  - Population density choropleth: HSL lightness encoding on district colors (darker = denser)
  - Partisan lean toggle: diverging blue-red scale (d3.interpolateRdBu) per-precinct D/R lean
  - Two-phase boundary feedback: dashed preview overlay during stroke, solid on commit
  - Hover precinct info: delegated mousemove on SVG container → status bar update
decisions:
  Population distribution: Gaussian mixture model, 2–3 epicenters, exp(-d²/2σ²) falloff.
  Partisan lean: 3 overlapping sinusoidal waves (low-freq, random angles/phases), no
  urban/rural stereotypes. Undo/redo: zundo (zustand-travel is not a real package).
  AssignmentMap as Map<id, DistrictId|null>: works but note JSON serialisation concern
  for production (see SPIKE-REPORT.md). Full zundo snapshots (not diffs) for simplicity.
  Event handling: all mouse events delegated to SVG container, never per-element via D3
  .on() — critical for correctness when handlers re-register on every render().
bugs-found-post-agent:
  - Zustand v5 main entry requires React even for vanilla usage; fixed via Vite alias
    (zustand → zustand/vanilla) so zundo's internal imports also resolve correctly.
  - SVG rendered at browser-default 300×150 due to height:100% not resolving in flex
    context; fixed with position:absolute + inset:0 on the SVG.
  - mouseenter/mouseover on per-element D3 binding failed to re-fire after handler
    re-registration during render; fixed by moving all events to delegated listeners.
  - clearHover() was restoring fill from store, overwriting in-progress paint visuals;
    fixed by removing fill restoration (hover never changes fill).
blockers: none
