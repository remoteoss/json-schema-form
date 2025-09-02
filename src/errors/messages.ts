import type { SchemaValidationErrorType } from '.'
import type { JsfSchemaType, NonBooleanJsfSchema, SchemaValue } from '../types'
import { randexp } from 'randexp'
import { convertKBToMB } from '../utils'
import { DATE_FORMAT } from '../validation/custom/date'

/**
 * Check if the schema is a checkbox
 * @param schema - The schema to check
 * @returns True if the schema is a checkbox, false otherwise
 */
function isCheckbox(schema: NonBooleanJsfSchema): boolean {
  return schema['x-jsf-presentation']?.inputType === 'checkbox'
}

// Both required and const error messages are the same for checkboxes
const CHECKBOX_ACK_ERROR_MESSAGE = 'Please acknowledge this field'

export function getErrorMessage(
  schema: NonBooleanJsfSchema,
  value: SchemaValue,
  validation: SchemaValidationErrorType,
  customErrorMessage?: string,
): string {
  const presentation = schema['x-jsf-presentation']
  switch (validation) {
    // Core validation
    case 'type':
      return getTypeErrorMessage(schema.type)
    case 'required':
      if (isCheckbox(schema)) {
        return CHECKBOX_ACK_ERROR_MESSAGE
      }
      return 'Required field'
    case 'forbidden':
      return 'Not allowed'
    case 'const':
      // Boolean checkboxes that are required will come as a "const" validation error as the "empty" value is false
      if (isCheckbox(schema) && value === false) {
        return CHECKBOX_ACK_ERROR_MESSAGE
      }
      return `The only accepted value is ${JSON.stringify(schema.const)}.`
    case 'enum':
      return `The option "${valueToString(value)}" is not valid.`
    // Schema composition
    case 'oneOf':
      return `The option "${valueToString(value)}" is not valid.`
    case 'anyOf':
      return `The option "${valueToString(value)}" is not valid.`
    case 'not':
      return 'The value must not satisfy the provided schema'
    // String validation
    case 'minLength':
      return `Please insert at least ${schema.minLength} characters`
    case 'maxLength':
      return `Please insert up to ${schema.maxLength} characters`
    case 'pattern':
      return `Must have a valid format. E.g. ${randexp(schema.pattern || '')}`
    case 'format':
      if (schema.format === 'email') {
        return 'Please enter a valid email address'
      }

      if (schema.format === 'date') {
        const currentDate = new Date().toISOString().split('T')[0]
        return `Must be a valid date in ${DATE_FORMAT.toLowerCase()} format. e.g. ${currentDate}`
      }

      return `Must be a valid ${schema.format} format`
    // Number validation
    case 'multipleOf':
      return `Must be a multiple of ${schema.multipleOf}`
    case 'maximum':
      return `Must be smaller or equal to ${schema.maximum}`
    case 'exclusiveMaximum':
      return `Must be smaller than ${schema.exclusiveMaximum}`
    case 'minimum':
      return `Must be greater or equal to ${schema.minimum}`
    case 'exclusiveMinimum':
      return `Must be greater than ${schema.exclusiveMinimum}`
    // Date validation
    case 'minDate':
      return `The date must be ${presentation?.minDate} or after.`
    case 'maxDate':
      return `The date must be ${presentation?.maxDate} or before.`
    // File validation
    case 'fileStructure':
      return 'Not a valid file.'
    case 'maxFileSize': {
      const limitKB = presentation?.maxFileSize
      const limitMB = typeof limitKB === 'number' ? convertKBToMB(limitKB) : undefined
      return `File size too large.${limitMB ? ` The limit is ${limitMB} MB.` : ''}`
    }
    case 'accept': {
      const formats = presentation?.accept
      return `Unsupported file format.${formats ? ` The acceptable formats are ${formats}.` : ''}`
    }
    // Arrays
    case 'minItems': {
      const itemOrItems = schema.minItems === 1 ? 'item' : 'items'
      return `Must have at least ${schema.minItems} ${itemOrItems}`
    }
    case 'maxItems': {
      const itemOrItems = schema.maxItems === 1 ? 'item' : 'items'
      return `Must have at most ${schema.maxItems} ${itemOrItems}`
    }
    case 'uniqueItems':
      return 'Items must be unique'
    case 'contains':
      throw new Error('"contains" is not implemented yet')
    case 'minContains':
      throw new Error('"minContains" is not implemented yet')
    case 'maxContains':
      throw new Error('"maxContains" is not implemented yet')
    case 'additionalProperties':
      return 'Additional property is not allowed'
    case 'json-logic':
      return customErrorMessage || 'The value is not valid'
  }
}

/**
 * Get the appropriate type error message based on the schema type
 */
function getTypeErrorMessage(schemaType: JsfSchemaType | JsfSchemaType[] | undefined): string {
  if (Array.isArray(schemaType)) {
    // Map 'integer' to 'number' in error messages
    const formattedTypes = schemaType.map((type) => {
      if (type === 'integer') {
        return 'number'
      }
      return type
    })

    return `The value must be a ${formattedTypes.join(' or ')}`
  }

  switch (schemaType) {
    case 'number':
    case 'integer':
      return 'The value must be a number'
    case 'boolean':
      return 'The value must be a boolean'
    case 'null':
      return 'The value must be null'
    case 'string':
      return 'The value must be a string'
    case 'object':
      return 'The value must be an object'
    case 'array':
      return 'The value must be an array'
    default:
      return schemaType ? `The value must be ${schemaType}` : 'Invalid value'
  }
}

function valueToString(value: SchemaValue): string {
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}
