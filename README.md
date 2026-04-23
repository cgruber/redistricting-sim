# redistricting-sim

An educational browser-based game about gerrymandering and electoral redistricting.

Players draw district boundaries over a fictional region, then simulate elections to see
how boundary choices affect outcomes. The goal is visceral understanding: same population,
same votes, dramatically different results depending on who drew the lines.

## Status

Early design and prototyping phase. The game vision is documented in
`thoughts/shared/vision/game-vision.md`. The tech stack is being validated via parallel
proof-of-concept spikes (see `thoughts/shared/tickets/`).

Working direction:
- Browser-based, desktop-first
- TypeScript + SVG/D3 for map rendering and game UI
- Client-side election simulation (no server-side compute)
- Local browser storage for progress (no user accounts in v1)

## Repository Layout

```
thoughts/shared/vision/     # Game design documents — start here
thoughts/shared/research/   # Research and architectural decisions
thoughts/shared/tickets/    # Work tracking
spike/001-game-poc/         # SPIKE-001: game tech stack proof-of-concept (in progress)
spike/002-build-poc/        # SPIKE-002: build system proof-of-concept (in progress)
```

## Contributing

See `AGENTS.md` for agent and contributor conventions. The game vision document is the
anchor for all design decisions — read it before opening any PRs.

## License

See `LICENSE`.
