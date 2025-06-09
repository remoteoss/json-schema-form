'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getNewlinesBetweenOption = require('./get-newlines-between-option.js')
const getLinesBetween = require('./get-lines-between.js')
let getNewlinesErrors = ({
  newlinesBetweenValueGetter,
  missedSpacingError,
  extraSpacingError,
  sourceCode,
  rightNum,
  leftNum,
  options,
  right,
  left,
}) => {
  let newlinesBetween = getNewlinesBetweenOption.getNewlinesBetweenOption({
    nextSortingNode: right,
    sortingNode: left,
    options,
  })
  newlinesBetween =
    (newlinesBetweenValueGetter == null
      ? void 0
      : newlinesBetweenValueGetter({
          computedNewlinesBetween: newlinesBetween,
          right,
          left,
        })) ?? newlinesBetween
  if (leftNum > rightNum) {
    return []
  }
  let numberOfEmptyLinesBetween = getLinesBetween.getLinesBetween(
    sourceCode,
    left,
    right,
  )
  switch (newlinesBetween) {
    case 'ignore':
      return []
    case 'never':
      return numberOfEmptyLinesBetween > 0 ? [extraSpacingError] : []
    case 'always':
      if (numberOfEmptyLinesBetween === 0) {
        return [missedSpacingError]
      } else if (numberOfEmptyLinesBetween > 1) {
        return [extraSpacingError]
      }
  }
  return []
}
exports.getNewlinesErrors = getNewlinesErrors
