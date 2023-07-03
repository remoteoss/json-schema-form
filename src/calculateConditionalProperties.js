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
 * @param {String} field - input name
 * @return {Boolean}
 */
function isFieldRequired(node, field) {
  return (
    // Check base root required
    field.scopedJsonSchema?.required?.includes(field.name) ||
    // Check conditional required
    node?.required?.includes(field.name)
  );
}

/**
 * Loops recursively through fieldset fields and returns an copy version of them
 * where the required property is updated.
 *
 * @param {Array} fields - list of fields of a fieldset
 * @param {Object} property - property that relates with the list of fields
 * @returns {Object}
 */
function rebuildFieldset(fields, property) {
  if (property?.properties) {
    return fields.map((field) => {
      const propertyConditionals = property.properties[field.name];
      if (!propertyConditionals) {
        return field;
      }

      const newFieldParams = extractParametersFromNode(propertyConditionals);

      if (field.fields) {
        return {
          ...field,
          ...newFieldParams,
          fields: rebuildFieldset(field.fields, propertyConditionals),
        };
      }
      return {
        ...field,
        ...newFieldParams,
        required: isFieldRequired(property, field),
      };
    });
  }

  return fields.map((field) => ({
    ...field,
    required: isFieldRequired(property, field),
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
        fieldSetFields = rebuildFieldset(fieldParams.fields, conditionalProperty);
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
