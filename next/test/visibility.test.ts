import type { JsfObjectSchema, ObjectValue, SchemaValue } from '../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('Field visibility', () => {
  describe('updateFieldVisibility behavior', () => {
    it('should keep all fields visible by default without conditional rules', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          requiredField: { type: 'string' },
          optionalField: { type: 'string' },
        },
        required: ['requiredField'],
      }

      const form = createHeadlessForm(schema)

      const requiredField = form.fields.find(field => field.name === 'requiredField')
      const optionalField = form.fields.find(field => field.name === 'optionalField')

      expect(requiredField?.isVisible).toBe(true)
      expect(optionalField?.isVisible).toBe(true)
    })

    it('should make fields visible when included in required array of conditional rule', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          showDetails: { type: 'boolean' },
          details: { type: 'string' },
        },
        allOf: [
          {
            if: {
              properties: {
                showDetails: { const: true },
              },
              required: ['showDetails'],
            },
            then: {
              required: ['details'],
            },
          },
        ],
      }

      const form = createHeadlessForm(schema)

      const detailsField = form.fields.find(field => field.name === 'details')
      expect(detailsField?.isVisible).toBe(false)

      const value1: ObjectValue = { showDetails: true as unknown as SchemaValue }
      form.handleValidation(value1)
      expect(detailsField?.isVisible).toBe(true)

      const value2: ObjectValue = { showDetails: false as unknown as SchemaValue }
      form.handleValidation(value2)
      expect(detailsField?.isVisible).toBe(false)
    })

    it('should hide fields explicitly set to false in properties', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          toggle: { type: 'boolean' },
          alwaysVisible: { type: 'string' },
        },
        required: ['alwaysVisible'],
        allOf: [
          {
            if: {
              properties: {
                toggle: { const: true },
              },
              required: ['toggle'],
            },
            then: {
              properties: {
                alwaysVisible: false,
              },
            },
          },
        ],
      }

      const form = createHeadlessForm(schema)

      const targetField = form.fields.find(field => field.name === 'alwaysVisible')
      expect(targetField?.isVisible).toBe(true)

      const value: ObjectValue = { toggle: true as unknown as SchemaValue }
      form.handleValidation(value)
      expect(targetField?.isVisible).toBe(false)
    })

    it('should handle nested field visibility', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['personal', 'business'] },
              personalName: { type: 'string' },
              businessName: { type: 'string' },
            },
            required: ['type'],
            allOf: [
              {
                if: {
                  properties: {
                    type: { const: 'personal' },
                  },
                  required: ['type'],
                },
                then: {
                  required: ['personalName'],
                },
              },
              {
                if: {
                  properties: {
                    type: { const: 'business' },
                  },
                  required: ['type'],
                },
                then: {
                  required: ['businessName'],
                },
              },
            ],
          },
        },
      }

      // We need to initialize with user object explicitly for nested fields
      const form = createHeadlessForm(schema, { initialValues: { user: {} } })

      const userField = form.fields.find(field => field.name === 'user')
      expect(userField?.fields).toBeTruthy()

      if (userField?.fields) {
        const typeField = userField.fields.find(f => f.name === 'type')
        const personalNameField = userField.fields.find(f => f.name === 'personalName')
        const businessNameField = userField.fields.find(f => f.name === 'businessName')

        expect(typeField?.isVisible).toBe(true)
        expect(personalNameField?.isVisible).toBe(false)
        expect(businessNameField?.isVisible).toBe(false)

        const personalValue: ObjectValue = { user: { type: 'personal' } as ObjectValue }
        form.handleValidation(personalValue)
        expect(personalNameField?.isVisible).toBe(true)
        expect(businessNameField?.isVisible).toBe(false)

        const businessValue: ObjectValue = { user: { type: 'business' } as ObjectValue }
        form.handleValidation(businessValue)
        expect(personalNameField?.isVisible).toBe(false)
        expect(businessNameField?.isVisible).toBe(true)
      }
    })

    it('should consider type errors in conditional fields', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          count: { type: 'number' },
          details: { type: 'string' },
        },
        allOf: [
          {
            if: {
              properties: {
                count: { minimum: 1 },
              },
              required: ['count'],
            },
            then: {
              required: ['details'],
            },
          },
        ],
      }

      const form = createHeadlessForm(schema)

      const detailsField = form.fields.find(field => field.name === 'details')
      expect(detailsField?.isVisible).toBe(false)

      const invalidValue: ObjectValue = { count: 'not-a-number' }
      form.handleValidation(invalidValue)
      expect(detailsField?.isVisible).toBe(false)

      const validValue: ObjectValue = { count: 2 }
      form.handleValidation(validValue)
      expect(detailsField?.isVisible).toBe(true)
    })

    it('should handle multiple conditional rules affecting the same field', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          isAdult: { type: 'boolean' },
          hasJob: { type: 'boolean' },
          salary: { type: 'string' },
        },
        allOf: [
          {
            if: {
              properties: {
                isAdult: { const: true },
              },
              required: ['isAdult'],
            },
            then: {
              required: ['hasJob'],
            },
          },
          {
            if: {
              properties: {
                hasJob: { const: true },
              },
              required: ['hasJob'],
            },
            then: {
              required: ['salary'],
            },
          },
        ],
      }

      const form = createHeadlessForm(schema)

      const hasJobField = form.fields.find(f => f.name === 'hasJob')
      const salaryField = form.fields.find(f => f.name === 'salary')

      expect(hasJobField?.isVisible).toBe(false)
      expect(salaryField?.isVisible).toBe(false)

      const value1: ObjectValue = { isAdult: true as unknown as SchemaValue }
      form.handleValidation(value1)
      expect(hasJobField?.isVisible).toBe(true)
      expect(salaryField?.isVisible).toBe(false)

      const value2: ObjectValue = {
        isAdult: true as unknown as SchemaValue,
        hasJob: true as unknown as SchemaValue,
      }
      form.handleValidation(value2)
      expect(hasJobField?.isVisible).toBe(true)
      expect(salaryField?.isVisible).toBe(true)

      const value3: ObjectValue = {
        isAdult: true as unknown as SchemaValue,
        hasJob: false as unknown as SchemaValue,
      }
      form.handleValidation(value3)
      expect(hasJobField?.isVisible).toBe(true)
      expect(salaryField?.isVisible).toBe(false)

      const value4: ObjectValue = {
        isAdult: false as unknown as SchemaValue,
      }
      form.handleValidation(value4)
      expect(hasJobField?.isVisible).toBe(false)
      expect(salaryField?.isVisible).toBe(false)
    })
  })
})
