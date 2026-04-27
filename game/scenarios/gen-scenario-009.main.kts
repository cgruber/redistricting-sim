#!/usr/bin/env kotlin
/**
 * Generator for scenario-009.json: "Cats vs. Dogs"
 *
 * Lesson: Tone break — same mechanics, ridiculous premise. Cat Party bosses
 * want to lock in their majority and squeeze out the Dog Party forever.
 * Reinforces packing/cracking mechanics in a low-stakes, silly context.
 *
 * Shape: hex-of-hexes, radius 6 → 127 precincts, 5 districts of ~25-26.
 * Coordinates: axial, centered at (0,0); range q,r in [-6,6].
 *
 * Parties: "cat" (Cat Party / CAT) and "dog" (Dog Party / DOG).
 *
 * Partisan geography (ring-based — Cats are the urban party):
 *   Inner core (d ≤ 2, 19 hexes): ~82% Cat — Cat stronghold
 *   Middle ring (d = 3-4, 42 hexes): ~72% Cat — Cat-leaning suburbs
 *   Outer ring (d = 5-6, 66 hexes): ~42% Cat — Dog-leaning exurbs
 *   → Region overall: ~58% Cat, 42% Dog
 *
 * Initial assignment: 5 horizontal slabs (constant-r bands).
 *   Rows in hex-of-hexes vary in width (7 to 13 hexes), so horizontal
 *   slabs are population-imbalanced AND non-compact for outer rows.
 *   Both population_balance and compactness fail → submit disabled.
 *
 *   Approximate row-band hex counts:
 *     D1: r ≥ 3  → 34 hexes (too many)
 *     D2: r = 1,2 → 23 hexes
 *     D3: r = 0   → 13 hexes (too few)
 *     D4: r = -2,-1 → 23 hexes
 *     D5: r ≤ -3 → 34 hexes (too many)
 *   → population_balance and compactness both fail.
 *
 * Winning solution: 5 compact radial-ish districts.
 *   1 inner Cat district (d ≤ 2 + some d=3): ~80% Cat → safe Cat
 *   2 middle Cat districts (mostly d=3-4): ~72% Cat → safe Cat
 *   2 outer districts (mostly d=5-6): ~42% Cat → Dog wins
 *   → Cat: 3 safe seats ✓; Dog: 2 seats
 *
 * Success criteria:
 *   Required: district_count, population_balance (±10%), compactness ≥ 0.40,
 *             safe_seats (cat, margin ≥ 0.15, min_count 3)
 *   Optional: safe_seats (dog, margin ≥ 0.15, min_count 1) — throw the dogs a bone
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-009.main.kts
 */

import kotlin.math.abs
import kotlin.random.Random

val rng = Random(99)
val R = 6

fun hexDist(q: Int, r: Int): Int = (abs(q) + abs(r) + abs(q + r)) / 2

// Cat share by ring distance: Cats are the urban party (inner = Cat stronghold)
fun baseCatShare(q: Int, r: Int): Double {
    val d = hexDist(q, r)
    return when {
        d <= 2 -> 0.82  // Cat urban core
        d <= 4 -> 0.72  // Cat suburban lean
        else   -> 0.42  // Dog-leaning exurbs
    }
}

// Initial: horizontal slabs by r value.
// Rows in hex-of-hexes vary in width → population imbalance; wide outer slabs → non-compact.
//   r ≥ 3: 34 hexes → D1 (too many)
//   r = 1..2: 23 hexes → D2
//   r = 0: 13 hexes → D3 (too few)
//   r = -2..-1: 23 hexes → D4
//   r ≤ -3: 34 hexes → D5 (too many)
fun initialDistrict(r: Int): String = when {
    r >= 3  -> "d1"
    r >= 1  -> "d2"
    r == 0  -> "d3"
    r >= -2 -> "d4"
    else    -> "d5"
}

fun countyId(q: Int, r: Int): String {
    val d = hexDist(q, r)
    return if (d <= 3) "catville" else "dogdale"
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

    val catShare = (baseCatShare(q, r) + rng.nextDouble(-0.04, 0.04)).coerceIn(0.05, 0.95)
    val catStr = catShare.fmt(4)
    val dogStr = (1.0 - catStr.toDouble()).fmt(4)
    val turnout = rng.nextDouble(0.55, 0.70)

    val districtId = initialDistrict(r)
    val county = countyId(q, r)
    val d = hexDist(q, r)
    val zoneName = when {
        d <= 2 -> "Catville"
        d <= 4 -> "Midtown"
        else   -> "Dogdale"
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
          "vote_shares": { "cat": $catStr, "dog": $dogStr }
        }
      ]
    }""")
}

val json = """{
  "format_version": "1",
  "id": "scenario-009",
  "title": "Cats vs. Dogs",
  "election_type": "state_house",
  "region": {
    "id": "pawprint_county",
    "name": "Pawprint County"
  },
  "geometry": { "type": "hex_axial" },
  "parties": [
    { "id": "cat", "name": "Cat Party", "abbreviation": "CAT" },
    { "id": "dog", "name": "Dog Party", "abbreviation": "DOG" }
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
      "description": "Districts must be geographically compact — no sprawling fur-balls (compactness ≥ 40%).",
      "criterion": {
        "type": "compactness",
        "operator": "gte",
        "threshold": 0.40
      }
    },
    {
      "id": "sc-safe-seats-cat",
      "required": true,
      "description": "The Cat Party must lock in at least 3 safe districts (winning margin ≥ 15 points).",
      "criterion": {
        "type": "safe_seats",
        "party": "cat",
        "margin": 0.15,
        "min_count": 3
      }
    },
    {
      "id": "sc-safe-seats-dog",
      "required": false,
      "description": "Even dogs deserve one safe seat — can you give the Dog Party at least 1 district won by 15+ points?",
      "criterion": {
        "type": "safe_seats",
        "party": "dog",
        "margin": 0.15,
        "min_count": 1
      }
    }
  ],
  "narrative": {
    "character": {
      "name": "You",
      "role": "Chief Map Strategist, Cat Party",
      "motivation": "The Cat Party has controlled Pawprint County's legislature for years and intends to keep it that way. The census just came in. The lines need redrawing. Your job: make sure the Cats win at least three unlosable districts. The dogs are loud, but they don't have to be numerous."
    },
    "intro_slides": [
      {
        "heading": "It's a Dog-Eat-Cat World",
        "body": "The Cat Party has held the majority in Pawprint County for years. The Dog Party has been nipping at their heels.\n\nThe census data is in. Boundaries must be redrawn. The Cat Party leadership has called you in for one reason: make it stick."
      },
      {
        "heading": "The Math",
        "body": "Cats make up about 60% of Pawprint County's voters — a comfortable majority in the urban core, but the outer precincts are more competitive.\n\nLeft to chance, those outer districts could swing either way. Your job is to take chance out of the equation. Draw lines that turn a majority into a durable map."
      },
      {
        "heading": "Same Game, Different Fur",
        "body": "You've seen this before — packing, cracking, population balance, compactness. The tools are the same whether you're drawing for Cats, Dogs, Ken, Ryu, or anyone else.\n\nThe rules of redistricting don't care about the players. Only the lines matter."
      }
    ],
    "objective": "Draw a compact, population-balanced map that locks in at least 3 safe Cat Party districts (winning margin ≥ 15 points). Bonus: leave the dogs one safe seat to chew on."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-009.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts to ${outFile.path}")
