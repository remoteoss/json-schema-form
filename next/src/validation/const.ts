import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { deepEqual } from './util'

/**
 * Validate that a value is equal to a constant
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the value
 * @returns An array of validation errors
 * @description This function validates that a value is equal to a constant.
 * The constant is defined in the `const` property of the schema.
 * The value is validated against the constant using deep equality.
 * @see https://json-schema.org/understanding-json-schema/reference/const
 * @see https://json-schema.org/draft/2020-12/json-schema-validation#name-enum
 */
export function validateConst(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const constValue = typeof schema.const !== 'undefined' ? schema.const : schema.value

  if (constValue === undefined) {
    return []
  }

  if (!deepEqual(constValue, value)) {
    return [
      { path, validation: 'const', schema, value },
    ]
  }

  return []
}
