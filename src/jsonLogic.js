import jsonLogic from 'json-logic-js';

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
    evaluateRule(id, values) {
      const validation = validationMap.get(id);
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
    return validations.evaluateRule(key.trim(), formValues);
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
            return [key, validations.evaluateRule(value, formValues)];
          return [key, null];
        })
        .filter(([, value]) => value !== null)
    );
  };
}
