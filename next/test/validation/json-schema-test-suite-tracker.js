import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME } from './constants.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Change this value to true to write the failed tests to a file, for
// later consumption at the json_schema_test_suite.test.js file.
const SHOULD_WRITE_FAILED_TESTS_TO_FILE = false

// Save newly failed tests
function saveFailedTests(failedTests) {
  fs.writeFileSync(path.join(__dirname, JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME), JSON.stringify({ failedTests }, null, 2))
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
    this.failedTests = new Set()
  }

  onTestResult(test, testResult) {
    testResult.testResults.forEach((result) => {
      if (result.status === 'failed') {
        this.failedTests.add(result.fullName || result.title)
      }
    })
  }

  onRunComplete() {
    if (SHOULD_WRITE_FAILED_TESTS_TO_FILE) {
      saveFailedTests(Array.from(this.failedTests))
    }
  }
}

export default FailureTrackingReporter
