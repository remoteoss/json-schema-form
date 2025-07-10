import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('required field validation', () => {
  it('properly validates required fields according to JSON Schema spec', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: ['name'],
    }
    const form = createHeadlessForm(schema)

    // When the field is null, it should show "is required" message
    expect(form.handleValidation({ name: null })).toMatchObject({
      formErrors: { name: 'The value must be a string' },
    })

    // When the field is a non-null invalid type, it should show the default type error
    expect(form.handleValidation({ name: 123 })).toMatchObject({
      formErrors: { name: 'The value must be a string' },
    })

    // When the field is completely undefined (missing), it should show 'is required'
    expect(form.handleValidation({})).toMatchObject({
      formErrors: { name: 'Required field' },
    })

    // Valid value should not have errors
    expect(form.handleValidation({ name: 'Some value' })).not.toHaveProperty('formErrors')
  })

  it('allows null values when specified in the type array', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
        },
      },
      required: ['name'],
    }
    const form = createHeadlessForm(schema)

    // When the field is null but null is allowed in the type array, there should be no error
    expect(form.handleValidation({ name: null })).not.toHaveProperty('formErrors')

    // Valid string value should also not have errors
    expect(form.handleValidation({ name: 'Some value' })).not.toHaveProperty('formErrors')

    // Field is still required though
    expect(form.handleValidation({})).toMatchObject({
      formErrors: { name: 'Required field' },
    })
  })

  it('respects custom error messages from x-jsf-errorMessage', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: {
          'type': 'string',
          'x-jsf-errorMessage': {
            type: 'Custom type error message',
            required: 'Custom required error message',
          },
        },
      },
      required: ['name'],
    }
    const form = createHeadlessForm(schema)

    // When the field is null, it should use the custom type error message
    expect(form.handleValidation({ name: null })).toMatchObject({
      formErrors: { name: 'Custom type error message' },
    })

    // When the field is undefined, it should show the custom required error message
    expect(form.handleValidation({})).toMatchObject({
      formErrors: { name: 'Custom required error message' },
    })
  })
})
