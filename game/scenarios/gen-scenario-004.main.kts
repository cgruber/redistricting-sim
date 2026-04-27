#!/usr/bin/env kotlin
/**
 * Generator for scenario-004.json: "Cracking the Opposition"
 *
 * Layout: 10 columns (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts of 24.
 *
 * Zones:
 *   Opposition corridor (r=5..6, all q): 18% Ken / 82% Ryu — a horizontal Ryu band
 *   Upper band  (r=0..4, all q):          65% Ken / 35% Ryu — reliable Ken
 *   Lower band  (r=7..11, all q):         65% Ken / 35% Ryu — reliable Ken
 *
 * Initial assignment (vertical 2-column strips):
 *   D1=q0-1, D2=q2-3, D3=q4-5, D4=q6-7, D5=q8-9
 *
 * Each initial district spans all rows → each gets 4 corridor precincts (r=5-6) out of 24.
 *   Corridor weight: (4×0.18 + 20×0.65)/24 ≈ (0.72+13)/24 ≈ 57.2% Ken → KEN wins all 5
 *   That's too easy — initial state already passes. Need different initial to make it a puzzle.
 *
 * Alternative initial: horizontal strips (row bands)
 *   D1=r=0-1 all cols    (2×10=20 precincts — too few, need 24)
 *   Better: D1=r=0..2 + 4 from r=3 (uneven, hard to reason about)
 *
 * Cleaner approach: use 5 horizontal bands of r width 2.4 — not integer.
 * Simplest: group into horizontal bands with slight overlap:
 *   D1=r=0..2 (all q, 30 precincts — too many)
 *
 * Best approach: make corridor wider (r=4..7, 4 rows × 10 cols = 40 precincts).
 * 5 districts of 24: if each district gets 8 corridor precincts → corridor swamps them:
 *   (8×0.18 + 16×0.65)/24 ≈ (1.44+10.4)/24 ≈ 49.3% Ken → RYU wins all 5 (too many Ryu)
 *
 * Best design: corridor r=5..6 (2 rows, 20 precincts total).
 * Initial = horizontal bands:
 *   D1 = r=0..1 all q   = 20 precincts → need 4 more → add r=2, q=0..3 = 4 precincts → 24 ✓
 *   D2 = r=2,q=4..9 + r=3 all q = 6+10 = 16 → + r=4,q=0..7 = 8 → 24 ✓
 *   D3 = r=4,q=8..9 + r=5..6 all q + r=7,q=0..1 = 2+20+2 = 24 ✓
 *   D4 = r=7,q=2..9 + r=8..9 all q = 8+20 = 28 → too many
 *
 * This is getting complex. Let's just go with vertical strips as initial (so the puzzle is to
 * switch to horizontal to crack), and make the corridor wide enough that vertical strips lead
 * to a losing initial outcome.
 *
 * Design revision: corridor r=4..7 (4 rows × 10 cols = 40 precincts, 1/3 of the map).
 * 5 districts of 24 with vertical strips:
 *   Each district (2 cols) gets: r=4-7 = 4 rows × 2 cols = 8 corridor precincts
 *   Avg Ken = (8×0.18 + 16×0.65)/24 = (1.44+10.4)/24 = 0.493 → ~49.3% → RYU wins (barely)
 *   Result: 0 Ken / 5 Ryu → too extreme, no challenge
 *
 * Final design: corridor r=5..6 (narrow), initial = horizontal bands creating 3 Ken + 2 Ryu,
 * and the winning crack moves to vertical strips. But then vertical strips give 5 Ken (all win).
 *
 * Simplest coherent design:
 *   Corridor r=5..6, 20 precincts total (Ryu-heavy).
 *   Initial = 3 horizontal bands + corridor isolated:
 *     D1 = r=0..2 all q = 30 → too many
 *
 * Let's just use: initial = horizontal band districts where the corridor forms D3 (all Ryu),
 * and upper + lower bands are D1,D2 (upper) and D4,D5 (lower), all Ken.
 * That's initial 4 Ken / 1 Ryu → already wins. Not a puzzle.
 *
 * FINAL FINAL DESIGN: Make it genuinely difficult.
 * Opposition corridor: r=5..6 (2 rows × 10 cols = 20 precincts, 80% Ryu).
 * Non-corridor: 100 precincts, 65% Ken.
 * 5 districts of 24 precincts each.
 *
 * Initial (horizontal bands, deliberately unhelpful):
 *   D1 = r=0..1, all q            = 20 precincts
 *   Add r=2, q=0..3               = 4 precincts → D1 total = 24 ✓ (all upper → 65% Ken → KEN)
 *   D2 = r=2,q=4..9 + r=3 all q  = 6+10 = 16 + r=4,q=0..7 = 8 → 24 ✓ (upper → 65% Ken → KEN)
 *   D3 = r=4,q=8..9 + r=5..6 all q + r=7,q=0..1 = 2+20+2 = 24 ✓ (corridor-heavy → 30% Ken → RYU)
 *   D4 = r=7,q=2..9 + r=8..9 all q = 8+20 = 28 → need to remove 4
 *        Use r=7,q=2..7 + r=8..9 all q = 6+20 = 26 → still 2 too many
 *        Use r=7,q=2..5 + r=8..9 all q = 4+20 = 24 ✓ (lower → 65% Ken → KEN)
 *   D5 = r=7,q=6..9 + r=10..11 all q = 4+20 = 24 ✓ (lower → 65% Ken → KEN)
 *
 * Initial outcome: D1 KEN, D2 KEN, D3 RYU, D4 KEN, D5 KEN → 4 Ken / 1 Ryu. Already wins!
 *
 * I need the initial to fail the "opposition wins zero districts" criterion. Let me use a
 * different required criterion: Ken wins ALL 5 seats.
 * Initial 4/5 → fails ≥5. Player must crack the corridor to win all 5.
 *
 * Winning crack: vertical strips (each district crosses the corridor):
 *   D1=q0-1 all rows: 4 corridor + 20 non-corridor → (4×0.18+20×0.65)/24 ≈ 57% Ken → KEN ✓
 *   Same for all 5 vertical strips.
 *   Result: 5 Ken / 0 Ryu ✓
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-004.main.kts
 */

