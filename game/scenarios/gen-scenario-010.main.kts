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

// River edges: all 7 edges between r=-1 and r=0
val riverEdges = listOf(
    // Direct (down)
    Hex(0, -1) to Hex(0, 0),
    Hex(1, -1) to Hex(1, 0),
    Hex(2, -1) to Hex(2, 0),
    Hex(3, -1) to Hex(3, 0),
    // Diagonal (lower-left from north precinct)
    Hex(1, -1) to Hex(0, 0),
    Hex(2, -1) to Hex(1, 0),
    Hex(3, -1) to Hex(2, 0),
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
  "river_blocks_contiguity": true,
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
      "name": "You",
      "role": "County Engineer, Hawthorn Bend",
      "motivation": "The Hawthorn River has split this county in half for as long as anyone can remember. Now the bridge is out, and emergency services can't cross. The state wants a new district map that reflects how people actually live: each district must stay on one bank of the river."
    },
    "intro_slides": [
      {
        "heading": "The River Constraint",
        "body": "Hawthorn Bend is shaped by water and stone. The Hawthorn River cuts the county in two; the Brackenridge Mountains rise to the north; the Cobalt Sea laps the south.\n\nThe previous map ignored geography — its four districts each straddled the river. Now that the bridge is gone, those districts can't be served by a single emergency response unit."
      },
      {
        "heading": "Natural Boundaries",
        "body": "Your task: redraw the four districts so each one stays entirely on one bank. The river is now a hard boundary.\n\nThe initial map has each district crossing the river vertically. Reset it. Try grouping precincts on the same side of the river instead."
      },
      {
        "heading": "Why It Matters",
        "body": "Real maps respect natural barriers. Rivers, mountains, and coastlines shape who lives near whom — and who shares a representative.\n\nA map that ignores geography can be technically equal in population but functionally broken. Drawing along natural lines isn't gerrymandering — it's responsiveness."
      }
    ],
    "objective": "Redraw the four districts so each one stays entirely on one bank of the Hawthorn River."
  }
}
"""

val outFile = java.io.File("game/scenarios/scenario-010.json")
outFile.writeText(json)
println("Wrote ${precincts.size} precincts and ${riverEdges.size} river edges to ${outFile.path}")
