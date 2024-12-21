import { FromSchema, JSONSchema as JSONSchemaType, $JSONSchema } from 'json-schema-to-ts';

export type JSONSchemaFormConfiguration = {
  initialValues?: Record<string, unknown>;
  validator?: 'yup';
  plugins?: JSONSchemaFormPlugin[];
};

export type FormErrors = Record<string, string>;

export type ProcessSchemaConfig<T extends JSONSchema> = {
  values: unknown;
};

export type JSONSchemaFormValidatorPlugin = {
  type: 'validator';
  validate: (values: unknown, fields: JSONSchema) => { formErrors: FormErrors | undefined };
  jsonSchemaVersion: 'draft7';
};

export type JSONSchemaFormPlugin = { name: string } & JSONSchemaFormValidatorPlugin;

export type SchemaInstanceType<T> = FromSchema<T extends JSONSchemaType ? T : never>;
export type JSONSchema = JSONSchemaType;
export type JSONSchemaObject = $JSONSchema;
