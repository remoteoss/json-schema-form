import jsonLogic from 'json-logic-js';

import {
  checkIfConditionMatchesProperties,
  checkIfMatchesValidationsAndComputedValues,
} from './checkIfConditionMatches';
import { processNode } from './helpers';
import { buildYupSchema } from './yupSchema';

/**
 * Parses the JSON schema to extract the json-logic rules and returns an object
 * containing the validation scopes, functions to retrieve the scopes, and evaluate the
 * validation rules.
 *
 * @param {Object} schema - JSON schema node
 * @returns {Object} An object containing:
 * - scopes {Map} - A Map of the validation scopes (with IDs as keys)
 * - getScope {Function} - Function to retrieve a scope by name/ID
 */
export function createValidationChecker(schema) {
  const scopes = new Map();

  function createScopes(jsonSchema, key = 'root') {
    const sampleEmptyObject = buildSampleEmptyObject(schema);
    scopes.set(key, createValidationsScope(jsonSchema));
    Object.entries(jsonSchema?.properties ?? {})
      .filter(([, property]) => property.type === 'object' || property.type === 'array')
      .forEach(([key, property]) => {
        if (property.type === 'array') {
          createScopes(property.items, `${key}[]`);
        } else {
          createScopes(property, key);
        }
      });

    validateInlineRules(jsonSchema, sampleEmptyObject);
  }

  createScopes(schema);

  return {
    scopes,
    getScope(name = 'root') {
      return scopes.get(name);
    },
  };
}

/**
 * Creates a validation scope object for a schema.
 *
 * Builds maps of validations and computed values defined in the schema's
 * x-jsf-logic section. Includes functions to evaluate the rules.
 *
 * @param {Object} schema - The JSON schema
 * @returns {Object} The validation scope object containing:
 * - validationMap - Map of validation rules
 * - computedValuesMap - Map of computed value rules
 * - validate {Function} - Function to evaluate a validation rule
 * - applyValidationRuleInCondition {Function} - Evaluate a validation rule used in a condition
 * - applyComputedValueInField {Function} - Evaluate a computed value rule for a field
 * - applyComputedValueRuleInCondition {Function} - Evaluate a computed value rule used in a condition
 */
function createValidationsScope(schema) {
  const validationMap = new Map();
  const computedValuesMap = new Map();

  const logic = schema?.['x-jsf-logic'] ?? {
    validations: {},
    computedValues: {},
  };

  const validations = Object.entries(logic.validations ?? {});
  const computedValues = Object.entries(logic.computedValues ?? {});
  const sampleEmptyObject = buildSampleEmptyObject(schema);

  validations.forEach(([id, validation]) => {
    if (!validation.rule) {
      throw Error(`[json-schema-form] json-logic error: Validation "${id}" has missing rule.`);
    }

    checkRuleIntegrity(validation.rule, id, sampleEmptyObject);

    validationMap.set(id, validation);
  });

  computedValues.forEach(([id, computedValue]) => {
    if (!computedValue.rule) {
      throw Error(`[json-schema-form] json-logic error: Computed value "${id}" has missing rule.`);
    }

    checkRuleIntegrity(computedValue.rule, id, sampleEmptyObject);

    computedValuesMap.set(id, computedValue);
  });

  function validate(rule, values) {
    return jsonLogic.apply(
      rule,
      replaceUndefinedValuesWithNulls({ ...sampleEmptyObject, ...values })
    );
  }

  return {
    validationMap,
    computedValuesMap,
    validate,
    applyValidationRuleInCondition(id, values) {
      const validation = validationMap.get(id);
      return validate(validation.rule, values);
    },
    applyComputedValueInField(id, values, fieldName) {
      const validation = computedValuesMap.get(id);
      if (validation === undefined) {
        throw Error(
          `[json-schema-form] json-logic error: Computed value "${id}" doesn't exist in field "${fieldName}".`
        );
      }
      return validate(validation.rule, values);
    },
    applyComputedValueRuleInCondition(id, values) {
      const validation = computedValuesMap.get(id);
      return validate(validation.rule, values);
    },
  };
}

