import { FromSchema, JSONSchema as JSONSchemaType } from 'json-schema-to-ts';

export type JSONSchemaFormConfiguration = {
  initialValues?: Record<string, unknown>;
  validator?: 'yup';
  plugins?: JSONSchemaFormPlugin[];
};

export type FormErrors = Record<string, string>;

export type ProcessSchemaConfig = {
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
type NonBooleanJSONSchema = Exclude<JSONSchema, boolean>;
export type JSONSchemaObject = NonBooleanJSONSchema;
