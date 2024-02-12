import { compareFormValueWithSchemaValue, getField, validateFieldSchema } from './helpers';
import { hasProperty } from './utils';

/**
 * Checks if a "IF" condition matches given the current form state
 * @param {Object} node - JSON schema node
 * @param {Object} formValues - form state
 * @returns {Boolean}
 */
export function checkIfConditionMatchesProperties(node, formValues, formFields, logic) {
  return Object.keys(node.if.properties ?? {}).every((name) => {
    const currentProperty = node.if.properties[name];
    const value = formValues[name];
    const hasEmptyValue =
      typeof value === 'undefined' ||
      // NOTE: This is a "Remote API" dependency, as empty fields are sent as "null".
      value === null;
    const hasIfExplicit = node.if.required?.includes(name);

    if (hasEmptyValue && !hasIfExplicit) {
      // A property with empty value in a "if" will always match (lead to "then"),
      // even if the actual conditional isn't true. Unless it's explicit in the if.required.
      // WRONG:: if: { properties: { foo: {...} } }
      // CORRECT:: if: { properties: { foo: {...} }, required: ['foo'] }
      // Check MR !14408 for further explanation about the official specs
      // https://json-schema.org/understanding-json-schema/reference/conditionals.html#if-then-else
      return true;
    }

    if (hasProperty(currentProperty, 'const')) {
      return compareFormValueWithSchemaValue(value, currentProperty.const);
    }

    if (currentProperty.contains?.pattern) {
      // TODO: remove this || after D#4098 is merged and transformValue does not run for the parser anymore
      const formValue = value || [];

      // Making sure the form value type matches the expected type (array) when theres' a "contains" condition
      if (Array.isArray(formValue)) {
        const pattern = new RegExp(currentProperty.contains.pattern);
        return (value || []).some((item) => pattern.test(item));
      }
    }

    if (currentProperty.enum) {
      return currentProperty.enum.includes(value);
    }

    if (currentProperty.properties) {
      return checkIfConditionMatchesProperties(
        { if: currentProperty },
        formValues[name],
        getField(name, formFields).fields,
        logic
      );
    }

    const field = getField(name, formFields);

    return validateFieldSchema(
      {
        ...field,
        ...currentProperty,
        required: true,
      },
      value
    );
  });
}

export function checkIfMatchesValidationsAndComputedValues(node, formValues, logic, parentID) {
  const validationsMatch = Object.entries(node.if.validations ?? {}).every(([name, property]) => {
    const currentValue = logic.getScope(parentID).applyValidationRuleInCondition(name, formValues);
    if (Object.hasOwn(property, 'const') && currentValue === property.const) return true;
    return false;
  });

  const computedValuesMatch = Object.entries(node.if.computedValues ?? {}).every(
    ([name, property]) => {
      const currentValue = logic
        .getScope(parentID)
        .applyComputedValueRuleInCondition(name, formValues);
      if (Object.hasOwn(property, 'const') && currentValue === property.const) return true;
      return false;
    }
  );

  return computedValuesMatch && validationsMatch;
}
