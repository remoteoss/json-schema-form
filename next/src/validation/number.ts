import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { getSchemaType } from './schema'

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

  // MultipleOf validation - dividing value by multipleOf must have no remainder
  if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
    errors.push({ path, validation: 'multipleOf', schema, value })
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
