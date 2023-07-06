import get from 'lodash/get';
import isNil from 'lodash/isNil';
import omit from 'lodash/omit';
import omitBy from 'lodash/omitBy';
import set from 'lodash/set';
import { lazy } from 'yup';

import { supportedTypes, getInputType } from './internals/fields';
import { pickXKey } from './internals/helpers';
import { processJSONLogicNode } from './jsonLogic';
import { checkIfConditionMatches } from './nodeProcessing/checkIfConditionMatches';
import { containsHTML, hasProperty, wrapWithSpan } from './utils';
import { buildCompleteYupSchema, buildYupSchema } from './yupSchema';

/**
 * @typedef {import('./createHeadlessForm').FieldParameters} FieldParameters
 * @typedef {import('./createHeadlessForm').FieldValues} FieldValues
 * @typedef {import('./createHeadlessForm').YupErrors} YupErrors
 * @typedef {import('./createHeadlessForm').JsfConfig} JsfConfig
 */

function hasType(type, typeName) {
  return Array.isArray(type)
    ? type.includes(typeName) // eg ["string", "null"] (optional field)
    : type === typeName; // eg "string"
}

/**
 * Returns the field with the provided name
 * @param {String} fieldName - name of the field
 * @param {Object[]} fields - form fields
 * @returns
 */
export function getField(fieldName, fields) {
  return fields.find(({ name }) => name === fieldName);
}

/**
 * Builds a Yup schema based on the provided field and validates it against the supplied value
 * @param {Object} field
 * @param {any} value
 * @returns
 */
export function validateFieldSchema(field, value, validations) {
  const validator = buildYupSchema(field, undefined, validations);
  return validator().isValidSync(value);
}

/**
 * Compares a form value with a `const` value from the JSON-schema. It does so by comparing the string version
 * of both values to ensure that there are no type mismatches.
 *
 * @param {any} formValue - current form value
 * @param {any} schemaValue - value specified in the schema
 * @returns {Boolean}
 */
export function compareFormValueWithSchemaValue(formValue, schemaValue) {
  // If the value is a number, we can use it directly, otherwise we need to
  //  fallback to undefined since JSON-schemas empty values come represented as null
  const currentPropertyValue =
    typeof schemaValue === 'number' ? schemaValue : schemaValue || undefined;
  // We're using the stringified version of both values since numeric values from forms come represented as Strings.
  // By doing this, we're sure that we're comparing the same type.
  return String(formValue) === String(currentPropertyValue);
}

/**
 * Checks if the provided field has a value (array with positive length or truthy value)
 *
 * @param {String|number|Array} fieldValue form field value
 * @return {Boolean}
 */
export function isFieldFilled(fieldValue) {
  return Array.isArray(fieldValue) ? fieldValue.length > 0 : !!fieldValue;
}

/**
 * Finds first dependency that matches the current state of the form
 * @param {[Object]} nodes - JSON schema nodes that the current field depends on
 * @return {Object}
 */
export function findFirstAnyOfMatch(nodes, formValues) {
  // if no match is found, consider the first node as the fallback
  return (
    nodes.find(({ required }) =>
      required?.some((fieldName) => isFieldFilled(formValues[fieldName]))
    ) || nodes[0]
  );
}

/**
 * Get initial values for sub fields within fieldsets
 * @param {Object} field The form field
 * @param {String=} parentFieldKeyPath The path to the parent field using dot-notation
 * @returns {Object} The initial values for a fieldset
 */
function getPrefillSubFieldValues(field, defaultValues, parentFieldKeyPath) {
  let initialValue = defaultValues ?? {};
  let fieldKeyPath = field.name;

  if (parentFieldKeyPath) {
    fieldKeyPath = fieldKeyPath ? `${parentFieldKeyPath}.${fieldKeyPath}` : parentFieldKeyPath;
  }

  const subFields = field.fields;

  if (Array.isArray(subFields)) {
    const subFieldValues = {};

    subFields.forEach((subField) => {
      Object.assign(
        subFieldValues,
        getPrefillSubFieldValues(subField, initialValue[field.name], fieldKeyPath)
      );
    });

    if (field.inputType === supportedTypes.FIELDSET && field.valueGroupingDisabled) {
      Object.assign(initialValue, subFieldValues);
    } else {
      initialValue[field.name] = subFieldValues;
    }
  } else {
    // getDefaultValues and getPrefillSubFieldValues have a circluar dependency, resulting in one having to be used before defined.
    // As function declarations are hoisted this should not be a problem.
    // eslint-disable-next-line no-use-before-define
    initialValue = getPrefillValues([field], initialValue);
  }

  return initialValue;
}

