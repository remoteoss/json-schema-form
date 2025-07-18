'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let getSettings = (settings = {}) => {
  if (!settings['perfectionist']) {
    return {}
  }
  let getInvalidOptions = object => {
    let allowedOptions = /* @__PURE__ */ new Set([
      'partitionByComment',
      'partitionByNewLine',
      'specialCharacters',
      'ignorePattern',
      'ignoreCase',
      'alphabet',
      'locales',
      'order',
      'type',
    ])
    return Object.keys(object).filter(key => !allowedOptions.has(key))
  }
  let perfectionistSettings = settings['perfectionist']
  let invalidOptions = getInvalidOptions(perfectionistSettings)
  if (invalidOptions.length > 0) {
    throw new Error(
      `Invalid Perfectionist setting(s): ${invalidOptions.join(', ')}`,
    )
  }
  return settings['perfectionist']
}
exports.getSettings = getSettings
