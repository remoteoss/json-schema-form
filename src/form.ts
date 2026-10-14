import type { SchemaValidationErrorType, ValidationError, ValidationErrorPath } from './errors'
import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, ObjectValue, SchemaValue } from './types'
import type { LegacyOptions } from './validation/schema'
import { getErrorMessage } from './errors/messages'
import { buildFieldSchema } from './field/schema'
import { calculateFinalSchema, updateFieldProperties } from './mutations'
import { addCustomJsonLogicOperations, removeCustomJsonLogicOperations } from './validation/json-logic'
import { validateSchema } from './validation/schema'
import { isObjectValue } from './validation/util'

export { LegacyOptions } from './validation/schema'

export interface FormResult {
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
 * Apply custom error messages to validation errors.
 * @param errors - The validation errors
 * @param schema - The schema that contains custom error messages
 * @param globalErrorMessages - Form-level default messages per validation type, from `options.errorMessages`
 * @returns The validation errors with custom error messages applied
 * @description
 * Two sources of custom messages can override the built-in default, in order of precedence:
 * 1. The field's own `x-jsf-errorMessage` (schema-level, one field at a time) — always wins.
 * 2. `globalErrorMessages` (form-level, applies to every field of that validation type) — used
 *    only when the field doesn't define its own override. This exists so consumers can set
 *    messages once (e.g. for i18n) instead of repeating `x-jsf-errorMessage` on every property.
 */
function applyCustomErrorMessages(
  errors: ValidationErrorWithMessage[],
  schema: JsfSchema,
  globalErrorMessages?: Partial<Record<SchemaValidationErrorType, string>>,
): ValidationErrorWithMessage[] {
  if (typeof schema !== 'object' || !schema || !errors.length) {
    return errors
  }

  return errors.map((error) => {
    const fieldSchema = error.schema
    const fieldErrorMessage = fieldSchema['x-jsf-errorMessage']?.[error.validation]
    if (fieldSchema && fieldErrorMessage) {
      return {
        ...error,
        message: fieldErrorMessage,
      }
    }

    const globalErrorMessage = globalErrorMessages?.[error.validation]
    if (globalErrorMessage) {
      return {
        ...error,
        message: globalErrorMessage,
      }
    }

    return error
  })
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - Legacy (v0 back-compat) validation options
 * @param errorMessages - Form-level default error messages per validation type (see `CreateHeadlessFormOptions.errorMessages`)
 * @returns The validation result
 */
function validate(
  value: SchemaValue,
  schema: JsfSchema,
  options: LegacyOptions = {},
  errorMessages?: Partial<Record<SchemaValidationErrorType, string>>,
): ValidationResult {
  const result: ValidationResult = {}
  const errors = validateSchema(value, schema, options)

  const errorsWithMessages = addErrorMessages(errors)
  const processedErrors = applyCustomErrorMessages(errorsWithMessages, schema, errorMessages)

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
   * When true, conditional branches (if/then/else) can only narrow options already present on
   * a base field; options a branch introduces that aren't on the base are dropped, unless the
   * base has no options property declared at all.
   * When false (default), branches may introduce new options anytime (legacy behavior) and a
   * deprecation warning is emitted. Will default to true in a future major release.
   * @default false
   */
  disallowNewConditionalOptions?: boolean

  /**
   * Custom user defined functions. A dictionary of name and function
   */
  customJsonLogicOps?: Record<string, (...args: any[]) => any>

  /**
   * Default error messages to use per validation type (e.g. `required`, `type`, `minLength`),
   * applied to every field that doesn't already define its own `x-jsf-errorMessage` for that
   * validation type.
   *
   * Useful for i18n and for apps with many fields: define each message once here instead of
   * repeating `x-jsf-errorMessage` on every property of the schema.
   *
   * Precedence (most specific wins): a field's own `x-jsf-errorMessage` > `errorMessages` (this
   * option) > the library's built-in default message.
   * @example
   * ```ts
   * createHeadlessForm(schema, {
   *   errorMessages: {
   *     required: 'This field is required.',
   *     minLength: 'This value is too short.',
   *   },
   * })
   * ```
   */
  errorMessages?: Partial<Record<SchemaValidationErrorType, string>>
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

/**
 * Recursively fills a value with the schema's `default` keywords.
 *
 * The `default` is only applied if the initial value is `undefined`.
 *
 * @param schema - The schema (or sub-schema) to read defaults from.
 * @param values - The current values at this path.
 * @returns The values with defaults filled in.
 */
function fillDefaults(schema: JsfSchema, values: SchemaValue): SchemaValue {
  if (typeof schema === 'boolean') {
    return values
  }

  // Object schema: recurse into properties, filling nested defaults.
  if (schema.properties) {
    const baseValues: ObjectValue = isObjectValue(values) ? { ...values } : {}

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const nestedValues = fillDefaults(propSchema, baseValues[key])
      if (nestedValues !== undefined) {
        baseValues[key] = nestedValues
      }
    }

    return baseValues
  }

  // Array of objects (group-array): fill defaults for each existing item.
  if (schema.items && typeof schema.items !== 'boolean' && Array.isArray(values)) {
    const itemSchema = schema.items
    return values.map(item => fillDefaults(itemSchema, item))
  }

  if (values === undefined && schema.default !== undefined) {
    return schema.default
  }

  return values
}

/**
 * JSON Logic uses a single global operators registry for all of its calls, so
 * we need to take extra measures to keep each createHeadlessForm deterministic.
 *
 * addCustomJsonLogicOperations and removeCustomJsonLogicOperations are called on each
 * createHeadlessForm and handleValidation in order to ensure each headless form's operators
 * are limited to its schema and validations without side effects.
 */
export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  validateOptions(options)
  const strictInputType = options.strictInputType || false
  const customJsonLogicOps = options?.customJsonLogicOps

  addCustomJsonLogicOperations(customJsonLogicOps)

  // Default values are obtain based on the base schema and the initial values
  // defaults set via sub-schemas (e.g. allOf, anyOf) are not considered here
  const initialValues = fillDefaults(
    schema,
    options.initialValues || {},
  )

  // Make a new version of the schema with all the computed attrs applied, as well as the final version of each property (taking into account conditional rules)
  const updatedSchema = calculateFinalSchema({
    schema,
    values: initialValues,
    options,
  })

  const fields = buildFields({ schema: updatedSchema, originalSchema: schema, strictInputType })

  // TODO: check if we need this isError variable exposed
  const isError = false

  const handleValidation = (value: SchemaValue) => {
    try {
      addCustomJsonLogicOperations(customJsonLogicOps)

      const updatedSchema = calculateFinalSchema({
        schema,
        values: value,
        options,
      })

      const result = validate(value, updatedSchema, options.legacyOptions, options.errorMessages)

      updateFieldProperties(fields, updatedSchema, schema)

      return result
    }
    finally {
      removeCustomJsonLogicOperations(customJsonLogicOps)
    }
  }

  removeCustomJsonLogicOperations(customJsonLogicOps)

  return {
    fields,
    isError,
    error: null,
    handleValidation,
  }
}
