import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateFormat } from './format'
import { getSchemaType } from './schema'

export type StringValidationErrorType =
  /**
   * String length validation
   */
  | 'minLength'
  | 'maxLength'
  /**
   * String pattern validation
   */
  | 'pattern'
  /**
   * String format validation
   */
  | 'format'

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
  path: string[] = [],
): ValidationError[] {
  const errors: ValidationError[] = []
  const schemaType = getSchemaType(schema)

  if (typeof value !== 'string') {
    return []
  }

  if (schemaType !== undefined && schemaType !== 'string') {
    return []
  }

  // Length validation
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    errors.push({ path, validation: 'minLength', message: `must be at least ${schema.minLength} characters` })
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    errors.push({ path, validation: 'maxLength', message: `must be at most ${schema.maxLength} characters` })
  }

  // Pattern validation
  if (schema.pattern !== undefined) {
    const pattern = new RegExp(schema.pattern)
    if (!pattern.test(value)) {
      errors.push({
        path,
        validation: 'pattern',
        message: `must match the pattern '${schema.pattern}'`,
      })
    }
  }

  // Format validation (annotation by default in 2020-12)
  if (schema.format !== undefined) {
    const formatErrors = validateFormat(value, schema.format, path)
    errors.push(...formatErrors)
  }

  return errors
}
