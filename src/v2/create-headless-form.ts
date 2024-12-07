import { FromSchema, JSONSchema } from 'json-schema-to-ts';

export type JSONSchemaFormConfiguration = {};

export function createHeadlessForm<T>(jsonSchema: T, config: JSONSchemaFormConfiguration = {}) {
  type jsonSchemaType = FromSchema<T extends JSONSchema ? T : never>;


  return {
    fields: [],
    handleValidation: (values: jsonSchemaType) => {
      return {
        formErrors: undefined,
      };
    },
  };
}
