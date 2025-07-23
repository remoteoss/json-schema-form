import type { JsfSchema, SchemaValue } from '../types'

/**
 * The type of validation error
 * @description
 * This type is used to determine the type of validation error that occurred.
 */
export type SchemaValidationErrorType =
  /**
   * Core validation keywords
   */
  | 'type'
  | 'required'
  | 'forbidden'
  | 'const'
  | 'enum'
  /**
   * Schema composition keywords (allOf, anyOf, oneOf, not)
   * These keywords apply subschemas in a logical manner according to JSON Schema spec
   */
  | 'oneOf'
  | 'not'
  /**
   * String validation keywords
   */
  | 'format'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  /**
   * Number validation keywords
   */
  | 'multipleOf'
  | 'maximum'
  | 'exclusiveMaximum'
  | 'minimum'
  | 'exclusiveMinimum'
  /**
   * Date validation keywords
   */
  | 'minDate'
  | 'maxDate'
  /**
   * File validation keywords
   */
  | 'fileStructure'
  | 'maxFileSize'
  | 'accept'
  /**
   * Array validation keywords
   */
  | 'minItems' | 'maxItems' | 'uniqueItems' | 'contains' | 'maxContains' | 'minContains'
  /**
   * Custom validation keywords
   */
  | 'json-logic'

export type ValidationErrorPath = Array<string | number>

/**
 * Validation error for schema
 */
export interface ValidationError {
  /**
   * The path to the field that has the error
   * - For field-level errors: array of field names (e.g., ['address', 'street'])
   * - For schema-level errors: empty array []
   * - For nested validations: full path to the field (e.g., ['address', 'street', 'number'])
   * - For schema composition: includes array indices (e.g., ['value', 'allOf', 0])
   * @example
   * [] // schema-level error
   * ['username'] // field-level error
   * ['address', 'street'] // nested field error
   * ['value', 'allOf', 0] // schema composition error
   */
  path: ValidationErrorPath
  /**
   * The type of validation error
   * @example
   * 'required'
   */
  validation: SchemaValidationErrorType
  /**
   * The schema that has a failed validation
   */
  schema: JsfSchema
  /**
   * The value that triggered the validation error
   */
  value: SchemaValue
  /**
   * The custom error message to display
   * @example
   * 'The value is not valid'
   */
  customErrorMessage?: string
}
