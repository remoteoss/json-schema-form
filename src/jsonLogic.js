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
export function getValidationsFromJSONSchema(schema) {
  const validationMap = new Map();
  const computedValuesMap = new Map();

  const logic = schema?.['x-jsf-logic'] ?? {
    validations: {},
    computedValues: {},
  };

  const validations = Object.entries(logic.validations ?? {});
  const computedValues = Object.entries(logic.computedValues ?? {});

  validations.forEach(([id, validation]) => {
    validationMap.set(id, validation);
  });

  computedValues.forEach(([id, computedValue]) => {
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

export function yupSchemaWithCustomJSONLogic({ field, validations, id }) {
  const validation = validations.validationMap.get(id);
  return (yupSchema) =>
    yupSchema.test(
      `${field.name}-validation-${id}`,
      validation.errorMessage ?? 'This field is invalid.',
      (_, { parent }) => {
        return jsonLogic.apply(validation.rule, parent);
      }
    );
}

function replaceHandlebarsTemplates(string, validations, formValues) {
  return string.replace(/\{\{([^{}]+)\}\}/g, (match, key) => {
    return validations.evaluateComputedValueRule(key.trim(), formValues);
  });
}

export function calculateComputedAttributes(fieldParams) {
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
            return [key, validations.evaluateComputedValueRule(value, formValues)];
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
