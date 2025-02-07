import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema } from '../types'
import type { Field } from './type'
import { buildFieldObject } from './object'

/**
 * Get the input type for a field
 * @param schema - The schema of the field
 * @returns The input type for the field, based schema type. Default to 'text'
 */
function getInputType(schema: NonBooleanJsfSchema): string {
  if (schema.type === 'string') {
    return 'text'
  }

  return 'text'
}

/**
 * Get the JSON type for a field
 * @param schema - The non boolean schema of the field
 * @returns The JSON type for the field, based schema type. Default to 'text'
 */
function getJsonType(schema: NonBooleanJsfSchema): string {
  if (Array.isArray(schema.type)) {
    return 'select'
  }

  if (schema.type !== undefined) {
    return schema.type as string
  }

  return 'text'
}

/**
 * Build a field from any schema
 * @param schema - The schema of the field
 * @param name - The name of the field, used if the schema has no title
 * @param required - Whether the field is required
 * @returns The field
 */
export function buildFieldSchema(
  schema: JsfSchema,
  name: string,
  required: boolean = false,
): Field | null {
  if (typeof schema === 'boolean') {
    return null
  }

  if (schema.type === 'object') {
    const objectSchema: JsfObjectSchema = { ...schema, type: 'object' }
    return buildFieldObject(objectSchema, name, required)
  }

  if (Array.isArray(schema.type)) {
    throw new TypeError('Array type is not yet supported')
  }

  const inputType = getInputType(schema)

  const field: Field = {
    ...schema['x-jsf-presentation'],
    inputType,
    type: inputType,
    jsonType: getJsonType(schema),
    name,
    required,
  }

  if (schema.title !== undefined) {
    field.label = schema.title
  }

  return field
}
