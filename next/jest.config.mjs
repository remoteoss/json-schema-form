/**
 * This next version of JSON Schema Form ("V2")
 * must be tested against 2 sets ("root") of tests.
 * Note that "rootDir" is the path to this next version.
 *
 * @type {import('jest').Config['roots']}
 */
const roots = [
  // 1. The existing tests from the previous version ("V1")
  // TODO: Uncomment this once we have V1 features implemented
  // '<rootDir>/../src/tests',
  // 2. The new tests for this version
  '<rootDir>/test',
]

/**
 * Module aliases to use the same test with different source versions.
 * To learn more, see "roots" above.
 *
 * This is only needed to use V1 tests for V2 source.
 * as V2 tests are used to test V2 source only.
 *
 * @type {import('jest').Config['moduleNameMapper']}
 */
const moduleNameMapper = {
  // We use kebab-case in V2
  '^@/createHeadlessForm$': '<rootDir>/src/form',
  '^@/utils$': '<rootDir>/src/utils',
  // Avoid catch all aliases such as "^@/(.*)$".
  // Aliases should be added as needed.
  // If there are many, we will have a compat barrel file.
}

/**
 * Some tests are invalid for V2 testing.
 * For example:
 * - Buggy behaviours in V1 that are already fixed (and tested) in V2
 * - Deprecated or removed APIs
 *
 * @type {import('jest').Config['testPathIgnorePatterns']}
 */
const testPathIgnorePatterns = [
  // Nothing yet
]

/** @type {import('jest').Config} */
const config = {
  roots,
  moduleNameMapper,
  testPathIgnorePatterns,
  reporters: ['default', '<rootDir>/test/json-schema-test-suite/json-schema-test-suite-tracker.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', {
      presets: ['@babel/preset-typescript'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
}

export default config
