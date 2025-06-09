'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let getCommentsBefore = ({ tokenValueToIgnoreBefore, sourceCode, node }) => {
  let commentsBefore = getCommentsBeforeNodeOrToken(sourceCode, node)
  let tokenBeforeNode = sourceCode.getTokenBefore(node)
  if (
    commentsBefore.length > 0 ||
    !tokenValueToIgnoreBefore ||
    (tokenBeforeNode == null ? void 0 : tokenBeforeNode.value) !==
      tokenValueToIgnoreBefore
  ) {
    return commentsBefore
  }
  return getCommentsBeforeNodeOrToken(sourceCode, tokenBeforeNode)
}
let getCommentsBeforeNodeOrToken = (source, node) =>
  source.getCommentsBefore(node).filter(comment => {
    let tokenBeforeComment = source.getTokenBefore(comment)
    return (
      (tokenBeforeComment == null
        ? void 0
        : tokenBeforeComment.loc.end.line) !== comment.loc.end.line
    )
  })
exports.getCommentsBefore = getCommentsBefore
