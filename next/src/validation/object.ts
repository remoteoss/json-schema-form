import type { ValidationError } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'
import { isObjectValue } from './util'

/**
 * Validate an object against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates each property of object against the schema while keeping track of the path to the property.
 * Each property is validated with `validateSchema`.
 */
export function validateObject(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: string[] = [],
): ValidationError[] {
  if (typeof schema === 'object' && schema.properties && isObjectValue(value)) {
    const errors = []
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      const propertyValue = value[key]
      const propertyIsRequired = schema.required?.includes(key)
      const propertyErrors = validateSchema(propertyValue, propertySchema, propertyIsRequired, [...path, key])
      errors.push(...propertyErrors)
    }
    return errors
  }

  return []
}
