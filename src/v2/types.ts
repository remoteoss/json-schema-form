import { FromSchema, JSONSchema as JSONSchemaType } from 'json-schema-to-ts';

export type JSONSchemaFormConfiguration = {
  initialValues?: Record<string, unknown>;
};

export type SchemaInstanceType<T> = FromSchema<T extends JSONSchemaType ? T : never>;
export type JSONSchema = JSONSchemaType;
