#!/usr/bin/env kotlin
/**
 * Generator for tutorial-003.json: "Hawthorn Bend — A Tour of the Map"
 *
 * Tutorial-campaign scenario that introduces all four terrain annotations in one map:
 *   - foothill   (precincts adjacent to mountain tiles)
 *   - lakeside   (precincts adjacent to lake tiles, plus one explicit + internal lake)
 *   - riverside  (precincts on river edges)
 *   - coast      (precincts adjacent to sea tiles)
 *
 * Geography is cosmetic — `river_blocks_contiguity: false`. The initial quadrant
 * assignment is already contiguous and population-balanced, so the player can submit
 * immediately or repaint to experiment.
 *
 * Shape: 6 × 6 rectangular hex cluster (36 precincts), q=0..5, r=-3..2.
 *
 * Terrain placement:
 *   Mountain tiles at (1,-4), (2,-4), (3,-4) — row r=-3 precincts (0..4,-3) become foothill.
 *   Lake tile at (6,-2) — precincts (5,-2) and (5,-1) become lakeside.
 *   Sea tiles at (1,3), (2,3), (3,3) — precincts (1..4, 2) become coast.
 *   River: 5 edges along the r=-1/r=0 boundary, q=0..2 — (0..2, -1) and (0..2, 0) become riverside.
 *   Internal lake: (0,2) explicitly authored with terrain:"lakeside" + has_internal_lake:true
 *                  to showcase the ellipse rendering on a precinct without a neighboring lake tile.
 *
 * Initial assignment: 4 quadrants of 9 precincts each:
 *   d1 top-left  (q=0..2, r=-3..-1), d2 top-right (q=3..5, r=-3..-1),
 *   d3 bottom-left (q=0..2, r=0..2), d4 bottom-right (q=3..5, r=0..2).
 *
 * Demographics: 2 parties (Ash, Birch), small jitter, no strong partisan story.
 *
 * Run from repo root:
 *   ./game/scenarios/gen-tutorial-003.main.kts
 */

import kotlin.random.Random

val rng = Random(42)

data class Hex(val q: Int, val r: Int) {
    val id: String get() = "p_${q}_${r}".replace("-", "n")
}

// Precincts: 6 columns × 6 rows (r=-3..2, q=0..5)
val precincts = buildList {
    for (r in -3..2) {
        for (q in 0..5) {
            add(Hex(q, r))
        }
    }
}

// Initial quadrant assignment.
fun initialDistrict(h: Hex): String = when {
    h.q < 3 && h.r < 0 -> "d1"   // top-left
    h.q >= 3 && h.r < 0 -> "d2"  // top-right
    h.q < 3 && h.r >= 0 -> "d3"  // bottom-left
    else -> "d4"                  // bottom-right
}

// Mild partisan jitter — no specific lesson, just realistic variation.
fun baseAshShare(h: Hex): Double = 0.50

val BASE_POP = 1000

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

// Precinct (0,2) gets explicit lakeside + has_internal_lake to showcase the ellipse on
// a precinct that isn't adjacent to a lake tile.
val internalLakePrecincts = setOf(Hex(0, 2))

val precinctsJson = buildString {
    var first = true
    for (h in precincts) {
        if (!first) append(",\n")
        first = false
        val pop = BASE_POP + rng.nextInt(-100, 101)
        val ashShare = (baseAshShare(h) + rng.nextDouble(-0.06, 0.06)).coerceIn(0.05, 0.95)
        val ashStr = ashShare.fmt(4)
        val birchStr = (1.0 - ashStr.toDouble()).fmt(4)
        val turnout = rng.nextDouble(0.55, 0.70).fmt(2)
        val name = "(${h.q},${h.r})"
        val hasInternalLake = h in internalLakePrecincts
        val extraFields = if (hasInternalLake) {
            ",\n      \"terrain\": \"lakeside\",\n      \"has_internal_lake\": true"
        } else ""
        append("""    {
      "id": "${h.id}",
      "editable": true,
      "position": { "q": ${h.q}, "r": ${h.r} },
      "total_population": $pop,
      "initial_district_id": "${initialDistrict(h)}",
      "name": "$name"$extraFields,
      "demographic_groups": [
        {
          "id": "${h.id}-all",
          "name": "All voters",
          "population_share": 1.0,
          "turnout_rate": $turnout,
          "vote_shares": { "ash": $ashStr, "birch": $birchStr }
        }
      ]
    }""")
    }
}

