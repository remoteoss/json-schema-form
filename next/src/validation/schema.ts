import type { ValidationError } from '../form'
import type { JsfSchema, JsfSchemaType, SchemaValue } from '../types'
import type { ObjectValidationErrorType } from './object'
import { validateObject } from './object'
import { validateString } from './string'

export type SchemaValidationErrorType =
  /**
   * The value is not of the correct type
   */
  | 'type'
  /**
   * The value is required
   */
  | 'required'
  /**
   * The value fails validation due to boolean schema
   */
  | 'valid'
  /**
   * The value fails validation due to object schema
   */
  | ObjectValidationErrorType

/**
 * Get the type of a schema
 * @param schema - The schema to get the type of
 * @returns The type of the schema, or an array of types if the schema is an array. Will fallback to 'object' if no type is defined.
 * @example
 * getType(false) // 'boolean'
 * getType(true) // 'boolean'
 * getType({ type: 'string' }) // 'string'
 * getType({ type: ['string', 'number'] }) // ['string', 'number']
 * getType({}) // 'object'
 */
export function getSchemaType(schema: JsfSchema): JsfSchemaType | JsfSchemaType[] {
  if (typeof schema === 'boolean') {
    return 'boolean'
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
    return [{ path: [], validation: 'type', message: `should be ${schemaType}` }]
  }

  return []
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param required - Whether the value is required
 * @returns An array of validation errors
 * @description
 * This function is the main validation function to validate a value against a schema.
 * - It validates boolean schemas
 * - It validates the `required` constraint
 * - It validates the type of the value
 * - It delegates to type specific validation functions such as `validateObject` and `validateString`
 * @see `validateType` for type validation
 */
export function validateSchema(value: SchemaValue, schema: JsfSchema, required: boolean = false): ValidationError[] {
  if (value === undefined && required) {
    return [{ path: [], validation: 'required', message: 'is required' }]
  }

  if (value === undefined) {
    return []
  }

  if (getSchemaType(schema) === 'boolean') {
    return schema ? [] : [{ path: [], validation: 'valid', message: 'always fails' }]
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
