import type { ValidationError, ValidationErrorPath } from './errors'
import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, SchemaValue } from './types'
import type { LegacyOptions } from './validation/schema'
import { getErrorMessage } from './errors/messages'
import { buildFieldSchema } from './field/schema'
import { calculateFinalSchema, updateFieldProperties } from './mutations'
import { addCustomJsonLogicOperations, removeCustomJsonLogicOperations } from './validation/json-logic'
import { validateSchema } from './validation/schema'

export { LegacyOptions } from './validation/schema'

interface FormResult {
  fields: Field[]
  isError: boolean
  error: string | null
  handleValidation: (value: SchemaValue) => ValidationResult
}

/**
 * Recursive type for form error messages
 * - String for leaf error messages
 * - Nested object for nested fields
 * - Arrays for group-array fields
 */
export interface FormErrors {
  [key: string]: string | FormErrors | Array<null | FormErrors>
}

export interface ValidationResult {
  formErrors?: FormErrors
}

/**
 * @param path - The path to transform
 * @returns The transformed path
 * Transforms a validation error path in two ways:
 * 1. Removes composition keywords (allOf, anyOf, oneOf) and conditional keywords (then, else)
 * 2. Converts array paths by removing "items" keywords but keeping indices
 *
 * Example: ['some_object','allOf', 0, 'then', 'items', 3, 'field'] -> ['some_object', 3, 'field']
 */
function transformErrorPath(path: ValidationErrorPath): Array<string | number> {
  const result: Array<string | number> = []

  for (let i = 0; i < path.length; i++) {
    const segment = path[i]

    // Skip composition keywords and their indices
    if (['allOf', 'anyOf', 'oneOf'].includes(segment as string)) {
      if (i + 1 < path.length && typeof path[i + 1] === 'number') {
        i++
      }
      continue
    }

    // Skip conditional keywords
    if (segment === 'then' || segment === 'else') {
      continue
    }

    // Skip 'items' but keep the array index that follows
    if (segment === 'items' && typeof path[i + 1] === 'number') {
      i++
      result.push(path[i] as number)
    }
    else {
      result.push(segment as string)
    }
  }

  return result
}

/**
 * @param errors - The validation errors
 * @returns The form errors
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
function validationErrorsToFormErrors(errors: ValidationErrorWithMessage[]): FormErrors | null {
  if (errors.length === 0) {
    return null
  }

  const result: FormErrors = {}

  for (const error of errors) {
    const { path } = error

    // Handle schema-level errors (empty path)
    if (path.length === 0) {
      result[''] = error.message
      continue
    }

    const segments = transformErrorPath(path)
    let current = result

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]

      if (typeof segment === 'number') {
        if (!Array.isArray(current)) {
          throw new TypeError(`Expected an array at path: ${segments.slice(0, i).join('.')}`)
        }

        if (!current[segment]) {
          current[segment] = {}
        }

        current = current[segment] as FormErrors
      }
      else {
        if (typeof segments[i + 1] === 'number') {
          if (!(segment in current)) {
            current[segment] = []
          }
        }
        else if (!(segment in current) || typeof current[segment] === 'string') {
          current[segment] = {}
        }

        current = current[segment] as FormErrors
      }
    }

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1]
      current[lastSegment] = error.message
    }
  }

  return result
}

interface ValidationErrorWithMessage extends ValidationError {
  message: string
}

/**
 * Add error messages to validation errors (based on the validation type, schema, and value)
 * @param errors - The validation errors
 * @returns The validation errors with error messages added
 */
function addErrorMessages(errors: ValidationError[]): ValidationErrorWithMessage[] {
  return errors.map((error) => {
    const { schema, value, validation, customErrorMessage } = error

    return {
      ...error,
      message: getErrorMessage(schema, value, validation, customErrorMessage),
    }
  })
}

/**
 * Apply custom error messages from the schema to validation errors
 * @param errors - The validation errors
 * @param schema - The schema that contains custom error messages
 * @returns The validation errors with custom error messages applied
 */
