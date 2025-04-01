import type { JsfObjectSchema, ObjectValue, SchemaValue } from '../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('Field visibility', () => {
  describe('if inside allOf', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      allOf: [
        {
          if: {
            properties: {
              name: {
                const: 'admin',
              },
            },
            required: ['name'],
          },
          else: {
            properties: {
              password: false,
            },
          },
        },
      ],
    }

    it('should hide the password field by default', () => {
      const form = createHeadlessForm(schema)
      // No name provided
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)

      // Different name provided
      form.handleValidation({
        name: 'some name',
      })
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)
    })

    it('should show the password field if the name is admin', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({
        name: 'admin',
      })
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)
    })
  })

  // This does not work with v0 but I think it should work with v1
  describe('if on object schema level', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
      if: {
        properties: {
          name: {
            const: 'admin',
          },
        },
        required: ['name'],
      },
      else: {
        properties: {
          password: false,
        },
      },
    }

    it('should hide the password field by default', () => {
      const form = createHeadlessForm(schema)
      // No name provided
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)

      // Different name provided
      form.handleValidation({
        name: 'some name',
      })
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)
    })

    it('should show the password field if the name is admin', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({
        name: 'admin',
      })
      expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)
    })
  })
})
