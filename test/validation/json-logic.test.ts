import type { JsfObjectSchema, JsfSchema, JsonLogicContext, NonBooleanJsfSchema } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import jsonLogic from 'json-logic-js'
import * as JsonLogicValidation from '../../src/validation/json-logic'
import * as SchemaValidation from '../../src/validation/schema'
import { errorLike } from '../test-utils'

const validateJsonLogicRules = JsonLogicValidation.validateJsonLogicRules
const validateSchema = SchemaValidation.validateSchema

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
    };

    // Mock the jsonLogic.apply to return true
    (jsonLogic.apply as jest.Mock).mockReturnValue(true)

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
    };

    (jsonLogic.apply as jest.Mock).mockReturnValue(true)

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

  it('applies computed values when the computed value is 0', () => {
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
            rule: { '*': [{ var: 'age' }, 2] },
          },
        },
      },
    };

    (jsonLogic.apply as jest.Mock).mockReturnValue(0)

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { age: 12 })

    const ageProperties = result.properties?.age as JsfObjectSchema

    expect(ageProperties?.description).toBe('Minimum allowed is 0')
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

  it('allows to use computed values inside oneOf statements nested in a property', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        maximum_temperature: {
          title: 'Maximum room temperature',
          type: 'number',
          description: 'What is the maximum room temperature in Celsius?',
        },
        temperature_setting: {
          title: 'Select a preset temperature',
          type: 'string',
          oneOf: [
            {
              title: 'Low',
              const: 18,
            },
            {
              title: 'Medium',
              const: 20,
            },
            {
              'title': 'Maximum',
              'x-jsf-logic-computedAttrs': {
                const: 'maximum_temperature',
              },
            },
          ],
        },
      },
      'required': [
        'maximum_temperature',
        'temperature_setting',
      ],
      'x-jsf-logic': {
        computedValues: {
          maximum_temperature: {
            rule: {
              var: 'maximum_temperature',
            },
          },
        },
      },
    };

    // Mock the jsonLogic.apply to return 24
    (jsonLogic.apply as jest.Mock).mockReturnValue(24)

    const result = JsonLogicValidation.applyComputedAttrsToSchema(schema, schema['x-jsf-logic']?.computedValues, { maximum_temperature: 24 })

    const temperatureSetting = result.properties?.temperature_setting as NonBooleanJsfSchema
    expect(temperatureSetting['x-jsf-logic-computedAttrs']).toBeUndefined()
    expect((temperatureSetting.oneOf?.[2] as NonBooleanJsfSchema)?.const).toBe(24)
  })
})

