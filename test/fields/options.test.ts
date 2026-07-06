import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src/form'

describe('Select field options', () => {
  it('should return cached options based on content hash', () => {
    // Create two separate oneOf arrays with identical content
    const options1 = [
      { const: 'value_1', title: 'Option 1' },
      { const: 'value_2', title: 'Option 2' },
      { const: 'value_3', title: 'Option 3' },
    ]

    const options2 = [
      { const: 'value_1', title: 'Option 1' },
      { const: 'value_2', title: 'Option 2' },
      { const: 'value_3', title: 'Option 3' },
    ]

    // Different object references but same content
    expect(options1).not.toBe(options2)
    expect(options1).toEqual(options2)

    const schema = {
      type: 'object' as const,
      properties: {
        field1: {
          type: 'string' as const,
          oneOf: options1,
        },
        field2: {
          type: 'string' as const,
          oneOf: options2,
        },
        field3: {
          type: 'string' as const,
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Verify both fields have correct options
    const field1Options = form.fields.find(f => f.name === 'field1')?.options
    const field2Options = form.fields.find(f => f.name === 'field2')?.options

    expect(field1Options?.length).toBe(3)
    expect(field2Options?.length).toBe(3)
    expect(field1Options?.[0]).toEqual({ label: 'Option 1', value: 'value_1' })
    expect(field2Options?.[2]).toEqual({ label: 'Option 3', value: 'value_3' })

    // Same cached array reference returned for identical content
    expect(field1Options).toBe(field2Options)
  })

  it('should maintain options correctly across validations', () => {
    // Create a small options array for testing
    const options = [
      { label: 'Option 1', value: 'value_1' },
      { label: 'Option 2', value: 'value_2' },
      { label: 'Option 3', value: 'value_3' },
    ]

    const schemaWithOptions = {
      type: 'object' as const,
      properties: {
        field1: {
          'type': 'string' as const,
          'x-jsf-presentation': {
            inputType: 'select' as const,
            options,
          },
        },
        field2: {
          'type': 'string' as const,
          'x-jsf-presentation': {
            inputType: 'select' as const,
            options, // Same options array reference
          },
        },
        otherField: {
          type: 'string' as const,
        },
      },
    }

    const form = createHeadlessForm(schemaWithOptions)

    // After validation, options should still be present and correct
    form.handleValidation({
      field1: 'value_1',
      field2: 'value_2',
      otherField: 'test',
    })

    const field1Options = form.fields.find(f => f.name === 'field1')?.options
    const field2Options = form.fields.find(f => f.name === 'field2')?.options

    // Options should still be present with correct content
    expect(field1Options).toBeDefined()
    expect(field2Options).toBeDefined()
    expect(field1Options?.length).toBe(3)
    expect(field2Options?.length).toBe(3)

    expect(field1Options?.[0]).toEqual({ label: 'Option 1', value: 'value_1' })
    expect(field1Options?.[2]).toEqual({ label: 'Option 3', value: 'value_3' })
  })

  it('should return different references for options arrays with same length but different content', () => {
    // Create two options arrays with same length but different content
    const options1 = [
      { label: 'Option A', value: 'value_a' },
      { label: 'Option B', value: 'value_b' },
      { label: 'Option C', value: 'value_c' },
    ]

    const options2 = [
      { label: 'Option A', value: 'value_a' },
      { label: 'Option B', value: 'value_b' },
      { label: 'Option D', value: 'value_d' },
    ]

    const schema = {
      type: 'object' as const,
      properties: {
        field1: {
          'type': 'string' as const,
          'x-jsf-presentation': {
            inputType: 'select' as const,
            options: options1,
          },
        },
        field2: {
          'type': 'string' as const,
          'x-jsf-presentation': {
            inputType: 'select' as const,
            options: options2,
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    const field1Options = form.fields.find(f => f.name === 'field1')?.options
    const field2Options = form.fields.find(f => f.name === 'field2')?.options

    expect(field1Options?.length).toBe(3)
    expect(field2Options?.length).toBe(3)

    // Should return different references due to different content
    expect(field1Options).not.toBe(field2Options)

    // Verify the content is different
    expect(field1Options?.[2]).toEqual({ label: 'Option C', value: 'value_c' })
    expect(field2Options?.[2]).toEqual({ label: 'Option D', value: 'value_d' })
  })
})

describe('conditionally replacing option-like arrays', () => {
  const getOptions = (form: ReturnType<typeof createHeadlessForm>, name: string) =>
    form.fields.find(f => f.name === name)?.options

  it('should fully replace oneOf options when a conditional branch provides updated options', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        trigger: { type: 'string' as const },
        choice: {
          type: 'string' as const,
          oneOf: [
            { const: 'a', title: 'A' },
            { const: 'b', title: 'B' },
            { const: 'c', title: 'C' },
          ],
        },
      },
      allOf: [
        {
          if: { properties: { trigger: { const: 'only c' } }, required: ['trigger'] },
          then: {
            properties: {
              choice: {
                oneOf: [{ const: 'c', title: 'C' }],
              },
            },
          },
        },
      ],
    }

    const form = createHeadlessForm(schema)

    expect(getOptions(form, 'choice')).toEqual([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
    ])

    expect(form.handleValidation({ choice: 'b' }).formErrors).toBeUndefined()
    expect(form.handleValidation({ choice: 'z' }).formErrors).toEqual({
      choice: 'The option "z" is not valid.',
    })

    // Applies the conditional branch options
    form.handleValidation({ trigger: 'only c' })
    expect(getOptions(form, 'choice')).toEqual([{ label: 'C', value: 'c' }])

    expect(form.handleValidation({ trigger: 'only c', choice: 'c' }).formErrors).toBeUndefined()
    expect(form.handleValidation({ trigger: 'only c', choice: 'b' }).formErrors).toEqual({
      choice: 'The option "b" is not valid.',
    })

    // When the branch is no longer active, options revert to the default set
    form.handleValidation({ trigger: 'stop' })
    expect(getOptions(form, 'choice')).toEqual([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
      { label: 'C', value: 'c' },
    ])

    expect(form.handleValidation({ trigger: 'stop', choice: 'b' }).formErrors).toBeUndefined()
  })

  it('should fully replace anyOf options when a conditional branch provides updated options', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        trigger: { type: 'string' as const },
        choice: {
          type: 'string' as const,
          anyOf: [
            { const: 'a', title: 'A' },
            { const: 'b', title: 'B' },
            { const: 'c', title: 'C' },
          ],
        },
      },
      allOf: [
        {
          if: { properties: { trigger: { const: 'go' } }, required: ['trigger'] },
          then: {
            properties: {
              choice: {
                anyOf: [{ const: 'c', title: 'C' }],
              },
            },
          },
        },
      ],
    }

    const form = createHeadlessForm(schema)

    expect(getOptions(form, 'choice')).toHaveLength(3)

    form.handleValidation({ trigger: 'go' })
    expect(getOptions(form, 'choice')).toEqual([{ label: 'C', value: 'c' }])

    // Only the replacement option validates; the original options are gone
    expect(form.handleValidation({ trigger: 'go', choice: 'c' }).formErrors).toBeUndefined()
    expect(form.handleValidation({ trigger: 'go', choice: 'b' }).formErrors).toEqual({
      choice: 'The option "b" is not valid.',
    })
  })

  it('should fully replace enum options when a conditional branch provides updated options', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        userType: { type: 'string' as const },
        permissions: {
          type: 'string' as const,
          enum: ['read', 'write', 'execute'],
        },
      },
      allOf: [
        {
          if: { properties: { userType: { const: 'guest' } }, required: ['userType'] },
          then: {
            properties: {
              permissions: {
                enum: ['read'],
              },
            },
          },
        },
      ],
    }

    const form = createHeadlessForm(schema)
    const getEnum = () => form.fields.find(f => f.name === 'permissions')?.enum

    expect(getEnum()).toEqual(['read', 'write', 'execute'])

    expect(form.handleValidation({ permissions: 'write' }).formErrors).toBeUndefined()

    form.handleValidation({ userType: 'guest' })
    expect(getEnum()).toEqual(['read'])

    expect(form.handleValidation({ userType: 'guest', permissions: 'read' }).formErrors).toBeUndefined()
    expect(form.handleValidation({ userType: 'guest', permissions: 'write' }).formErrors).toEqual({
      permissions: 'The option "write" is not valid.',
    })

    form.handleValidation({ userType: 'user' })
    expect(getEnum()).toEqual(['read', 'write', 'execute'])

    expect(form.handleValidation({ userType: 'user', permissions: 'write' }).formErrors).toBeUndefined()
  })

  it('should replace oneOf options even when the incoming set contains a null const', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        trigger: { type: 'string' as const },
        choice: {
          type: 'string' as const,
          oneOf: [
            { const: 'a', title: 'A' },
            { const: 'b', title: 'B' },
          ],
        },
      },
      allOf: [
        {
          if: { properties: { trigger: { const: 'go' } }, required: ['trigger'] },
          then: {
            properties: {
              choice: {
                type: ['string', 'null'] as const,
                oneOf: [
                  { const: 'c', title: 'C' },
                  { const: null, title: 'N/A' },
                ],
              },
            },
          },
        },
      ],
    }

    const form = createHeadlessForm(schema)

    // A null const in the incoming set must not throw during the merge, and the
    // original 'A'/'B' options must not leak through
    expect(() => form.handleValidation({ trigger: 'go' })).not.toThrow()

    // Null option is not included
    expect(getOptions(form, 'choice')).toEqual([{ label: 'C', value: 'c' }])

    expect(form.handleValidation({ trigger: 'go', choice: 'c' }).formErrors).toBeUndefined()
    // accepts missing option selection
    expect(form.handleValidation({ trigger: 'go', choice: null }).formErrors).toBeUndefined()
    expect(form.handleValidation({ trigger: 'go', choice: 'b' }).formErrors).toEqual({
      choice: 'The option "b" is not valid.',
    })
  })
})
