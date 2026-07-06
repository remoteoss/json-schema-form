import type { Field } from '../src/field/type'
import { describe, expect, it } from '@jest/globals'
import { convertKBToMB, deepMergeSchemas, getField } from '../src/utils'

describe('getField', () => {
  const mockFields: Field[] = [
    {
      name: 'name',
      type: 'text',
      inputType: 'text',
      jsonType: 'string',
      label: 'Name',
      required: false,
      isVisible: true,
    },
    {
      name: 'address',
      type: 'fieldset',
      inputType: 'fieldset',
      jsonType: 'object',
      label: 'Address',
      required: false,
      isVisible: true,
      fields: [
        {
          name: 'street',
          type: 'text',
          inputType: 'text',
          jsonType: 'string',
          label: 'Street',
          required: false,
          isVisible: true,
        },
        {
          name: 'city',
          type: 'text',
          inputType: 'text',
          jsonType: 'string',
          label: 'City',
          required: false,
          isVisible: true,
        },
      ],
    },
  ]

  it('should find a top-level field by name', () => {
    const field = getField(mockFields, 'name')
    expect(field).toBeDefined()
    expect(field?.name).toBe('name')
  })

  it('should find a nested field using path', () => {
    const field = getField(mockFields, 'address', 'street')
    expect(field).toBeDefined()
    expect(field?.name).toBe('street')
  })

  it('should return undefined for non-existent field', () => {
    const field = getField(mockFields, 'nonexistent')
    expect(field).toBeUndefined()
  })

  it('should return undefined for non-existent nested field', () => {
    const field = getField(mockFields, 'address', 'nonexistent')
    expect(field).toBeUndefined()
  })

  it('should return undefined when trying to access nested field on non-object field', () => {
    const field = getField(mockFields, 'name', 'something')
    expect(field).toBeUndefined()
  })

  it('should handle multiple levels of nesting', () => {
    const deepFields: Field[] = [
      {
        name: 'level1',
        type: 'fieldset',
        inputType: 'fieldset',
        jsonType: 'object',
        label: 'Level 1',
        required: false,
        isVisible: true,
        fields: [
          {
            name: 'level2',
            type: 'fieldset',
            inputType: 'fieldset',
            jsonType: 'object',
            label: 'Level 2',
            required: false,
            isVisible: true,
            fields: [
              {
                name: 'level3',
                type: 'text',
                inputType: 'text',
                jsonType: 'string',
                label: 'Level 3',
                required: false,
                isVisible: true,
              },
            ],
          },
        ],
      },
    ]

    const field = getField(deepFields, 'level1', 'level2', 'level3')
    expect(field).toBeDefined()
    expect(field?.name).toBe('level3')
  })
})

describe('convertKBToMB', () => {
  it('should return 0 when given 0', () => {
    expect(convertKBToMB(0)).toBe(0)
  })

  it('should convert KB to MB', () => {
    expect(convertKBToMB(1024)).toBe(1)
    expect(convertKBToMB(2048)).toBe(2)
  })

  it('should round the result to 2 decimal places', () => {
    // 1505 / 1024 = 1.469726562 -> 1.46
    expect(convertKBToMB(1505)).toBe(1.47)
    // 1590 / 1024 = 1.552734375 -> 1.55
    expect(convertKBToMB(1590)).toBe(1.55)
  })

  it('should handle values smaller than 1 MB', () => {
    // 512 / 1024 = 0.5
    expect(convertKBToMB(512)).toBe(0.5)
  })
})

