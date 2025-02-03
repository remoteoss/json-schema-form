import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('createHeadlessForm', () => {
  it('should be a function', () => {
    expect(createHeadlessForm).toBeInstanceOf(Function)
  })

  it('returns empty result given an empty schema', () => {
    const result = createHeadlessForm({}, { initialValues: {} })

    expect(result).toMatchObject({
      fields: [],
    })
    expect(result.isError).toBe(false)
    expect(result.error).toBeFalsy()
  })
})
