# Contributing

## Questions / Bugs / Feedback

If you have questions about the library, found a bug or want to suggest a feature, please create an issue.

## Documentation

You can visit the [docs website](https://json-schema-form.vercel.app/), however its source is not in the repo yet. Our docs are still coupled to Remote's internal Design System and integration tests. The effort to decouple it at the moment is too high.

## Setup

- Install the dependencies:

```bash
npm ci
```

- Run the tests:

```
npm test
```

## Development workflow

### Creating a new branch

Submit your branch pointing to `main`.

Please, always add tests to your bug fixs and new features.

### Testing the PR in your project

#### Local release

The simplest way to test your PR in your project is by installing it locally as a "tarball" version.

1. Run `npm run release:local`, which will create the tarball. It will output a suggest npm command to re-install the package in your project. Example:

```
  npm un @remoteoss/json-schema-form && npm i -S /Users/kim/Documents/my-repos/json-schema-form/local-0.1.0-beta.0.tgz
```

2. Then go to your project and run the command above.

You can re-run this `release:local` as many times as you need. Remember to re-install the package each time a new tarball is created.

#### Public release

If you need a public release (for example, to run it on your project CI), you can publish a `dev` release.

Note that only core maintainers (Remoters) can publish public releases. If needed, ask us in the PR and we'll do it for you. Check #3 for the video walkthrough.

1.  Locally run the script `npm run release:dev:patch` or `npm run release:dev:minor` depending on your changes.
    1. You'll be shown what's the new version and prompt you if it's correct. Eg
       ```
       Creating a new dev...
       :: Current version: 1.0.0
       :::::: New version: 1.0.1-dev.20230516175718
       Ready to commit and publish it? (y/n)
       ```
    2. Then it will ask for the `@remoteoss` OTP for the NPM access to publish it.
    3. Done! 🎉

Every `dev` release is [tagged as `dev`](https://docs.npmjs.com/cli/v9/commands/npm-publish#tag), which means it won't be automatically installed in your project by default.
You must specify the exact version, for example:

```bash
npm i -S @remoteoss/json-schema-form@1.0.1-dev.20230516-175718
```

You can create as many dev releases as you need during the PRs, by running the same command.

### Merging a PR

A PR needs all CI checks to pass.

By default, prefer to "Squash and Merge" giving it a message that follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

The final release is done after merge.

### Publishing a stable release

1.  Checkout `main` and pull the latest commit
2.  Depending if you want a `path` or `minor`, run the command `npm release:main:patch` or `npm release:main:minor`.

    1. You'll be shown what's the new version and prompt you if it's correct. Eg

       ```
       Creating a new version...
       :: Current version: 1.0.0-beta.0
       :::::: New version: 1.1.0-beta.0
       Ready to commit and publish it? (y/n)

       ```

    2. Then it will update the CHANGELOG using [generate-changelog](https://github.com/lob/generate-changelog). You may change it if needed, before going to the next step.
    3. Finally, it will ask for the `@remoteoss` OTP for the NPM access to publish it.
    4. Done! A new release is [published on NPM](https://www.npmjs.com/package/@remoteoss/json-schema-form)! 🎉

3.  Create [a new Github Release](https://github.com/remoteoss/json-schema-form/releases/new).
    1. Choose the tag matching the newest version.
    2. Leave the title empty
    3. Copy the new part of the CHANGELOG to the description.
