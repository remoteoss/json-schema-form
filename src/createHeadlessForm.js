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
function buildFieldParameters(name, fieldProperties, required = [], config = {}) {
  const { position } = pickXKey(fieldProperties, 'presentation') ?? {};
  let fields;
  console.log(':: 🏗', name);

  const inputType = getInputType(fieldProperties, config.strictInputType, name);

  if (inputType === supportedTypes.FIELDSET) {
    // eslint-disable-next-line no-use-before-define
    console.log(':: 🏗🔻');
    fields = getFieldsFromJSONSchema(fieldProperties, {
      customProperties: get(config, `customProperties.${name}`, {}),
    });
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
  console.log(':: 🔀 convert');
  const sortFields = (a, b) => sortByOrderOrPosition(a, b, order);

  // Gather fields represented at the root of the node , sort them by
  // their position and then remove the position property (since it's no longer needed)
  return Object.entries(properties)
    .filter(([, value]) => typeof value === 'object')
    .map(([key, value]) => buildFieldParameters(key, value, required, config))
    .sort(sortFields)
    .map(({ position, ...fieldParams }) => fieldParams);
}

function markAndLookInside(field, nodePathField) {
  console.log(':: ⛳️ Dynamic', field.name);
  field.isDynamic = true;

  // Check nested fields too (Fieldset)
  // Do not check inputType === fieldset because it might be an arbitrary one
  if (nodePathField && field.jsonType === 'object') {
    console.log(':: ⛳️ 🔻');

    field.fields.forEach((subField) => {
      const nodePathSubField = nodePathField.properties?.[subField.name];
      if (nodePathSubField) {
        markAndLookInside(subField, nodePathSubField);
      }
    });
  }
}

function markConditionalFields(fields, node) {
  fields.forEach((field) => {
    const name = field.name;
    const thenPathField = node.then?.properties?.[name];
    const thenIsRequired = node.then?.required?.includes(name);

    if (thenPathField || thenIsRequired) {
      markAndLookInside(field, thenPathField);
    }

    const elsePathFields = node.else?.properties?.[name];
    const elseIsRequired = node.else?.required?.includes(name);

    if (elsePathFields || elseIsRequired) {
      markAndLookInside(field, elsePathFields);
    }
  });
}

/**
 * Checks which fields have dependencies (dynamic behavior based on the form state) and marks them as such
 *
 * @param {FieldParameters[]} fieldsParameters - list of field parameters
 * @param {Object} node - JSON schema conditional Node -
 */
function markFieldsInConditionals(fieldsParameters, node) {
  if (node.then || node.else) {
    // Mark conditional nested fields (eg fieldsets)
    markConditionalFields(fieldsParameters, node);

    // Search in nested conditionals (if > then > if > ...)
    markFieldsInConditionals(fieldsParameters, node.then);
  }

  if (node?.anyOf) {
    fieldsParameters
      .filter(({ name }) => node.anyOf.some(({ required }) => required?.includes(name)))
      .forEach((property) => {
        property.isDynamic = true;
      });

    markFieldsInConditionals(fieldsParameters, node.then);
  }

  if (node?.allOf) {
    node.allOf.forEach((condition) => {
      markFieldsInConditionals(fieldsParameters, condition);
    });
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
 * @returns {Object} field object
 */
function buildFieldDynamic(fieldParams, config, scopedJsonSchema) {
  const customProperties = getCustomPropertiesForField(fieldParams, config);
  const composeFn = getComposeFunctionForField(fieldParams, !!customProperties);

  const yupSchema = buildYupSchema(fieldParams, config);
  const calculateConditionalFieldsClosure =
    fieldParams.isDynamic && calculateConditionalProperties(fieldParams, customProperties);

  console.log(':: 🔮', fieldParams.name, fieldParams.isDynamic);
  const calculateCustomValidationPropertiesClosure = calculateCustomValidationProperties(
    fieldParams,
    customProperties
  );

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
function getFieldsFromJSONSchema(scopedJsonSchema, config) {
  if (!scopedJsonSchema) {
    // NOTE: other type of verifications might be needed.
    return [];
  }

  const fieldParamsList = convertJSONSchemaPropertiesToFieldParameters(scopedJsonSchema, config);

  markFieldsInConditionals(fieldParamsList, scopedJsonSchema);

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

      buildFieldDynamic(fieldParams, config, scopedJsonSchema).forEach((groupField) => {
        fields.push(groupField);
      });
    } else if (fieldParams.inputType === 'fieldset') {
      let field = buildFieldDynamic(fieldParams, config, scopedJsonSchema);
      const subFields = fieldParams.fields.map((subField) =>
        buildFieldDynamic(subField, config, scopedJsonSchema.properties[fieldParams.name])
      );
      fields.push({ ...field, fields: subFields });
    } else {
      fields.push(buildFieldDynamic(fieldParams, config, scopedJsonSchema));
    }
  });

  return fields;
}

/**
 * Generates the Headless form based on the provided JSON schema
 *

🍝 Data Flow of createHeadlessForm() 🍝

createHeadlessForm
  🥢 getFieldsFromJSONSchema
    🔀 convertJSONSchemaPropertiesToFieldParameters
      🏗 buildFieldParameters
        (if fieldset) 🥢 getFieldsFromJSONSchema
    ⛳️ markFieldsInConditionals
    (if group-array) 🔀 convertJSONSchemaPropertiesToFieldParameters
    🔮 buildFieldDynamic
      (if group-array) 🔮 buildFieldDynamic
      🧠 calculateConditionalProperties

Thoughts:
1. The fn names can be improved.
2. Fields inside Fieldsets never go through ⛳️ and 🧠. Bug or code-smell?
3. So much pasta... convert, build, mark, build, calculate.
4. So much implicit mutation. Nothing against mutation, it's just sneaky.
5. We definitely can simplify the mental model of JSF.
  - convertHelper (eg title -> label)
  - build-base (root) - cache it.
  - build-blocks (conditionals) - cache it.
  - search-conditionals - cache them to avoid iterations on every change.
  - compose then/else - eg [...base, ...block].
    - this solves the issue with redundant else "readOnly: false".
    - no need for internal calculateConditionalProperties 
  - todo: solve issue with re-renders. new Instance?

  ----
  handleValidation
    🌪 processNode


 * @param {Object} jsonSchema - JSON Schema
 * @param {JsfConfig} customConfig - Config
 */
export function createHeadlessForm(jsonSchema, customConfig = {}) {
  const config = {
    strictInputType: true,
    ...customConfig,
  };

  try {
    const fields = getFieldsFromJSONSchema(jsonSchema, config);

    const handleValidation = handleValuesChange(fields, jsonSchema, config);

    updateFieldsProperties(fields, getPrefillValues(fields, config.initialValues), jsonSchema);

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
