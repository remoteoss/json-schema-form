import type { JsonLogicContext, NonBooleanJsfSchema } from '../../src/types'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import jsonLogic from 'json-logic-js'
import { validateJsonLogic } from '../../src/validation/json-logic'

// Mock json-logic-js
jest.mock('json-logic-js', () => ({
  apply: jest.fn(),
}))

describe('validateJsonLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    }

    // First validation fails, second passes
    ;(jsonLogic.apply as jest.Mock)
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
})
