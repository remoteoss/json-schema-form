import merge from 'lodash/merge';
import omit from 'lodash/omit';

import { extractParametersFromNode } from './helpers';
import { supportedTypes } from './internals/fields';
import { getFieldDescription, pickXKey } from './internals/helpers';
import { buildYupSchema } from './yupSchema';
/**
 * @typedef {import('./createHeadlessForm').FieldParameters} FieldParameters
 */

/**
 * Verifies if a field is required
 * @param {Object} node - JSON schema parent node
 * @param {String} inputName - input name
 * @return {Boolean}
 */
function isFieldRequired(node, inputName) {
  // For nested properties (case of fieldset) we need to check recursively
  if (node?.required) {
    return node.required.includes(inputName);
  }

  return false;
}

/**
 * Loops recursively through fieldset fields and returns an copy version of them
 * where the required property is updated.
 *
 * @param {Array} fields - list of fields of a fieldset
 * @param {Object} property - property that relates with the list of fields
 * @returns {Object}
 */
function rebuildInnerFieldsRequiredProperty(fields, property) {
  if (property?.properties) {
    return fields.map((field) => {
      if (field.fields) {
        return {
          ...field,
          fields: rebuildInnerFieldsRequiredProperty(field.fields, property.properties[field.name]),
        };
      }
      return {
        ...field,
        required: isFieldRequired(property, field.name),
      };
    });
  }

  return fields.map((field) => ({
    ...field,
    required: isFieldRequired(property, field.name),
  }));
}

/**
 * Builds a function that updates the fields properties based on the form values and the
 * dependencies the field has on the current schema.
 * @param {FieldParameters} fieldParams - field parameters
 * @returns {Function}
 */
export function calculateConditionalProperties(fieldParams, customProperties) {
  /**
   * Runs dynamic property calculation on a field based on a conditional that has been calculated
   * @param {Boolean} isRequired - if the field is required
   * @param {Object} conditionBranch - condition branch being applied
   * @returns {Object} updated field parameters
   */
  return (isRequired, conditionBranch) => {
    // Check if the current field is conditionally declared in the schema

    const conditionalProperty = conditionBranch?.properties?.[fieldParams.name];

    if (conditionalProperty) {
      const presentation = pickXKey(conditionalProperty, 'presentation') ?? {};

      const fieldDescription = getFieldDescription(conditionalProperty, customProperties);

      const newFieldParams = extractParametersFromNode({
        ...conditionalProperty,
        ...fieldDescription,
      });

      let fieldSetFields;

      if (fieldParams.inputType === supportedTypes.FIELDSET) {
        fieldSetFields = rebuildInnerFieldsRequiredProperty(
          fieldParams.fields,
          conditionalProperty
        );
        newFieldParams.fields = fieldSetFields;
      }

      const base = {
        isVisible: true,
        required: isRequired,
        ...(presentation?.inputType && { type: presentation.inputType }),
        schema: buildYupSchema({
          ...fieldParams,
          ...newFieldParams,
          // If there are inner fields (case of fieldset) they need to be updated based on the condition
          fields: fieldSetFields,
          required: isRequired,
        }),
      };

      return omit(merge(base, presentation, newFieldParams), ['inputType']);
    }

    // If field is not conditionally declared it should be visible if it's required
    const isVisible = isRequired;

    return {
      isVisible,
      required: isRequired,
      schema: buildYupSchema({
        ...fieldParams,
        ...extractParametersFromNode(conditionBranch),
        required: isRequired,
      }),
    };
  };
}
