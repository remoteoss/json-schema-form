import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('additionalProperties validation', () => {
  describe('basic additionalProperties: false', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        a: { type: 'integer' },
        b: { type: 'string' },
      },
      additionalProperties: false,
    }
    const form = createHeadlessForm(schema)

    it('allows objects with only defined properties', () => {
      expect(form.handleValidation({ a: 1 })).not.toHaveProperty('formErrors')
      expect(form.handleValidation({ a: 1, b: 'test' })).not.toHaveProperty('formErrors')
    })

    it('rejects objects with additional properties', () => {
      expect(form.handleValidation({ a: 1, c: 'extra' })).toMatchObject({
        formErrors: { c: 'Additional property is not allowed' },
      })

      expect(form.handleValidation({ a: 1, b: 'test', c: 'extra' })).toMatchObject({
        formErrors: { c: 'Additional property is not allowed' },
      })
    })

    it('rejects objects with only additional properties', () => {
      expect(form.handleValidation({ c: 'extra' })).toMatchObject({
        formErrors: { c: 'Additional property is not allowed' },
      })
    })
  })

  describe('additionalProperties: false with patternProperties', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        foo: {},
        bar: {},
      },
      patternProperties: {
        '^v': {},
      },
      additionalProperties: false,
    }
    const form = createHeadlessForm(schema)

    it('allows properties defined in properties', () => {
      expect(form.handleValidation({ foo: 1 })).not.toHaveProperty('formErrors')
      expect(form.handleValidation({ foo: 1, bar: 2 })).not.toHaveProperty('formErrors')
    })

    it('allows properties matching patternProperties', () => {
      expect(form.handleValidation({ vroom: 1 })).not.toHaveProperty('formErrors')
      expect(form.handleValidation({ vampire: 1 })).not.toHaveProperty('formErrors')
      expect(form.handleValidation({ v: 1 })).not.toHaveProperty('formErrors')
    })

    it('allows combination of properties and patternProperties', () => {
      expect(form.handleValidation({ foo: 1, vroom: 2 })).not.toHaveProperty('formErrors')
      expect(form.handleValidation({ foo: 1, bar: 2, vampire: 3 })).not.toHaveProperty('formErrors')
    })

    it('rejects properties that match neither properties nor patternProperties', () => {
      expect(form.handleValidation({ foo: 1, quux: 'boom' })).toMatchObject({
        formErrors: { quux: 'Additional property is not allowed' },
      })

      expect(form.handleValidation({ hello: 'world' })).toMatchObject({
        formErrors: { hello: 'Additional property is not allowed' },
      })
    })
  })

  describe('when additionalProperties is not false', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        a: { type: 'integer' },
      },
    }
    const form = createHeadlessForm(schema)

    it('allows additional properties', () => {
      expect(form.handleValidation({ a: 1, b: 2, c: 3 })).not.toHaveProperty('formErrors')
    })
  })
})
