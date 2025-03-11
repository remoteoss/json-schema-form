import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('boolean schema validation', () => {
  it('returns an error if the value is false', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: false,
      },
    }
    const form = createHeadlessForm(schema)

    expect(form.handleValidation({ name: 'anything' })).toMatchObject({
      formErrors: { name: 'Always fails' },
    })
    expect(form.handleValidation({})).not.toHaveProperty('formErrors')
  })

  it('does not return an error if the value is true', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: { name: true },
    }
    const form = createHeadlessForm(schema)

    expect(form.handleValidation({ name: 'anything' })).not.toHaveProperty('formErrors')
    expect(form.handleValidation({})).not.toHaveProperty('formErrors')
  })
})
