import type { ValidationError } from '../form'
import type { SchemaValidationErrorType } from './schema'

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
 * Supported format names as defined in JSON Schema 2020-12
 * @see https://json-schema.org/draft/2020-12/json-schema-validation.html#rfc.section.7
 */
export type SupportedFormat =
  // Date and Time (RFC 3339)
  | 'date-time'
  | 'date'
  | 'time'
  | 'duration'
  // Email
  | 'email'
  | 'idn-email'
  // Hostname
  | 'hostname'
  | 'idn-hostname'
  // IP Address
  | 'ipv4'
  | 'ipv6'
  // Resource Identifiers
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  // UUID
  | 'uuid'
  // Regular Expressions
  | 'regex'

// Cache compiled RegExp objects for performance
const REGEX = {
  // Date and Time (RFC 3339)
  dateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  duration: /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/,
  // Email (RFC 5322)
  email: /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  // Hostname (RFC 1123)
  hostname: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  // IP Address
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/,
  ipv6: /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/,
  // UUID
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  // Regular Expressions
  regex: (value: string) => {
    try {
      const pattern = new RegExp(value)
      return pattern instanceof RegExp
    }
    catch {
      return false
    }
  },
}

/**
 * Built-in format validators according to JSON Schema 2020-12
 * @description
 * According to JSON Schema 2020-12:
 * - Format validation is an annotation by default
 * - Format validation only applies to strings
 * - Unknown formats should be ignored
 * - Implementations SHOULD implement validation for standard formats
 * - Implementations MAY treat format as a no-op
 */
const formatValidators: Record<SupportedFormat, (value: string) => boolean> = {
  'date-time': value => REGEX.dateTime.test(value),
  'date': value => REGEX.date.test(value),
  'time': value => REGEX.time.test(value),
  'duration': value => REGEX.duration.test(value),
  'email': value => REGEX.email.test(value),
  'idn-email': value => REGEX.email.test(value), // TODO: Add proper IDN support
  'hostname': value => REGEX.hostname.test(value),
  'idn-hostname': value => REGEX.hostname.test(value), // TODO: Add proper IDN support
  'ipv4': value => REGEX.ipv4.test(value),
  'ipv6': value => REGEX.ipv6.test(value),
  'uri': (value) => {
    try {
      void new URL(value)
      return true
    }
    catch {
      return false
    }
  },
  'uri-reference': (value) => {
    try {
      void new URL(value, 'http://example.com')
      return true
    }
    catch {
      return false
    }
  },
  'iri': (value) => {
    try {
      void new URL(value)
      return true
    }
    catch {
      return false
    }
  },
  'iri-reference': (value) => {
    try {
      void new URL(value, 'http://example.com')
      return true
    }
    catch {
      return false
    }
  },
  'regex': value => REGEX.regex(value),
  'uuid': value => REGEX.uuid.test(value),
}

/**
 * Validate a string value against a format
 * @param value - The string value to validate
 * @param format - The format to validate against
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
export function validateFormat(value: string, format: string, path: string[] = []): ValidationError[] {
  const errors: ValidationError[] = []

  // Format validation only applies to strings
  if (typeof value !== 'string') {
    return errors
  }

  const validator = formatValidators[format as SupportedFormat]
  if (validator && !validator(value)) {
    errors.push({
      path,
      validation: 'format' as SchemaValidationErrorType,
      message: `must be a valid ${format} format`,
    })
  }

  return errors
}
