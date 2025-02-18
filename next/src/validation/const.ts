import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'

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

export function validateConst(value: SchemaValue, schema: NonBooleanJsfSchema, path: string[] = []): ValidationError[] {
  if (schema.const === undefined) {
    return []
  }

  if (!deepEqual(schema.const, value)) {
    return [{ path, validation: 'const', message: `must be equal to ${JSON.stringify(schema.const)}` }]
  }

  return []
}
