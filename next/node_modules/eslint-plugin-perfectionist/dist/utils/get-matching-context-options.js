'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const matches = require('./matches.js')
let getMatchingContextOptions = ({ contextOptions, nodeNames }) =>
  contextOptions.filter(options => {
    var _a
    let allNamesMatchPattern =
      (_a = options.useConfigurationIf) == null
        ? void 0
        : _a.allNamesMatchPattern
    return (
      !allNamesMatchPattern ||
      nodeNames.every(nodeName =>
        matches.matches(nodeName, allNamesMatchPattern),
      )
    )
  })
exports.getMatchingContextOptions = getMatchingContextOptions
