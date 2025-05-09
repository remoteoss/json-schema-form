import type { JsfObjectSchema } from '../types'
import type { Field, FieldFile } from './type'
import { setCustomOrder } from '../custom/order'
import { buildFieldSchema } from './schema'

/**
 * Build a field from an object schema
 * @param schema - The schema of the field
 * @param name - The name of the field, used if the schema has no title
 * @param required - Whether the field is required
 * @returns The field
 */
export function buildFieldObject(schema: JsfObjectSchema, name: string, required: boolean, strictInputType?: boolean) {
  const fields: Field[] = []

  for (const key in schema.properties) {
    const isRequired = schema.required?.includes(key) || false
    const field = buildFieldSchema(schema.properties[key], key, isRequired, strictInputType)
    if (field) {
      fields.push(field)
    }
  }

  const orderedFields = setCustomOrder({ fields, schema })

  const field = {
    ...schema['x-jsf-presentation'],
    type: schema['x-jsf-presentation']?.inputType || 'fieldset',
    inputType: schema['x-jsf-presentation']?.inputType || 'fieldset',
    jsonType: 'object',
    name,
    required,
    fields: orderedFields,
    isVisible: true,
  } as Field

  if (schema.title !== undefined) {
    field.label = schema.title
  }

  if (schema.description !== undefined) {
    field.description = schema.description
  }

  if (schema['x-jsf-presentation']?.accept) {
    (field as FieldFile).accept = schema['x-jsf-presentation']?.accept
  }

  return field
}
