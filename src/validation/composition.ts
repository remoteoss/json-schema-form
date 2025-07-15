/**
 * This module implements JSON Schema composition keywords (allOf, anyOf, oneOf, not).
 * These keywords apply subschemas to the same location in the instance as the parent schema.
 * Each subschema is evaluated independently, and results are combined according to the keyword's logic.
 * @see {@link https://json-schema.org/understanding-json-schema/reference/combining.html Schema Composition}
 */

import type { ValidationError, ValidationErrorPath } from '../errors'
import type { V0Support } from '../form'
import type { JsfSchema, JsonLogicContext, SchemaValue } from '../types'
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
  options: V0Support,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (!schema.allOf) {
    return []
  }

  for (let i = 0; i < schema.allOf.length; i++) {
    const subSchema = schema.allOf[i]
    const errors = validateSchema(value, subSchema, options, [...path, 'allOf', i], jsonLogicContext)
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
  options: V0Support,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (!schema.anyOf) {
    return []
  }

  for (const subSchema of schema.anyOf) {
    const errors = validateSchema(value, subSchema, options, path, jsonLogicContext)
    if (errors.length === 0) {
      return []
    }
  }

  return [
    {
      path,
      validation: 'anyOf',
      schema,
      value,
    },
  ]
}

/**
 * Validate a value against the `oneOf` keyword in a schema.
 * The value must validate successfully against EXACTLY ONE schema in the oneOf array.
 * Returns an error if no schemas validate or if multiple schemas validate.
 * No error is returned if the oneOf array is empty.
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
  options: V0Support,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (!schema.oneOf) {
    return []
  }

  if (schema.oneOf.length === 0) {
    return []
  }

  let validCount = 0

  for (let i = 0; i < schema.oneOf.length; i++) {
    const errors = validateSchema(value, schema.oneOf[i], options, path, jsonLogicContext)
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
        schema,
        value,
      },
    ]
  }

  if (validCount > 1) {
    return [
      {
        path,
        validation: 'oneOf',
        schema,
        value,
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
  options: V0Support,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (schema.not === undefined) {
    return []
  }

  if (typeof schema.not === 'boolean') {
    return schema.not ? [{ path, validation: 'not', schema, value }] : []
  }

  const notErrors = validateSchema(value, schema.not, options, path, jsonLogicContext)
  return notErrors.length === 0 ? [{ path, validation: 'not', schema, value }] : []
}
