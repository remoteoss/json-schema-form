import type { JsfObjectSchema, JsfSchema, JsfSchemaType, NonBooleanJsfSchema } from '../types'
import type { Field, FieldOption, FieldType } from './type'
import { buildFieldObject } from './object'

/**
 * Add checkbox attributes to a field
 * @param inputType - The input type of the field
 * @param field - The field to add the attributes to
 * @param schema - The schema of the field
 */
function addCheckboxAttributes(inputType: string, field: Field, schema: NonBooleanJsfSchema) {
  // The checkboxValue attribute indicates which is the valid value a checkbox can have (for example "acknowledge", or `true`)
  // So, we set it to what's specified in the schema (if any)
  field.checkboxValue = schema.const

  // However, if the schema type is boolean, we should set the valid value as `true`
  if (schema.type === 'boolean') {
    field.checkboxValue = true
  }
}

/**
 * Get the presentation input type for a field from a schema type (ported from v0)
 * @param type - The schema type
 * @param schema - The non boolean schema of the field
 * @returns The input type for the field, based schema type. Default to 'text'
 */
function getInputTypeFromSchema(type: JsfSchemaType, schema: NonBooleanJsfSchema): FieldType {
  if (!type) {
    return 'text'
  }

  switch (type) {
    case 'string': {
      const { oneOf, format } = schema
      if (format === 'email')
        return 'email'
      if (format === 'date')
        return 'date'
      if (format === 'data-url')
        return 'file'
      if (oneOf)
        return 'radio'
      return 'text'
    }
    case 'number':
    case 'integer':
      return 'number'
    case 'object':
      return 'fieldset'
    case 'array': {
      const { items } = schema
      if (items?.properties) {
        return 'group-array'
      }
      return 'select'
    }
    case 'boolean':
      return 'checkbox'
    default:
      return 'text'
  }
}

/**
 * Get the input type for a field
 * @param schema - The non boolean schema of the field
 * @returns The input type for the field, based schema type. Default to 'text'
 */
function getInputType(schema: NonBooleanJsfSchema, strictInputType?: boolean): FieldType {
  const presentation = schema['x-jsf-presentation']
  if (presentation?.inputType) {
    return presentation.inputType as FieldType
  }

  if (strictInputType) {
    throw new Error(`Strict error: Missing inputType to field "${schema.title}".
You can fix the json schema or skip this error by calling createHeadlessForm(schema, { strictInputType: false })`)
  }

  // If root schema has no type
  if (!schema.type) {
    // Check if it has an "items" value with properties
    if (schema.items?.properties) {
      return 'group-array'
    }

    // Check if it has a "properties" value
    if (schema.properties) {
      return 'select'
    }

    // Otherwise, assume "string" as the fallback type and get input from it
  }

  // Get input type from schema (fallback type is "string")
  return getInputTypeFromSchema(schema.type || 'string', schema)
}

/**
 * Convert options to the required format
 * This is used when we have a oneOf or anyOf schema property
 * @param nodeOptions - The options to convert - the oneOf/anyOf elements in a schema
 * @returns The converted options
 * @description
 * The options are converted to the required format by checking if the option has a const property.
 * If it does, we add the option to the options array.
 * If it doesn't, we skip the option.
 */
function convertToOptions(nodeOptions: JsfSchema[]): Array<FieldOption> {
  return nodeOptions
    .filter((option): option is NonBooleanJsfSchema =>
      option !== null && typeof option === 'object' && option.const !== null,
    )
    .map((schemaOption) => {
      const title = schemaOption.title
      const value = schemaOption.const
      const presentation = schemaOption['x-jsf-presentation']
      const meta = presentation?.meta

      const result: {
        label: string
        value: unknown
        [key: string]: unknown
      } = {
        label: title || '',
        value,
      }

      // Add meta if it exists
      if (meta) {
        result.meta = meta
      }

      // Add other properties, without known ones we already handled above
      const { title: _, const: __, 'x-jsf-presentation': ___, ...rest } = schemaOption

      return { ...result, ...rest }
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
  strictInputType: boolean = false,
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
  const inputType = getInputType(schema, strictInputType)

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
    jsonType: schema.type,
    required,
    isVisible: true,
    ...(errorMessage && { errorMessage }),
  }

  if (inputType === 'checkbox') {
    addCheckboxAttributes(inputType, field, schema)
  }

  if (schema.title) {
    field.label = schema.title
  }

  // Spread presentation properties to the root level
  if (Object.keys(presentation).length > 0) {
    Object.entries(presentation).forEach(([key, value]) => {
      // inputType is already handled above
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
