import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema } from '../types'
import { Format } from 'json-schema-typed/draft-2020-12'

/**
 * Format validation error type
 * @description
 * According to JSON Schema 2020-12:
 * - Format validation is an annotation by default
 * - Format validation only applies to strings
 * - Unknown formats should be ignored
 * - Implementations SHOULD implement validation for standard formats
 * - Implementations MAY treat format as a no-op
 */
export type FormatValidationErrorType = 'format'

/**
 * Regular expression patterns for format validation
 * These patterns are based on JSON Schema 2020-12 specifications
 */
const PATTERNS = {
  // Date/Time patterns (RFC 3339)
  DATE_TIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/,

  // Duration (ISO 8601)
  DURATION: /^P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/,

  // Email patterns
  EMAIL:
    /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  IDN_EMAIL: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,

  // Host patterns
  HOSTNAME: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i,
  IDN_HOSTNAME: /^[^\s._-].*[^\s._-]$/,

  // IP address patterns
  IPV6_PART: /^[0-9a-f]{1,4}$/i,

  // URI/IRI patterns
  PROTOCOL: /^[a-z]+:/,
  URI_REFERENCE: /^\S*$/,

  // UUID pattern (RFC 4122)
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // JSON Pointer patterns
  JSON_POINTER: /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  JSON_POINTER_URI_FRAGMENT: /^#(?:\/(?:[\w\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  RELATIVE_JSON_POINTER: /^(?:0|[1-9]\d*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,

  // URI Template (RFC 6570)
  URI_TEMPLATE:
    /^(?:[!#$&'()*+,/:;=?@\w\-.~]|%[0-9a-f]{2}|\{[+#./;?&=,!@|]?(?:\w|%[0-9a-f]{2})+(?::[1-9]\d{0,3}|\*)?(?:,(?:\w|%[0-9a-f]{2})+(?::[1-9]\d{0,3}|\*)?)*\})*$/i,
} as const

/**
 * Built-in format validators according to JSON Schema 2020-12
 */
const formatValidationFunctions: Record<Format, (value: string) => boolean> = {
  [Format.DateTime]: value => PATTERNS.DATE_TIME.test(value),
  [Format.Date]: value => PATTERNS.DATE.test(value),
  [Format.Time]: value => PATTERNS.TIME.test(value),
  [Format.Duration]: value => PATTERNS.DURATION.test(value),
  [Format.Email]: (value) => {
    // Basic email validation with length limit (RFC 5321)
    return value.length <= 254 && PATTERNS.EMAIL.test(value)
  },
  [Format.IDNEmail]: (value) => {
    // More permissive email validation for IDN with length limit
    return value.length <= 254 && PATTERNS.IDN_EMAIL.test(value)
  },
  [Format.Hostname]: (value) => {
    if (value.length > 255) {
      return false
    }
    const labels = value.split('.')
    return labels.every(label => PATTERNS.HOSTNAME.test(label))
  },
  [Format.IDNHostname]: (value) => {
    if (value.length > 255) {
      return false
    }
    const labels = value.split('.')
    return labels.every(label => label.length <= 63 && PATTERNS.IDN_HOSTNAME.test(label))
  },
  [Format.IPv4]: (value) => {
    const parts = value.split('.')
    if (parts.length !== 4) {
      return false
    }
    return parts.every((part) => {
      const num = Number.parseInt(part, 10)
      return num >= 0 && num <= 255 && part === num.toString()
    })
  },
  [Format.IPv6]: (value) => {
    const parts = value.split(':')
    if (parts.length > 8) {
      return false
    }
    let hasDoubleColon = false
    return parts.every((part) => {
      if (part === '') {
        if (hasDoubleColon) {
          return false
        }
        hasDoubleColon = true
        return true
      }
      return PATTERNS.IPV6_PART.test(part)
    })
  },
  [Format.URI]: (value) => {
    try {
      const url = new URL(value)
      return url.protocol !== '' && PATTERNS.PROTOCOL.test(url.protocol)
    }
    catch {
      return false
    }
  },
  [Format.URIReference]: (value) => {
    try {
      if (value.startsWith('//')) {
        return PATTERNS.URI_REFERENCE.test(value.slice(2))
      }
      void new URL(value, 'http://example.com')
      return true
    }
    catch {
      return false
    }
  },
  [Format.IRI]: (value) => {
    try {
      const url = new URL(value)
      return url.protocol !== '' && PATTERNS.PROTOCOL.test(url.protocol)
    }
    catch {
      return false
    }
  },
  [Format.IRIReference]: (value) => {
    try {
      if (value.startsWith('//')) {
        return PATTERNS.URI_REFERENCE.test(value.slice(2))
      }
      void new URL(value, 'http://example.com')
      return true
    }
    catch {
      return false
    }
  },
  [Format.RegEx]: (value) => {
    try {
      void new RegExp(value, 'u')
      return true
    }
    catch {
      return false
    }
  },
  [Format.UUID]: value => PATTERNS.UUID.test(value),
  [Format.JSONPointer]: value => PATTERNS.JSON_POINTER.test(value),
  [Format.JSONPointerURIFragment]: value => PATTERNS.JSON_POINTER_URI_FRAGMENT.test(value),
  [Format.RelativeJSONPointer]: value => PATTERNS.RELATIVE_JSON_POINTER.test(value),
  [Format.URITemplate]: value => PATTERNS.URI_TEMPLATE.test(value),
}

/**
 * Validate a string value against a format
 * @param value - The string value to validate
 * @param schema - The schema to validate against
 * @param path - The path to the current field being validated
 * @returns An array of validation errors
 * @description
 * According to JSON Schema 2020-12:
 * - Format validation is an annotation by default
 * - Format validation only applies to strings
 * - Unknown formats should be ignored
 * - Implementations SHOULD implement validation for standard formats
 * - Implementations MAY treat format as a no-op
 */
export function validateFormat(
  value: string,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  const errors: ValidationError[] = []

  // Format validation only applies to strings
  if (typeof value !== 'string') {
    return errors
  }

  const validateFn = formatValidationFunctions[schema.format as Format]
  if (validateFn && !validateFn(value)) {
    errors.push({ path, validation: 'format', schema, value })
  }

  return errors
}
