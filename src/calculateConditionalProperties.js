import merge from 'lodash/merge';
import omit from 'lodash/omit';

import { extractParametersFromNode } from './helpers';
import { supportedTypes } from './internals/fields';
import { getFieldDescription, pickXKey } from './internals/helpers';
import { calculateComputedAttributes } from './jsonLogic';
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
 * Builds a function that updates the field properties based on the form values,
 * schema dependencies, and conditional logic.
 *
 * @param {Object} params - Parameters
 * @param {Object} params.fieldParams - The field attributes from the first render (root)
 * @param {Object} params.customProperties - Custom field properties from schema
 * @param {Object} params.logic - JSON-logic
 * @param {Object} params.config - Form configuration
 *
 * @returns {Function} A function that calculates conditional properties
 */
export function calculateConditionalProperties({ fieldParams, customProperties, logic, config }) {
  /**
   * @typedef {calculateConditionalPropertiesReturn}
   * @property {rootFieldAttrs} - The field attributes from the first render (root)
   * @property {newAttributes} - Attributes from the matched conditional
   */
  /**
   * Runs dynamic property calculation on a field based on a conditional that has been calculated
   *
   * @param {Object} params - Parameters
   * @param {Boolean} params.isRequired - If field is required
   * @param {Object} params.conditionBranch - Condition branch
   * @param {Object} params.formValues - Current form values
   *
   * @returns {calculateConditionalPropertiesReturn}
   */
  return ({ isRequired, conditionBranch, formValues }) => {
    // Check if the current field is conditionally declared in the schema
    // console.log('::calc (closure original)', fieldParams.description);
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

      const { computedAttributes, ...restNewFieldParams } = newFieldParams;
      const calculatedComputedAttributes = computedAttributes
        ? calculateComputedAttributes(newFieldParams, config)({ logic, formValues })
        : {};

      const jsonLogicValidations = [
        ...(fieldParams.jsonLogicValidations ?? []),
        ...(restNewFieldParams.jsonLogicValidations ?? []),
      ];

      const base = {
        isVisible: true,
        required: isRequired,
        ...(presentation?.inputType && { type: presentation.inputType }),
        ...calculatedComputedAttributes,
        ...(calculatedComputedAttributes.value
          ? { value: calculatedComputedAttributes.value }
          : { value: undefined }),
        schema: buildYupSchema(
          {
            ...fieldParams,
            ...restNewFieldParams,
            ...calculatedComputedAttributes,
            jsonLogicValidations,
            // If there are inner fields (case of fieldset) they need to be updated based on the condition
            fields: fieldSetFields,
            required: isRequired,
          },
          config,
          logic
        ),
      };

      return {
        rootFieldAttrs: fieldParams,
        newAttributes: omit(merge(base, presentation, newFieldParams), ['inputType']),
      };
    }

    // If field is not conditionally declared it should be visible if it's required
    const isVisible = isRequired;

    return {
      rootFieldAttrs: fieldParams,
      newAttributes: {
        isVisible,
        required: isRequired,
        schema: buildYupSchema({
          ...fieldParams,
          ...extractParametersFromNode(conditionBranch),
          required: isRequired,
        }),
      },
    };
  };
}
