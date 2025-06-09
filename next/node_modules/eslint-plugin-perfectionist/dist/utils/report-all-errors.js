'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const sortNodesByDependencies = require('./sort-nodes-by-dependencies.js')
const createNodeIndexMap = require('./create-node-index-map.js')
const getNewlinesErrors = require('./get-newlines-errors.js')
const getGroupNumber = require('./get-group-number.js')
const reportErrors = require('./report-errors.js')
const pairwise = require('./pairwise.js')
let reportAllErrors = ({
  ignoreFirstNodeHighestBlockComment,
  sortNodesExcludingEslintDisabled,
  newlinesBetweenValueGetter,
  availableMessageIds,
  sourceCode,
  context,
  options,
  nodes,
}) => {
  let sortedNodes = sortNodesExcludingEslintDisabled(false)
  let sortedNodesExcludingEslintDisabled =
    sortNodesExcludingEslintDisabled(true)
  let nodeIndexMap = createNodeIndexMap.createNodeIndexMap(sortedNodes)
  pairwise.pairwise(nodes, (left, right) => {
    let leftNumber = options.groups
      ? getGroupNumber.getGroupNumber(options.groups, left)
      : 0
    let rightNumber = options.groups
      ? getGroupNumber.getGroupNumber(options.groups, right)
      : 0
    let leftIndex = nodeIndexMap.get(left)
    let rightIndex = nodeIndexMap.get(right)
    let indexOfRightExcludingEslintDisabled =
      sortedNodesExcludingEslintDisabled.indexOf(right)
    let messageIds = []
    let firstUnorderedNodeDependentOnRight
    if (availableMessageIds.unexpectedDependencyOrder) {
      firstUnorderedNodeDependentOnRight =
        sortNodesByDependencies.getFirstUnorderedNodeDependentOn(right, nodes)
    }
    if (
      firstUnorderedNodeDependentOnRight ||
      leftIndex > rightIndex ||
      leftIndex >= indexOfRightExcludingEslintDisabled
    ) {
      if (firstUnorderedNodeDependentOnRight) {
        messageIds.push(availableMessageIds.unexpectedDependencyOrder)
      } else {
        messageIds.push(
          leftNumber === rightNumber ||
            !availableMessageIds.unexpectedGroupOrder
            ? availableMessageIds.unexpectedOrder
            : availableMessageIds.unexpectedGroupOrder,
        )
      }
    }
    if (
      options.newlinesBetween &&
      options.groups &&
      availableMessageIds.missedSpacingBetweenMembers &&
      availableMessageIds.extraSpacingBetweenMembers
    ) {
      messageIds = [
        ...messageIds,
        ...getNewlinesErrors.getNewlinesErrors({
          options: {
            ...options,
            newlinesBetween: options.newlinesBetween,
            groups: options.groups,
          },
          missedSpacingError: availableMessageIds.missedSpacingBetweenMembers,
          extraSpacingError: availableMessageIds.extraSpacingBetweenMembers,
          newlinesBetweenValueGetter,
          rightNum: rightNumber,
          leftNum: leftNumber,
          sourceCode,
          right,
          left,
        }),
      ]
    }
    reportErrors.reportErrors({
      sortedNodes: sortedNodesExcludingEslintDisabled,
      ignoreFirstNodeHighestBlockComment,
      firstUnorderedNodeDependentOnRight,
      newlinesBetweenValueGetter,
      messageIds,
      sourceCode,
      options,
      context,
      nodes,
      right,
      left,
    })
  })
}
exports.reportAllErrors = reportAllErrors
