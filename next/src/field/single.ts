import type { JsfSchema } from '../types'
import type { Field } from './type'
import { buildFieldObject } from './object'

/**
 * Build a single UI field from a single schema property
 */
export function buildFieldSingle(params: {
  name: string
  schema: JsfSchema
}): Field | null {
  const { name, schema } = params

  // This is different than schema.type === "boolean"
  if (typeof schema === 'boolean')
    return null

  // Common properties for all field types
  const field: Field = {
    name,
    label: schema.title,
  }

  // Recursive for objects
  if (schema.type === 'object') {
    field.fields = buildFieldObject({ schema })
  }

  return field
}
