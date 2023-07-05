import jsonLogic from 'json-logic-js';

/**
 * Parses the JSON schema to extract the advanced validation logic and returns a set of functionality to check the current status of said rules.
 * @param {Object} schema - JSON schema node
 * @param {Object} initialValues - form state
 * @returns {Object}
 */
export function getValidationsFromJSONSchema(schema) {
  const ruleMap = new Map();

  const validationObject = Object.entries(schema?.['x-jsf-validations'] ?? {});
  validationObject.forEach(([id, { rule }]) => {
    ruleMap.set(id, { rule });
  });

  return {
    ruleMap,
    evaluateRule(id, values) {
      const validation = ruleMap.get(id);
      const answer = jsonLogic.apply(validation.rule, clean(values));
      return answer;
    },
  };
}

function clean(values) {
  return Object.entries(values).reduce((prev, [key, value]) => {
    return { ...prev, [key]: value === undefined ? null : value };
  }, {});
}

export function yupSchemaWithCustomJSONLogic(field, validation, id) {
  return (yupSchema) =>
    yupSchema.test(
      `${field.name}-validation-${id}`,
      validation.errorMessage ?? 'This field is invalid.',
      (_, { parent }) => {
        return jsonLogic.apply(validation.rule, parent);
      }
    );
}
