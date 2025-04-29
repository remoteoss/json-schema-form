import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateFormat } from './format'
import { getSchemaType } from './schema'

/**
 * Validate a string against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Implements string validation according to JSON Schema 2020-12:
 * - Length validation (minLength, maxLength)
 * - Pattern validation (pattern)
 * - Format validation (as annotation by default)
 */
export function validateString(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const errors: ValidationError[] = []
  const schemaType = getSchemaType(schema)

  if (typeof value !== 'string') {
    return []
  }

  if (schemaType !== undefined && schemaType !== 'string') {
    return []
  }

  const valueLength = [...new Intl.Segmenter().segment(value)].length

  // Length validation
  if (schema.minLength !== undefined && valueLength < schema.minLength) {
    errors.push({ path, validation: 'minLength', schema, value })
  }

  if (schema.maxLength !== undefined && valueLength > schema.maxLength) {
    errors.push({ path, validation: 'maxLength', schema, value })
  }

  // Pattern validation
  if (schema.pattern !== undefined) {
    const pattern = new RegExp(schema.pattern)
    if (!pattern.test(value)) {
      errors.push({ path, validation: 'pattern', schema, value })
    }
  }

  // Format validation (annotation by default in 2020-12)
  if (schema.format !== undefined) {
    const formatErrors = validateFormat(value, schema, path)
    errors.push(...formatErrors)
  }

  return errors
}
