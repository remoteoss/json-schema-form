import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('createHeadlessForm', () => {
  it('should be a function', () => {
    expect(createHeadlessForm).toBeInstanceOf(Function)
  })
})
