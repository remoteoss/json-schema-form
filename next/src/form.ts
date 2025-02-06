import type { Field } from './field/type'
import type { JsfSchema, SchemaValue } from './types'
import type { SchemaValidationErrorType } from './validation/schema'
import { buildFieldsSchema } from './field/schema'
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
   * @example
   * ['address', 'street']
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

/**
 * Transform validation errors into an object with the field names as keys and the error messages as values
 * @param errors - The validation errors to transform
 * @returns The transformed validation errors
 * @description
 * When multiple errors are present for a single field, the last error message is used.
 * @example
 * validationErrorsToFormErrors([
 *   { path: ['address', 'street'], validation: 'required', message: 'is required' },
 *   { path: ['address', 'street'], validation: 'type', message: 'must be a string' },
 * ])
 * // { '.address.street': 'must be a string' }
 */
function validationErrorsToFormErrors(errors: ValidationError[]): Record<string, string> | null {
  if (errors.length === 0) {
    return null
  }

  return errors.reduce((acc: Record<string, string>, error) => {
    acc[error.path.join('')] = error.message
    return acc
  }, {})
}

interface CreateHeadlessFormOptions {
  initialValues?: SchemaValue
}

function buildFields(params: {
  schema: JsfSchema
}): Field[] {
  const { schema } = params

  if (typeof schema === 'boolean')
    return []

  const fields: Field[] = buildFieldsSchema({ schema })

  return fields
}

export function createHeadlessForm(
  schema: JsfSchema,
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
