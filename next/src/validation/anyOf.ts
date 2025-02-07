import type { ValidationError } from '../form'
import type { JsfSchema, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

/**
 * Merges the parent's "type" into the subschema if it is not defined.
 * This ensures that validations (e.g., minLength, maxLength, pattern) are applied
 * as intended when the subschema omits an explicit type while the parent enforces one.
 *
 * @param params - An object containing the following properties:
 * @param params.parent - The parent schema containing the "anyOf" keyword.
 * @param params.subSchema - A subschema within the "anyOf" array.
 * @returns A new subschema with the parent's "type" merged in if absent.
 */
function mergeSubSchema({ parent, subSchema }: { parent: NonBooleanJsfSchema, subSchema: NonBooleanJsfSchema }): NonBooleanJsfSchema {
  // Using spread is safe here since both parent and subSchema are non-boolean schema objects.
  return { ...subSchema, type: subSchema.type ?? parent.type }
}

/**
 * Validate a value against the `anyOf` keyword in a schema.
 * @param value - The value to validate.
 * @param schema - The schema that contains the `anyOf` keyword.
 * @returns An array of validation errors.
 * @description
 * This function checks the provided value against each subschema in the `anyOf` array.
 * It considers the value valid if at least one subschema produces no validation errors –
 * meaning the value conforms to that subschema.
 * If every subschema returns one or more validation errors (i.e. the value fails to match
 * all conditions), the function returns an error indicating that the value should match at
 * least one schema.
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
      effectiveSubSchema = mergeSubSchema({ parent: schema, subSchema })
    }
    const errors = validateSchema(value, effectiveSubSchema)
    if (errors.length === 0) {
      return []
    }
  }

  // TODO: decide on a path for the `anyOf` errors and also for the other keyword errors that we'll have
  return [{
    path: [],
    validation: 'anyOf',
    message: 'should match at least one schema',
  }]
}
