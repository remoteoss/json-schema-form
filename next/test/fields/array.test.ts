import type { JsfSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { buildFieldSchema } from '../../src/field/schema'

describe('buildFieldArray', () => {
  it('should build a field from an array schema', () => {
    const schema: JsfSchema = {
      type: 'array',
      items: {
        type: 'object',
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

  it('should handle arrays with complex object items', () => {
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

    console.warn(JSON.stringify(field, null, 2))

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

  it('throws an error if the items schema is not an object', () => {
    expect(() => buildFieldSchema({ type: 'array', items: { type: 'string' } }, 'root', true)).toThrow()
    expect(() => buildFieldSchema({ type: 'array', items: { type: 'number' } }, 'root', true)).toThrow()
    expect(() => buildFieldSchema({ type: 'array', items: { type: 'array' } }, 'root', true)).toThrow()
    expect(() => buildFieldSchema({ type: 'array', items: { type: 'enum' } }, 'root', true)).toThrow()
    expect(() => buildFieldSchema({ type: 'array', items: { type: 'boolean' } }, 'root', true)).toThrow()
  })
})
