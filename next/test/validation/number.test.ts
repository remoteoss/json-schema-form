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
        message: 'should be number',
      },
    ])

    expect(validateSchema('42.0', { type: 'number' })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'should be number',
      },
    ])

    expect(validateSchema('test', { type: 'number' })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'should be number',
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
        message: 'should be integer',
      },
    ])

    expect(validateSchema(12.34, { type: ['integer'] })).toEqual([
      {
        path: [],
        validation: 'type',
        message: 'should be integer',
      },
    ])
  })

  it('validates the number against the minimum and maximum properties', () => {
    expect(validateSchema(10, { type: 'number', minimum: 10 })).toEqual([])
    expect(validateSchema(9, { type: 'number', minimum: 10 })).toEqual([
      {
        path: [],
        validation: 'minimum',
        message: 'must be greater than or equal to 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'maximum',
        message: 'must be less than or equal to 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', minimum: 10, maximum: 10 })).toEqual([])
    expect(validateSchema(11, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'maximum',
        message: 'must be less than or equal to 10',
      },
    ])

    expect(validateSchema(9, { type: 'number', minimum: 10, maximum: 10 })).toEqual([
      {
        path: [],
        validation: 'minimum',
        message: 'must be greater than or equal to 10',
      },
    ])
  })

  it('validates the number against the exclusiveMinimum and exclusiveMaximum properties', () => {
    expect(validateSchema(11, { type: 'number', exclusiveMinimum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMinimum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'must be greater than 10',
      },
    ])

    expect(validateSchema(9, { type: 'number', exclusiveMaximum: 10 })).toEqual([])
    expect(validateSchema(10, { type: 'number', exclusiveMaximum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'must be less than 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', exclusiveMinimum: 9, exclusiveMaximum: 11 })).toEqual([])
    expect(validateSchema(11, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'must be less than 10',
      },
    ])
    expect(validateSchema(9, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'must be greater than 10',
      },
    ])

    expect(validateSchema(10, { type: 'number', exclusiveMinimum: 10, exclusiveMaximum: 10 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'must be less than 10',
      },
      {
        path: [],
        validation: 'exclusiveMinimum',
        message: 'must be greater than 10',
      },
    ])

    expect(validateSchema(3, { type: 'number', exclusiveMaximum: 3 })).toEqual([
      {
        path: [],
        validation: 'exclusiveMaximum',
        message: 'must be less than 3',
      },
    ])
  })
})
