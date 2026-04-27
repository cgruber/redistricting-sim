#!/usr/bin/env kotlin
/**
 * Generator for scenario-007.json: "The Reform Map"
 *
 * Lesson: Neutral rules (compactness, equal population, contiguity) constrain
 * gerrymandering but don't eliminate partisan outcomes. Geography is politics.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Partisan geography:
 *   Urban core (|q|+|r|+|q+r| ≤ 4, inner ~37 hexes): ~25% Ken — strong Ryu
 *   Suburbs (ring 5–8): ~50% Ken — competitive
 *   Exurbs (ring 9–12, outer): ~65% Ken — strong Ken
 *   (ring = max(|q|,|r|,|q+r|), i.e. hex distance from center × 2)
 *
 * Initial assignment: 5 radial wedge slices (pizza slices) — non-compact,
 *   long thin districts radiating from center → fail compactness criterion.
 *   Each wedge mixes all three partisan zones → all districts competitive.
 *
 * Winning solution: any sufficiently compact, balanced map (many valid solutions).
 *   Compact districts naturally sort into: inner (Ryu-heavy) + outer (Ken-heavy).
 *   A ring-based split produces ~2 Ken, 1 swing, 2 Ryu — not a Ken sweep.
 *   Educational note: the "fair" geometric map still produces a partisan outcome
 *   driven by geographic sorting of voters, not by intent.
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), compactness ≥ 0.40
 *   Optional:  efficiency_gap ≤ 15% (show it's still nonzero even on "neutral" map)
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-007.main.kts
 */

import kotlin.math.abs
import kotlin.math.max
import kotlin.random.Random

val rng = Random(77)
val R = 6  // hex radius → 127 hexes

// Hex distance from origin (cube metric)
fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

// Partisan lean: urban core Ryu-heavy, exurbs Ken-heavy
fun baseKenShare(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> 0.25  // inner core: strong Ryu
        d <= 4 -> 0.45  // inner suburbs
        d == 5 -> 0.55  // outer suburbs: slight Ken lean
        else   -> 0.67  // exurbs: strong Ken
    }
}

// Initial: diagonal strips (q+r = constant) — thin slashes across the circle.
// These are extremely non-compact (a strip of width 1 along a diagonal has
// compactness ~22%) and population-imbalanced (outer diagonals have fewer hexes
// than central ones). Both population_balance and compactness will fail → submit
// is disabled; player must completely redraw.
//   k≤-3: 7+8+9+10 = 34 hexes  (D1, far too many)
//   k=-2,-1: 11+12 = 23         (D2)
//   k=0: 13                     (D3, far too few)
//   k=1,2: 12+11 = 23           (D4)
//   k≥3: 10+9+8+7 = 34         (D5, far too many)
fun initialDistrict(q: Int, r: Int): String {
    val k = q + r
    return when {
        k <= -3 -> "d1"
        k <= -1 -> "d2"
        k == 0  -> "d3"
        k <= 2  -> "d4"
        else    -> "d5"
    }
}

// County: inner ring vs outer ring
fun countyId(q: Int, r: Int): String {
    val d = hexDist(q, r)
    return if (d <= 3) "reform_central" else "reform_outer"
}

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

// Generate hex-of-hexes positions, sorted row-major
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
  "id": "scenario-007",
  "title": "The Reform Map",
  "election_type": "state_house",
  "region": {
    "id": "meridian_county",
    "name": "Meridian County"
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
      "description": "Even a geometrically neutral map has an efficiency gap — see how close to zero you can get (≤ 15%).",
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
      "role": "Independent Reform Commissioner, Meridian County",
      "motivation": "The legislature has deadlocked. A court has ordered an independent commission to draw a new map using only neutral criteria — equal population, geographic compactness, and contiguity. No partisan data allowed. Draw the fairest map you can."
    },
    "intro_slides": [
      {
        "heading": "The Promise of Neutral Rules",
        "body": "Reformers have long argued that if we just take politics out of redistricting — use an independent commission, apply mechanical criteria, ignore partisan data — the maps will be fair.\n\nMeridian County is your test case. Draw a map using only geometric rules: compact districts, equal population, no disconnected pieces. No partisan data. Just shapes."
      },
      {
        "heading": "The Geography Problem",
        "body": "Here's what nobody tells you: voters aren't distributed randomly. In Meridian County — as in most American counties — different communities cluster together. Urban neighborhoods vote differently from suburbs, which vote differently from exurbs.\n\nA perfectly geometric map doesn't erase that. It just captures it differently."
      },
      {
        "heading": "What the Map Will Show You",
        "body": "When you're done, submit your map and look at the results. You drew it without looking at party data. But the outcome won't be perfectly proportional.\n\nThis is called the geography problem. It's not a bug in your map — it's a feature of where people live. Neutral rules don't produce neutral outcomes. They produce different outcomes."
      }
    ],
    "objective": "Draw a compact, population-balanced map using only geometric criteria. No partisan data required — or allowed."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-007.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
