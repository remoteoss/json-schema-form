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

// When merging schemas, we should skip merging the if/then/else properties as we could be creating wrong conditions
const KEYS_TO_SKIP = ['if', 'then', 'else']

function isObject(value: any): boolean {
  return value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Merges schema 2 into schema 1 recursively
 * @param schema1 - The first schema to merge
 * @param schema2 - The second schema to merge
 */
export function deepMergeSchemas<T extends Record<string, any>>(schema1: T, schema2: T): void {
  // Handle null/undefined values
  if (!schema1 || !schema2) {
    return
  }

  // Handle non-objects
  if (typeof schema1 !== 'object' || typeof schema2 !== 'object') {
    return
  }

  // Merge all properties from schema2 into schema1
  for (const [key, schema2Value] of Object.entries(schema2)) {
    // let's skip merging some properties
    if (KEYS_TO_SKIP.includes(key)) {
      continue
    }

    const schema1Value = schema1[key]

    // If the value is an object:
    if (isObject(schema2Value)) {
      // If both schemas have this key and it's an object, merge recursively
      if (isObject(schema1Value)) {
        deepMergeSchemas(schema1Value, schema2Value)
      }
      // Otherwise, if the value is different, just assign it
      else if (schema1Value !== schema2Value) {
        schema1[key as keyof T] = schema2Value
      }
    }
    // If the value is an array, cycle through it and merge values if they're different (take objects into account)
    else if (schema1Value && Array.isArray(schema2Value)) {
      const originalArray = schema1Value
      // If the destiny value exists and it's an array, cycle through the incoming values and merge if they're different (take objects into account)
      for (const item of schema2Value) {
        if (item && typeof item === 'object') {
          deepMergeSchemas(originalArray, schema2Value)
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
          schema1[key as keyof T] = schema2Value as T[keyof T]
        }
      }
    }
    // Finally, if the value is different, just assign it
    else if (schema1[key] !== schema2Value) {
      schema1[key as keyof T] = schema2Value
    }
  }
}
