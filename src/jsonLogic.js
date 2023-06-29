import jsonLogic from 'json-logic-js';

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
 * - validate {Function} - Function to evaluate a validation rule
 * - applyValidationRuleInCondition {Function} - Evaluate a validation rule used in a condition
 * - applyComputedValueInField {Function} - Evaluate a computed value rule for a field
 * - applyComputedValueRuleInCondition {Function} - Evaluate a computed value rule used in a condition
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
      throw Error(`Missing rule for validation with id of: "${id}".`);
    }

    checkRuleIntegrity(validation.rule, id, sampleEmptyObject);

    validationMap.set(id, validation);
  });

  computedValues.forEach(([id, computedValue]) => {
    if (!computedValue.rule) {
      throw Error(`Missing rule for computedValue with id of: "${id}".`);
    }

    checkRuleIntegrity(computedValue.rule, id, sampleEmptyObject);

    computedValuesMap.set(id, computedValue);
  });

  function validate(rule, values) {
    return jsonLogic.apply(rule, replaceUndefinedValuesWithNulls(values));
  }

  return {
    validationMap,
    computedValuesMap,
    validate,
    applyValidationRuleInCondition(id, values) {
      const validation = validationMap.get(id);
      return validate(validation.rule, values);
    },
    applyComputedValueInField(id, values) {
      const validation = computedValuesMap.get(id);
      if (validation === undefined) {
        throw Error(`"${id}" computedValue in field "${fieldName}" doesn't exist.`);
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
    return { ...prev, [key]: value === undefined ? null : value };
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
  }
  return toReplace;
}

export function calculateComputedAttributes(fieldParams, { parentID = 'root' } = {}) {
  return ({ logic, isRequired, config, formValues }) => {
    const { computedAttributes } = fieldParams;
    const attributes = Object.fromEntries(
      Object.entries(computedAttributes)
        .map(handleComputedAttribute(logic, formValues, parentID))
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

function handleComputedAttribute(logic, formValues, parentID) {
  return ([key, value]) => {
    if (key === 'description') {
      return [key, replaceHandlebarsTemplates({ value, logic, formValues, parentID, name })];
    }

    if (key === 'title') {
      return ['label', replaceHandlebarsTemplates({ value, logic, formValues, parentID, name })];
    }

    if (key === 'const') {
      return [key, logic.getScope(parentID).applyComputedValueInField(value, formValues)];
    }

    if (key === 'x-jsf-errorMessage') {
      return [
        'errorMessage',
        handleNestedObjectForComputedValues(value, formValues, parentID, logic, name),
      ];
    }

    if (key === 'x-jsf-errorMessage') {
      return [
        'errorMessage',
        handleNestedObjectForComputedValues(value, formValues, parentID, validations, name),
      ];
    }

    if (typeof value === 'string') {
      return [key, logic.getScope(parentID).applyComputedValueInField(value, formValues)];
    }

    if (key === 'x-jsf-presentation' && value.statement) {
      return [
        'statement',
        handleNestedObjectForComputedValues(value.statement, formValues, parentID, logic, name),
      ];
    }

    if (key === 'x-jsf-presentation' && value.statement) {
      return [
        'statement',
        handleNestedObjectForComputedValues(
          value.statement,
          formValues,
          parentID,
          validations,
          name
        ),
      ];
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
                `"${item.var}" in inline rule in property "${fieldName}.x-jsf-logic-computedAttrs.${key}" does not exist as a JSON schema property.`
            );
          });
        });
    });
}

function checkRuleIntegrity(
  rule,
  id,
  data,
  errorMessage = (item) => `"${item.var}" in rule "${id}" does not exist as a JSON schema property.`
) {
  Object.values(rule ?? {}).map((subRule) => {
    if (!Array.isArray(subRule) && subRule !== null && subRule !== undefined) return;
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

function removeIndicesFromPath(path) {
  const intermediatePath = path.replace(/\.\d+\./g, '.');
  return intermediatePath.replace(/\.\d+$/, '');
}
