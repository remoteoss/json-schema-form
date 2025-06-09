'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const makeCommentAfterFixes = require('./make-comment-after-fixes.js')
const makeNewlinesFixes = require('./make-newlines-fixes.js')
const makeOrderFixes = require('./make-order-fixes.js')
let makeFixes = ({
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
  sortedNodes,
  sourceCode,
  options,
  fixer,
  nodes,
}) => {
  let orderFixes = makeOrderFixes.makeOrderFixes({
    ignoreFirstNodeHighestBlockComment,
    sortedNodes,
    sourceCode,
    options,
    nodes,
    fixer,
  })
  let commentAfterFixes = makeCommentAfterFixes.makeCommentAfterFixes({
    sortedNodes,
    sourceCode,
    nodes,
    fixer,
  })
  if (
    commentAfterFixes.length > 0 ||
    !(options == null ? void 0 : options.groups) ||
    !options.newlinesBetween
  ) {
    return [...orderFixes, ...commentAfterFixes]
  }
  let newlinesFixes = makeNewlinesFixes.makeNewlinesFixes({
    options: {
      ...options,
      newlinesBetween: options.newlinesBetween,
      groups: options.groups,
    },
    newlinesBetweenValueGetter,
    sortedNodes,
    sourceCode,
    fixer,
    nodes,
  })
  return [...orderFixes, ...newlinesFixes]
}
exports.makeFixes = makeFixes
