'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let validateCustomSortConfiguration = ({ alphabet, type }) => {
  if (type !== 'custom') {
    return
  }
  if (alphabet.length === 0) {
    throw new Error('`alphabet` option must not be empty')
  }
}
exports.validateCustomSortConfiguration = validateCustomSortConfiguration
