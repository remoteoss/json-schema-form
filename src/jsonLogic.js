import jsonLogic from 'json-logic-js';

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
      .filter(([, property]) => property.type === 'object' || property.type === 'array')
      .forEach(([key, property]) => {
        if (property.type === 'array') {
          createScopes(property.items, `${key}[]`);
        }
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

  validations.forEach(([id, validation]) => {
    validationMap.set(id, validation);
  });

  computedValues.forEach(([id, computedValue]) => {
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
      return evaluateValidation(validation.rule, values);
    },
    evaluateComputedValueRuleForField(id, values) {
      const validation = computedValuesMap.get(id);
      return evaluateValidation(validation.rule, values);
    },
    evaluateComputedValueRuleInCondition(id, values) {
      const validation = computedValuesMap.get(id);
      return evaluateValidation(validation.rule, values);
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
