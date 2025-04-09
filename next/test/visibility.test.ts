import type { JsfObjectSchema } from '../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('Field visibility', () => {
  describe('if inside allOf', () => {
    describe('if a "then" branch is not provided', () => {
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
        const form = createHeadlessForm(schema, { initialValues: { name: 'asd', password: null } })
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)

        // Different name provided
        form.handleValidation({
          name: 'some name',
          password: null,
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
    describe('if an "else" branch is not provided', () => {
      const userName = 'user that does not need password field visible'
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
                  const: userName,
                },
              },
              required: ['name'],
            },
            then: {
              properties: {
                password: false,
              },
            },
          },
        ],
      }

      it('should show the password field by default', () => {
        const form = createHeadlessForm(schema)
        // No name provided
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)
      })

      it('should hide the password field if the name is "user that does not need password field visible"', () => {
        const form = createHeadlessForm(schema, { initialValues: { name: userName, password: null } })
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(false)
      })
    })
    describe('if no "else" or "then" branch are provided', () => {
      const userName = 'admin'
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
                  const: userName,
                },
              },
              required: ['name'],
            },
          },
        ],
      }

      it('should show the password field by default', () => {
        const form = createHeadlessForm(schema)
        // No name provided
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)
      })

      it('should show the password field if the name is "admin"', () => {
        const form = createHeadlessForm(schema)
        form.handleValidation({
          name: userName,
        })
        expect(form.fields.find(field => field.name === 'password')?.isVisible).toBe(true)
      })
    })
  })

  // This does not work with v0 but I think it should work with v1
  describe('if on a fieldset schema level', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        form: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
        },
      },
      if: {
        properties: {
          form: {
            properties: {
              name: {
                const: 'admin',
              },
            },
            required: ['name'],
          },
        },
        required: ['form'],
      },
      else: {
        properties: {
          form: {
            properties: {
              password: false,
            },
          },
        },
      },
    }

    it('should hide the password field by default', () => {
      const form = createHeadlessForm(schema, { initialValues: { form: { name: '', password: null } } })
      // No name provided
      expect(form.fields.find(field => field.name === 'form')?.fields?.find(field => field.name === 'password')?.isVisible).toBe(false)

      // Different name provided
      form.handleValidation({
        form: {
          name: 'some name',
          password: null,
        },
      })
      expect(form.fields.find(field => field.name === 'form')?.fields?.find(field => field.name === 'password')?.isVisible).toBe(false)
    })

    it('should show the password field if the name is admin', () => {
      const form = createHeadlessForm(schema, { initialValues: { form: { name: 'admin', password: null } } })
      form.handleValidation({ form: {
        name: 'admin',
      } })
      expect(form.fields.find(field => field.name === 'form')?.fields?.find(field => field.name === 'password')?.isVisible).toBe(true)
    })
  })
})
