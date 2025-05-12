import type { JsfSchema, NonBooleanJsfSchema } from '../src/types'
import { describe, expect, it } from '@jest/globals'
import { TypeName } from 'json-schema-typed'
import { buildFieldSchema } from '../src/field/schema'

describe('fields', () => {
  it('should build a field from a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', title: 'Name' },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    expect(fields).toEqual([
      {
        inputType: 'text',
        jsonType: 'string',
        name: 'name',
        label: 'Name',
        required: false,
        isVisible: true,
      },
    ])
  })

  it('should use x-jsf-presentation.inputType to set the input type and fallback to the json type if no presentation is provided', () => {
    const schema: JsfSchema = {
      type: 'object',
      properties: {
        age: { 'type': 'number', 'title': 'Age', 'x-jsf-presentation': { inputType: 'number' } },
        amount: { type: 'number', title: 'Amount' },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    // Both fields should have the same input type
    expect(fields).toEqual([
      {
        inputType: 'number',
        jsonType: 'number',
        name: 'age',
        label: 'Age',
        required: false,
        isVisible: true,
      },
      {
        inputType: 'number',
        jsonType: 'number',
        name: 'amount',
        label: 'Amount',
        required: false,
        isVisible: true,
      },
    ])
  })

  it('should build an object field with multiple properties', () => {
    const schema = {
      type: 'object',
      title: 'User',
      description: 'User information',
      properties: {
        name: { type: 'string', title: 'Name' },
        age: { type: 'number', title: 'Age' },
        email: { type: 'string', title: 'Email' },
      },
      required: ['name', 'email'],
    }

    const field = buildFieldSchema(schema, 'user', false)

    expect(field).toEqual({
      inputType: 'fieldset',
      isVisible: true,
      name: 'user',
      label: 'User',
      description: 'User information',
      required: false,
      jsonType: 'object',
      fields: [
        {
          inputType: 'text',
          isVisible: true,
          jsonType: 'string',
          name: 'name',
          label: 'Name',
          required: true,
        },
        {
          inputType: 'number',
          isVisible: true,
          jsonType: 'number',
          name: 'age',
          label: 'Age',
          required: false,
        },
        {
          inputType: 'text',
          isVisible: true,
          jsonType: 'string',
          name: 'email',
          label: 'Email',
          required: true,
        },
      ],
    })
  })

  it('should handle custom x-jsf-presentation properties', () => {
    const schema: JsfSchema = {
      type: 'object',
      properties: {
        file: {
          'type': 'string',
          'title': 'Some field',
          'x-jsf-presentation': {
            inputType: 'file',
            accept: '.pdf,.doc',
            maxFileSize: 5000000,
          },
        },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    expect(fields).toEqual([
      {
        inputType: 'file',
        jsonType: 'string',
        isVisible: true,
        name: 'file',
        label: 'Some field',
        required: false,
        accept: '.pdf,.doc',
        maxFileSize: 5000000,
      },
    ])
  })

  it('should handle boolean schema', () => {
    const schema = {
      type: 'object',
      properties: {
        active: true,
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!
    expect(fields).toEqual([])
  })

  it('should handle nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          title: 'Address',
          properties: {
            street: { type: 'string', title: 'Street' },
            city: { type: 'string', title: 'City' },
          },
          required: ['street'],
        },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    expect(fields).toEqual([
      {
        inputType: 'fieldset',
        isVisible: true,
        jsonType: 'object',
        name: 'address',
        label: 'Address',
        required: false,
        fields: [
          {
            inputType: 'text',
            isVisible: true,
            jsonType: 'string',
            name: 'street',
            label: 'Street',
            required: true,
          },
          {
            inputType: 'text',
            isVisible: true,
            jsonType: 'string',
            name: 'city',
            label: 'City',
            required: false,
          },
        ],
      },
    ])
  })

  it('should use property name if title is not provided', () => {
    const schema = {
      type: 'object',
      properties: {
        user_email: { type: 'string' },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    expect(fields).toEqual([
      {
        inputType: 'text',
        jsonType: 'string',
        name: 'user_email',
        required: false,
        isVisible: true,
      },
    ])
  })

  describe('radio field', () => {
    it('builds a radio field with options', () => {
      const schema: JsfSchema = {
        type: 'object',
        properties: {
          status: {
            'type': 'string',
            'oneOf': [
              { const: 'active', title: 'Active' },
              { const: 'inactive', title: 'Inactive' },
            ],
            'x-jsf-presentation': {
              inputType: 'radio',
            },
          },
        },
      }

      const fields = buildFieldSchema(schema, 'root', true)!.fields!

      expect(fields).toEqual([
        {
          inputType: 'radio',
          jsonType: 'string',
          isVisible: true,
          name: 'status',
          required: false,
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        },
      ])
    })

    it('build a radio field with enum', () => {
      const schema: JsfSchema = {
        type: 'object',
        properties: {
          status: {
            'enum': ['active', true, false, 1],
            'x-jsf-presentation': {
              inputType: 'radio',
            },
          },
        },
      }

      const fields = buildFieldSchema(schema, 'root', true)!.fields!

      expect(fields).toEqual([
        {
          inputType: 'radio',
          jsonType: undefined,
          isVisible: true,
          name: 'status',
          required: false,
          enum: ['active', true, false, 1],
          options: [
            { label: 'active', value: 'active' },
            { label: 'true', value: true },
            { label: 'false', value: false },
            { label: '1', value: 1 },
          ],
        },
      ])
    })

    it('skips options without a null const value', () => {
      const schema: JsfSchema = {
        type: 'object',
        properties: {
          status: {
            'type': 'string',
            'oneOf': [
              { const: 'active', title: 'Active' },
              { const: 'inactive', title: 'Inactive' },
              { const: null, title: 'Null' },
              { title: 'Undefined' },
            ],
            'x-jsf-presentation': {
              inputType: 'radio',
            },
          },
        },
      }

      const fields = buildFieldSchema(schema, 'root', true)!.fields!

      expect(fields).toEqual([
        {
          inputType: 'radio',
          jsonType: 'string',
          isVisible: true,
          name: 'status',
          required: false,
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Undefined', value: undefined },
          ],
        },
      ])
    })
  })

  describe('input type calculation', () => {
    it('prioritizes x-jsf-presentation.inputType', () => {
      const schema: JsfSchema = {
        'type': 'string',
        'x-jsf-presentation': { inputType: 'textarea' },
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('textarea')
    })

    it('throws error with strictInputType when x-jsf-presentation.inputType is missing', () => {
      const schema = {
        type: 'string',
        title: 'Test',
      }
      expect(() => buildFieldSchema(schema, 'test', false, true))
        .toThrow(/Strict error: Missing inputType to field "Test"/)
    })

    it('defaults to group-array for schema with no type but items.properties', () => {
      const schema = {
        items: {
          properties: {
            name: { type: 'string' },
          },
        },
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('group-array')
    })

    it('defaults to select for schema with no type but properties', () => {
      const schema = {
        properties: {
          option: { type: 'string' },
        },
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('select')
    })

    describe('string type inputs', () => {
      it('uses email input for email format', () => {
        const schema = {
          type: 'string',
          format: 'email',
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('email')
      })

      it('uses date input for date format', () => {
        const schema = {
          type: 'string',
          format: 'date',
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('date')
      })

      it('uses file input for data-url format', () => {
        const schema = {
          type: 'string',
          format: 'data-url',
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('file')
      })

      it('uses radio input when oneOf is present', () => {
        const schema = {
          type: 'string',
          oneOf: [
            { const: 'a', title: 'A' },
            { const: 'b', title: 'B' },
          ],
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('radio')
      })

      it('defaults to text input for string type', () => {
        const schema = {
          type: 'string',
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('text')
      })
    })

    it('uses number input for number/integer type', () => {
      const numberSchema = {
        type: 'number',
      }
      const integerSchema = {
        type: 'integer',
      }

      expect(buildFieldSchema(numberSchema, 'test')?.inputType).toBe('number')
      expect(buildFieldSchema(integerSchema, 'test')?.inputType).toBe('number')
    })

    it('uses fieldset input for object type', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('fieldset')
    })

    it('uses checkbox input for boolean type', () => {
      const schema = {
        type: 'boolean',
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('checkbox')
      expect(field?.checkboxValue).toBe(true)
    })

    it('uses correct checkboxValue checkbox input types with boolean const value', () => {
      const schema: NonBooleanJsfSchema = {
        'x-jsf-presentation': {
          inputType: 'checkbox',
        },
        'type': 'boolean',
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('checkbox')
      expect(field?.checkboxValue).toBe(true)
    })

    it('uses correct checkboxValue checkbox input types with string const value', () => {
      // Setting a schema with a string const value and string type
      const stringSchema: NonBooleanJsfSchema = {
        'x-jsf-presentation': {
          inputType: 'checkbox',
        },
        'type': 'string',
        'const': 'accept',
      }
      let fields = buildFieldSchema(stringSchema, 'test')
      expect(fields?.inputType).toBe('checkbox')
      expect(fields?.checkboxValue).toBe('accept')

      // Setting a schema with a string const value and boolean type
      const booleanSchema: NonBooleanJsfSchema = {
        'x-jsf-presentation': {
          inputType: 'checkbox',
        },
        'type': 'boolean',
      }

      fields = buildFieldSchema(booleanSchema, 'test')
      expect(fields?.inputType).toBe('checkbox')
      expect(fields?.checkboxValue).toBe(true)
    })

    it('uses checkbox input for boolean type with boolean const value', () => {
      const schema = {
        type: 'boolean',
        const: true,
      }
      const field = buildFieldSchema(schema, 'test')
      expect(field?.inputType).toBe('checkbox')
      expect(field?.checkboxValue).toBe(true)
    })

    // Skipping these tests until we have group-array support
    describe.skip('array type inputs', () => {
      it('uses group-array when items has properties', () => {
        const schema = {
          type: 'array',
          items: {
            properties: {
              name: { type: 'string' },
            },
          },
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('group-array')
      })

      it('uses select when items has no properties', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'string',
          },
        }
        const field = buildFieldSchema(schema, 'test')
        expect(field?.inputType).toBe('select')
      })
    })
  })

  describe('jsonType', () => {
    it('should be the type of the schema', () => {
      const schemaTypes = Object.values(TypeName)
      for (const type of schemaTypes) {
        // TODO: remove once array is supported
        if (type === 'array') {
          continue
        }
        expect(buildFieldSchema({ type }, 'test')?.jsonType).toBe(type)
      }
    })

    it('should work for array types as well', () => {
      expect(buildFieldSchema({ type: ['string', 'number'] }, 'test')?.jsonType).toEqual(['string', 'number'])
      expect(buildFieldSchema({ type: [] }, 'test')?.jsonType).toEqual([])
    })

    it('should be undefined when the schema has no type', () => {
      expect(buildFieldSchema({}, 'test')?.jsonType).toBeUndefined()
    })
  })
})
