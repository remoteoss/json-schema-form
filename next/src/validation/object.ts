import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import type { StringValidationErrorType } from './string'
import { validateSchema } from './schema'

export type ObjectValidationErrorType = StringValidationErrorType

/**
 * Validate an object against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns An array of validation errors
 * @description
 * Validates each property of object against the schema while keeping track of the path to the property.
 * Each property is validated with `validateSchema`.
 */
export function validateObject(value: SchemaValue, schema: NonBooleanJsfSchema): ValidationError[] {
  if (typeof schema === 'object' && schema.properties && typeof value === 'object') {
    const errors = []
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      const propertyValue = value[key]
      const propertyIsRequired = schema.required?.includes(key)
      const propertyErrors = validateSchema(propertyValue, propertySchema, propertyIsRequired)
      const errorsWithPath = propertyErrors.map(error => ({
        ...error,
        path: [key, ...error.path],
      }))
      errors.push(...errorsWithPath)
    }
    return errors
  }

  return []
}
