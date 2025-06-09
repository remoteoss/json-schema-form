'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const matches = require('./matches.js')
let useGroups = ({ groups }) => {
  let group
  let groupsSet = new Set(groups.flat())
  let defineGroup = (value, override = false) => {
    if ((!group || override) && groupsSet.has(value)) {
      group = value
    }
  }
  let setCustomGroups = (customGroups, name, parameters = {}) => {
    if (customGroups) {
      for (let [key, pattern] of Object.entries(customGroups)) {
        if (
          Array.isArray(pattern) &&
          pattern.some(patternValue => matches.matches(name, patternValue))
        ) {
          defineGroup(key, parameters.override)
        }
        if (typeof pattern === 'string' && matches.matches(name, pattern)) {
          defineGroup(key, parameters.override)
        }
      }
    }
  }
  return {
    getGroup: () => group ?? 'unknown',
    setCustomGroups,
    defineGroup,
  }
}
exports.useGroups = useGroups
