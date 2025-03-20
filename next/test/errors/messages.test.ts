import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('validation error messages', () => {
  describe('core validation errors', () => {
    it('shows appropriate type error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          string: { type: 'string' },
          number: { type: 'number' },
          boolean: { type: 'boolean' },
          object: { type: 'object' },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        string: 123,
        number: 'not a number',
        boolean: 'not a boolean',
        object: 'not an object',
      })

      expect(result.formErrors).toMatchObject({
        string: 'The value must be a string',
        number: 'The value must be a number',
        boolean: 'The value must be a boolean',
        object: 'The value must be an object',
      })
    })

    it('shows required field error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({})

      expect(result.formErrors).toMatchObject({
        name: 'Required field',
        age: 'Required field',
      })
    })

    it('shows enum validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
          },
          priority: {
            type: 'number',
            enum: [1, 2, 3],
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        status: 'invalid',
        priority: 4,
      })

      expect(result.formErrors).toMatchObject({
        status: 'The option "invalid" is not valid.',
        priority: 'The option "4" is not valid.',
      })
    })

    it('shows const validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            const: 'user',
          },
          version: {
            type: 'number',
            const: 1,
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        type: 'admin',
        version: 2,
      })

      expect(result.formErrors).toMatchObject({
        type: 'The only accepted value is "user"',
        version: 'The only accepted value is 1',
      })
    })
  })

  describe('string validation errors', () => {
    it('shows string length validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          shortString: {
            type: 'string',
            minLength: 5,
          },
          longString: {
            type: 'string',
            maxLength: 3,
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        shortString: 'abc',
        longString: 'toolong',
      })

      expect(result.formErrors).toMatchObject({
        shortString: 'Please insert at least 5 characters',
        longString: 'Please insert up to 3 characters',
      })
    })

    it('shows pattern validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          alphanumeric: {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        alphanumeric: 'special@characters!',
      })

      // Pattern error includes a random example, so we just check it starts with the right message
      expect(result.formErrors?.alphanumeric).toMatch(/^Must have a valid format. E.g./)
    })

    it('shows format validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          uri: {
            type: 'string',
            format: 'uri',
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        email: 'not-an-email',
        uri: 'not-a-uri',
      })

      expect(result.formErrors).toMatchObject({
        email: 'Please enter a valid email address',
        uri: 'Must be a valid uri format',
      })
    })
  })

  describe('number validation errors', () => {
    it('shows minimum and maximum validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          min: {
            type: 'number',
            minimum: 5,
          },
          max: {
            type: 'number',
            maximum: 10,
          },
          exclusive: {
            type: 'number',
            exclusiveMinimum: 0,
            exclusiveMaximum: 100,
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        min: 3,
        max: 15,
        exclusive: 0,
      })

      expect(result.formErrors).toMatchObject({
        min: 'Must be greater or equal to 5',
        max: 'Must be smaller or equal to 10',
        exclusive: 'Must be greater than 0',
      })

      const result2 = form.handleValidation({
        exclusive: 100,
      })

      expect(result2.formErrors).toMatchObject({
        exclusive: 'Must be smaller than 100',
      })
    })

    it('shows multipleOf validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          even: {
            type: 'number',
            multipleOf: 2,
          },
          decimal: {
            type: 'number',
            multipleOf: 0.5,
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        even: 3,
        decimal: 1.75,
      })

      expect(result.formErrors).toMatchObject({
        even: 'Must be a multiple of 2',
        decimal: 'Must be a multiple of 0.5',
      })
    })
  })

  describe('custom error messages', () => {
    it('allows overriding type error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          age: {
            'type': 'number',
            'x-jsf-errorMessage': {
              type: 'Age must be a number',
            },
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        age: 'not a number',
      })

      expect(result.formErrors).toMatchObject({
        age: 'Age must be a number',
      })
    })

    it('allows overriding required field error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          email: {
            'type': 'string',
            'x-jsf-errorMessage': {
              required: 'Please provide your email address',
            },
          },
        },
        required: ['email'],
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({})

      expect(result.formErrors).toMatchObject({
        email: 'Please provide your email address',
      })
    })

    it('allows overriding validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          password: {
            'type': 'string',
            'minLength': 8,
            'x-jsf-errorMessage': {
              minLength: 'Password must be at least 8 characters long',
            },
          },
          age: {
            'type': 'number',
            'minimum': 18,
            'x-jsf-errorMessage': {
              minimum: 'You must be 18 or older',
            },
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        password: 'short',
        age: 16,
      })

      expect(result.formErrors).toMatchObject({
        password: 'Password must be at least 8 characters long',
        age: 'You must be 18 or older',
      })
    })

    it('allows overriding anyOf error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          value: {
            'anyOf': [
              { type: 'string', maxLength: 5 },
              { type: 'number', minimum: 0 },
            ],
            'x-jsf-errorMessage': {
              anyOf: 'Please enter either a short text (max 5 chars) or a positive number',
            },
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        value: -1, // neither a short string nor a positive number
      })

      expect(result.formErrors).toMatchObject({
        value: 'Please enter either a short text (max 5 chars) or a positive number',
      })
    })

    it('allows overriding oneOf error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          value: {
            'oneOf': [
              { type: 'number', multipleOf: 5 },
              { type: 'number', multipleOf: 3 },
            ],
            'x-jsf-errorMessage': {
              oneOf: 'Number must be divisible by either 3 or 5, but not both',
            },
          },
        },
      }
      const form = createHeadlessForm(schema)

      // Test when no schema matches
      const result1 = form.handleValidation({
        value: 7,
      })

      expect(result1.formErrors).toMatchObject({
        value: 'Number must be divisible by either 3 or 5, but not both',
      })

      // Test when multiple schemas match
      const result2 = form.handleValidation({
        value: 15,
      })

      expect(result2.formErrors).toMatchObject({
        value: 'Number must be divisible by either 3 or 5, but not both',
      })
    })
  })

  describe('schema composition errors', () => {
    it('shows anyOf validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          value: {
            anyOf: [
              { type: 'string', maxLength: 5 },
              { type: 'number', minimum: 0 },
            ],
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        value: [], // neither a short string nor a positive number
      })

      expect(result.formErrors).toMatchObject({
        value: 'The option "[]" is not valid.',
      })
    })

    it('shows oneOf validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          value: {
            oneOf: [
              { type: 'number', multipleOf: 5 },
              { type: 'number', multipleOf: 3 },
            ],
          },
        },
      }
      const form = createHeadlessForm(schema)

      // No schema matches - neither multiple of 3 nor 5
      const result1 = form.handleValidation({
        value: 7,
      })

      expect(result1.formErrors).toMatchObject({
        value: 'The option "7" is not valid.',
      })

      // Multiple schemas match - multiple of both 3 and 5
      const result2 = form.handleValidation({
        value: 15,
      })

      expect(result2.formErrors).toMatchObject({
        value: 'The option "15" is not valid.',
      })
    })

    it('shows not validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          nonString: {
            not: { type: 'string' },
          },
          nonPositive: {
            type: 'number',
            not: { minimum: 0 },
          },
          alwaysFails: {
            not: true,
          },
          alwaysPasses: {
            not: { not: true },
          },
        },
      }
      const form = createHeadlessForm(schema)

      const result = form.handleValidation({
        nonString: 'this should fail',
        nonPositive: 5,
        alwaysFails: 'any value fails',
        alwaysPasses: 'any value passes',
      })

      expect(result.formErrors).toMatchObject({
        nonString: 'The value must not satisfy the provided schema',
        nonPositive: 'The value must not satisfy the provided schema',
        alwaysFails: 'The value must not satisfy the provided schema',
      })
      expect(result.formErrors).not.toHaveProperty('alwaysPasses')
    })

    it('shows allOf validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          value: {
            allOf: [
              { type: 'string' },
              { minLength: 3 },
              { maxLength: 5 },
            ],
          },
        },
      }
      const form = createHeadlessForm(schema)

      // Test type validation from first schema
      const result1 = form.handleValidation({
        value: 123,
      })

      expect(result1.formErrors).toMatchObject({
        value: 'The value must be a string',
      })

      // Test minLength validation from second schema
      const result2 = form.handleValidation({
        value: 'ab',
      })

      expect(result2.formErrors).toMatchObject({
        value: 'Please insert at least 3 characters',
      })

      // Test maxLength validation from third schema
      const result3 = form.handleValidation({
        value: 'too long',
      })

      expect(result3.formErrors).toMatchObject({
        value: 'Please insert up to 5 characters',
      })

      // Test valid case that satisfies all conditions
      const result4 = form.handleValidation({
        value: 'good',
      })

      expect(result4.formErrors).toBe(undefined)
    })

    it('shows nested composition error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          nested: {
            anyOf: [
              {
                allOf: [
                  { type: 'string' },
                  { minLength: 3 },
                ],
              },
              { type: 'number' },
            ],
          },
        },
      }
      const form = createHeadlessForm(schema)

      // Should pass because it matches the second anyOf (number)
      const result1 = form.handleValidation({
        nested: 123,
      })

      // Should fail because it matches neither:
      // 1. First anyOf: fails one allOf condition (too short)
      // 2. Second anyOf: fails because it is not a number
      const result2 = form.handleValidation({
        nested: 'ab',
      })

      expect(result1.formErrors).toBe(undefined)
      expect(result2.formErrors).toMatchObject({
        nested: 'The option "ab" is not valid.',
      })
    })

    it('shows conditional validation error messages', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          is_full_time: {
            type: 'string',
            oneOf: [{ const: 'yes' }, { const: 'no' }],
          },
          hours: {
            type: 'number',
          },
        },
        allOf: [
          {
            if: {
              properties: {
                is_full_time: { const: 'yes' },
              },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                hours: {
                  minimum: 40,
                },
              },
            },
            else: {
              properties: {
                hours: {
                  minimum: 10,
                },
              },
            },
          },
        ],
      }
      const form = createHeadlessForm(schema)

      // Test full-time validation
      const result1 = form.handleValidation({
        is_full_time: 'yes',
        hours: 5,
      })

      expect(result1.formErrors).toMatchObject({
        hours: 'Must be greater or equal to 40',
      })

      // Test part-time validation
      const result2 = form.handleValidation({
        is_full_time: 'no',
        hours: 5,
      })

      expect(result2.formErrors).toMatchObject({
        hours: 'Must be greater or equal to 10',
      })
    })

    it('shows conditional validation error messages when only one of the then branch is present', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          num: { type: 'number' },
          big: { type: 'string', enum: ['yes', 'no'] },
        },
        if: {
          properties: {
            big: { const: 'yes' },
          },
        },
        then: {
          properties: {
            num: { minimum: 10 },
          },
        },
      }
      const form = createHeadlessForm(schema)

      expect(form.handleValidation({
        num: 5,
        big: 'yes',
      }).formErrors).toMatchObject({
        num: 'Must be greater or equal to 10',
      })

      expect(form.handleValidation({
        num: 5,
        big: 'no',
      }).formErrors).toBeUndefined()
    })

    it('shows conditional validation error messages when only one of the else branch is present', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          num: { type: 'number' },
          big: { type: 'string', enum: ['yes', 'no'] },
        },
        if: {
          properties: {
            big: { const: 'yes' },
          },
        },
        else: {
          properties: {
            num: { minimum: 10 },
          },
        },
      }
      const form = createHeadlessForm(schema)

      expect(form.handleValidation({
        num: 5,
        big: 'no',
      }).formErrors).toMatchObject({
        num: 'Must be greater or equal to 10',
      })
    })
  })
})
