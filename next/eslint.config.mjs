import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: ['test/v0-baseline-test-results.json'],
  rules: {
    curly: ['error', 'all'],
  },
})
