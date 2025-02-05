import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('anyOf validation', () => {
  it('returns no errors if the value matches at least one subschema in anyOf (top-level)', () => {
    const schema = {
      anyOf: [
        { type: 'string', minLength: 5 },
        { type: 'number' },
      ],
    }
    const form = createHeadlessForm(schema)

    // Test with a string that meets the minLength requirement
    expect(form.handleValidation('hello world')).not.toHaveProperty('formErrors')

    // Test with a number
    expect(form.handleValidation(42)).not.toHaveProperty('formErrors')
  })

  it('returns an error if the value does not match any subschema in anyOf (top-level)', () => {
    const schema = {
      anyOf: [
        { type: 'string', pattern: '^[a-z]+$' },
        { type: 'string', minLength: 5 },
      ],
    }
    const form = createHeadlessForm(schema)

    // "123" does not match the pattern nor does it meet the minLength requirement.
    expect(form.handleValidation('123')).toEqual({
      formErrors: { '': 'should match at least one schema' },
    })
  })

  it('validates nested anyOf in an object property', () => {
    const schema = {
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string', pattern: '^[0-9]+$' },
            { type: 'number' },
          ],
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test with a valid number value
    expect(form.handleValidation({ value: 123 })).not.toHaveProperty('formErrors')

    // Test with a valid string matching the pattern
    expect(form.handleValidation({ value: '456' })).not.toHaveProperty('formErrors')

    // Test with an invalid string value; the error path will be prefixed by the property key.
    expect(form.handleValidation({ value: 'abc' })).toEqual({
      formErrors: { '.value': 'should match at least one schema' },
    })
  })
})
