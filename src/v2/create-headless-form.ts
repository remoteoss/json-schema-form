import { createFieldState } from './field-state';
import { JSONSchema, JSONSchemaFormConfiguration, SchemaInstanceType } from './types';

export function createHeadlessForm<T extends JSONSchema>(
  jsonSchema: T,
  config: JSONSchemaFormConfiguration = { initialValues: {} }
) {
  type SchemaInstance = SchemaInstanceType<typeof jsonSchema>;
  const { fields } = createFieldState(jsonSchema, config);

  return {
    fields,
    handleValidation: (values: SchemaInstance) => {
      return {
        formErrors: undefined,
      };
    },
  };
}
