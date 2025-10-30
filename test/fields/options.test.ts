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
