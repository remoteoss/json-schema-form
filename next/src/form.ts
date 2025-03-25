import type { ValidationError, ValidationErrorPath } from './errors'
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
      // Skip the 'then' and 'else' segments, the next segment will be the field name
      else if ((segment === 'then' || segment === 'else') && currentSchema[segment]) {
        currentSchema = currentSchema[segment]
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
 * Update the visibility of fields based on the values and schema
 * @param fields - The fields to update
 * @param values - The values of the fields
 * @param schema - The schema to validate against
 * @param options - The validation options
 */
function updateFieldVisibility(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  // Skip non-object values
  if (!isObjectValue(values)) {
    return
  }

  // First check if any field has a specific other_job parent needing attention
  const otherJobField = fields.find(f => f.name === 'other_job')
  if (otherJobField && otherJobField.fields) {
    // Check if has_other_job exists and what its value is
    if (isObjectValue(values)) {
      // Find rules in schema related to has_other_job
      let hasOtherJobRules: NonBooleanJsfSchema[] = []

      if (schema.allOf && Array.isArray(schema.allOf)) {
        hasOtherJobRules = schema.allOf.filter((rule) => {
          if (typeof rule === 'object' && rule !== null && 'if' in rule) {
            const ifCondition = rule.if
            return typeof ifCondition === 'object'
              && ifCondition !== null
              && 'properties' in ifCondition
              && ifCondition.properties
              && 'has_other_job' in ifCondition.properties
          }
          return false
        }) as NonBooleanJsfSchema[]
      }

      // Apply visibility based on rules directly
      if (hasOtherJobRules.length > 0) {
        for (const rule of hasOtherJobRules) {
          if (typeof rule !== 'object' || rule === null || !('if' in rule))
            continue

          // Check if the condition matches
          const ifErrors = validateSchema(values, rule.if!, options)
          const conditionMatches = ifErrors.length === 0

          // Handle the subfields of other_job based on condition
          if (otherJobField.fields) {
            for (const subfield of otherJobField.fields) {
              if (conditionMatches && rule.then) {
                // If condition matches and field is in required, make visible
                const isRequired = typeof rule.then === 'object'
                  && rule.then !== null
                  && 'required' in rule.then
                  && Array.isArray(rule.then.required)
                  && rule.then.required.includes(subfield.name)

                if (isRequired) {
                  subfield.isVisible = true
                }
              }
              else if (!conditionMatches && rule.else) {
                // If condition doesn't match and field is in properties with false, hide it
                const shouldHide = typeof rule.else === 'object'
                  && rule.else !== null
                  && 'properties' in rule.else
                  && rule.else.properties
                  && subfield.name in rule.else.properties
                  && rule.else.properties[subfield.name] === false

                if (shouldHide) {
                  subfield.isVisible = false
                }
              }
            }
          }
        }
      }
    }
  }

  // Continue with the generic processing for all other fields
  processObjectFieldsWithConditions(fields, values, schema, options)
}

/**
 * Process object fields with their own conditional logic
 */
function processObjectFieldsWithConditions(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!isObjectValue(values)) {
    return
  }

  // First, apply top-level rules to current fields
  applySchemaRules(fields, values, schema, options)

  // Special handling for nested object fields
  for (const fieldName in schema.properties) {
    const fieldSchema = schema.properties[fieldName]

    // Skip non-object schemas and schemas without conditional logic
    if (typeof fieldSchema !== 'object' || fieldSchema === null
      || Array.isArray(fieldSchema) || !fieldSchema.allOf) {
      continue
    }

    // This is an object schema with conditional logic - find the corresponding field
    const objectField = fields.find(f => f.name === fieldSchema.title || f.name === fieldName)
    if (!objectField || !objectField.fields || objectField.fields.length === 0) {
      continue
    }

    // Get the field values
    const fieldValues = isObjectValue(values[fieldName])
      ? values[fieldName]
      : isObjectValue(values[objectField.name]) ? values[objectField.name] : {}

    // Process the field's own conditional logic
    applySchemaRules(objectField.fields, fieldValues, fieldSchema as JsfObjectSchema, options)

    // Recursively process nested fields
    if (objectField.isVisible) {
      processObjectFieldsWithConditions(
        objectField.fields,
        fieldValues,
        fieldSchema as JsfObjectSchema,
        options,
      )
    }
  }
}

/**
 * Apply schema rules to a group of fields
 */
function applySchemaRules(
  fields: Field[],
  values: SchemaValue,
  schema: JsfObjectSchema,
  options: ValidationOptions = {},
) {
  if (!schema.allOf || !Array.isArray(schema.allOf) || !isObjectValue(values)) {
    return
  }

  // Collect all valid conditional rules
  const conditionalRules = schema.allOf
    .filter(rule => typeof rule === 'object' && rule !== null && 'if' in rule)
    .map((rule) => {
      const ruleObj = rule as NonBooleanJsfSchema

      // Check if rule matches using the standard validation
      const ifErrors = validateSchema(values, ruleObj.if!, options)
      const matches = ifErrors.length === 0

      // Check if any of the required fields have type validation errors
      // This is to prevent fields from being shown when the required field has a type error
      let hasTypeErrors = false
      if (matches
        && typeof ruleObj.if === 'object'
        && ruleObj.if !== null
        && 'required' in ruleObj.if
        && Array.isArray(ruleObj.if.required)) {
        const requiredFields = ruleObj.if.required
        hasTypeErrors = requiredFields.some((fieldName) => {
          if (!schema.properties || !schema.properties[fieldName]) {
            return false
          }
          const fieldSchema = schema.properties[fieldName]
          const fieldValue = values[fieldName]
          const fieldErrors = validateSchema(fieldValue, fieldSchema, options)
          return fieldErrors.some(error => error.validation === 'type')
        })
      }

      return { rule: ruleObj, matches: matches && !hasTypeErrors }
    })

  // Apply rules to each field
  for (const field of fields) {
    // Start with default visibility based on required status
    let isVisible = field.required

    // Apply each conditional rule
    for (const { rule, matches } of conditionalRules) {
      // If condition matches and there's a then clause
      if (matches && rule.then) {
        // If field is required in then clause, make it visible
        if (typeof rule.then === 'object' && rule.then !== null
          && 'required' in rule.then && Array.isArray(rule.then.required)) {
          if (rule.then.required.includes(field.name)) {
            isVisible = true
          }
        }
      }
      // If condition doesn't match and there's an else clause
      else if (!matches && rule.else) {
        // If field is explicitly set to false in properties, hide it
        if (typeof rule.else === 'object' && rule.else !== null
          && 'properties' in rule.else && rule.else.properties) {
          if (field.name in rule.else.properties
            && rule.else.properties[field.name] === false) {
            isVisible = false
          }
        }
      }
    }

    // Set final visibility
    field.isVisible = isVisible
  }
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

  const formErrors = validationErrorsToFormErrors(processedErrors)

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
  const fields = buildFieldObject(schema, 'root', true).fields || []
  return fields
}

export function createHeadlessForm(
  schema: JsfObjectSchema,
  options: CreateHeadlessFormOptions = {},
): FormResult {
  const fields = buildFields({ schema })
  updateFieldVisibility(fields, options.initialValues, schema)
  const isError = false

  const handleValidation = (value: SchemaValue) => {
    const result = validate(value, schema, options.validationOptions)
    updateFieldVisibility(fields, value, schema, options.validationOptions)
    return result
  }

  return {
    fields,
    isError,
    error: null,
    handleValidation,
  }
}
