import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { getField } from '../../src/utils'

describe('field mutation', () => {
  describe('enum options mutation', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        userType: {
          type: 'string',
          enum: ['admin', 'user', 'guest'],
        },
        permissions: {
          type: 'string',
          enum: ['read', 'write', 'execute'],
        },
      },
      allOf: [
        {
          if: {
            properties: {
              userType: {
                const: 'admin',
              },
            },
            required: ['userType'],
          },
          then: {
            properties: {
              permissions: {
                enum: ['read', 'write', 'execute', 'all'],
              },
            },
          },
        },
        {
          if: {
            properties: {
              userType: {
                const: 'guest',
              },
            },
            required: ['userType'],
          },
          then: {
            properties: {
              permissions: {
                enum: ['read'],
              },
            },
          },
        },
      ],
    }

    it('should have default enum options for permissions field', () => {
      const form = createHeadlessForm(schema)
      expect(getField(form.fields, 'permissions')?.enum).toEqual(['read', 'write', 'execute'])
    })

    it('should update enum options when userType is admin', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ userType: 'admin' })
      expect(getField(form.fields, 'permissions')?.enum).toEqual(['read', 'write', 'execute', 'all'])
    })

    it('should update enum options when userType is guest', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ userType: 'guest' })
      expect(getField(form.fields, 'permissions')?.enum).toEqual(['read'])
    })

    it('should revert to default enum options when userType changes back to user', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ userType: 'admin' })
      expect(getField(form.fields, 'permissions')?.enum).toEqual(['read', 'write', 'execute', 'all'])

      form.handleValidation({ userType: 'user' })
      expect(getField(form.fields, 'permissions')?.enum).toEqual(['read', 'write', 'execute'])
    })
  })

  describe('validation property mutation', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        accountType: {
          type: 'string',
          enum: ['personal', 'business'],
        },
        employees: {
          type: 'number',
          minimum: 1,
          maximum: 100,
        },
      },
      allOf: [
        {
          if: {
            properties: {
              accountType: {
                const: 'business',
              },
            },
            required: ['accountType'],
          },
          then: {
            properties: {
              employees: {
                minimum: 5,
                maximum: 1000,
              },
            },
          },
        },
      ],
    }

    it('should have default min/max validation for employees field', () => {
      const form = createHeadlessForm(schema)
      expect(getField(form.fields, 'employees')?.minimum).toBe(1)
      expect(getField(form.fields, 'employees')?.maximum).toBe(100)
    })

    it('should update min/max validation when accountType is business', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ accountType: 'business' })
      expect(getField(form.fields, 'employees')?.minimum).toBe(5)
      expect(getField(form.fields, 'employees')?.maximum).toBe(1000)
    })

    it('should revert to default min/max validation when accountType changes back to personal', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ accountType: 'business' })
      expect(getField(form.fields, 'employees')?.minimum).toBe(5)

      form.handleValidation({ accountType: 'personal' })
      expect(getField(form.fields, 'employees')?.minimum).toBe(1)
      expect(getField(form.fields, 'employees')?.maximum).toBe(100)
    })
  })

  describe('nested object property mutation', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        delivery: {
          type: 'object',
          properties: {
            method: {
              type: 'string',
              enum: ['standard', 'express', 'pickup'],
            },
            address: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                },
                city: {
                  type: 'string',
                },
                zipCode: {
                  type: 'string',
                  pattern: '^[0-9]{5}$',
                },
              },
            },
          },
        },
      },
      if: {
        properties: {
          delivery: {
            properties: {
              method: {
                const: 'express',
              },
            },
            required: ['method'],
          },
        },
        required: ['delivery'],
      },
      then: {
        properties: {
          delivery: {
            properties: {
              address: {
                properties: {
                  zipCode: {
                    pattern: '^[0-9]{5}(-[0-9]{4})?$',
                    description: 'ZIP+4 code required for express delivery',
                  },
                },
              },
            },
          },
        },
      },
    }

    it('should have default pattern for zipCode field', () => {
      const form = createHeadlessForm(schema)
      expect(getField(form.fields, 'delivery', 'address', 'zipCode')?.pattern).toBe('^[0-9]{5}$')
      expect(getField(form.fields, 'delivery', 'address', 'zipCode')?.description).toBeUndefined()
    })

    it('should update pattern and add description when method is express', () => {
      const form = createHeadlessForm(schema, {
        initialValues: {
          delivery: {
            method: 'express',
            address: { street: '', city: '', zipCode: '' },
          },
        },
      })

      form.handleValidation({
        delivery: {
          method: 'express',
        },
      })

      expect(getField(form.fields, 'delivery', 'address', 'zipCode')?.pattern).toBe('^[0-9]{5}(-[0-9]{4})?$')
      expect(getField(form.fields, 'delivery', 'address', 'zipCode')?.description).toBe('ZIP+4 code required for express delivery')
    })
  })

  describe('x-jsf-presentation mutation', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        formType: {
          type: 'string',
          enum: ['simple', 'advanced'],
        },
        email: {
          'type': 'string',
          'format': 'email',
          'x-jsf-presentation': {
            widget: 'email',
            placeholder: 'Enter your email',
            hint: 'We will use this for notifications',
          },
        },
        phoneNumber: {
          'type': 'string',
          'pattern': '^[0-9]{10}$',
          'x-jsf-presentation': {
            widget: 'tel',
            placeholder: 'Enter your phone number',
            hint: 'Optional contact method',
          },
        },
      },
      allOf: [
        {
          if: {
            properties: {
              formType: {
                const: 'advanced',
              },
            },
            required: ['formType'],
          },
          then: {
            properties: {
              email: {
                'x-jsf-presentation': {
                  widget: 'email',
                  placeholder: 'Enter your business email',
                  hint: 'Required for business accounts',
                  className: 'business-email-field',
                },
              },
              phoneNumber: {
                'x-jsf-presentation': {
                  widget: 'tel',
                  placeholder: 'Enter business phone number',
                  hint: 'Required for urgent communications',
                  required: true,
                },
              },
            },
          },
        },
      ],
    }

    it('should have default x-jsf-presentation properties', () => {
      const form = createHeadlessForm(schema)

      const emailField = getField(form.fields, 'email')
      expect(emailField).toMatchObject({
        widget: 'email',
        placeholder: 'Enter your email',
        hint: 'We will use this for notifications',
      })

      const phoneField = getField(form.fields, 'phoneNumber')
      expect(phoneField).toMatchObject({
        widget: 'tel',
        placeholder: 'Enter your phone number',
        hint: 'Optional contact method',
      })
    })

    it('should update x-jsf-presentation properties when formType is advanced', () => {
      const form = createHeadlessForm(schema)
      form.handleValidation({ formType: 'advanced' })

      const emailField = getField(form.fields, 'email')
      expect(emailField).toMatchObject({
        widget: 'email',
        placeholder: 'Enter your business email',
        hint: 'Required for business accounts',
        className: 'business-email-field',
      })

      const phoneField = getField(form.fields, 'phoneNumber')
      expect(phoneField).toMatchObject({
        widget: 'tel',
        placeholder: 'Enter business phone number',
        hint: 'Required for urgent communications',
        required: true,
      })
    })

    it('should revert x-jsf-presentation properties when formType changes back to simple', () => {
      const form = createHeadlessForm(schema)

      form.handleValidation({ formType: 'advanced' })
      form.handleValidation({ formType: 'simple' })

      const emailField = getField(form.fields, 'email')
      expect(emailField).toMatchObject({
        widget: 'email',
        placeholder: 'Enter your email',
        hint: 'We will use this for notifications',
      })

      const phoneField = getField(form.fields, 'phoneNumber')
      expect(phoneField).toMatchObject({
        widget: 'tel',
        placeholder: 'Enter your phone number',
        hint: 'Optional contact method',
      })
    })
  })
})
