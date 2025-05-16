import type { Field } from './field/type'
import type { JsfPresentation, JsfSchema } from './types'

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

export function getUiPresentation(schema: JsfSchema): JsfPresentation | undefined {
  return schema['x-jsf-presentation'] || schema['x-jsf-ui']
}
