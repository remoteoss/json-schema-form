import type { JsfObjectSchema, JsfSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { buildFieldSchema } from '../../src/field/schema'

describe('buildFieldArray', () => {
  it('should build a field from an array schema', () => {
    const schema: JsfSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }

    const field = buildFieldSchema(schema, 'root', true)

    expect(field).toBeDefined()
    expect(field?.type).toBe('group-array')
  })

  it('should handle required arrays', () => {
    const schema: JsfSchema = {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    }

    const rootField = buildFieldSchema(schema, 'root', true)
    const arrayField = rootField?.fields?.[0]

    expect(arrayField).toBeDefined()
    expect(arrayField?.type).toBe('group-array')
    expect(arrayField?.required).toBe(true)
  })

  it('should handle arrays with object items (fields) inside', () => {
    const schema: JsfSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          age: { type: 'number', title: 'Age' },
        },
        required: ['name'],
      },
    }

    const field = buildFieldSchema(schema, 'objectArray', true)

    expect(field).toBeDefined()
    expect(field?.type).toBe('group-array')

    const fields = field!.fields!
    expect(fields).toHaveLength(2)
    expect(fields[0].name).toBe('name')
    expect(fields[0].type).toBe('text')
    expect(fields[0].required).toBe(true)
    expect(fields[1].name).toBe('age')
    expect(fields[1].type).toBe('number')
    expect(fields[1].required).toBe(false)
  })

  it('should handle arrays with custom presentation', () => {
    const schema: JsfSchema = {
      'type': 'array',
      'title': 'Tasks',
      'description': 'List of tasks to complete',
      'x-jsf-presentation': {
        foo: 'bar',
        bar: 'baz',
      },
      'items': {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
    }

    const field = buildFieldSchema(schema, 'tasksArray', true)

    expect(field).toBeDefined()
    expect(field?.type).toBe('group-array')
    expect(field?.foo).toBe('bar')
    expect(field?.bar).toBe('baz')
    expect(field?.description).toBe('List of tasks to complete')
    expect(field?.label).toBe('Tasks')
  })

  it('should handle nested group-arrays', () => {
    const schema: JsfSchema = {
      type: 'array',
      title: 'Matrix',
      items: {
        type: 'object',
        properties: {
          nested: {
            type: 'array',
            title: 'Nested',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      },
    }

    const field = buildFieldSchema(schema, 'matrix', true)

    expect(field).toBeDefined()
    expect(field?.type).toBe('group-array')
    expect(field?.label).toBe('Matrix')

    const fields = field?.fields
    expect(fields).toBeDefined()
    expect(fields).toHaveLength(1)
    expect(fields?.[0]?.type).toBe('group-array')
    expect(fields?.[0]?.label).toBe('Nested')

    const nestedFields = fields?.[0]?.fields
    expect(nestedFields).toBeDefined()
    expect(nestedFields).toHaveLength(1)
    expect(nestedFields?.[0]?.type).toBe('text')
    expect(nestedFields?.[0]?.name).toBe('name')
  })

  it('allows non-object items', () => {
    const groupArray = () => expect.objectContaining({
      inputType: 'group-array',
      fields: [expect.anything()],
    })

    expect(buildFieldSchema({ 'type': 'array', 'x-jsf-presentation': { inputType: 'group-array' }, 'items': { type: 'string' } }, 'root', true)).toEqual(groupArray())
    expect(buildFieldSchema({ 'type': 'array', 'x-jsf-presentation': { inputType: 'group-array' }, 'items': { type: 'number' } }, 'root', true)).toEqual(groupArray())
    expect(buildFieldSchema({ 'type': 'array', 'x-jsf-presentation': { inputType: 'group-array' }, 'items': { type: 'array' } }, 'root', true)).toEqual(groupArray())
    expect(buildFieldSchema({ 'type': 'array', 'x-jsf-presentation': { inputType: 'group-array' }, 'items': { type: 'enum' } }, 'root', true)).toEqual(groupArray())
    expect(buildFieldSchema({ 'type': 'array', 'x-jsf-presentation': { inputType: 'group-array' }, 'items': { type: 'boolean' } }, 'root', true)).toEqual(groupArray())
  })

  it('creates correct form errors validation errors in array items', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              a: {
                type: 'string',
              },
            },
            required: ['a'],
          },
        },
      },
      required: ['list'],
    }

    const form = createHeadlessForm(schema)

    expect(form.handleValidation({}).formErrors).toEqual({ list: 'Required field' })
    expect(form.handleValidation({ list: [] }).formErrors).toEqual(undefined)
    expect(form.handleValidation({ list: [{ a: 'test' }] }).formErrors).toEqual(undefined)
    expect(form.handleValidation({ list: [{}] }).formErrors).toEqual({ list: [{ a: 'Required field' }] })
    expect(form.handleValidation({ list: [{ a: 'a' }, {}, { a: 'c' }] }).formErrors).toEqual({ list: [undefined, { a: 'Required field' }, undefined] })
  })

  it('handles validation of arrays with multiple required fields', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        people: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              age: { type: 'number' },
            },
            required: ['firstName', 'lastName'],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test array with multiple validation errors in one item
    expect(form.handleValidation({ people: [{}] }).formErrors).toEqual({
      people: [{ firstName: 'Required field', lastName: 'Required field' }],
    })

    // Test array with validation errors in different items
    expect(form.handleValidation({
      people: [
        { firstName: 'John' },
        { lastName: 'Smith' },
        { firstName: 'Jane', lastName: 'Doe' },
      ],
    }).formErrors).toEqual({
      people: [
        { lastName: 'Required field' },
        { firstName: 'Required field' },
        undefined,
      ],
    })
  })

  it.skip('handles validation of nested group-arrays', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        departments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              employees: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    role: { type: 'string' },
                  },
                  required: ['name', 'role'],
                },
              },
            },
            required: ['name'],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test validation with nested array errors
    const data = {
      departments: [
        {
          name: 'Engineering',
          employees: [
            { name: 'Alice' }, // missing role
            { name: 'Bob', role: 'Developer' }, // valid
            { role: 'Manager' }, // missing name
          ],
        },
        {
          // missing name
          employees: [
            { name: 'Charlie', role: 'Designer' }, // valid
          ],
        },
      ],
    }

    const result = form.handleValidation(data)

    expect(result.formErrors).toEqual({
      departments: [
        {
          employees: [
            { role: 'Required field' },
            undefined,
            { name: 'Required field' },
          ],
        },
        {
          name: 'Required field',
        },
      ],
    })
  })

  it('handles string format validation in array items', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: {
                'type': 'string',
                'format': 'email',
                'x-jsf-errorMessage': {
                  format: 'Please enter a valid email address',
                },
              },
            },
            required: ['email'],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test email format validation in array items
    expect(form.handleValidation({
      contacts: [
        { email: 'invalid-email' },
        { email: 'valid@example.com' },
        { email: 'another-invalid' },
      ],
    }).formErrors).toEqual({
      contacts: [
        { email: 'Please enter a valid email address' },
        undefined,
        { email: 'Please enter a valid email address' },
      ],
    })
  })

  it('handles validation of sparse arrays', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string' },
            },
            required: ['value'],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test array with empty slots (sparse array)
    const data = {
      items: [],
    }
    // @ts-expect-error - Creating a sparse array
    data.items[0] = { value: 'first' }
    // @ts-expect-error - Creating a sparse array
    data.items[3] = {}
    // @ts-expect-error - Creating a sparse array
    data.items[5] = { value: 'last' }

    expect(form.handleValidation(data).formErrors).toEqual({
      items: [
        undefined,
        undefined,
        undefined,
        { value: 'Required field' },
        undefined,
        undefined,
      ],
    })
  })

  it('handles minItems and maxItems validation for arrays', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        tags: {
          'type': 'array',
          'minItems': 2,
          'maxItems': 4,
          'x-jsf-errorMessage': {
            minItems: 'Please add at least 2 tags',
            maxItems: 'You cannot add more than 4 tags',
          },
          'items': {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
      required: ['tags'],
    }

    const form = createHeadlessForm(schema)

    // Test minItems validation
    expect(form.handleValidation({ tags: [{ name: 'tag1' }] }).formErrors).toEqual({
      tags: 'Please add at least 2 tags',
    })

    // Test maxItems validation
    expect(form.handleValidation({
      tags: [
        { name: 'tag1' },
        { name: 'tag2' },
        { name: 'tag3' },
        { name: 'tag4' },
        { name: 'tag5' },
      ],
    }).formErrors).toEqual({
      tags: 'You cannot add more than 4 tags',
    })

    // Test valid number of items
    expect(form.handleValidation({
      tags: [{ name: 'tag1' }, { name: 'tag2' }],
    }).formErrors).toEqual(undefined)
  })

  it('handles validation of arrays with complex conditional validation', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['physical', 'digital'],
              },
              weight: { type: 'number' },
              fileSize: { type: 'number' },
            },
            required: ['type'],
            allOf: [
              {
                if: {
                  properties: { type: { const: 'physical' } },
                  required: ['type'],
                },
                then: {
                  required: ['weight'],
                  properties: {
                    weight: { 'x-jsf-errorMessage': { required: 'Weight is required for physical products' } },
                  },
                },
              },
              {
                if: {
                  properties: { type: { const: 'digital' } },
                  required: ['type'],
                },
                then: {
                  required: ['fileSize'],
                  properties: {
                    fileSize: { 'x-jsf-errorMessage': { required: 'File size is required for digital products' } },
                  },
                },
              },
            ],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test conditional validation in array items
    expect(form.handleValidation({
      products: [
        { type: 'physical' }, // missing weight
        { type: 'digital', weight: 2 }, // missing fileSize
        { type: 'physical', weight: 5 }, // valid
        { type: 'digital', fileSize: 100 }, // valid
      ],
    }).formErrors).toEqual({
      products: [
        { weight: 'Weight is required for physical products' },
        { fileSize: 'File size is required for digital products' },
        undefined,
        undefined,
      ],
    })
  })

  it('handles uniqueItems validation for arrays', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        colors: {
          'type': 'array',
          'uniqueItems': true,
          'x-jsf-errorMessage': {
            uniqueItems: 'All colors must be unique',
          },
          'items': {
            type: 'object',
            properties: {
              code: { type: 'string' },
            },
            required: ['code'],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test uniqueItems validation - array has duplicate objects (based on value equality)
    expect(form.handleValidation({
      colors: [
        { code: 'red' },
        { code: 'blue' },
        { code: 'red' }, // duplicate
      ],
    }).formErrors).toEqual({
      colors: 'All colors must be unique',
    })

    // Valid case - all items unique
    expect(form.handleValidation({
      colors: [
        { code: 'red' },
        { code: 'blue' },
        { code: 'green' },
      ],
    }).formErrors).toEqual(undefined)
  })

  it('handles validation of arrays with pattern property errors', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phone: {
                'type': 'string',
                'pattern': '^\\d{3}-\\d{3}-\\d{4}$',
                'x-jsf-errorMessage': {
                  pattern: 'Phone must be in format: 123-456-7890',
                },
              },
              zipCode: {
                'type': 'string',
                'pattern': '^\\d{5}(-\\d{4})?$',
                'x-jsf-errorMessage': {
                  pattern: 'Invalid zip code format',
                },
              },
            },
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test pattern validation in array items
    expect(form.handleValidation({
      contacts: [
        { phone: '123-456-7890', zipCode: '12345' }, // valid
        { phone: '1234567890', zipCode: '12345-6789' }, // invalid phone, valid zip
        { phone: '123-456-7890', zipCode: '1234' }, // valid phone, invalid zip
      ],
    }).formErrors).toEqual({
      contacts: [
        undefined,
        { phone: 'Phone must be in format: 123-456-7890' },
        { zipCode: 'Invalid zip code format' },
      ],
    })
  })

  it('handles mixed arrays with different types of validation errors', () => {
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        mixedData: {
          'type': 'array',
          'minItems': 1,
          'x-jsf-errorMessage': {
            minItems: 'At least one item is required',
          },
          'items': {
            type: 'object',
            properties: {
              type: {
                'type': 'string',
                'enum': ['text', 'number', 'boolean'],
                'x-jsf-errorMessage': {
                  enum: 'Type must be one of: text, number, boolean',
                },
              },
              value: { type: 'string' },
              minimum: { type: 'number' },
              maximum: { type: 'number' },
            },
            required: ['type', 'value'],
            allOf: [
              {
                if: {
                  properties: { type: { const: 'number' } },
                },
                then: {
                  properties: {
                    value: {
                      'type': 'number',
                      'x-jsf-errorMessage': {
                        type: 'Value must be a number for number type',
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    }

    const form = createHeadlessForm(schema)

    // Test empty array validation
    expect(form.handleValidation({ mixedData: [] }).formErrors).toEqual({
      mixedData: 'At least one item is required',
    })

    // Test array with mixed validation errors
    expect(form.handleValidation({
      mixedData: [
        { type: 'text', value: 'Hello' }, // valid
        { type: 'number', value: 'not-a-number' }, // invalid value type for number
        { type: 'unknown', value: 'test' }, // invalid enum
        { type: 'boolean' }, // missing value
      ],
    }).formErrors).toEqual({
      mixedData: [
        undefined,
        { value: 'Value must be a number for number type' },
        { type: 'Type must be one of: text, number, boolean' },
        { value: 'Required field' },
      ],
    })
  })

  it('propagates schema properties to the field', () => {
    const schema: JsfSchema & Record<string, unknown> = {
      'type': 'array',
      'label': 'My array',
      'description': 'My array description',
      'x-jsf-presentation': {
        inputType: 'group-array',
      },
      'x-custom-prop': 'custom value',
      'foo': 'bar',
      'items': {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }

    const field = buildFieldSchema(schema, 'myArray', true)

    expect(field).toBeDefined()
    expect(field?.label).toBe('My array')
    expect(field?.description).toBe('My array description')
  })

  it('does not propagate excluded schema properties to the field', () => {
    const schema: JsfSchema & Record<string, unknown> = {
      'type': 'array',
      'title': 'My array',
      'description': 'My array description',
      'x-jsf-presentation': {
        inputType: 'group-array',
      },
      'x-jsf-errorMessage': {
        minItems: 'At least one item is required',
      },
      'label': 'My label',
      'minItems': 1,
      'items': {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }

    const field = buildFieldSchema(schema, 'myArray', true)

    expect(field).toBeDefined()
    expect(field?.label).toBe('My array')
    expect(field?.items).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
    expect(field?.minItems).toBe(1)
    expect(field?.['x-jsf-errorMessage']).toBeUndefined()
    expect(field?.['x-jsf-presentation']).toBeUndefined()
  })
})
