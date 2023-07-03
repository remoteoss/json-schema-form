import jsonLogic from 'json-logic-js';

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
