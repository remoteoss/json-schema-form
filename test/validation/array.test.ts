import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'
import { errorLike } from '../test-utils'

describe('array validation', () => {
  it('validates the array type', () => {
    const schema = { type: 'array' }
    expect(validateSchema([], schema)).toEqual([])
    expect(validateSchema([1, 2, 3], schema)).toEqual([])
    expect(validateSchema('not an array', schema)).toEqual([
      errorLike({
        path: [],
        validation: 'type',
      }),
    ])
  })

  describe('maxItems', () => {
    const schema = { type: 'array', maxItems: 3 }

    it('returns no errors for empty arrays', () => {
      expect(validateSchema([], schema)).toEqual([])
    })

    it('returns no errors for arrays with less than maxItems', () => {
      const schema = { type: 'array', maxItems: 3 }
      expect(validateSchema([1, 2], schema)).toEqual([])
    })

    it('returns an error for arrays with more than maxItems', () => {
      expect(validateSchema([1, 2, 3, 4], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'maxItems',
        }),
      ])
    })
  })

  describe('minItems', () => {
    const schema = { type: 'array', minItems: 2 }

    it('returns no errors for arrays with more than minItems', () => {
      expect(validateSchema([1, 2], schema)).toEqual([])
    })

    it('returns an error for arrays with less than minItems', () => {
      expect(validateSchema([1], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'minItems',
        }),
      ])
    })

    it('returns an error for empty arrays', () => {
      expect(validateSchema([], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'minItems',
        }),
      ])
    })
  })

  describe('uniqueItems', () => {
    const schema = { type: 'array', uniqueItems: true }

    it('returns no errors for arrays with unique items', () => {
      expect(validateSchema([1, 2, 3], schema)).toEqual([])
      expect(validateSchema(['a', 'b', 'c'], schema)).toEqual([])
    })

    it('returns an error for arrays with duplicate items', () => {
      expect(validateSchema([1, 2, 1], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'uniqueItems',
        }),
      ])
    })

    it('returns an error for arrays with duplicate arrays', () => {
      expect(validateSchema([[1, 2], [1, 2]], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'uniqueItems',
        }),
      ])
    })

    it('returns an error for arrays with duplicate objects', () => {
      expect(validateSchema([{ a: 1 }, { a: 1 }, { a: 1 }], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'uniqueItems',
        }),
      ])
    })
  })

  describe('items', () => {
    it('returns no errors for empty arrays', () => {
      const schema = { type: 'array', items: { type: 'number' } }
      expect(validateSchema([], schema)).toEqual([])
    })

    it('returns no errors for arrays with items that match the schema', () => {
      const schema = { type: 'array', items: { type: 'number' } }
      expect(validateSchema([1, 2, 3], schema)).toEqual([])
    })

    it('returns an error for arrays with items that do not match the schema', () => {
      const schema = { type: 'array', items: { type: 'number' } }

      expect(validateSchema([1, 'string', 3], schema)).toEqual([
        errorLike({
          path: ['items', 1],
          validation: 'type',
        }),
      ])
    })
  })

  describe('object items', () => {
    it('returns no errors for empty arrays', () => {
      const schema = { type: 'array', items: { type: 'object' } }
      expect(validateSchema([], schema)).toEqual([])
    })

    it('returns no errors for arrays with objects that match the schema', () => {
      const schema = { type: 'array', items: { type: 'object' } }
      expect(validateSchema([{ a: 1 }, { b: 2 }], schema)).toEqual([])
    })

    it('respects the object\'s required properties', () => {
      const schema = { type: 'array', items: { type: 'object', required: ['a'] } }
      expect(validateSchema([{ a: 1 }, { b: 2 }], schema)).toEqual([errorLike({ path: ['items', 1, 'a'], validation: 'required' })])
    })
  })

  describe('prefixItems', () => {
    const schema = {
      type: 'array',
      prefixItems: [
        { type: 'string' },
        { type: 'number' },
      ],
    }

    it('returns no errors for arrays with prefixItems that match the schema', () => {
      expect(validateSchema(['test', 42], schema)).toEqual([])
    })

    it('allows additional items after the prefixItems', () => {
      expect(validateSchema(['test', 42, 'extra'], schema)).toEqual([])
    })

    it('returns an error for arrays with prefixItems that do not match the schema', () => {
      expect(validateSchema(['test', 'not a number'], schema)).toEqual([
        errorLike({
          path: ['prefixItems', 1],
          validation: 'type',
        }),
      ])
    })
  })

  describe('both prefixItems and items constraints', () => {
    const schema = {
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
      items: { type: 'boolean' },
    }

    it('returns no errors for arrays with both prefixItems and items that match the schema', () => {
      expect(validateSchema(['test', 42, true, false], schema)).toEqual([])
    })

    it('returns no errors for arrays that match the prefixItems constraint but have no additional items', () => {
      expect(validateSchema(['test', 42], schema)).toEqual([])
    })

    it('returns an error for arrays that do not match the prefixItems constraint', () => {
      expect(validateSchema(['test', 'not a number', true, false], schema)).toEqual([
        errorLike({
          path: ['prefixItems', 1],
          validation: 'type',
        }),
      ])
    })

    it('returns an error for arrays that have additional items after the prefixItems that do not match the items constraint', () => {
      expect(validateSchema(['test', 42, true, false, 'extra'], schema)).toEqual([
        errorLike({
          path: ['items', 4],
          validation: 'type',
        }),
      ])
    })
  })

  describe('contains', () => {
    const schema = {
      type: 'array',
      contains: { type: 'number', minimum: 5 },
    }

    it('returns no errors for arrays containing at least one matching item', () => {
      expect(validateSchema([5, 6, 7], schema)).toEqual([])
    })

    it('returns an error for arrays that do not contain any matching items', () => {
      expect(validateSchema([1, 2, 3], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'contains',
        }),
      ])

      expect(validateSchema([], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'contains',
        }),
      ])
    })
  })

  it('minContains and maxContains has no effect without contains', () => {
    const schema = {
      type: 'array',
      minContains: 1,
      maxContains: 2,
    }

    expect(validateSchema([], schema)).toEqual([])
    expect(validateSchema([1, 2, 3], schema)).toEqual([])
  })

  describe('minContains', () => {
    const schema = {
      type: 'array',
      contains: { type: 'number' },
      minContains: 2,
    }

    it('returns no errors for arrays with at least minContains items', () => {
      expect(validateSchema([1, 2, 3], schema)).toEqual([])
    })

    it('returns an error for arrays with fewer than minContains items', () => {
      expect(validateSchema([1], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'minContains',
        }),
      ])
    })
  })

  describe('maxContains', () => {
    const schema = {
      type: 'array',
      contains: { type: 'number' },
      maxContains: 2,
    }

    it('returns no errors for arrays with at most maxContains items', () => {
      expect(validateSchema([1, 2], schema)).toEqual([])
    })

    it('returns an error for arrays with more than maxContains items', () => {
      expect(validateSchema([1, 2, 3], schema)).toEqual([
        errorLike({
          path: [],
          validation: 'maxContains',
        }),
      ])
    })
  })
})
