import type { Field } from './field/type'

type DiskSizeUnit = 'Bytes' | 'KB' | 'MB'

/**
 * @todo: Remove this.
 *
 * This utility only exists as an example of using V1 tests for V2 source.
 * It should not be tested, or even part of JSON Schema Form.
 */
export function convertDiskSizeFromTo(
  from: DiskSizeUnit,
  to: DiskSizeUnit,
): (value: number) => number {
  const multipliers: Record<DiskSizeUnit, number> = {
    Bytes: 1,
    KB: 1024,
    MB: 1024 * 1024,
  }

  return (value: number): number => {
    const fromMultiplier = multipliers[from]
    const toMultiplier = multipliers[to]
    return (value * fromMultiplier) / toMultiplier
  }
}

/**
 * Get a field from a list of fields by name.
 * If the field is nested, you can pass additional names to access a nested field.
 * @param fields - The list of fields to search in.
 * @param name - The name of the field to search for.
 * @param subNames - The names of the nested fields to access.
 * @returns The field if found, otherwise undefined.
 */
export function getField(fields: Field[], name: string, ...subNames: string[]) {
  const field = fields.find(f => f.name === name)
  if (subNames.length) {
    if (!field?.fields) {
      return undefined
    }
    return getField(field.fields, subNames[0], ...subNames.slice(1))
  }
  return field
}

// Helper function to convert KB to MB
export function convertKBToMB(kb: number): number {
  if (kb === 0)
    return 0
  const mb = kb / 1024 // KB to MB
  return Number.parseFloat(mb.toFixed(2)) // Keep 2 decimal places
}

// Keys to skip when merging schema objects
const KEYS_TO_SKIP = ['if', 'then', 'else']

function isObject(value: any): boolean {
  return value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Merges obj1 with obj2 recursively
 * @param obj1 - The first object to merge
 * @param obj2 - The second object to merge
 */
export function deepMergeSchemas<T extends Record<string, any>>(obj1: T, obj2: T): void {
  // Handle null/undefined
  if (!obj1 || !obj2) {
    return
  }

  // Handle non-objects
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object')
    return

  // Merge all properties from obj2 into obj1
  for (const [key, value] of Object.entries(obj2)) {
    // let's skip merging conditionals such as if, oneOf, then ,else, allOf, anyOf, etc.
    if (KEYS_TO_SKIP.includes(key)) {
      continue
    }

    // If the value is an object, merge recursively
    if (isObject(value)) {
      // If both objects have this key and it's an object, merge recursively
      if (isObject(obj1[key])) {
        deepMergeSchemas(obj1[key], value)
      }
      // Otherwise, if the value is different, assign it
      else if (obj1[key] !== value) {
        obj1[key as keyof T] = value
      }
    }
    // If the value is an array, cycle through it and merge values if they're different (take objects into account)
    else if (obj1[key] && Array.isArray(value)) {
      const originalArray = obj1[key]
      // If the destiny value exists and it's an array, cycle through the incoming values and merge if they're different (take objects into account)
      for (const item of value) {
        if (item && typeof item === 'object') {
          deepMergeSchemas(originalArray, value)
        }
        // "required" is a special case, it only allows for new elements to be added to the array
        else if (key === 'required') {
          // Add any new elements to the array
          if (!originalArray.find((originalItem: any) => originalItem === item)) {
            originalArray.push(item)
          }
        }
        // Otherwise, just assign it
        else {
          obj1[key as keyof T] = value as T[keyof T]
        }
      }
    }
    else if (obj1[key] !== value) {
      obj1[key as keyof T] = value
    }
  }
}
