import type { ValidationError } from './errors'
import type { Field } from './field/type'
import type { JsfObjectSchema, JsfSchema, NonBooleanJsfSchema, SchemaValue } from './types'
import { getErrorMessage } from './errors/messages'
import { buildFieldObject } from './field/object'
import { validateSchema } from './validation/schema'
import { isObjectValue } from './validation/util'

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

    // For allOf validation errors, show the error at the field level
    const allOfIndex = path.indexOf('allOf')
    if (allOfIndex !== -1) {
      // Get the field path (everything before 'allOf')
      const fieldPath = path.slice(0, allOfIndex)
      let current = result

      // Process all segments except the last one (which will hold the message)
      fieldPath.slice(0, -1).forEach((segment) => {
        // If this segment doesn't exist yet or is currently a string (from a previous error),
        // initialize it as an object
        if (!(segment in current) || typeof current[segment] === 'string') {
          current[segment] = {}
        }

        // Cast is safe because we just ensured it's an object
        current = current[segment] as FormErrors
      })

      // Set the message at the field level
      if (fieldPath.length > 0) {
        const lastSegment = fieldPath[fieldPath.length - 1]
        current[lastSegment] = error.message
      }

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
    current[lastSegment] = error.message

    return result
  }, {})
}

interface ValidationErrorWithMessage extends ValidationError {
  message: string
}

function getSchemaAndValueAtPath(rootSchema: JsfSchema, rootValue: SchemaValue, path: (string | number)[]): { schema: JsfSchema, value: SchemaValue } {
  let currentSchema = rootSchema
  let currentValue = rootValue

  for (const segment of path) {
    if (typeof currentSchema === 'object' && currentSchema !== null) {
      if (currentSchema.properties && currentSchema.properties[segment]) {
        currentSchema = currentSchema.properties[segment]
        if (isObjectValue(currentValue)) {
          currentValue = currentValue[segment]
        }
      }
      else if (currentSchema.items && typeof currentSchema.items !== 'boolean') {
        currentSchema = currentSchema.items
        if (Array.isArray(currentValue)) {
          currentValue = currentValue[Number(segment)]
        }
      }
      // Skip the 'allOf', 'anyOf', and 'oneOf' segments, the next segment will be the index
      else if (segment === 'allOf' && currentSchema.allOf) {
        continue
      }
      else if (segment === 'anyOf' && currentSchema.anyOf) {
        continue
      }
      else if (segment === 'oneOf' && currentSchema.oneOf) {
        continue
      }
      // If we have we are in a composition context, get the subschema
      else if (currentSchema.allOf || currentSchema.anyOf || currentSchema.oneOf) {
        const index = Number(segment)
        if (currentSchema.allOf && index >= 0 && index < currentSchema.allOf.length) {
          currentSchema = currentSchema.allOf[index]
        }
        else if (currentSchema.anyOf && index >= 0 && index < currentSchema.anyOf.length) {
          currentSchema = currentSchema.anyOf[index]
        }
        else if (currentSchema.oneOf && index >= 0 && index < currentSchema.oneOf.length) {
          currentSchema = currentSchema.oneOf[index]
        }
      }
    }
  }

  return { schema: currentSchema, value: currentValue }
}

function addErrorMessages(rootValue: SchemaValue, rootSchema: JsfSchema, errors: ValidationError[]): ValidationErrorWithMessage[] {
  return errors.map((error) => {
    const { schema: errorSchema, value: errorValue } = getSchemaAndValueAtPath(rootSchema, rootValue, error.path)

    return {
      ...error,
      message: getErrorMessage(errorSchema, errorValue, error.validation),
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

  // Apply custom error messages before converting to form errors
  const errorsWithMessages = addErrorMessages(value, schema, errors)
  const processedErrors = applyCustomErrorMessages(errorsWithMessages, schema)

  const formErrors = validationErrorsToFormErrors(processedErrors, schema, value)

  if (formErrors) {
    result.formErrors = formErrors
  }

  return result
}

export interface ValidationOptions {
  /**
   * A null value will be treated as undefined.
   * That means that when validating a null value, against a non-required field that is not of type 'null' or ['null']
   * the validation will succeed instead of returning a type error.
   * @default false
   */
  treatNullAsUndefined?: boolean
}

export interface CreateHeadlessFormOptions {
  initialValues?: SchemaValue
  validationOptions?: ValidationOptions
}

function buildFields(params: { schema: JsfObjectSchema }): Field[] {
  const { schema } = params
  return buildFieldObject(schema, 'root', true).fields || []
}

export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  const errors = validateSchema(options.initialValues, schema, options.validationOptions)
  const errorsWithMessages = addErrorMessages(options.initialValues, schema, errors)
  const validationResult = validationErrorsToFormErrors(errorsWithMessages)
  const isError = validationResult !== null

  const handleValidation = (value: SchemaValue) => {
    const result = validate(value, schema, options.validationOptions)
    return result
  }

  return {
    fields: buildFields({ schema }),
    isError,
    error: null,
    handleValidation,
  }
}