function applyCustomErrorMessages(errors: ValidationErrorWithMessage[], schema: JsfSchema): ValidationErrorWithMessage[] {
  if (typeof schema !== 'object' || !schema || !errors.length) {
    return errors
  }

  return errors.map((error) => {
    const fieldSchema = error.schema
    const customErrorMessage = fieldSchema['x-jsf-errorMessage']?.[error.validation]
    if (
      fieldSchema
      && customErrorMessage
    ) {
      return {
        ...error,
        message: customErrorMessage,
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
function validate(value: SchemaValue, schema: JsfSchema, options: LegacyOptions = {}): ValidationResult {
  const result: ValidationResult = {}
  const errors = validateSchema(value, schema, options)

  const errorsWithMessages = addErrorMessages(errors)
  const processedErrors = applyCustomErrorMessages(errorsWithMessages, schema)

  const formErrors = validationErrorsToFormErrors(processedErrors)

  if (formErrors) {
    result.formErrors = formErrors
  }

  return result
}

export interface CreateHeadlessFormOptions {
  /**
   * The initial values to use for the form
   */
  initialValues?: SchemaValue
  /**
   * Backward compatibility config with v0
   */
  legacyOptions?: LegacyOptions
  /**
   * When enabled, ['x-jsf-presentation'].inputType is required for all properties.
   * @default false
   */
  strictInputType?: boolean

  /**
   * Custom user defined functions. A dictionary of name and function
   */
  customJsonLogicOps?: Record<string, (...args: any[]) => any>
}

function buildFields(params: { schema: JsfObjectSchema, originalSchema: JsfObjectSchema, strictInputType?: boolean }): Field[] {
  const { schema, originalSchema, strictInputType } = params
  const fields = buildFieldSchema({
    schema,
    name: 'root',
    required: true,
    originalSchema,
    strictInputType,
  })?.fields || []
  return fields
}

/**
 * Ensures that no forbidden options are given
 * @param options - The options to validate
 * Alerts to the console that the option is deprecated and not being considered
 */
function validateOptions(options: CreateHeadlessFormOptions) {
  if (Object.prototype.hasOwnProperty.call(options, 'customProperties')) {
    console.error('[json-schema-form] `customProperties` is a deprecated option and it\'s not supported on json-schema-form v1')
  }

  if (options.customJsonLogicOps) {
    if (typeof options.customJsonLogicOps !== 'object' || options.customJsonLogicOps === null) {
      throw new TypeError('validationOptions.customJsonLogicOps must be an object.')
    }

    for (const [name, func] of Object.entries(options.customJsonLogicOps)) {
      if (typeof func !== 'function') {
        throw new TypeError(
          `Custom JSON Logic operator '${name}' must be a function, but received type '${typeof func}'.`,
        )
      }
    }
  }
}

export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  validateOptions(options)
  const initialValues = options.initialValues || {}
  const strictInputType = options.strictInputType || false
  // Make a new version of the schema with all the computed attrs applied, as well as the final version of each property (taking into account conditional rules)
  const updatedSchema = calculateFinalSchema({
    schema,
    values: initialValues,
    options: options.legacyOptions,
  })

  const fields = buildFields({ schema: updatedSchema, originalSchema: schema, strictInputType })

  // TODO: check if we need this isError variable exposed
  const isError = false

  const handleValidation = (value: SchemaValue) => {
    const customJsonLogicOps = options?.customJsonLogicOps

    try {
      addCustomJsonLogicOperations(customJsonLogicOps)

      const updatedSchema = calculateFinalSchema({
        schema,
        values: value,
        options: options.legacyOptions,
      })

      const result = validate(value, updatedSchema, options.legacyOptions)

      updateFieldProperties(fields, updatedSchema, schema)

      return result
    }
    finally {
      removeCustomJsonLogicOperations(customJsonLogicOps)
    }
  }

  return {
    fields,
    isError,
    error: null,
    handleValidation,
  }
}
