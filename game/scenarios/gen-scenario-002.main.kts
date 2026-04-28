#!/usr/bin/env kotlin
/**
 * Generator for scenario-002.json: "Give the Governor a Win"
 *
 * Lesson: Basic partisan gerrymandering — redraw to give one party more seats.
 *
 * Shape: hex-of-hexes, radius 5 → 91 precincts, 4 districts of ~22-23.
 * Coordinates: axial, centered at (0,0); range q,r in [-5,5].
 *
 * Partisan geography (angle-based, three zones):
 *   North  (r < 0 or r=0 and q<0, roughly upper half): ~60% Ken — Ken-leaning
 *   Southwest (q ≤ 0 and r > 0): ~52% Ken — competitive Ken-lean
 *   Southeast (q > 0 and r > 0): ~25% Ken — strong Ryu stronghold
 *
 * Initial assignment: diagonal strips (k=q+r constant).
 *   Each strip crosses all three zones → D1,D2 get north+SW (~56% Ken → Ken wins),
 *   D3,D4 get north+SE (~42% Ken → Ryu wins).
 *   Result: 2 Ken / 2 Ryu — fails ≥3 Ken criterion.
 *
 * Winning gerrymander: pack the southeast Ryu stronghold into one district.
 *   3 districts from north+southwest (Ken-majority) → 3 Ken ✓
 *   1 district absorbs the southeast Ryu bloc → Ryu sacrifice
 *   Result: 3 Ken / 1 Ryu ✓
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), Ken ≥ 3 seats
 *   Optional: compactness ≥ 0.40
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-002.main.kts
 */

import kotlin.math.abs
import kotlin.random.Random

val rng = Random(42)
val R = 5

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

// Two zones: most of the hex is Ken territory, but a compact Ryu stronghold
// occupies the inner-east region (q ≥ 1, d ≤ 3, ~18 hexes). The surrounding
// area leans Ken, creating a natural "pack the Ryu bloc" puzzle.
fun baseKenShare(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        q >= 1 && d <= 3 -> 0.25  // inner-east: strong Ryu stronghold (~18 hexes)
        q >= 1           -> 0.52  // outer-east: competitive, slight Ken
        else             -> 0.62  // west: reliable Ken territory
    }
}

// Initial: diagonal strips (k = q+r constant) — mixes zones.
//   k ≤ -3: d1, k=-2..-1: d2, k=0..1: d3, k≥2: d4
fun initialDistrict(q: Int, r: Int): String {
    val k = q + r
    return when {
        k <= -3 -> "d1"
        k <= -1 -> "d2"
        k <= 1  -> "d3"
        else    -> "d4"
    }
}

fun countyId(q: Int, r: Int): String = when {
    q >= 1 && hexDist(q, r) <= 3 -> "clearwater_east"
    q <= 0                       -> "clearwater_west"
    else                         -> "clearwater_central"
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
        q >= 1 && d <= 3 -> "East"
        q <= 0           -> "West"
        else             -> "Central"
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
  "id": "scenario-002",
  "title": "Clearwater County: The Governor's Map",
  "election_type": "state_house",
  "region": {
    "id": "clearwater_county",
    "name": "Clearwater County"
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
    { "id": "d4", "name": "District 4" }
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
      "description": "All four districts are in use and every precinct is assigned.",
      "criterion": { "type": "district_count" }
    },
    {
      "id": "sc-population-balance",
      "required": true,
      "description": "All four districts have roughly equal population (within 10%).",
      "criterion": { "type": "population_balance" }
    },
    {
      "id": "sc-ken-seats",
      "required": true,
      "description": "The governor's Ken Party wins at least 3 of the 4 districts.",
      "criterion": {
        "type": "seat_count",
        "party": "ken",
        "operator": "gte",
        "count": 3
      }
    },
    {
      "id": "sc-compactness",
      "required": false,
      "description": "All districts are reasonably compact (≥ 40%).",
      "criterion": {
        "type": "compactness",
        "operator": "gte",
        "threshold": 0.40
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Ken Party Campaign Strategist, Clearwater County",
      "motivation": "The governor wants a reliable majority in Clearwater County. The current map splits the vote evenly — two Ken, two Ryu. That's not good enough. You've been brought in to redraw the lines so Ken wins three of four seats."
    },
    "intro_slides": [
      {
        "heading": "The Governor's Problem",
        "body": "Clearwater County elects four representatives. Right now, the map gives each party two seats. The governor — a Ken partisan — wants three.\n\nThe population hasn't changed. The voters haven't changed. But the lines can change."
      },
      {
        "heading": "How Redistricting Works",
        "body": "Every ten years, district boundaries are redrawn. The official reason is to reflect population changes. The real reason, often, is to change who wins.\n\nYou're looking at a map of precincts — small geographic units with known voting patterns. Your job is to group them into districts that favor the Ken Party."
      },
      {
        "heading": "Your First Gerrymander",
        "body": "Look at the map. The southeast corner votes heavily Ryu. The north and southwest lean Ken.\n\nIf you can contain the Ryu stronghold in one district and spread Ken voters across the other three, the governor gets the majority. The tools are simple — the consequences are not."
      }
    ],
    "objective": "Redraw the map so the Ken Party wins at least 3 of 4 districts."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-002.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
