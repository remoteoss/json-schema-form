import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'

/**
 * Compare two values for deep equality
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns `true` if the values are equal, `false` otherwise
 * @description This function is compares two values for deep equality.
 * Primitives are compared using strict equality.
 * Arrays are compared element by element using recursion.
 * Objects are compared key by key using recursion.
 */
function deepEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) {
    return false
  }

  if (a === b) {
    return true
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    // If the array lengths are different, the arrays are not equal
    if (a.length !== b.length) {
      return false
    }

    // If all values are equal, the arrays are equal
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  // Handle objects
  if (typeof a === 'object') {
    const aKeys = Object.keys(a).sort()
    const bKeys = Object.keys(b).sort()

    // If the key lengths are different, the objects are not equal
    if (aKeys.length !== bKeys.length) {
      return false
    }

    // If the keys are different, the objects are not equal
    if (!deepEqual(aKeys, bKeys)) {
      return false
    }

    // Check all values
    return aKeys.every(key => deepEqual(a[key], b[key]))
  }

  return false
}

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
export function validateConst(value: SchemaValue, schema: NonBooleanJsfSchema, path: string[] = []): ValidationError[] {
  if (schema.const === undefined) {
    return []
  }

  if (!deepEqual(schema.const, value)) {
    return [{ path, validation: 'const', message: `must be equal to ${JSON.stringify(schema.const)}` }]
  }

  return []
}
