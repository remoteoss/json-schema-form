import type { Field } from '../src/field/type'
import { describe, expect, it } from '@jest/globals'
import { getField } from '../src/utils'

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
      type: 'object',
      inputType: 'object',
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
        type: 'object',
        inputType: 'object',
        jsonType: 'object',
        label: 'Level 1',
        required: false,
        isVisible: true,
        fields: [
          {
            name: 'level2',
            type: 'object',
            inputType: 'object',
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
