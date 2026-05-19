#!/usr/bin/env kotlin
/**
 * Generator for tutorial-003.json: "Hawthorn Bend — A Tour of the Map"
 *
 * Shape: R=6 hex circle centred at (0,0), minus terrain tile positions (124 precincts).
 * Terrain tiles at hexDist ≤ R are excluded from precincts — tile-type wins over radius.
 *
 * Terrain:
 *   Mountains  (-3,-3), (-2,-4), (-1,-5)  → inside R=6, excluded from precincts;
 *                                            foothills on their inner neighbours
 *   Sea        (-3,6), (-2,6), (-1,6), (0,6) → outside R=6 (hexDist=6 edge), coast on r=5 neighbours
 *   Lake tile  (-1,1)                       → inside R=6, renders as aqua tile; lakeside on 6 neighbours
 *
 * River: 19 edges from NW foothill (-1,-4) through centre to S coast.
 *
 * Districts: 4, angular split from centre (~31 precincts each).
 *
 * Run from repo root:
 *   ./game/scenarios/gen-tutorial-003.main.kts
 */

import kotlin.math.*
import kotlin.random.Random

val rng = Random(42)

fun hexDist(q: Int, r: Int) = (abs(q) + abs(r) + abs(q + r)) / 2

data class Hex(val q: Int, val r: Int) {
    val id: String get() = "p_${q}_${r}".replace("-", "n")
}

val R = 6

// Declare terrain tiles first — positions at hexDist ≤ R are excluded from precincts.
val mountainTiles = listOf(Hex(-3,-3), Hex(-2,-4), Hex(-1,-5))
val seaTiles      = listOf(Hex(-3,6), Hex(-2,6), Hex(-1,6), Hex(0,6))
val lakeTile      = Hex(-1, 1)
val terrainPositions: Set<Hex> = (mountainTiles + seaTiles + listOf(lakeTile)).toSet()

val hexes = buildList {
    for (q in -R..R) {
        val rMin = maxOf(-R, -q - R)
        val rMax = minOf(R, -q + R)
        for (r in rMin..rMax) {
            val h = Hex(q, r)
            if (h !in terrainPositions) add(h)
        }
    }
}.sortedWith(compareBy({ it.r }, { it.q }))

// Angular 4-way split — gives ~32 precincts per district.
fun initialDistrict(q: Int, r: Int): String {
    if (q == 0 && r == 0) return "d1"
    val x = q + r * 0.5
    val y = r * sqrt(3.0) / 2.0
    val a = atan2(y, x)
    return when {
        a >= -PI / 4 && a < PI / 4     -> "d1"  // east
        a >= PI / 4  && a < 3 * PI / 4 -> "d2"  // north
        a >= -3 * PI / 4 && a < -PI / 4 -> "d4" // south
        else                            -> "d3"  // west
    }
}

val BASE_POP = 1000
fun Double.fmt(d: Int = 4) = "%.${d}f".format(this)

val precinctsJson = buildString {
    var first = true
    for (h in hexes) {
        if (!first) append(",\n")
        first = false
        val pop = BASE_POP + rng.nextInt(-100, 101)
        val ash = (0.50 + rng.nextDouble(-0.06, 0.06)).coerceIn(0.05, 0.95)
        val birch = 1.0 - ash
        val turnout = rng.nextDouble(0.55, 0.70)
        append("""    {
      "id": "${h.id}",
      "editable": true,
      "position": { "q": ${h.q}, "r": ${h.r} },
      "total_population": $pop,
      "initial_district_id": "${initialDistrict(h.q, h.r)}",
      "name": "(${h.q},${h.r})",
      "demographic_groups": [
        {
          "id": "${h.id}-all",
          "name": "All voters",
          "population_share": 1.0,
          "turnout_rate": ${turnout.fmt(2)},
          "vote_shares": { "ash": ${ash.fmt(4)}, "birch": ${birch.fmt(4)} }
        }
      ]
    }""")
    }
}

