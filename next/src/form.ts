import type { ValidationError, ValidationErrorPath } from './errors'
import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema, SchemaValue } from './types'
import type { ValidationOptions } from './validation/schema'
import { getErrorMessage } from './errors/messages'
import { buildFieldObject } from './field/object'
import { mutateFields } from './mutations'
import { validateSchema } from './validation/schema'

export { ValidationOptions } from './validation/schema'

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
 */
export interface FormErrors {
  [key: string]: string | FormErrors
}

export interface ValidationResult {
  formErrors?: FormErrors
}

/**
 * Remove composition keywords and their indices as well as conditional keywords from the path
 * @param path - The path to clean
 * @returns The cleaned path
 * @example
 * ```ts
 * cleanErrorPath(['some_object','allOf', 0, 'then', 'field'])
 * // ['some_object', 'field']
 * ```
 */
function cleanErrorPath(path: ValidationErrorPath): ValidationErrorPath {
  const result: ValidationErrorPath = []

  for (let i = 0; i < path.length; i++) {
    const segment = path[i]

    if (['allOf', 'anyOf', 'oneOf'].includes(segment as string)) {
      if (i + 1 < path.length && typeof path[i + 1] === 'number') {
        i++
      }
      continue
    }

    if (segment === 'then' || segment === 'else') {
      continue
    }

    result.push(segment)
  }

  return result
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
function validationErrorsToFormErrors(errors: ValidationErrorWithMessage[]): FormErrors | null {
  if (errors.length === 0) {
    return null
  }

  // Use a more functional approach with reduce
  return errors.reduce<FormErrors>((result, error) => {
    const { path } = error

    // Handle schema-level errors (empty path)
    if (path.length === 0) {
      result[''] = error.message
      return result
    }

    // Clean the path to remove intermediate composition structures
    const cleanedPath = cleanErrorPath(path)

    // For all paths, recursively build the nested structure
    let current = result

    // Process all segments except the last one (which will hold the message)
    cleanedPath.slice(0, -1).forEach((segment) => {
      // If this segment doesn't exist yet or is currently a string (from a previous error),
      // initialize it as an object
      if (!(segment in current) || typeof current[segment] === 'string') {
        current[segment] = {}
      }

      current = current[segment] as FormErrors
    })

    // Set the message at the final level
    if (cleanedPath.length > 0) {
      const lastSegment = cleanedPath[cleanedPath.length - 1]
      current[lastSegment] = error.message
    }
    else {
      // Fallback for unexpected path structures
      result[''] = error.message
    }

    return result
  }, {})
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
function validate(value: SchemaValue, schema: JsfSchema, options: ValidationOptions = {}): ValidationResult {
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
   * The validation options to use for the form
   */
  validationOptions?: ValidationOptions
  /**
   * When enabled, ['x-jsf-presentation'].inputType is required for all properties.
   * @default false
   */
  strictInputType?: boolean
}

function buildFields(params: { schema: JsfObjectSchema, strictInputType?: boolean }): Field[] {
  const { schema, strictInputType } = params
  const fields = buildFieldObject(schema, 'root', true, strictInputType).fields || []
  return fields
}

export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  const initialValues = options.initialValues || {}
  const strictInputType = options.strictInputType || false
  const fields = buildFields({ schema, strictInputType })

  // Making sure field properties are correct for the initial values
  mutateFields(fields, initialValues, schema)

  // TODO: check if we need this isError variable exposed
  const isError = false

  const handleValidation = (value: SchemaValue) => {
    const result = validate(value, schema, options.validationOptions)

    // Fields properties might have changed, so we need to reset the fields by updating them in place
    buildFieldsInPlace(fields, schema)

    // Updating field properties based on the new form value
    mutateFields(fields, value, schema, options.validationOptions)

    return result
  }

  return {
    fields,
    isError,
    error: null,
    handleValidation,
  }
}

/**
 * Updates fields in place based on a schema, recursively if needed
 * @param fields - The fields array to mutate
 * @param schema - The schema to use for updating fields
 */
function buildFieldsInPlace(fields: Field[], schema: JsfObjectSchema): void {
  // Clear existing fields array
  fields.length = 0

  // Get new fields from schema
  const newFields = buildFieldObject(schema, 'root', true).fields || []

  // Push all new fields into existing array
  fields.push(...newFields)

  // Recursively update any nested fields
  for (const field of fields) {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    if (field.fields && schema.properties?.[field.name]?.type === 'object') {
      buildFieldsInPlace(field.fields, schema.properties[field.name] as JsfObjectSchema)
    }
  }
}
