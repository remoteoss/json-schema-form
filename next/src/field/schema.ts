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
 * Convert options to the required format
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
 * TODO: go over the added code here and make sure it's correct and includes all the necessary fields
 * this is a rough draft and needs to be cleaned up
 */

/**
 * Get field options from schema
 */
function getFieldOptions(schema: NonBooleanJsfSchema, presentation: any) {
  // Handle deprecated presentation.options first
  if (presentation.options) {
    return presentation.options
  }

  // Handle oneOf or radio input type
  if (schema.oneOf || presentation.inputType === 'radio') {
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
  const errorMessage = schema['x-jsf-errorMessage'] || {}

  // Get input type from presentation or fallback to schema type
  const inputType = presentation.inputType || 'text'

  // Build field without x-jsf prefixed properties
  const field: Field = {
    type: inputType, // Use presentation inputType for type
    name,
    inputType,
    jsonType: getJsonType(schema),
    required,
    isVisible: true, // Match main version default
    computedAttributes: {}, // Match main version default
    errorMessage,
  }

  // Add optional fields if present
  if (schema.title) {
    field.label = schema.title
  }

  if (schema.description) {
    field.description = schema.description
  }

  if (schema.maxLength) {
    field.maxLength = schema.maxLength
  }

  if (schema.format) {
    field.format = schema.format
  }

  // Handle options for select/radio/multiple fields
  const options = getFieldOptions(schema, presentation)
  if (options) {
    field.options = options
  }

  return field
}
