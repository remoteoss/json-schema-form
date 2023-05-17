# Contributing

## Questions / Bugs / Feedback

If you have questions about the library, found a bug or want to suggest a feature, please create an issue.

## Development

- Install dependencies:

```bash
npm ci
```

- Run tests:

```
npm test
```

### Documentation

You can visit the [docs website](https://json-schema-form.vercel.app/), however its source is not in the repo yet, only the build (`/docs_build`). Our docs are still coupled to Remote's internal Design System and integration tests. The effort to decouple it at the moment is too high.

So our strategy is to at each new PR, to update the docs internally and manually copy its build to this repo.

## Pull requests (PR)

Maintainers merge PRs by squashing the commits and editing the merge commit message using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Releases

For each new PR merged, a GitHub action is triggered to create a new release.
