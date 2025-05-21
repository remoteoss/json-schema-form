import type { ValidationError, ValidationErrorPath } from '../../errors'
import type { JsfPresentation, NonBooleanJsfSchema, SchemaValue } from '../../types'
import type { LegacyOptions } from '../schema'
import { getUiPresentation } from '../../utils'

export const DATE_FORMAT = 'yyyy-MM-dd'
type DateComparisonResult = 'LESSER' | 'GREATER' | 'EQUAL'

/**
 * Compare two dates and returns the ComparisonResult (LESSER, GREATER, EQUAL)
 * @param d1 - The first date
 * @param d2 - The second date
 * @returns 'LESSER' if the first date is less than the second date, 'GREATER' if the first date is greater than the second date, 'EQUAL' if the two dates are equal
 */
function compareDates(d1: string, d2: string): DateComparisonResult {
  const date1 = new Date(d1).getTime()
  const date2 = new Date(d2).getTime()

  if (date1 < date2) {
    return 'LESSER'
  }
  else if (date1 > date2) {
    return 'GREATER'
  }
  else {
    return 'EQUAL'
  }
};

/**
 * Validate that a date value is greater than or equal to the minimum date
 * @param value - The value to validate
 * @param minDate - The minimum date to validate against
 * @returns true if the date is greater than or equal to the minimum date, false otherwise
 */
function validateMinDate(value: string, minDate: string): boolean {
  const result = compareDates(value, minDate)
  return result === 'GREATER' || result === 'EQUAL'
};

/**
 * Validate that a date value is less than or equal to the maximum date
 * @param value - The value to validate
 * @param maxDate - The maximum date to validate against
 * @returns true if the date is less than or equal to the maximum date, false otherwise
 */
function validateMaxDate(value: string, maxDate: string): boolean {
  const result = compareDates(value, maxDate)

  return result === 'LESSER' || result === 'EQUAL'
};

/**
 * Validate that a date value is valid
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param options - The validation options
 * @param path - The path to the value
 * @returns An array of validation errors
 * @description This function validates that a date string value matches the maximum
 * and minimum date set in the x-jsf-presentation property.
 */
export function validateDate(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  options: LegacyOptions,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const isString = typeof value === 'string'
  const isEmptyString = value === ''
  const isUndefined = value === undefined || (value === null && options.treatNullAsUndefined)
  const isEmpty = isEmptyString || isUndefined
  const errors: ValidationError[] = []

  if (!isString || isEmpty || getUiPresentation(schema) === undefined) {
    return errors
  }

  // TODO: Why do we need to cast to JsfPresentation,
  // even though we know it's not undefined (from the if above)?
  const { minDate, maxDate } = getUiPresentation(schema) as JsfPresentation

  if (minDate && !validateMinDate(value, minDate)) {
    errors.push({ path, validation: 'minDate', schema, value })
  }

  if (maxDate && !validateMaxDate(value, maxDate)) {
    errors.push({ path, validation: 'maxDate', schema, value })
  }

  return errors
}
