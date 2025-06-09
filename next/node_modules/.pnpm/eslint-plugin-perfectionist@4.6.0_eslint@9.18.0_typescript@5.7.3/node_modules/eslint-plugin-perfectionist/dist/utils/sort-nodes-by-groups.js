'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getGroupNumber = require('./get-group-number.js')
const sortNodes = require('./sort-nodes.js')
let sortNodesByGroups = (nodes, options, extraOptions) => {
  var _a
  let nodesByNonIgnoredGroupNumber = {}
  let ignoredNodeIndices = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled &&
        (extraOptions == null
          ? void 0
          : extraOptions.ignoreEslintDisabledNodes)) ||
      ((_a = extraOptions == null ? void 0 : extraOptions.isNodeIgnored) == null
        ? void 0
        : _a.call(extraOptions, sortingNode))
    ) {
      ignoredNodeIndices.push(index)
      continue
    }
    let groupNumber = getGroupNumber.getGroupNumber(options.groups, sortingNode)
    nodesByNonIgnoredGroupNumber[groupNumber] ??
      (nodesByNonIgnoredGroupNumber[groupNumber] = [])
    nodesByNonIgnoredGroupNumber[groupNumber].push(sortingNode)
  }
  let sortedNodes = []
  for (let groupNumber of Object.keys(nodesByNonIgnoredGroupNumber).sort(
    (a, b) => Number(a) - Number(b),
  )) {
    let compareOptions = (
      extraOptions == null ? void 0 : extraOptions.getGroupCompareOptions
    )
      ? extraOptions.getGroupCompareOptions(Number(groupNumber))
      : options
    let nodesToPush = nodesByNonIgnoredGroupNumber[Number(groupNumber)]
    if (!compareOptions) {
      sortedNodes.push(...nodesToPush)
      continue
    }
    sortedNodes.push(...sortNodes.sortNodes(nodesToPush, compareOptions))
  }
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }
  return sortedNodes
}
exports.sortNodesByGroups = sortNodesByGroups
