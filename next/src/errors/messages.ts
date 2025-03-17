import type { SchemaValidationErrorType } from '.'
import type { JsfSchemaType, NonBooleanJsfSchema, SchemaValue } from '../types'
import { randexp } from 'randexp'

export function getErrorMessage(
  schema: NonBooleanJsfSchema,
  value: SchemaValue,
  validation: SchemaValidationErrorType,
): string {
  switch (validation) {
    // Core validation
    case 'type':
      return getTypeErrorMessage(schema.type)
    case 'required':
      return 'Required field'
    case 'valid':
      return 'Always fails'
    case 'const':
      return `The only accepted value is ${JSON.stringify(schema.const)}`
    case 'enum':
      return `The option "${valueToString(value)}" is not valid.`
    // Schema composition
    case 'anyOf':
      return `The option "${valueToString(value)}" is not valid.`
    case 'oneOf':
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
  }
}

/**
 * Get the appropriate type error message based on the schema type
 */
function getTypeErrorMessage(schemaType: JsfSchemaType | JsfSchemaType[] | undefined): string {
  if (Array.isArray(schemaType)) {
    // Map 'integer' to 'number' in error messages
    const formattedTypes = schemaType.map((type) => {
      if (type === 'integer')
        return 'number'
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
