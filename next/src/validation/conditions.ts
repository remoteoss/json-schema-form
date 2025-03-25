import type { ValidationError, ValidationErrorPath } from '../errors'
import type { ValidationOptions } from '../form'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

export function validateCondition(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: ValidationOptions,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (schema.if === undefined) {
    return []
  }

  const conditionIsTrue = validateSchema(value, schema.if, options, path).length === 0

  if (conditionIsTrue && schema.then !== undefined) {
    return validateSchema(value, schema.then, options, [...path, 'then'])
  }

  if (!conditionIsTrue && schema.else !== undefined) {
    return validateSchema(value, schema.else, options, [...path, 'else'])
  }

  return []
}
