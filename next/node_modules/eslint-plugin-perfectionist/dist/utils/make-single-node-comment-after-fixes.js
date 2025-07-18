'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const getCommentAfter = require('./get-comment-after.js')
let makeSingleNodeCommentAfterFixes = ({
  sortedNode,
  sourceCode,
  fixer,
  node,
}) => {
  let commentAfter = getCommentAfter.getCommentAfter(sortedNode, sourceCode)
  let areNodesOnSameLine = node.loc.start.line === sortedNode.loc.end.line
  if (!commentAfter || areNodesOnSameLine) {
    return []
  }
  let fixes = []
  let tokenBefore = sourceCode.getTokenBefore(commentAfter)
  let range = [tokenBefore.range.at(1), commentAfter.range.at(1)]
  fixes.push(fixer.replaceTextRange(range, ''))
  let tokenAfterNode = sourceCode.getTokenAfter(node)
  fixes.push(
    fixer.insertTextAfter(
      (tokenAfterNode == null ? void 0 : tokenAfterNode.loc.end.line) ===
        node.loc.end.line
        ? tokenAfterNode
        : node,
      sourceCode.text.slice(...range),
    ),
  )
  return fixes
}
exports.makeSingleNodeCommentAfterFixes = makeSingleNodeCommentAfterFixes
