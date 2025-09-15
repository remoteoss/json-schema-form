import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { getField } from '../../src/utils'

describe('Field visibility', () => {
  describe('if inside allOf', () => {
    describe('with group-array', () => {
      it('correctly applies visibility when the condition is true', () => {
        const schema: JsfObjectSchema = {
          type: 'object',
          additionalProperties: false,
          properties: {
            children: {
              'items': {
                'properties': {
                  full_name: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Child Full Name',
                    'type': 'string',
                  },
                  field_1: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Field 1',
                    'type': 'string',
                  },
                  field_2: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Field 2',
                    'type': 'string',
                  },
                },
                'x-jsf-order': ['full_name', 'field_1', 'field_2'],
                'required': ['full_name'],
                'type': 'object',
                'allOf': [
                  {
                    if: true,
                    then: {
                      required: ['field_1'],
                      properties: {
                        field_2: false,
                      },
                    },
                    else: {
                      required: ['field_2'],
                      properties: {
                        field_1: false,
                      },
                    },
                  },
                ],
              },
              'x-jsf-presentation': {
                inputType: 'group-array',
                addFieldText: 'Add new field',
              },
              'title': 'Children',
              'type': 'array',
            },
          },
          required: ['children'],
        }

        const form = createHeadlessForm(schema, { initialValues: { children: [{ full_name: 'name' }] } })

        expect(form.fields.find(({ name }) => name === 'children')?.fields?.find(({ name }) => name === 'field_1')?.isVisible).toBe(true)
        expect(form.fields.find(({ name }) => name === 'children')?.fields?.find(({ name }) => name === 'field_2')?.isVisible).toBe(false)
      })

      it('correctly applies visibility when the condition is false', () => {
        const schema: JsfObjectSchema = {
          type: 'object',
          additionalProperties: false,
          properties: {
            children: {
              'items': {
                'properties': {
                  full_name: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Child Full Name',
                    'type': 'string',
                  },
                  field_1: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Field 1',
                    'type': 'string',
                  },
                  field_2: {
                    'x-jsf-presentation': {
                      inputType: 'text',
                    },
                    'title': 'Field 2',
                    'type': 'string',
                  },
                },
                'x-jsf-order': ['full_name', 'field_1', 'field_2'],
                'required': ['full_name'],
                'type': 'object',
                'allOf': [
                  {
                    if: false,
                    then: {
                      required: ['field_1'],
                      properties: {
                        field_2: false,
                      },
                    },
                    else: {
                      required: ['field_2'],
                      properties: {
                        field_1: false,
                      },
                    },
                  },
                ],
              },
              'x-jsf-presentation': {
                inputType: 'group-array',
                addFieldText: 'Add new field',
              },
              'title': 'Children',
              'type': 'array',
            },
          },
          required: ['children'],
        }

        const form = createHeadlessForm(schema, { initialValues: { children: [{ full_name: 'name' }] } })

        expect(form.fields.find(({ name }) => name === 'children')?.fields?.find(({ name }) => name === 'field_1')?.isVisible).toBe(false)
        expect(form.fields.find(({ name }) => name === 'children')?.fields?.find(({ name }) => name === 'field_2')?.isVisible).toBe(true)
      })
    })

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
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)

        // Different name provided
        form.handleValidation({
          name: 'some name',
          password: null,
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)
      })

      it('should show the password field if the name is admin', () => {
        const form = createHeadlessForm(schema)
        form.handleValidation({
          name: 'admin',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
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
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })

      it('should hide the password field if the name is "user that does not need password field visible"', () => {
        const form = createHeadlessForm(schema, { initialValues: { name: userName, password: null } })
        expect(getField(form.fields, 'password')?.isVisible).toBe(false)
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
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)

        // Different name provided
        form.handleValidation({
          name: 'some name',
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })

      it('should show the password field if the name is "admin"', () => {
        const form = createHeadlessForm(schema)
        form.handleValidation({
          name: userName,
        })
        expect(getField(form.fields, 'password')?.isVisible).toBe(true)
      })
    })
  })

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
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(false)

      // Different name provided
      form.handleValidation({
        form: {
          name: 'some name',
          password: null,
        },
      })
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(false)
    })

    it('should show the password field if the name is admin', () => {
      const form = createHeadlessForm(schema, { initialValues: { form: { name: 'admin', password: null } } })
      form.handleValidation({ form: {
        name: 'admin',
      } })
      expect(getField(form.fields, 'form', 'password')?.isVisible).toBe(true)
    })

    it('should allow hiding the whole fieldset', () => {
      const conditionalFieldsetSchema: JsfObjectSchema = {
        type: 'object',
        properties: {
          hide_form: {
            type: 'string',
          },
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
            hide_form: {
              const: 'yes',
            },
          },
          required: ['hide_form'],
        },
        then: {
          properties: {
            form: false,
          },
        },
      }

      const form = createHeadlessForm(conditionalFieldsetSchema, { initialValues: { form: { name: 'admin', password: null } } })
      form.handleValidation({ hide_form: 'yes' })

      expect(getField(form.fields, 'form')?.isVisible).toBe(false)
    })
  })
})