export function getPrefillValues(fields, initialValues = {}) {
  // loop over fields array
  // if prop does not exit in the initialValues object,
  // pluck off the name and value props and add it to the initialValues object;

  fields.forEach((field) => {
    const fieldName = field.name;

    switch (field.type) {
      case supportedTypes.GROUP_ARRAY: {
        initialValues[fieldName] = initialValues[fieldName]?.map((subFieldValues) =>
          getPrefillValues(field.fields(), subFieldValues)
        );
        break;
      }
      case supportedTypes.FIELDSET: {
        const subFieldValues = getPrefillSubFieldValues(field, initialValues);
        Object.assign(initialValues, subFieldValues);
        break;
      }

      default: {
        if (!initialValues[fieldName]) {
          initialValues[fieldName] = field.default;
        }
        break;
      }
    }
  });

  return initialValues;
}

/**
 * Updates field properties based on the current JSON-schema node and the required fields
 *
 * @param {Object} field - field object
 * @param {Set} requiredFields - required fields at the current point in the schema
 * @param {Object} node - JSON-schema node
 * @returns
 */
function updateField(field, requiredFields, node, formValues, validations) {
  // If there was an error building the field, it might not exist in the form even though
  // it can be mentioned in the schema so we return early in that case
  if (!field) {
    return;
  }

  const fieldIsRequired = requiredFields.has(field.name);

  // Update visibility
  if (node.properties && hasProperty(node.properties, field.name)) {
    // Field visibility can be controlled via the "properties" object:
    // - if the field is marked as "false", it should be removed from the form
    // - otherwise ("true" or object stating updated properties) it should be visible in the form
    field.isVisible = !!node.properties[field.name];
  }

  // If field is required, it needs to be visible
  if (fieldIsRequired) {
    field.isVisible = true;
  }

  const updateValues = (fieldValues) =>
    Object.entries(fieldValues).forEach(([key, value]) => {
      // some values (eg "schema") are a function, so we need to call it here
      field[key] = typeof value === 'function' ? value() : value;

      if (key === 'value') {
        // The value of the field should not be driven by the json-schema,
        // unless it's a read-only field
        // If the readOnly property has changed, use that updated value,
        // otherwise use the start value of the property
        const readOnlyPropertyWasUpdated = typeof fieldValues.readOnly !== 'undefined';
        const isReadonlyByDefault = field.readOnly;
        const isReadonly = readOnlyPropertyWasUpdated ? fieldValues.readOnly : isReadonlyByDefault;

        // Needs field.type check because otherwise checkboxes will have an initial
        // value of "true" when they should be not checked. !8755 for full context
        // TODO: to find a better solution here
        if (!isReadonly && (value === null || field.inputType === 'checkbox')) {
          // Note: doing an early return does not work, we need to reset the value
          // so that formik takes charge of setting the value correctly
          field.value = undefined;
        }
      }
    });

  // If field has a calculateConditionalProperties closure, run it and update the field properties
  if (field.calculateConditionalProperties) {
    const newFieldValues = field.calculateConditionalProperties(fieldIsRequired, node);
    updateValues(newFieldValues);
  }

  if (field.calculateCustomValidationProperties) {
    const newFieldValues = field.calculateCustomValidationProperties(
      fieldIsRequired,
      node,
      formValues
    );
    updateValues(newFieldValues);
  }

  if (field.caclulateComputedAttributes) {
    const computedFieldValues = field.caclulateComputedAttributes({
      field,
      isRequired: fieldIsRequired,
      node,
      formValues,
      validations,
    });
    updateValues(computedFieldValues);
  }
}

/**
 * Processes a JSON schema node by:
 * - checking which fields are required (and adding them to a returned set)
 * - (if there's an "if" conditional) checking which branch should be processed further
 * - (if there's an "anyOf" operation) updating the items accordingly
 * - (if there's an "allOf" operation) processing each field recursively
 * - updating field parameters when needed
 *
 * @param {Object} node - JSON schema node
 * @param {Object} formValues - form stater
 * @param {Object[]} formFields - array of form fields
 * @param {Set} accRequired - set of required field names gathered by traversing the tree
 * @returns {Object}
 */
