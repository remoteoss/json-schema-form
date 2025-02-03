import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { getSchemaType } from './schema'

export type StringValidationErrorType =
  /**
   * The value is too short
   */
  | 'minLength'
  /**
   * The value is too long
   */
  | 'maxLength'
  /**
   * The value does not match the pattern
   */
  | 'pattern'

/**
 * Validate a string against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns An array of validation errors
 * @description
 * - Validates the string length against the `minLength` and `maxLength` properties.
 * - Validates the string pattern against a regular expression defined in the `pattern` property.
 */
export function validateString(value: SchemaValue, schema: NonBooleanJsfSchema): ValidationError[] {
  const errors: ValidationError[] = []

  if (getSchemaType(schema) === 'string' && typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path: [], validation: 'minLength', message: 'must be at least 3 characters' })
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path: [], validation: 'maxLength', message: `must be at most ${schema.maxLength} characters` })
    }

    if (schema.pattern !== undefined) {
      const pattern = new RegExp(schema.pattern)
      if (!pattern.test(value)) {
        errors.push({
          path: [],
          validation: 'pattern',
          message: `must match the pattern '${schema.pattern}'`,
        })
      }
    }
  }

  return errors
}
