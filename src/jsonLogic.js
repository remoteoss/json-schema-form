import jsonLogic from 'json-logic-js';

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
        handleNestedObjectForComputedValues(value, formValues, parentID, validations, name),
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

function handleNestedObjectForComputedValues(values, formValues, parentID, validations, name) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      return [key, replaceHandlebarsTemplates({ value, validations, formValues, parentID, name })];
    })
  );
}
