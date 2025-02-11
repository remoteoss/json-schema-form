import type { NonBooleanJsfSchema } from '../../src/types'
import { describe, expect, it } from '@jest/globals'
import { validateString } from '../../src/validation/string'

/**
 * Tests for format validation according to JSON Schema 2020-12
 */
describe('format validation', () => {
  describe('date-time format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'date-time',
    }

    it('should pass for valid date-time', () => {
      expect(validateString('2024-02-06T12:00:00Z', schema)).toHaveLength(0)
      expect(validateString('2024-02-06T12:00:00+01:00', schema)).toHaveLength(0)
      expect(validateString('2024-02-06T12:00:00.123Z', schema)).toHaveLength(0)
    })

    it('should fail for invalid date-time', () => {
      const errors = validateString('not-a-date-time', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid date-time format',
      })
    })

    it('should pass for non-string values', () => {
      expect(validateString(123, schema)).toHaveLength(0)
      expect(validateString(undefined, schema)).toHaveLength(0)
    })
  })

  describe('email format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'email',
    }

    it('should pass for valid email', () => {
      expect(validateString('user@example.com', schema)).toHaveLength(0)
      expect(validateString('user.name+tag@example.co.uk', schema)).toHaveLength(0)
      expect(validateString('very.common@example.com', schema)).toHaveLength(0)
      expect(validateString('disposable.style.email.with+symbol@example.com', schema)).toHaveLength(0)
      expect(validateString('other.email-with-hyphen@example.com', schema)).toHaveLength(0)
    })

    it('should fail for invalid email', () => {
      const errors = validateString('not-an-email', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid email format',
      })
    })

    it('should fail for invalid email formats', () => {
      const invalidEmails = [
        'Abc.example.com', // No @ character
        'A@b@c@example.com', // Multiple @ characters
        'just"not"right@example.com', // Quoted strings in local part
        'this is"not\allowed@example.com', // Spaces, quotes in local part
        'this\\ still\\"not\\\\allowed@example.com', // Escaped characters in local part
      ]

      invalidEmails.forEach((email) => {
        const errors = validateString(email, schema)
        expect(errors).toHaveLength(1)
        expect(errors[0].validation).toBe('format')
      })
    })
  })

  describe('hostname format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'hostname',
    }

    it('should pass for valid hostname', () => {
      expect(validateString('example.com', schema)).toHaveLength(0)
      expect(validateString('sub.example.com', schema)).toHaveLength(0)
    })

    it('should fail for invalid hostname', () => {
      const errors = validateString('not_a_hostname!', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid hostname format',
      })
    })
  })

  describe('ipv4 format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'ipv4',
    }

    it('should pass for valid IPv4', () => {
      expect(validateString('192.168.0.1', schema)).toHaveLength(0)
      expect(validateString('255.255.255.0', schema)).toHaveLength(0)
    })

    it('should fail for invalid IPv4', () => {
      const errors = validateString('256.1.2.3', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid ipv4 format',
      })
    })
  })

  describe('uuid format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'uuid',
    }

    it('should pass for valid UUID', () => {
      expect(validateString('123e4567-e89b-12d3-a456-426614174000', schema)).toHaveLength(0)
    })

    it('should fail for invalid UUID', () => {
      const errors = validateString('not-a-uuid', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid uuid format',
      })
    })
  })

  describe('uri format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'uri',
    }

    it('should pass for valid URI', () => {
      expect(validateString('https://example.com', schema)).toHaveLength(0)
      expect(validateString('http://example.com/path?query=1', schema)).toHaveLength(0)
    })

    it('should fail for invalid URI', () => {
      const errors = validateString('not-a-uri', schema)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toMatchObject({
        validation: 'format',
        message: 'must be a valid uri format',
      })
    })
  })

  describe('unknown format', () => {
    const schema: NonBooleanJsfSchema = {
      type: 'string',
      format: 'unknown-format',
    }

    it('should pass for any value with unknown format', () => {
      expect(validateString('any value', schema)).toHaveLength(0)
      expect(validateString('123', schema)).toHaveLength(0)
      expect(validateString('', schema)).toHaveLength(0)
    })
  })
})
