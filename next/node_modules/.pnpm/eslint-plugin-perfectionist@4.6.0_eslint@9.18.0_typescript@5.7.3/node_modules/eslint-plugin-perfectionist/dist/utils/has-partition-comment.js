'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const isPartitionComment = require('./is-partition-comment.js')
let hasPartitionComment = ({ partitionByComment, comments }) =>
  comments.some(comment =>
    isPartitionComment.isPartitionComment({
      partitionByComment,
      comment,
    }),
  )
exports.hasPartitionComment = hasPartitionComment
