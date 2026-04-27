#!/usr/bin/env kotlin
/**
 * Generator for scenario-006.json: "Harden the Map"
 *
 * Lesson: Incumbency protection — the bipartisan gerrymander.
 *
 * Layout: 10 columns (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts of 24.
 *
 * Partisan geography:
 *   Left flank  (q=0..5): ~62% Ken (6 cols × 12 rows = 72 precincts = 3 districts exactly)
 *   Right flank (q=6..9): ~38% Ken / ~62% Ryu (4 cols × 12 rows = 48 = 2 districts exactly)
 *
 * Initial assignment: "mirror pair" — each district pairs one left col with one right col.
 *   D1: q=0 + q=9 → (62%+38%)/2 = 50% Ken → margin ≈0% → COMPETITIVE
 *   D2: q=1 + q=8 → same → COMPETITIVE
 *   D3: q=2 + q=7 → same → COMPETITIVE
 *   D4: q=3 + q=6 → same → COMPETITIVE
 *   D5: q=4 + q=5 → (62%+62%)/2 = 62% Ken → safe for Ken only (1 safe seat)
 *   → safe_seats_ken criterion (≥3) fails; safe_seats_ryu (≥2) fails ✓
 *
 * Winning solution: vertical strips — separate the flanks
 *   D1: q=0-1, all rows (62% Ken → margin ~24% → SAFE Ken ✓)
 *   D2: q=2-3, all rows (62% Ken → SAFE Ken ✓)
 *   D3: q=4-5, all rows (62% Ken → SAFE Ken ✓)
 *   D4: q=6-7, all rows (62% Ryu → SAFE Ryu ✓)
 *   D5: q=8-9, all rows (62% Ryu → SAFE Ryu ✓)
 *   → Ken: 3 safe seats ✓; Ryu: 2 safe seats ✓
 *
 * safe_seats margin threshold: 0.15 (winner needs ≥57.5% to qualify as "safe")
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-006.main.kts
 */

import kotlin.random.Random

val rng = Random(66)
val NUM_Q = 10
val NUM_R = 12
val BASE_POP = 1500

// Partisan geography: clean left/right split, no battleground column
fun baseKenShare(q: Int): Double = if (q <= 5) 0.62 else 0.38

// Initial: mirror pairs — each district gets one col from each flank
fun initialDistrict(q: Int): String = when (q) {
    0, 9 -> "d1"
    1, 8 -> "d2"
    2, 7 -> "d3"
    3, 6 -> "d4"
    else -> "d5"  // q=4, q=5
}

fun countyId(q: Int): String = if (q <= 5) "westbrook" else "eastbrook"
fun colLetter(q: Int) = "ABCDEFGHIJ"[q].toString()
fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

val precincts = StringBuilder()
var first = true

for (r in 0 until NUM_R) {
    for (q in 0 until NUM_Q) {
        val idx = r * NUM_Q + q
        val pid = "p%03d".format(idx + 1)

        val pop = BASE_POP + rng.nextInt(-150, 151)

        val kenShare = (baseKenShare(q) + rng.nextDouble(-0.04, 0.04)).coerceIn(0.05, 0.95)
        val kenStr = kenShare.fmt(4)
        val ryuStr = (1.0 - kenStr.toDouble()).fmt(4)
        val turnout = rng.nextDouble(0.55, 0.70)

        val districtId = initialDistrict(q)
        val county = countyId(q)
        val side = if (q <= 5) "West" else "East"
        val name = "$side ${colLetter(q)}${r + 1}"

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
          "id": "${pid}-all",
          "name": "All voters",
          "population_share": 1.0,
          "turnout_rate": ${turnout.fmt(2)},
          "vote_shares": { "ken": $kenStr, "ryu": $ryuStr }
        }
      ]
    }""")
    }
}

val json = """{
  "format_version": "1",
  "id": "scenario-006",
  "title": "Harden the Map",
  "election_type": "state_house",
  "region": {
    "id": "brookfield_county",
    "name": "Brookfield County"
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
      "id": "sc-safe-seats-ken",
      "required": true,
      "description": "Ken Party incumbents are protected — at least 3 districts won by a margin of 15 points or more.",
      "criterion": {
        "type": "safe_seats",
        "party": "ken",
        "margin": 0.15,
        "min_count": 3
      }
    },
    {
      "id": "sc-safe-seats-ryu",
      "required": true,
      "description": "Ryu Party incumbents are protected — at least 2 districts won by a margin of 15 points or more.",
      "criterion": {
        "type": "safe_seats",
        "party": "ryu",
        "margin": 0.15,
        "min_count": 2
      }
    },
    {
      "id": "sc-compactness",
      "required": false,
      "description": "The map follows natural geographic lines — all districts are reasonably compact (≥ 35%).",
      "criterion": {
        "type": "compactness",
        "operator": "gte",
        "threshold": 0.35
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Bipartisan Redistricting Consultant, Brookfield County",
      "motivation": "Both parties have agreed — privately — that the current map is too competitive. Too many incumbents lost their seats last cycle. You've been hired by both sides to draw a new map where each party keeps what it has. The voters don't need to know the details."
    },
    "intro_slides": [
      {
        "heading": "The Deal",
        "body": "It doesn't happen at a press conference. It happens in a conference room, with lawyers from both parties, a map, and a handshake.\n\nThe current map has too many swing districts. Too many incumbents are at risk every two years. The solution, both sides agree, is simple: draw lines that protect everyone."
      },
      {
        "heading": "Safe Seats for Everyone",
        "body": "The goal isn't to help one party win more seats. It's to make sure neither party loses the seats they already have.\n\nConcentrate Ken voters into Ken districts. Concentrate Ryu voters into Ryu districts. Eliminate the middle ground. Make every race a foregone conclusion."
      },
      {
        "heading": "What the Voters Lose",
        "body": "A safe seat means your representative doesn't need to worry about losing. They only need to survive their own primary — which means appealing to their party's base, not to the median voter.\n\nCompetitive elections create accountability. This map is designed to eliminate them. Notice how many races are decided before anyone votes."
      }
    ],
    "objective": "Draw a map that protects incumbents of both parties — Ken Party wins at least 3 safe seats (margin ≥ 15 points), Ryu Party wins at least 2 safe seats (margin ≥ 15 points)."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-006.json")
outFile.writeText(json)
println("Wrote ${NUM_Q * NUM_R} precincts to ${outFile.path}")
