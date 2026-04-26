---
name: No inline Python in PR workflow
description: Never use inline Python (python3, subprocess, etc.) in PR-related operations; use kotlin scripts or jq
type: feedback
---

Never use inline Python for any PR-related work or JSON parsing.

**Why:** Explicitly forbidden for PR use. Kotlin scripts in /opt/geekinasuit/agents/tools/ are the sanctioned tools for all PR operations (comments, threads, diff summaries). jq is the sanctioned tool for JSON parsing.

**How to apply:** For PR comment posting, thread replies, and status checks — use the .main.kts scripts. For JSON parsing — use jq. Never call python3 inline in a Bash tool call for these purposes.
