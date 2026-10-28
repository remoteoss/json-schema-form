## Summary

<!-- A couple of sentences: what this PR does, why.

A bullet list of changes, high-level.
 -->

### Example

<!-- Minimal schema that reproduces the bug or shows the feature. -->
Minimal schema:

```json
// ...
```

How it is run:
<!-- (createHeadlessForm options, handleValidation values, modifySchema config, etc) -->

```js
const form = createHeadlessForm(schema, ...)
```

**Output before:**

```js
// ...
```

**Output after:**

```js
// ...
```

## Related

<!-- Issues, PRs, or the internal Remote MR that tests the dev release. -->

## Checklist

- [ ] Tests updated (or added if needed).
- [ ] Self-reviewed with the `/review` skill.
- [ ] Breaking change: ship behind an opt-in option, not a major version bump.
- [ ] (For maintainers): Dev release tested in the internal Remote repo (behavior changes only).
