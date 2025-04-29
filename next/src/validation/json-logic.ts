import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsonLogicContext, NonBooleanJsfSchema, SchemaValue } from '../types'
import type { ValidationOptions } from './schema'
import jsonLogic from 'json-logic-js'
import { validateSchema } from './schema'

/**
 * jsonLogic interprets  undefined and null values differently when running comparisons and that creates inconsistent results.
 * This function attempts to fix that (ported from v0).
 *
 * @param {object} values - a set of values from a form
 * @returns {object} values object without any undefined
 */
function replaceUndefinedAndNullValuesWithNaN(values: any = {}) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined || value === null ? Number.NaN : value }
  }, {})
}

/**
 * Validates the JSON Logic rules for a given schema.
 *
 * @param {NonBooleanJsfSchema} schema - JSON Schema to validate.
 * @param {JsonLogicContext | undefined} jsonLogicContext - JSON Logic context.
 * @param {ValidationErrorPath} path - Current validation error path.
 */
export function validateJsonLogicRules(
  schema: NonBooleanJsfSchema,
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const validations = schema['x-jsf-logic-validations']

  // if the current schema has no validations, we skip the validation
  if (!validations || validations.length === 0) {
    return []
  }

  return validations.map((validation: string) => {
    const validationData = jsonLogicContext?.schema?.validations?.[validation]
    const formValue = jsonLogicContext?.value

    if (!validationData) {
      return []
    }

    const result: any = jsonLogic.apply(validationData.rule, replaceUndefinedAndNullValuesWithNaN(formValue))

    // If the condition is false, we return a validation error
    if (result === false) {
      return [{ path, validation: 'json-logic', customErrorMessage: validationData.errorMessage, schema, value: formValue } as ValidationError]
    }

    return []
  }).flat()
}

/**
 * Validates the JSON Logic computed attributes for a given schema.
 *
 * @param {SchemaValue} values - Current form values.
 * @param {NonBooleanJsfSchema} schema - JSON Schema to validate.
 * @param {ValidationOptions} options - Validation options.
 * @param {JsonLogicContext | undefined} jsonLogicContext - JSON Logic context.
 * @param {ValidationErrorPath} path - Current validation error path.
 */
export function validateJsonLogicComputedAttributes(
  values: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: ValidationOptions = {},
  jsonLogicContext: JsonLogicContext | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const computedAttributes = schema['x-jsf-logic-computedAttrs']

  // if the current schema has no computed attributes, we skip the validation
  if (!computedAttributes || Object.keys(computedAttributes).length === 0) {
    return []
  }

  // Create a copy of the schema
  const schemaCopy: NonBooleanJsfSchema = { ...schema }

  // Remove the computed attributes from the schema
  delete schemaCopy['x-jsf-logic-computedAttrs']

  // add the new computed attributes to the schema
  Object.entries(computedAttributes).forEach(([schemaKey, computationName]) => {
    const computedAttributeRule = jsonLogicContext?.schema?.computedValues?.[computationName]?.rule
    const formValue = jsonLogicContext?.value

    // if the computation name does not reference any valid rule, we ignore it
    if (!computedAttributeRule) {
      return
    }

    const result: any = jsonLogic.apply(computedAttributeRule, replaceUndefinedAndNullValuesWithNaN(formValue))

    if (typeof result === 'undefined') {
      return
    }

    schemaCopy[schemaKey as keyof NonBooleanJsfSchema] = result
  })

  return validateSchema(values, schemaCopy, options, path, jsonLogicContext)
}
