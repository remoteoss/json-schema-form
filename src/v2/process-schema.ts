import flow from 'lodash/flow';
import { visitNodeType } from './node-checks';
import { JSONSchema, ProcessSchemaConfig } from './types';

function processNode(contents: any, schema: JSONSchema, config: ProcessSchemaConfig) {
  return [
    {
      name: '#',
      type: contents.type,
      label: contents.title,
      description: contents.description,
      value: config.values,
    },
  ];
}

export function traverseSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig) {
  return visitNodeType(
    schema,
    {
      object: () => [],
      multiType: () => [],
      number: () => [],
      string: () => ({ type: 'string' }),
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
