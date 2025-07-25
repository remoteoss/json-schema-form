'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const compare = require('./compare.js')
let sortNodes = (nodes, options, extraOptions) => {
  let nonIgnoredNodes = []
  let ignoredNodeIndices = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      sortingNode.isEslintDisabled &&
      (extraOptions == null ? void 0 : extraOptions.ignoreEslintDisabledNodes)
    ) {
      ignoredNodeIndices.push(index)
    } else {
      nonIgnoredNodes.push(sortingNode)
    }
  }
  let sortedNodes = [...nonIgnoredNodes].sort((a, b) =>
    compare.compare(a, b, options),
  )
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }
  return sortedNodes
}
exports.sortNodes = sortNodes
