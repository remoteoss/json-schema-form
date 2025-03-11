import type { ValidationError } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

export function validateCondition(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  required: boolean,
  path: string[],
): ValidationError[] {
  if (schema.if === undefined) {
    return []
  }

  const conditionIsTrue = validateSchema(value, schema.if, required, path).length === 0

  if (conditionIsTrue && schema.then !== undefined) {
    return validateSchema(value, schema.then, required, [...path, 'then'])
  }

  if (!conditionIsTrue && schema.else !== undefined) {
    return validateSchema(value, schema.else, required, [...path, 'else'])
  }

  return []
}
