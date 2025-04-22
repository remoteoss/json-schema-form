import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsfSchema, JsfSchemaType, JsonLogicBag, SchemaValue } from '../types'
import { validateArray } from './array'
import { validateAllOf, validateAnyOf, validateNot, validateOneOf } from './composition'
import { validateCondition } from './conditions'
import { validateConst } from './const'
import { validateDate } from './custom/date'
import { validateEnum } from './enum'
import { validateFile } from './file'
import { validateJsonLogic } from './json-logic'
import { validateNumber } from './number'
import { validateObject } from './object'
import { validateString } from './string'
import { isObjectValue } from './util'

export interface ValidationOptions {
  /**
   * A null value will be treated as undefined.
   * That means that when validating a null value, against a non-required field that is not of type 'null' or ['null']
   * the validation will succeed instead of returning a type error.
   * @default false
   */
  treatNullAsUndefined?: boolean
}

/**
 * Get the type of a schema
 * @param schema - The schema to get the type of
 * @returns The type of the schema, or an array of types if the schema is an array.
 * If no type is defined, returns undefined.
 *
 * IMPORTANT:
 * We intentionally return 'undefined' (instead of defaulting to 'object') when no type is defined.
 * In JSON Schema 2020-12, an absent "type" keyword means there is no type constraint.
 * This change prevents erroneously enforcing a default type of 'object', which was causing false negatives
 * (e.g. when validating an "anyOf" schema without a "type").
 */
export function getSchemaType(schema: JsfSchema): JsfSchemaType | JsfSchemaType[] | undefined {
  if (typeof schema === 'boolean') {
    return 'boolean'
  }

  if (schema.type !== undefined) {
    return schema.type
  }

  return undefined
}

/**
 * Validate the type of a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * When getSchemaType returns undefined, this function skips type validation.
 * This aligns with JSON Schema 2020-12 semantics: if no type is provided, no type check is enforced.
 */
function validateType(
  value: SchemaValue,
  schema: JsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const schemaType = getSchemaType(schema)

  // Skip type-checking if no type is specified.
  if (schemaType === undefined) {
    return []
  }

  if (schemaType === 'null' && value === null) {
    return []
  }

  const valueType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

  if (Array.isArray(schemaType)) {
    // Handle cases where schema type is an array (e.g., ["string", "null"])
    if (value === null && schemaType.includes('null')) {
      return []
    }

    for (const type of schemaType) {
      if (type === 'array' && Array.isArray(value)) {
        return [] // Correctly validate array type
      }
      if (valueType === 'number' && type === 'integer' && Number.isInteger(value)) {
        return []
      }
      if (valueType === type || (type === 'null' && value === null)) {
        return []
      }
    }
  }
  else {
    // Handle cases where schema type is a single type string
    if (schemaType === 'array' && Array.isArray(value)) {
      return [] // Correctly validate array type
    }
    if (valueType === 'number' && schemaType === 'integer' && Number.isInteger(value)) {
      return []
    }
    if (valueType === schemaType) {
      return []
    }
  }

  // If none of the conditions matched, it's a type error
  return [{ path, validation: 'type' }]
}

/**
 * Validate a value against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * This function is the main validation function that implements JSON Schema validation.
 * The validation process follows this order:
 * 1. Handle undefined values and the required constraint
 * 2. Handle boolean schemas (true allows everything, false allows nothing)
 * 3. Validate against base schema constraints:
 *    - Type validation (if type is specified)
 *    - Required properties
 *    - Boolean validation
 *    - Enum validation
 *    - Const validation
 *    - Type-specific validations (string, number, object)
 * 4. Validate against composition keywords in this order:
 *    - not (negates the validation of a subschema)
 *    - allOf (all subschemas must be valid)
 *    - anyOf (at least one subschema must be valid)
 *    - oneOf (exactly one subschema must be valid)
 *
 * @see validateType - For type validation behavior
 * @see validateSchemaWithoutComposition - For base schema validation
 * @see https://json-schema.org/understanding-json-schema/reference/combining.html
 */
export function validateSchema(
  value: SchemaValue,
  schema: JsfSchema,
  options: ValidationOptions = {},
  path: ValidationErrorPath = [],
  rootJsonLogicBag?: JsonLogicBag,
): ValidationError[] {
  // If we have a rootJsonLogicBag, we shoud use that. If not, we try to check for the 'x-jsf-logic' property in the schema.
  let jsonLogicBag = rootJsonLogicBag
  if (!rootJsonLogicBag && schema['x-jsf-logic']) {
    jsonLogicBag = {
      schema: schema['x-jsf-logic'],
      value,
    }
  }

  const valueIsUndefined = value === undefined || (value === null && options.treatNullAsUndefined)
  const errors: ValidationError[] = []

  // Check if it is a file input (needed early for null check)
  const presentation = schema['x-jsf-presentation']
  const isExplicitFileInput = presentation?.inputType === 'file'
  const hasFileKeywords
    = typeof presentation?.maxFileSize === 'number' || typeof presentation?.accept === 'string'
  const isPotentialFileInput = isExplicitFileInput || hasFileKeywords

  // Handle undefined value
  if (valueIsUndefined) {
    return []
  }

  // Handle boolean schemas
  if (typeof schema === 'boolean') {
    return schema ? [] : [{ path, validation: 'valid' }]
  }

  let typeValidationErrors: ValidationError[] = []
  // Skip standard type validation ONLY if inputType is explicitly 'file'
  // (The null check above already handled null for potential file inputs)
  if (!isExplicitFileInput) {
    typeValidationErrors = validateType(value, schema, path)
    if (typeValidationErrors.length > 0) {
      return typeValidationErrors
    }
  }

  // If the schema defines "required", run required checks even when type is undefined.
  if (schema.required && isObjectValue(value)) {
    const missingKeys = schema.required.filter((key: string) => {
      const fieldValue = value[key]
      // Field is considered missing if it's undefined OR
      // if it's null AND treatNullAsUndefined option is true
      return fieldValue === undefined || (fieldValue === null && options.treatNullAsUndefined)
    })

    for (const key of missingKeys) {
      errors.push({
        path: [...path, key],
        validation: 'required',
      })
    }
  }

  // Call validateFile if potential file input AND value is an array
  // (null/undefined cases handled above, non-arrays handled by type check)
  const shouldCallValidateFile = isPotentialFileInput && Array.isArray(value)

  // --- Other Validations ---
  return [
    ...errors,
    // JSON-schema spec validations
    ...validateConst(value, schema, path),
    ...validateEnum(value, schema, path),
    ...validateObject(value, schema, options, jsonLogicBag, path),
    ...validateArray(value, schema, options, jsonLogicBag, path),
    ...validateString(value, schema, path),
    ...validateNumber(value, schema, path),
    // File validation (conditionally run)
    ...(shouldCallValidateFile ? validateFile(value, schema, path) : []),
    // Composition and conditional logic
    ...validateNot(value, schema, options, jsonLogicBag, path),
    ...validateAllOf(value, schema, options, jsonLogicBag, path),
    ...validateAnyOf(value, schema, options, jsonLogicBag, path),
    ...validateOneOf(value, schema, options, jsonLogicBag, path),
    ...validateCondition(value, schema, options, jsonLogicBag, path),
    // Custom validations
    ...validateDate(value, schema, options, path),
    ...validateJsonLogic(schema, jsonLogicBag, path),
  ]
}
