import fs from 'node:fs'
import path from 'node:path'
import { JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME } from './constants'

export function loadJsonSchemaSuiteFailedTests(): string[] {
  try {
    const content = fs.readFileSync(path.join(__dirname, JSON_SCHEMA_SUITE_FAILED_TESTS_FILE_NAME), 'utf8')
    return JSON.parse(content).failedTests
  }
  catch (error) {
    console.error('An error occurred when loading the file with failed tests:', error)
    return []
  }
}
