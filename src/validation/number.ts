import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { getSchemaType } from './schema'

interface DecimalParts {
  digits: bigint
  exponent: number
}

/**
 * Decompose a finite number into its exact decimal digits and exponent.
 * @param value - The number to decompose
 * @returns The digits (as a bigint) and the power of ten they must be multiplied by
 * @description
 * The decomposition is based on `toString()`, which returns the shortest decimal representation
 * that round-trips to the same double - in other words, the number as it was written in the schema
 * or typed by the user. So `0.0001` decomposes to `1 * 10 ** -4`, not to the slightly larger binary
 * value the double actually holds.
 */
function toDecimalParts(value: number): DecimalParts {
  const [mantissa, exponent] = value.toString().split('e')
  const [integerDigits, fractionDigits = ''] = mantissa.split('.')

  return {
    digits: BigInt(integerDigits + fractionDigits),
    exponent: (exponent === undefined ? 0 : Number(exponent)) - fractionDigits.length,
  }
}

/**
 * Check whether a value is an exact multiple of `multipleOf`.
 * @param value - The number being validated
 * @param multipleOf - The divisor the value must be a multiple of
 * @returns `true` if the value is an exact multiple of `multipleOf`
 * @description
 * A plain `value % multipleOf` check is unreliable whenever `multipleOf` is fractional, because a
 * value like `0.0001` has no exact binary representation: `3.025 % 0.0001` yields `0.00009999...`
 * instead of `0`, so unambiguously valid values get rejected.
 *
 * To avoid this, both numbers are scaled by the same power of ten until they are integers, and the
 * remainder is taken with bigint arithmetic, which is exact at any magnitude.
 */
function isMultipleOf(value: number, multipleOf: number): boolean {
  if (Number.isInteger(value) && Number.isInteger(multipleOf)) {
    return value % multipleOf === 0
  }

  // NaN, Infinity and a zero divisor can never produce a valid multiple.
  if (!Number.isFinite(value) || !Number.isFinite(multipleOf) || multipleOf === 0) {
    return false
  }

  const dividend = toDecimalParts(value)
  const divisor = toDecimalParts(multipleOf)

  // Line both numbers up on the smaller exponent so that they are both whole numbers
  const exponent = Math.min(dividend.exponent, divisor.exponent)
  const scaledValue = dividend.digits * 10n ** BigInt(dividend.exponent - exponent)
  const scaledMultipleOf = divisor.digits * 10n ** BigInt(divisor.exponent - exponent)

  return scaledValue % scaledMultipleOf === 0n
}

/**
 * Validate a number against a schema
 * @param value - The value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * Implements number validation according to JSON Schema 2020-12:
 * - MultipleOf validation
 * - Maximum validation
 * - ExclusiveMaximum validation
 * - Minimum validation
 * - ExclusiveMinimum validation
 */
export function validateNumber(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const errors: ValidationError[] = []
  const schemaType = getSchemaType(schema)

  if (typeof value !== 'number') {
    return []
  }

  if (schemaType !== undefined && !['number', 'integer'].includes(schemaType as string)) {
    return []
  }

  // MultipleOf validation - dividing value by multipleOf must have no remainder
  if (schema.multipleOf !== undefined && !isMultipleOf(value, schema.multipleOf)) {
    errors.push({ path, validation: 'multipleOf', schema, value })
  }

  // Maximum validation - value must be less than or equal to maximum
  if (schema.maximum !== undefined && value > schema.maximum) {
    errors.push({ path, validation: 'maximum', schema, value })
  }

  // ExclusiveMaximum validation - value must be less than exclusiveMaximum
  if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
    errors.push({ path, validation: 'exclusiveMaximum', schema, value })
  }

  // Minimum validation - value must be greater than or equal to minimum
  if (schema.minimum !== undefined && value < schema.minimum) {
    errors.push({ path, validation: 'minimum', schema, value })
  }

  // ExclusiveMinimum validation - value must be greater than exclusiveMinimum
  if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
    errors.push({ path, validation: 'exclusiveMinimum', schema, value })
  }

  return errors
}
