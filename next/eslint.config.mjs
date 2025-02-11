import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    // Build output
    'dist',

    // Dependencies
    'node_modules',

    // External test suite
    'json-schema-test-suite',
  ],
})
