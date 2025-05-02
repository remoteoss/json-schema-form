import type { JsfSchema, JsonLogicContext, NonBooleanJsfSchema } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import jsonLogic from 'json-logic-js'
import * as JsonLogicValidation from '../../src/validation/json-logic'
import * as SchemaValidation from '../../src/validation/schema'
import { validateSchema } from '../../src/validation/schema'
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

describe('validateJsonLogicComputedAttributes', () => {
  const validateJsonLogicComputedAttributes = JsonLogicValidation.validateJsonLogicComputedAttributes

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty array when no computed attributes exist', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'object',
      properties: {},
    }

    const result = validateJsonLogicComputedAttributes({}, schema, {}, undefined, [])
    expect(result).toEqual([])
  })

  it('ignores computed attributes when computation name does not reference a valid rule', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'object',
      'properties': {
        age: { type: 'number' },
      },
      'x-jsf-logic-computedAttrs': {
        minimum: 'nonexistentRule',
      },
    }

    const jsonLogicContext: JsonLogicContext = { schema: { computedValues: {} }, value: { age: 16 } }
    expect(() => validateJsonLogicComputedAttributes({ age: 16 }, schema, {}, jsonLogicContext, [])).toThrow(
      `[json-schema-form] json-logic error: Computed value "nonexistentRule" has missing rule.`,
    )

    expect(jsonLogic.apply).not.toHaveBeenCalled()
  })

  it('applies computed attribute when rule exists and updates schema validation', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'computeMinAge',
      },
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        computedValues: {
          computeMinAge: {
            rule: { '+': [{ var: 'baseAge' }, 5] },
          },
        },
      },
      value: { baseAge: 13 },
    };

    // Mock jsonLogic.apply to return 18 (13 + 5)
    (jsonLogic.apply as jest.Mock).mockReturnValue(18)

    // Test with value less than computed minimum
    let result = validateJsonLogicComputedAttributes(17, schema, {}, jsonLogicContext, [],
    )

    expect(result).toHaveLength(1)
    expect(result[0].validation).toBe('minimum')

    // Test with value equal to computed minimum
    result = validateJsonLogicComputedAttributes(18, schema, {}, jsonLogicContext, [])
    expect(result).toHaveLength(0)

    expect(jsonLogic.apply).toHaveBeenCalledWith({ '+': [{ var: 'baseAge' }, 5] }, { baseAge: 13 })
  })

  it('ignores undefined results from json logic computation', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'computeMinAge',
      },
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        computedValues: {
          computeMinAge: {
            rule: { var: 'nonexistentVar' },
          },
        },
      },
      value: { baseAge: 13 },
    };

    // Mock jsonLogic.apply to return undefined
    (jsonLogic.apply as jest.Mock).mockReturnValue(undefined)

    const result = validateJsonLogicComputedAttributes(17, schema, {}, jsonLogicContext, [])
    expect(result).toHaveLength(0)
    expect(jsonLogic.apply).toHaveBeenCalledWith({ var: 'nonexistentVar' }, { baseAge: 13 })
  })

  it('handles multiple computed attributes', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'computeMinAge',
        maximum: 'computeMaxAge',
      },
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        computedValues: {
          computeMinAge: {
            rule: { '+': [{ var: 'baseAge' }, 5] },
          },
          computeMaxAge: {
            rule: { '*': [{ var: 'baseAge' }, 2] },
          },
        },
      },
      value: { baseAge: 10 },
    };

    // Mock jsonLogic.apply to return 15 for min (10 + 5) and 20 for max (10 * 2)
    (jsonLogic.apply as jest.Mock)
      .mockReturnValueOnce(15) // minimum
      .mockReturnValueOnce(20) // maximum

    // Test with value within computed range
    let result = validateJsonLogicComputedAttributes(17, schema, {}, jsonLogicContext, [])
    expect(result).toHaveLength(0);

    (jsonLogic.apply as jest.Mock)
      .mockReturnValueOnce(15) // minimum
      .mockReturnValueOnce(20) // maximum

    // Test with value outside computed range
    result = validateJsonLogicComputedAttributes(21, schema, {}, jsonLogicContext, [])
    expect(result).toHaveLength(1)
    expect(result[0].validation).toBe('maximum')

    expect(jsonLogic.apply).toHaveBeenCalledTimes(4)
  })

  it('handles null and undefined values by converting them to NaN', () => {
    const schema: NonBooleanJsfSchema = {
      'type': 'number',
      'x-jsf-logic-computedAttrs': {
        minimum: 'computeMinAge',
      },
    }

    const jsonLogicContext: JsonLogicContext = {
      schema: {
        computedValues: {
          computeMinAge: {
            rule: { '+': [{ var: 'baseAge' }, 5] },
          },
        },
      },
      value: { baseAge: undefined },
    }

    validateJsonLogicComputedAttributes(17, schema, {}, jsonLogicContext, [])

    expect(jsonLogic.apply).toHaveBeenCalledWith({ '+': [{ var: 'baseAge' }, 5] }, { baseAge: Number.NaN })
  })

  describe('Computed "error message" attribute', () => {
    it('should interpolate computed attribute values in custom error messages', () => {
      const schema: NonBooleanJsfSchema = {
        'properties': {
          someProperty: {
            'type': 'number',
            'x-jsf-logic-computedAttrs': {
              'minimum': 'computeMinAge',
              'x-jsf-errorMessage': {
                minimum: 'Must be at least {{computeMinAge}} units',
              },
            },
          },
        },
        'x-jsf-logic': {
          computedValues: {
            computeMinAge: {
              rule: { '+': [{ var: 'someProperty' }, 5] },
            },
          },
        },
      };

      (jsonLogic.apply as jest.Mock).mockReturnValue(15)

      const result = validateSchema({ someProperty: 10 }, schema)
      expect(result).toHaveLength(1)
      expect(result[0].validation).toBe('minimum')
      expect(result[0].schema['x-jsf-errorMessage']?.minimum).toBe('Must be at least 15 units')
    })

    it('should use the variable name if the computed attribute is not found', () => {
      const schema: NonBooleanJsfSchema = {
        'properties': {
          someProperty: {
            'type': 'number',
            'x-jsf-logic-computedAttrs': {
              'minimum': 'computeMinAge',
              'x-jsf-errorMessage': {
                minimum: 'Must be at least {{invalidVar}} units',
              },
            },
          },
        },
        'x-jsf-logic': {
          computedValues: {
            computeMinAge: {
              rule: { '+': [{ var: 'someProperty' }, 5] },
            },
          },
        },
      };

      (jsonLogic.apply as jest.Mock).mockReturnValue(15)

      expect(() => validateSchema({ someProperty: 10 }, schema)).toThrow(
        `[json-schema-form] json-logic error: Computed value "invalidVar" doesn't exist`,
      )
    })
  })
})
