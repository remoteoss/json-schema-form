import get from 'lodash/get';
import isNil from 'lodash/isNil';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import pick from 'lodash/pick';
import size from 'lodash/size';

import { calculateConditionalProperties } from './calculateConditionalProperties';
import {
  calculateCustomValidationProperties,
  SUPPORTED_CUSTOM_VALIDATION_FIELD_PARAMS,
} from './calculateCustomValidationProperties';
import {
  getPrefillValues,
  updateFieldsProperties,
  extractParametersFromNode,
  handleValuesChange,
} from './helpers';
import {
  inputTypeMap,
  _composeFieldCustomClosure,
  _composeFieldArbitraryClosure,
  supportedTypes,
  getInputType,
} from './internals/fields';
import { pickXKey } from './internals/helpers';
import { calculateComputedAttributes, createValidationChecker } from './jsonLogic';
import { buildYupSchema } from './yupSchema';

// Some type definitions (to be migrated into .d.ts file or TS Interfaces)
/**
 * @typedef {Object} ParserFields
 * @typedef {Object} YupErrors
 * @typedef {Object} FieldValues
 * @property {Object[]} fields - Fields to be use by an input
 * @property {function(): void} validationSchema - Deprecated: A validation schema for Formik. (Use handleValidation instead)
 * @property {function(FieldValues): YupErrors} handleValidation - Given field values, mutates the fields UI, and return Yup errors.
 */

/**
 * @typedef {'text'|'number'|'select'|'file'|'radio'|'group-array'|'email'|'date'|'checkbox'|'fieldset'} InputType
 * @typedef {'string'|'boolean'|'object'|'array'|null} JsonType

* */

/**
 * @typedef {Object} FieldParameters
 * @property {InputType} inputType - type of form input that the field represents
 * @property {JsonType} jsonType - native json type
 * @property {String} name - field name
 * @property {String} [description] - field description
 * @property {Boolean} required - indicates if the field is required
 * @property {Boolean} [readOnly] - indicates if the field is read-only
 * @property {Function} [calculateConditionalProperties] - function that updates field parameters
 * @property {Boolean} [multiple] - wether the field accepts multiple values
 * @property {String} [accept] - if inputType is file the accepted file types can be supplied in a comma separated string
 */

/**
 * @typedef {Object} JsfConfig
 * @property {Object} [config.initialValues] - Initial values to evaluate the form against
 * @property {Boolean} [config.strictInputType] - Disabled by default. When enabled, presentation.inputType is required.
 * @property {Object} [config.customProperties] - Object of fields with custom attributes
 * @property {Function|String} config.customProperties[].description - Override description for FieldParameters
 * @property {*} config.customProperties[].* - Any other attribute is included in the FieldParameters
 * @property {Object} config.inputTypes[].errorMessage.* - Custom error messages by each error type. eg errorMessage: { required: 'Cannot be empty' }

*/

/**
 * @typedef {Object} FieldCustomization
 * @property {Function} [Component] - the custom component to be applied to the field
 * @property {Function} [description] - a custom component that will be rendered in the field. This component receives
 * the JSON-schema field description as a prop.
 */

/**
 * @typedef {Object.<string, FieldCustomization>} CustomProperties - custom field properties (maps field names to a field customization)
 */

function sortByOrderOrPosition(a, b, order) {
  if (order) {
    return order.indexOf(a.name) - order.indexOf(b.name);
  }
  // Fallback to deprecated position
  return a.position - b.position;
}

function removeInvalidAttributes(fields) {
  return omit(fields, ['items', 'maxFileSize', 'isDynamic']);
}

/**
 * Handles a JSON schema node property by building the field parameters for that
 * property name (field name)
 *
 * @param {String} name - property key (field name)
 * @param {Object} fieldProperties - field properties
 * @param {String[]} required - required fields
 *
 * @returns {FieldParameters}
 */
