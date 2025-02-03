import type { ValidationError } from '../form'
import type { JsfSchema, JsfSchemaType, SchemaValue } from '../types'
import type { ObjectValidationErrorType } from './object'
import { validateObject } from './object'
import { validateString } from './string'

export type SchemaValidationErrorType = 'type' | 'required' | 'valid' | ObjectValidationErrorType

/**
 * Get the type of a schema
 * @param schema - The schema to get the type of
 * @returns The type of the schema, or an array of types if the schema is an array. Will fallback to 'object' if no type is defined.
 * @example
 * getType({ type: 'string' }) // 'string'
 * getType({ type: ['string', 'number'] }) // ['string', 'number']
 * getType({}) // 'object'
 */
export function getSchemaType(schema: JsfSchema): JsfSchemaType | JsfSchemaType[] {
  if (typeof schema === 'boolean') {
    return 'object'
  }

  if (schema.type) {
    return schema.type
  }

  return 'object'
}

/**
 * Validate the type of a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns An array of validation errors
 * @description
 * - If the schema type is an array, the value must be an instance of one of the types in the array.
 * - If the schema type is a string, the value must be of the same type.
 */
function validateType(value: SchemaValue, schema: JsfSchema): ValidationError[] {
  const schemaType = getSchemaType(schema)
  const valueType = value === undefined ? 'undefined' : typeof value

  if (Array.isArray(schemaType) ? !schemaType.includes(valueType) : valueType !== schemaType) {
    return [{ path: [], validation: 'type', message: `must be a ${schemaType}` }]
  }

  return []
}

export function validateSchema(value: SchemaValue, schema: JsfSchema, required: boolean = false): ValidationError[] {
  if (typeof schema === 'boolean') {
    return schema ? [] : [{ path: [], validation: 'valid', message: 'always fails' }]
  }

  if (required && value === undefined) {
    return [{ path: [], validation: 'required', message: 'is required' }]
  }

  const typeValidationErrors = validateType(value, schema)
  if (typeValidationErrors.length > 0) {
    return typeValidationErrors
  }

  const errors = [
    ...validateObject(value, schema),
    ...validateString(value, schema),
  ]

  return errors
}
