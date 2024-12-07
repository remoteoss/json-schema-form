import { FromSchema, JSONSchema as JSONSchemaType } from 'json-schema-to-ts';
import { ProcessSchemaReturnType } from './process-schema';

export type JSONSchemaFormConfiguration = {
  initialValues?: Record<string, unknown>;
  validator?: 'yup';
  plugins?: JSONSchemaFormPlugin[];
};

export type FormErrors = Record<string, string>;

export type JSONSchemaFormValidatorPlugin = {
  type: 'validator';
  validate: (values: unknown, fields: JSONSchema) => { formErrors: FormErrors | undefined };
};

export type JSONSchemaFormPlugin = { name: string } & JSONSchemaFormValidatorPlugin;

export type SchemaInstanceType<T> = FromSchema<T extends JSONSchemaType ? T : never>;
export type JSONSchema = JSONSchemaType;
