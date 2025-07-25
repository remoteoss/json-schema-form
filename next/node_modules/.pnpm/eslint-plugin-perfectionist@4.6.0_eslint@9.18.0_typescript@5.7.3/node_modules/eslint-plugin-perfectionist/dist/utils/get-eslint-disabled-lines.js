'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getEslintDisabledRules = require('./get-eslint-disabled-rules.js')
let getEslintDisabledLines = props => {
  let { sourceCode, ruleName } = props
  let returnValue = []
  let lineRulePermanentlyDisabled = null
  for (let comment of sourceCode.getAllComments()) {
    let eslintDisabledRules = getEslintDisabledRules.getEslintDisabledRules(
      comment.value,
    )
    let includesRule =
      (eslintDisabledRules == null ? void 0 : eslintDisabledRules.rules) ===
        'all' ||
      (eslintDisabledRules == null
        ? void 0
        : eslintDisabledRules.rules.includes(ruleName))
    if (!includesRule) {
      continue
    }
    switch (
      eslintDisabledRules == null
        ? void 0
        : eslintDisabledRules.eslintDisableDirective
    ) {
      case 'eslint-disable-next-line':
        returnValue.push(comment.loc.end.line + 1)
        continue
      case 'eslint-disable-line':
        returnValue.push(comment.loc.start.line)
        continue
      case 'eslint-disable':
        lineRulePermanentlyDisabled ??
          (lineRulePermanentlyDisabled = comment.loc.start.line)
        break
      case 'eslint-enable':
        if (!lineRulePermanentlyDisabled) {
          continue
        }
        returnValue.push(
          ...createArrayFromTo(
            lineRulePermanentlyDisabled + 1,
            comment.loc.start.line,
          ),
        )
        lineRulePermanentlyDisabled = null
        break
    }
  }
  return returnValue
}
let createArrayFromTo = (i, index) =>
  Array.from({ length: index - i + 1 }, (_, item) => i + item)
exports.getEslintDisabledLines = getEslintDisabledLines
