import { describe, expect, it } from '@jest/globals'
import { evaluateIfCondition } from '../../src/validation/conditions'

describe('condition validators', () => {
  describe('evaluateIfCondition', () => {
    describe('boolean conditions', () => {
      it('should return true for boolean true condition', () => {
        const result = evaluateIfCondition('any-value', true, {}, undefined)
        expect(result).toBe(true)
      })

      it('should return false for boolean false condition', () => {
        const result = evaluateIfCondition('any-value', false, {}, undefined)
        expect(result).toBe(false)
      })

      it('should ignore `allowForbiddenValues` option for boolean conditions', () => {
        // With allowForbiddenValues: true, boolean false should still return false
        let result = evaluateIfCondition('any-value', false, { allowForbiddenValues: true }, undefined)
        expect(result).toBe(false)

        result = evaluateIfCondition('any-value', true, { allowForbiddenValues: true }, undefined)
        expect(result).toBe(true)
      })

      it('takes into account `allowForbiddenValues` for non-boolean conditions', () => {
        let result = evaluateIfCondition({ foo: 'bar' }, { properties: { foo: false } }, { allowForbiddenValues: false }, undefined)
        expect(result).toBe(false)

        result = evaluateIfCondition({ foo: 'bar' }, { properties: { foo: false } }, { allowForbiddenValues: true }, undefined)
        expect(result).toBe(true)
      })
    })
  })
})
