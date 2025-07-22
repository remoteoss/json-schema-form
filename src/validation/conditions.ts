import type { ValidationError, ValidationErrorPath } from '../errors'
import type { LegacyOptions } from '../form'
import type { JsfSchema, JsonLogicContext, NonBooleanJsfSchema, SchemaValue } from '../types'
import { validateSchema } from './schema'

export function evaluateIfCondition(
  value: SchemaValue,
  ifNode: JsfSchema,
  options: LegacyOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): boolean {
  // If a boolean value is used as a condition, we need to ignore the allowForbiddenValues option.
  // Otherwise, we can't evaluate the condition correctly
  const isTheConditionalABoolean = typeof ifNode === 'boolean'
  const conditionIsTrue = validateSchema(value, ifNode, { ...options, ...(isTheConditionalABoolean ? { allowForbiddenValues: false } : {}) }, path, jsonLogicContext).length === 0

  return conditionIsTrue
}

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

  // When evaluating a condition, we should ignore the allowForbiddenValues option as it will lead to wrong results
  const conditionIsTrue = evaluateIfCondition(value, schema.if, options, jsonLogicContext, path)

  if (conditionIsTrue && schema.then !== undefined) {
    return validateSchema(value, schema.then, options, [...path, 'then'], jsonLogicContext)
  }

  if (!conditionIsTrue && schema.else !== undefined) {
    return validateSchema(value, schema.else, options, [...path, 'else'], jsonLogicContext)
  }

  return []
}
