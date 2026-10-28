# AGENTS.md

`@remoteoss/json-schema-form` (JSF) turns a JSON Schema into headless form `fields` and validates values against it. Architecture: [CONTRIBUTING.md#how-it-works](CONTRIBUTING.md#how-it-works).

- `src/`: v1 (TypeScript). All new work goes here.
- `v0/`: legacy v0 (JavaScript), with its own `package.json`, lint and CI. Fixes only.

## Setup

- Use `pnpm` and the Node version from `.nvmrc`.
- `json-schema-test-suite/` is a git submodule. Run `git submodule update --init` first, or `pnpm test` fails.

## Done gate

`pnpm check && pnpm test`. This is what CI runs (`.github/workflows/actions.yml`).

## Conventions

- Every fix or feature ships with a test in the matching `test/` file (`test/validation/<keyword>.test.ts`, `test/fields/`, `test/errors/`, ...). Use `errorLike` and `mockConsole` / `restoreConsoleAndEnsureItWasNotCalled` from `test/test-utils.ts`.
- Official suite tests that v1 fails are skipped via `test/json-schema-test-suite/failed-json-schema-test-suite.json`. When a change makes one pass, delete its entry. Regenerate the file with `pnpm test:write-failed-tests`.
- When you change `v0/` behavior on purpose, run `pnpm test:v0-update-baseline` and commit `test/v0-baseline-test-results.json`. `pnpm test:v0` fails on regressions and on newly passing tests.
- v1 has no major bumps. A behavior change ships behind an opt-in option, with a one-time deprecation warning and a `MIGRATING.md` entry (see `disallowNewConditionalOptions`).
- PRs are squash-merged with a [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) title.

## Review

Reviewing a JSF diff, or changing validation, conditionals, field generation, json-logic or `modifySchema`: read `.agents/skills/review-json-schema/SKILL.md` first. It lists the JSON Schema spec rules and JSF caveats.