describe('deepMergeSchemas', () => {
  it('should do nothing when either schema is missing', () => {
    const schema1 = { type: 'string' }
    expect(() => deepMergeSchemas(undefined, schema1)).not.toThrow()
    expect(() => deepMergeSchemas(schema1, undefined)).not.toThrow()
    expect(schema1).toEqual({ type: 'string' })
  })

  it('should return early without mutating when a schema is a truthy non-object', () => {
    const schema1: Record<string, any> = { type: 'string' }
    expect(() => deepMergeSchemas(42 as any, schema1)).not.toThrow()
    expect(() => deepMergeSchemas(schema1, 'not-an-object' as any)).not.toThrow()
    expect(schema1).toEqual({ type: 'string' })
  })

  it('should copy over properties that only exist in schema2', () => {
    const schema1: Record<string, any> = { type: 'string' }
    deepMergeSchemas(schema1, { title: 'Name' })
    expect(schema1).toEqual({ type: 'string', title: 'Name' })
  })

  it('should overwrite primitive values that differ', () => {
    const schema1: Record<string, any> = { title: 'Old' }
    deepMergeSchemas(schema1, { title: 'New' })
    expect(schema1.title).toBe('New')
  })

  it('should merge nested objects recursively', () => {
    const schema1: Record<string, any> = {
      properties: { name: { type: 'string' } },
    }
    deepMergeSchemas(schema1, {
      properties: { age: { type: 'number' } },
    })
    expect(schema1.properties).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    })
  })

  it('should assign an object when the target value is not an object', () => {
    const schema1: Record<string, any> = { meta: 'string' }
    deepMergeSchemas(schema1, { meta: { nested: true } })
    expect(schema1.meta).toEqual({ nested: true })
  })

  it('should skip if/then/else properties', () => {
    const schema1: Record<string, any> = { type: 'object' }
    deepMergeSchemas(schema1, {
      if: { properties: { a: { const: 1 } } },
      then: { required: ['b'] },
      else: { required: ['c'] },
    })
    expect(schema1).toEqual({ type: 'object' })
  })

  it('should replace options arrays instead of merging them', () => {
    const schema1: Record<string, any> = {
      options: [{ value: 'a' }, { value: 'b' }],
    }
    deepMergeSchemas(schema1, {
      options: [{ value: 'c' }],
    })
    expect(schema1.options).toEqual([{ value: 'c' }])
  })

  it('should replace enum arrays instead of merging them', () => {
    const schema1: Record<string, any> = { enum: ['a', 'b'] }
    deepMergeSchemas(schema1, { enum: ['c', 'd'] })
    expect(schema1.enum).toEqual(['c', 'd'])
  })

  it('should only add new elements to the required array', () => {
    const schema1: Record<string, any> = { required: ['a', 'b'] }
    deepMergeSchemas(schema1, { required: ['b', 'c'] })
    expect(schema1.required).toEqual(['a', 'b', 'c'])
  })

  it('should replace primitive arrays, not merge by index', () => {
    const schema1: Record<string, any> = { enum: ['a', 'b'] }
    deepMergeSchemas(schema1, { enum: ['c', 'd'] })
    expect(schema1.enum).toEqual(['c', 'd'])
  })

  it('should replace the whole options array rather than merging it by index', () => {
    const schema1: Record<string, any> = {
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
    }
    const incomingOptions = [{ value: 'c', label: 'C' }]
    deepMergeSchemas(schema1, {
      options: incomingOptions,
    })
    expect(schema1.options).toStrictEqual([{ value: 'c', label: 'C' }])
    // preserves the reference identity of the incoming options array
    expect(schema1.options).toEqual(incomingOptions)
    expect(schema1.options).toHaveLength(1)
  })

  it('should replace the whole option-like array rather than merging it by index', () => {
    const schema1: Record<string, any> = {
      anyOf: [{ const: 'A', label: 'A' }, { const: 'B', label: 'B' }, { const: 'C', label: 'C' }],
    }
    const incomingAnyOf = [{ const: 'C', label: 'C' }]
    deepMergeSchemas(schema1, {
      anyOf: incomingAnyOf,
    })
    // preserves the reference identity of the incoming anyOf array
    expect(schema1.anyOf).toEqual(incomingAnyOf)
    expect(schema1.anyOf).toHaveLength(1)
  })

  it('should replace an items.anyOf option-like array rather than merging it by index', () => {
    const schema1: Record<string, any> = {
      items: { anyOf: [{ const: 'A', label: 'A' }, { const: 'B', label: 'B' }, { const: 'C', label: 'C' }] },
    }
    const incomingItemsAnyOf = [{ const: 'C', label: 'C' }]
    deepMergeSchemas(schema1, {
      items: { anyOf: incomingItemsAnyOf },
    })
    // preserves the reference identity of the incoming anyOf array
    expect(schema1.items.anyOf).toEqual(incomingItemsAnyOf)
    expect(schema1.items.anyOf).toHaveLength(1)
  })

  it('should replace the whole option-like array, preserving null const values', () => {
    const schema1: Record<string, any> = {
      oneOf: [{ const: 'A', label: 'A' }, { const: 'C', label: 'C' }, { const: null, label: 'N/A' }],
    }
    const incomingOneOf = [{ const: 'C', label: 'C' }, { const: null, label: 'N/A' }]
    deepMergeSchemas(schema1, {
      oneOf: incomingOneOf,
    })
    expect(schema1.oneOf).toStrictEqual([{ const: 'C', label: 'C' }, { const: null, label: 'N/A' }])

    expect(schema1.oneOf).toHaveLength(2)
  })

  it('should index-merge arrays of objects for non-option-like values ', () => {
    // Unlike `options`, other object arrays are merged recursively by index.
    const schema1: Record<string, any> = {
      anyOf: [{ type: 'string', title: 'Old' }, { type: 'number' }],
    }
    deepMergeSchemas(schema1, {
      anyOf: [{ title: 'New' }],
    })
    expect(schema1.anyOf).toStrictEqual([
      { type: 'string', title: 'New' },
      { type: 'number' },
    ])
  })
})
