'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let isNewlinesBetweenOption = groupOption =>
  typeof groupOption === 'object' && 'newlinesBetween' in groupOption
exports.isNewlinesBetweenOption = isNewlinesBetweenOption
