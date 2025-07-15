# Migrating from v0 to v1

This guide helps you upgrade from `@remoteoss/json-schema-form` v0 to v1.

## Overview

v1 is a complete rewrite in TypeScript with significant improvements:

- **Full TypeScript support** with proper type definitions
- **Removed Yup dependency** - uses native JSON Schema validation
- **Simplified API** with better error handling
- **Better performance** with fewer dependencies
- **ESM-only** for modern JavaScript environments

## Breaking Changes

### 1. **Node.js & Package Manager Requirements**

```diff
- Node.js >= 18.14.0 (any package manager)
+ Node.js >= 18.14.0 (with pnpm recommended)
+ Package is now ESM-only (type: "module")
```

### 2. **Dependencies Removed**

v1 removes several heavy dependencies:

```diff
- yup (validation library)
- lodash (utility functions)
- randexp (random expression generator)
# Only json-logic-js remains
```

### 3. **New TypeScript Exports**

```diff
+ import {
+   Field,
+   FieldType,
+   FormErrors,
+   ValidationOptions,
+   ValidationResult
+ } from '@remoteoss/json-schema-form'
```

### 4. **createHeadlessForm Configuration**

#### Deprecated Options

```diff
- createHeadlessForm(schema, {
-   customProperties: { ... },  // Deprecated
- })

+ createHeadlessForm(schema, {
+   initialValues: { ... },
+   validationOptions: { ... },
+   strictInputType: boolean
+ })
```

#### Validation

The main difference is that on v1 we stopped returning yup errors and only kept the form errors, when validating a form value change.

```diff
// v0 - Returns Yup errors and Form Errors (which were based on the yup errors)
const { handleValidation } = createHeadlessForm(schema)
const { yupErrors, formErrors } = handleValidation(values)

// v1 - Only Returns Form Errors
const { handleValidation } = createHeadlessForm(schema)
const { formErrors } = handleValidation(values)
```

### 5. **Field Structure Changes**

#### Field Properties

```diff
// v0 - Mixed property names
{
  name: 'username',
- type: 'text',        // Soon to be deprecated (still supported)
+ inputType: 'text',   // Future-proof property
  jsonType: 'string',
  required: true
}
```

### 6. **modify() Function Changes**

#### **Property shorthands for presentation and error message were removed**

The `modify` function API remains mostly compatible, but we removed the support for the `presentation` `errorMessage` property shorthands — `x-jsf-presentation` and `x-jsf-errorMessage` should be used instead.

```diff
// Example:
const { schema, warnings } = modify(schemaPet, {
  fields: {
    age: {
-     presentation: {
+     'x-jsf-presentation': {
        unit: "months"
      }
-     errorMessage: {
+     'x-jsf-errorMessage': {
        required: "Important field"
      }
    }
});
```

## Migration Steps

### Step 1: Update Package

```bash
# Remove old version
npm uninstall @remoteoss/json-schema-form

# Install v1
npm install @remoteoss/json-schema-form@v1
```

### Step 2: Update Configuration

Replace any deprecated config options (if necessary):

```diff
// Before
- const form = createHeadlessForm(schema, {
- customProperties: {
-   username: {
-     presentation: {
-      placeholder: "Enter username"
-     },
-     errorMessage: {
-       required: "Important field"
-     }
-   }
- }
- })

// After - Use schema modifications instead, without any property shorthands
+ const modifiedSchema = modify(schema, {
+   fields: {
+     username: {
+       "x-jsf-presentation": {
+         placeholder: 'Enter username'
+       },
+       "x-jsf-errorMessage": {
+        required: "Important field"
+       }
+     }
+   }
+ })

const form = createHeadlessForm(modifiedSchema.schema)
```

### Step 3: Update Error Handling

```diff
// Before (assuming you were using yupErrors)
const { yupErrors } = handleValidation(formValues)
- if (yupErrors.username) {
-   console.log('Username error:', yupErrors.username)
- }

// After
const { formErrors } = handleValidation(formValues)
+ if (formErrors?.username) {
+   console.log('Username error:', formErrors.username)
+ }
```

### Step 4: Update Field Type Checks

```diff
// Before
- if (field.type === 'text') {
+ if (field.inputType === 'text') {
  // Handle text field
}
```

### Step 5: Update TypeScript Types

```typescript
// Add proper TypeScript imports
import {
  CreateHeadlessFormOptions,
  Field,
  FormErrors,
  ValidationResult
} from '@remoteoss/json-schema-form'

// Use typed interfaces
const config: CreateHeadlessFormOptions = {
  initialValues: { username: '' },
  strictInputType: true
}

const form = createHeadlessForm(schema, config)
```

## New Features in v1

### 1. **Better TypeScript Support**

Full type safety with proper interfaces:

```typescript
interface Field {
  name: string
  inputType: FieldType
  jsonType: string
  required: boolean
  // ... other properties
}
```

### 2. **Improved Error Messages**

More descriptive validation errors with path information:

```typescript
const { formErrors } = handleValidation(values)

// Nested error structure
if (formErrors?.address?.street) {
  console.log('Street validation failed')
}
```

## Common Migration Issues

### 1. **ESM Import Errors**

If you get import errors, ensure your project supports ESM:

```json
// package.json
{
  "type": "module"
}
```

### 2. **Validation backward compatibility with v0**

Some validation behaviors *were wrong* in `v0`, we fixed them in v1.
If you still need them, you need to enable them in the `validationOptions` config.

```typescript
const form = createHeadlessForm(schema, {
  validationOptions: {
    /**
     * A null value will be treated as undefined.
     * When true, providing a value to a schema that is `false`,
     * the validation will succeed instead of returning a type error.
     * This was a bug in v0, we fixed it in v1. If you need the same wrong behavior, set this to true.
     * @default false
     * @example
     * ```ts
     * Schema: { "properties": { "name": { "type": "string" } } }
     * Value: { "name": null } // Validation succeeds, even though the type is not 'null'
     * ```
     */
    treatNullAsUndefined: true,
    /**
     * A value against a schema "false" will be allowed.
     * When true, providing a value to a non-required field that is not of type 'null' or ['null']
     * the validation will succeed instead of returning a type error.
     * This was a bug in v0, we fixed it in v1. If you need the same wrong behavior, set this to true.
     * @default false
     * @example
     * ```ts
     * Schema: { "properties": { "age": false } }
     * Value: { age: 10 } // Validation succeeds, even though the value is forbidden;
     * ```
     */
    allowForbiddenValues: true,
  }
})
```

## Testing Your Migration

1. **Run your test suite** to catch breaking changes
2. **Check error handling** - verify form validation still works
3. **Test field rendering** - ensure all field types display correctly
4. **Validate TypeScript** - run `tsc --noEmit` to check types

## Need Help?

- Check the [v1 documentation](https://json-schema-form.vercel.app/)
- Review the [changelog](CHANGELOG.md) for detailed changes
- Open an issue on [GitHub](https://github.com/remoteoss/json-schema-form/issues)

## Rollback Plan

If you encounter issues, you can temporarily rollback:

```bash
npm install @remoteoss/json-schema-form@^0.12.0
```

This gives you time to properly migrate while keeping your application functional.
