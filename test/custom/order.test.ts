import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

describe('custom order', () => {
  it('should sort fields by x-jsf-order', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      'x-jsf-order': ['age', 'name'],
    }
    const form = createHeadlessForm(schema)

    const keys = form.fields.map(field => field.name)
    expect(keys).toEqual(['age', 'name'])
  })

  it('should sort nested objects', () => {
    const addressSchema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        state: { type: 'string' },
        city: { type: 'string' },
        street: { type: 'string' },
      },
      'x-jsf-order': ['street', 'city', 'state'],
    }

    const mainSchema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        address: addressSchema,
        name: { type: 'string' },
      },
      'x-jsf-order': ['name', 'address'],
    }

    const form = createHeadlessForm(mainSchema)

    const mainKeys = form.fields.map(field => field.name)
    expect(mainKeys).toEqual(['name', 'address'])

    const addressField = form.fields.find(field => field.name === 'address')
    if (addressField === undefined) {
      throw new Error('Address field not found')
    }

    // This already throws if "fields" is undefined
    const addressKeys = addressField.fields?.map(field => field.name)
    expect(addressKeys).toEqual(['street', 'city', 'state'])
  })

  it('should respect initial, unspecified order', () => {
    const schema: JsfObjectSchema = {
      'type': 'object',
      'properties': {
        one: { type: 'string' },
        two: { type: 'string' },
        three: { type: 'string' },
      },
      'x-jsf-order': ['three'],
    }

    const form = createHeadlessForm(schema)
    const keys = form.fields.map(field => field.name)

    // "one" and "two" are not specified,
    // so they are added to the end,
    // respecting their relative initial order
    expect(keys).toEqual(['three', 'one', 'two'])
  })
})