// River: 5 edges along the r=-1 / r=0 boundary, western half (q=0..2).
val riverEdges = listOf(
    Hex(0, -1) to Hex(0, 0),     // down across (0,-1)
    Hex(1, -1) to Hex(0, 0),     // lower-left from (1,-1)
    Hex(1, -1) to Hex(1, 0),     // down across (1,-1)
    Hex(2, -1) to Hex(1, 0),     // lower-left from (2,-1)
    Hex(2, -1) to Hex(2, 0),     // down across (2,-1)
)

val riverEdgesJson = riverEdges.joinToString(",\n") { (a, b) ->
    "    [\"${a.id}\", \"${b.id}\"]"
}

val json = """{
  "format_version": "1",
  "id": "tutorial-003",
  "title": "Hawthorn Bend — A Tour of the Map",
  "election_type": "state_house",
  "region": {
    "id": "hawthorn_bend",
    "name": "Hawthorn Bend"
  },
  "geometry": { "type": "hex_axial" },
  "parties": [
    { "id": "ash", "name": "Ash Party", "abbreviation": "ASH" },
    { "id": "birch", "name": "Birch Party", "abbreviation": "BIR" }
  ],
  "districts": [
    { "id": "d1", "name": "District 1" },
    { "id": "d2", "name": "District 2" },
    { "id": "d3", "name": "District 3" },
    { "id": "d4", "name": "District 4" }
  ],
  "default_district_id": "d1",
  "precincts": [
$precinctsJson
  ],
  "terrain_tiles": [
    { "position": { "q": 1, "r": -4 }, "type": "mountain" },
    { "position": { "q": 2, "r": -4 }, "type": "mountain" },
    { "position": { "q": 3, "r": -4 }, "type": "mountain" },
    { "position": { "q": 6, "r": -2 }, "type": "lake" },
    { "position": { "q": 1, "r":  3 }, "type": "sea" },
    { "position": { "q": 2, "r":  3 }, "type": "sea" },
    { "position": { "q": 3, "r":  3 }, "type": "sea" }
  ],
  "river_edges": [
$riverEdgesJson
  ],
  "river_blocks_contiguity": false,
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
    }
  ],
  "narrative": {
    "character": {
      "name": "Tutorial Guide",
      "role": "Tour Guide",
      "motivation": "Welcome to Hawthorn Bend. This map shows every kind of terrain you'll see in the game — take a moment to look around before you start drawing districts."
    },
    "intro_slides": [
      {
        "heading": "Reading the Map",
        "body": "Maps in this game can include geographic features alongside the precincts you draw districts from.\n\n- **Mountains** (grey tiles, top of map) — not assignable. Precincts beside them are foothills, marked with a subtle grey edge.\n- **Sea** (dark blue tiles, bottom of map) — not assignable. Precincts beside them are coast, marked with a blue shoreline.\n- **Lake** (aqua tile, right side) — not assignable. Precincts beside it are lakeside, marked with an aqua edge.\n- **River** (blue line through the middle-left) — flows along hex edges, not on them. Precincts on a river are riverside.\n\nThere's also a small lake within one precinct on the south-west — an inland pond, drawn as an aqua oval inside the hex."
      },
      {
        "heading": "Geography is Cosmetic",
        "body": "These features are visual: they show what the region looks like, but **they do not constrain district-drawing**.\n\nReal redistricting often uses rivers and mountains as district boundaries — but that's because of political choices (state lines, county lines, historical municipal limits) that *happen* to follow geography, not because geography is a physical barrier. A district can cross a river if the people on both sides share a community.\n\nThe initial map here divides the region into four quadrants. It's already a valid plan."
      },
      {
        "heading": "Try It Out",
        "body": "Click **Submit Map** to evaluate the starting districts. You can also repaint districts to experiment — drag across hexes to assign them, click district buttons to switch which district you're drawing.\n\nWhen you're done exploring, move on to the educational campaign."
      }
    ],
    "objective": "Look around the map at the four kinds of terrain. Submit the initial four-quadrant map, or repaint to experiment."
  }
}
"""

val outFile = java.io.File("game/scenarios/tutorial-003.json")
outFile.writeText(json)
println("Wrote ${precincts.size} precincts and ${riverEdges.size} river edges to ${outFile.path}")
