import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsfSchema, JsonLogicContext, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema, type ValidationOptions } from './schema'
import { deepEqual } from './util'

/**
 * Validate an array against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param jsonLogicContext - The JSON logic context
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates the array against the schema while keeping track of the path to the array.
 * Each item in the array is validated with `validateSchema`.
 */
export function validateArray(
  value: SchemaValue,
  schema: JsfSchema,
  options: ValidationOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath,
): ValidationError[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...validateLength(schema, value, path),
    ...validateUniqueItems(schema, value, path),
    ...validateContains(value, schema, options, jsonLogicContext, path),
    ...validatePrefixItems(schema, value, options, jsonLogicContext, path),
    ...validateItems(schema, value, options, jsonLogicContext, path),
  ]
}

/**
 * Validate the length constraint of an array
 * @param schema - The schema to validate against
 * @param value - The array value to validate
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates the length constraint of an array.
 * If the `maxItems` keyword is defined, the array must contain at most `maxItems` items.
 * If the `minItems` keyword is defined, the array must contain at least `minItems` items.
 */
function validateLength(
  schema: NonBooleanJsfSchema,
  value: SchemaValue[],
  path: ValidationErrorPath,
): ValidationError[] {
  const errors: ValidationError[] = []

  const itemsLength = value.length

  if (schema.maxItems !== undefined && itemsLength > schema.maxItems) {
    errors.push({ path, validation: 'maxItems', schema, value })
  }

  if (schema.minItems !== undefined && itemsLength < schema.minItems) {
    errors.push({ path, validation: 'minItems', schema, value })
  }

  return errors
}

/**
 * Validate the items constraint of an array
 * @param schema - The schema to validate against
 * @param values - The array value to validate
 * @param options - The validation options
 * @param jsonLogicContext - The JSON logic context
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates the items constraint of an array.
 * If the `items` keyword is defined, each item in the array must match the schema of the `items` keyword.
 * When the `prefixItems` keyword is defined, the items constraint is validated only for the items after the prefix items.
 */
function validateItems(
  schema: NonBooleanJsfSchema,
  values: SchemaValue[],
  options: ValidationOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath,
): ValidationError[] {
  if (schema.items === undefined) {
    return []
  }

  const errors: ValidationError[] = []
  const startIndex = Array.isArray(schema.prefixItems) ? schema.prefixItems.length : 0

  for (const [i, item] of values.slice(startIndex).entries()) {
    errors.push(
      ...validateSchema(
        item,
        schema.items,
        options,
        [...path, 'items', i + startIndex],
        jsonLogicContext,
      ),
    )
  }

  return errors
}

/**
 * Validate the prefixItems constraint of an array
 * @param schema - The schema to validate against
 * @param values - The array value to validate
 * @param options - The validation options
 * @param jsonLogicContext - The JSON logic context
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates the prefixItems constraint of an array.
 * If the `prefixItems` keyword is defined, each item in the array must match the schema of the corresponding prefix item.
 */
function validatePrefixItems(
  schema: NonBooleanJsfSchema,
  values: SchemaValue[],
  options: ValidationOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath,
): ValidationError[] {
  if (!Array.isArray(schema.prefixItems)) {
    return []
  }

  const errors: ValidationError[] = []
  for (const [i, item] of values.entries()) {
    if (i < schema.prefixItems.length) {
      errors.push(
        ...validateSchema(
          item,
          schema.prefixItems[i] as JsfSchema,
          options,
          [...path, 'prefixItems', i],
          jsonLogicContext,
        ),
      )
    }
  }

  return errors
}

/**
 * Validate the contains, minContains, and maxContains constraints of an array
 * @param value - The array value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param jsonLogicContext - The JSON logic context
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * - When the `contains` keyword is defined without `minContains` and `maxContains`, the array must contain at least one item that is valid against the `contains` schema.
 * - When the `contains` keyword is defined with `minContains` and `maxContains`, the array must contain a number of items that is between `minContains` and `maxContains` that are valid against the `contains` schema.
 */
function validateContains(
  value: SchemaValue[],
  schema: NonBooleanJsfSchema,
  options: ValidationOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath,
): ValidationError[] {
  if (!('contains' in schema)) {
    return []
  }

  const errors: ValidationError[] = []

  // How many items in the array are valid against the contains schema?
  const contains = value.filter(
    item =>
      validateSchema(
        item,
        schema.contains as JsfSchema,
        options,
        [...path, 'contains'],
        jsonLogicContext,
      ).length === 0,
  ).length

  if (schema.minContains === undefined && schema.maxContains === undefined) {
    if (contains < 1) {
      errors.push({ path, validation: 'contains', schema, value })
    }
  }
  else {
    if (schema.minContains !== undefined && contains < schema.minContains) {
      errors.push({ path, validation: 'minContains', schema, value })
    }

    if (schema.maxContains !== undefined && contains > schema.maxContains) {
      errors.push({ path, validation: 'maxContains', schema, value })
    }
  }

  return errors
}

/**
 * Validate the uniqueItems constraint of an array
 * @param schema - The schema to validate against
 * @param values - The array value to validate
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates the uniqueItems constraint of an array when the `uniqueItems` keyword is defined as `true`.
 */
function validateUniqueItems(
  schema: NonBooleanJsfSchema,
  values: SchemaValue[],
  path: ValidationErrorPath,
): ValidationError[] {
  if (schema.uniqueItems !== true) {
    return []
  }

  const seen = new Map()

  for (let i = 0; i < values.length; i++) {
    for (const prevItem of seen.values()) {
      if (deepEqual(values[i], prevItem)) {
        return [{ path, validation: 'uniqueItems', schema, value: values[i] }]
      }
    }
    seen.set(i, values[i])
  }

  return []
}
