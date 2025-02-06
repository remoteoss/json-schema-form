import type { JsfSchema, SchemaValue } from '../../src/types'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { describe, expect, it } from '@jest/globals'
import { createHeadlessForm } from '../../src'

interface Test {
  description: string
  data: SchemaValue
  valid: boolean
}

interface TestSchema {
  description: string
  schema: JsfSchema
  tests: Test[]
}

expect.extend({
  toBeValid(received: JsfSchema, value: SchemaValue, valid: boolean = true) {
    const form = createHeadlessForm(received, { initialValues: value })
    const validationResult = form.handleValidation(value)
    const hasFormErrors = validationResult.formErrors !== undefined
    const pass = hasFormErrors !== valid
    return {
      pass,
      message: () => `expected ${util.inspect(value)} ${valid ? 'to' : 'not to'} be valid for ${util.inspect(received)}`,
    }
  },
})

describe.skip('JSON Schema Test Suite', () => {
  const testsDir = path.join(__dirname, '..', '..', 'json-schema-test-suite', 'tests', 'draft2020-12')
  const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.json'))

  for (const file of testFiles) {
    const testFile: TestSchema[] = JSON.parse(fs.readFileSync(path.join(testsDir, file), 'utf8'))

    for (const testSchema of testFile) {
      describe(testSchema.description, () => {
        for (const test of testSchema.tests) {
          it(test.description, () => {
            // TODO: properly extend the expect interface
            expect(testSchema.schema).toBeValid(test.data, test.valid)
          })
        }
      })
    }
  }
})
