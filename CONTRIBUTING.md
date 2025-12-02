# Contributing

## Questions / Bugs / Feedback

If you have questions about the library, found a bug or want to suggest a feature, please create an issue.

## Documentation

Documentation website is available [here](https://json-schema-form.vercel.app/). Please note that its source code is not in the repo yet. Our docs are still coupled to Remote's internal Design System and integration tests. The effort to decouple it at the moment is too high. Please refer to [this section](#how-it-works) for details about how the library works.

## Setup

1. Clone the repository including submodules with the `--recursive` option

   ```bash
   git clone https://github.com/remoteoss/json-schema-form.git --recursive
   ```

   If you already cloned the repository without the submodules,
   you can initialize and update them with:

   ```bash
   git submodule update --init
   ```

3. Install dependencies. You **must use [`pnpm`](https://pnpm.io/)**

   ```bash
   pnpm install
   ```

### Node.js Version

This project requires Node.js LTS v22.13.1.
We recommend using the exact version specified in `.nvmrc`:


Navigate to the "next" folder and run:


**Troubleshooting:** If your node version doesn't match, use `nvm` or another version manager to use the correct version.

```bash
# Check your Node version
node -v

## Update the version to match `.nvmrc`. For example, using `nvm`
nvm use

# If needed, check where Node comes from. Might be different from your version manager (eg `nvm`).
which node
```

Without the correct Node.js version and ``pnpm`,
tests and other development tasks will likely fail.


## Development workflow

### Creating a new branch

Submit your branch pointing to `main`.

Please, always add tests to your bug fixes and new features.

### Running JSF

To execute the library, run:

```bash
pnpm dev
```

## Unit Testing

To run the test suite (including the ones from the [Official JSON-schema suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite)), run:

```bash
pnpm test
```

Or run the tests in watch mode:

```bash
pnpm test:watch
```

You can also run a single test file with:
```bash
pnpm test:file path/to/file
```

### Testing the PR changes in your "consumer" project

#### Local build

The simplest way to test your local changes is to run the `dev` script — this re-generates a `dist` folder whenever a file is changed.

Once you have a `dist` folder being created, you can either:
- Option A: Point your local project import to the `dist` folder.

```diff
- import { createHeadlessForm } from '@remoteoss/json-schema-form'
+ import { createHeadlessForm } from '../../path/to/repo/json-schema-form/dist'
```

- Option B: Use [npm link](https://docs.npmjs.com/cli/v9/commands/npm-link) or [yarn link](https://classic.yarnpkg.com/lang/en/docs/cli/link/):

```bash
# in json-schema-form repo:
$ npm link

# cd to your project
$ npm  link @remoteoss/json-schema-form

# Run npm unlink --no-save @remoteoss/json-schema-form to remove the local symlink
```

#### Public release

If you need a public release (for example, to run it on your project CI), you can publish a `dev` release.

Note that only core maintainers can publish public releases. If needed, ask us in the PR and we'll do it for you. Check PR #3 for the video walkthrough.

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

```bash
- <type>[optional scope]: <description>
- feat(parser): add ability to parse arrays
```

The final release is done after merge.

### Publishing a stable release

1.  Checkout `main` and pull the latest commit
2.  Depending if you want a `patch` or `minor`, run the command `npm release:main:patch` or `npm release:main:minor`.

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

## How it works

This is a high level overview of how the library works and what its main components are.

## Architecture Overview

The code is organized into clear, focused modules to provide a clear separation of concerns and allow us to unit test each individual part of the library.

### Main entry point

- `src/index.ts` re-exports `createHeadlessForm` & `modifySchema`
- `src/form.ts` defines  `createHeadlessForm` the main entry point to the library and orchestrates **field generation** and **validation**

### Field generation

- `src/field/schema.ts` implements generation of fields that can be used to build user interfaces from
  - `buildFieldSchema` is the main function that builds a field for any given schema, we assume that the root schema is always of type `object`
  - The rest of this modules implements helper functions for mapping the different schema types to corresponding fields

### Validation Logic

- `src/validation/schema.ts` provides the `validateSchema` function which can validate a JSON value against a given schema and returns validation errors in the form of `ValidationError[]`
- `validateSchema` calls all type or keyword specific validation functions such as `validateObject`, `validateArray`, `validateString`, `validateAnyOf` , `validateCondition`, etc. and combine their returned validation errors
- Those validation functions apply their validation logic when needed or simply return `[]`
- When those functions need to validate a nested schema or `subschema` as the spec calls it, they recursively call `validateSchema`

### Validation Error Handling

- `src/errors/index.ts` defines the `ValidationError` type return from the validation functions
- `src/errors/messages.ts` defines `getErrorMessage` which translates validation errors into human readable error messages which can be shown in a UI, these error messages are returned when calling `handleValidation` on a form as part of the `ValidationResult`

## Configuration options

`createHeadlessForm` takes an options object with three properties: [CreateHeadlessFormOptions](https://github.com/remoteoss/json-schema-form/blob/main/next/src/form.ts)

- `initialValues` values to be used when initially rendering a form
- `strictInputType` when true, each `['x-jsf-presentation'].inputType` must be present for each schema property
- `validationOptions` an object that specifies options specific to validation, these options are here mainly for dragon and are disabled by default
    - `treatNullAsUndefined`
        - when true, a `null` value will be considered absent when validated against a schema
        - per the json-schema spec `null` is a perfectly valid value that can be validated, for example with a schema like `{ "type": "null" }` that only allows a `null` value
        - providing a `null` value to a schema like `{ "type": "string" }` should result in a validation error as the value’s type does not match
        - json-schema-form v0 does not return this error and all our forms rely on this, form fields that have not been filled, even hidden ones, will cause `null` values to be passed which would result in validation errors in nearly every form
        - dragon’s `useCreateHeadlessForm` hook enables this option by default
    - `allowForbiddenValues`
        - when true, validating a value against a `false`  schema will not result in a validation error
        - when validating any value against a schema that is `false` the json-schema spec says that this is a validation error, as `false` means “you must not provide a value to this schema”
        - we frequently use `false` schemas when we conditionally hide properties by setting them to `false`
        - as mentioned above, dragon passes `null` values for hidden fields to `handleValidate`
        - dragon’s `useCreateHeadlessForm` hook enables this option by default
