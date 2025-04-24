import type { JsfSchema, JsonLogicContext, NonBooleanJsfSchema } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import jsonLogic from 'json-logic-js'
import * as JsonLogicValidation from '../../src/validation/json-logic'
import * as SchemaValidation from '../../src/validation/schema'

const validateJsonLogic = JsonLogicValidation.validateJsonLogic

// Mock json-logic-js
jest.mock('json-logic-js', () => ({
  apply: jest.fn(),
}))

describe('validateJsonLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(JsonLogicValidation, 'validateJsonLogic')
  })

  it('returns empty array when no validations exist', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'object',
      properties: {},
    }

    const result = validateJsonLogic(schema, undefined)
    expect(result).toEqual([])
  })

  it('returns empty array when validations is empty array', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': [],
    }

    const result = validateJsonLogic(schema, undefined)
    expect(result).toEqual([])
  })

  it('returns empty array when validation data is not found', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': ['someValidation'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {},
      },
      value: {},
    }

    const result = validateJsonLogic(schema, jsonLogicContext)
    expect(result).toEqual([])
  })

  it('returns validation error when rule evaluates to false', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': ['ageCheck'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {
          ageCheck: {
            rule: { '>': [{ var: 'age' }, 18] },
            errorMessage: 'Must be over 18',
          },
        },
      },
      value: { age: 16 },
    };

    // Mock the jsonLogic.apply to return false (false is the return value for invalid logic)
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)

    const result = validateJsonLogic(schema, jsonLogicContext)

    expect(result).toEqual([
      {
        path: [],
        validation: 'json-logic',
        customErrorMessage: 'Must be over 18',
      },
    ])

    expect(jsonLogic.apply).toHaveBeenCalledWith(
      { '>': [{ var: 'age' }, 18] },
      { age: 16 },
    )
  })

  it('returns empty array when rule evaluates to true', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': ['ageCheck'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {
          ageCheck: {
            rule: { '>': [{ var: 'age' }, 18] },
            errorMessage: 'Must be over 18',
          },
        },
      },
      value: { age: 20 },
    }

    // Mock the jsonLogic.apply to return true
    ;(jsonLogic.apply as jest.Mock).mockReturnValue(true)

    const result = validateJsonLogic(schema, jsonLogicContext)
    expect(result).toEqual([])
  })

  it('handles undefined and null values by converting them to NaN', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': ['check'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {
          check: {
            rule: { '==': [{ var: 'field' }, null] },
            errorMessage: 'Error',
          },
        },
      },
      value: { field: undefined },
    }

    ;(jsonLogic.apply as jest.Mock).mockReturnValue(true)

    validateJsonLogic(schema, jsonLogicContext)

    expect(jsonLogic.apply).toHaveBeenCalledWith(
      { '==': [{ var: 'field' }, null] },
      { field: Number.NaN },
    )
  })

  it('handles multiple validations', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': ['check1', 'check2'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {
          check1: {
            rule: { '>': [{ var: 'age' }, 18] },
            errorMessage: 'Must be over 18',
          },
          check2: {
            rule: { '<': [{ var: 'age' }, 100] },
            errorMessage: 'Must be under 100',
          },
        },
      },
      value: { age: 16 },
    };

    // First validation fails, second passes
    (jsonLogic.apply as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)

    const result = validateJsonLogic(schema, jsonLogicContext)

    expect(result).toEqual([
      {
        path: [],
        validation: 'json-logic',
        customErrorMessage: 'Must be over 18',
      },
    ])

    expect(jsonLogic.apply).toHaveBeenCalledTimes(2)
  })

  describe('validateSchema integration with "x-jsf-logic"', () => {
    const validateSchema = SchemaValidation.validateSchema

    it('calls validateJsonLogic with correct context', () => {
      const schema: JsfSchema = {
        'properties': {
          num_guests: {
            title: 'Number of guests to invite',
            type: 'number',
          },
          amount_of_snacks_to_bring: {
            'title': 'Number of snacks to bring',
            'type': 'number',
            'x-jsf-logic-validations': [
              'more_snacks_than_guests',
            ],
          },
        },
        'required': [
          'num_guests',
        ],
        'x-jsf-logic': {
          validations: {
            more_snacks_than_guests: {
              errorMessage: 'Consider bringing extra snacks so theres something for everyone.',
              rule: {
                '>=': [
                  {
                    var: 3,
                  },
                  {
                    var: 2,
                  },
                ],
              },
            },
          },
        },
      }

      validateSchema({ num_guests: 4, amount_of_snacks_to_bring: 3 }, schema)

      expect(JsonLogicValidation.validateJsonLogic).toHaveBeenCalledWith(schema, {
        schema: {
          validations: schema['x-jsf-logic']?.validations,
        },
        value: { num_guests: 4, amount_of_snacks_to_bring: 3 },
      }, [])
    })

    it('should call json logic\'s apply function fn when "x-jsf-logic-validations" are present for a field', () => {
      const schema: JsfSchema = {
        'properties': {
          num_guests: {
            title: 'Number of guests to invite',
            type: 'number',
          },
          amount_of_snacks_to_bring: {
            'title': 'Number of snacks to bring',
            'type': 'number',
            'x-jsf-logic-validations': [
              'more_snacks_than_guests',
            ],
          },
        },
        'required': [
          'num_guests',
        ],
        'x-jsf-logic': {
          validations: {
            more_snacks_than_guests: {
              errorMessage: 'Consider bringing extra snacks so theres something for everyone.',
              rule: {
                '>=': [
                  {
                    var: 3,
                  },
                  {
                    var: 2,
                  },
                ],
              },
            },
          },
        },
      };

      // Mock the jsonLogic.apply to return false (false is the return value for invalid logic)
      (jsonLogic.apply as jest.Mock).mockReturnValue(false)

      let errors = validateSchema({ num_guests: 4, amount_of_snacks_to_bring: 3 }, schema)
      expect(errors).toHaveLength(1)
      expect(errors[0].validation).toBe('json-logic');

      (jsonLogic.apply as jest.Mock).mockReturnValue(true)
      errors = validateSchema({ num_guests: 4, amount_of_snacks_to_bring: 10 }, schema)
      expect(errors).toHaveLength(0)

      expect(jsonLogic.apply).toHaveBeenCalledTimes(2)
    })

    it('should not call json logic\'s apply function when "x-jsf-logic-validations" are not present or when they reference an invalid rule', () => {
      const schema: JsfSchema = {
        'properties': {
          num_guests: {
            title: 'Number of guests to invite',
            type: 'number',
          },
          amount_of_snacks_to_bring: {
            'title': 'Number of snacks to bring',
            'type': 'number',
            'x-jsf-logic-validations': [
              'invalid-rule',
            ],
          },
        },
        'required': [
          'num_guests',
        ],
        'x-jsf-logic': {
          validations: { },
        },
      }

      const errors = validateSchema({ num_guests: 4, amount_of_snacks_to_bring: 3 }, schema)
      expect(errors).toHaveLength(0)
      expect(jsonLogic.apply).not.toHaveBeenCalled()
    })

    it('should validate conditions inside "x-jsf-logic", when present', () => {
      // jest.spyOn(jsonLogiValidation, 'validateJsonLogic')
      // jest.spyOn(jsonLogic, 'apply')

      const innerSchema: JsfSchema = {
        if: { properties: { foo: { const: 'test' } }, required: ['foo'] },
        then: { properties: { bar: { const: 1 } }, required: ['bar'] },
      }

      const schema: JsfSchema = {
        'properties': {
          foo: { type: 'string' },
          bar: { type: 'number' },
        },
        'x-jsf-logic': innerSchema,
      }

      // if/then/allOf/etc should be applied even if inside the x-jsf-logic schema node
      let errors = validateSchema({ foo: 'test', bar: 0 }, schema)
      expect(errors).toHaveLength(1)
      expect(errors[0].validation).toBe('const')

      errors = validateSchema({ foo: 'test', bar: 1 }, schema)
      expect(errors).toHaveLength(0)

      // json-logic validation should not have been called as there are no json-logic rules present in the schema
      expect(jsonLogic.apply).not.toHaveBeenCalled()
    })
  })
})
