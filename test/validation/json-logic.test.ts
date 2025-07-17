import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import jsonLogic from 'json-logic-js'
import * as JsonLogicValidation from '../../src/validation/json-logic'
import * as SchemaValidation from '../../src/validation/schema'
import { errorLike } from '../test-utils'

const validateJsonLogicRules = JsonLogicValidation.validateJsonLogicRules

// Mock json-logic-js
jest.mock('json-logic-js', () => ({
  apply: jest.fn(),
}))

describe('validateJsonLogicRules', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(JsonLogicValidation, 'validateJsonLogicRules')
  })

  it('returns empty array when no validations exist', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'object',
      properties: {},
    }

    const result = validateJsonLogicRules(schema, undefined)
    expect(result).toEqual([])
  })

  it('returns empty array when validations is empty array', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {},
      'x-jsf-logic-validations': [],
    }

    const result = validateJsonLogicRules(schema, undefined)
    expect(result).toEqual([])
  })

  it('returns empty array when validation data is not found', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'title': 'foo',
      'properties': {},
      'x-jsf-logic-validations': ['someValidation'],
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        validations: {},
      },
      value: {},
    }

    expect(() => validateJsonLogicRules(schema, jsonLogicContext)).toThrow(
      `[json-schema-form] json-logic error: "foo" required validation "someValidation" doesn't exist.`,
    )
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

    const result = validateJsonLogicRules(schema, jsonLogicContext)

    expect(result).toEqual([
      errorLike({
        path: [],
        validation: 'json-logic',
        customErrorMessage: 'Must be over 18',
      }),
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

    const result = validateJsonLogicRules(schema, jsonLogicContext)
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

    validateJsonLogicRules(schema, jsonLogicContext)

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

    const result = validateJsonLogicRules(schema, jsonLogicContext)

    expect(result).toEqual([
      errorLike({
        path: [],
        validation: 'json-logic',
        customErrorMessage: 'Must be over 18',
      }),
    ])

    expect(jsonLogic.apply).toHaveBeenCalledTimes(2)
  })

  describe('validateSchema integration with "x-jsf-logic"', () => {
    const validateSchema = SchemaValidation.validateSchema

    it('calls validateJsonLogicRules with correct context', () => {
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

      expect(JsonLogicValidation.validateJsonLogicRules).toHaveBeenCalledWith(schema, {
        schema: {
          validations: schema['x-jsf-logic']?.validations,
        },
        value: { num_guests: 4, amount_of_snacks_to_bring: 3 },
      }, [])
    })

    it('should call json logic\'s apply function when "x-jsf-logic-validations" are present for a field', () => {
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

      expect(() => validateSchema({ num_guests: 4, amount_of_snacks_to_bring: 3 }, schema)).toThrow(
        `[json-schema-form] json-logic error: "Number of snacks to bring" required validation "invalid-rule" doesn't exist.`,
      )
      expect(jsonLogic.apply).not.toHaveBeenCalled()
    })

    it('should validate conditions inside "x-jsf-logic", when present', () => {
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

describe('applyComputedAttrsToSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns original schema when no computed values exist', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    }

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, {})
    expect(result).toEqual(schema)
  })

  it('applies computed values to schema properties', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        person: {
          type: 'object',
          properties: {
            age: {
              'type': 'number',
              'x-jsf-logic-computedAttrs': {
                minimum: 'computedMin',
              },
            },
          },
        },
      },
      'x-jsf-logic': {
        computedValues: {
          computedMin: {
            rule: { '==': [{ var: 'person.age' }, 21] },
          },
        },
      },
    };

    (jsonLogic.apply as jest.Mock).mockReturnValue(21)

    const initialSchema = JSON.parse(JSON.stringify(schema))

    const result: JsfObjectSchema = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { person: { age: 21 } })

    expect(result).not.toEqual(initialSchema)
    const ageProperties = result.properties?.person?.properties?.age as JsfObjectSchema
    expect(ageProperties?.minimum).toBe(21)
    expect(ageProperties?.['x-jsf-logic-computedAttrs']).toBeUndefined()
  })

  it('handles handlebars template strings in computed values', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        age: {
          'type': 'number',
          'x-jsf-logic-computedAttrs': {
            description: 'Minimum allowed is {{computedMin}}',
          },
        },
      },
      'x-jsf-logic': {
        computedValues: {
          computedMin: {
            rule: { '+': [19, 2] },
          },
        },
      },
    };

    (jsonLogic.apply as jest.Mock).mockReturnValue(21)

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { age: 30 })

    const ageProperties = result.properties?.age as JsfObjectSchema

    expect(ageProperties?.description).toBe('Minimum allowed is 21')
  })

  it('handles object-type computed attributes', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        age: {
          'type': 'number',
          'x-jsf-logic-computedAttrs': {
            'minimum': 'computedMin',
            'x-jsf-errorMessage': {
              minimum: 'This is a custom message {{computedMin}}',
            },
          },
        },
      },
      'x-jsf-logic': {
        computedValues: {
          computedMin: {
            rule: { '+': [{ var: 'age' }, 2] },
          },
        },
      },
    };

    (jsonLogic.apply as jest.Mock).mockReturnValue(21)

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { age: 19 })

    const ageProperties = result.properties?.age as JsfObjectSchema
    expect(ageProperties?.minimum).toBe(21)
  })

  it('allows to use computed values inside conditional statements', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        pine_trees: {
          title: 'Pine trees planted',
          type: 'number',
          description: 'The number of pine trees you have planted.',
        },
        oak_trees: {
          type: 'number',
          title: 'Oak trees planted',
          description: 'Enter the number of oak trees you\'ve planted. If there are more pine trees than oak trees, you\'ll need to plant spruce trees as well. But this only counts if less than 10 pines planted.',
        },
        spruce_trees: {
          title: 'Spruce trees planted',
          type: 'number',
          description: 'The number of spruce trees you have planted (only required if specific conditions are met).',
        },
      },
      'allOf': [
        {
          if: {
            properties: {
              oak_trees: {
                'x-jsf-logic-computedAttrs': {
                  minimum: 'pine_value',
                },
              },
            },
          },
          then: {
            required: [
              'spruce_trees',
            ],
          },
          else: {
            properties: {
              spruce_trees: false,
            },
          },
        },
      ],
      'required': [
        'pine_trees',
        'oak_trees',
      ],
      'x-jsf-logic': {
        computedValues: {
          pine_value: {
            rule: {
              '+': [
                {
                  var: 'pine_trees',
                },
                1,
              ],
            },
          },
        },
      },
    };

    // Mock the jsonLogic.apply to return 10
    (jsonLogic.apply as jest.Mock).mockReturnValue(10)

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { pine_trees: 10, oak_trees: 2 })

    const conditionValue = result.allOf?.[0].if?.properties?.oak_trees as JsfObjectSchema
    expect(conditionValue['x-jsf-logic-computedAttrs']).toBeUndefined()
    expect(conditionValue.minimum).toBe(10)
  })
})
