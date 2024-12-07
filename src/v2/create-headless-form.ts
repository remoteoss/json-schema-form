import { createFieldState } from './field-state';
import { JSONSchema, JSONSchemaFormConfiguration, SchemaInstanceType } from './types';
import { getValidator } from './validators';
import { yupValidatorPlugin } from './validators/yup';

const defaultConfig: JSONSchemaFormConfiguration = {
  initialValues: {},
  validator: 'yup',
  plugins: [yupValidatorPlugin],
};

export function createHeadlessForm<T extends JSONSchema>(
  jsonSchema: T,
  config: JSONSchemaFormConfiguration = defaultConfig
) {
  type SchemaInstance = SchemaInstanceType<typeof jsonSchema>;
  const { fields, updateFields } = createFieldState(jsonSchema, config);
  const validator = getValidator(config);

  return {
    fields,
    handleValidation(values: SchemaInstance) {
      updateFields(values);
      const { formErrors } = validator.validate(values, jsonSchema);

      return {
        formErrors,
      };
    },
  };
}