/**
 * We removed undefined values in this function as `json-logic` ignores them.
 * Means we will always check against a value for validations.
 *
 * @param {Object} values - a set of values from a form
 * @returns {Object} values object without any undefined
 */
function replaceUndefinedValuesWithNulls(values = {}) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined || value === null ? NaN : value };
  }, {});
}

/**
 * Creates a Yup validation test function with custom JSON Logic for a specific field.
 *
 * @param {Object} options - The options for creating the validation function.
 * @param {Object} options.field - The field configuration object.
 * @param {string} options.field.name - The name of the field.
 * @param {Object} options.logic - The logic object containing validation scopes and rules.
 * @param {Object} options.config - Additional configuration options.
 * @param {string} options.id - The ID of the validation rule.
 * @param {string} [options.config.parentID='root'] - The ID of the validation rule scope.
 * @returns {Function} A Yup validation test function.
 */
export function yupSchemaWithCustomJSONLogic({ field, logic, config, id }) {
  const { parentID = 'root' } = config;
  const validation = logic.getScope(parentID).validationMap.get(id);

  if (validation === undefined) {
    throw Error(
      `[json-schema-form] json-logic error: "${field.name}" required validation "${id}" doesn't exist.`
    );
  }

  return (yupSchema) =>
    yupSchema.test(
      `${field.name}-validation-${id}`,
      validation?.errorMessage ?? 'This field is invalid.',
      (value, { parent }) => {
        if (value === undefined && !field.required) return true;
        return jsonLogic.apply(validation.rule, parent);
      }
    );
}

const HANDLEBARS_REGEX = /\{\{([^{}]+)\}\}/g;

/**
 * Replaces Handlebars templates in a value with computed values.
 *
 * Handles recursively replacing Handlebars templates "{{var}}" in strings
 * with computed values looked up from the validation logic.
 *
 * @param {Object} options - Options object
 * @param {*} options.value - The value to replace templates in
 * @param {Object} options.logic - The validation logic object
 * @param {Object} options.formValues - The current form values
 * @param {string} options.parentID - The ID of the validation scope
 * @param {string} options.name - The name of the field
 * @returns {*} The value with templates replaced with computed values
 */
function replaceHandlebarsTemplates({
  value: toReplace,
  logic,
  formValues,
  parentID,
  name: fieldName,
}) {
  if (typeof toReplace === 'string') {
    return toReplace.replace(HANDLEBARS_REGEX, (match, key) => {
      return logic.getScope(parentID).applyComputedValueInField(key.trim(), formValues, fieldName);
    });
  } else if (typeof toReplace === 'object') {
    const { value, ...rules } = toReplace;

    if (Object.keys(rules).length > 1 && !value) {
      throw Error('Cannot define multiple rules without a template string with key `value`.');
    }

    const computedTemplateValue = Object.entries(rules).reduce((prev, [key, rule]) => {
      const computedValue = logic.getScope(parentID).validate(rule, formValues);
      return prev.replaceAll(`{{${key}}}`, computedValue);
    }, value);

    return computedTemplateValue.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      return logic.getScope(parentID).applyComputedValueInField(key.trim(), formValues, fieldName);
    });
  }
  return toReplace;
}

/**
 * Builds computed attributes for a field based on jsonLogic rules.
 *
 * Processes rules defined in the schema's x-jsf-logic section to build
 * computed attributes like label, description, etc.
 *
 * Handles replacing handlebars templates in strings with computed values.
 *
 * @param {Object} fieldParams - The field configuration parameters
 * @param {Object} options - Options
 * @param {string} [options.parentID='root'] - ID of the validation scope
 * @returns {Function} A function to build the computed attributes
 */
export function calculateComputedAttributes(fieldParams, { parentID = 'root' } = {}) {
  return ({ logic, isRequired, config, formValues }) => {
    const { name, computedAttributes } = fieldParams;
    const attributes = Object.fromEntries(
      Object.entries(computedAttributes)
        .map(handleComputedAttribute(logic, formValues, parentID, name))
        .filter(([, value]) => value !== null)
    );

    return {
      ...attributes,
      schema: buildYupSchema(
        { ...fieldParams, ...attributes, required: isRequired },
        config,
        logic
      ),
    };
  };
}

