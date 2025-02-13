import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, SchemaValue } from './types'
import type { SchemaValidationErrorType } from './validation/schema'
import { buildFieldObject } from './field/object'
import { validateSchema } from './validation/schema'

interface FormResult {
  fields: Field[]
  isError: boolean
  error: string | null
  handleValidation: (value: SchemaValue) => ValidationResult
}

/**
 * Validation error for schema
 */
export interface ValidationError {
  /**
   * The path to the field that has the error
   * - For field-level errors: array of field names (e.g., ['address', 'street'])
   * - For schema-level errors: empty array []
   * - For nested validations: full path to the field (e.g., ['address', 'street', 'number'])
   * @example
   * [] // schema-level error
   * ['username'] // field-level error
   * ['address', 'street'] // nested field error
   */
  path: string[]
  /**
   * The type of validation error
   * @example
   * 'required'
   */
  validation: SchemaValidationErrorType
  /**
   * The message of the validation error
   * @example
   * 'is required'
   */
  message: string
}

export interface ValidationResult {
  formErrors?: Record<string, string>
}

/**
 * JSON Schema keywords that require special path handling.
 * These keywords always use dot notation for their error paths.
 * For example: { ".fieldName": "should match at least one schema" }
 */
const SCHEMA_KEYWORDS = ['anyOf', 'oneOf', 'allOf', 'not'] as const

/**
 * Transform a validation error path array into a form error path string.
 * Follows these rules:
 * 1. Schema-level errors (empty path) -> empty string ('')
 * 2. Keyword validations (anyOf, etc.) -> always use dot notation ('.fieldName')
 * 3. Single field errors -> field name only ('fieldName')
 * 4. Nested field errors -> dot notation ('.parent.field')
 *
 * @example
 * Schema-level error
 * pathToFormErrorPath([], 'required') // ''
 *
 * Keyword validation - always dot notation
 * pathToFormErrorPath(['value'], 'anyOf') // '.value'
 *
 * Single field error - no dot
 * pathToFormErrorPath(['username'], 'type') // 'username'
 *
 * Nested field error - dot notation
 * pathToFormErrorPath(['address', 'street'], 'type') // '.address.street'
 */
function pathToFormErrorPath(path: string[], validation: SchemaValidationErrorType): string {
  // Schema-level errors have no path
  if (path.length === 0)
    return ''

  // Special handling for JSON Schema keywords
  if (SCHEMA_KEYWORDS.includes(validation as any)) {
    return `.${path.join('.')}`
  }

  // Regular fields: dot notation only for nested paths
  return path.length === 1 ? path[0] : `.${path.join('.')}`
}

/**
 * Transform validation errors into an object with the field names as keys and the error messages as values.
 * The path format follows the rules defined in pathToFormErrorPath.
 * When multiple errors exist for the same field, the last error message is used.
 *
 * @example
 * Single field error
 * { username: 'Required field' }
 *
 * Nested field error
 * { '.address.street': 'should be string' }
 *
 * Keyword validation error
 * { '.fieldName': 'should match at least one schema' }
 *
 * Schema-level error
 * { '': 'should match at least one schema' }
 */
function validationErrorsToFormErrors(errors: ValidationError[]): Record<string, string> | null {
  if (errors.length === 0)
    return null

  return errors.reduce((acc: Record<string, string>, error) => {
    acc[pathToFormErrorPath(error.path, error.validation)] = error.message
    return acc
  }, {})
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns The validation result
 */
function validate(value: SchemaValue, schema: JsfSchema): ValidationResult {
  const result: ValidationResult = {}
  const errors = validateSchema(value, schema)
  const formErrors = validationErrorsToFormErrors(errors)

  if (formErrors) {
    result.formErrors = formErrors
  }

  return result
}

interface CreateHeadlessFormOptions {
  initialValues?: SchemaValue
}

function buildFields(params: {
  schema: JsfObjectSchema
}): Field[] {
  const { schema } = params
  return buildFieldObject(schema, 'root', true).fields || []
}

export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  const errors = validateSchema(options.initialValues, schema)
  const validationResult = validationErrorsToFormErrors(errors)
  const isError = validationResult !== null

  const handleValidation = (value: SchemaValue) => {
    const result = validate(value, schema)
    return result
  }

  return {
    fields: buildFields({ schema }),
    isError,
    error: null,
    handleValidation,
  }
}
