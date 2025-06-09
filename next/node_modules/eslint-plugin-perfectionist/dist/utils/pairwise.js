'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const isSortable = require('./is-sortable.js')
let pairwise = (nodes, callback) => {
  if (!isSortable.isSortable(nodes)) {
    return
  }
  for (let i = 1; i < nodes.length; i++) {
    let left = nodes.at(i - 1)
    let right = nodes.at(i)
    callback(left, right, i - 1)
  }
}
exports.pairwise = pairwise
