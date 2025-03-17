import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'

describe('treatNullAsUndefined', () => {
  it('returns no error when an undefined value is validated against a non-required field', () => {
    const schema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    }

    expect(validateSchema({ }, schema)).toEqual([])
  })

  describe('treatNullAsUndefined: false', () => {
    it('returns an error when a null value is validated against a non-required field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      }

      expect(validateSchema({ name: null }, schema)).toEqual([
        {
          path: ['name'],
          validation: 'type',
        },
      ])
    })
  })

  describe('treatNullAsUndefined: true', () => {
    it('returns no error when a null value is validated against a non-required field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
      }

      expect(validateSchema({ name: null }, schema, { treatNullAsUndefined: true })).toEqual([])
    })

    it('returns no error when a null value is validated against a nested non-required field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'object',
            properties: {
              firstName: {
                anyOf: [
                  { type: 'string' },
                  { type: 'integer' },
                ],
              },
            },
          },
        },
      }

      expect(validateSchema({ name: { firstName: null } }, schema, { treatNullAsUndefined: true })).toEqual([])
    })

    it('returns an error when a null value is validated against a required field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
        },
        required: ['name'],
      }

      expect(validateSchema({ name: null }, schema, { treatNullAsUndefined: true })).toEqual([
        {
          path: ['name'],
          validation: 'required',
        },
      ])
    })

    it('returns an error when a null value is validated against a required field with a null field', () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'null',
          },
        },
        required: ['name'],
      }

      expect(validateSchema({ name: null }, schema, { treatNullAsUndefined: true })).toEqual([
        {
          path: ['name'],
          validation: 'required',
        },
      ])
    })
  })
})
