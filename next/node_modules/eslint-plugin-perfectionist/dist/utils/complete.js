'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let complete = (options = {}, settings = {}, defaults = {}) => ({
  ...defaults,
  ...settings,
  ...options,
})
exports.complete = complete
