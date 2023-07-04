import jsonLogic from 'json-logic-js';

export function yupSchemaWithCustomJSONLogic(field, validation, index) {
  return (yupSchema) =>
    yupSchema.test(
      `${field.name}-validation-${index}`,
      validation.errorMessage ?? 'This field is invalid.',
      (_, { parent }) => {
        return jsonLogic.apply(validation.rule, parent);
      }
    );
}
