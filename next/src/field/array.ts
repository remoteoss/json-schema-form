import type { JsfObjectSchema, NonBooleanJsfSchema } from '../types'
import type { Field, FieldType } from './type'
import { buildFieldSchema } from './schema'

/**
 * Build a field from an array schema
 * @param schema - The schema of the field
 * @param name - The name of the field, used if the schema has no title
 * @param required - Whether the field is required
 * @param strictInputType - Whether to strictly enforce the input type
 * @returns The field
 * @throws If the items schema is not an object
 * @description
 * This function builds a field from an array schema.
 * The items schema is expected to be an object, and will be handled directly without creating a fieldset wrapper.
 * If the items schema is not an object, an error will be thrown.
 * @todo Handle non-object items, as well as more constraints such as prefixItems, unevaluatedItems, etc.
 */
export function buildFieldArray(schema: NonBooleanJsfSchema, name: string, required: boolean, strictInputType?: boolean): Field {
  const fields: Field[] = []

  if (typeof schema.items === 'object' && schema.items !== null) {
    // Handle object schema within items directly without creating a fieldset wrapper
    if (schema.items && typeof schema.items === 'object' && schema.items.type === 'object') {
      const objectSchema = schema.items as JsfObjectSchema

      for (const key in objectSchema.properties) {
        const isFieldRequired = objectSchema.required?.includes(key) || false
        const field = buildFieldSchema(objectSchema.properties[key], key, isFieldRequired, strictInputType)
        if (field) {
          field.nameKey = key
          fields.push(field)
        }
      }
    }
    else {
      // TODO: handle non-object items
      throw new Error('items must be an object')
    }
  }

  const field: Field = {
    ...schema['x-jsf-presentation'],
    type: 'group-array' as FieldType,
    inputType: 'group-array' as FieldType,
    jsonType: 'array',
    name,
    required,
    fields,
    isVisible: true,
  }

  if (schema.title !== undefined) {
    field.label = schema.title
  }

  if (schema.description !== undefined) {
    field.description = schema.description
  }

  return field
}
