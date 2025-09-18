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

  describe('boolean condition mutation', () => {
    it.each([true, false])('should ignore the allowForbiddenValues option (%s) when evaluating a condition that\'s a plain boolean', (allowForbiddenValues) => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        if: true,
        then: {
          properties: {
            name: {
              const: 'foo',
            },
          },
        },
        else: {
          properties: {
            name: {
              const: 'bar',
            },
          },
        },
      }

      // check that the then branch is applied
      let form = createHeadlessForm(schema, { legacyOptions: { allowForbiddenValues } })
      let errors = form.handleValidation({ name: 'bar' })
      expect(errors.formErrors).toEqual({ name: 'The only accepted value is "foo".' })
      errors = form.handleValidation({ name: 'foo' })
      expect(errors.formErrors).toBeUndefined()

      // change condition to false
      schema.if = false
      form = createHeadlessForm(schema, { legacyOptions: { allowForbiddenValues } })
      errors = form.handleValidation({ name: 'foo' })
      expect(errors.formErrors).toEqual({ name: 'The only accepted value is "bar".' })
      errors = form.handleValidation({ name: 'bar' })
      expect(errors.formErrors).toBeUndefined()

      // check that it correctly applies visibility state
      schema.else = { properties: { name: false } }
      form = createHeadlessForm(schema, { legacyOptions: { allowForbiddenValues } })
      expect(getField(form.fields, 'name')?.isVisible).toBe(false)
      expect(errors.formErrors).toBeUndefined()
    })

    it.each([true, false])('given allowForbiddenValues: %s, and a schema with a conditional boolean, it ignores errors in fieldsets', (allowForbiddenValues) => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              street: {
                type: 'string',
              },
              zipCode: {
                type: 'string',
              },
            },
          },
        },
        if: false,
        then: {
          required: ['address'],
        },
        else: {
          properties: {
            address: false,
          },
        },
      }

      const form = createHeadlessForm(schema, { legacyOptions: { allowForbiddenValues } })
      const errors = form.handleValidation({
        // This value is not allowed, but by passing allowForbiddenValues: true, the error is ignored.
        address: {},
      })

      if (allowForbiddenValues) {
        expect(errors.formErrors).toBeUndefined()
      }
      else {
        expect(errors.formErrors).toEqual({ address: 'Not allowed' })
      }
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

    it('should be able to preserve x-jsf-presentation properties in a nested field', () => {
      const customComponent = () => {
        return null
      }
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          apartment: {
            type: 'object',
            properties: {
              number: {
                'type': 'string',
                'x-jsf-presentation': {
                  Component: customComponent,
                },
              },
            },
          },
        },
      }
      const form = createHeadlessForm(schema)
      form.handleValidation({ formType: 'advanced' })

      expect(getField(form.fields, 'apartment', 'number')).toHaveProperty('Component', customComponent)
    })
  })

  it('correctly updates required on fields', () => {
    const schema: JsfObjectSchema = {
      'additionalProperties': false,
      'allOf': [
        {
          else: {
            properties: {
              dependent_details: false,
            },
          },
          if: {
            properties: {
              has_dependents: {
                const: 'yes',
              },
            },
            required: [
              'has_dependents',
            ],
          },
          then: {
            required: [
              'dependent_details',
            ],
          },
        },
      ],
      'properties': {
        dependent_details: {
          'items': {
            'properties': {
              first_name: {
                'maxLength': 255,
                'title': 'First name',
                'type': 'string',
                'x-jsf-presentation': {
                  inputType: 'text',
                },
              },
            },
            'required': [
              'first_name',
            ],
            'type': 'object',
            'x-jsf-order': [
              'first_name',
            ],
          },
          'title': 'Dependent',
          'type': 'array',
          'x-jsf-presentation': {
            addFieldText: 'Add new section for dependent',
            inputType: 'group-array',
          },
        },
        has_dependents: {
          'oneOf': [
            {
              const: 'yes',
              title: 'Yes',
            },
            {
              const: 'no',
              title: 'No',
            },
          ],
          'title': 'Do you have dependents to claim?',
          'type': 'string',
          'x-jsf-presentation': {
            direction: 'row',
            inputType: 'radio',
          },
        },
      },
      'required': [
        'has_dependents',
      ],
      'type': 'object',
      'x-jsf-order': [
        'has_dependents',
        'dependent_details',
      ],
    }

    const form = createHeadlessForm(schema)

    expect(form.fields[1].required).toBe(false)

    form.handleValidation({ has_dependents: 'yes' })

    expect(form.fields[1].required).toBe(true)
  })
})