import kotlin.random.Random

val rng = Random(44)
val NUM_Q = 10
val NUM_R = 12
val BASE_POP = 1500

fun isCorridor(q: Int, r: Int) = r in 5..6

fun zone(q: Int, r: Int) = if (isCorridor(q, r)) "corridor" else if (r <= 4) "upper" else "lower"

// Initial horizontal-band assignment (deliberately non-cracking so player must discover crack)
fun initialDistrict(q: Int, r: Int): String = when {
    r <= 1                          -> "d1"
    r == 2 && q <= 3                -> "d1"
    r == 2 && q >= 4                -> "d2"
    r == 3                          -> "d2"
    r == 4 && q <= 7                -> "d2"
    r == 4 && q >= 8                -> "d3"
    r in 5..6                       -> "d3"
    r == 7 && q <= 1                -> "d3"
    r == 7 && q in 2..5             -> "d4"
    r in 8..9                       -> "d4"
    r == 7 && q >= 6                -> "d5"
    else                            -> "d5"   // r=10..11
}

fun countyId(q: Int, r: Int) = when {
    isCorridor(q, r) -> "lakeview_city"
    r <= 4           -> "lakeview_north"
    else             -> "lakeview_south"
}

fun colLetter(q: Int) = "ABCDEFGHIJ"[q].toString()

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

val precincts = StringBuilder()
var first = true

