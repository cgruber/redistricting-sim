# redistricting-sim

An educational browser-based game about gerrymandering and electoral redistricting.

Players draw district boundaries over a fictional region, then simulate elections to see
how boundary choices affect outcomes. The goal is visceral understanding: same population,
same votes, dramatically different results depending on who drew the lines.

## Status

The tech stack has been validated and the game is implemented. The game vision is documented
in `thoughts/shared/vision/game-vision.md`. (The early proof-of-concept spikes that validated
the stack and build have been removed now that the real implementation exists — their
completion reports are preserved in `thoughts/shared/research/`.)

The stack:
- Browser-based, desktop-first
- TypeScript + SVG/D3 for map rendering and game UI
- Client-side election simulation (no server-side compute)
- Local browser storage for progress (no user accounts in v1)
- Bazel build

## Repository Layout

```
thoughts/shared/vision/     # Game design documents — start here
thoughts/shared/research/   # Research, architectural decisions, completed spike reports
thoughts/shared/tickets/    # Work tracking
game/web/                   # The game: TypeScript app, SVG/D3 rendering, election sim
game/                       # rust/ (wasm), scenarios/, release + deploy tooling
```

## Contributing

See `AGENTS.md` for agent and contributor conventions. The game vision document is the
anchor for all design decisions — read it before opening any PRs.

## License

See `LICENSE`.
