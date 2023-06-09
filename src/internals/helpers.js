/**
 * @typedef {Object} Node
 * @typedef {Object} CustomProperties
 * @typedef {Object} FieldDescription
 */

import merge from 'lodash/fp/merge';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';

/**
 * Shorthand to lookup for keys with `x-jsf-*` preffix.
 * @param {Object} node - JSON-schema node
 * @param {"presentation"|"errorMessage"} key - JSON-schema key name
 * @example
 *  pickKey(properties, 'presentation')
 *  is the same as properties["x-jsf-presentation"]
 * @returns {Object}
 */
export function pickXKey(node, key) {
  const deprecatedKeys = ['presentation', 'errorMessage'];

  return get(node, `x-jsf-${key}`, deprecatedKeys.includes(key) ? node?.[key] : undefined);
}

/**
 * Use the field description from CustomProperties if it exists.
 * @param {Node} node - Json-schema node
 * @param {CustomProperties} customProperties
 * @return {FieldDescription}
 */
export function getFieldDescription(node, customProperties = {}) {
  const nodeDescription = node?.description
    ? {
        description: node.description,
      }
    : {};

  const customDescription = customProperties?.description
    ? {
        description: isFunction(customProperties.description)
          ? customProperties.description(node?.description, {
              ...node,
              ...customProperties,
            })
          : customProperties.description,
      }
    : {};

  const nodePresentation = pickXKey(node, 'presentation');

  const presentation = !isEmpty(nodePresentation) && {
    presentation: { ...nodePresentation, ...customDescription },
  };

  return merge(nodeDescription, { ...customDescription, ...presentation });
}
