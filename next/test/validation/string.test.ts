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
        name: 'The value must be a string',
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
        name: 'Please insert at least 3 characters',
      },
    })

    expect(result.handleValidation({ name: 'abc' })).not.toHaveProperty('formErrors')
  })

  it('validates minLength 0 correctly', () => {
    const form = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 0 },
      },
    })

    expect(form.handleValidation({ name: '' })).not.toHaveProperty('formErrors')
    expect(form.handleValidation({ name: 'a' })).not.toHaveProperty('formErrors')
  })

  it('validates the string length against the maxLength property', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 10 },
      },
    })

    expect(result.handleValidation({ name: 'abc' })).not.toHaveProperty('formErrors')
    expect(result.handleValidation({ name: 'abcde' })).not.toHaveProperty('formErrors')
  })

  it('validates maxLength 0 correctly', () => {
    const form = createHeadlessForm({
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 0 },
      },
    })

    expect(form.handleValidation({ name: '' })).not.toHaveProperty('formErrors')
    expect(form.handleValidation({ name: 'a' })).toMatchObject({
      formErrors: {
        name: 'Please insert up to 0 characters',
      },
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
        name: 'Please insert at least 3 characters',
      },
    })

    expect(result.handleValidation({ name: '0123456789' })).not.toHaveProperty('formErrors')

    expect(result.handleValidation({ name: '01234567890' })).toMatchObject({
      formErrors: {
        name: 'Please insert up to 10 characters',
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

    expect(result.handleValidation({ name: 'abc' })).not.toHaveProperty('formErrors')

    const response = result.handleValidation({ name: '123' })
    expect(response).toHaveProperty('formErrors.name')

    // Error message now includes a random example, so we can't do an exact match
    expect(response.formErrors?.name).toMatch(/^Must have a valid format. E.g./)
  })
})
