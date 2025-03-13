import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { deepEqual } from './util'

/**
 * Validate that the value is one of the allowed enum values
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the value
 * @returns An array of validation errors
 *
 * @example
 * ```ts
 * validateEnum('foo', { enum: ['foo', 'bar'] }) // []
 * validateEnum('baz', { enum: ['foo', 'bar'] }) // [{ path: [], validation: 'enum', message: 'The option "baz" is not valid.' }]
 * ```
 * @see https://json-schema.org/understanding-json-schema/reference/enum
 * @see https://json-schema.org/draft/2020-12/json-schema-validation#name-enum
 */
export function validateEnum(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (schema.enum === undefined) {
    return []
  }

  if (!schema.enum.some(enumValue => deepEqual(enumValue, value))) {
    return [
      { path, validation: 'enum' },
    ]
  }

  return []
}
