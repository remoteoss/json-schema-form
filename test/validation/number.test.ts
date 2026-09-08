import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { validateSchema } from '../../src/validation/schema'
import { errorLike } from '../test-utils'

describe('number validation', () => {
  it('validates values against number type schemas', () => {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: ['array', 'object'],
    }

    expect(validateSchema(123, schema)).not.toEqual([])

    expect(validateSchema(10, { type: 'number' })).toEqual([])
    expect(validateSchema(-23, { type: 'number' })).toEqual([])
    expect(validateSchema(0.42, { type: 'number' })).toEqual([])
    expect(validateSchema(42, { type: ['number'] })).toEqual([])
    expect(validateSchema(5.3, { type: ['number'] })).toEqual([])
    expect(validateSchema(12.34, { type: ['number'] })).toEqual([])

    expect(validateSchema('10', { type: 'number' })).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])

    expect(validateSchema('42.0', { type: 'number' })).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])

    expect(validateSchema('test', { type: 'number' })).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])
  })

  it('validates values against integer type schemas', () => {
    expect(validateSchema(10, { type: 'integer' })).toEqual([])
    expect(validateSchema(-23, { type: 'integer' })).toEqual([])
    expect(validateSchema(10.0, { type: 'integer' })).toEqual([])
    expect(validateSchema(23.0, { type: ['integer'] })).toEqual([])
    expect(validateSchema(10, { type: ['integer'] })).toEqual([])
    expect(validateSchema(0.42, { type: 'integer' })).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])

    expect(validateSchema(12.34, { type: ['integer'] })).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])
  })

  it('validates the number against the minimum and maximum properties', () => {
    expect(validateSchema(10, { type: 'number', minimum: 10 })).toEqual([])
    expect(validateSchema(9, { type: 'number', minimum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'minimum',
      }),
    ])

    expect(validateSchema(10, { type: 'number', maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', maximum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'maximum',
      }),
    ])

    expect(validateSchema(10, { type: 'number', minimum: 10, maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'maximum',
      }),
    ])

    expect(validateSchema(9, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'minimum',
      }),
    ])
  })

  it('validates the number against the exclusiveMinimum and exclusiveMaximum properties', () => {
    expect(validateSchema(11, { type: 'number', exclusiveMinimum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMinimum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMinimum',
      }),
    ])

    expect(validateSchema(9, { type: 'number', exclusiveMaximum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMaximum: 10 })).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMaximum',
      }),
    ])

    expect(
      validateSchema(10, { type: 'number', exclusiveMinimum: 9, exclusiveMaximum: 11 }),
    ).toEqual([])
    expect(
      validateSchema(11, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMaximum',
      }),
    ])
    expect(
      validateSchema(9, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMinimum',
      }),
    ])

    expect(
      validateSchema(10, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMaximum',
      }),
      errorLike({
        path: [],
        validation: 'exclusiveMinimum',
      }),
    ])

    expect(validateSchema(3, { type: 'number', exclusiveMaximum: 3 })).toEqual([
      errorLike({
        path: [],
        validation: 'exclusiveMaximum',
      }),
    ])
  })

  // Add a test for multipleOf validation
  it('validates the number against the multipleOf property', () => {
    expect(validateSchema(10, { type: 'number', multipleOf: 5 })).toEqual([])
    expect(validateSchema(15, { type: 'number', multipleOf: 5 })).toEqual([])
    expect(validateSchema(12, { type: 'number', multipleOf: 5 })).toEqual([
      errorLike({
        path: [],
        validation: 'multipleOf',
      }),
    ])
  })

  describe('multipleOf with fractional values', () => {
    it('accepts values that are true multiples of a fractional multipleOf', () => {
      expect(validateSchema(3.025, { type: 'number', multipleOf: 0.0001 })).toEqual([])
      expect(validateSchema(3.4, { type: 'number', multipleOf: 0.0001 })).toEqual([])
      expect(validateSchema(0, { type: 'number', multipleOf: 0.0001 })).toEqual([])
      expect(validateSchema(0.0075, { type: 'number', multipleOf: 0.0001 })).toEqual([])
      expect(validateSchema(100, { type: 'number', multipleOf: 0.01 })).toEqual([])
      expect(validateSchema(12.34, { type: 'number', multipleOf: 0.01 })).toEqual([])
      expect(validateSchema(250.5, { type: 'number', multipleOf: 0.01 })).toEqual([])
      expect(validateSchema(4.5, { type: 'number', multipleOf: 1.5 })).toEqual([])
      expect(validateSchema(-3.4, { type: 'number', multipleOf: 0.0001 })).toEqual([])
    })

    it('still rejects values that are not multiples of a fractional multipleOf', () => {
      const multipleOfError = [errorLike({ path: [], validation: 'multipleOf' })]

      expect(validateSchema(3.12345, { type: 'number', multipleOf: 0.0001 })).toEqual(multipleOfError)
      expect(validateSchema(0.00751, { type: 'number', multipleOf: 0.0001 })).toEqual(multipleOfError)
      expect(validateSchema(12.345, { type: 'number', multipleOf: 0.01 })).toEqual(multipleOfError)
      expect(validateSchema(35, { type: 'number', multipleOf: 1.5 })).toEqual(multipleOfError)
      expect(validateSchema(-3.12345, { type: 'number', multipleOf: 0.0001 })).toEqual(multipleOfError)
    })

    it('validates a percentage field nested in a fieldset', () => {
      const schema: JsfObjectSchema = {
        'type': 'object',
        'additionalProperties': false,
        'properties': {
          foo: {
            'type': 'object',
            'additionalProperties': false,
            'title': 'Working title',
            'properties': {
              problematic_field: {
                'type': 'number',
                'title': 'Should accept 3.025',
                'description': 'Enter a number between 0 and 99.9999',
                'minimum': 0,
                'maximum': 99.9999,
                'multipleOf': 0.0001,
                'x-jsf-errorMessage': {
                  maximum: 'Please enter a number as a percentage value with up to 4 decimal places',
                },
                'x-jsf-presentation': { inputType: 'number' },
              },
            },
            'required': ['problematic_field'],
            'x-jsf-order': ['problematic_field'],
            'x-jsf-presentation': { inputType: 'fieldset' },
          },
        },
        'required': ['foo'],
        'x-jsf-order': ['foo'],
      }

      const form = createHeadlessForm(schema)

      expect(form.handleValidation({ foo: { problematic_field: 3.025 } }).formErrors).toBeUndefined()

      expect(form.handleValidation({ foo: { problematic_field: 3.02555 } }).formErrors).toEqual({
        foo: { problematic_field: 'Must be a multiple of 0.0001' },
      })
    })
  })
})