function buildFieldParameters(name, fieldProperties, required = [], config = {}, logic) {
  const { position } = pickXKey(fieldProperties, 'presentation') ?? {};
  let fields;

  const inputType = getInputType(fieldProperties, config.strictInputType, name);

  if (inputType === supportedTypes.FIELDSET) {
    // eslint-disable-next-line no-use-before-define
    fields = getFieldsFromJSONSchema(
      fieldProperties,
      {
        customProperties: get(config, `customProperties.${name}.customProperties`, {}),
        parentID: name,
      },
      logic
    );
  }

  const result = {
    name,
    inputType,
    jsonType: fieldProperties.type,
    type: inputType, // @deprecated in favor of inputType,
    required: required?.includes(name) ?? false,
    fields,
    position,
    ...extractParametersFromNode(fieldProperties),
  };

  return omitBy(result, isNil);
}

/**
 * Converts a JSON schema's properties into a list of field parameters
 *
 * @param {Object} node - JSON schema node
 * @param {Object} node.properties - Properties of the schema node
 * @param {String[]} node.required - List of required fields
 * @returns {FieldParameters[]} list of FieldParameters
 */
function convertJSONSchemaPropertiesToFieldParameters(
  { properties, required, 'x-jsf-order': order },
  config = {}
) {
  const sortFields = (a, b) => sortByOrderOrPosition(a, b, order);

  // Gather fields represented at the root of the node , sort them by
  // their position and then remove the position property (since it's no longer needed)
  return Object.entries(properties)
    .filter(([, value]) => typeof value === 'object')
    .map(([key, value]) => buildFieldParameters(key, value, required, config))
    .sort(sortFields)
    .map(({ position, ...fieldParams }) => fieldParams);
}

/**
 * Checks which fields have dependencies (dynamic behavior based on the form state) and marks them as such
 *
 * @param {FieldParameters[]} fieldsParameters - list of field parameters
 * @param {Object} node - JSON schema node
 */
function applyFieldsDependencies(fieldsParameters, node) {
  if (node?.then) {
    fieldsParameters
      .filter(
        ({ name }) =>
          node.then?.properties?.[name] ||
          node.then?.required?.includes(name) ||
          node.else?.properties?.[name] ||
          node.else?.required?.includes(name)
      )
      .forEach((property) => {
        property.isDynamic = true;
      });

    applyFieldsDependencies(fieldsParameters, node.then);
  }

  if (node?.anyOf) {
    fieldsParameters
      .filter(({ name }) => node.anyOf.some(({ required }) => required?.includes(name)))
      .forEach((property) => {
        property.isDynamic = true;
      });

    applyFieldsDependencies(fieldsParameters, node.then);
  }

  if (node?.allOf) {
    node.allOf.forEach((condition) => {
      applyFieldsDependencies(fieldsParameters, condition);
    });
  }

  if (node?.['x-jsf-logic']) {
    applyFieldsDependencies(fieldsParameters, node['x-jsf-logic']);
  }
}

/**
 * Returns the custom properties for a field (if there are any)
 * @param {FieldParameters} fieldParams - field parameters
 * @param {JsfConfig} config - parser config
 * @returns
 */
function getCustomPropertiesForField(fieldParams, config) {
  return config?.customProperties?.[fieldParams.name];
}

/**
 * Create field object using a compose function.
 * If the fields has any customizations, it uses the _composeFieldExtra fn, otherwise it uses the inputTypeMap match
 * @param {FieldParameters} fieldParams
 * @param {Boolean} [hasCustomizations]
 * @returns {Object}
 */
function getComposeFunctionForField(fieldParams, hasCustomizations) {
  const composeFn =
    inputTypeMap[fieldParams.inputType] || _composeFieldArbitraryClosure(fieldParams.inputType);

  if (hasCustomizations) {
    return _composeFieldCustomClosure(composeFn);
  }
  return composeFn;
}

/**
 * Create field object using a compose function
 * @param {FieldParameters} fieldParams - field parameters
 * @param {JsfConfig} config - parser config
 * @param {Object} scopedJsonSchema - the matching JSON schema
 * @param {Object} logic - logic used for validation json-logic
 * @returns {Object} field object
 */
