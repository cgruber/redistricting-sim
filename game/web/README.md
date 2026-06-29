# game/web — lint & format (Biome)

The TypeScript game uses [Biome](https://biomejs.dev/) for both linting and
formatting (one fast tool). Config lives in [`biome.jsonc`](./biome.jsonc).

## House style (enforced by the formatter)

- Tab indentation
- Double quotes, semicolons always, trailing commas
- Line width 100

The formatter is configured to match the existing codebase style, so running it
produces minimal churn.

## Local commands

Biome is installed into `game/node_modules/.bin/biome` by `./setup.sh` (it ships
in `package.json` devDependencies and is installed by `npm ci`). Run from
`game/web/`:

```sh
# Check format + lint, no changes (this is exactly what the CI gate runs):
../node_modules/.bin/biome ci .

# Auto-fix formatting + safe lint fixes in place:
../node_modules/.bin/biome check --write .

# Format only (no lint):
../node_modules/.bin/biome format --write .

# Lint only:
../node_modules/.bin/biome lint .
```

## CI gate

The gate runs as a Bazel test that mirrors the e2e test (`local = True`,
`no-sandbox`, invokes the physical `node_modules/.bin/biome`):

```sh
bazel test //game/web:lint_test
```

It runs `biome ci .` and fails on **any** format or lint violation. It is part of
`bazel test //game/...`, so it gates merge alongside the typecheck/unit/e2e
targets.

## Deferred lint rules (GAME-107)

A baseline of Biome's `recommended` lint rules is enforced as errors. Several
rules that flag large, intentional existing patterns are deferred (`"off"`) in
`biome.jsonc`, each with a `// TODO GAME-107` note — most notably
`noNonNullAssertion` (~400 sites: the `spec.count!` optional-field pattern),
`useLiteralKeys` (~214 sites; its autofix can break the strict tsconfig), and
`noExplicitAny`. `organizeImports` is also deferred to keep the initial format
pass purely mechanical. These are intended to be tightened incrementally — one
rule at a time, with a focused fix pass — not in a single big refactor.
