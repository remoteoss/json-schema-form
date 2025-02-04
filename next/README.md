# Next

The current version (0.x) has some critical validation bugs
([examples](https://github.com/remoteoss/json-schema-form/pull/107)).
To fix them, we need to re-write the library internals.
This `next/` folder is where the rewriting is happening
(now in TypeScript, yey!).

We expect the main `createHeadlessForm()` API to remain the same,
avoiding any major breaking change.
This is under active development, more info soon!

## Development

Ensure that you isolate your workspace to the "next" folder only.
This means:

1. In your editor, open only the "next" folder.
1. In your terminal, run commands when you are in the "next" folder only.

Otherwise, your editor may fail to set up linting and type checking,
while your terminal may fail to resolve paths.

The limitation of this approach is that
your editor will fail to recognise our git repository here.
This also means you should turn off the editor's suggestion
to open git repository at root.

## Testing

To run the tests, navigate to the "next" folder and run:

```bash
npm run test
```

Or run the tests in watch mode:

```bash
npm run test:watch
```

We use Jest for testing and have 2 sets of tests:

1. The existing tests from the previous version
1. The new tests for this version

The old tests are located in the `../src/tests` folder.
The new tests are located in the `./test` folder.

The new tests are organized into separate files for each validation type (string, object, number, etc).

## Node.js Version

This project requires Node.js LTS v22.13.1.
We recommend using the exact version specified in `.nvmrc`:

Navigate to the "next" folder and run:

```bash
nvm use
```

Without the correct Node.js version,
tests and other development tasks will likely fail.
