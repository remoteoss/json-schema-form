import type { ValidationError, ValidationErrorPath } from '../errors'
import type { LegacyOptions } from '../form'
import type { JsonLogicContext, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

export function validateCondition(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: LegacyOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  if (schema.if === undefined) {
    return []
  }

  const conditionIsTrue = validateSchema(value, schema.if, options, path, jsonLogicContext).length === 0

  if (conditionIsTrue && schema.then !== undefined) {
    return validateSchema(value, schema.then, options, [...path, 'then'], jsonLogicContext)
  }

  if (!conditionIsTrue && schema.else !== undefined) {
    return validateSchema(value, schema.else, options, [...path, 'else'], jsonLogicContext)
  }

  return []
}
