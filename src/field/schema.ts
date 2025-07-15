import type { JsfObjectSchema, JsfSchema, JsfSchemaType, NonBooleanJsfSchema, SchemaValue } from '../types'
import type { Field, FieldOption, FieldType } from './type'
import { setCustomOrder } from '../custom/order'

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
 * Add options attribute to a field
 * @param field - The field to add the options to
 * @param schema - The schema of the field
 * @description
 * This adds the options attribute to based on the schema's oneOf, anyOf, or enum if we don't already have options on the field.
 */
function addOptions(field: Field, schema: NonBooleanJsfSchema) {
  if (field.options === undefined) {
    const options = getFieldOptions(schema)
    if (options) {
      field.options = options
      if (schema.type === 'array') {
        field.multiple = true
      }
    }
  }
}

/**
 * Add fields attribute to a field
 * @param field - The field to add the fields to
 * @param schema - The schema of the field
 * @param originalSchema - The original schema (needed for calculating the original input type on conditionally hidden fields)
 * @param strictInputType - Whether to strictly enforce the input type
 * @description
 * This adds the fields attribute to based on the schema's items.
 * Since options and fields are mutually exclusive, we only add fields if no options were provided.
 */
function addFields(field: Field, schema: NonBooleanJsfSchema, originalSchema: JsfSchema, strictInputType?: boolean) {
  if (field.options === undefined) {
    const fields = getFields(schema, originalSchema, strictInputType)
    if (fields) {
      field.fields = fields
    }
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
      if (format === 'email') {
        return 'email'
      }
      if (format === 'date') {
        return 'date'
      }
      if (format === 'data-url') {
        return 'file'
      }
      if (oneOf) {
        return 'radio'
      }
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
 * @param type - The schema type
 * @param name - The name of the field
 * @param schema - The non boolean schema of the field
 * @param strictInputType - Whether to strictly enforce the input type
 * @returns The input type for the field, based schema type. Default to 'text'
 * @throws If the input type is missing and strictInputType is true with the exception of the root field
 */
export function getInputType(type: JsfSchemaType, name: string, schema: NonBooleanJsfSchema, strictInputType?: boolean): FieldType {
  const presentation = schema['x-jsf-presentation']
  if (presentation?.inputType) {
    return presentation.inputType as FieldType
  }

  if (strictInputType && name !== 'root') {
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
  }

  // Get input type from schema (fallback type is "string")
  return getInputTypeFromSchema(type || schema.type || 'string', schema)
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

  // Handle enum
  if (schema.enum) {
    const enumAsOneOf: JsfSchema['oneOf'] = schema.enum?.map(value => ({
      title: typeof value === 'string' ? value : JSON.stringify(value),
      const: value as SchemaValue,
    })) || []
    return convertToOptions(enumAsOneOf)
  }

  return null
}

/**
 * Get the fields for an object schema
 * @param schema - The schema of the field
 * @param originalSchema - The original schema (needed for calculating the original input type on conditionally hidden fields)
 * @param strictInputType - Whether to strictly enforce the input type
 * @returns The fields for the schema or an empty array if the schema does not define any properties
 */
function getObjectFields(schema: NonBooleanJsfSchema, originalSchema: NonBooleanJsfSchema, strictInputType?: boolean): Field[] | null {
  const fields: Field[] = []

  for (const key in schema.properties) {
    const isRequired = schema.required?.includes(key) || false
    const field = buildFieldSchema({
      schema: schema.properties[key],
      name: key,
      required: isRequired,
      originalSchema: originalSchema.properties?.[key] || schema.properties[key],
      strictInputType,
    })
    if (field) {
      fields.push(field)
    }
  }

  const orderedFields = setCustomOrder(schema, fields)

  return orderedFields
}

/**
 * Get the fields for an array schema
 * @param schema - The schema of the field
 * @param originalSchema - The original schema (needed for calculating the original input type on conditionally hidden fields)
 * @param strictInputType - Whether to strictly enforce the input type
 * @returns The fields for the schema or an empty array if the schema does not define any items
 */
function getArrayFields(schema: NonBooleanJsfSchema, originalSchema: NonBooleanJsfSchema, strictInputType?: boolean): Field[] {
  const fields: Field[] = []

  if (typeof schema.items !== 'object' || schema.items === null) {
    return []
  }

  if (schema.items?.type === 'object') {
    const objectSchema = schema.items as JsfObjectSchema

    for (const key in objectSchema.properties) {
      const isFieldRequired = objectSchema.required?.includes(key) || false
      const field = buildFieldSchema({
        schema: objectSchema.properties[key],
        name: key,
        required: isFieldRequired,
        originalSchema,
        strictInputType,
      })
      if (field) {
        field.nameKey = key
        fields.push(field)
      }
    }
  }
  else {
    const field = buildFieldSchema({
      schema: schema.items,
      name: 'item',
      required: false,
      originalSchema,
      strictInputType,
    })
    if (field) {
      fields.push(field)
    }
  }

  const orderedFields = setCustomOrder(schema.items, fields)

  return orderedFields
}

/**
 * Get the fields for a schema from either `items` or `properties`
 * @param schema - The schema of the field
 * @param originalSchema - The original schema (needed for calculating the original input type on conditionally hidden fields)
 * @param strictInputType - Whether to strictly enforce the input type
 * @returns The fields for the schema
 */
function getFields(schema: NonBooleanJsfSchema, originalSchema: NonBooleanJsfSchema, strictInputType?: boolean): Field[] | null {
  if (typeof schema.properties === 'object' && schema.properties !== null) {
    return getObjectFields(schema, originalSchema, strictInputType)
  }
  else if (typeof schema.items === 'object' && schema.items !== null) {
    return getArrayFields(schema, originalSchema, strictInputType)
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
  'properties', // Handled separately
]

interface BuildFieldSchemaParams {
  schema: JsfSchema
  name: string
  required?: boolean
  originalSchema: NonBooleanJsfSchema
  strictInputType?: boolean
  type?: JsfSchemaType
}

/**
 * Build a field from any schema
 * @param params - The parameters for building the field
 * @param params.schema - The schema of the field
 * @param params.name - The name of the field
 * @param params.required - Whether the field is required
 * @param params.originalSchema - The original schema (needed for calculating the original input type on conditionally hidden fields)
 * @param params.strictInputType - Whether to strictly enforce the input type
 * @param params.type - The schema type
 * @returns The field
 */
export function buildFieldSchema({
  schema,
  name,
  required = false,
  originalSchema,
  strictInputType = false,
  type = undefined,
}: BuildFieldSchemaParams): Field | null {
  // If schema is boolean false, return a field with isVisible=false
  if (schema === false) {
    // If the schema is false (hidden field), we use the original schema to get the input type
    const inputType = getInputType(type, name, originalSchema, strictInputType)
    const inputHasInnerFields = ['fieldset', 'group-array'].includes(inputType)

    return {
      type: inputType,
      name,
      inputType,
      jsonType: 'boolean',
      required,
      isVisible: false,
      ...(inputHasInnerFields && { fields: [] }),
    }
  }

  // If schema is any other boolean (true), just return null
  if (typeof schema === 'boolean') {
    return null
  }

  const presentation = {
    // We need to use the original schema's presentation as a basis as there are some properties that can't be
    // serialized (so they were not cloned)
    ...(originalSchema['x-jsf-presentation'] || {}),
    ...(schema['x-jsf-presentation'] || {}),
  }
  const errorMessage = schema['x-jsf-errorMessage']

  // Get input type from presentation or fallback to schema type
  const inputType = getInputType(type, name, schema, strictInputType)

  // Build field with all schema properties by default, excluding ones that need special handling
  const field: Field = {
    // Spread all schema properties except excluded ones
    ...Object.entries(schema)
      .filter(([key]) => !excludedSchemaProps.includes(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    // Add required field properties
    name,
    inputType,
    type: inputType,
    jsonType: type || schema.type,
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
      if (key === 'inputType') {
        return
      }

      field[key] = value
    })
  }

  addOptions(field, schema)
  addFields(field, schema, originalSchema)

  return field
}
