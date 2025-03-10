import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { randexp } from 'randexp'
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

  const valueLength = [...new Intl.Segmenter().segment(value)].length

  // Length validation
  if (schema.minLength !== undefined && valueLength < schema.minLength) {
    errors.push({
      path,
      validation: 'minLength',
      message: `Please insert at least ${schema.minLength} characters`,
    })
  }

  if (schema.maxLength !== undefined && valueLength > schema.maxLength) {
    errors.push({
      path,
      validation: 'maxLength',
      message: `Please insert up to ${schema.maxLength} characters`,
    })
  }

  // Pattern validation
  if (schema.pattern !== undefined) {
    const pattern = new RegExp(schema.pattern)
    if (!pattern.test(value)) {
      // Generate an example that matches the pattern
      const randomPlaceholder = randexp(schema.pattern)
      errors.push({
        path,
        validation: 'pattern',
        message: `Must have a valid format. E.g. ${randomPlaceholder}`,
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
