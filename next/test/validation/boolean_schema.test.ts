import type { JsfObjectSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'
import { validateSchema } from '../../src/validation/schema'
import { errorLike } from '../test-utils'

describe('boolean schema validation', () => {
  it('returns an error if the value is false', () => {
    const schema = { type: 'object', properties: { name: false } }
    expect(validateSchema({ name: 'anything' }, schema)).toEqual([errorLike({ path: ['name'], validation: 'valid' })])
    expect(validateSchema({}, schema)).toEqual([])
  })

  it('does not return an error if the value is true', () => {
    const schema = { type: 'object', properties: { name: true } }
    expect(validateSchema({ name: 'anything' }, schema)).toEqual([])
    expect(validateSchema({}, schema)).toEqual([])
  })
})
