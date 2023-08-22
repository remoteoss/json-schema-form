import jsonLogic from 'json-logic-js';

import {
  checkIfConditionMatches,
  checkIfMatchesValidationsAndComputedValues,
} from './checkIfConditionMatches';
import { processNode } from './helpers';
import { buildYupSchema } from './yupSchema';

/**
 * Parses the JSON schema to extract the advanced validation logic and returns a set of functionality to check the current status of said rules.
 * @param {Object} schema - JSON schema node
 * @param {Object} initialValues - form state
 * @returns {Object}
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
        }
        createScopes(property, key);
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

  function evaluateValidation(rule, values) {
    return jsonLogic.apply(rule, clean(values));
  }

  return {
    validationMap,
    computedValuesMap,
    evaluateValidation,
    evaluateValidationRuleInCondition(id, values) {
      const validation = validationMap.get(id);
      if (validation === undefined)
        throw Error(`"${id}" validation in if condition doesn't exist.`);

      return evaluateValidation(validation.rule, values);
    },
    evaluateComputedValueRuleForField(id, values, fieldName) {
      const validation = computedValuesMap.get(id);
      if (validation === undefined)
        throw Error(`"${id}" computedValue in field "${fieldName}" doesn't exist.`);

      return evaluateValidation(validation.rule, values);
    },
    evaluateComputedValueRuleInCondition(id, values) {
      const validation = computedValuesMap.get(id);
      if (validation === undefined)
        throw Error(`"${id}" computedValue in if condition doesn't exist.`);

      return evaluateValidation(validation.rule, values);
    },
  };
}

function clean(values = {}) {
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
 * @param {Object} options.validations - The validations object containing validation scopes and rules.
 * @param {Object} options.config - Additional configuration options.
 * @param {string} options.config.id - The ID of the validation rule.
 * @param {string} [options.config.parentID='root'] - The ID of the validation rule scope.
 * @returns {Function} A Yup validation test function.
 */
export function yupSchemaWithCustomJSONLogic({ field, validations, config, id }) {
  const { parentID = 'root' } = config;
  const validation = validations.getScope(parentID).validationMap.get(id);

  if (validation === undefined) {
    throw Error(`Validation "${id}" required for "${field.name}" doesn't exist.`);
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

function replaceHandlebarsTemplates({
  value: toReplace,
  validations,
  formValues,
  parentID,
  name: fieldName,
}) {
  if (typeof toReplace === 'string') {
    return toReplace.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      return validations
        .getScope(parentID)
        .evaluateComputedValueRuleForField(key.trim(), formValues, fieldName);
    });
  } else if (typeof toReplace === 'object') {
    const { value, ...rules } = toReplace;

    if (Object.keys(rules).length > 1 && !value)
      throw Error('Cannot define multiple rules without a template string with key `value`.');

    const computedTemplateValue = Object.entries(rules).reduce((prev, [key, rule]) => {
      const computedValue = validations.getScope(parentID).evaluateValidation(rule, formValues);
      return prev.replaceAll(`{{${key}}}`, computedValue);
    }, value);

    return computedTemplateValue.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
      return validations
        .getScope(parentID)
        .evaluateComputedValueRuleForField(key.trim(), formValues, fieldName);
    });
  }
}

export function calculateComputedAttributes(fieldParams, { parentID = 'root' } = {}) {
  return ({ validations, isRequired, config, formValues }) => {
    const { name, computedAttributes } = fieldParams;
    const attributes = Object.fromEntries(
      Object.entries(computedAttributes)
        .map(handleComputedAttribute(validations, formValues, parentID, name))
        .filter(([, value]) => value !== null)
    );

    return {
      ...attributes,
      schema: buildYupSchema(
        { ...fieldParams, ...attributes, required: isRequired },
        config,
        validations
      ),
    };
  };
}

function handleComputedAttribute(validations, formValues, parentID, name) {
  return ([key, value]) => {
    if (key === 'description')
      return [key, replaceHandlebarsTemplates({ value, validations, formValues, parentID, name })];

    if (key === 'title') {
      return [
        'label',
        replaceHandlebarsTemplates({ value, validations, formValues, parentID, name }),
      ];
    }

    if (key === 'const')
      return [
        key,
        validations.getScope(parentID).evaluateComputedValueRuleForField(value, formValues, name),
      ];

    if (key === 'x-jsf-errorMessage') {
      return [
        'errorMessage',
        handleComputedObjectValue(value, formValues, parentID, validations, name),
      ];
    }

    if (typeof value === 'string') {
      return [
        key,
        validations.getScope(parentID).evaluateComputedValueRuleForField(value, formValues, name),
      ];
    }

    if (key === 'x-jsf-presentation' && value.statement) {
      return [
        'statement',
        handleComputedObjectValue(value.statement, formValues, parentID, validations, name),
      ];
    }

    if (typeof value === 'object' && value.rule) {
      return [key, validations.getScope(parentID).evaluateValidation(value.rule, formValues)];
    }
  };
}

function handleComputedObjectValue(values, formValues, parentID, validations, name) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      return [key, replaceHandlebarsTemplates({ value, validations, formValues, parentID, name })];
    })
  );
}

export function processJSONLogicNode({
  node,
  formFields,
  formValues,
  accRequired,
  parentID,
  validations,
}) {
  const requiredFields = new Set(accRequired);

  if (node.allOf) {
    node.allOf
      .map((allOfNode) =>
        processJSONLogicNode({ node: allOfNode, formValues, formFields, validations, parentID })
      )
      .forEach(({ required: allOfItemRequired }) => {
        allOfItemRequired.forEach(requiredFields.add, requiredFields);
      });
  }

  if (node.if) {
    const matchesPropertyCondition = checkIfConditionMatches(
      node,
      formValues,
      formFields,
      validations
    );
    const matchesValidationsAndComputedValues = checkIfMatchesValidationsAndComputedValues(
      node,
      formValues,
      validations,
      parentID
    );

    const isConditionMatch = matchesPropertyCondition && matchesValidationsAndComputedValues;

    if (isConditionMatch && node.then) {
      const { required: branchRequired } = processNode({
        node: node.then,
        formValues,
        formFields,
        accRequired,
        validations,
      });
      branchRequired.forEach((field) => requiredFields.add(field));
    }
    if (!isConditionMatch && node.else) {
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

  return { required: requiredFields };
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
