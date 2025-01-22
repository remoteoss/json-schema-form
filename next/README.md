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
