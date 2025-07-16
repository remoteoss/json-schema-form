import type { JsfObjectSchema } from '../src/types'
import { describe, expect, it, jest } from '@jest/globals'
import { createHeadlessForm } from '../src'

describe('createHeadlessForm', () => {
  it('should be a function', () => {
    expect(createHeadlessForm).toBeInstanceOf(Function)
  })

  describe('options validation', () => {
    const basicSchema: JsfObjectSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    it('should throw error when customProperties option is provided', () => {
      // spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      createHeadlessForm(basicSchema, { customProperties: {} } as any)
      expect(consoleErrorSpy).toHaveBeenCalledWith('[json-schema-form] `customProperties` is a deprecated option and it\'s not supported on json-schema-form v1')
    })

    it('should not throw error when modifyConfig option is not provided', () => {
      expect(() => {
        createHeadlessForm(basicSchema, {})
      }).not.toThrow()
    })

    it('should not throw error when other valid options are provided', () => {
      expect(() => {
        createHeadlessForm(basicSchema, {
          initialValues: { name: 'test' },
          legacyOptions: {},
          strictInputType: true,
        })
      }).not.toThrow()
    })
  })
})
