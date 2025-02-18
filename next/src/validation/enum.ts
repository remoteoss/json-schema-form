import type { ValidationError } from '../form'
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
 * validateEnum('baz', { enum: ['foo', 'bar'] }) // [{ path: [], validation: 'enum', message: 'must be one of ["foo", "bar"]' }]
 * ```
 */
export function validateEnum(value: SchemaValue, schema: NonBooleanJsfSchema, path: string[] = []): ValidationError[] {
  if (schema.enum === undefined) {
    return []
  }

  if (!schema.enum.some(enumValue => deepEqual(enumValue, value))) {
    return [{ path, validation: 'enum', message: `must be one of ${JSON.stringify(schema.enum)}` }]
  }

  return []
}
