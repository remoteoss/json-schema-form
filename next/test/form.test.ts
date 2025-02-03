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

  describe('boolean schema validation', () => {
    it('returns an error if the value is false', () => {
      const form = createHeadlessForm({ properties: { name: false } })

      expect(form.handleValidation({ name: 'anything' })).toMatchObject({ formErrors: { '.name': 'always fails' } })
      expect(form.handleValidation({})).toMatchObject({ formErrors: undefined })
    })

    it('does not return an error if the value is true', () => {
      const form = createHeadlessForm({ properties: { name: true } })

      expect(form.handleValidation({ name: 'anything' })).toMatchObject({ formErrors: undefined })
      expect(form.handleValidation({})).toMatchObject({ formErrors: undefined })
    })
  })

  describe('object schema validation', () => {
    it('returns an error if the value is not an object', () => {
      const schema = { properties: { address: { type: 'object', properties: { street: { type: 'string' } } } } }
      const form = createHeadlessForm(schema)

      expect(form.handleValidation({})).toMatchObject({ formErrors: undefined })
      expect(form.handleValidation({ address: {} })).toMatchObject({ formErrors: undefined })
      expect(form.handleValidation({ address: 'not an object' })).toMatchObject({
        formErrors: { '.address': 'should be object' },
      })
      expect(form.handleValidation({ address: { street: 10 } })).toMatchObject({
        formErrors: { '.address.street': 'should be string' },
      })
      expect(form.handleValidation({ address: { street: 'some street' } })).toMatchObject({
        formErrors: undefined,
      })
    })
  })

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
})
