# JSF V0 (Legacy)

v0 is deprecated, (`0.x.y-beta.0` versions). v0 gets critical bug fixes only. New features go to v1.

## How v0 differs from the v1

v0 is its own package, so the root rules don't apply here:

- **Package manager:** use `npm`, not `pnpm`, and run every command from inside `v0/`.
- **Done gate:** `npm run test && npm run lint && npm run prettier:check && npm run check:pr-version`. This is what `.github/workflows/actions-v0.yml` runs.
- **Version:** `package.json` must end in `-beta.0` when you merge. If a dev release changed it, run `npm run version_as_main` to restore it.
- **Releases:** see [CONTRIBUTING.md](CONTRIBUTING.md).

## v0 and v1 test results

The root compares v0 test results with a committed baseline (`../test/v0-baseline-test-results.json`).

- From the repo root, `pnpm test:v0` fails on any regression and on any newly passing test.
- When you change v0 behavior on purpose, run `pnpm test:v0-update-baseline` from the root and commit the baseline.
