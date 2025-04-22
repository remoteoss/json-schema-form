import type { ValidationError, ValidationErrorPath } from '../errors'
import type { ValidationOptions } from '../form'
import type { JsonLogicBag, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'
import { isObjectValue } from './util'

/**
 * Validate an object against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param jsonLogicBag - The JSON Logic bag
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Validates each property of object against the schema while keeping track of the path to the property.
 * Each property is validated with `validateSchema`.
 */
export function validateObject(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: ValidationOptions,
  jsonLogicBag: JsonLogicBag | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (typeof schema === 'object' && schema.properties && isObjectValue(value)) {
    const errors = []
    for (const [key, propertySchema] of Object.entries(schema.properties)) {
      errors.push(...validateSchema(value[key], propertySchema, options, [...path, key], jsonLogicBag))
    }
    return errors
  }

  return []
}
