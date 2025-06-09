'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const matches = require('../../utils/matches.js')
let doesCustomGroupMatch = props => {
  if ('anyOf' in props.customGroup) {
    return props.customGroup.anyOf.some(subgroup =>
      doesCustomGroupMatch({ ...props, customGroup: subgroup }),
    )
  }
  if (
    'elementNamePattern' in props.customGroup &&
    props.customGroup.elementNamePattern
  ) {
    let matchesElementNamePattern = matches.matches(
      props.elementName,
      props.customGroup.elementNamePattern,
    )
    if (!matchesElementNamePattern) {
      return false
    }
  }
  if (
    'elementValuePattern' in props.customGroup &&
    props.customGroup.elementValuePattern
  ) {
    let matchesElementValuePattern = matches.matches(
      props.elementValue,
      props.customGroup.elementValuePattern,
    )
    if (!matchesElementValuePattern) {
      return false
    }
  }
  return true
}
exports.doesCustomGroupMatch = doesCustomGroupMatch
