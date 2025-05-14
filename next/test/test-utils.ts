import type { ValidationError } from '../src/errors'
import { expect } from '@jest/globals'

/**
 * Helper function for asserting that a `ValidationError` has some expected fields. It automatically populates the `schema` and `value` properties with "any value"
 * so the tests are less verbose.
 * @param errorFields expected fields
 */
export function errorLike(errorFields: Partial<ValidationError>) {
  return expect.objectContaining({
    schema: expect.anything(),
    value: expect.anything(),
    ...errorFields,
  })
}
