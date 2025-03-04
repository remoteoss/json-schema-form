import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema, SchemaValue } from './types'
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
type SchemaKeyword = (typeof SCHEMA_KEYWORDS)[number]

/**
 * Type guard to check if a validation type is a schema keyword
 */
function isSchemaKeyword(validation: string): validation is SchemaKeyword {
  return SCHEMA_KEYWORDS.includes(validation as SchemaKeyword)
}

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
  if (isSchemaKeyword(validation)) {
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
 * Apply custom error messages from the schema to validation errors
 * @param errors - The validation errors
 * @param schema - The schema that contains custom error messages
 * @returns The validation errors with custom error messages applied
 */
function applyCustomErrorMessages(errors: ValidationError[], schema: JsfSchema): ValidationError[] {
  if (typeof schema !== 'object' || !schema || !errors.length) {
    return errors
  }

  return errors.map((error) => {
    // Skip if no path or empty path
    if (!error.path.length) {
      return error
    }

    // Find the schema for this error path
    let currentSchema: NonBooleanJsfSchema | null = typeof schema === 'object' ? schema : null
    let fieldSchema: NonBooleanJsfSchema | null = null

    // Navigate through the schema to find the field schema
    for (const segment of error.path) {
      if (!currentSchema || typeof currentSchema !== 'object') {
        break
      }

      if (currentSchema.properties && currentSchema.properties[segment]) {
        const nextSchema = currentSchema.properties[segment]
        // Skip if the schema is a boolean
        if (typeof nextSchema !== 'boolean') {
          currentSchema = nextSchema
          fieldSchema = currentSchema
        }
        else {
          break
        }
      }
      else if (currentSchema.items && typeof currentSchema.items !== 'boolean') {
        // Handle array items
        currentSchema = currentSchema.items
        fieldSchema = currentSchema
      }
      else {
        break
      }
    }

    // If we found a schema with custom error messages, apply them
    if (
      fieldSchema
      && fieldSchema['x-jsf-errorMessage']
      && fieldSchema['x-jsf-errorMessage'][error.validation]
    ) {
      return {
        ...error,
        message: fieldSchema['x-jsf-errorMessage'][error.validation],
      }
    }

    return error
  })
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

  // Apply custom error messages before converting to form errors
  const processedErrors = applyCustomErrorMessages(errors, schema)

  const formErrors = validationErrorsToFormErrors(processedErrors)

  if (formErrors) {
    result.formErrors = formErrors
  }

  return result
}

interface CreateHeadlessFormOptions {
  initialValues?: SchemaValue
}

function buildFields(params: { schema: JsfObjectSchema }): Field[] {
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
