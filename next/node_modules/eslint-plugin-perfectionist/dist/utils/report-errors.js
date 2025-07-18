'use strict'
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
const toSingleLine = require('./to-single-line.js')
const makeFixes = require('./make-fixes.js')
const NODE_DEPENDENT_ON_RIGHT = 'nodeDependentOnRight'
const RIGHT = 'right'
const RIGHT_GROUP = 'rightGroup'
const LEFT = 'left'
const LEFT_GROUP = 'leftGroup'
const ORDER_ERROR = `Expected "{{${RIGHT}}}" to come before "{{${LEFT}}}".`
const DEPENDENCY_ORDER_ERROR = `Expected dependency "{{${RIGHT}}}" to come before "{{${NODE_DEPENDENT_ON_RIGHT}}}".`
const GROUP_ORDER_ERROR = `Expected "{{${RIGHT}}}" ({{${RIGHT_GROUP}}}) to come before "{{${LEFT}}}" ({{${LEFT_GROUP}}}).`
const EXTRA_SPACING_ERROR = `Extra spacing between "{{${LEFT}}}" and "{{${RIGHT}}}" objects.`
const MISSED_SPACING_ERROR = `Missed spacing between "{{${LEFT}}}" and "{{${RIGHT}}}".`
let reportErrors = ({
  firstUnorderedNodeDependentOnRight,
  ignoreFirstNodeHighestBlockComment,
  newlinesBetweenValueGetter,
  sortedNodes,
  messageIds,
  sourceCode,
  context,
  options,
  nodes,
  right,
  left,
}) => {
  for (let messageId of messageIds) {
    context.report({
      fix: fixer =>
        makeFixes.makeFixes({
          ignoreFirstNodeHighestBlockComment,
          newlinesBetweenValueGetter,
          sortedNodes,
          sourceCode,
          options,
          fixer,
          nodes,
        }),
      data: {
        [NODE_DEPENDENT_ON_RIGHT]:
          firstUnorderedNodeDependentOnRight == null
            ? void 0
            : firstUnorderedNodeDependentOnRight.name,
        [RIGHT]: toSingleLine.toSingleLine(right.name),
        [LEFT]: toSingleLine.toSingleLine(left.name),
        [RIGHT_GROUP]: right.group,
        [LEFT_GROUP]: left.group,
      },
      node: right.node,
      messageId,
    })
  }
}
exports.DEPENDENCY_ORDER_ERROR = DEPENDENCY_ORDER_ERROR
exports.EXTRA_SPACING_ERROR = EXTRA_SPACING_ERROR
exports.GROUP_ORDER_ERROR = GROUP_ORDER_ERROR
exports.LEFT = LEFT
exports.MISSED_SPACING_ERROR = MISSED_SPACING_ERROR
exports.ORDER_ERROR = ORDER_ERROR
exports.RIGHT = RIGHT
exports.reportErrors = reportErrors
