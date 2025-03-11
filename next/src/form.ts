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

/**
 * Recursive type for form error messages
 * - String for leaf error messages
 * - Nested object for nested fields
 */
export interface FormErrors {
  [key: string]: string | FormErrors
}

export interface ValidationResult {
  formErrors?: FormErrors
}

/**
 * Transform validation errors into an object with the field names as keys and the error messages as values.
 * For nested fields, creates a nested object structure rather than using dot notation.
 * When multiple errors exist for the same field, the last error message is used.
 *
 * @example
 * Single field error
 * { username: 'Required field' }
 *
 * Nested field error (using nested objects)
 * { address: { street: 'The value must be a string' } }
 *
 * Schema-level error
 * { '': 'The value must match at least one schema' }
 */
function validationErrorsToFormErrors(errors: ValidationError[]): FormErrors | null {
  if (errors.length === 0) {
    return null
  }

  // Use a more functional approach with reduce
  return errors.reduce<FormErrors>((result, error) => {
    const { path, message } = error

    // Handle schema-level errors (empty path)
    if (path.length === 0) {
      result[''] = message
      return result
    }

    // For all other paths, recursively build the nested structure
    let current = result

    // Process all segments except the last one (which will hold the message)
    path.slice(0, -1).forEach((segment) => {
      // If this segment doesn't exist yet or is currently a string (from a previous error),
      // initialize it as an object
      if (!(segment in current) || typeof current[segment] === 'string') {
        current[segment] = {}
      }

      // Cast is safe because we just ensured it's an object
      current = current[segment] as FormErrors
    })

    // Set the message at the final level
    const lastSegment = path[path.length - 1]
    current[lastSegment] = message

    return result
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
