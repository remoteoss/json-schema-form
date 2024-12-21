import { createFieldState } from './state/field-state';
import { JSONSchema, JSONSchemaFormConfiguration, SchemaInstanceType } from './types';
import { getValidator } from './validators';
import { yupValidatorPlugin } from './validators/yupDraft7';

const defaultConfig: JSONSchemaFormConfiguration = {
  initialValues: {},
  validator: 'yup',
  jsonSchemaVersion: 'draft7',
  plugins: [yupValidatorPlugin],
};

export function createHeadlessForm<T extends JSONSchema>(
  jsonSchema: T,
  config: JSONSchemaFormConfiguration = defaultConfig
) {
  type SchemaInstance = SchemaInstanceType<typeof jsonSchema>;
  const validator = getValidator(config);
  const { fields, updateFields } = createFieldState(jsonSchema, {
    ...config,
    schemaValidator: validator,
  });

  return {
    fields,
    validationSchema: validator.yupSchema,
    handleValidation(values: SchemaInstance) {
      const newFields = updateFields(values);
      const errors = validator.validate(values, jsonSchema);
      return { fields: newFields, ...errors };
    },
  };
}
