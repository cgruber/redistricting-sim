#!/usr/bin/env kotlin
/**
 * Generator for scenario-008.json: "Both Sides Unhappy"
 *
 * Lesson: A bipartisan-agreed, independent redistricting commission applies
 * strict neutral criteria. Both parties walk away furious. Geography made
 * the outcome inevitable from the start.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Partisan geography:
 *   Inner core  (d ≤ 2, 19 hexes): ~20% Ken — strong Ryu
 *   Suburbs     (d = 3-4, 42 hexes): ~50% Ken — competitive
 *   Exurbs      (d = 5-6, 66 hexes): ~80% Ken — strong Ken
 *   → Region overall: ~61% Ken, 39% Ryu
 *
 * Initial assignment: 5 angular wedge sectors from center to edge.
 *   Each sector spans all three partisan zones → all districts competitive.
 *   Thin elongated wedges → very low compactness → compactness criterion fails.
 *
 * Winning solution: any sufficiently compact, population-balanced map.
 *   Natural outcome: 1 inner Ryu district + 4 outer Ken districts.
 *   Ken: 4/5 seats (80%) with ~61% of votes → overrepresented.
 *   Ryu: 1/5 seats (20%) with ~39% of votes → underrepresented.
 *   Educational note: both parties agreed to neutral rules; geography produced
 *   an outcome neither called fair.
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), compactness ≥ 0.40
 *   Optional: efficiency_gap ≤ 10% (geography makes this nearly unreachable)
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-008.main.kts
 */

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.PI
import kotlin.random.Random

val rng = Random(88)
val R = 6

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

fun baseKenShare(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> 0.20  // strong Ryu inner core
        d <= 4 -> 0.50  // competitive suburbs
        else   -> 0.80  // strong Ken exurbs
    }
}

// Initial: 5 angular wedge sectors from center to edge.
// Each sector spans all three partisan zones → competitive throughout.
// Thin elongated wedge shapes → very low compactness → fails criterion.
fun initialDistrict(q: Int, r: Int): String {
    if (q == 0 && r == 0) return "d3"
    val x = q.toDouble() + r.toDouble() * 0.5
    val y = r.toDouble() * 0.8660254  // sqrt(3)/2
    val norm = (atan2(y, x) + PI) / (2.0 * PI)  // 0..1
    return when ((norm * 5).toInt().coerceIn(0, 4)) {
        0 -> "d1"
        1 -> "d2"
        2 -> "d3"
        3 -> "d4"
        else -> "d5"
    }
}

fun countyId(q: Int, r: Int): String {
    val d = hexDist(q, r)
    return if (d <= 3) "accord_central" else "accord_outer"
}

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
    val d = hexDist(q, r)
    val zoneName = when {
        d <= 2 -> "Core"
        d <= 4 -> "Suburb"
        else   -> "Exurb"
    }
    val name = "$zoneName ($q,$r)"

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
  "id": "scenario-008",
  "title": "Both Sides Unhappy",
  "election_type": "state_house",
  "region": {
    "id": "accord_county",
    "name": "Accord County"
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
      "id": "sc-compactness",
      "required": true,
      "description": "All districts must be reasonably compact — no long tentacles or thin strips (compactness ≥ 40%).",
      "criterion": {
        "type": "compactness",
        "operator": "gte",
        "threshold": 0.40
      }
    },
    {
      "id": "sc-efficiency-gap",
      "required": false,
      "description": "How close to zero can you get the efficiency gap on a purely neutral map? (≤ 10%).",
      "criterion": {
        "type": "efficiency_gap",
        "operator": "lte",
        "threshold": 0.10
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Independent Commissioner, Accord County Redistricting Commission",
      "motivation": "After years of partisan warfare over district lines, both parties agreed to something remarkable: an independent commission with binding authority. The rules are strict — equal population, geographic compactness, contiguous districts. No partisan data allowed. Both sides signed off on the criteria. Now you draw the map."
    },
    "intro_slides": [
      {
        "heading": "The Accord",
        "body": "It took two years of negotiations, three failed bills, and a court order, but both parties finally agreed: an independent commission would draw the new map using strictly neutral criteria.\n\nNo partisan registration data. No incumbent addresses. Just geometry: equal population, compact districts, no disconnected pieces. Both parties signed the agreement. Both parties praised it publicly."
      },
      {
        "heading": "The Problem with Perfect Neutrality",
        "body": "Here's what both parties understood privately, even as they signed: neutral rules don't produce neutral outcomes. They produce outcomes driven by geography.\n\nIn Accord County, geography has a lean. Ryu voters cluster tightly in the urban core. Ken voters spread across the suburbs and exurbs. Any compact map will reflect that geography — not because anyone drew it that way, but because that's where people live."
      },
      {
        "heading": "A Fair Process, An Unfair Outcome?",
        "body": "Draw the most geometrically neutral map you can. Then submit it and look at the results.\n\nBoth parties will complain. Ryu will say the compact map packed their voters unfairly. Ken will say their geographic spread deserves more representation. Both arguments will have merit.\n\nThis is not a bug in your map. It's a feature of representative democracy that no one has solved."
      }
    ],
    "objective": "Apply the agreed neutral criteria. Draw a compact, population-balanced map. Watch both sides declare the process rigged."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-008.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
