# AGENTS.md

Setup, architecture, dev releases and merging: [CONTRIBUTING.md](CONTRIBUTING.md). This file adds only what it leaves out.

- `src/`: v1 (TypeScript). All new work goes here.
- `v0/`: legacy v0 (JavaScript). Fixes only. Its own rules: [v0/README.legacy.md](v0/README.legacy.md).

## Done gate

`pnpm check && pnpm test`. This is what CI runs.

A behavior change also needs a dev release tested in an internal Remote repo before merge. Mark it as pending in the PR description. Revert the `-dev` version in `package.json` before merge; CI does not catch it.

## Conventions

- Fix the root cause. No workarounds that hide the symptom, and no special cases for one field type (e.g. group-array) in shared logic.
- Every fix or feature ships with a test where the bug lives: `test/validation/<keyword>.test.ts` for validation, `test/fields/` for field output (`array.test.ts` for group-arrays), `test/modify-schema.test.ts` only for `modifySchema`. Use `errorLike` and `mockConsole` / `restoreConsoleAndEnsureItWasNotCalled` from `test/test-utils.ts`.
- A known bug left unfixed gets an `it.todo` (or `it.skip`) with a link to its issue.
- Use `unknown` and narrow it, not `any`. Each `as` cast has a type guard or a comment saying why it is safe.
- Encode invariants in types (`JsfObjectSchema`, `NonBooleanJsfSchema`) instead of runtime checks the types already guarantee.
- Official suite tests that v1 fails are skipped via `test/json-schema-test-suite/failed-json-schema-test-suite.json`. When a change makes one pass, delete its entry. Regenerate the file with `pnpm test:write-failed-tests`.
- A behavior change ships behind an opt-in option, with a one-time deprecation warning and a `MIGRATING.md` entry (see `disallowNewConditionalOptions`). Legacy switches go under `legacyOptions`, named for what they do, not a version. Warnings name the exact option to set.
- When a change alters a rule or caveat in `.agents/skills/` or the `modifySchema` JSDoc, update it in the same PR.

## Review

Reviewing a JSF diff, or changing validation, conditionals, field generation, json-logic or `modifySchema`: read `.agents/skills/review/SKILL.md` first. It lists the JSON Schema spec rules and JSF caveats.
