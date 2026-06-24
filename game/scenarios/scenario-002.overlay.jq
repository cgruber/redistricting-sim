# Manual finishing overlay for scenario-002 (GAME-091).
#
# The generator produces the base scenario (terrain, population, demographics,
# counties, assembly) from scenario-002.spec.yaml. This overlay then applies the
# hand pedagogical tweaks the generator does not produce — keeping scenario-002
# fully reproducible (regenerate, then re-apply this overlay).
#
# Apply:
#   bazel run //game/web/src/pipeline:generate_scenario -- game/scenarios/scenario-002.spec.yaml
#   jq --slurpfile o game/scenarios/scenario-002.overlay.json \
#      -f game/scenarios/scenario-002.overlay.jq \
#      game/scenarios/scenario-002.json > /tmp/s2 && mv /tmp/s2 game/scenarios/scenario-002.json
#
# It does three things:
#   1. Reassign the two west-edge city precincts (city_to_west) into Clearwater
#      West county, so the county split reads ~West 41k / City 64k / East 40k —
#      "the old map was 40/40/40 until the east-bank boom grew the city".
#   2. Set the "old map" initial assignment: districts = the three counties
#      (City->d1, East->d2, West->d3), leaving d4 empty for the player to carve.
#   3. Add the cosmetic river (river_edges) that traces the W/E county border and
#      the Ken/Ryu split through the city centre.

($o[0]) as $ov
| ($ov.river_edges) as $edges
| ($ov.city_to_west | map("\(.[0]),\(.[1])")) as $toWest
| (reduce .precincts[] as $p ({}; .["\($p.position.q),\($p.position.r)"] = $p.id)) as $id
| .precincts |= map(
    ("\(.position.q),\(.position.r)") as $k
    | (if ($toWest | index($k))
       then .county_id = "clearwater_west" | .county_name = "Clearwater West"
       else . end)
    | .initial_district_id = (
        if .county_name == "Clearwater City" then "d1"
        elif .county_name == "Clearwater East" then "d2"
        else "d3" end)
  )
| .river_edges = ($edges | map([
    $id["\(.[0][0]),\(.[0][1])"],
    $id["\(.[1][0]),\(.[1][1])"]
  ]))
