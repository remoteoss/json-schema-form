import type { ValidationError } from '../form'
import type { SchemaValidationErrorType } from './schema'

/**
 * Format validation error type
 * @description
 * According to JSON Schema 2020-12, format validation is an annotation by default.
 * It should only be treated as an assertion when explicitly configured.
 */
export type FormatValidationErrorType = 'format'

/**
 * Supported format names as defined in JSON Schema 2020-12
 */
export type SupportedFormat =
  | 'date-time'
  | 'date'
  | 'time'
  | 'duration'
  | 'email'
  | 'idn-email'
  | 'hostname'
  | 'idn-hostname'
  | 'ipv4'
  | 'ipv6'
  | 'uri'
  | 'uri-reference'
  | 'iri'
  | 'iri-reference'
  | 'uuid'

// Cache compiled RegExp objects for performance
const REGEX = {
  dateTime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  duration: /^P(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/,
  // RFC 5322 compliant email regex
  email: /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  // RFC 1123 compliant hostname regex
  hostname: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})$/,
  ipv6: /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(?:ffff(?::0{1,4})?:)?(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d)|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1?\d)?\d)\.){3}(?:25[0-5]|(?:2[0-4]|1?\d)?\d))$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
}

/**
 * Built-in format validators
 * @description
 * According to JSON Schema 2020-12, implementations SHOULD implement validation
 * for these formats, but MAY choose to implement validation as a no-op.
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
  'uuid': value => REGEX.uuid.test(value),
}

/**
 * Validate a string value against a format
 * @param value - The string value to validate
 * @param format - The format to validate against
 * @returns An array of validation errors
 * @description
 * According to JSON Schema 2020-12:
 * - Format validation is an annotation by default
 * - Format validation only applies to strings
 * - Unknown formats should be ignored
 * - Implementations SHOULD implement validation for standard formats
 * - Implementations MAY treat format as a no-op
 * @example
 * ```ts
 * const errors = validateFormat('not-an-email', 'email')
 * console.log(errors) // [{ path: [], validation: 'format', message: 'must be a valid email format' }]
 * ```
 */
export function validateFormat(value: string, format: string): ValidationError[] {
  const errors: ValidationError[] = []

  // Format validation only applies to strings
  if (typeof value !== 'string') {
    return errors
  }

  const validator = formatValidators[format as SupportedFormat]
  if (validator && !validator(value)) {
    errors.push({
      path: [],
      validation: 'format' as SchemaValidationErrorType,
      message: `must be a valid ${format} format`,
    })
  }

  return errors
}
