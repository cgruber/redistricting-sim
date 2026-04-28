#!/usr/bin/env kotlin
/**
 * Generator for scenario-004.json: "Cracking the Opposition"
 *
 * Lesson: Cracking — dilute a concentrated opposition group by splitting
 * it across multiple districts so it can't form a majority anywhere.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Partisan geography (corridor through center):
 *   Corridor (r = 0, 13 hexes): ~18% Ken / 82% Ryu — narrow Ryu band
 *   Upper/lower (r ≠ 0, 114 hexes): ~65% Ken / 35% Ryu — Ken territory
 *
 * Initial assignment: horizontal r-band slabs that consolidate the corridor.
 *   D3 gets r=-1..1 (37 hexes) — too many, but contains the corridor → Ryu wins.
 *   D1,D2,D4,D5 are upper/lower bands → Ken wins.
 *   Result: 4 Ken / 1 Ryu — fails the ≥5 Ken (all seats) criterion.
 *   Also fails population_balance (37 vs 11 hexes per slab).
 *
 * Winning gerrymander: crack the corridor across all 5 districts.
 *   Vertical-ish strips or angular sectors: each crosses the corridor,
 *   picking up only ~7 Ryu precincts out of ~25.
 *   Average Ken per district ≈ (7×0.18 + 18×0.65)/25 ≈ 52% → Ken wins all 5.
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), seat_count Ken = 5
 *   Optional: mean_median ≤ 10%
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-004.main.kts
 */

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.PI
import kotlin.random.Random

val rng = Random(44)
val R = 6

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

fun isCorridor(q: Int, r: Int): Boolean = r == 0 && hexDist(q, r) <= R

fun baseKenShare(q: Int, r: Int): Double = when {
    isCorridor(q, r) -> 0.18  // corridor: strong Ryu
    else              -> 0.65  // upper/lower: reliable Ken
}

// Initial: horizontal r-band slabs that consolidate the corridor into D3.
fun initialDistrict(q: Int, r: Int): String = when {
    r >= 3  -> "d1"
    r == 2  -> "d2"
    r >= -1 -> "d3"
    r == -2 -> "d4"
    else    -> "d5"
}

fun countyId(q: Int, r: Int): String = when {
    abs(r) <= 1 -> "lakeview_central"
    r > 0       -> "lakeview_north"
    else        -> "lakeview_south"
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
    val corridor = isCorridor(q, r)
    val zoneName = if (corridor) "Lakeshore" else if (r > 0) "North" else "South"
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
      "id": "sc-ken-all-seats",
      "required": true,
      "description": "Ken Party wins every seat — all 5 districts.",
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
      "description": "How skewed is your map? Mean-median gap ≤ 10%.",
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
      "role": "Ken Party Redistricting Director, Lakeview County",
      "motivation": "Last cycle, the Ryu Party won a seat in Lakeview by concentrating their voters along the lakeshore corridor. The Ken Party wants that seat back — and every other seat too. Your job: split the corridor so Ryu voters can't form a majority anywhere."
    },
    "intro_slides": [
      {
        "heading": "The Corridor",
        "body": "A narrow band of Ryu voters runs through the center of Lakeview County — along the lakeshore, where the apartments are dense and the politics lean hard Ryu.\n\nRight now, if those voters are in one district, they win it. Your predecessor let that happen. You won't."
      },
      {
        "heading": "The Cracking Play",
        "body": "Cracking is the opposite of packing. Instead of concentrating the opposition, you split them. Draw district lines that cut through the corridor, dividing Ryu voters across multiple districts.\n\nIn each district, the corridor's Ryu precincts are outnumbered by the surrounding Ken territory. Ryu voters still vote — but they lose everywhere."
      },
      {
        "heading": "The Disappearing Voice",
        "body": "Notice what happens: a community that could win one seat now wins zero. Their total vote count hasn't changed. Their turnout hasn't dropped. But the lines moved, and their voice vanished.\n\nThis is what cracking does. It doesn't silence voters — it dilutes them until they don't matter."
      }
    ],
    "objective": "Crack the Ryu corridor across all 5 districts. Ken Party must win every seat."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-004.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
