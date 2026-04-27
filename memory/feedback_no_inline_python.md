---
name: No Python; use Kotlin scripts for tooling
description: Never use Python for any project tooling or scripting; use Kotlin (.main.kts) scripts; jq for JSON parsing
type: feedback
---

Never use Python for project tooling — no inline python3, no /tmp Python scripts, no generator scripts in Python.

**Why:** User explicitly prefers Kotlin scripts. Applies to all project tooling including scenario generators, data processors, and PR workflow scripts.

**How to apply:** Write Kotlin `.main.kts` scripts for any data generation or tooling task. Place them in the project (e.g. `game/scenarios/` for scenario generators), not in /tmp. For JSON parsing in shell — use jq. For PR operations — use the .main.kts scripts in /opt/geekinasuit/agents/tools/.