/**
 * Handles computing a single attribute value.
 *
 * Evaluates jsonLogic rules to build the computed value.
 *
 * @param {Object} logic - Validation logic
 * @param {Object} formValues - Current form values
 * @param {string} parentID - ID of the validation scope
 * @param {string} name - Name of the field
 * @returns {Function} Function to compute the attribute value
 */
function handleComputedAttribute(logic, formValues, parentID, name) {
  return ([key, value]) => {
    switch (key) {
      case 'description':
        return [key, replaceHandlebarsTemplates({ value, logic, formValues, parentID, name })];
      case 'title':
        return ['label', replaceHandlebarsTemplates({ value, logic, formValues, parentID, name })];
      case 'x-jsf-errorMessage':
        return [
          'errorMessage',
          handleNestedObjectForComputedValues(value, formValues, parentID, logic, name),
        ];
      case 'x-jsf-presentation': {
        if (value.statement) {
          return [
            'statement',
            handleNestedObjectForComputedValues(value.statement, formValues, parentID, logic, name),
          ];
        }
        return [
          key,
          handleNestedObjectForComputedValues(value.statement, formValues, parentID, logic, name),
        ];
      }
      case 'const':
      default: {
        if (typeof value === 'object' && value.rule) {
          return [key, logic.getScope(parentID).validate(value.rule, formValues)];
        }
        return [key, logic.getScope(parentID).applyComputedValueInField(value, formValues, name)];
      }
    }
  };
}

function handleNestedObjectForComputedValues(values, formValues, parentID, logic, name) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      return [key, replaceHandlebarsTemplates({ value, logic, formValues, parentID, name })];
    })
  );
}

/**
 * Builds a sample empty object for the given schema.
 *
 * Recursively builds an object with empty values for each property in the schema.
 * Used to provide a valid data structure to test jsonLogic validation rules against.
 *
 * Handles objects, arrays, and nested schemas.
 *
 * @param {Object} schema - The JSON schema
 * @returns {Object} Sample empty object based on the schema
 */
function buildSampleEmptyObject(schema = {}) {
  const sample = {};
  if (typeof schema !== 'object' || !schema.properties) {
    return schema;
  }

  for (const key in schema.properties) {
    if (schema.properties[key].type === 'object') {
      sample[key] = buildSampleEmptyObject(schema.properties[key]);
    } else if (schema.properties[key].type === 'array') {
      const itemSchema = schema.properties[key].items;
      sample[key] = buildSampleEmptyObject(itemSchema);
    } else {
      sample[key] = true;
    }
  }

  return sample;
}

/**
 * Validates inline jsonLogic rules defined in the schema's x-jsf-logic-computedAttrs.
 *
 * For each field with computed attributes, checks that the variables
 * referenced in the rules exist in the schema.
 *
 * Throws if any variable in a computed attribute rule does not exist.
 *
 * @param {Object} jsonSchema - The JSON schema object
 * @param {Object} sampleEmptyObject - Sample empty object based on the schema
 */
function validateInlineRules(jsonSchema, sampleEmptyObject) {
  const properties = (jsonSchema?.properties || jsonSchema?.items?.properties) ?? {};
  Object.entries(properties)
    .filter(([, property]) => property['x-jsf-logic-computedAttrs'] !== undefined)
    .forEach(([fieldName, property]) => {
      Object.entries(property['x-jsf-logic-computedAttrs'])
        .filter(([, value]) => typeof value === 'object')
        .forEach(([key, item]) => {
          Object.values(item).forEach((rule) => {
            checkRuleIntegrity(
              rule,
              fieldName,
              sampleEmptyObject,
              (item) =>
                `[json-schema-form] json-logic error: fieldName "${item.var}" doesn't exist in field "${fieldName}.x-jsf-logic-computedAttrs.${key}".`
            );
          });
        });
    });
}