function buildField(fieldParams, config, scopedJsonSchema, logic) {
  const customProperties = getCustomPropertiesForField(fieldParams, config);
  const composeFn = getComposeFunctionForField(fieldParams, !!customProperties);

  const yupSchema = buildYupSchema(fieldParams, config, logic);
  const calculateConditionalFieldsClosure =
    fieldParams.isDynamic &&
    calculateConditionalProperties({ fieldParams, customProperties, logic, config });

  const calculateCustomValidationPropertiesClosure = calculateCustomValidationProperties(
    fieldParams,
    customProperties
  );

  const getComputedAttributes =
    Object.keys(fieldParams.computedAttributes).length > 0 &&
    calculateComputedAttributes(fieldParams, config);

  const hasCustomValidations =
    !!customProperties &&
    size(pick(customProperties, SUPPORTED_CUSTOM_VALIDATION_FIELD_PARAMS)) > 0;

  const finalFieldParams = {
    // invalid attribute cleanup
    ...removeInvalidAttributes(fieldParams),
    // calculateConditionalProperties function if needed
    ...(!!calculateConditionalFieldsClosure && {
      calculateConditionalProperties: calculateConditionalFieldsClosure,
    }),
    // calculateCustomValidationProperties function if needed
    ...(hasCustomValidations && {
      calculateCustomValidationProperties: calculateCustomValidationPropertiesClosure,
    }),
    ...(getComputedAttributes && { getComputedAttributes }),
    // field customization properties
    ...(customProperties && { fieldCustomization: customProperties }),
    // base schema
    schema: yupSchema(),
    scopedJsonSchema,
  };

  return composeFn(finalFieldParams);
}

/**
 * Builds fields represented in the JSON-schema
 *
 * @param {Object} scopedJsonSchema - The json schema for this scope/layer, as it's recursive through fieldsets.
 * @param {JsfConfig} config - JSON-schema-form config
 * @returns {ParserFields} ParserFields
 */
function getFieldsFromJSONSchema(scopedJsonSchema, config, logic) {
  if (!scopedJsonSchema) {
    // NOTE: other type of verifications might be needed.
    return [];
  }

  const fieldParamsList = convertJSONSchemaPropertiesToFieldParameters(scopedJsonSchema, config);

  applyFieldsDependencies(fieldParamsList, scopedJsonSchema);

  const fields = [];

  fieldParamsList.forEach((fieldParams) => {
    if (fieldParams.inputType === 'group-array') {
      const groupArrayItems = convertJSONSchemaPropertiesToFieldParameters(fieldParams.items);
      const groupArrayFields = groupArrayItems.map((groupArrayItem) => {
        groupArrayItem.nameKey = groupArrayItem.name;
        const customProperties = null; // getCustomPropertiesForField(fieldParams, config); // TODO later support in group-array
        const composeFn = getComposeFunctionForField(groupArrayItem, !!customProperties);
        return composeFn(groupArrayItem);
      });

      fieldParams.nameKey = fieldParams.name;

      fieldParams.nthFieldGroup = {
        name: fieldParams.name,
        label: fieldParams.label,
        description: fieldParams.description,
        fields: () => groupArrayFields,
        addFieldText: fieldParams.addFieldText,
      };

      buildField(fieldParams, config, scopedJsonSchema, logic).forEach((groupField) => {
        fields.push(groupField);
      });
    } else {
      fields.push(buildField(fieldParams, config, scopedJsonSchema, logic));
    }
  });

  return fields;
}

/**
 * Generates the Headless form based on the provided JSON schema
 *
 * @param {Object} jsonSchema - JSON Schema
 * @param {JsfConfig} customConfig - Config
 */
export function createHeadlessForm(jsonSchema, customConfig = {}) {
  const config = {
    strictInputType: true,
    ...customConfig,
  };

  try {
    const logic = createValidationChecker(jsonSchema);
    const fields = getFieldsFromJSONSchema(jsonSchema, config, logic);

    const handleValidation = handleValuesChange(fields, jsonSchema, config, logic);

    updateFieldsProperties(
      fields,
      getPrefillValues(fields, config.initialValues),
      jsonSchema,
      logic
    );

    return {
      fields,
      handleValidation,
      isError: false,
    };
  } catch (error) {
    console.error('JSON Schema invalid!', error);
    return {
      fields: [],
      isError: true,
      error,
    };
  }
}
