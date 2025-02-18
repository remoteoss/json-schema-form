import type { ValidationError } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { deepEqual } from './util'

export function validateConst(value: SchemaValue, schema: NonBooleanJsfSchema, path: string[] = []): ValidationError[] {
  if (schema.const === undefined) {
    return []
  }

  if (!deepEqual(schema.const, value)) {
    return [{ path, validation: 'const', message: `must be equal to ${JSON.stringify(schema.const)}` }]
  }

  return []
}
