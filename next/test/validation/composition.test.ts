import type { JsfSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'

describe('schema composition validators', () => {
  describe('validateAllOf', () => {
    describe('basic validation', () => {
      const schema: JsfSchema = {
        allOf: [
          {
            properties: {
              bar: { type: 'integer' },
            },
            required: ['bar'],
          },
          {
            properties: {
              foo: { type: 'string' },
            },
            required: ['foo'],
          },
        ],
      }

      it('should validate when all subschemas are satisfied', () => {
        const value = { foo: 'baz', bar: 2 }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when missing required property from first schema', () => {
        const value = { foo: 'baz' }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['allOf', 0, 'bar'])
      })

      it('should fail when missing required property from second schema', () => {
        const value = { bar: 2 }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['allOf', 1, 'foo'])
      })

      it('should fail when property has wrong type', () => {
        const value = { foo: 'baz', bar: 'quux' }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('type')
        expect(errors[0].path).toEqual(['allOf', 0, 'bar'])
      })
    })

    describe('with base schema', () => {
      const schema: JsfSchema = {
        properties: { bar: { type: 'integer' } },
        required: ['bar'],
        allOf: [
          {
            properties: {
              foo: { type: 'string' },
            },
            required: ['foo'],
          },
          {
            properties: {
              baz: { type: 'null' },
            },
            required: ['baz'],
          },
        ],
      }

      it('should validate when all conditions are met', () => {
        const value = { foo: 'quux', bar: 2, baz: null }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when base schema is not satisfied', () => {
        const value = { foo: 'quux', baz: null }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['bar'])
      })
    })

    describe('with boolean schemas', () => {
      it('should validate when all schemas are true', () => {
        const schema: JsfSchema = {
          allOf: [true, true],
        }
        const errors = validateSchema('foo', schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when any schema is false', () => {
        const schema: JsfSchema = {
          allOf: [true, false],
        }
        const errors = validateSchema('foo', schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('valid')
      })

      it('should fail when all schemas are false', () => {
        const schema: JsfSchema = {
          allOf: [false, false],
        }
        const errors = validateSchema('foo', schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('valid')
      })
    })
  })

  describe('validateAnyOf', () => {
    describe('basic validation', () => {
      const schema: JsfSchema = {
        anyOf: [
          {
            type: 'string',
            maxLength: 5,
          },
          {
            type: 'number',
            minimum: 0,
          },
        ],
      }

      it('should validate when value matches first schema', () => {
        const value = 'short'
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should validate when value matches second schema', () => {
        const value = 12
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when value matches no schema', () => {
        const value = 'too long'
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('anyOf')
      })
    })

    describe('with base schema', () => {
      const schema: JsfSchema = {
        type: 'object',
        required: ['type'],
        anyOf: [
          {
            properties: {
              type: { const: 'string' },
              value: { type: 'string' },
            },
            required: ['value'],
          },
          {
            properties: {
              type: { const: 'number' },
              value: { type: 'number' },
            },
            required: ['value'],
          },
        ],
      }

      it('should validate when base schema and one subschema match', () => {
        const value = { type: 'string', value: 'test' }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when base schema fails', () => {
        const value = { value: 'test' }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['type'])
      })
    })

    describe('with empty schema', () => {
      const schema: JsfSchema = {
        anyOf: [{ type: 'number' }, {}],
      }

      it('should validate string against empty schema', () => {
        const value = 'foo'
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should validate number against both schemas', () => {
        const value = 123
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })
    })

    describe('nested anyOf', () => {
      const schema: JsfSchema = {
        anyOf: [
          {
            anyOf: [{ type: 'null' }],
          },
        ],
      }

      it('should validate null', () => {
        const errors = validateSchema(null, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail for non-null values', () => {
        const errors = validateSchema(123, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('anyOf')
      })
    })
  })

  describe('validateOneOf', () => {
    describe('basic validation', () => {
      const schema: JsfSchema = {
        oneOf: [
          {
            type: 'number',
            multipleOf: 5,
          },
          {
            type: 'number',
            multipleOf: 3,
          },
        ],
      }

      it('should validate when value matches exactly one schema', () => {
        const value = 10 // multiple of 5 only
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when value matches no schema', () => {
        const value = 7
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('oneOf')
      })

      it('should fail when value matches multiple schemas', () => {
        const value = 15 // multiple of both 3 and 5
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('oneOf')
      })
    })

    describe('with base schema', () => {
      const schema: JsfSchema = {
        type: 'object',
        required: ['type'],
        oneOf: [
          {
            properties: {
              type: { const: 'circle' },
              radius: { type: 'number' },
            },
            required: ['radius'],
          },
          {
            properties: {
              type: { const: 'rectangle' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['width', 'height'],
          },
        ],
      }

      it('should validate when base schema and exactly one subschema match', () => {
        const value = { type: 'circle', radius: 5 }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when base schema fails', () => {
        const value = { radius: 5 }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['type'])
      })
    })

    describe('with empty schema', () => {
      const schema: JsfSchema = {
        oneOf: [{ type: 'number' }, {}],
      }

      it('should validate when only empty schema matches', () => {
        const value = 'foo'
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when both schemas match', () => {
        const value = 123
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('oneOf')
      })
    })

    describe('with required properties', () => {
      const schema: JsfSchema = {
        type: 'object',
        oneOf: [{ required: ['foo', 'bar'] }, { required: ['foo', 'baz'] }],
      }

      it('should validate when exactly one set of required properties is present', () => {
        const errors = validateSchema({ foo: 1, bar: 2 }, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when both sets of required properties are present', () => {
        const errors = validateSchema({ foo: 1, bar: 2, baz: 3 }, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('oneOf')
      })

      it('should fail when no set of required properties is complete', () => {
        const errors = validateSchema({ bar: 2 }, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('oneOf')
      })
    })
  })

  describe('validateNot', () => {
    describe('basic validation', () => {
      const schema: JsfSchema = {
        not: {
          type: 'string',
        },
      }

      it('should validate when value does not match the schema', () => {
        const value = 42
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail when value matches the schema', () => {
        const value = 'test'
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('not')
      })
    })

    describe('with base schema', () => {
      const schema: JsfSchema = {
        type: 'object',
        required: ['type'],
        not: {
          properties: {
            type: { const: 'invalid' },
          },
        },
      }

      it('should fail when base schema fails', () => {
        const value = { other: 'field' }
        const errors = validateSchema(value, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('required')
        expect(errors[0].path).toEqual(['type'])
      })
    })

    describe('with multiple types', () => {
      const schema: JsfSchema = {
        not: { type: ['integer', 'string'] },
      }

      it('should validate non-matching type', () => {
        const errors = validateSchema(null, schema)
        expect(errors).toHaveLength(0)
      })

      it('should fail for integer', () => {
        const errors = validateSchema(1, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('not')
      })

      it('should fail for string', () => {
        const errors = validateSchema('test', schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('not')
      })
    })

    describe('with boolean schemas', () => {
      it('should always fail with true schema', () => {
        const schema: JsfSchema = { not: {} }
        const errors = validateSchema('test', schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('not')
      })

      it('should always pass with false schema', () => {
        const schema: JsfSchema = { not: { not: {} } }
        const errors = validateSchema('test', schema)
        expect(errors).toHaveLength(0)
      })
    })

    describe('double negation', () => {
      const schema: JsfSchema = {
        not: { not: {} },
      }

      it('should validate any value', () => {
        const errors = validateSchema('foo', schema)
        expect(errors).toHaveLength(0)
      })
    })
  })
})
