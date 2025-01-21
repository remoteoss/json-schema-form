# Next

The current version (0.x) has some critical validation bugs
([examples](https://github.com/remoteoss/json-schema-form/pull/107)).
To fix them, we need to re-write the library internals.
This `next/` folder is where the rewriting is happening
(now in TypeScript, yey!).

We expect the main `createHeadlessForm()` API to remain the same,
avoiding any major breaking change.
This is under active development, more info soon!
