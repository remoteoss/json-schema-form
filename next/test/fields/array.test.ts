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

    expect(field).toEqual({
      inputType: 'group-array',
      type: 'group-array',
      jsonType: 'array',
      isVisible: true,
      name: 'root',
      required: true,
      items: expect.any(Object),
      fields: [
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'name',
          isVisible: true,
          nameKey: 'name',
          required: false,
        },
      ],
    })

    expect(field?.items).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    })
  })

  it('respects x-jsf-order', () => {
    const schema: JsfSchema = {
      'type': 'array',
      'x-jsf-presentation': {
        inputType: 'group-array',
      },
      'items': {
        'type': 'object',
        'properties': {
          first_item: { type: 'string' },
          second_item: { type: 'string' },
          third_item: { type: 'string' },
        },
        'x-jsf-order': ['second_item', 'first_item', 'third_item'],
      },
    }

    const field = buildFieldSchema(schema, 'root', true)

    expect(field?.fields?.map(f => f.name)).toEqual(['second_item', 'first_item', 'third_item'])
  })

  it('should handle required arrays', () => {
    const schema: JsfSchema = {
      type: 'object',
      required: ['addresses'],
      title: 'Address book',
      properties: {
        addresses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              address: { type: 'string' },
            },
          },
        },
      },
    }

    const rootField = buildFieldSchema(schema, 'root', true)
    const arrayField = rootField?.fields?.[0]

    expect(arrayField).toEqual({
      inputType: 'group-array',
      type: 'group-array',
      jsonType: 'array',
      isVisible: true,
      name: 'addresses',
      required: true,
      items: expect.any(Object),
      fields: [
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'name',
          isVisible: true,
          nameKey: 'name',
          required: false,
        },
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'address',
          isVisible: true,
          nameKey: 'address',
          required: false,
        },
      ],
    })
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

    expect(field).toEqual(expect.objectContaining({
      inputType: 'group-array',
      type: 'group-array',
      jsonType: 'array',
      isVisible: true,
      name: 'objectArray',
      required: true,
      fields: [
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'name',
          label: 'Name',
          isVisible: true,
          nameKey: 'name',
          required: true,
        },
        {
          inputType: 'number',
          type: 'number',
          jsonType: 'number',
          name: 'age',
          label: 'Age',
          isVisible: true,
          nameKey: 'age',
          required: false,
        },
      ],
    }))
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

    expect(field).toEqual({
      inputType: 'group-array',
      type: 'group-array',
      jsonType: 'array',
      isVisible: true,
      name: 'tasksArray',
      label: 'Tasks',
      required: true,
      foo: 'bar',
      bar: 'baz',
      description: 'List of tasks to complete',
      fields: [
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'title',
          isVisible: true,
          nameKey: 'title',
          required: false,
        },
      ],
      items: expect.any(Object),
    })
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

    expect(field).toEqual({
      inputType: 'group-array',
      type: 'group-array',
      jsonType: 'array',
      isVisible: true,
      name: 'matrix',
      label: 'Matrix',
      required: true,
      items: expect.any(Object),
      fields: [
        {
          inputType: 'group-array',
          type: 'group-array',
          jsonType: 'array',
          isVisible: true,
          name: 'nested',
          nameKey: 'nested',
          label: 'Nested',
          required: false,
          items: expect.any(Object),
          fields: [
            {
              inputType: 'text',
              type: 'text',
              jsonType: 'string',
              name: 'name',
              required: false,
              nameKey: 'name',
              isVisible: true,
            },
          ],
        },
      ],
    })
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

  it('propagates schema properties to the field', () => {
    const schema: JsfSchema & Record<string, unknown> = {
      'type': 'array',
      'label': 'My array',
      'description': 'My array description',
      'x-jsf-presentation': {
        inputType: 'group-array',
      },
      'x-jsf-errorMessage': {
        minItems: 'At least one item is required',
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

    expect(field).toEqual({
      'inputType': 'group-array',
      'type': 'group-array',
      'jsonType': 'array',
      'label': 'My array',
      'description': 'My array description',
      'foo': 'bar',
      'items': expect.any(Object),
      'x-custom-prop': 'custom value',
      'isVisible': true,
      'name': 'myArray',
      'required': true,
      'errorMessage': {
        minItems: 'At least one item is required',
      },
      'fields': [
        {
          inputType: 'text',
          type: 'text',
          jsonType: 'string',
          name: 'name',
          required: false,
          isVisible: true,
          nameKey: 'name',
        },
      ],
    })
  })

  describe('validation error handling', () => {
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

    it('handles validation of nested group-arrays', () => {
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
              required: ['name', 'employees'],
            },
          },
        },
      }

      const form = createHeadlessForm(schema)

      // Test validation with nested array errors
      const data = {
        departments: [
          // missing employees
          {
            name: 'Engineering',
          },
          // missing name
          {
            employees: [
              { name: 'Charlie', role: 'Designer' }, // valid
            ],
          },
          // Valid
          {
            name: 'Sales',
            employees: [
              { name: 'Alice', role: 'Manager' },
            ],
          },
          {
            name: 'Customer Support',
            employees: [
              { name: 'Bob', role: 'Support Agent' }, // valid
              { name: 'Peter' }, // missing role
            ],
          },
        ],
      }

      const result = form.handleValidation(data)

      expect(result.formErrors).toEqual({
        departments: [
          {
            employees: 'Required field',
          },
          {
            name: 'Required field',
          },
          undefined,
          {
            employees: [
              undefined,
              { role: 'Required field' },
            ],
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
  })

  // These do not work with the current group-array API where all groups share the same `fields` property which
  // makes it impossible to have different fields for each item in the array.
  // This applies to all kinds of mutations such as conditional rendering, default values, etc. and not just titles.
  // TODO: Check internal ticket: https://linear.app/remote/issue/RMT-1616/grouparray-hide-conditional-fields
  describe.skip('mutation of array items', () => {
    // This schema describes a list of animals, where each animal has a kind which is either dog or cat and a name.
    // When the kind is dog, the name's title is set to "Dog name" and when the kind is cat, the name's title is set to "Cat name".
    const schema: JsfObjectSchema = {
      type: 'object',
      properties: {
        animals: {
          type: 'array',
          items: {
            type: 'object',
            required: ['kind', 'name'],
            properties: {
              kind: { type: 'string', enum: ['dog', 'cat'] },
              name: { type: 'string', title: 'Animal Name' },
            },
            allOf: [
              {
                if: {
                  properties: { kind: { const: 'dog' } },
                  required: ['kind'],
                },
                then: {
                  properties: { name: { title: 'Dog Name' } },
                },
              },
              {
                if: {
                  properties: { kind: { const: 'cat' } },
                  required: ['kind'],
                },
                then: {
                  properties: { name: { title: 'Cat name' } },
                },
              },
            ],
          },
        },
      },
      required: ['animals'],
    }

    it('mutates array items correctly when there is only one item', () => {
      const form = createHeadlessForm(schema)

      expect(form.handleValidation({ animals: [{ kind: 'dog', name: 'Buddy' }] }).formErrors).toBeUndefined()
      expect(form.fields[0]).toMatchObject({
        fields: [
          expect.any(Object),
          expect.objectContaining({
            label: 'Dog name',
          }),
        ],
      })
    })

    it('mutates array items correctly when there are multiple items', () => {
      const form = createHeadlessForm(schema)
      expect(form.handleValidation({ animals: [{ kind: 'dog', name: 'Buddy' }, { kind: 'cat', name: 'Whiskers' }] }).formErrors).toBeUndefined()
      // This creates a form where the two items both mutate the same field and we have no way to distinguish them
      // as both will be rendered from the same fields in the `fields` property.
    })
  })
})
