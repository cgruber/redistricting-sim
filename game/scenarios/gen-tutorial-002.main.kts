#!/usr/bin/env kotlin
/**
 * Generator for tutorial-002.json: "Millbrook County: Three-District Challenge"
 *
 * Shape: hex-of-hexes R=8 (217 positions) trimmed to 196 by removing the
 * outermost corner hexes. This gives a roughly circular hex shape at the
 * same precinct count as the original 14×14 rectangular grid.
 *
 * Trimming rule: remove hexes where hexDist == 8 AND the hex is at one of
 * the 6 corner directions (where two of |q|,|r|,|q+r| equal 8). This
 * removes 6 hexes from d=8 ring, leaving 217-6=211. Need to remove 15
 * more: trim hexes at d=8 that are closest to corners (highest max(|q|,|r|,|q+r|)).
 *
 * Simpler approach: include all hexes with hexDist ≤ 7 (169) + enough d=8
 * hexes to reach 196. The d=8 ring has 48 hexes; we need 27 of them.
 * Take the 27 hexes from the d=8 ring that are furthest from corners
 * (i.e., closest to the 6 edge midpoints).
 *
 * Districts: 3 districts of ~65 precincts each.
 * Counties: north (r < -2), central (|r| ≤ 2), south (r > 2).
 *
 * Geography: gentle partisan lean by county.
 *   North: ~55% Ken — slight Ken lean
 *   Central: ~50% — competitive
 *   South: ~45% Ken — slight Ryu lean
 *
 * Initial assignment: county-aligned (north→d1, central→d2, south→d3).
 *   Population imbalanced by design → submit disabled.
 *   Player must move a few boundary precincts to balance populations.
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-tutorial-002.main.kts
 */

import kotlin.math.abs
import kotlin.math.max
import kotlin.random.Random

val rng = Random(202)
val R = 8
val TARGET_COUNT = 196

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

// Build full R=8 hex, then trim to 196
data class Hex(val q: Int, val r: Int)

val allHexes = buildList {
    for (q in -R..R) {
        val rMin = maxOf(-R, -q - R)
        val rMax = minOf(R, -q + R)
        for (r in rMin..rMax) { add(Hex(q, r)) }
    }
}

// All d≤7 hexes (169) + d=8 hexes sorted by "distance from nearest corner"
// Corner hexes at d=8 have max(|q|,|r|,|q+r|) = 8 for two coordinates.
// Edge-midpoint hexes have the coordinates more spread out.
// Sort d=8 ring by how "corner-like" they are (higher = more corner-like).
val inner = allHexes.filter { hexDist(it.q, it.r) <= 7 }  // 169
val outerRing = allHexes.filter { hexDist(it.q, it.r) == 8 }  // 48
val need = TARGET_COUNT - inner.size  // 27

// Corner-likeness: max of |q|, |r|, |q+r| — corners have this = 8
val outerSorted = outerRing.sortedBy { max(abs(it.q), max(abs(it.r), abs(it.q + it.r))) }
// Take the 27 LEAST corner-like (closest to edge midpoints)
val selectedOuter = outerSorted.take(need)

val hexes = (inner + selectedOuter).sortedWith(compareBy({ it.r }, { it.q }))
val hexIndex = hexes.withIndex().associate { (i, h) -> h to i }

println("Total: ${hexes.size} (inner ${inner.size} + ${selectedOuter.size} outer)")

// Counties by r position
fun countyId(q: Int, r: Int): String = when {
    r < -2  -> "north"
    r <= 2  -> "central"
    else    -> "south"
}

// Partisan lean by county
fun baseKenShare(q: Int, r: Int): Double = when {
    r < -2  -> 0.55  // north: slight Ken
    r <= 2  -> 0.50  // central: competitive
    else    -> 0.45  // south: slight Ryu
}

// Initial: county-aligned districts (population imbalanced)
fun initialDistrict(q: Int, r: Int): String = when {
    r < -2  -> "d1"  // north
    r <= 2  -> "d2"  // central
    else    -> "d3"  // south
}

val BASE_POP = 3000  // higher per-precinct pop for tutorial scale

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

val precincts = StringBuilder()
var first = true

for ((idx, hex) in hexes.withIndex()) {
    val (q, r) = hex
    val pid = "p%03d".format(idx + 1)

    val pop = BASE_POP + rng.nextInt(-300, 301)

    val kenShare = (baseKenShare(q, r) + rng.nextDouble(-0.06, 0.06)).coerceIn(0.05, 0.95)
    val kenStr = kenShare.fmt(4)
    val ryuStr = (1.0 - kenStr.toDouble()).fmt(4)
    val turnout = rng.nextDouble(0.55, 0.70)

    val districtId = initialDistrict(q, r)
    val county = countyId(q, r)
    val zoneName = when {
        r < -2  -> "North"
        r <= 2  -> "Central"
        else    -> "South"
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

// Count per initial district
val d1Count = hexes.count { initialDistrict(it.q, it.r) == "d1" }
val d2Count = hexes.count { initialDistrict(it.q, it.r) == "d2" }
val d3Count = hexes.count { initialDistrict(it.q, it.r) == "d3" }

val json = """{
  "format_version": "1",
  "id": "tutorial-002",
  "title": "Millbrook County: Three-District Challenge",
  "election_type": "state_house",
  "region": {
    "id": "millbrook_county",
    "name": "Millbrook County"
  },
  "geometry": { "type": "hex_axial" },
  "parties": [
    { "id": "ken", "name": "Ken Party", "abbreviation": "KEN" },
    { "id": "ryu", "name": "Ryu Party", "abbreviation": "RYU" }
  ],
  "districts": [
    { "id": "d1", "name": "District 1" },
    { "id": "d2", "name": "District 2" },
    { "id": "d3", "name": "District 3" }
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
      "description": "All three districts are in use and every precinct is assigned.",
      "criterion": { "type": "district_count" }
    },
    {
      "id": "sc-population-balance",
      "required": true,
      "description": "All three districts have roughly equal population (within 10%).",
      "criterion": { "type": "population_balance" }
    },
    {
      "id": "sc-compactness",
      "required": false,
      "description": "All districts are reasonably compact (compactness ≥ 40%).",
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
      "role": "Redistricting Commissioner, Millbrook County",
      "motivation": "Millbrook County needs new district boundaries. The three counties — North, Central, and South — each have different populations. Your job is to draw three districts with roughly equal population. The current county-aligned map is out of balance."
    },
    "intro_slides": [
      {
        "heading": "Welcome to Millbrook County",
        "body": "This is a larger map than the tutorial. Millbrook County has three regions: North, Central, and South. The current district boundaries follow county lines — but the populations aren't equal.\n\nYour job: adjust the boundaries so all three districts have roughly the same number of people."
      },
      {
        "heading": "The Tools",
        "body": "Select a district from the toolbar, then paint precincts to assign them. You don't need to redraw the entire map — just move a few boundary precincts to balance the populations.\n\nWatch the population balance indicator in the sidebar. When all three districts are within 10% of the target, the Submit button will activate."
      }
    ],
    "objective": "Balance the three districts so each has roughly equal population (within 10%). Move boundary precincts between districts to fix the imbalance."
  }
}
"""

val outFile = java.io.File("game/scenarios/tutorial-002.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path} (d1=$d1Count, d2=$d2Count, d3=$d3Count)")
