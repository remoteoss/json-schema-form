import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('boolean schema validation', () => {
  it('returns an error if the value is false', () => {
    const form = createHeadlessForm({ properties: { name: false } })

    expect(form.handleValidation({ name: 'anything' })).toMatchObject({ formErrors: { '.name': 'always fails' } })
    expect(form.handleValidation({})).not.toHaveProperty('formErrors')
  })

  it('does not return an error if the value is true', () => {
    const form = createHeadlessForm({ properties: { name: true } })

    expect(form.handleValidation({ name: 'anything' })).not.toHaveProperty('formErrors')
    expect(form.handleValidation({})).not.toHaveProperty('formErrors')
  })
})
