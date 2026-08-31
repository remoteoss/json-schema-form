import type { JsfObjectSchema } from '../src/types'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { createHeadlessForm } from '../src'
import { getField } from '../src/utils'

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

  describe('defaults on initialization', () => {
    describe('conditional options rendered from a default', () => {
      // A field with a `default` should trigger conditional rules on
      // initialization, without needing a `handleValidation` run first.
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          payment_method: {
            type: 'string',
            default: 'card',
            oneOf: [
              { const: 'card', title: 'Card' },
              { const: 'bank_transfer', title: 'Bank Transfer' },
            ],
          },
          card_type: {
            type: 'string',
          },
        },
        allOf: [
          {
            if: {
              properties: { payment_method: { const: 'card' } },
              required: ['payment_method'],
            },
            then: {
              properties: {
                card_type: {
                  oneOf: [
                    { const: 'visa', title: 'Visa' },
                    { const: 'mastercard', title: 'Mastercard' },
                  ],
                },
              },
            },
            else: {
              properties: {
                card_type: false,
              },
            },
          },
        ],
      }

      it('renders conditional options at init when the default matches the "then" branch', () => {
        const form = createHeadlessForm(schema, { disallowNewConditionalOptions: true })
        const cardTypeField = getField(form.fields, 'card_type')
        expect(cardTypeField?.isVisible).toBe(true)
        expect(cardTypeField?.options).toEqual([
          { label: 'Visa', value: 'visa' },
          { label: 'Mastercard', value: 'mastercard' },
        ])
      })

      it('lets an explicit initialValue override the default', () => {
        const form = createHeadlessForm(schema, { initialValues: { payment_method: 'bank_transfer' } })
        expect(getField(form.fields, 'card_type')?.isVisible).toBe(false)
      })

      it('initialValues are not mutated', () => {
        const initialValues = { card_type: 'visa' }
        const form = createHeadlessForm(schema, { initialValues })

        expect(initialValues).toStrictEqual({ card_type: 'visa' })

        const cardTypeField = getField(form.fields, 'card_type')
        expect(cardTypeField?.isVisible).toBe(true)
        expect(cardTypeField?.options).toEqual([
          { label: 'Visa', value: 'visa' },
          { label: 'Mastercard', value: 'mastercard' },
        ])
      })
    })

    describe('merge semantics', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          withDefault: { type: 'string', default: 'fallback' },
          noDefault: { type: 'string' },
          zeroDefault: { type: 'number', default: 5 },
        },
        allOf: [
          {
            if: { properties: { withDefault: { const: 'fallback' } }, required: ['withDefault'] },
            then: { properties: { noDefault: { title: 'Revealed' } } },
            else: { properties: { noDefault: false } },
          },
        ],
      }

      it('applies the default when no initial value is provided', () => {
        const form = createHeadlessForm(schema)
        expect(getField(form.fields, 'noDefault')?.isVisible).toBe(true)
      })

      it('allows an explicit falsy initial value to override the default', () => {
        const form = createHeadlessForm(schema, { initialValues: { withDefault: null } })
        expect(getField(form.fields, 'noDefault')?.isVisible).toBe(false)
      })
    })

    describe('nested object defaults', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              country: { type: 'string', default: 'PT' },
            },
          },
          vat: { type: 'string' },
        },
        allOf: [
          {
            if: {
              properties: { address: { properties: { country: { const: 'PT' } }, required: ['country'] } },
              required: ['address'],
            },
            then: { properties: { vat: { title: 'VAT' } } },
            else: { properties: { vat: false } },
          },
        ],
      }

      it('seeds nested defaults so nested conditionals resolve at init', () => {
        const form = createHeadlessForm(schema)
        expect(getField(form.fields, 'vat')?.isVisible).toBe(true)
      })

      it('allows an explicit falsy initial value to override the default', () => {
        const form = createHeadlessForm(schema, { initialValues: { address: { country: null } } })
        expect(getField(form.fields, 'vat')?.isVisible).toBe(false)
      })
    })

    describe('array of objects (group-array) item defaults', () => {
      const schema: JsfObjectSchema = {
        type: 'object',
        properties: {
          pets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                species: { type: 'string', default: 'dog' },
                name: { type: 'string' },
              },
            },
          },
          dog_license: { type: 'string' },
        },
        allOf: [
          {
            if: {
              properties: {
                pets: {
                  items: { properties: { species: { const: 'dog' } }, required: ['species'] },
                },
              },
              required: ['pets'],
            },
            then: { properties: { dog_license: { title: 'Dog license' } } },
            else: { properties: { dog_license: false } },
          },
        ],
      }

      it('fills item defaults for each item that already exists in the value', () => {
        const form = createHeadlessForm(schema, {
          initialValues: { pets: [{ name: 'Rex' }, { name: 'Fido' }] },
        })
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(true)
      })

      it('allows an explicit item value to override the item default', () => {
        const form = createHeadlessForm(schema, {
          initialValues: { pets: [{ name: 'Rex' }, { name: 'Whiskers', species: 'cat' }] },
        })
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(false)
      })

      it('allows an explicit falsy item value to override the item default', () => {
        const form = createHeadlessForm(schema, {
          initialValues: { pets: [{ name: 'Rex', species: null }] },
        })
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(false)
      })

      it('does not create items when the array is missing from the value', () => {
        const form = createHeadlessForm(schema)
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(false)
      })

      it('does not create items when the array is empty', () => {
        const form = createHeadlessForm(schema, { initialValues: { pets: [] } })
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(false)
      })

      it('leaves a non-array value untouched, even when the items schema has defaults', () => {
        const form = createHeadlessForm(schema, { initialValues: { pets: 'not-an-array' } })
        expect(getField(form.fields, 'dog_license')?.isVisible).toBe(false)
      })
    })
  })
})
