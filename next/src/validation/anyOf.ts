import type { ValidationError } from '../form'
import type { JsfSchema, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

/**
 * Merges the parent's "type" into the subschema if it is not defined.
 * This ensures that validations (e.g., minLength, maxLength, pattern) are applied
 * as intended when the subschema omits an explicit type while the parent enforces one.
 *
 * @param parent - The parent schema containing the "anyOf" keyword.
 * @param subSchema - A subschema within the "anyOf" array.
 * @returns A new subschema with the parent's "type" merged in if absent.
 */
function mergeSubSchema(parent: NonBooleanJsfSchema, subSchema: NonBooleanJsfSchema): NonBooleanJsfSchema {
  // Using spread is safe here since both parent and subSchema are non-boolean schema objects.
  return { ...subSchema, type: subSchema.type ?? parent.type }
}

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

  // Iterate over all anyOf subschemas
  for (const subSchema of schema.anyOf) {
    let effectiveSubSchema: JsfSchema = subSchema
    // Only merge parent's "type" if both schemas are objects (non-boolean)
    if (typeof subSchema !== 'boolean' && typeof schema !== 'boolean') {
      effectiveSubSchema = mergeSubSchema(schema as NonBooleanJsfSchema, subSchema)
    }
    const errors = validateSchema(value, effectiveSubSchema)
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
