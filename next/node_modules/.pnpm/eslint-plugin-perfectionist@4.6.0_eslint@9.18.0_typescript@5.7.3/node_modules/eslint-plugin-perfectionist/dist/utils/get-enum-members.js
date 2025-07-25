'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let getEnumMembers = value => {
  var _a
  return ((_a = value.body) == null ? void 0 : _a.members) ?? value.members
}
exports.getEnumMembers = getEnumMembers
