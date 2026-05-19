#!/usr/bin/env kotlin
/**
 * Generator for scenario-010.json: "Two Banks, One River"
 *
 * Lesson: Natural boundaries (rivers) force district shape. A river that blocks
 * contiguity means districts cannot span it — the player must redraw so each
 * district stays entirely on one bank.
 *
 * Shape: 4×4 rectangular hex cluster (16 precincts) in axial coords.
 *   Rows r=-2, -1: north bank (8 precincts)
 *   Rows r= 0,  1: south bank (8 precincts)
 *   Cols q=0..3
 *
 * Terrain:
 *   Mountain tiles at (1,-3), (2,-3) — north of the north bank
 *   Sea tiles at (0,2), (1,2), (2,2) — south of the south bank
 *   River edges along the boundary between r=-1 and r=0, blocking contiguity:
 *     Direct (down):  (0,-1)-(0,0), (1,-1)-(1,0), (2,-1)-(2,0), (3,-1)-(3,0)
 *     Diagonal (lower-left): (1,-1)-(0,0), (2,-1)-(1,0), (3,-1)-(2,0)
 *
 * Demographics: 2 parties (Ash, Birch).
 *   North bank: Ash-leaning ~60/40
 *   South bank: Birch-leaning ~40/60
 *
 * Initial assignment: 4 vertical strips (q=0,1,2,3 → d1,d2,d3,d4).
 *   Each strip spans both banks → river_blocks_contiguity:true makes all 4
 *   districts non-contiguous. Player must redraw.
 *
 * Winning re-assignment: pair adjacent precincts within each bank.
 *   North bank → d1 + d2 (8 precincts split 4-4)
 *   South bank → d3 + d4 (8 precincts split 4-4)
 *
 * Success criteria:
 *   Required: district_count, population_balance ±10%
 *   (contiguity is enforced by rules.contiguity:required)
 *
 * Run from repo root:
 *   kotlin game/scenarios/gen-scenario-010.main.kts
 */

import kotlin.random.Random

val rng = Random(42)

data class Hex(val q: Int, val r: Int) {
    val id: String get() = "p_${q}_${r}".replace("-", "n")
}

// Precincts: 4 columns × 4 rows (r=-2..1, q=0..3)
val precincts = buildList {
    for (r in -2..1) {
        for (q in 0..3) {
            add(Hex(q, r))
        }
    }
}

// North bank = rows r in {-2, -1}; south bank = rows r in {0, 1}
fun Hex.isNorthBank(): Boolean = r < 0

// Ash-leaning north, Birch-leaning south (small jitter)
fun baseAshShare(h: Hex): Double = if (h.isNorthBank()) 0.60 else 0.40

// Initial assignment: vertical strips q -> d{q+1}. This deliberately straddles
// the river so every district fails contiguity until redrawn.
fun initialDistrict(h: Hex): String = "d${h.q + 1}"

// Population: roughly uniform with small jitter
val BASE_POP = 1000

fun Double.fmt(decimals: Int = 4) = "%.${decimals}f".format(this)

// Build precincts JSON block
val precinctsJson = buildString {
    var first = true
    for (h in precincts) {
        if (!first) append(",\n")
        first = false
        val pop = BASE_POP + rng.nextInt(-100, 101)
        val ashShare = (baseAshShare(h) + rng.nextDouble(-0.04, 0.04)).coerceIn(0.05, 0.95)
        val ashStr = ashShare.fmt(4)
        val birchStr = (1.0 - ashStr.toDouble()).fmt(4)
        val turnout = rng.nextDouble(0.55, 0.70).fmt(2)
        val name = "${if (h.isNorthBank()) "North" else "South"} (${h.q},${h.r})"
        append("""    {
      "id": "${h.id}",
      "editable": true,
      "position": { "q": ${h.q}, "r": ${h.r} },
      "total_population": $pop,
      "initial_district_id": "${initialDistrict(h)}",
      "name": "$name",
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

// River edges form a single connected chain along the boundary between rows
// r=-1 and r=0, ending with a hook that wraps over the top of (3,-1) into row
// r=-2. The hook tests how the chain-walker + curveCardinal smoothing handle a
// direction change. Edges 6 and 7 (originally going south at (3,-1)) are replaced
// with edges 3 and 4 of (3,-1) — corners 3→4→5 traversing the top of (3,-1).
val riverEdges = listOf(
    // Western zigzag along the r=-1 / r=0 boundary
    Hex(0, -1) to Hex(0, 0),     // down across (0,-1)
    Hex(1, -1) to Hex(0, 0),     // lower-left from (1,-1)
    Hex(1, -1) to Hex(1, 0),     // down across (1,-1)
    Hex(2, -1) to Hex(1, 0),     // lower-left from (2,-1)
    Hex(2, -1) to Hex(2, 0),     // down across (2,-1)
    // Bend: wraps over the top of (3,-1) via corners 3 → 4 → 5
    Hex(3, -1) to Hex(2, -1),    // upper-left edge of (3,-1) (corner 3→4)
    Hex(3, -1) to Hex(3, -2),    // top (up) edge of (3,-1) (corner 4→5)
)

val riverEdgesJson = riverEdges.joinToString(",\n") { (a, b) ->
    "    [\"${a.id}\", \"${b.id}\"]"
}

val json = """{
  "format_version": "1",
  "id": "scenario-010",
  "title": "Two Banks, One River",
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
    { "position": { "q": 1, "r": -3 }, "type": "mountain" },
    { "position": { "q": 2, "r": -3 }, "type": "mountain" },
    { "position": { "q": 0, "r":  2 }, "type": "sea" },
    { "position": { "q": 1, "r":  2 }, "type": "sea" },
    { "position": { "q": 2, "r":  2 }, "type": "sea" }
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
      "motivation": "Welcome to Hawthorn Bend — a small region with three kinds of terrain you'll see throughout the game: a sea coast, a mountain ridge, and a river."
    },
    "intro_slides": [
      {
        "heading": "Reading the Map",
        "body": "Maps in this game can include geographic features alongside the precincts you'll draw districts from.\n\n- The blue ribbon is a **river** — it flows along the edges between hexes.\n- The grey hexes at the top are **mountains**.\n- The blue hexes at the bottom are **sea**.\n\nMountains and sea are not assignable — you can't put a district there. Rivers run between hexes, not on them."
      },
      {
        "heading": "Geography is Cosmetic",
        "body": "In this game, geographic features are visual: they show you what the region looks like, but they don't constrain district-drawing.\n\nReal redistricting often uses rivers as district boundaries, but that's because of political choices — state lines, county lines, historical municipal limits — not because rivers are physical barriers. A district can cross a river if the people on both sides share a community.\n\nThe initial map here is already a working district plan. Try submitting it."
      },
      {
        "heading": "Try It Out",
        "body": "Click **Submit Map** to evaluate the starting districts. You can also repaint districts to experiment — drag across hexes to assign them, click district buttons to switch which district you're drawing.\n\nWhen you're ready, move on to the rest of the campaign."
      }
    ],
    "objective": "Get familiar with how rivers, mountains, and coastlines look on the map. Submit the initial map, or repaint to experiment."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-010.json")
outFile.writeText(json)
println("Wrote ${precincts.size} precincts and ${riverEdges.size} river edges to ${outFile.path}")
