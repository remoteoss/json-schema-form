import type { JsfSchema } from '../../src/types'
import type { FileLike } from '../../src/validation/file'
import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'
import { errorLike } from '../test-utils'

// Helper to create a dummy file-like object
const createFile = (name: string, sizeInBytes: number): FileLike => ({ name, size: sizeInBytes })

// Common schema
const baseFileSchema: JsfSchema = {
  type: ['array', 'null'],
  items: { type: 'object' },
}

const fileSchemaWithSizeLimitKB: JsfSchema = {
  ...baseFileSchema,
  'x-jsf-presentation': {
    maxFileSize: 1024, // 1024 KB = 1MB
  },
}

const fileSchemaWithAccept: JsfSchema = {
  ...baseFileSchema,
  'x-jsf-presentation': {
    accept: '.jpg, .png, .pdf',
  },
}

const fileSchemaWithLimitAndAcceptKB: JsfSchema = {
  ...baseFileSchema,
  'x-jsf-presentation': {
    maxFileSize: 500, // 500 KB
    accept: '.jpg, .png, .pdf',
  },
}

describe('validateFile', () => {
  // --- Valid Cases ---
  it('should pass validation for null value', () => {
    const errors = validateSchema(null, baseFileSchema)
    expect(errors).toEqual([])
  })

  it('should pass validation for undefined value', () => {
    const errors = validateSchema(undefined, baseFileSchema)
    expect(errors).toEqual([])
  })

  it('should pass validation for empty array', () => {
    const errors = validateSchema([], baseFileSchema)
    expect(errors).toEqual([])
  })

  it('should pass validation for valid file array with size limit (KB)', () => {
    const value = [createFile('test.jpg', 500 * 1024)] as any[] // 500 KB file, limit 1024 KB
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    expect(errors).toEqual([])
  })

  it('should pass validation for valid file array with accept limit', () => {
    const value = [createFile('document.pdf', 100)] as any[]
    const errors = validateSchema(value, fileSchemaWithAccept)
    expect(errors).toEqual([])
  })

  it('should pass validation if SOME files have accepted format', () => {
    const value = [
      createFile('image.jpg', 100),
      createFile('document.txt', 200), // .txt is not accepted, but .jpg is
    ] as any[]
    // The logic requires only *some* file to be valid for the accept rule to pass
    const errors = validateSchema(value, fileSchemaWithAccept)
    expect(errors).toEqual([])
  })

  it('should pass validation for valid file array with both limits (KB)', () => {
    const value = [createFile('image.png', 500 * 1024)] as any[] // Exactly 500 KB
    const errors = validateSchema(value, fileSchemaWithLimitAndAcceptKB)
    expect(errors).toEqual([])
  })

  // --- Invalid Structure ---
  it('should fail validation for non-array value', () => {
    const value = { name: 'file.txt', size: 100 } // Not an array
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    // Expect type error first, as the schema expects an array but got an object
    expect(errors).toEqual([errorLike({ path: [], validation: 'type' })])
  })

  it('should pass validation for array with file objects with only name', () => {
    const value = [{ name: 'file.txt' }]
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    expect(errors).toEqual([])
  })

  it('should pass validation for array with File instances', () => {
    const value = [new File(['file contents'], 'file.txt', { type: 'text/plain' })]
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    expect(errors).toEqual([])
  })

  it('should fail validation for array with invalid file object (missing name)', () => {
    const value = [{ size: 100 }] as any[] // Cast to bypass TS check
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    expect(errors).toEqual([errorLike({ path: [], validation: 'fileStructure' })])
  })

  it('should fail validation for array with non-object item', () => {
    const value = ['file.txt'] as any[]
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB)
    expect(errors).toEqual([
      errorLike({ path: ['items', 0], validation: 'type' }),
      errorLike({ path: [], validation: 'fileStructure' }),
    ])
  })

  // --- Max File Size ---
  it('should fail validation if one file exceeds maxFileSize (KB)', () => {
    const value = [
      createFile('small.jpg', 500 * 1024), // 500 KB
      createFile('large.png', 1.5 * 1024 * 1024), // 1536 KB
    ] as any[]
    const errors = validateSchema(value, fileSchemaWithSizeLimitKB) // Limit is 1024 KB
    expect(errors).toEqual([errorLike({ path: [], validation: 'maxFileSize' })])
  })

  // --- Accept ---
  it('should fail validation if ALL files have unsupported format', () => {
    const value = [createFile('document.txt', 100), createFile('archive.zip', 200)] as any[]
    const errors = validateSchema(value, fileSchemaWithAccept)
    expect(errors).toEqual([errorLike({ path: [], validation: 'accept' })])
  })

  it('should fail validation if file has no extension when accept is defined', () => {
    const value = [createFile('image', 100)] as any[]
    const errors = validateSchema(value, fileSchemaWithAccept)
    expect(errors).toEqual([errorLike({ path: [], validation: 'accept' })])
  })

  // --- Combined ---
  it('should fail with maxFileSize if size is invalid (KB), even if format is valid', () => {
    const value = [createFile('large_valid.pdf', 600 * 1024)] as any[] // 600 KB > 500 KB limit
    const errors = validateSchema(value, fileSchemaWithLimitAndAcceptKB)
    expect(errors).toEqual([errorLike({ path: [], validation: 'maxFileSize' })])
  })

  it('should fail with accept if format is invalid, even if size is valid (KB)', () => {
    const value = [createFile('small_invalid.txt', 400 * 1024)] as any[] // 400 KB < 500 KB limit, but .txt invalid
    const errors = validateSchema(value, fileSchemaWithLimitAndAcceptKB)
    expect(errors).toEqual([errorLike({ path: [], validation: 'accept' })])
  })
})
