# Redistricting Simulator

An educational simulator exploring the dynamics of gerrymandering and its effects on electoral
outcomes — a spiritual successor to *The Redistricting Game*.

## Purpose

Representative democracy is highly sensitive to how district boundaries are drawn. Small
changes in boundary placement can dramatically alter which party wins a given election,
even when the underlying population's preferences stay the same. This simulator is designed
to make that sensitivity visible and tangible.

Players draw district boundaries over a small synthetic region with a defined population
distribution, then simulate elections to observe the outcome. Different boundary choices —
even ones that satisfy neutral criteria like equal population — can produce wildly different
results. The game covers:

- **Party-composition scenarios**: see how district shapes affect which party controls a
  legislature from the same electorate.
- **Racial and demographic scenarios**: explore how boundary choices interact with the
  Voting Rights Act's mandate that minority communities have an effective voice.
- **Neutral-rule scenarios**: see what "independent redistricting" criteria like
  compactness, contiguity, and equal population actually achieve — and what they leave open.
- **Population-change scenarios**: redraw districts after population shifts, as happens
  after each census.

The near-term focus is a single small region with first-past-the-post elections. Stretch
goals for later versions include larger polities, alternative electoral systems (plurality
at-large, party-list proportional representation, single transferable vote), and
Arrow's-impossibility-style exploration of what any voting system must trade off.

## Tech Stack

- **Backend service**: Kotlin, gRPC (Armeria), Dagger 2 DI, Flyway + JOOQ (database)
- **Build**: Bazel (bzlmod), JVM 21
- **Observability**: OpenTelemetry (traces, metrics, structured logs via OTLP)
- **CI**: Buildkite (Linux via Docker, macOS native)

## Building

```bash
bazel build //...
bazel test //...
```

Run the gRPC service:

```bash
bazel run //kotlin:brackets_service
```

## Development

See `thoughts/shared/` for architecture decisions, implementation plans, and open tickets.
