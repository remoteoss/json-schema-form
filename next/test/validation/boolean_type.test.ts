import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('boolean validation', () => {
  it('validates values against boolean type schemas', () => {
    const result = createHeadlessForm({
      type: 'object',
      properties: {
        show: { type: 'boolean' },
      },
    }).handleValidation({ show: 'anything' })

    expect(result).toMatchObject({
      formErrors: {
        show: 'The value must be a boolean',
      },
    })
  })

  it('validates values against the actual boolean value', () => {
    let result = createHeadlessForm({
      type: 'object',
      properties: {
        show: { type: 'boolean' },
      },
    }).handleValidation({ show: true })

    expect(result.formErrors).toBeUndefined()

    result = createHeadlessForm({
      type: 'object',
      properties: {
        show: { type: 'boolean' },
      },
    }).handleValidation({ show: false })

    expect(result.formErrors).toBeUndefined()
  })
