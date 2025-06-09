'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const isNewlinesBetweenOption = require('./is-newlines-between-option.js')
const getGroupNumber = require('./get-group-number.js')
let getNewlinesBetweenOption = ({ nextSortingNode, sortingNode, options }) => {
  let nodeGroupNumber = getGroupNumber.getGroupNumber(
    options.groups,
    sortingNode,
  )
  let nextNodeGroupNumber = getGroupNumber.getGroupNumber(
    options.groups,
    nextSortingNode,
  )
  let globalNewlinesBetweenOption = getGlobalNewlinesBetweenOption({
    newlinesBetween: options.newlinesBetween,
    nextNodeGroupNumber,
    nodeGroupNumber,
  })
  let nodeGroup = options.groups[nodeGroupNumber]
  let nextNodeGroup = options.groups[nextNodeGroupNumber]
  if (
    Array.isArray(options.customGroups) &&
    typeof nodeGroup === 'string' &&
    typeof nextNodeGroup === 'string' &&
    nodeGroup === nextNodeGroup
  ) {
    let nodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nodeGroup,
    )
    let nextNodeCustomGroup = options.customGroups.find(
      customGroup => customGroup.groupName === nextNodeGroup,
    )
    if (
      nodeCustomGroup &&
      nextNodeCustomGroup &&
      nodeCustomGroup.groupName === nextNodeCustomGroup.groupName
    ) {
      return nodeCustomGroup.newlinesInside ?? globalNewlinesBetweenOption
    }
  }
  if (nextNodeGroupNumber >= nodeGroupNumber + 2) {
    if (nextNodeGroupNumber === nodeGroupNumber + 2) {
      let groupBetween = options.groups[nodeGroupNumber + 1]
      if (isNewlinesBetweenOption.isNewlinesBetweenOption(groupBetween)) {
        return groupBetween.newlinesBetween
      }
    } else {
      if (globalNewlinesBetweenOption === 'always') {
        return 'always'
      }
      for (let i = nodeGroupNumber + 2; i < nextNodeGroupNumber; i++) {
        let groupBetween = options.groups[i]
        if (
          isNewlinesBetweenOption.isNewlinesBetweenOption(groupBetween) &&
          groupBetween.newlinesBetween !== 'never'
        ) {
          return groupBetween.newlinesBetween
        }
      }
    }
  }
  return globalNewlinesBetweenOption
}
let getGlobalNewlinesBetweenOption = ({
  nextNodeGroupNumber,
  newlinesBetween,
  nodeGroupNumber,
}) => {
  if (newlinesBetween === 'ignore') {
    return 'ignore'
  }
  if (newlinesBetween === 'never') {
    return 'never'
  }
  return nodeGroupNumber === nextNodeGroupNumber ? 'never' : 'always'
}
exports.getNewlinesBetweenOption = getNewlinesBetweenOption
