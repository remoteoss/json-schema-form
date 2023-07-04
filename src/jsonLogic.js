import jsonLogic from 'json-logic-js';

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
