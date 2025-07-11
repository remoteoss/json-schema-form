import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME } from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Save newly failed tests
function saveFailedTests(failedTests) {
  fs.writeFileSync(
    path.join(__dirname, JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME),
    `${JSON.stringify(failedTests, null, 2)}\n`,
  )
}

/**
 * On top of our test cases, we're running the JSON-Schema-Test-Suite
 * (https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12).
 * However, until all features are implemented, some of the
 * tests in this suite would fail. We're using this reporter to keep track of the
 * tests that are failing (on the JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME), so we
 * can re-enable them once the feature is implemented.
 *
 * Note: The failed tests are not being saved to file every time the suite runs,
 * as this could cause for bugs to surface due to a change in the codebase.
 * The SHOULD_WRITE_FAILED_TESTS_TO_FILE constant can be set to true to write the
 * failed tests to a file (on-demand), for later consumption at the
 * json_schema_test_suite.test.js file.
 *
 */
class FailureTrackingReporter {
  constructor() {
    this.unimplementedFeatures = {}
    this.size = 0
  }

  addFailedTest(testResult) {
    const ancestors = testResult.ancestorTitles
    const testName = testResult.title

    let current = this.unimplementedFeatures

    // Navigate through ancestors to build nested structure
    for (let i = 0; i < ancestors.length - 1; i++) {
      const ancestor = ancestors[i]
      current[ancestor] = current[ancestor] || {}
      current = current[ancestor]
    }

    // Add test to the final level using last ancestor
    const lastAncestor = ancestors[ancestors.length - 1]
    current[lastAncestor] = current[lastAncestor] || []
    current[lastAncestor].push(testName)

    this.size++
  }

  onTestResult(test, testResult) {
    // Only track failures/skipped tests for json-schema-test-suite.test.ts
    if (!test.path.endsWith('json-schema-test-suite.test.ts')) {
      return
    }

    testResult.testResults.forEach((result) => {
      if (result.status === 'failed' || result.status === 'pending') {
        this.addFailedTest(result)
      }
    })
  }

  onRunComplete() {
    if (this.size > 0) {
      // eslint-disable-next-line no-console
      console.log(`JSON Schema Test Suite: Test run complete, saving ${this.size} tests to ${JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME} file so they're ignored for now and enabled later`)
      saveFailedTests(this.unimplementedFeatures)
    }
  }
}

export default FailureTrackingReporter
