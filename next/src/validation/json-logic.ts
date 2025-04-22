import type { ValidationError, ValidationErrorPath } from '../errors'
import type { JsonLogicBag, NonBooleanJsfSchema } from '../types'
import type { ValidationOptions } from './schema'
import jsonLogic from 'json-logic-js'

/**
 * (Ported from v0)
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

export function validateJsonLogic(
  schema: NonBooleanJsfSchema,
  options: ValidationOptions,
  jsonLogicBag: JsonLogicBag | undefined,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const validations = schema['x-jsf-logic-validations']

  // if the current schema has no validations, we skip the validation
  if (!validations || validations.length === 0) {
    return []
  }

  return validations.map((validation: string) => {
    const validationData = jsonLogicBag?.schema?.validations?.[validation]
    const formValue = jsonLogicBag?.value

    if (!validationData) {
      return []
    }

    const result: any = jsonLogic.apply(validationData.rule, replaceUndefinedValuesWithNulls(formValue))

    // If the condition is false, we return a validation error
    if (result === false) {
      return [{ path, validation: 'json-logic', customErrorMessage: validationData.errorMessage } as ValidationError]
    }

    return []
  }).flat()
}
