#!/usr/bin/env kotlin
/**
 * Generator for scenario-005.json: "Valle Verde: A Voice for the Valley"
 *
 * Lesson: Voting Rights Act (VRA) / majority-minority districts.
 *
 * Layout: 10 columns (q=0..9) × 12 rows (r=0..11) = 120 precincts, 5 districts of 24.
 *
 * Zones:
 *   Valley (q=3..8, r=5..8): 6 cols × 4 rows = 24 precincts — Latino-concentrated
 *     Latino share: ~70%; Anglo share: ~30%
 *     Ken-leaning community (~78% Ken)
 *   Rim (everything else): 96 precincts — Anglo-majority
 *     Latino share: ~20%; Anglo share: ~80%
 *     Ryu-leaning (~62% Ryu)
 *
 * Initial assignment: vertical 2-column strips (q=0–1, q=2–3, q=4–5, q=6–7, q=8–9)
 *   Cracks the valley across D2, D3, D4, D5 — no district reaches 50% Latino:
 *     D1 (q=0–1): 0 valley pcts   → ~20% Latino   ← fails VRA ✓
 *     D2 (q=2–3): 4 valley pcts   → ~28% Latino   ← fails VRA ✓
 *     D3 (q=4–5): 8 valley pcts   → ~37% Latino   ← fails VRA ✓
 *     D4 (q=6–7): 8 valley pcts   → ~37% Latino   ← fails VRA ✓
 *     D5 (q=8–9): 4 valley pcts   → ~28% Latino   ← fails VRA ✓
 *
 * Winning solution: consolidate the valley into one district (q=3..8, r=5..8)
 *   → 70% Latino → majority-minority criterion satisfied ✓
 *   Educational note: this also packs Ken votes into one district — the remaining
 *   four districts become more Ryu-leaning. VRA compliance creates a tradeoff.
 *
 * demographic_groups schema:
 *   group_schema: { dimensions: { ethnicity: [latino, anglo] } }
 *   Each precinct has exactly 2 groups (one per ethnicity value).
 *   majority_minority criterion uses: { dimension: "ethnicity", value: "latino" }
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-005.main.kts
 */

import kotlin.random.Random

val rng = Random(55)
val NUM_Q = 10
val NUM_R = 12
val BASE_POP = 1500

fun isValley(q: Int, r: Int) = q in 3..8 && r in 5..8

// Initial assignment: vertical 2-column strips
fun initialDistrict(q: Int, r: Int): String = when {
    q <= 1 -> "d1"
    q <= 3 -> "d2"
    q <= 5 -> "d3"
    q <= 7 -> "d4"
    else   -> "d5"
}

fun countyId(q: Int, r: Int) = when {
    isValley(q, r) -> "valle_verde_valley"
    r <= 4         -> "valle_verde_north"
    else           -> "valle_verde_south"
}

fun colLetter(q: Int) = "ABCDEFGHIJ"[q].toString()

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

val precincts = StringBuilder()
var first = true

