import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'

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
      {
        path: [],
        validation: 'type',
        message: 'The value must be a number',
      },
    ])

    expect(validateSchema('42.0', { type: 'number' })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'The value must be a number',
      },
    ])

    expect(validateSchema('test', { type: 'number' })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'The value must be a number',
      },
    ])
  })

  it('validates values against integer type schemas', () => {
    expect(validateSchema(10, { type: 'integer' })).toEqual([])
    expect(validateSchema(-23, { type: 'integer' })).toEqual([])
    expect(validateSchema(10.0, { type: 'integer' })).toEqual([])
    expect(validateSchema(23.0, { type: ['integer'] })).toEqual([])
    expect(validateSchema(10, { type: ['integer'] })).toEqual([])
    expect(validateSchema(0.42, { type: 'integer' })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'The value must be a number',
      },
    ])

    expect(validateSchema(12.34, { type: ['integer'] })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'The value must be a number',
      },
    ])
  })

  it('validates the number against the minimum and maximum properties', () => {
    expect(validateSchema(10, { type: 'number', minimum: 10 })).toEqual([])
    expect(validateSchema(9, { type: 'number', minimum: 10 })).toEqual([
      {
        path: [],
        validation: 'minimum',
        message: 'Must be greater or equal to 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'maximum',
        message: 'Must be smaller or equal to 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', minimum: 10, maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'maximum',
        message: 'Must be smaller or equal to 10',
      },
    ])

    expect(validateSchema(9, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'minimum',
        message: 'Must be greater or equal to 10',
      },
    ])
  })

  it('validates the number against the exclusiveMinimum and exclusiveMaximum properties', () => {
    expect(validateSchema(11, { type: 'number', exclusiveMinimum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMinimum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'Must be greater than 10',
      },
    ])

    expect(validateSchema(9, { type: 'number', exclusiveMaximum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMaximum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'Must be smaller than 10',
      },
    ])

    expect(
      validateSchema(10, { type: 'number', exclusiveMinimum: 9, exclusiveMaximum: 11 }),
    ).toEqual([])
    expect(
      validateSchema(11, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'Must be smaller than 10',
      },
    ])
    expect(
      validateSchema(9, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'Must be greater than 10',
      },
    ])

    expect(
      validateSchema(10, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 }),
    ).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'Must be smaller than 10',
      },
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'Must be greater than 10',
      },
    ])

    expect(validateSchema(3, { type: 'number', exclusiveMaximum: 3 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'Must be smaller than 3',
      },
    ])
  })

  // Add a test for multipleOf validation
  it('validates the number against the multipleOf property', () => {
    expect(validateSchema(10, { type: 'number', multipleOf: 5 })).toEqual([])
    expect(validateSchema(15, { type: 'number', multipleOf: 5 })).toEqual([])
    expect(validateSchema(12, { type: 'number', multipleOf: 5 })).toEqual([
      {
        path: [],
        validation: 'multipleOf',
        message: 'Must be a multiple of 5',
      },
    ])
  })
})
