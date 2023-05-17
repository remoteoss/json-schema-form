/**
 * Returns a function that converts a unit of bytes to another one. Example: convert KB to MB, or Bytes to KB.
 *
 * @param {String} from base unit
 * @param {String} to unit to be converted to
 * @returns {Function}
 */
export function convertDiskSizeFromTo(from, to) {
  const units = ['bytes', 'kb', 'mb'];

  /**
   * Convert the received value based on the from and to parameters
   *
   * @param {Number} value value to be converted
   * @returns {Number} converted value
   */
  return function convert(value) {
    return (
      (value * Math.pow(1024, units.indexOf(from.toLowerCase()))) /
      Math.pow(1024, units.indexOf(to.toLowerCase()))
    );
  };
}

/**
 * Check if a string contains HTML tags
 * @param {string} str
 * @returns {boolean}
 */
export function containsHTML(str = '') {
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Wraps a string with a span with attributes, if any.
 * @param {string} html Content to be wrapped
 * @param {Object.<string, string>} properties Object to be converted to HTML attributes
 * @returns {string}
 */
export function wrapWithSpan(html, properties = {}) {
  const attributes = Object.entries(properties)
    .reduce((acc, [key, value]) => `${acc}${key}="${value}" `, '')
    .trim();
  return `<span ${attributes}>${html}</span>`;
}

/**
 * Checks if an object contains a property with a given name.
 * This util is needed because sometimes a condition coming from the schema could be something like
 * if { const: null;
 * "properties": {
 *   "someField": {
 *     "const": null
 *   }
 * }
 *
 * And we need to check if the key exists (!!prop.const wouldn't work and this way we avoid a typeof call)
 *
 * @param {Object} object - object being evaluated
 * @param {String} propertyName - name of the property being checked
 * @returns {Boolean}
 */
export function hasProperty(object, propertyName) {
  return Object.prototype.hasOwnProperty.call(object, propertyName);
}