describe('Conditionals with validations and computedValues', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('when field_a > field_b, show field_c', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        validations: {
          require_c: {
            rule: {
              and: [{ '>': [{ var: 'field_a' }, { var: 'field_b' }] }],
            },
          },
        },
        allOf: [
          {
            if: {
              validations: {
                require_c: {
                  const: true,
                },
              },
            },
            then: {
              required: ['field_c'],
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    };

    // When field_a <= field_b, condition is false, field_c should not be required
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 1, field_b: 3 }, schema)
    expect(errors).toEqual([])

    // When field_a is missing, field_b should be required
    errors = validateSchema({ field_a: 1 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_b'))!.validation).toBe('required')

    // When field_b is undefined, it should be required
    errors = validateSchema({ field_a: 1, field_b: undefined }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_b'))!.validation).toBe('required');

    // When field_a > field_b, condition is true, field_c should be required
    (jsonLogic.apply as jest.Mock).mockReturnValue(true)
    errors = validateSchema({ field_a: 10, field_b: 3 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required')

    // When field_c is provided, no errors
    errors = validateSchema({ field_a: 10, field_b: 3, field_c: 0 }, schema)
    expect(errors).toEqual([])
  })

  it('A schema with both a `validations` and `properties` check', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        validations: {
          require_c: {
            rule: {
              and: [{ '>': [{ var: 'field_a' }, { var: 'field_b' }] }],
            },
          },
        },
        allOf: [
          {
            if: {
              validations: {
                require_c: {
                  const: true,
                },
              },
              properties: {
                field_a: {
                  const: 10,
                },
              },
            },
            then: {
              required: ['field_c'],
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    };

    // When condition is false (field_a <= field_b or field_a !== 10)
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 1, field_b: 3 }, schema)
    expect(errors).toEqual([]);

    // When condition is true (field_a > field_b AND field_a === 10)
    (jsonLogic.apply as jest.Mock).mockReturnValue(true)
    errors = validateSchema({ field_a: 10, field_b: 3 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required')

    // When field_a is 5, condition should be false
    errors = validateSchema({ field_a: 5, field_b: 3 }, schema)
    expect(errors).toEqual([])
  })

  it('Conditionally apply a validation on a property depending on values', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        validations: {
          require_c: {
            rule: {
              and: [{ '>': [{ var: 'field_a' }, { var: 'field_b' }] }],
            },
          },
          c_must_be_large: {
            errorMessage: 'Needs more numbers',
            rule: {
              '>': [{ var: 'field_c' }, 200],
            },
          },
        },
        allOf: [
          {
            if: {
              validations: {
                require_c: {
                  const: true,
                },
              },
            },
            then: {
              required: ['field_c'],
              properties: {
                field_c: {
                  'description': 'I am a description!',
                  'x-jsf-logic-validations': ['c_must_be_large'],
                },
              },
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    };

    // When condition is false, field_c should not be visible/required
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 5, field_b: 10 }, schema)
    expect(errors).toEqual([]);

    // When condition is true, field_c should be required
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true)
    errors = validateSchema({ field_a: 10, field_b: 5 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required');

    // When field_c is 0, it should fail the c_must_be_large validation
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false)
    errors = validateSchema({ field_a: 10, field_b: 5, field_c: 0 }, schema)
    expect(errors.length).toBe(1)
    const cError = errors.find(e => e.path.includes('field_c'))
    expect(cError!.validation).toBe('json-logic')
    expect(cError!.customErrorMessage).toBe('Needs more numbers');

    // When field_c is 201, it should pass
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(true)
    errors = validateSchema({ field_a: 10, field_b: 5, field_c: 201 }, schema)
    expect(errors).toEqual([])
  })

  it('Should apply a conditional based on a true computedValue', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        computedValues: {
          require_c: {
            rule: {
              and: [{ '>': [{ var: 'field_a' }, { var: 'field_b' }] }],
            },
          },
        },
        allOf: [
          {
            if: {
              computedValues: {
                require_c: {
                  const: true,
                },
              },
            },
            then: {
              required: ['field_c'],
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    };

    // When condition is false (computed value is not true)
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 5, field_b: 10 }, schema)
    expect(errors).toEqual([]);

    // When condition is true (computed value is true), field_c should be required
    (jsonLogic.apply as jest.Mock).mockReturnValue(true)
    errors = validateSchema({ field_a: 10, field_b: 5 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required')

    // When field_c is provided, no errors
    errors = validateSchema({ field_a: 10, field_b: 5, field_c: 201 }, schema)
    expect(errors).toEqual([])
  })

  it('Handle multiple computedValue checks by ANDing them together', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        validations: {
          double_b: {
            errorMessage: 'Must be two times B',
            rule: {
              '>': [{ var: 'field_c' }, { '*': [{ var: 'field_b' }, 2] }],
            },
          },
        },
        computedValues: {
          a_times_two: {
            rule: {
              '*': [{ var: 'field_a' }, 2],
            },
          },
          mod_by_five: {
            rule: {
              '%': [{ var: 'field_b' }, 5],
            },
          },
        },
        allOf: [
          {
            if: {
              computedValues: {
                a_times_two: {
                  const: 20,
                },
                mod_by_five: {
                  const: 3,
                },
              },
            },
            then: {
              required: ['field_c'],
              properties: {
                field_c: {
                  'x-jsf-logic-validations': ['double_b'],
                  'title': 'Adding a title.',
                },
              },
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    }

    // When required fields are missing
    let errors = validateSchema({}, schema)
    expect(errors.length).toBe(2)
    expect(errors.find(e => e.path.includes('field_a'))!.validation).toBe('required')
    expect(errors.find(e => e.path.includes('field_b'))!.validation).toBe('required');

    // When computed values don't match (a_times_two === 20 AND mod_by_five !== 3)
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(20).mockReturnValueOnce(2)
    errors = validateSchema({ field_a: 10, field_b: 8 }, schema)
    // Condition should be false, so field_c should not be required
    expect(errors).toEqual([]);

    // When computed values match, field_c should be required
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(20).mockReturnValueOnce(3)
    errors = validateSchema({ field_a: 10, field_b: 8 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required');

    // When field_c is 0, it should fail the double_b validation
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(20).mockReturnValueOnce(3).mockReturnValueOnce(false) // double_b validation fails
    errors = validateSchema({ field_a: 10, field_b: 8, field_c: 0 }, schema)
    expect(errors.length).toBe(1)
    const cError = errors.find(e => e.path.includes('field_c'))
    expect(cError!.validation).toBe('json-logic')
    expect(cError!.customErrorMessage).toBe('Must be two times B');

    // When field_c is 17, it should pass
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(20).mockReturnValueOnce(3).mockReturnValueOnce(true) // double_b validation passes
    errors = validateSchema({ field_a: 10, field_b: 8, field_c: 17 }, schema)
    expect(errors).toEqual([])
  })

  it('Handle having a true condition with both validations and computedValue checks', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      'required': ['field_a', 'field_b'],
      'x-jsf-logic': {
        validations: {
          greater_than_b: {
            rule: {
              '>': [{ var: 'field_a' }, { var: 'field_b' }],
            },
          },
        },
        computedValues: {
          a_times_two: {
            rule: {
              '*': [{ var: 'field_a' }, 2],
            },
          },
        },
        allOf: [
          {
            if: {
              computedValues: {
                a_times_two: {
                  const: 20,
                },
              },
              validations: {
                greater_than_b: {
                  const: true,
                },
              },
            },
            then: {
              required: ['field_c'],
            },
            else: {
              properties: {
                field_c: false,
              },
            },
          },
        ],
      },
    };

    // When condition is false (a_times_two !== 20 or greater_than_b !== true)
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 1, field_b: 1 }, schema)
    expect(errors).toEqual([]);

    // When field_a > field_b but a_times_two !== 20
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(18) // a_times_two = 18
    errors = validateSchema({ field_a: 10, field_b: 20 }, schema)
    expect(errors).toEqual([]);

    // When both conditions are true, field_c should be required
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(20) // a_times_two = 20
    errors = validateSchema({ field_a: 10, field_b: 9 }, schema)
    expect(errors.length).toBe(1)
    expect(errors.find(e => e.path.includes('field_c'))!.validation).toBe('required');

    // When field_c is provided, no errors
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(20)
    errors = validateSchema({ field_a: 10, field_b: 9, field_c: 10 }, schema)
    expect(errors).toEqual([])
  })

  it('Apply validations and computed values on normal if statement', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
      },
      'x-jsf-logic': {
        computedValues: {
          a_plus_ten: {
            rule: {
              '+': [{ var: 'field_a' }, 10],
            },
          },
        },
        validations: {
          greater_than_a_plus_ten: {
            errorMessage: 'Must be greater than Field A + 10',
            rule: {
              '>': [{ var: 'field_b' }, { '+': [{ var: 'field_a' }, 10] }],
            },
          },
        },
      },
      'allOf': [
        {
          if: {
            properties: {
              field_a: {
                const: 20,
              },
            },
          },
          then: {
            properties: {
              field_b: {
                'x-jsf-logic-computedAttrs': {
                  title: 'Must be greater than {{a_plus_ten}}.',
                },
                'x-jsf-logic-validations': ['greater_than_a_plus_ten'],
              },
            },
          },
        },
      ],
    }

    // When field_a !== 20, condition is false, no validation should be applied
    let errors = validateSchema({ field_a: 10, field_b: 0 }, schema)
    expect(errors).toEqual([]);

    // When field_a === 20, condition is true, validation should be applied
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(false) // greater_than_a_plus_ten validation fails
    errors = validateSchema({ field_a: 20, field_b: 0 }, schema)
    expect(errors.length).toBe(1)
    const bError = errors.find(e => e.path.includes('field_b'))
    expect(bError!.validation).toBe('json-logic')
    expect(bError!.customErrorMessage).toBe('Must be greater than Field A + 10');

    // When field_b > field_a + 10, validation should pass
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true) // greater_than_a_plus_ten validation passes
    errors = validateSchema({ field_a: 20, field_b: 31 }, schema)
    expect(errors).toEqual([])
  })

  it('When we have a required validation on a top level property and another validation is added, both should be accounted for', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'required': ['field_a', 'field_b'],
      'properties': {
        field_a: {
          type: 'number',
        },
        field_b: {
          'type': 'number',
          'x-jsf-logic-validations': ['greater_than_field_a'],
        },
      },
      'x-jsf-logic': {
        validations: {
          greater_than_field_a: {
            errorMessage: 'Must be greater than A',
            rule: {
              '>': [{ var: 'field_b' }, { var: 'field_a' }],
            },
          },
          greater_than_two_times_a: {
            errorMessage: 'Must be greater than two times A',
            rule: {
              '>': [{ var: 'field_b' }, { '*': [{ var: 'field_a' }, 2] }],
            },
          },
        },
      },
      'allOf': [
        {
          if: {
            properties: {
              field_a: {
                const: 20,
              },
            },
          },
          then: {
            properties: {
              field_b: {
                'x-jsf-logic-validations': ['greater_than_two_times_a'],
              },
            },
          },
        },
      ],
    };

    // When field_a === 10, only greater_than_field_a validation should apply
    (jsonLogic.apply as jest.Mock).mockReturnValue(false)
    let errors = validateSchema({ field_a: 10, field_b: 0 }, schema)
    expect(errors.length).toBe(1)
    const bError = errors.find(e => e.path.includes('field_b'))
    expect(bError!.validation).toBe('json-logic')
    expect(bError!.customErrorMessage).toBe('Must be greater than A');

    // When field_b > field_a, validation should pass
    (jsonLogic.apply as jest.Mock).mockReturnValue(true)
    errors = validateSchema({ field_a: 10, field_b: 20 }, schema)
    expect(errors).toEqual([]);

    // When field_a === 20, both validations should apply
    // First, greater_than_field_a should pass
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false) // greater_than_two_times_a fails
    errors = validateSchema({ field_a: 20, field_b: 10 }, schema)
    expect(errors.length).toBe(1)
    const bError2 = errors.find(e => e.path.includes('field_b'))
    expect(bError2!.validation).toBe('json-logic')
    expect(bError2!.customErrorMessage).toBe('Must be greater than two times A');

    // When field_b > 2 * field_a, both validations should pass
    (jsonLogic.apply as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(true) // greater_than_two_times_a passes
    errors = validateSchema({ field_a: 20, field_b: 41 }, schema)
    expect(errors).toEqual([])
  })
})
