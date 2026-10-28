---
name: review-json-schema
description: Review json-schema-form changes against the JSON Schema spec and JSF caveats. Use when reviewing a JSF diff or PR, or when writing code in src/validation, src/mutations.ts, src/field, src/modify-schema.ts or src/utils.ts.
---

# Review JSON Schema changes

## Steps

1. Read the diff and the tests it adds or changes.
2. Map each changed file to its sections below. Every diff also gets **Tests and compatibility**.

   | Changed path | Sections |
   | --- | --- |
   | `src/validation/*` (not `json-logic.ts`) | Spec baseline, Legacy behavior |
   | `src/validation/json-logic.ts`, `src/validation/conditions.ts` | `x-jsf-*` keywords, Conditionals and visibility |
   | `src/mutations.ts`, `src/utils.ts` | Conditionals and visibility |
   | `src/field/*`, `src/custom/*` | Legacy behavior, `x-jsf-*` keywords, Conditionals and visibility |
   | `src/form.ts` | All sections |
   | `src/modify-schema.ts` | `modifySchema` |
   | `src/errors/*` | Error output |
   | `v0/*` | Tests and compatibility only (v0 has its own rules) |

3. Apply every rule in those sections. For each rule, write a schema plus value that would break it under the new code.
4. Report each finding as `file:line`, the rule, and that failing schema plus value. Leave out rules that hold.

Done when every changed file is mapped and every rule in its sections has a verdict.

## Spec baseline

- Target is draft 2020-12. Check spec behavior against the [validation vocabulary](https://json-schema.org/draft/2020-12/json-schema-validation) and the matching file in `json-schema-test-suite/tests/draft2020-12/`.
- No support for `$ref`, `$defs`, `$id`, `$anchor`, `$dynamicRef`, `dependentRequired`, `dependentSchemas`, `propertyNames`, `minProperties`, `maxProperties`, `unevaluated*`, or `additionalProperties` as a schema. A change that adds one must also remove its entries from `test/json-schema-test-suite/failed-json-schema-test-suite.json`.
- Each keyword validator returns `[]` when its keyword is absent or the value's type does not apply (`minLength` ignores numbers).
- `type` can be an array. Gate on `schemaTypeIncludes` (`src/validation/schema.ts`), not `schema.type === 'x'`, so `type: ['number', 'null']` still runs `minimum`, `maxLength` and friends.
- `format` is enforced (the spec says annotation only). This is on purpose.
- String length counts graphemes, not UTF-16 units.
- `multipleOf` uses exact decimal math. Float `%` fails on `3.025` / `0.0001`.
- Boolean schemas are valid anywhere a schema is: `true` accepts all, `false` rejects all.
- `const` and `enum` compare with deep equality.

## Conditionals and visibility

- Hiding a field is written as a branch that sets the property to `false`: `then: { properties: { x: false } }`. The field gets `isVisible: false`, keeps its `default`, and still builds its child fields.
- A property set to `true` creates no field, and is skipped when merging a branch, so it never hides or overrides the base.
- A `false` in a property map stays `false` when a sibling branch adds a constraint. Outside property maps (`additionalProperties: false`) a branch may still relax it.
- Only the node's own `if` and the `if` of each `allOf` item (plus `x-jsf-logic.allOf`) change fields. Conditionals inside `anyOf`, `oneOf` or `not` never do.
- When merging a branch into the base (`mergeSchemaBranch` in `src/utils.ts`): `required` is unioned and never shrinks, other arrays are replaced, objects merge deeply. Option arrays follow `disallowNewConditionalOptions`.
- An applied `then`/`else` is deleted from the cloned schema so validation does not run it twice. Code that reads branches after `calculateFinalSchema` sees them gone.
- If a field named in `if.required` has a `type` error, the rule counts as not matching.
- `items` conditionals that read values run per row during validation. Only constant `if: true` / `if: false` is applied to the shared `items` schema. Per-row field state is not supported.
- `handleValidation` updates the `fields` array in place. Callers keep the same object identity.

## Legacy behavior

These break the spec on purpose, for v0 parity. Keep them.

- `legacyOptions.treatNullAsUndefined`: `null` counts as missing. `legacyOptions.allowForbiddenValues`: a value under a `false` schema passes. Both are off by default.
- `required` treats an empty array or empty object as missing.
- `value` is a fallback for `const`.
- Field options come from the first of `oneOf`, `items.anyOf`, `anyOf`, `enum`. Options with `const: null` are dropped. `type: 'array'` makes the field `multiple`.
- Options are cached in a module-level `Map` keyed by JSON. Option objects are shared between forms, so treat them as read-only.
- `inputType: 'file'` skips `type` validation. `maxFileSize` is in KB. `accept` passes if any file matches.
- `format: 'date'` makes a date input. `minDate` / `maxDate` in `x-jsf-presentation` use `yyyy-MM-dd`.
- Initial values use only the base schema's `default`, not defaults inside `allOf` or branches.

## `x-jsf-*` keywords

- `x-jsf-order`: listed fields first, unlisted fields keep their order at the end. Applies to `items` too.
- `x-jsf-presentation`: spread onto the field. Its `inputType` wins over the inferred one. A branch's presentation merges deeply with the base one, arrays replaced.
- `x-jsf-errorMessage`: maps a validation name (`required`, `minLength`, `json-logic`, ...) to a message.
- `x-jsf-logic` (root): `validations` and `computedValues`, plus its own `if`/`then`/`else`/`allOf`. `x-jsf-logic-validations` lists rule names to run on a node. A missing name throws.
- `x-jsf-logic-computedAttrs`: attribute → computed value name or `{{name}}` template. Deleted after it is applied. It walks `properties`, `if` and composition keywords, but not `items`. `0` is a valid result.
- json-logic sees `null` and `undefined` as `NaN` (top-level keys only).
- json-logic-js has one global operator registry. Custom operators are added before and removed after each `createHeadlessForm` and `handleValidation` call. New entry points must do the same.

## `modifySchema`

- It clones with a JSON round-trip, so functions and `undefined` are lost.
- Steps run in a fixed order: `fields`, `allFields`, `create`, `pick`, `orderRoot`.
- Arrays in a modification replace the original array.
- `presentation` and `errorMessage` are converted to `x-jsf-presentation` and `x-jsf-errorMessage`.
- `pick` works at root level only. It filters `required`, `x-jsf-order` and `allOf`, and re-adds fields a kept conditional needs, with a warning.
- Warnings go through `console.warn` unless `muteLogging` is set.

## Error output

- Field paths drop `allOf`, `anyOf`, `oneOf`, `then`, `else` and `items`. The last error per field wins.
- Every new `validation` name needs a message in `src/errors/messages.ts` and a test in `test/errors/messages.test.ts`.

## Tests and compatibility

- Each fix has a regression test that fails without it, in the matching `test/` file.
- Tests that use console warnings call `mockConsole()` and `restoreConsoleAndEnsureItWasNotCalled()`, or assert the warning.
- `failed-json-schema-test-suite.json` changes only when the diff fixes a suite test.
- Changed public behavior ships behind an opt-in option with a one-time deprecation warning and a `MIGRATING.md` entry.
- `v0/` changes come with an updated `test/v0-baseline-test-results.json` when results change.
