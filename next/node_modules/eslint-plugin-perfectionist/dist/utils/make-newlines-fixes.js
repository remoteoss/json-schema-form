'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getNewlinesBetweenOption = require('./get-newlines-between-option.js')
const getLinesBetween = require('./get-lines-between.js')
const getNodeRange = require('./get-node-range.js')
let makeNewlinesFixes = ({
  newlinesBetweenValueGetter,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}) => {
  let fixes = []
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    let sortingNode = nodes.at(i)
    let nextSortingNode = nodes.at(i + 1)
    let sortedSortingNode = sortedNodes.at(i)
    let nextSortedSortingNode = sortedNodes.at(i + 1)
    let newlinesBetween = getNewlinesBetweenOption.getNewlinesBetweenOption({
      nextSortingNode: nextSortedSortingNode,
      sortingNode: sortedSortingNode,
      options,
    })
    newlinesBetween =
      (newlinesBetweenValueGetter == null
        ? void 0
        : newlinesBetweenValueGetter({
            computedNewlinesBetween: newlinesBetween,
            right: nextSortedSortingNode,
            left: sortedSortingNode,
          })) ?? newlinesBetween
    if (newlinesBetween === 'ignore') {
      continue
    }
    let currentNodeRange = getNodeRange.getNodeRange({
      node: sortingNode.node,
      sourceCode,
    })
    let nextNodeRangeStart = getNodeRange
      .getNodeRange({
        node: nextSortingNode.node,
        sourceCode,
      })
      .at(0)
    let rangeToReplace = [currentNodeRange.at(1), nextNodeRangeStart]
    let textBetweenNodes = sourceCode.text.slice(
      currentNodeRange.at(1),
      nextNodeRangeStart,
    )
    let linesBetweenMembers = getLinesBetween.getLinesBetween(
      sourceCode,
      sortingNode,
      nextSortingNode,
    )
    let rangeReplacement
    if (newlinesBetween === 'never' && linesBetweenMembers !== 0) {
      rangeReplacement = getStringWithoutInvalidNewlines(textBetweenNodes)
    }
    if (newlinesBetween === 'always' && linesBetweenMembers !== 1) {
      rangeReplacement = addNewlineBeforeFirstNewline(
        linesBetweenMembers > 1
          ? getStringWithoutInvalidNewlines(textBetweenNodes)
          : textBetweenNodes,
      )
      let isOnSameLine =
        linesBetweenMembers === 0 &&
        sortingNode.node.loc.end.line === nextSortingNode.node.loc.start.line
      if (isOnSameLine) {
        rangeReplacement = addNewlineBeforeFirstNewline(rangeReplacement)
      }
    }
    if (rangeReplacement) {
      fixes.push(fixer.replaceTextRange(rangeToReplace, rangeReplacement))
    }
  }
  return fixes
}
let getStringWithoutInvalidNewlines = value =>
  value.replaceAll(/\n\s*\n/gu, '\n').replaceAll(/\n+/gu, '\n')
let addNewlineBeforeFirstNewline = value => {
  let firstNewlineIndex = value.indexOf('\n')
  if (firstNewlineIndex === -1) {
    return `${value}
`
  }
  return `${value.slice(0, firstNewlineIndex)}
${value.slice(firstNewlineIndex)}`
}
exports.makeNewlinesFixes = makeNewlinesFixes
