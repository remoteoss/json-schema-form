/**
 * This module implements JSON Schema composition keywords (allOf, anyOf, oneOf, not).
 * These keywords apply subschemas to the same location in the instance as the parent schema.
 * Each subschema is evaluated independently, and results are combined according to the keyword's logic.
 * @see {@link https://json-schema.org/understanding-json-schema/reference/combining.html Schema Composition}
 */

import type { ValidationError } from '../errors'
import type { JsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

/**
 * Validate a value against the `allOf` keyword in a schema.
 * The value must validate successfully against ALL schemas in the allOf array.
 * Validation stops at the first schema that fails, returning its errors.
 *
 * @example
 * ```json
 * {
 *   "allOf": [
 *     { "type": "string" },
 *     { "maxLength": 5 }
 *   ]
 * }
 * ```
 * This schema validates strings with maximum length of 5.
 */
export function validateAllOf(
  value: SchemaValue,
  schema: JsfSchema,
  path: string[] = [],
): ValidationError[] {
  if (!schema.allOf || !Array.isArray(schema.allOf)) {
    return []
  }

  for (let i = 0; i < schema.allOf.length; i++) {
    const subSchema = schema.allOf[i]
    const errors = validateSchema(value, subSchema, false, [...path, 'allOf', i])
    if (errors.length > 0) {
      return errors
    }
  }

  return []
}

/**
 * Validate a value against the `anyOf` keyword in a schema.
 * The value must validate successfully against AT LEAST ONE schema in the anyOf array.
 * Returns no errors if any schema validates, otherwise returns a generic anyOf error.
 *
 * @example
 * ```json
 * {
 *   "anyOf": [
 *     { "type": "string", "maxLength": 5 },
 *     { "type": "number", "minimum": 0 }
 *   ]
 * }
 * ```
 * This schema validates either short strings or positive numbers.
 */
export function validateAnyOf(
  value: SchemaValue,
  schema: JsfSchema,
  path: string[] = [],
): ValidationError[] {
  if (!schema.anyOf || !Array.isArray(schema.anyOf)) {
    return []
  }

  for (const subSchema of schema.anyOf) {
    const errors = validateSchema(value, subSchema, false, path)
    if (errors.length === 0) {
      return []
    }
  }

  return [
    {
      path,
      validation: 'anyOf',
    },
  ]
}

/**
 * Validate a value against the `oneOf` keyword in a schema.
 * The value must validate successfully against EXACTLY ONE schema in the oneOf array.
 * Returns an error if no schemas validate or if multiple schemas validate.
 *
 * @example
 * ```json
 * {
 *   "oneOf": [
 *     { "type": "number", "multipleOf": 5 },
 *     { "type": "number", "multipleOf": 3 }
 *   ]
 * }
 * ```
 * This schema validates numbers that are multiples of either 5 or 3, but not both.
 */
export function validateOneOf(
  value: SchemaValue,
  schema: JsfSchema,
  path: string[] = [],
): ValidationError[] {
  if (!schema.oneOf || !Array.isArray(schema.oneOf)) {
    return []
  }

  let validCount = 0

  for (let i = 0; i < schema.oneOf.length; i++) {
    const errors = validateSchema(value, schema.oneOf[i], false, path)
    if (errors.length === 0) {
      validCount++
      if (validCount > 1) {
        break
      }
    }
  }

  if (validCount === 0) {
    return [
      {
        path,
        validation: 'oneOf',
      },
    ]
  }

  if (validCount > 1) {
    return [
      {
        path,
        validation: 'oneOf',
      },
    ]
  }

  return []
}

/**
 * Validate a value against the `not` keyword in a schema.
 * The value must NOT validate successfully against the schema defined by the not keyword.
 * Returns an error if the value validates against the not schema.
 *
 * @example
 * ```json
 * {
 *   "not": { "type": "string" }
 * }
 * ```
 * This schema validates any value that is not a string.
 *
 * Note: When the not schema is a boolean:
 * - true: Always returns an error (nothing should validate)
 * - false: Always returns no errors (everything validates)
 */
export function validateNot(
  value: SchemaValue,
  schema: JsfSchema,
  path: string[] = [],
): ValidationError[] {
  if (schema.not === undefined) {
    return []
  }

  if (typeof schema.not === 'boolean') {
    return schema.not
      ? [{ path, validation: 'not' }]
      : []
  }

  const notErrors = validateSchema(value, schema.not, false, path)
  return notErrors.length === 0
    ? [{ path, validation: 'not' }]
    : []
}
