import type { ValidationError, ValidationErrorPath } from '../errors'
import type { LegacyOptions } from '../form'
import type { JsonLogicContext, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'
import { isObjectValue } from './util'

/**
 * Validate an object against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param jsonLogicContext - The JSON Logic context
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates each property of object against the schema while keeping track of the path to the property.
 * Each property is validated with `validateSchema`.
 */
export function validateObject(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: LegacyOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (typeof schema === 'object' && schema.properties && isObjectValue(value)) {
    const errors = []
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      // Properties inherited from the prototype (e.g. `constructor`) are not part of the value
      const propertyValue = Object.hasOwn(value, key) ? value[key] : undefined
      errors.push(...validateSchema(propertyValue, propertySchema, options, [...path, key], jsonLogicContext))
    }
    return errors
  }

  return []
}
