import type { ValidationError, ValidationErrorPath } from '../errors'
import type { NonBooleanJsfSchema, SchemaValue } from '../types'
import { isObjectValue } from './util'

// Represents a file-like object, either a browser native File or a plain object.
// Both must have name (string) and size (number) properties.
export type FileLike = (File & { name: string, size: number }) | { name: string, size: number }

/**
 * Validates file-specific constraints (maxFileSize, accept).
 *
 * The value is expected to be `null`, `undefined`, or an array of `FileLike` objects.
 * Each `FileLike` object must have `name` (string) and `size` (number) properties.
 *
 * @param value - The value to validate.
 * @param schema - The schema object, potentially containing 'x-jsf-presentation' with
 *                 'maxFileSize' (in KB) and/or 'accept' (comma-separated string).
 * @param path - The path to the current field in the validation context.
 * @returns An array of validation errors, empty if validation passes.
 */
export function validateFile(
  value: SchemaValue,
  schema: NonBooleanJsfSchema,
  path: ValidationErrorPath = [],
): ValidationError[] {
  // 1. Check the overall structure: Value must be null, undefined, or an array.
  if (value !== null && value !== undefined && !Array.isArray(value)) {
    // This case should typically be caught by `validateType` in `schema.ts` first, but we can add a safeguard here.
    return [{ path, validation: 'type' }] // Expects an array (or null/undefined)
  }

  // If value is null, undefined, or an empty array, no further file validation needed.
  if (value === null || value === undefined || value.length === 0) {
    return []
  }

  // 2. Check structure of array items: Each item must be a FileLike object.
  const isStructureValid = value.every(
    file => isObjectValue(file) && typeof file.name === 'string' && typeof file.size === 'number',
  )

  if (!isStructureValid) {
    return [{ path, validation: 'fileStructure' }]
  }

  // Now we know value is a valid FileLike[] with at least one item.
  const files = value as FileLike[]
  const presentation = schema['x-jsf-presentation']

  // 3. Validate maxFileSize (presentation.maxFileSize is expected in KB)
  if (typeof presentation?.maxFileSize === 'number') {
    const maxSizeInBytes = presentation.maxFileSize * 1024 // Convert KB from schema to Bytes
    // Check if *any* file exceeds the limit.
    const isAnyFileTooLarge = files.some(file => file.size > maxSizeInBytes)

    if (isAnyFileTooLarge) {
      return [{ path, validation: 'maxFileSize' }]
    }
  }

  // 4. Validate accepted file formats (presentation.accept is comma-separated string)
  if (typeof presentation?.accept === 'string' && presentation.accept.trim() !== '') {
    const acceptedFormats = presentation.accept
      .toLowerCase()
      .split(',')
      .map((f: string) => f.trim())
      .filter((f: string) => f)
      // Normalize formats (handle leading dots)
      .map((f: string) => (f.startsWith('.') ? f : `.${f}`))

    if (acceptedFormats.length > 0) {
      // Check if *at least one* file has an accepted format.
      const isAnyFileFormatAccepted = files.some((file) => {
        const nameLower = file.name.toLowerCase()
        const extension = nameLower.includes('.') ? `.${nameLower.split('.').pop()}` : ''
        return extension !== '' && acceptedFormats.includes(extension)
      })

      // Fail only if *none* of the files have an accepted format.
      if (!isAnyFileFormatAccepted) {
        return [{ path, validation: 'accept' }]
      }
    }
  }

  // If all checks passed
  return []
}
