#!/usr/bin/env kotlin
/**
 * Generator for scenario-003.json: "The Packing Problem"
 *
 * Lesson: Packing — concentrate opposition voters into as few districts as
 * possible, wasting their votes in landslide wins.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Partisan geography (concentric):
 *   Urban core (d ≤ 2, 19 hexes): ~15% Ken / 85% Ryu — dense Ryu stronghold
 *   Suburban   (d = 3-4, 42 hexes): ~42% Ken / 58% Ryu — competitive Ryu-lean
 *   Rural      (d = 5-6, 66 hexes): ~65% Ken / 35% Ryu — reliable Ken
 *
 * Urban voters have higher turnout (65-75%) vs. rural/suburban (50-60%).
 *
 * Initial assignment: 5 angular wedge sectors from center to edge.
 *   Each sector spans all three zones → mixes urban+suburban+rural.
 *   D2/D3/D4 each get some urban core → ~45% Ken → Ryu wins.
 *   D1/D5 get mostly rural → ~62% Ken → Ken wins.
 *   Result: 2 Ken / 3 Ryu — fails ≥4 Ken seats criterion.
 *
 * Winning gerrymander: pack the urban core into one district.
 *   Pack all d ≤ 2 (19 hexes) + 6 nearby suburban hexes into D3 = 25 hexes.
 *   D3 → ~20% Ken → Ryu landslide (the sacrifice district).
 *   Remaining 4 districts: suburban + rural only → all Ken-majority.
 *   Result: 4 Ken / 1 Ryu ✓.
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), seat_count Ken ≥ 4
 *   Optional: efficiency_gap ≤ 15%
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-003.main.kts
 */

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.PI
import kotlin.random.Random

val rng = Random(43)
val R = 6

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

fun baseKenShare(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> 0.15  // urban core: strong Ryu
        d <= 4 -> 0.42  // suburban: competitive Ryu-lean
        else   -> 0.65  // rural: reliable Ken
    }
}

fun baseTurnout(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> 0.70  // urban: higher turnout
        d <= 4 -> 0.55  // suburban
        else   -> 0.55  // rural
    }
}

// Initial: 5 angular wedge sectors — each spans all zones → mixed results.
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

fun countyId(q: Int, r: Int): String {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> "riverport_city"
        d <= 4 -> "riverport_suburbs"
        else   -> "greenfield_county"
    }
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
    val turnout = baseTurnout(q, r) + rng.nextDouble(-0.05, 0.05)

    val districtId = initialDistrict(q, r)
    val county = countyId(q, r)
    val d = hexDist(q, r)
    val zoneName = when {
        d <= 2 -> "Downtown"
        d <= 4 -> "Suburbs"
        else   -> "Rural"
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
  "id": "scenario-003",
  "title": "Riverport: The Packing Problem",
  "election_type": "state_house",
  "region": {
    "id": "riverport_metro",
    "name": "Riverport Metro Area"
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
      "description": "Ken Party wins at least 4 of the 5 districts.",
      "criterion": {
        "type": "seat_count",
        "party": "ken",
        "operator": "gte",
        "count": 4
      }
    },
    {
      "id": "sc-efficiency-gap",
      "required": false,
      "description": "Packing creates a large efficiency gap — can you keep it under 15%?",
      "criterion": {
        "type": "efficiency_gap",
        "operator": "lte",
        "threshold": 0.15
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Ken Party Campaign Strategist, Riverport Metro",
      "motivation": "The Ken Party controls the state legislature but is losing ground in Riverport's urban core. The Ryu Party's voters are concentrated downtown — a liability if you know how to exploit it. Your job: draw a map that locks in 4 of 5 seats by packing their voters into one unwinnable district."
    },
    "intro_slides": [
      {
        "heading": "The Urban Problem",
        "body": "Riverport's downtown is a Ryu stronghold — dense, politically active, and growing. If you let those voters spread across multiple districts, they could flip seats.\n\nBut concentration is a weakness. If all those Ryu voters end up in the same district, they win it by a landslide — and waste thousands of votes that could have helped them elsewhere."
      },
      {
        "heading": "The Packing Play",
        "body": "Packing means drawing one district that your opponents win overwhelmingly — 80%, 85%, even 90%. Every vote above 50%+1 is wasted. Meanwhile, you spread your own voters efficiently across the remaining districts, winning each by a comfortable but not wasteful margin.\n\nThe result: they win one seat by a landslide. You win four seats by steady margins."
      },
      {
        "heading": "The Efficiency Gap",
        "body": "Political scientists measure this with the efficiency gap — the difference in wasted votes between the two parties. A packed map has a huge efficiency gap: the opposition wastes votes in their landslide district, while the mapmaker wastes very few.\n\nDraw your map. Then look at the efficiency gap and see what packing costs."
      }
    ],
    "objective": "Pack Ryu voters into as few districts as possible. Ken Party must win at least 4 of 5 seats."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-003.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
