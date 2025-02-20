import { describe, expect, it } from '@jest/globals'
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
        type: 'text',
        inputType: 'text',
        jsonType: 'string',
        name: 'name',
        label: 'Name',
        required: false,
      },
    ])
  })

  it('should throw an error if the type equals "array"', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'array' },
      },
    }

    expect(() => buildFieldSchema(schema, 'root', true)).toThrow(
      'Array type is not yet supported',
    )
  })

  it('should build an object field with multiple properties', () => {
    const schema = {
      type: 'object',
      title: 'User',
      properties: {
        name: { type: 'string', title: 'Name' },
        age: { type: 'number', title: 'Age' },
        email: { type: 'string', title: 'Email' },
      },
      required: ['name', 'email'],
    }

    const field = buildFieldSchema(schema, 'user', false)

    expect(field).toEqual({
      type: 'fieldset',
      inputType: 'fieldset',
      name: 'User',
      label: 'User',
      required: false,
      jsonType: 'object',
      fields: [
        {
          type: 'text',
          inputType: 'text',
          jsonType: 'string',
          name: 'name',
          label: 'Name',
          required: true,
        },
        {
          type: 'text',
          inputType: 'text',
          jsonType: 'number',
          name: 'age',
          label: 'Age',
          required: false,
        },
        {
          type: 'text',
          inputType: 'text',
          jsonType: 'string',
          name: 'email',
          label: 'Email',
          required: true,
        },
      ],
    })
  })

  it('should handle custom x-jsf-presentation properties', () => {
    const schema = {
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
        'type': 'text',
        'inputType': 'text',
        'jsonType': 'string',
        'name': 'file',
        'label': 'Some field',
        'required': false,
        'accept': '.pdf,.doc',
        'maxFileSize': 5000000,
        'x-jsf-presentation': {
          inputType: 'file',
          accept: '.pdf,.doc',
          maxFileSize: 5000000,
        },
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
        type: 'fieldset',
        inputType: 'fieldset',
        jsonType: 'object',
        name: 'Address',
        label: 'Address',
        required: false,
        fields: [
          {
            type: 'text',
            inputType: 'text',
            jsonType: 'string',
            name: 'street',
            label: 'Street',
            required: true,
          },
          {
            type: 'text',
            inputType: 'text',
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
        type: 'text',
        inputType: 'text',
        jsonType: 'string',
        name: 'user_email',
        required: false,
      },
    ])
  })
})
