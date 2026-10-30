---
name: review
description: Review json-schema-form changes against the JSON Schema spec and JSF. Use when writing code or reviewing a PR.
---

# Review JSON Schema changes

## Steps

1. **Load context.** For a PR: its description, diff and every review thread, resolved ones included. For local work: the diff against `main`. Read each changed file in full, not just the hunks.
2. **Check every rule below** against the changed code. Flag older code only when the diff makes it worse or newly relevant.
3. **Report** the findings (format in [Report](#report)).
4. **Self-review of your own changes:** fix all findings. **Reviewing someone else's PR:** post them only when the person says so (see [Posting](#posting)).

Done when every rule has been checked against the diff and every finding has a `file:line`.

## Spec

- Target: draft 2020-12. Unsupported keywords are the ones skipped in `test/json-schema-test-suite/failed-json-schema-test-suite.json`. Adding support removes their entries.
- Validate the value, never the schema. A contradictory schema gets normal value errors.
- Each `validate*` returns `[]` when its keyword is absent or the value type doesn't apply. `validateSchema` calls them all without guards.
- Test keyword presence with `!== undefined`, so `minLength: 0` and `contains: false` apply.
- Validators never throw. Only invalid JSF input throws, prefixed `[json-schema-form]`.
- Never mutate the caller's `schema` or `initialValues`. Clone first.
- `type` can be an array: gate on `schemaTypeIncludes`, not `schema.type === 'x'`.
- `format` is enforced on purpose (the spec says annotation only).
- `const`, `enum`, `uniqueItems` and option identity use deep equality, not `JSON.stringify`.

## Conditionals

- Hide a field with `then: { properties: { x: false } }`. It gets `isVisible: false`, keeps `default`, and still builds child fields.
- A property set to `true` creates no field and is skipped on merge.
- A `false` in a property map stays `false` when a branch adds constraints. `additionalProperties: false` can still be relaxed.
- Only the node's own `if` and `allOf[*].if` (plus `x-jsf-logic.allOf`) change fields. `anyOf`, `oneOf` and `not` never do.
- Merging a branch (`mergeSchemaBranch`): `required` is unioned, other arrays are replaced, objects merge deeply. Option arrays follow `disallowNewConditionalOptions`.
- Applied `then` / `else` are deleted from the cloned schema.
- A key in `if.properties` but not in `if.required` matches when the value is absent, so the branch fires on an empty form.
- A `type` error on an `if.required` field makes the rule not match.
- Value-based `items` conditionals run per row during validation. Per-row field state is not supported.
- `handleValidation` updates `fields` in place.

## json-logic

- `x-jsf-logic-computedAttrs` is applied inside `items` too, from the top-level values. A rule that reads the row's own values is not supported.
- `null` and `undefined` become `NaN`.
- Custom operators go into one global registry. Add and remove them around every entry point.

## Errors

- Error text and the `formErrors` shape are public API. Consumers' E2E tests assert them.
- A valid form has no `formErrors` key at all.
- A new `validation` name needs a message in `src/errors/messages.ts`.

## Comments

Most code needs no comment. Flag comments that shouldn't be there;
- Inline comments say *why*, not *what* the code already says.
- JSDoc on exported symbols describes behavior the caller sees, not internal mechanism.
- A comment deleted while its subject still exists, should have been updated instead.

## Tests

- Apply the `AGENTS.md` conventions.
- Test conditional changes in a root `allOf`, inside a fieldset, and inside group-array `items`.

## Legacy

v1 keeps these v0 behaviors on purpose, because production forms depend on them. "Fixing" one needs an opt-in option.

- `legacyOptions.treatNullAsUndefined`: `null` counts as missing. `legacyOptions.allowForbiddenValues`: values under `false` schemas pass. Both are off by default.
- `required` treats an empty array or object as missing.
- `value` is a fallback for `const`.
- `inputType: 'file'` skips `type` validation. `maxFileSize` is in KB. `accept` passes if any file matches.
- `minDate` / `maxDate` use `yyyy-MM-dd`.
- Every schema key is copied onto the field except those in `excludedSchemaProps`. Extend that list; don't add per-key `if`s.
- `field.type` is a deprecated alias of `inputType`. New logic and tests use `inputType`.
- Options come from the first of `oneOf`, `items.anyOf`, `anyOf`, `enum`. `const: null` options are dropped. They're cached module-wide, so treat them as read-only.
- Defaults come from the base `properties` tree only, not from `allOf` or branches.

## Report

Number the findings. Each has `file:line`, the rule, and a schema plus value that breaks.

```
**Critical / High** (must fix before merge)
**Medium** (fix or justify)
**Low / style**
**Passed** (areas checked, no issues)
```

Bugs and regressions are never Low. A clean diff gets a short "no issues".

## Posting

- Default to Critical, High and Medium; nitpicks only on request.
- Comment inline on the changed line, or reply in an existing thread (re-open it if resolved). Never at the PR's top level.
- Use [conventional comments](https://conventionalcomments.org/): `issue (blocking):` for Critical / High, `issue:`, `suggestion:`, `question:` when unsure of intent, `nitpick:`, `praise:`.
- End every comment with `[by <AI tool>]`, e.g. `[by Claude]`.