// River: two chains — NW foothill to lake, and lake to S coast.
// Lake tile at (-1,1) splits the river; two reaches rendered as separate chains.
// Starts at (-1,-4) rather than (-2,-4): the latter is now a mountain tile.
val riverEdges = listOf(
    Hex(-1,-4) to Hex(-2,-3),   // SW — start at foothill
    Hex(-2,-3) to Hex(-1,-3),   // E
    Hex(-1,-3) to Hex(-2,-2),   // SW
    Hex(-2,-2) to Hex(-1,-2),   // E
    Hex(-1,-2) to Hex(-2,-1),   // SW
    Hex(-2,-1) to Hex(-1,-1),   // E
    Hex(-1,-1) to Hex(-2, 0),   // SW
    Hex(-2, 0) to Hex(-1, 0),   // E
    Hex(-1, 0) to Hex(-2, 1),   // SW — upstream reach ends here (lake at (-1,1))
    // gap: (-2,1)→(-1,1) and (-1,1)→(-2,2) removed — lake tile occupies (-1,1)
    Hex(-2, 2) to Hex(-1, 2),   // E — downstream reach begins here
    Hex(-1, 2) to Hex(-2, 3),   // SW
    Hex(-2, 3) to Hex(-1, 3),   // E
    Hex(-1, 3) to Hex(-2, 4),   // SW
    Hex(-2, 4) to Hex(-1, 4),   // E
    Hex(-1, 4) to Hex(-2, 5),   // SW
    Hex(-2, 5) to Hex(-1, 5),   // E — reaches coast area (sea now at r=6)
)

val riverJson = riverEdges.joinToString(",\n") { (a, b) ->
    "    [\"${a.id}\", \"${b.id}\"]"
}


val terrainJson = buildString {
    for (t in mountainTiles) append("    { \"position\": { \"q\": ${t.q}, \"r\": ${t.r} }, \"type\": \"mountain\" },\n")
    for (t in seaTiles)      append("    { \"position\": { \"q\": ${t.q}, \"r\": ${t.r} }, \"type\": \"sea\" },\n")
    append("    { \"position\": { \"q\": ${lakeTile.q}, \"r\": ${lakeTile.r} }, \"type\": \"lake\" }")
}

val distCounts = hexes.groupBy { initialDistrict(it.q, it.r) }.mapValues { it.value.size }

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
$terrainJson
  ],
  "river_edges": [
$riverJson
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
      "motivation": "Welcome to Hawthorn Bend. This map shows every kind of terrain feature that you will see in the game."
    },
    "intro_slides": [
      {
        "heading": "Reading the Map",
        "body": "Maps can include geographic features alongside the precincts you draw districts from.\n\n- **Mountains** (grey tiles, northwest) — not assignable. Adjacent precincts are foothills with a soft grey fringe.\n- **Sea** (dark blue tiles, south) — not assignable. Adjacent precincts are coast with a blue shoreline.\n- **Lake** (aqua tile, centre) — not assignable. Adjacent precincts show a teal lakeside fringe.\n- **River** (teal line) — flows from the mountain area, through the lake, and down to the sea."
      },
      {
        "heading": "Geography is Cosmetic",
        "body": "These features are visual: they show what the region looks like, but **they do not constrain district-drawing**.\n\nReal redistricting often uses rivers and mountains as district boundaries — but that is because of political choices (state lines, county lines, historical municipal limits) that happen to follow geography, not because geography is a physical barrier. A district can cross a river or lake if the people on both sides share a community.\n\nThe initial map divides the region into four sectors. It is already a valid plan."
      },
      {
        "heading": "Try It Out",
        "body": "Click **Submit Map** to evaluate the starting districts. You can also repaint districts to experiment — drag across hexes to assign them, click district buttons to switch which district you are drawing.\n\nWhen you are done exploring, move on to the educational campaign."
      }
    ],
    "objective": "Look around the map at the terrain features. Submit the initial four-district map, or repaint to experiment."
  }
}
"""

val outFile = java.io.File("game/scenarios/tutorial-003.json")
outFile.writeText(json)
println("Wrote ${hexes.size} precincts, ${riverEdges.size} river edges → ${outFile.path}")
println("District counts: $distCounts")
