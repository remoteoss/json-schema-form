import type { Field } from '../src/field/type'
import { describe, expect, it } from '@jest/globals'
import { convertKBToMB, getField, mergeFieldProperties, mergeSchemaBranch } from '../src/utils'

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

describe('mergeSchemaBranch', () => {
  it('should do nothing when either schema is missing', () => {
    const schema1 = { type: 'string' }
    expect(() => mergeSchemaBranch(undefined, schema1)).not.toThrow()
    expect(() => mergeSchemaBranch(schema1, undefined)).not.toThrow()
    expect(schema1).toEqual({ type: 'string' })
  })

  it('should return early without mutating when a schema is a truthy non-object', () => {
    const schema1: Record<string, any> = { type: 'string' }
    expect(() => mergeSchemaBranch(42 as any, schema1)).not.toThrow()
    expect(() => mergeSchemaBranch(schema1, 'not-an-object' as any)).not.toThrow()
    expect(schema1).toEqual({ type: 'string' })
  })

  it('should copy over properties that only exist in schema2', () => {
    const schema1: Record<string, any> = { type: 'string' }
    mergeSchemaBranch(schema1, { title: 'Name' })
    expect(schema1).toEqual({ type: 'string', title: 'Name' })
  })

  it('should overwrite primitive values that differ', () => {
    const schema1: Record<string, any> = { title: 'Old' }
    mergeSchemaBranch(schema1, { title: 'New' })
    expect(schema1.title).toBe('New')
  })

  it('should merge nested objects recursively', () => {
    const schema1: Record<string, any> = {
      properties: { name: { type: 'string' } },
    }
    mergeSchemaBranch(schema1, {
      properties: { age: { type: 'number' } },
    })
    expect(schema1.properties).toEqual({
      name: { type: 'string' },
      age: { type: 'number' },
    })
  })

  it('should assign an object when the target value is not an object', () => {
    const schema1: Record<string, any> = { meta: 'string' }
    mergeSchemaBranch(schema1, { meta: { nested: true } })
    expect(schema1.meta).toEqual({ nested: true })
  })

  it('should skip if/then/else properties', () => {
    const schema1: Record<string, any> = { type: 'object' }
    mergeSchemaBranch(schema1, {
      if: { properties: { a: { const: 1 } } },
      then: { required: ['b'] },
      else: { required: ['c'] },
    })
    expect(schema1).toEqual({ type: 'object' })
  })

  it('should only add new elements to the required array', () => {
    const schema1: Record<string, any> = { required: ['a', 'b'] }
    mergeSchemaBranch(schema1, { required: ['b', 'c'] })
    expect(schema1.required).toEqual(['a', 'b', 'c'])
  })

  describe('restricting option-like arrays to the base options', () => {
    it('should narrow enum arrays to the options present in the base', () => {
      const schema1: Record<string, any> = { enum: ['a', 'b', 'c'] }
      mergeSchemaBranch(schema1, { enum: ['b', 'c'] })
      expect(schema1.enum).toEqual(['b', 'c'])
    })

    it('should ignore enum options that are not present in the base', () => {
      const schema1: Record<string, any> = { enum: ['a', 'b', 'c', null] }
      // 'd' does not exist on the base field and must be dropped
      mergeSchemaBranch(schema1, { enum: ['c', 'd', null] })
      expect(schema1.enum).toEqual(['c', null])
    })

    it('should narrow array of enum objects to the options present in the base, assuming option-like objects', () => {
      const schema1: Record<string, any> = { enum: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }] }
      mergeSchemaBranch(schema1, { enum: [{ value: 'b', label: 'B' }, { value: 'c', label: 'C' }] })
      expect(schema1.enum).toEqual([{ value: 'b', label: 'B' }, { value: 'c', label: 'C' }])
    })

    it('should narrow the options array and ignore new options', () => {
      const schema1: Record<string, any> = {
        options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
      }
      mergeSchemaBranch(schema1, {
        options: [{ value: 'c', label: 'C' }, { value: 'd', label: 'D' }],
      })
      expect(schema1.options).toEqual([{ value: 'c', label: 'C' }])
      expect(schema1.options).toHaveLength(1)
    })

    it('should ignore options that are not option-like objects, still replacing the array', () => {
      const schema1: Record<string, any> = { options: [{ flag: true, label: 'A' }, { flag: false, label: 'B' }, { flag: true, label: 'C' }] }
      mergeSchemaBranch(schema1, { options: [{ flag: true, label: 'A' }, { flag: false, label: 'B' }] })
      expect(schema1.options).toEqual([])
    })

    it('should narrow the anyOf array and ignore new options', () => {
      const schema1: Record<string, any> = {
        anyOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }],
      }
      mergeSchemaBranch(schema1, {
        anyOf: [{ const: 'C' }, { const: 'X' }],
      })
      expect(schema1.anyOf).toEqual([{ const: 'C' }])
      expect(schema1.anyOf).toHaveLength(1)
    })

    it('should narrow the oneOf array and ignore new options', () => {
      const schema1: Record<string, any> = {
        oneOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }],
      }
      mergeSchemaBranch(schema1, {
        oneOf: [{ const: 'A' }, { const: 'Z' }],
      })
      expect(schema1.oneOf).toEqual([{ const: 'A' }])
      expect(schema1.oneOf).toHaveLength(1)
    })

    it('should keep the branch version of a matched option (allowing re-labeling)', () => {
      const schema1: Record<string, any> = {
        oneOf: [{ const: 'a', title: 'A' }, { const: 'b', title: 'B' }],
      }
      mergeSchemaBranch(schema1, {
        oneOf: [{ const: 'a', title: 'Relabeled A' }, { const: 'new', title: 'New' }],
      })
      expect(schema1.oneOf).toEqual([{ const: 'a', title: 'Relabeled A' }])
    })

    it('should restrict a nested items.anyOf options array', () => {
      const schema1: Record<string, any> = {
        items: { anyOf: [{ const: 'A' }, { const: 'B' }, { const: 'C' }] },
      }
      mergeSchemaBranch(schema1, {
        items: { anyOf: [{ const: 'C' }, { const: 'D' }] },
      })
      expect(schema1.items.anyOf).toEqual([{ const: 'C' }])
      expect(schema1.items.anyOf).toHaveLength(1)
    })

    it('should add the branch options when the base declares none', () => {
      const schema1: Record<string, any> = { type: 'string' }
      mergeSchemaBranch(schema1, { enum: ['a', 'b'] })
      expect(schema1).toEqual({ type: 'string', enum: ['a', 'b'] })
    })

    it('should add the branch options when the base declares none for option-like arrays', () => {
      const schema1: Record<string, any> = { type: 'string' }
      mergeSchemaBranch(schema1, { oneOf: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })
      expect(schema1.oneOf).toEqual([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }])
    })
  })
})

describe('mergeFieldProperties', () => {
  const baseField = (): Field => ({
    name: 'field',
    type: 'text',
    inputType: 'text',
    required: false,
    jsonType: 'string',
    isVisible: true,
  })

  it('should copy over properties that only exist in the source', () => {
    const target = baseField()
    mergeFieldProperties(target, { ...baseField(), label: 'Label' })
    expect(target.label).toBe('Label')
  })

  it('should overwrite primitive values that differ', () => {
    const target = { ...baseField(), label: 'Old' }
    mergeFieldProperties(target, { ...baseField(), label: 'New' })
    expect(target.label).toBe('New')
  })

  it('should merge nested objects recursively', () => {
    const target = { ...baseField(), errorMessage: { required: 'Required' } }
    mergeFieldProperties(target, { ...baseField(), errorMessage: { type: 'Wrong type' } })
    expect(target.errorMessage).toEqual({ required: 'Required', type: 'Wrong type' })
  })

  it('should fully replace option arrays', () => {
    const target = { ...baseField(), options: [{ value: 'c', label: 'C' }] }
    // Reverting to a larger option set must not be blocked
    mergeFieldProperties(target, {
      ...baseField(),
      options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }],
    })
    expect(target.options).toEqual([{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }])
  })
})
