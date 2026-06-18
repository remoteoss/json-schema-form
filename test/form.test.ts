import type { JsfObjectSchema } from '../src/types'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { createHeadlessForm } from '../src'
import { schemaWithCustomValidationFunction } from './validation/json-logic.fixtures'

describe('createHeadlessForm', () => {
  it('should be a function', () => {
    expect(createHeadlessForm).toBeInstanceOf(Function)
  })

  it('should allow form-specific JSON Logic operators', () => {
    const { handleValidation } = createHeadlessForm(schemaWithCustomValidationFunction, { strictInputType: false, customJsonLogicOps: { is_hello: a => a === 'hello world' } })
    expect(handleValidation({ field_a: 'hello world' }).formErrors).toEqual(undefined)
    const { formErrors: formErrors1 } = handleValidation({ field_a: 'goodbye universe' })
    expect(formErrors1?.field_a).toEqual('Invalid hello world')

    const { handleValidation: handleValidation2 } = createHeadlessForm(schemaWithCustomValidationFunction, { strictInputType: false, customJsonLogicOps: { is_hello: a => a === 'goodbye universe' } })
    expect(handleValidation2({ field_a: 'goodbye universe' }).formErrors).toEqual(undefined)
    const { formErrors: formErrors2 } = handleValidation2({ field_a: 'hello world' })
    expect(formErrors2?.field_a).toEqual('Invalid hello world')

    const { handleValidation: handleValidation3 } = createHeadlessForm(schemaWithCustomValidationFunction, { strictInputType: false })
    const actionThatWillThrow = () => {
      handleValidation3({ field_a: 'hello world' })
    }

    expect(actionThatWillThrow).toThrow('Unrecognized operation is_hello')
  })

  describe('options validation', () => {
    const basicSchema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }
    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should log error when customProperties option is provided', () => {
      // spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      createHeadlessForm(basicSchema, { customProperties: {} } as any)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[json-schema-form] `customProperties` is a deprecated option and it\'s not supported on json-schema-form v1')
    })

    it('should not log error when modifyConfig option is not provided', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      createHeadlessForm(basicSchema, {})
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not log error when other valid options are provided', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      createHeadlessForm(basicSchema, {
        initialValues: { name: 'test' },
        legacyOptions: {},
        strictInputType: true,
      })
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})