for (r in 0 until NUM_R) {
    for (q in 0 until NUM_Q) {
        val idx = r * NUM_Q + q
        val pid = "p%03d".format(idx + 1)
        val z = zone(q, r)

        val baseKen = when (z) {
            "corridor" -> 0.18
            else       -> 0.65
        }
        val delta = rng.nextDouble(-0.03, 0.03)
        val kenShare = (baseKen + delta).coerceIn(0.05, 0.95)
        val ryuShare = 1.0 - kenShare

        val pop = BASE_POP + rng.nextInt(-100, 101)
        val turnout = rng.nextDouble(0.52, 0.62)
        val districtId = initialDistrict(q, r)
        val county = countyId(q, r)
        val zoneName = z.replaceFirstChar { it.uppercase() }
        val name = "$zoneName ${colLetter(q)}${r + 1}"

        if (!first) precincts.append(",\n")
        first = false

        precincts.append("""    {
      "id": "$pid",
      "editable": true,
      "county_id": "$county",
      "position": { "q": $q, "r": $r },
      "total_population": $pop,
      "initial_district_id": "$districtId",
      "name": "$name",
      "demographic_groups": [
        {
          "id": "${pid}-base",
          "name": "Registered voters",
          "population_share": 1.0,
          "turnout_rate": ${turnout.fmt(2)},
          "vote_shares": { "ken": ${kenShare.fmt(4)}, "ryu": ${ryuShare.fmt(4)} }
        }
      ]
    }""")
    }
}

val json = """{
  "format_version": "1",
  "id": "scenario-004",
  "title": "Lakeview: Cracking the Opposition",
  "election_type": "state_house",
  "region": {
    "id": "lakeview_county",
    "name": "Lakeview County"
  },
  "geometry": { "type": "hex_axial" },
  "parties": [
    { "id": "ken", "name": "Ken Party", "abbreviation": "KEN" },
    { "id": "ryu", "name": "Ryu Party", "abbreviation": "RYU" }
  ],
  "districts": [
    { "id": "d1", "name": "District 1" },
    { "id": "d2", "name": "District 2" },
    { "id": "d3", "name": "District 3" },
    { "id": "d4", "name": "District 4" },
    { "id": "d5", "name": "District 5" }
  ],
  "default_district_id": "d1",
  "precincts": [
$precincts
  ],
  "events": [],
  "rules": {
    "population_tolerance": 0.10,
    "contiguity": "required"
  },
  "success_criteria": [
    {
      "id": "sc-district-count",
      "required": true,
      "description": "All five districts are in use and every precinct is assigned.",
      "criterion": { "type": "district_count" }
    },
    {
      "id": "sc-population-balance",
      "required": true,
      "description": "All five districts have roughly equal population (within 10%).",
      "criterion": { "type": "population_balance" }
    },
    {
      "id": "sc-ken-seats",
      "required": true,
      "description": "The Ken Party wins all 5 districts — leave the Ryu corridor nowhere to win.",
      "criterion": {
        "type": "seat_count",
        "party": "ken",
        "operator": "gte",
        "count": 5
      }
    },
    {
      "id": "sc-mean-median",
      "required": false,
      "description": "Mean-median difference is 10% or less — a statistically uniform crack.",
      "criterion": {
        "type": "mean_median",
        "party": "ken",
        "operator": "lte",
        "threshold": 0.10
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Political Director, Ken Party Legislative Caucus",
      "motivation": "Last time you packed the opposition into one district. This time, the goal is different — dilute them so thoroughly they can't win anywhere."
    },
    "intro_slides": [
      {
        "heading": "The Ryu Corridor",
        "body": "A band of Ryu-leaning precincts runs through the middle of Lakeview County. In the current map, they're grouped together — and they win District 3.\n\nYour job: make sure that never happens."
      },
      {
        "heading": "Crack the Bloc",
        "body": "Cracking means splitting a concentrated voting bloc across multiple districts — diluting their power so they can't win any of them.\n\nDraw lines that cut across the corridor. Give each district a slice of Ryu voters — too few to tip any district Ryu, but just enough to waste their votes."
      }
    ],
    "objective": "Crack the Ryu corridor across all 5 districts so the Ken Party wins every seat."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-004.json")
outFile.writeText(json)
println("Wrote ${NUM_Q * NUM_R} precincts to ${outFile.path}")
