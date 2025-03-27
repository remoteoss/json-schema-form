import type { JsfObjectSchema, ObjectValue, SchemaValue } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

// Since cleanErrorPath is an internal function, we need to test it
// through the public API by examining how error paths are handled

describe('Error path handling', () => {
  describe('cleanErrorPath behavior', () => {
    it('should remove composition keywords and their indices from error paths', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        allOf: [
          {
            properties: {
              field: { type: 'string' },
            },
            required: ['field'],
          },
        ],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({})

      // The raw error path would be ['allOf', 0, 'field'], but cleanErrorPath should make it ['field']
      expect(result.formErrors).toEqual({
        field: expect.any(String),
      })
    })

    it('should handle anyOf composition with empty schema', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        anyOf: [
          {
            properties: {
              nested: { type: 'string' },
            },
            required: ['nested'],
          },
        ],
      }

      const form = createHeadlessForm(schema)
      const result = form.handleValidation({})

      // For anyOf, the error may appear as a schema-level error rather than a field-level error
      expect(result.formErrors).toBeTruthy()
      expect(
        result.formErrors?.[''] !== undefined
        || result.formErrors?.nested !== undefined,
      ).toBeTruthy()
    })

    it('should remove conditional keywords from error paths', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          toggle: { type: 'boolean' },
        },
        if: {
          properties: { toggle: { const: true } },
        },
        then: {
          properties: {
            conditionalField: { type: 'string' },
          },
          required: ['conditionalField'],
        },
      }

      const form = createHeadlessForm(schema)
      const value: ObjectValue = { toggle: true as unknown as SchemaValue }
      const result = form.handleValidation(value)

      // The raw path would be ['then', 'conditionalField'], but should be cleaned to ['conditionalField']
      expect(result.formErrors).toEqual({
        conditionalField: expect.any(String),
      })
    })

    it('should handle nested object paths correctly', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            allOf: [
              {
                properties: {
                  name: { type: 'string' },
                },
                required: ['name'],
              },
            ],
          },
        },
        required: ['user'],
      }

      const form = createHeadlessForm(schema)
      const value: ObjectValue = { user: {} }
      const result = form.handleValidation(value)

      // The raw path would be ['user', 'allOf', 0, 'name'], but should be cleaned to ['user', 'name']
      expect(result.formErrors).toEqual({
        user: {
          name: expect.any(String),
        },
      })
    })

    it('should handle complex paths with both composition and conditional keywords', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        allOf: [
          {
            if: {
              properties: { type: { const: 'complex' } },
            },
            then: {
              properties: {
                complexField: { type: 'string' },
              },
              required: ['complexField'],
            },
          },
        ],
        properties: {
          type: { type: 'string' },
        },
      }

      const form = createHeadlessForm(schema)
      const value: ObjectValue = { type: 'complex' }
      const result = form.handleValidation(value)

      // The raw path would be ['allOf', 0, 'then', 'complexField'], but should be cleaned to ['complexField']
      expect(result.formErrors).toEqual({
        complexField: expect.any(String),
      })
    })
  })
})