export function processNode({
  node,
  formValues,
  formFields,
  accRequired = new Set(),
  validations,
}) {
  // Set initial required fields
  const requiredFields = new Set(accRequired);

  // Go through the node properties definition and update each field accordingly
  Object.keys(node.properties ?? []).forEach((fieldName) => {
    const field = getField(fieldName, formFields);
    updateField(field, requiredFields, node, formValues, validations);
  });

  // Update required fields based on the `required` property and mutate node if needed
  node.required?.forEach((fieldName) => {
    requiredFields.add(fieldName);
    updateField(getField(fieldName, formFields), requiredFields, node, formValues, validations);
  });

  if (node.if) {
    const matchesCondition = checkIfConditionMatches(node, formValues, formFields, validations);
    // BUG HERE (unreleated) - what if it matches but doesn't has a then,
    // it should do nothing, but instead it jumps to node.else when it shouldn't.
    if (matchesCondition && node.then) {
      const { required: branchRequired } = processNode({
        node: node.then,
        formValues,
        formFields,
        accRequired: requiredFields,
        validations,
      });

      branchRequired.forEach((field) => requiredFields.add(field));
    } else if (node.else) {
      const { required: branchRequired } = processNode({
        node: node.else,
        formValues,
        formFields,
        accRequired: requiredFields,
        validations,
      });
      branchRequired.forEach((field) => requiredFields.add(field));
    }
  }

  if (node.anyOf) {
    const firstMatchOfAnyOf = findFirstAnyOfMatch(node.anyOf, formValues);
    firstMatchOfAnyOf.required?.forEach((fieldName) => {
      requiredFields.add(fieldName);
    });

    node.anyOf.forEach(({ required = [] }) => {
      required.forEach((fieldName) => {
        const field = getField(fieldName, formFields);
        updateField(field, requiredFields, node, formValues, validations);
      });
    });
  }

  if (node.allOf) {
    node.allOf
      .map((allOfNode) =>
        processNode({
          node: allOfNode,
          formValues,
          formFields,
          accRequired: requiredFields,
          validations,
        })
      )
      .forEach(({ required: allOfItemRequired }) => {
        allOfItemRequired.forEach(requiredFields.add, requiredFields);
      });
  }

  if (node.properties) {
    Object.entries(node.properties).forEach(([name, nestedNode]) => {
      const inputType = getInputType(nestedNode);
      if (inputType === supportedTypes.FIELDSET) {
        // It's a fieldset, which might contain scoped conditions
        processNode({
          node: nestedNode,
          formValues: formValues[name] || {},
          formFields: getField(name, formFields).fields,
          validations,
        });
      }
    });
  }

  if (node['x-jsf-logic']) {
    const { required: requiredFromLogic } = processJSONLogicNode({
      node: node['x-jsf-logic'],
      parentNode: node,
      formValues,
      formFields,
      accRequired: requiredFields,
      validations,
    });
    requiredFromLogic.forEach((field) => requiredFields.add(field));
  }

  return {
    required: requiredFields,
  };
}

/**
 * Clears field value if the field is removed from the form
 * Note: we're doing this in order to avoid sending old values if a user filled a field that later
 * is hidden from the form.
 * @param {Object[]} fields - field collection
 * @param {Object} formValues - form state
 */
function clearValuesIfNotVisible(fields, formValues) {
  fields.forEach(({ isVisible = true, name, inputType, fields: nestedFields }) => {
    if (!isVisible) {
      // TODO I (Sandrina) think this doesn't work. I didn't find any test covering this scenario. Revisit later.
      formValues[name] = null;
    }
    if (inputType === supportedTypes.FIELDSET && nestedFields && formValues[name]) {
      clearValuesIfNotVisible(nestedFields, formValues[name]);
    }
  });
}
/**
 * Updates form fields properties based on the current form state and the JSON schema rules
 *
 * @param {Object[]} fields - list of fields from createHeadlessForm
 * @param {Object} formValues - current values of the form
 * @param {Object} jsonSchema - JSON schema object
 */
export function updateFieldsProperties(fields, formValues, jsonSchema, validations) {
  if (!jsonSchema?.properties) {
    return;
  }
  processNode({ node: jsonSchema, formValues, formFields: fields, validations });
  clearValuesIfNotVisible(fields, formValues);
}

const notNullOption = (opt) => opt.const !== null;

function flatPresentation(item) {
  return Object.entries(item).reduce((newItem, [key, value]) => {
    if (key === 'x-jsf-presentation') {
      return {
        ...newItem,
        ...value,
      };
    }
    return {
      ...newItem,
      [key]: value,
    };
  }, {});
}

function getFieldOptions(node, presentation) {
  function convertToOptions(nodeOptions) {
    return nodeOptions.filter(notNullOption).map(({ title, const: cons, ...item }) => ({
      label: title,
      value: cons,
      ...flatPresentation(item),
    }));
  }

  /** @deprecated - takes precendence in case a JSON Schema still has deprecated options */
  if (presentation.options) {
    return presentation.options;
  }

  // it's similar to inputType=radio
  if (node.oneOf) {
    // Do not do if(hasType("string")) because a JSON Schema does not need it
    // necessarily to be considered a valid json schema.
    return convertToOptions(node.oneOf);
  }

  // it's similar to inputType=select multiple
  if (node.items?.anyOf) {
    return convertToOptions(node.items.anyOf);
  }

  return null;
}

