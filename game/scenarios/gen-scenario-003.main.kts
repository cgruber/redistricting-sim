#!/usr/bin/env kotlin
/**
 * Generator for scenario-003.json: "The Packing Problem"
 *
 * Layout: 10 columns (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts of 24.
 *
 * Zones:
 *   Urban core   (q=3..6, r=3..8): 15% Ken / 85% Ryu — dense Ryu stronghold to pack
 *   Suburban     (one step outside core, approx q=2..7 excl. core OR r=2..9 excl. core):
 *                                   42% Ken / 58% Ryu — competitive Ryu-lean
 *   Rural        (everything else): 65% Ken / 35% Ryu — reliable Ken
 *
 * Initial assignment (vertical 2-column strips):
 *   D1=q0-1, D2=q2-3, D3=q4-5, D4=q6-7, D5=q8-9
 *
 * Initial outcome: each district has a slice of urban core + suburbs + rural.
 *   Urban core slice → each district ~4-5 Ryu precincts out of 24 → not enough to flip most.
 *   Actually the core is 4 cols × 6 rows = 24 precincts = entire D3 could be packed.
 *   With vertical strips: D2 gets q=2-3∩core (r=3-8 for q=3 only → 6 precincts),
 *                         D3 gets q=4-5∩core (r=3-8 → 12 precincts),
 *                         D4 gets q=6-7∩core (r=3-8 for q=6 only → 6 precincts).
 *   D2: 6 urban + 18 rural/suburban → enough rural to pull Ken over 50%? Roughly:
 *     suburban ≈ 8 precincts, rural ≈ 10 precincts
 *     avg ≈ (6×0.15 + 8×0.42 + 10×0.65)/24 ≈ (0.9+3.36+6.5)/24 ≈ 10.76/24 ≈ 0.45 → RYU wins
 *   D3: 12 urban + 12 rural/suburban → avg ≈ (12×0.15 + 6×0.42 + 6×0.65)/24 ≈ (1.8+2.52+3.9)/24
 *     ≈ 8.22/24 ≈ 0.34 → RYU wins
 *   D4: similar to D2 → 0.45 → RYU wins
 *   D1, D5: no urban core → mostly rural + outer suburban → ~62% Ken → KEN wins
 *   Result: 2 Ken / 3 Ryu (fails ≥3 Ken required criterion)
 *
 * Winning gerrymander (pack the urban core):
 *   Pack all urban core (q=3..6, r=3..8) into D3 = 24 precincts, all Ryu → D3 is the sacrifice
 *   Remaining 4 districts share: rural + suburban only → all Ken-majority → 4 Ken / 1 Ryu ✓
 *   But q=3..6 r=3..8 = 4×6 = 24 precincts exactly — one full district.
 *   Need to move: q=3∩non-core from D2 → swap with some of D3's non-core precincts.
 *   Simpler approach: player paints q=3-6, r=3-8 into D3 (the core), then rebalances D2 and D4.
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-003.main.kts
 */

import kotlin.random.Random

val rng = Random(43)
val NUM_Q = 10
val NUM_R = 12
val BASE_POP = 1500

fun isUrbanCore(q: Int, r: Int) = q in 3..6 && r in 3..8

fun isSuburban(q: Int, r: Int): Boolean {
    if (isUrbanCore(q, r)) return false
    // One hex ring outside the core bounding box
    return q in 2..7 && r in 2..9
}

fun zone(q: Int, r: Int) = when {
    isUrbanCore(q, r) -> "urban"
    isSuburban(q, r)  -> "suburban"
    else              -> "rural"
}

fun initialDistrict(q: Int, r: Int) = when {
    q <= 1 -> "d1"
    q <= 3 -> "d2"
    q <= 5 -> "d3"
    q <= 7 -> "d4"
    else   -> "d5"
}

fun countyId(q: Int, r: Int) = when {
    isUrbanCore(q, r) -> "riverport_city"
    isSuburban(q, r)  -> "riverport_suburbs"
    else              -> "riverport_rural"
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
            "urban"    -> 0.15
            "suburban" -> 0.42
            else       -> 0.65
        }
        val delta = rng.nextDouble(-0.03, 0.03)
        val kenShare = (baseKen + delta).coerceIn(0.05, 0.95)
        val ryuShare = 1.0 - kenShare

        val pop = BASE_POP + rng.nextInt(-100, 101)
        val turnout = when (z) {
            "urban" -> rng.nextDouble(0.65, 0.75)  // higher urban turnout
            else    -> rng.nextDouble(0.50, 0.60)
        }
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
  "id": "scenario-003",
  "title": "Riverport: The Packing Problem",
  "election_type": "state_house",
  "region": {
    "id": "riverport_county",
    "name": "Riverport County"
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
      "description": "The Ken Party wins at least 4 of the 5 districts.",
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
      "description": "The efficiency gap is 15% or less — a statistically efficient gerrymander.",
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
      "role": "Redistricting Consultant, Ken Party Majority Caucus",
      "motivation": "Riverport has a large urban core that votes overwhelmingly Ryu. Your job is to contain that bloc — concentrate it into one district, and let Ken dominate the rest."
    },
    "intro_slides": [
      {
        "heading": "The City Votes Ryu",
        "body": "Riverport's urban core is a Ryu stronghold. In the current map, that bloc is spread across three districts — pulling each one toward Ryu.\n\nYour job: stop spreading those votes around."
      },
      {
        "heading": "Pack Them In",
        "body": "Packing means drawing one district to absorb as many opposition voters as possible.\n\nWhen you pack Ryu voters into a single district, they win it by a landslide — but all those extra votes are wasted. The other four districts become safe Ken territory."
      }
    ],
    "objective": "Pack the Ryu stronghold into one district so the Ken Party wins at least 4 of the 5 seats."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-003.json")
outFile.writeText(json)
println("Wrote ${NUM_Q * NUM_R} precincts to ${outFile.path}")
