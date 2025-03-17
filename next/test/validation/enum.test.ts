import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'

describe('enum validation', () => {
  it('returns no errors for values that are in the enum', () => {
    const schema = { enum: [1, 2, 3] }
    expect(validateSchema(1, schema)).toEqual([])
    expect(validateSchema(2, schema)).toEqual([])
    expect(validateSchema(3, schema)).toEqual([])
  })

  it('returns an error for values that are not in the enum', () => {
    const schema = { enum: [1, 2, 3] }
    expect(validateSchema(4, schema)).toEqual([
      {
        path: [],
        validation: 'enum',
      },
    ])
  })

  it('handles null in enums', () => {
    const schema = { enum: [1, null, 'test'] }
    expect(validateSchema(null, schema)).toEqual([])
    expect(validateSchema(undefined, schema)).toEqual([])
  })

  it('handles objects in enums', () => {
    const schema = {
      enum: [{ foo: 'bar' }, { baz: 123 }, 1],
    }
    expect(validateSchema({ foo: 'bar' }, schema)).toEqual([])
    expect(validateSchema({ foo: 'baz' }, schema)).toEqual([
      {
        path: [],
        validation: 'enum',
      },
    ])
    expect(validateSchema(1, schema)).toEqual([])
  })

  it('handles mixed type enums', () => {
    const schema = {
      enum: [1, 'test', null, { foo: 'bar' }],
    }
    expect(validateSchema(1, schema)).toEqual([])
    expect(validateSchema('test', schema)).toEqual([])
    expect(validateSchema(null, schema)).toEqual([])
    expect(validateSchema({ foo: 'bar' }, schema)).toEqual([])

    expect(validateSchema('other', schema)).toEqual([
      {
        path: [],
        validation: 'enum',
      },
    ])
    expect(validateSchema({ foo: 'baz' }, schema)).toEqual([
      {
        path: [],
        validation: 'enum',
      },
    ])
  })
})
