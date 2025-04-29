import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsonLogicContext, NonBooleanJsfSchema } from '../types'
import jsonLogic from 'json-logic-js'

/**
 * (Ported from v0. TODO: check why we need it and if the name is correct)
 * We removed undefined values in this function as `json-logic` ignores them.
 * Means we will always check against a value for validations.
 *
 * @param {object} values - a set of values from a form
 * @returns {object} values object without any undefined
 */
function replaceUndefinedValuesWithNulls(values: any = {}) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined || value === null ? Number.NaN : value }
  }, {})
}

/**
 * Validates the JSON Logic for a given schema.
 *
 * @param {NonBooleanJsfSchema} schema - The JSON Schema to validate.
 * @param {JsonLogicContext | undefined} jsonLogicContext - The JSON Logic context.
 */
export function validateJsonLogic(
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

    const result: any = jsonLogic.apply(validationData.rule, replaceUndefinedValuesWithNulls(formValue))

    // If the condition is false, we return a validation error
    if (result === false) {
      return [{ path, validation: 'json-logic', customErrorMessage: validationData.errorMessage, schema, value: formValue } as ValidationError]
    }

    return []
  }).flat()
}
