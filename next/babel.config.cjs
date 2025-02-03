/**
 * @type {import('@babel/core').TransformOptions}
 */
const options = {
  presets: [
    // ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // Type checking is already done in our build,
    // so we can use a lightweight preset.
    // - https://jestjs.io/docs/getting-started#using-typescript
    '@babel/preset-typescript',
  ],
}

module.exports = options
