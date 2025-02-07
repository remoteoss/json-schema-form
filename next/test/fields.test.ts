import { describe, expect, it } from '@jest/globals'
import { buildFieldSchema } from '../src/field/schema'

describe('fields', () => {
  it('should build a field from a schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    const fields = buildFieldSchema(schema, 'root', true)!.fields!

    expect(fields).toEqual([
      {
        type: 'text',
        inputType: 'text',
        name: 'name',
        required: false,
      },
    ])
  })
})
