import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('Form error transformation', () => {
  describe('validationErrorsToFormErrors behavior', () => {
    it('should transform single field errors', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          username: { type: 'string' },
        },
        required: ['username'],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({})

      expect(result.formErrors).toEqual({
        username: expect.any(String),
      })
    })

    it('should transform nested field errors using nested object structure', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
            },
            required: ['street'],
          },
        },
        required: ['address'],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({ address: {} })

      expect(result.formErrors).toEqual({
        address: {
          street: expect.any(String),
        },
      })
    })

    it('should handle schema-level errors', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        oneOf: [
          {
            properties: {
              type: { const: 'type1' },
              value1: { type: 'string' },
            },
            required: ['type', 'value1'],
          },
          {
            properties: {
              type: { const: 'type2' },
              value2: { type: 'number' },
            },
            required: ['type', 'value2'],
          },
        ],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({ type: 'type3' })

      // Schema-level error (oneOf validation failed)
      expect(result.formErrors).toBeTruthy()
      expect(result.formErrors?.[''] !== undefined).toBeTruthy()
    })

    it('should use last error message when multiple errors exist for same field', () => {
      // This is hard to test directly through the public API
      // We'll test a scenario where a field could have multiple validation errors
      // but only one will be shown in the form errors
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            minimum: 10,
            maximum: -10,
          },
        },
        required: ['count'],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({ count: 0 })

      // There should be only one error message for the count field
      expect(result.formErrors).toEqual({
        count: expect.stringMatching(/greater.+(?<!-)10/), // Checks for greater and a non-negative number
      })

      // The error message should be a string, not an array
      expect(typeof result.formErrors?.count).toBe('string')
    })

    it('should handle multiple nested levels', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          level1: {
            type: 'object',
            properties: {
              level2: {
                type: 'object',
                properties: {
                  level3: { type: 'string' },
                },
                required: ['level3'],
              },
            },
            required: ['level2'],
          },
        },
        required: ['level1'],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({ level1: { level2: {} } })

      expect(result.formErrors).toEqual({
        level1: {
          level2: {
            level3: expect.any(String),
          },
        },
      })
    })
  })
})
