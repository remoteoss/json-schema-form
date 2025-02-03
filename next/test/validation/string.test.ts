import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('string validation', () => {
  it('validates values against string type schemas', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }).handleValidation({ name: 10 })

    expect(result).toMatchObject({
      formErrors: {
        '.name': 'should be string',
      },
    })
  })

  it('validates the string length against the minLength property', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 3 },
      },
    })

    expect(result.handleValidation({ name: 'ab' })).toMatchObject({
      formErrors: {
        '.name': 'must be at least 3 characters',
      },
    })

    expect(result.handleValidation({ name: 'abc' })).toMatchObject({
      formErrors: undefined,
    })
  })

  it('validates the string length against the maxLength property', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 10 },
      },
    })

    expect(result.handleValidation({ name: 'abc' })).toMatchObject({
      formErrors: undefined,
    })

    expect(result.handleValidation({ name: 'abcde' })).toMatchObject({
      formErrors: undefined,
    })
  })

  it('validates the string length against the minLength and maxLength properties', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 10 },
      },
    })

    expect(result.handleValidation({ name: 'ab' })).toMatchObject({
      formErrors: {
        '.name': 'must be at least 3 characters',
      },
    })

    expect(result.handleValidation({ name: '0123456789' })).toMatchObject({ formErrors: undefined })

    expect(result.handleValidation({ name: '01234567890' })).toMatchObject({
      formErrors: {
        '.name': 'must be at most 10 characters',
      },
    })
  })

  it('validates the string pattern against the pattern property', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', pattern: '^[a-z]+$' },
      },
    })

    expect(result.handleValidation({ name: 'abc' })).toMatchObject({
      formErrors: undefined,
    })

    expect(result.handleValidation({ name: '123' })).toMatchObject({
      formErrors: { '.name': 'must match the pattern \'^[a-z]+$\'' },
    })
  })
})
