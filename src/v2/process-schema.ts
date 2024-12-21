import flow from 'lodash/flow';
import { visitNodeType } from './node-checks';
import { JSONSchema, ProcessSchemaConfig } from './types';

function processNode(contents: any, schema: JSONSchema, config: ProcessSchemaConfig) {
  return [
    {
      ...contents,
      name: '#',
      label: contents.title,
      description: contents.description,
      value: config.values,
    },
  ];
}

export function traverseSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig) {
  const validator = config.schemaValidator.validate(config.values, schema);
  return visitNodeType(
    schema,
    {
      object: () => [],
      multiType: () => [],
      number: () => ({
        jsonType: 'number',
        inputType: 'number',
        schema: validator.yupSchema.resolve({}),
      }),
      string: () => ({
        jsonType: 'string',
        inputType: 'text',
        schema: validator.yupSchema.resolve({}),
      }),
      boolean: () => [],
      array: () => [],
      nullType: () => [],
      default: () => [],
    },
    config
  );
}

export function processSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig) {
  return flow([
    () => traverseSchema(schema, config),
    (contents) => processNode(contents, schema, config),
  ])();
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
