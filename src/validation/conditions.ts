import type { ValidationError, ValidationErrorPath } from '../errors'
import type { LegacyOptions } from '../form'
import type { JsfSchema, JsonLogicContext, JsonLogicIfNodeSchema, NonBooleanJsfSchema, SchemaValue } from '../types'
import { computePropertyValues } from './json-logic'
import { validateSchema } from './schema'

export function evaluateIfCondition(
  value: SchemaValue,
  ifNode: JsfSchema | JsonLogicIfNodeSchema,
  options: LegacyOptions,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): boolean {
  // If a boolean value is used as a condition, we need to ignore the allowForbiddenValues option.
  // Otherwise, we can't evaluate the condition correctly
  const isTheConditionalABoolean = typeof ifNode === 'boolean'

  const conditionIsTrue = validateSchema(value, ifNode, { ...options, ...(isTheConditionalABoolean ? { allowForbiddenValues: false } : {}) }, path, jsonLogicContext).length === 0

  const matchedValidations = !isTheConditionalABoolean && 'validations' in ifNode ? validateJsonLogicValidations(value, ifNode.validations, jsonLogicContext) : true

  const matchedComputedValues = !isTheConditionalABoolean && 'computedValues' in ifNode ? validateJsonLogicComputedValues(value, ifNode.computedValues, jsonLogicContext) : true

  return conditionIsTrue && matchedValidations && matchedComputedValues
}

/**
 * Checks if all the rules under the `validations` property of an `if` node are valid.
 * These `validations` are defined in the `x-jsf-logic`.allOf.if.validations property of the schema.
 */
function validateJsonLogicValidations(value: SchemaValue, validations: JsfSchema | undefined, jsonLogicContext: JsonLogicContext | undefined): boolean {
  if (!jsonLogicContext) {
    throw new Error('`if` node with `validations` property but no `jsonLogicContext` present')
  }

  const allValidationsMatch = Object.entries(validations ?? {}).every(([name, property]) => {
    const validationRule = jsonLogicContext?.schema?.validations?.[name]?.rule
    if (!validationRule) {
      throw new Error(`\`if\` node with \`validations\` property but no validation rule present for ${name}`)
    }

    const currentValue = computePropertyValues(name, validationRule, value)
    return Object.hasOwn(property, 'const') && currentValue === property.const
  })

  return allValidationsMatch
}

/**
 * Checks if all the rules under the `computedValues` property of an `if` node are valid.
 * These `computedValues` are defined in the `x-jsf-logic`.allOf.if.computedValues property of the schema.
 */
function validateJsonLogicComputedValues(value: SchemaValue, computedValues: JsfSchema | undefined, jsonLogicContext: JsonLogicContext | undefined): boolean {
  if (!jsonLogicContext) {
    throw new Error('`if` node with `computedValues` property but no `jsonLogicContext` present')
  }

  const allComputedValuesMatch = Object.entries(computedValues ?? {}).every(([name, property]) => {
    const computedValueRule = jsonLogicContext?.schema?.computedValues?.[name]?.rule
    if (!computedValueRule) {
      throw new Error(`\`if\` node with \`computedValues\` property but no computed value rule present for ${name}`)
    }

    const currentValue = computePropertyValues(name, computedValueRule, value)
    return Object.hasOwn(property, 'const') && currentValue === property.const
  })

  return allComputedValuesMatch
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
