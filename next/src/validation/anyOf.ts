import type { ValidationError } from '../form'
import type { JsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

/**
 * Validate a value against the `anyOf` keyword in a schema
 * @param value - The value to validate
 * @param schema - The schema containing the `anyOf` keyword
 * @returns An array of validation errors
 * @description
 * The function validates the value against each subschema in the `anyOf` array.
 * It returns no errors as soon as one subschema validates successfully.
 * If none of the subschemas validate, an error is returned.
 */
export function validateAnyOf(value: SchemaValue, schema: JsfSchema): ValidationError[] {
  if (!schema.anyOf || !Array.isArray(schema.anyOf)) {
    return []
  }

  for (const subSchema of schema.anyOf) {
    const errors = validateSchema(value, subSchema)
    if (errors.length === 0) {
      return []
    }
  }

  return [{
    path: [],
    validation: 'anyOf',
    message: 'should match at least one schema',
  }]
}
