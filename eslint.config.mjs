import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    'test/v0-baseline-test-results.json',
    'v0/**',
    'scripts/**',
    'json-schema-test-suite/**',
  ],
  markdown: false,
  modules: false,
  rules: {
    curly: ['error', 'all'],
  },
})
