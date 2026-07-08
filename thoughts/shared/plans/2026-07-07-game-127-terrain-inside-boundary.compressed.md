<!--COMPRESSED v1; source:2026-07-07-game-127-terrain-inside-boundary.md-->
§META
date:2026-07-07 author:claude+cgruber ticket:GAME-127 status:complete(owner-accepted layer win; PR held for eyeball)

§ABBREV
tg=terrain-generator.ts hd=hexDist pc=precinct T4=tutorial-004 rad=radius
allP=allPositions(full circle) pos=positions(land-only) tSet=terrainPosSet

§GOAL
Flip tg invariant: terrain(mountain|sea|lake) must live INSIDE hex boundary(hd≤rad) + REPLACES the pc on its cell — opposite of today(terrain off-grid, never overlaps pc). Re-author T4 so mountains+ocean occupy OUTER RING of r=6 map; river flows mountains→sea over land. T4 stays winnable; four-wedge lesson did NOT survive rim-carve → owner decision(2026-07-08): capstone win = complete legal map via Validity panel, not a natural four-quadrant carve(see Rebalance→FINDING).

§CONTEXT
tg now: generateTerrain assigns seq IDs to ALL circle cells; buildTerrainTiles throws on pc-overlap + intentionally ALLOWS off-grid; river routes over full circle.
T4 shipped(GAME-125) w/ 18 tiles at hd=7 = one ring OUTSIDE r=6. 2026-07-06 owner eyeball="close but no cigar": mountains+ocean float outside; should BE the outer ring.
Owner transform(his "y"=SCREEN-y, inverted from axial r → both moves INWARD): mountain r+1(drop (-7,0), |q|=7 can't fit r=6); ocean r−1(drop (7,0)); pcs under moved terrain removed. Rule: never emit terrain outside r=n.
Blast radius=ONE map: T4 is only scenario w/ terrain tiles(audited). Rivers in 002/tut-003/tut-005 have no terrain→land set=full circle→unchanged. No loader/pipeline completeness assumption: checkPrecinctCount=≥1; hexCircleSize only self-tested; no ===127. 111-cell irregular map loads fine.

§APPROACH
A. tg invariant flip(general):
- full circle→allP; tSet=(q,r) of terrain specs; pos=allP.filter(∉tSet)=land-only
- buildTerrainTiles NEW: throw if hd>rad(error names boundary); REMOVE old overlap-throw(overlap now intended = terrain on a removed-pc cell)
- seq pc IDs over pos(land-only); all downstream(routeRiver,resolveRiverAnchor,validateRiverEdges,buildPosIndex/buildRiverEdges) already key off pos/posToId → threading land-only ≈ mechanical
- KEY(no river-sig change): land-only pos → coast/mountain-adjacent corners become count==2 boundary corners → coast termination is VALID terminus not loose end. Confirm validateRiverEdges accepts w/o optional tiles arg; pass tiles only if required
pseudocode:
  allP=generateHexCircle(rad); tSet=set(terrain.tiles); pos=allP.filter(∉tSet)
  precincts=pos.map(seqId); terrainTiles=buildTerrainTiles(specs,rad)  // throw hd>rad
  river=routeRiver(pos,…)|river_edges

B. T4 re-author(tutorial-004.spec.yaml):
- mountains→7 rim tiles: (-6,0)(-5,-1)(-4,-2)(-3,-3)(-2,-4)(-1,-5)(0,-6)  [r+1, drop (-7,0)]
- ocean→9 rim tiles: (6,0)(5,1)(4,2)(3,3)(2,4)(1,5)(0,6)(-1,6)(-2,6)  [r−1, drop (7,0)]
- river re-anchor from(-3,-2)[foot of mtns] via(-2,2) to(0,5)[last land before coast]; all land hd≤6; mountains→sea
- rewrite now-wrong "one ring OUTSIDE/off-grid" comments
- 127→111 pcs; terrain_weights stay 1.0(cosmetic — lesson=pop balance not terrain suitability)

Rebalance→FINDING(2026-07-08): four-wedge split did NOT survive rim-carve. Natural cardinal quadrant carve E/W ~+17%, S ~−23%(structural: pointy-top hex → cardinal E/W wedges ~17% heavier than N/S pointy wedges; + asymmetric rim-carve). Still winnable + e2e proves it via 4 EQUAL-POP N–S layers(sort screen-y, 4 equal-pop contiguous slabs) = passes BY CONSTRUCTION → sidesteps not restores wedge lesson. DECISION(2026-07-08, owner): (a) accept layers as capstone win. Wedge framing retired; taught skill=balance-via-panel. No map change — terrain/pops/e2e ship as-is; opposite-pair village design kept(symmetric/balanceable), wedge wording softened. Alternatives not taken: (b)re-tune villages | (c)reshape frame.

Decision: NEW ticket not GAME-125 reopen(invariant=general scope; 125 terrain shipped; mirrors GAME-122→121).

§STEPS
1. tg: positions→allP; tSet; pos=land-only; buildTerrainTiles(rad) rejects hd>rad; thread land-only via river calls(already keyed off pos)
2. unit tests: flip "overlap throws"→overlap REMOVES pc(count drops, tile present); add "terrain outside rad throws"; river round-trip tests stay green
3. re-author tutorial-004.spec.yaml(tiles+river anchor+comments)
4. regen tutorial-004.json(bazel run generate_scenario, ABS paths); verify 111 pcs, 16 tiles all hd≤6, 0 off-grid, river_edges NW→S
5. feasibility witness: balanced+contiguous 4-partition over JSON; reposition villages if needed; update T4 winnability e2e to witness
6. preview: terrain on outer ring INSIDE circle, map-fit frames it, river mountains→sea; screenshot
7. full bazel test //game/... green; focused PR(6 sections, --owner cgruber --repo redistricting-sim); resolve GAME-127 same branch; HOLD for owner eyeball

§RISKS
R1 river snaps to wrong rim corner(routeRiver=nearest boundary corner; carving adds corners)→verify emitted river_edges+preview; nudge from/to if off mtn/sea edge
R2 four-wedge can't reach ±15% after asymmetric removal+anchor shift→witness BEFORE winnable; reposition villages; e2e asserts witness
R3 hidden completeness assumption trips at load→cleared by audit(checkPrecinctCount=≥1, no ===127); full local suite=backstop
R4 validateRiverEdges rejects coast termination w/o tiles→pass optional tiles arg(already supported); confirmed step 4

§DONE
- tg rejects hd>rad; no terrain outside boundary
- terrain replaces pcs: pos=hexCircle−terrain; IDs over land only
- river routes over land + terminates validly at coast/mountains
- T4: 7 mtn+9 ocean rim tiles, 111 pcs, river mountains→sea, all terrain hd≤6
- balanced(±15%)+contiguous 4-partition witness exists(=equal-pop N–S layers) + asserted by e2e; DECIDED(owner 2026-07-08): accept layer win; natural four-quadrant(wedge) split retired
- unit tests: overlap-removes-pc + outside-rad-throws; river tests green
- preview: terrain outer ring inside circle; river mountains→sea
- bazel test //game/... green
