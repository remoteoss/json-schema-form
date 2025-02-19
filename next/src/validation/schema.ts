import type { ValidationError } from '../form'
import type { JsfSchema, JsfSchemaType, SchemaValue } from '../types'
import type { StringValidationErrorType } from './string'
import { validateAllOf, validateAnyOf, validateNot, validateOneOf } from './composition'
import { validateCondition } from './conditions'
import { validateConst } from './const'
import { type NumberValidationErrorType, validateNumber } from './number'
import { validateObject } from './object'
import { validateString } from './string'

export type SchemaValidationErrorType =
  /**
   * Core validation keywords
   */
  | 'type'
  | 'required'
  | 'valid'
  | 'const'

  /**
   * Schema composition keywords (allOf, anyOf, oneOf, not)
   * These keywords apply subschemas in a logical manner according to JSON Schema spec
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
   * Number validation keywords
   */
  | NumberValidationErrorType

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

  // Handle null values specially
  if (value === null) {
    if (Array.isArray(schemaType)) {
      return schemaType.includes('null')
        ? []
        : [{
            path,
            validation: 'type',
            message: `should be ${schemaType.join(' | ')}`,
          }]
    }
    return schemaType === 'null'
      ? []
      : [{
          path,
          validation: 'type',
          message: `should be ${schemaType}`,
        }]
  }

  const valueType = typeof value

  if (Array.isArray(schemaType)) {
    for (const type of schemaType) {
      if (valueType === 'number' && type === 'integer' && Number.isInteger(value)) {
        return []
      }

      if (valueType === type || (type === 'null' && value === null)) {
        return []
      }
    }
  }

  if (valueType === 'number' && schemaType === 'integer' && Number.isInteger(value)) {
    return []
  }

  if (valueType === schemaType) {
    return []
  }

  return [{
    path,
    validation: 'type',
    message: `should be ${Array.isArray(schemaType)
      ? schemaType.join(' | ')
      : schemaType}`,
  }]
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param required - Whether the value is required
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * This function is the main validation function that implements JSON Schema validation.
 * The validation process follows this order:
 * 1. Handle undefined values and the required constraint
 * 2. Handle boolean schemas (true allows everything, false allows nothing)
 * 3. Validate against base schema constraints:
 *    - Type validation (if type is specified)
 *    - Required properties (for objects)
 *    - Type-specific validations (string, number, object)
 * 4. Validate against composition keywords in this order:
 *    - not (negates the validation of a subschema)
 *    - allOf (all subschemas must be valid)
 *    - anyOf (at least one subschema must be valid)
 *    - oneOf (exactly one subschema must be valid)
 *
 * @see validateType - For type validation behavior
 * @see validateSchemaWithoutComposition - For base schema validation
 * @see https://json-schema.org/understanding-json-schema/reference/combining.html
 */
export function validateSchema(
  value: SchemaValue,
  schema: JsfSchema,
  required: boolean = false,
  path: string[] = [],
): ValidationError[] {
  // Handle undefined values and boolean schemas first
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

  return [
    ...validateConst(value, schema, path),
    ...validateObject(value, schema, path),
    ...validateString(value, schema, path),
    ...validateNumber(value, schema, path),
    ...validateCondition(value, schema, required, path),
    ...validateNot(value, schema, path),
    ...validateAllOf(value, schema, path),
    ...validateAnyOf(value, schema, path),
    ...validateOneOf(value, schema, path),
    ...validateCondition(value, schema, required, path),
  ]
}
