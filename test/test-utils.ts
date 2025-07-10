import type { ValidationError } from '../src/errors'
import { expect, jest } from '@jest/globals'

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

export function mockConsole() {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
}

export function restoreConsoleAndEnsureItWasNotCalled() {
  expect(console.error).not.toHaveBeenCalled();
  (console.error as jest.Mock).mockRestore()
  expect(console.warn).not.toHaveBeenCalled();
  (console.warn as jest.Mock).mockRestore()
}
