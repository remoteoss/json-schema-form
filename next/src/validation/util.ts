import type { ObjectValue, SchemaValue } from '../types'

/**
 * Type guard to check if a given SchemaValue is an ObjectValue
 * @param v - The value to check
 * @returns `true` if the value is an object, `false` otherwise
 */
export function isObjectValue(v: SchemaValue): v is ObjectValue {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Type guard to check if a given SchemaValue is an Array
 * @param v - The value to check
 * @returns `true` if the value is an array, `false` otherwise
 */
export function isArrayValue(v: SchemaValue): v is Array<SchemaValue> {
  return Array.isArray(v)
}

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
export function deepEqual(a: SchemaValue, b: SchemaValue): boolean {
  if (typeof a !== typeof b) {
    return false
  }

  if (a === b) {
    return true
  }

  // If both are null, the check above has returned true.
  // If one is null, we return false because we know they are not equal
  // and since `typeof null === 'object'`, we must not let the null value
  // pass through as an object.
  if (a === null || b === null) {
    return false
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
  if (isObjectValue(a) && isObjectValue(b)) {
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
