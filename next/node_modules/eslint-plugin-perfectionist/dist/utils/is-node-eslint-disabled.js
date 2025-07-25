'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let isNodeEslintDisabled = (node, eslintDisabledLines) =>
  eslintDisabledLines.includes(node.loc.start.line)
exports.isNodeEslintDisabled = isNodeEslintDisabled