/**
 * Extracts relevant field parameters from a JSON-schema node
 *
 * @param {Object} schemaNode - JSON-schema node
 * @returns {FieldParameters}
 */
export function extractParametersFromNode(schemaNode) {
  if (!schemaNode) {
    return {};
  }

  const presentation = pickXKey(schemaNode, 'presentation') ?? {};
  const errorMessage = pickXKey(schemaNode, 'errorMessage') ?? {};
  const requiredValidations = schemaNode['x-jsf-requiredValidations'];
  const computedAttributes = schemaNode['x-jsf-computedAttributes'];

  const node = omit(schemaNode, ['x-jsf-presentation', 'presentation']);

  const description = presentation?.description || node.description;
  const statementDescription = containsHTML(presentation.statement?.description)
    ? wrapWithSpan(presentation.statement.description, { class: 'jsf-statement' })
    : presentation.statement?.description;

  return omitBy(
    {
      label: node.title,
      readOnly: node.readOnly,
      ...(node.deprecated && {
        deprecated: {
          description: presentation.deprecated?.description,
          // @TODO/@IDEA These might be useful down the road :thinking:
          // version: presentation.deprecated.version, // e.g. "1.1"
          // replacement: presentation.deprecated.replacement, // e.g. ['contract_duration_type']
        },
      }),
      pattern: node.pattern,
      options: getFieldOptions(node, presentation),
      items: node.items,
      maxLength: node.maxLength,
      minLength: node.minLength,
      minimum: node.minimum,
      maximum: node.maximum,
      maxFileSize: node.maxFileSize, // @deprecated in favor of presentation.maxFileSize
      default: node.default,
      // Checkboxes conditions
      // — For checkboxes that only accept one value (string)
      ...(presentation?.inputType === 'checkbox' && { checkboxValue: node.const }),
      // - For checkboxes with boolean value
      ...(presentation?.inputType === 'checkbox' &&
        node.type === 'boolean' && {
          // true is what describes this checkbox as a boolean, regardless if its required or not
          checkboxValue: true,
        }),
      ...(hasType(node.type, 'array') && {
        multiple: true,
      }),

      // Handle [name].presentation
      ...presentation,
      requiredValidations,
      computedAttributes,
      description: containsHTML(description)
        ? wrapWithSpan(description, {
            class: 'jsf-description',
          })
        : description,
      extra: containsHTML(presentation.extra)
        ? wrapWithSpan(presentation.extra, { class: 'jsf-extra' })
        : presentation.extra,
      statement: presentation.statement && {
        ...presentation.statement,
        description: statementDescription,
      },
      // Support scoped conditions (fieldsets)
      if: node.if,
      then: node.then,
      else: node.else,
      anyOf: node.anyOf,
      allOf: node.allOf,
      errorMessage,
    },
    isNil
  );
}

/**
 * Convert Yup errors mapped to the fields
 * @example { name: "Required field.", age: "Must be bigger than 5." }
 * note: This was copied from Formik source code: https://github.com/jaredpalmer/formik/blob/b9cc2536a1edb9f2d69c4cd20ecf4fa0f8059ade/packages/formik/src/Formik.tsx
 */
export function yupToFormErrors(yupError) {
  if (!yupError) {
    return yupError;
  }

  const errors = {};

  if (yupError.inner) {
    if (yupError.inner.length === 0) {
      return set(errors, yupError.path, yupError.message);
    }
    yupError.inner.forEach((err) => {
      if (!get(errors, err.path)) {
        set(errors, err.path, err.message);
      }
    });
  }
  return errors;
}

/**
 * High order function to update the fields and validate them based on given values.
 * Validate fields with Yup lazy.
 * @param {Object[]} fields
 * @param {Object} jsonSchema
 * @param {JsfConfig} config - jsf config
 * @returns {Function(values: Object): { YupError: YupObject, formErrors: Object }} Callback that returns Yup errors <YupObject>
 */
export const handleValuesChange = (fields, jsonSchema, config, validations) => (values) => {
  updateFieldsProperties(fields, values, jsonSchema, validations);

  const lazySchema = lazy(() => buildCompleteYupSchema(fields, config, validations));
  let errors;

  try {
    lazySchema.validateSync(values, {
      abortEarly: false,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      errors = err;
    } else {
      /* eslint-disable-next-line no-console */
      console.warn(`Warning: An unhandled error was caught during validationSchema`, err);
    }
  }

  return {
    yupError: errors,
    formErrors: yupToFormErrors(errors),
  };
};
