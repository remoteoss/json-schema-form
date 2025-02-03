import type { JsfSchema, JsfSchemaType, SchemaValue } from './types'
import type { SchemaValidationErrorType } from './validation/schema'
import { validateSchema } from './validation/schema'

/**
 * Specifies a field in the form
 */
interface Field {
  type: Exclude<JsfSchemaType, undefined>
  name: string
  required: boolean
  inputType?: string
  jsonType?: string
  fields?: Field[]
  const?: any
  errorMessage?: Record<string, string>
  computedAttributes: Record<string, string>
  scopedJsonSchema?: JsfSchema
  isVisible: boolean
}

interface FormResult {
  fields: Field[]
  isError: boolean
  error: string | null
  handleValidation: (value: SchemaValue) => ValidationResult
}

/**
 * Validation error for a single field
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
  formErrors: Record<string, string> | undefined
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @returns The validation result
 */
function validate(value: SchemaValue, schema: JsfSchema): ValidationResult {
  const errors = validateSchema(value, schema)

  return {
    formErrors: validationErrorsToFormErrors(errors),
  }
}

/**
 * Type for nested validation errors
 * @example
 * {
 *   address: {
 *     street: {
 *       type: 'string',
 *       error: 'is required'
 *     }
 *   }
 * }
 */
export type RecursiveValidationErrors = {
  [key: string]: RecursiveValidationErrors | string | undefined
} & Exclude<ValidationError, 'path'>

function validationErrorsToFormErrors(errors: ValidationError[]): Record<string, string> | undefined {
  if (errors.length === 0) {
    return undefined
  }

  return errors.reduce((acc: Record<string, string>, error) => {
    acc[error.path.join('#')] = error.message
    return acc
  }, {})
}

/**
 * Transform validation errors into a recursive object structure
 * @param errors - The validation errors to transform
 * @returns The transformed validation errors
 */
function transformValidationErrors(errors: ValidationError[]): RecursiveValidationErrors {
  const result = {} as RecursiveValidationErrors

  for (const error of errors) {
    let current = result

    // Navigate through the path array to build nested objects
    for (let i = 0; i < error.path.length - 1; i++) {
      const segment = error.path[i]
      if (!(segment in current)) {
        current[segment] = {} as RecursiveValidationErrors
      }
      current = current[segment] as RecursiveValidationErrors
    }

    // Set the error message at the deepest level
    if (error.path.length > 0) {
      const lastSegment = error.path[error.path.length - 1]
      current[lastSegment] = error.message
    }
  }

  return result
}

function buildFields(value: SchemaValue, schema: JsfSchema, errors: ValidationError[]): Field[] {
  const fields: Field[] = []

  const recursiveErrors = transformValidationErrors(errors)
  console.warn(recursiveErrors)

  return fields
}

interface CreateHeadlessFormOptions {
  initialValues?: SchemaValue
}

export function createHeadlessForm(schema: JsfSchema, options: CreateHeadlessFormOptions = {}): FormResult {
  const errors = validateSchema(options.initialValues, schema)
  const validationResult = validationErrorsToFormErrors(errors)
  console.warn(validationResult)
  const isError = validationResult !== undefined
  const fields = buildFields(options.initialValues, schema, errors)

  const handleValidation = (value: SchemaValue) => {
    const result = validate(value, schema)
    return result
  }

  return {
    fields,
    isError,
    error: null,
    handleValidation,
  }
}
