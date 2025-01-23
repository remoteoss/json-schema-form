import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

/**
 * Example test suite for V2
 */
describe('createHeadlessForm', () => {
  it('should be a function', () => {
    expect(createHeadlessForm).toBeInstanceOf(Function)
  })
})
