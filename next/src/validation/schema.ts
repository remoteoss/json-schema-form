import type { ValidationError } from '../form'
import type { JsfSchema, JsfSchemaType, SchemaValue } from '../types'
import type { StringValidationErrorType } from './string'
import { validateAnyOf } from './anyOf'
import { validateObject } from './object'
import { validateString } from './string'

export type SchemaValidationErrorType =
  /**
   * Core validation keywords
   */
  | 'type'
  | 'required'
  | 'valid'

  /**
   * Composition keywords
   */
  | 'anyOf'
  | 'oneOf'
  | 'allOf'
  | 'not'
  | 'if'
  | 'then'
  | 'else'

  /**
   * String validation keywords
   */
  | StringValidationErrorType

  /**
   * Format validation (now separated into format-annotation and format-assertion)
   */
  | 'format'

/**
 * Get the type of a schema
 * @param schema - The schema to get the type of
 * @returns The type of the schema, or an array of types if the schema is an array.
 * If no type is defined, returns undefined.
 *
 * IMPORTANT:
 * We intentionally return 'undefined' (instead of defaulting to 'object') when no type is defined.
 * In JSON Schema 2020-12, an absent "type" keyword means there is no type constraint.
 * This change prevents erroneously enforcing a default type of 'object', which was causing false negatives
 * (e.g. when validating an "anyOf" schema without a "type").
 */
export function getSchemaType(schema: JsfSchema): JsfSchemaType | JsfSchemaType[] | undefined {
  if (typeof schema === 'boolean') {
    return 'boolean'
  }

  if (schema.type !== undefined) {
    return schema.type
  }

  return undefined
}

/**
 * Validate the type of a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * When getSchemaType returns undefined, this function skips type validation.
 * This aligns with JSON Schema 2020-12 semantics: if no type is provided, no type check is enforced.
 */
function validateType(value: SchemaValue, schema: JsfSchema, path: string[] = []): ValidationError[] {
  const schemaType = getSchemaType(schema)
  // Skip type-checking if no type is specified.
  if (schemaType === undefined) {
    return []
  }

  const valueType = value === undefined ? 'undefined' : typeof value

  const hasTypeMismatch = Array.isArray(schemaType)
    ? !schemaType.includes(valueType)
    : valueType !== schemaType

  if (hasTypeMismatch) {
    return [{
      path,
      validation: 'type',
      message: `should be ${Array.isArray(schemaType)
        ? schemaType.join(' | ')
        : schemaType}`,
    }]
  }

  return []
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param required - Whether the value is required
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * This function is the main validation function to validate a value against a schema.
 * - It validates boolean schemas
 * - It validates the `required` constraint
 * - It validates the type of the value
 * - It delegates to type specific validation functions such as `validateObject` and `validateString`
 * @see `validateType` for type validation
 */
export function validateSchema(
  value: SchemaValue,
  schema: JsfSchema,
  required: boolean = false,
  path: string[] = [],
): ValidationError[] {
  if (value === undefined && required) {
    return [{ path, validation: 'required', message: 'is required' }]
  }

  if (value === undefined) {
    return []
  }

  if (typeof schema === 'boolean') {
    return schema ? [] : [{ path, validation: 'valid', message: 'always fails' }]
  }

  const typeValidationErrors = validateType(value, schema, path)
  if (typeValidationErrors.length > 0) {
    return typeValidationErrors
  }

  // If the schema defines "required", run required checks even when type is undefined.
  if (schema.required && Array.isArray(schema.required) && typeof value === 'object' && value !== null) {
    const missingKeys = schema.required.filter((key: string) => !(key in value))
    if (missingKeys.length > 0) {
      // Return an error for each missing field.
      return missingKeys.map(key => ({
        path: [...path, key],
        validation: 'required',
        message: 'is required',
      }))
    }
  }

  const errors = [
    ...validateObject(value, schema, path),
    ...validateString(value, schema, path),
  ]

  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const anyOfErrors = validateAnyOf(value, schema, path)
    if (anyOfErrors.length > 0) {
      return anyOfErrors
    }
  }

  return errors
}
