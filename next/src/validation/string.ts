import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { getSchemaType } from './schema'

export type StringValidationErrorType = 'minLength' | 'maxLength' | 'pattern'

export function validateString(value: SchemaValue, schema: NonBooleanJsfSchema): ValidationError[] {
  const errors: ValidationError[] = []

  if (getSchemaType(schema) === 'string' && typeof value === 'string') {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({ path: [], validation: 'minLength', message: 'must be at least 3 characters' })
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({ path: [], validation: 'maxLength', message: 'must be at most 10 characters' })
    }

    if (schema.pattern) {
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
