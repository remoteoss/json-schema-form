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

  it('treats an empty array as a present value for a required field', () => {
    // A required array property with `minItems: 0` should accept an empty
    // array: `required` only checks presence, and length is governed by
    // `minItems`. See https://github.com/remoteoss/json-schema-form/issues/247
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 0,
        },
      },
      required: ['sources'],
    }
    const form = createHeadlessForm(schema)

    // An empty array satisfies the required check
    expect(form.handleValidation({ sources: [] })).not.toHaveProperty('formErrors')

    // A populated array is also valid
    expect(form.handleValidation({ sources: [1, 2] })).not.toHaveProperty('formErrors')

    // A missing key is still reported as required
    expect(form.handleValidation({})).toMatchObject({
      formErrors: { sources: 'Required field' },
    })
  })

  it('still enforces minItems on a required array (length is not the job of required)', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 1,
        },
      },
      required: ['sources'],
    }
    const form = createHeadlessForm(schema)

    // An empty array is present (so not a "required" error) but violates
    // minItems, so the error comes from minItems rather than required.
    expect(form.handleValidation({ sources: [] })).toMatchObject({
      formErrors: { sources: 'Must have at least 1 item' },
    })

    // A populated array satisfies minItems
    expect(form.handleValidation({ sources: [1] })).not.toHaveProperty('formErrors')
  })

  it('treats an empty array as missing for a required field without minItems', () => {
    // When no `minItems` is declared, a required array keeps the existing
    // behaviour of treating an empty array as a missing value.
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: { type: 'integer' },
        },
      },
      required: ['sources'],
    }
    const form = createHeadlessForm(schema)

    expect(form.handleValidation({ sources: [] })).toMatchObject({
      formErrors: { sources: 'Required field' },
    })
    expect(form.handleValidation({ sources: [1] })).not.toHaveProperty('formErrors')
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
