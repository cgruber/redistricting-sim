#!/usr/bin/env kotlin
/**
 * Generator for scenario-002.json: "Give the Governor a Win"
 *
 * Layout: 8 columns (q=0..7) × 12 rows (r=0..11) = 96 precincts, 4 districts of 24.
 *
 * Zones:
 *   North     (r=0..5, all q):    60% Ken / 40% Ryu — Ken-leaning
 *   Southwest (q=0..3, r=6..11):  52% Ken / 48% Ryu — competitive Ken-lean
 *   Southeast (q=4..7, r=6..11):  25% Ken / 75% Ryu — strong Ryu
 *
 * Initial assignment (vertical 2-column strips):
 *   D1=q0-1, D2=q2-3, D3=q4-5, D4=q6-7
 *
 * Initial outcome:
 *   D1,D2 each get north+SW → ~56% Ken → KEN wins
 *   D3,D4 each get north+SE → ~42% Ken → RYU wins
 *   Result: 2 Ken / 2 Ryu (fails the ≥3 Ken criterion)
 *
 * Winning gerrymander (what player must discover):
 *   D1=q0-1 all rows,  D2=q2-3 all rows  → 56% Ken each
 *   D3=q4-7 r=0-5      (all-north band)   → 60% Ken
 *   D4=q4-7 r=6-11     (all-SE band)      → 25% Ken (Ryu sacrificed district)
 *   Result: 3 Ken / 1 Ryu ✓
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-002.main.kts
 */

import kotlin.math.abs
import kotlin.random.Random

val rng = Random(42)
val NUM_Q = 8
val NUM_R = 12
val BASE_POP = 1500

fun zone(q: Int, r: Int) = when {
    r <= 5 -> "north"
    q <= 3 -> "southwest"
    else   -> "southeast"
}

fun initialDistrict(q: Int, r: Int) = when {
    q <= 1 -> "d1"
    q <= 3 -> "d2"
    q <= 5 -> "d3"
    else   -> "d4"
}

fun countyId(q: Int, r: Int) = when {
    r <= 5 -> "clearwater_north"
    q <= 3 -> "clearwater_west"
    else   -> "clearwater_east"
}

fun colLetter(q: Int) = "ABCDEFGH"[q].toString()

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

val precincts = StringBuilder()
var first = true

for (r in 0 until NUM_R) {
    for (q in 0 until NUM_Q) {
        val idx = r * NUM_Q + q
        val pid = "p%03d".format(idx + 1)
        val z = zone(q, r)

        val baseKen = when (z) {
            "north"     -> 0.60
            "southwest" -> 0.52
            else        -> 0.25
        }
        val delta = rng.nextDouble(-0.03, 0.03)
        val kenShare = (baseKen + delta).coerceIn(0.05, 0.95)
        val ryuShare = 1.0 - kenShare

        val pop = BASE_POP + rng.nextInt(-100, 101)
        val turnout = rng.nextDouble(0.52, 0.62)
        val districtId = initialDistrict(q, r)
        val county = countyId(q, r)
        val zoneName = z.split("_").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
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
      "description": "The Ken Party wins at least 3 of the 4 districts.",
      "criterion": {
        "type": "seat_count",
        "party": "ken",
        "operator": "gte",
        "count": 3
      }
    },
    {
      "id": "sc-compact",
      "required": false,
      "description": "Districts have compact, reasonable shapes — a clean gerrymander.",
      "criterion": {
        "type": "compactness",
        "operator": "gte",
        "threshold": 0.4
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Campaign Strategist, Ken Party State Committee",
      "motivation": "The Governor's party needs a State House majority. The votes are there — if the lines are drawn right."
    },
    "intro_slides": [
      {
        "heading": "The Governor Needs a Win",
        "body": "Clearwater County is up for redistricting. The current map gives each party two of the four seats — a stalemate.\n\nThe Governor's party, the Ken Party, wants three seats. Your job: draw the lines to make it happen."
      },
      {
        "heading": "Same Votes. Different Lines.",
        "body": "The county's voters haven't changed. But where you draw the district boundaries determines which party wins each seat.\n\nThe north leans Ken. The southeast leans Ryu. The trick is deciding which precincts end up together — and who gets packed into a losing district."
      }
    ],
    "objective": "Draw 4 districts so the Ken Party wins at least 3 seats."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-002.json")
outFile.writeText(json)
println("Wrote ${NUM_Q * NUM_R} precincts to ${outFile.path}")
