import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('anyOf validation', () => {
  it('returns no errors if the value matches at least one subschema in anyOf (top-level)', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string', minLength: 5 },
            { type: 'number' },
          ],
        },
      },
    }
    const form = createHeadlessForm(schema)

    // Test with a string that meets the minLength requirement
    expect(form.handleValidation({ value: 'hello world' })).not.toHaveProperty('formErrors')

    // Test with a number
    expect(form.handleValidation({ value: 42 })).not.toHaveProperty('formErrors')
  })

  it('returns an error if the value does not match any subschema in anyOf (top-level)', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        value: {
          anyOf: [
            { type: 'string', pattern: '^[a-z]+$' },
            { type: 'string', minLength: 5 },
          ],
        },
      },
    }
    const form = createHeadlessForm(schema)

    // "123" does not match the pattern nor does it meet the minLength requirement.
    expect(form.handleValidation({ value: '123' })).toEqual({
      formErrors: { '.value': 'should match at least one schema' },
    })
  })

  it('validates nested anyOf in an object property', () => {
    const schema: JsfObjectSchema = {
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

    // Test with an invalid string value
    expect(form.handleValidation({ value: 'abc' })).toEqual({
      formErrors: { '.value': 'should match at least one schema' },
    })
  })
})

/**
 * The following tests have the schema taken from:
 * @see https://json-schema-form.vercel.app/?path=/story/demos-combinations--any-of-validations
 */
describe('JSON Schema anyOf test', () => {
  const schema: JsfObjectSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      field_a: {
        title: 'Field A',
        description: 'Field A is needed if B and C are empty',
        maxLength: 10,
        type: 'string',
      },
      field_b: {
        title: 'Field B',
        description: 'Field B is needed if A is empty and C is not empty',
        maxLength: 10,
        type: 'string',
      },
      field_c: {
        title: 'Field C',
        description: 'Field C is needed if A is empty and B is not empty',
        maxLength: 10,
        type: 'string',
      },
    },
    required: [],
    anyOf: [
      { required: ['field_a'] },
      { required: ['field_b', 'field_c'] },
    ],
  }

  it('passes when object satisfies one of the anyOf conditions (has field_a)', () => {
    const form = createHeadlessForm(schema)
    // Providing field_a should be enough for the first anyOf condition.
    const result = form.handleValidation({ field_a: 'hello' })
    expect(result).not.toHaveProperty('formErrors')
  })

  it('passes when object satisfies one of the anyOf conditions (has both field_b and field_c)', () => {
    const form = createHeadlessForm(schema)
    // Providing both field_b and field_c should satisfy the second anyOf condition.
    const result = form.handleValidation({ field_b: 'hi', field_c: 'there' })
    expect(result).not.toHaveProperty('formErrors')
  })

  it('fails when object does not meet any anyOf condition', () => {
    const form = createHeadlessForm(schema)
    // An empty object does not provide field_a nor both field_b and field_c.
    const result = form.handleValidation({})
    expect(result).toEqual({ formErrors: { '': 'should match at least one schema' } })
  })
})