for (r in 0 until NUM_R) {
    for (q in 0 until NUM_Q) {
        val idx = r * NUM_Q + q
        val pid = "p%03d".format(idx + 1)
        val valley = isValley(q, r)

        val pop = BASE_POP + rng.nextInt(-150, 151)

        // Latino population share (of total_population)
        val latinoShare = if (valley) {
            (0.70 + rng.nextDouble(-0.04, 0.04)).coerceIn(0.60, 0.80)
        } else {
            (0.20 + rng.nextDouble(-0.04, 0.04)).coerceIn(0.10, 0.32)
        }
        // Ensure shares sum exactly to 1.0 (avoid floating-point accumulation in loader)
        val latinoShareStr = latinoShare.fmt(4)
        val angloShare = 1.0 - latinoShareStr.toDouble()
        val angloShareStr = angloShare.fmt(4)

        // Vote shares: Latino community strongly Ken-leaning; Anglo community leans Ryu
        val latinoKen = (0.78 + rng.nextDouble(-0.03, 0.03)).coerceIn(0.05, 0.95)
        val latinoKenStr = latinoKen.fmt(4)
        val latinoRyuStr = (1.0 - latinoKenStr.toDouble()).fmt(4)

        val angloKen = (0.38 + rng.nextDouble(-0.03, 0.03)).coerceIn(0.05, 0.95)
        val angloKenStr = angloKen.fmt(4)
        val angloRyuStr = (1.0 - angloKenStr.toDouble()).fmt(4)

        val latinoTurnout = rng.nextDouble(0.52, 0.62)
        val angloTurnout = rng.nextDouble(0.58, 0.68)

        val districtId = initialDistrict(q, r)
        val county = countyId(q, r)
        val zoneName = if (valley) "Valley" else "Rim"
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
          "id": "${pid}-latino",
          "name": "Latino residents",
          "population_share": $latinoShareStr,
          "turnout_rate": ${latinoTurnout.fmt(2)},
          "vote_shares": { "ken": $latinoKenStr, "ryu": $latinoRyuStr },
          "dimensions": { "ethnicity": "latino" }
        },
        {
          "id": "${pid}-anglo",
          "name": "Anglo residents",
          "population_share": $angloShareStr,
          "turnout_rate": ${angloTurnout.fmt(2)},
          "vote_shares": { "ken": $angloKenStr, "ryu": $angloRyuStr },
          "dimensions": { "ethnicity": "anglo" }
        }
      ]
    }""")
    }
}

val json = """{
  "format_version": "1",
  "id": "scenario-005",
  "title": "Valle Verde: A Voice for the Valley",
  "election_type": "state_house",
  "region": {
    "id": "valle_verde_county",
    "name": "Valle Verde County"
  },
  "geometry": { "type": "hex_axial" },
  "group_schema": {
    "dimensions": { "ethnicity": ["latino", "anglo"] },
    "eligibility_rules": []
  },
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
      "id": "sc-majority-minority",
      "required": true,
      "description": "At least one district must have a Latino population of 50% or more — giving the Valley community a fair opportunity to elect their preferred representative.",
      "criterion": {
        "type": "majority_minority",
        "group_filter": { "dimension": "ethnicity", "value": "latino" },
        "min_eligible_share": 0.50,
        "min_districts": 1
      }
    },
    {
      "id": "sc-compactness",
      "required": false,
      "description": "All districts are reasonably compact — the Valley district hugs the Valley, not a long tendril reaching for favorable precincts (compactness ≥ 35%).",
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
      "role": "Court-Appointed Redistricting Coordinator, Valle Verde County",
      "motivation": "A federal court found that the current district map violates the Voting Rights Act. The Valley's Latino community has been cracked across four districts — diluted so thoroughly that they cannot elect their preferred candidate anywhere. You must draw a new map that complies with the law."
    },
    "intro_slides": [
      {
        "heading": "The Valley Grows",
        "body": "Over the past decade, Valle Verde County's Valley has seen significant population growth. The Latino community, concentrated in this area, now makes up a meaningful share of the county's total population.\n\nBut on the current map, drawn ten years ago, the Valley is sliced into four strips — each one a piece of a different district, none large enough to matter."
      },
      {
        "heading": "The Voting Rights Act",
        "body": "Section 2 of the Voting Rights Act prohibits maps that dilute minority voting power. When a minority community is sufficiently large, geographically compact, and politically cohesive, mapmakers must give them a fair opportunity to elect their preferred representative.\n\nThe Valley meets all three conditions. A court has already ruled that the current map is illegal. Your job is to fix it."
      },
      {
        "heading": "A Tradeoff You'll See",
        "body": "Creating a majority-Latino district solves the legal problem — but notice what happens to the surrounding districts. Concentrating a cohesive voting bloc into one place can shift the balance everywhere else.\n\nThis is one of the real tensions in redistricting. Even compliance with a fairness law reshapes who wins and loses. There is no map without consequences."
      }
    ],
    "objective": "Draw at least one majority-Latino district (≥ 50% Latino population) to give the Valley community a fair chance to elect their preferred representative."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-005.json")
outFile.writeText(json)
println("Wrote ${NUM_Q * NUM_R} precincts to ${outFile.path}")
