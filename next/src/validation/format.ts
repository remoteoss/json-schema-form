import type { ValidationError } from '../form'
import type { SchemaValidationErrorType } from './schema'
import { Format } from 'json-schema-typed/draft-2020-12'
import validator from 'validator'

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
 * Built-in format validators according to JSON Schema 2020-12
 *
 * Note on IRI vs URI:
 * - IRI allows Unicode characters in both the domain and path
 * - Since validator.js doesn't directly support IRI validation,
 *   we use isURL with relaxed character constraints
 */
const formatValidationFunctions: Record<Format, (value: string) => boolean> = {
  [Format.DateTime]: value => validator.isISO8601(value, {
    strict: true,
    strictSeparator: true,
  }),
  [Format.Date]: value => validator.isISO8601(value, {
    strict: true,
    strictSeparator: true,
  }),
  // RFC 3339 time format: 23:20:50.52Z, 17:39:57-08:00
  [Format.Time]: value => validator.matches(value, /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/),
  // ISO 8601 duration
  [Format.Duration]: value => validator.matches(value, /^P(?!$)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/),
  [Format.Email]: value => validator.isEmail(value, {
    allow_utf8_local_part: false,
    require_tld: true,
    allow_ip_domain: false,
  }),
  [Format.IDNEmail]: value => validator.isEmail(value, {
    allow_utf8_local_part: true,
    require_tld: true,
    allow_ip_domain: false,
  }),
  [Format.Hostname]: value => validator.isFQDN(value, {
    require_tld: false,
    allow_underscores: false,
    allow_wildcard: false,
  }),
  [Format.IDNHostname]: value => validator.isFQDN(value, {
    require_tld: false,
    allow_underscores: true,
    allow_wildcard: false,
  }),
  [Format.IPv4]: value => validator.isIP(value, 4),
  [Format.IPv6]: value => validator.isIP(value, 6),
  [Format.URI]: value => validator.isURL(value, {
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ['http', 'https', 'ftp', 'sftp', 'mailto', 'file', 'data', 'irc'],
    allow_fragments: true,
    allow_query_components: true,
    validate_length: true,
  }),
  [Format.URIReference]: value => validator.isURL(value, {
    require_protocol: false,
    allow_protocol_relative_urls: true,
    protocols: ['http', 'https', 'ftp', 'sftp', 'mailto', 'file', 'data', 'irc'],
    allow_fragments: true,
    allow_query_components: true,
    validate_length: true,
  }),
  // For IRI validation, we use isURL but allow Unicode characters
  [Format.IRI]: (value) => {
    try {
      const url = new URL(value)
      return url.protocol !== '' && /^[a-z]+:/.test(url.protocol)
    }
    catch {
      return false
    }
  },
  [Format.IRIReference]: (value) => {
    try {
      if (value.startsWith('//')) {
        return validator.matches(value.slice(2), /^\S*$/)
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
      // Use 'u' flag for Unicode support as per JSON Schema 2020-12
      void new RegExp(value, 'u')
      return true
    }
    catch {
      return false
    }
  },
  [Format.UUID]: value => validator.isUUID(value),
  // TODO: Implement these properly once we get there (current matcher is probably not correct)
  // JSON Schema 2020-12 specifies these formats should be supported
  [Format.JSONPointer]: value => validator.matches(value, /^(?:\/(?:[^~/]|~0|~1)*)*$/),
  [Format.JSONPointerURIFragment]: value => validator.matches(value, /^#(?:\/(?:[\w\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i),
  [Format.RelativeJSONPointer]: value => validator.matches(value, /^(?:0|[1-9]\d*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/),
  // URI Template (RFC 6570)
  [Format.URITemplate]: value => validator.matches(value, /^(?:[!#$&'()*+,/:;=?@\w\-.~]|%[0-9a-f]{2}|\{[+#./;?&=,!@|]?(?:\w|%[0-9a-f]{2})+(?::[1-9]\d{0,3}|\*)?(?:,(?:\w|%[0-9a-f]{2})+(?::[1-9]\d{0,3}|\*)?)*\})*$/i),
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

  const validateFn = formatValidationFunctions[format as Format]
  if (validateFn && !validateFn(value)) {
    errors.push({
      path,
      validation: 'format' as SchemaValidationErrorType,
      message: `must be a valid ${format} format`,
    })
  }

  return errors
}
