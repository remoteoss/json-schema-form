import type { NonBooleanJsfSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { validateConst } from '../../src/validation/const'

describe('const schema validation', () => {
  it('should return empty array when const value matches', () => {
    const schema: NonBooleanJsfSchema = { const: 42 }
    const value = 42
    expect(validateConst(value, schema)).toEqual([])
  })

  it('should return error when const value does not match', () => {
    const schema: NonBooleanJsfSchema = { const: 42 }
    const value = 43
    const result = validateConst(value, schema)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      path: [],
      validation: 'const',
      schema,
      value: 43,
    })
  })

  it('should handle nested objects with deep equality', () => {
    const schema: NonBooleanJsfSchema = {
      const: { foo: { bar: 42 } },
    }
    const value = { foo: { bar: 42 } }
    expect(validateConst(value, schema)).toEqual([])
  })

  it('should handle arrays with deep equality', () => {
    const schema: NonBooleanJsfSchema = {
      const: [1, 2, { foo: 'bar' }],
    }
    const value = [1, 2, { foo: 'bar' }]
    expect(validateConst(value, schema)).toEqual([])
  })

  it('should return empty array when const is not present', () => {
    const schema: NonBooleanJsfSchema = {}
    const value = 42
    expect(validateConst(value, schema)).toEqual([])
  })

  it('should handle schema.value as fallback for const', () => {
    const schema: NonBooleanJsfSchema = { value: 42 }
    const input = 42
    expect(validateConst(input, schema)).toEqual([])
  })

  it('should handle different types correctly', () => {
    const testCases = [
      { schema: { const: 'string' }, value: 'string', shouldPass: true },
      { schema: { const: true }, value: false, shouldPass: false },
      { schema: { const: null }, value: null, shouldPass: true },
      { schema: { const: 0 }, value: '0', shouldPass: false },
      { schema: { const: [] }, value: [], shouldPass: true },
      { schema: { const: {} }, value: {}, shouldPass: true },
    ]

    testCases.forEach(({ schema, value, shouldPass }) => {
      const result = validateConst(value, schema as NonBooleanJsfSchema)
      expect(result.length).toBe(shouldPass ? 0 : 1)
    })
  })

  it('should handle path parameter correctly', () => {
    const schema: NonBooleanJsfSchema = { const: 42 }
    const value = 43
    const path = ['foo', 'bar']
    const result = validateConst(value, schema, path)
    expect(result[0].path).toEqual(path)
  })
})
