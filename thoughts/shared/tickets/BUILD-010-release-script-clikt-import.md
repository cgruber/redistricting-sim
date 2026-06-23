---
id: BUILD-010
title: release.main.kts fails to compile — missing clikt `default` import
area: build, tooling
status: resolved
created: 2026-06-22
---

## Summary

`game/release.main.kts` did not compile: the `Serve` subcommand calls clikt's
`.default("58080")` on an option, but the script never imported
`com.github.ajalt.clikt.parameters.options.default`. Because a `.main.kts` is
compiled as a whole, this broke **every** subcommand — `prepare`, `deploy`, and
`serve` all failed with `unresolved reference 'default'`, so the deploy tool was
unusable for anyone.

## Resolution

Added the missing import:

```kotlin
import com.github.ajalt.clikt.parameters.options.default
```

Verified by running `release.main.kts -- prepare` (builds + stages) and
`release.main.kts -- deploy --env dev` (deploys to dev.pastthepost.gg) successfully.

## References

- `game/release.main.kts` (Serve subcommand, line ~481)
- Discovered while deploying GAME-088 to dev for visual review.
