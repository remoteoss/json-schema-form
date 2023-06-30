import jsonLogic from 'json-logic-js';

import { getField, updateField } from './helpers';

export function processValidationRule(validation, formFields, requiredFields, node, formValues) {
  const { target } = validation;
  const field = getField(target, formFields);
  updateField(field, requiredFields, validation, formValues);
}

export function yupSchemaWithCustomJSONLogic(validation) {
  return (yupSchema) =>
    yupSchema.test(
      'randomName',
      validation.errorMessage ?? 'This field is invalid.',
      (_, { parent }) => {
        return jsonLogic.apply(validation.rule, parent);
      }
    );
}
