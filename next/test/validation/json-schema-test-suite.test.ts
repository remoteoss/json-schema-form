import type { JsfSchema, SchemaValue } from '../../src/types'
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { describe, expect, it } from '@jest/globals'
import { validateSchema } from '../../src/validation/schema'
import { loadJsonSchemaSuiteFailedTests } from './helpers'

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
    const errors = validateSchema(value, received)
    const pass = errors.length === 0
    return {
      pass,
      message: () => `expected ${util.inspect(value)} ${valid ? 'to' : 'not to'} be valid for ${util.inspect(received)}`,
    }
  },
})

const testsToSkip = loadJsonSchemaSuiteFailedTests()

/**
 * This test suite is running the JSON-Schema-Test-Suite (https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12).
 * We can't run the whole suite immediately as the 'next' json-schema-form version
 * is still under development. Until all features are implemented, some of the
 * tests in this suite would fail. Because of that, we're skipping the tests that
 * are failing, and we'll re-enable them once the feature is implemented.
 *
 * Note: For this version to be considered "Done", no tests from this suite
 * should be skipped.
 */
describe('JSON Schema Test Suite', () => {
  const testsDir = path.join(__dirname, '..', '..', 'json-schema-test-suite', 'tests', 'draft2020-12')
  const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.json'))

  for (const file of testFiles) {
    const testFile: TestSchema[] = JSON.parse(fs.readFileSync(path.join(testsDir, file), 'utf8'))

    const runTestIfFeatureImplemented = (testName: string, testFn: () => void) => {
      const shouldRun = !testsToSkip.includes(testName)

      if (shouldRun) {
        it(testName, testFn)
      }
      else {
        // Skipping test as the feature being tested is not implemented yet`
        it.skip(testName, testFn)
      }
    }

    for (const testSchema of testFile) {
      describe(testSchema.description, () => {
        for (const test of testSchema.tests) {
          // Tests that will run only if they previously failed
          runTestIfFeatureImplemented(`JSON Schema Test Suite ${testSchema.description} ${test.description}`, () => {
            // TODO: properly extend the expect interface
            expect(testSchema.schema).toBeValid(test.data, test.valid)
          })
        }
      })
    }
  }
})
