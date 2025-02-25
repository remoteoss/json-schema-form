import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema } from '../types'
import type { Field } from './type'
import { buildFieldObject } from './object'

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
 * Convert options to the required format
 * TODO: type this
 */
function convertToOptions(nodeOptions: any[]): { label: string, value: any }[] {
  return nodeOptions
    .filter(option => option !== null)
    .map(({ title, const: value, 'x-jsf-presentation': presentation, ...item }) => {
      // Extract meta from x-jsf-presentation if it exists
      const meta = presentation?.meta

      return {
        label: title,
        value,
        // Include meta at the root level if it exists
        ...(meta && { meta }),
        ...item,
      }
    })
}

/**
 * Get field options from schema
 */
function getFieldOptions(schema: NonBooleanJsfSchema) {
  // Handle oneOf or radio input type
  if (schema.oneOf) {
    return convertToOptions(schema.oneOf || [])
  }

  // Handle items.anyOf (for multiple select)
  if (schema.items?.anyOf) {
    return convertToOptions(schema.items.anyOf)
  }

  // Handle anyOf
  if (schema.anyOf) {
    return convertToOptions(schema.anyOf)
  }

  return null
}

/**
 * List of schema properties that should be excluded from the final field or handled specially
 */
const excludedSchemaProps = [
  'title', // Transformed to 'label'
  'type', // Handled separately
  'x-jsf-errorMessage', // Handled separately
  'x-jsf-presentation', // Handled separately
  'oneOf', // Transformed to 'options'
  'anyOf', // Transformed to 'options'
  'items', // Handled specially for arrays
]

/**
 * Build a field from any schema
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

  if (schema.type === 'array') {
    throw new TypeError('Array type is not yet supported')
  }

  const presentation = schema['x-jsf-presentation'] || {}
  const errorMessage = schema['x-jsf-errorMessage']

  // Get input type from presentation or fallback to schema type
  const inputType = presentation.inputType || 'text'

  // Build field with all schema properties by default, excluding ones that need special handling
  const field: Field = {
    // Spread all schema properties except excluded ones
    ...Object.entries(schema)
      .filter(([key]) => !excludedSchemaProps.includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),

    // Add required field properties
    type: inputType,
    name,
    inputType,
    jsonType: getJsonType(schema),
    required,
    isVisible: true,
    ...(errorMessage && { errorMessage }),
  }

  if (schema.title) {
    field.label = schema.title
  }

  // Spread presentation properties to the root level
  if (Object.keys(presentation).length > 0) {
    Object.entries(presentation).forEach(([key, value]) => {
      // inputType is already handled above
      // TODO: fix type
      if (key !== 'inputType') {
        field[key] = value
      }
    })
  }

  // Handle options
  const options = getFieldOptions(schema)
  if (options) {
    field.options = options
  }

  return field
}
