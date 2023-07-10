import jsonLogic from 'json-logic-js';

import { processNode } from './helpers';
import {
  checkIfConditionMatches,
  checkIfMatchesValidationsAndComputedValues,
} from './nodeProcessing/checkIfConditionMatches';

/**
 * Parses the JSON schema to extract the advanced validation logic and returns a set of functionality to check the current status of said rules.
 * @param {Object} schema - JSON schema node
 * @param {Object} initialValues - form state
 * @returns {Object}
 */
export function createValidationChecker(schema) {
  const scopes = new Map();

  function createScopes(jsonSchema, key = 'root') {
    scopes.set(key, createValidationsScope(jsonSchema));
    Object.entries(jsonSchema?.properties ?? {})
      .filter(([, property]) => property.type === 'object')
      .forEach(([key, property]) => {
        createScopes(property, key);
      });
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

  return {
    validationMap,
    computedValuesMap,
    evaluateValidationRule(id, values) {
      const validation = validationMap.get(id);
      const answer = jsonLogic.apply(validation.rule, clean(values));
      return answer;
    },
    evaluateComputedValueRule(id, values) {
      const validation = computedValuesMap.get(id);
      const answer = jsonLogic.apply(validation.rule, clean(values));
      return answer;
    },
  };
}

function clean(values = {}) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined ? null : value };
  }, {});
}

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

function replaceHandlebarsTemplates(string, validations, formValues) {
  return string.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    return validations.getScope().evaluateComputedValueRule(key.trim(), formValues);
  });
}

export function calculateComputedAttributes(fieldParams, { parentID = 'root' } = {}) {
  return ({ validations, formValues }) => {
    const { computedAttributes } = fieldParams;
    return Object.fromEntries(
      Object.entries(computedAttributes)
        .map(([key, value]) => {
          if (key === 'description')
            return [key, replaceHandlebarsTemplates(value, validations, formValues)];
          if (key === 'title') {
            return ['label', replaceHandlebarsTemplates(value, validations, formValues)];
          }
          if (key === 'const' || key === 'value')
            return [
              key,
              validations.getScope(parentID).evaluateComputedValueRule(value, formValues),
            ];
          return [key, null];
        })
        .filter(([, value]) => value !== null)
    );
  };
}

export function processJSONLogicNode({ node, formFields, formValues, accRequired, validations }) {
  const requiredFields = new Set(accRequired);

  if (node.allOf) {
    node.allOf
      .map((allOfNode) =>
        processJSONLogicNode({ node: allOfNode, formValues, formFields, validations })
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
      validations
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
  const { properties } = schema;
  return Object.fromEntries(
    Object.entries(properties ?? {}).map(([key, value]) => {
      if (value.type !== 'object') return [key, true];
      return [key, buildSampleEmptyObject(value)];
    })
  );
}

function checkRuleIntegrity(rule, id, data) {
  Object.values(rule ?? {}).map((subRule) => {
    subRule.map((item) => {
      const isVar = item !== null && typeof item === 'object' && Object.hasOwn(item, 'var');
      if (isVar) {
        const exists = jsonLogic.apply({ var: item.var }, data);
        if (exists === null) {
          throw Error(`"${item.var}" in rule "${id}" does not exist as a JSON schema property.`);
        }
      } else {
        checkRuleIntegrity(item, id, data);
      }
    });
  });
}
