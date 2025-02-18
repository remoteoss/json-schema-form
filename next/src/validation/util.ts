export function deepEqual(a: any, b: any): boolean {
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