/**
 * Checks the integrity of a jsonLogic rule by validating that all referenced variables exist in the provided data object.
 * Throws an error if any variable in the rule does not exist in the data.
 *
 * @example
 *
 * const rule = { "+": [{ "var": "iDontExist"}, 10 ]}
 * const badData = { a: 1 }
 * checkRuleIntegrity(rule, "add_ten_to_field", badData)
 * // throws Error(`"iDontExist" in rule "add_ten_to_field" does not exist as a JSON schema property.`)
 *
 *
 * @param {Object|Array} rule - The jsonLogic rule object or array to validate
 * @param {string} id - The ID of the rule (used in error messages)
 * @param {Object} data - The data object to check the rule variables against
 * @param {Function} errorMessage - Function to generate custom error message.
 *                                  Receives the invalid rule part and should throw an error message string.
 */
function checkRuleIntegrity(
  rule,
  id,
  data,
  errorMessage = (item) =>
    `[json-schema-form] json-logic error: rule "${id}" has no variable "${item.var}".`
) {
  Object.entries(rule ?? {}).map(([operator, subRule]) => {
    if (!Array.isArray(subRule) && subRule !== null && subRule !== undefined) return;
    throwIfUnknownOperator(operator, subRule, id);

    subRule.map((item) => {
      const isVar = item !== null && typeof item === 'object' && Object.hasOwn(item, 'var');
      if (isVar) {
        const exists = jsonLogic.apply({ var: removeIndicesFromPath(item.var) }, data);
        if (exists === null) {
          throw Error(errorMessage(item));
        }
      } else {
        checkRuleIntegrity(item, id, data);
      }
    });
  });
}

function throwIfUnknownOperator(operator, subRule, id) {
  try {
    jsonLogic.apply({ [operator]: subRule });
  } catch (e) {
    if (e.message === `Unrecognized operation ${operator}`) {
      throw Error(
        `[json-schema-form] json-logic error: in "${id}" rule there is an unknown operator "${operator}".`
      );
    }
  }
}

const regexToGetIndices = /\.\d+\./g; // eg. .0., .10.

/**
 * Removes array indices from a json schema path string.
 * Converts paths like "foo.0.bar" to "foo.bar".
 * This allows checking if a variable exists in an array item schema without needing the specific index.
 *
 * @param {string} path - The json schema path potentially containing array indices
 * @returns {string} The path with array indices removed
 */
function removeIndicesFromPath(path) {
  const intermediatePath = path.replace(regexToGetIndices, '.');
  return intermediatePath.replace(/\.\d+$/, '');
}

export function processJSONLogicNode({
  node,
  formFields,
  formValues,
  accRequired,
  parentID,
  logic,
}) {
  const requiredFields = new Set(accRequired);

  if (node.allOf) {
    node.allOf
      .map((allOfNode) =>
        processJSONLogicNode({ node: allOfNode, formValues, formFields, logic, parentID })
      )
      .forEach(({ required: allOfItemRequired }) => {
        allOfItemRequired.forEach(requiredFields.add, requiredFields);
      });
  }

  if (node.if) {
    const matchesPropertyCondition = checkIfConditionMatchesProperties(
      node,
      formValues,
      formFields,
      logic
    );
    const matchesValidationsAndComputedValues =
      matchesPropertyCondition &&
      checkIfMatchesValidationsAndComputedValues(node, formValues, logic, parentID);

    const isConditionMatch = matchesPropertyCondition && matchesValidationsAndComputedValues;

    let nextNode;
    if (isConditionMatch && node.then) {
      nextNode = node.then;
    }
    if (!isConditionMatch && node.else) {
      nextNode = node.else;
    }
    if (nextNode) {
      const { required: branchRequired } = processNode({
        node: nextNode,
        formValues,
        formFields,
        accRequired,
        logic,
        parentID,
      });
      branchRequired.forEach((field) => requiredFields.add(field));
    }
  }

  return { required: requiredFields };
}
