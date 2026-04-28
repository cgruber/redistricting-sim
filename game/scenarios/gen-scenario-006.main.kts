#!/usr/bin/env kotlin
/**
 * Generator for scenario-006.json: "Harden the Map"
 *
 * Lesson: Incumbency protection — the bipartisan gerrymander.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Partisan geography (left/right split via q coordinate):
 *   Left flank  (q ≤ 0, ~70 hexes): ~62% Ken
 *   Right flank (q ≥ 1, ~57 hexes): ~38% Ken / ~62% Ryu
 *
 * Initial assignment: angular wedge sectors that mix left and right flanks.
 *   Each sector spans from center to edge, crossing the partisan divide.
 *   Average ≈ 50% Ken → all districts competitive → fails safe_seats criteria.
 *
 * Winning solution: separate the flanks into vertical-ish blocks.
 *   3 districts from left flank (62% Ken → safe Ken ✓)
 *   2 districts from right flank (62% Ryu → safe Ryu ✓)
 *   → Ken: 3 safe seats ✓; Ryu: 2 safe seats ✓
 *
 * safe_seats margin threshold: 0.15 (winner needs ≥57.5% to qualify as "safe")
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-006.main.kts
 */

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.PI
import kotlin.random.Random

val rng = Random(66)
val R = 6

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

// Left = Ken territory, right = Ryu territory
fun baseKenShare(q: Int, r: Int): Double = when {
    q <= 0 -> 0.62  // left flank: Ken-majority
    else   -> 0.38  // right flank: Ryu-majority
}

// Initial: 5 angular wedge sectors — each mixes left and right flanks.
// All districts end up competitive (~50% Ken) → fails safe_seats for both parties.
fun initialDistrict(q: Int, r: Int): String {
    if (q == 0 && r == 0) return "d3"
    val x = q.toDouble() + r.toDouble() * 0.5
    val y = r.toDouble() * 0.8660254
    val norm = (atan2(y, x) + PI) / (2.0 * PI)
    return when ((norm * 5).toInt().coerceIn(0, 4)) {
        0 -> "d1"
        1 -> "d2"
        2 -> "d3"
        3 -> "d4"
        else -> "d5"
    }
}

fun countyId(q: Int, r: Int): String = if (q <= 0) "westbrook" else "eastbrook"

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

data class Hex(val q: Int, val r: Int)
val hexes = buildList {
    for (q in -R..R) {
        val rMin = maxOf(-R, -q - R)
        val rMax = minOf(R, -q + R)
        for (r in rMin..rMax) { add(Hex(q, r)) }
    }
}.sortedWith(compareBy({ it.r }, { it.q }))

val BASE_POP = 1500

val precincts = StringBuilder()
var first = true

for ((idx, hex) in hexes.withIndex()) {
    val (q, r) = hex
    val pid = "p%03d".format(idx + 1)

    val pop = BASE_POP + rng.nextInt(-150, 151)

    val kenShare = (baseKenShare(q, r) + rng.nextDouble(-0.04, 0.04)).coerceIn(0.05, 0.95)
    val kenStr = kenShare.fmt(4)
    val ryuStr = (1.0 - kenStr.toDouble()).fmt(4)
    val turnout = rng.nextDouble(0.55, 0.70)

    val districtId = initialDistrict(q, r)
    val county = countyId(q, r)
    val side = if (q <= 0) "West" else "East"
    val name = "$side ($q,$r)"

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
println("Wrote ${hexes.size} precincts to ${outFile.path}")
