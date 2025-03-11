import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('object schema validation', () => {
  it('returns an error if the value is not an object', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
          },
        },
      },
    }
    const form = createHeadlessForm(schema)

    expect(form.handleValidation({})).not.toHaveProperty('formErrors')
    expect(form.handleValidation({ address: {} })).not.toHaveProperty('formErrors')
    expect(form.handleValidation({ address: 'not an object' })).toMatchObject({
      formErrors: { address: 'The value must be an object' },
    })
  })

  it('validates the object properties', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
          },
        },
      },
    }
    const form = createHeadlessForm(schema)

    expect(form.handleValidation({ address: { street: 'some street' } })).not.toHaveProperty(
      'formErrors',
    )
    expect(form.handleValidation({ address: { street: 10 } })).toMatchObject({
      formErrors: { address: { street: 'The value must be a string' } },
    })
  })
})
