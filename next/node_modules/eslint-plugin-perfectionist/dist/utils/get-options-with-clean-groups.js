'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
let getOptionsWithCleanGroups = options => ({
  ...options,
  groups: options.groups
    .filter(group => !Array.isArray(group) || group.length > 0)
    .map(group =>
      Array.isArray(group) ? getCleanedNestedGroups(group) : group,
    ),
})
let getCleanedNestedGroups = nestedGroup =>
  nestedGroup.length === 1 && nestedGroup[0] ? nestedGroup[0] : nestedGroup
exports.getOptionsWithCleanGroups = getOptionsWithCleanGroups
