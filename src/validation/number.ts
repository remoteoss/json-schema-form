import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import Big from 'big.js'
import { getSchemaType } from './schema'

/**
 * Check whether a value is an exact multiple of `multipleOf` using
 * arbitrary-precision arithmetic to avoid floating-point rounding errors.
 * @param value - The number being validated
 * @param multipleOf - The divisor the value must be a multiple of
 * @returns `true` if `value` is an exact multiple of `multipleOf`
 * @description
 * big.js throws a `RangeError` when an operation would exceed its precision
 * limit (e.g. dividing a huge value like `1e308` by a small `multipleOf`). In
 * that case the value cannot be represented as a clean multiple, so we treat it
 * as not being a multiple rather than letting the error bubble up.
 */
function isMultipleOf(value: number, multipleOf: number): boolean {
  try {
    return new Big(value).mod(new Big(multipleOf)).eq(0)
  }
  catch {
    return false
  }
}

/**
 * Validate a number against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Implements number validation according to JSON Schema 2020-12:
 * - MultipleOf validation
 * - Maximum validation
 * - ExclusiveMaximum validation
 * - Minimum validation
 * - ExclusiveMinimum validation
 */
export function validateNumber(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const errors: ValidationError[] = []
  const schemaType = getSchemaType(schema)

  if (typeof value !== 'number') {
    return []
  }

  if (schemaType !== undefined && !['number', 'integer'].includes(schemaType as string)) {
    return []
  }

  // MultipleOf validation - dividing value by multipleOf must have no remainder.
  // A naive `value % multipleOf` check is unreliable with floating-point numbers
  // (e.g. `100 % 0.01` yields `0.0099...` instead of `0`), so we use big.js for
  // arbitrary-precision arithmetic to avoid these rounding errors.
  // See https://github.com/remoteoss/json-schema-form/issues/222
  if (schema.multipleOf !== undefined) {
    if (!isMultipleOf(value, schema.multipleOf)) {
      errors.push({ path, validation: 'multipleOf', schema, value })
    }
  }

  // Maximum validation - value must be less than or equal to maximum
  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({ path, validation: 'maximum', schema, value })
  }

  // ExclusiveMaximum validation - value must be less than exclusiveMaximum
  if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
    errors.push({ path, validation: 'exclusiveMaximum', schema, value })
  }

  // Minimum validation - value must be greater than or equal to minimum
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path, validation: 'minimum', schema, value })
  }

  // ExclusiveMinimum validation - value must be greater than exclusiveMinimum
  if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
    errors.push({ path, validation: 'exclusiveMinimum', schema, value })
  }

  return errors
}
