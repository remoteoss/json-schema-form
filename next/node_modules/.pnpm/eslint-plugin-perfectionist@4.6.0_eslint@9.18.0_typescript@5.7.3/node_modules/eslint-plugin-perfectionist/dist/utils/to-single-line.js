'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let toSingleLine = string => string.replaceAll(/\s{2,}/gu, ' ').trim()
exports.toSingleLine = toSingleLine
