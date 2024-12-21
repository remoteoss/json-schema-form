import { visitNodeType } from './node-checks';
import { JSONSchema, ProcessSchemaConfig } from './types';

function processNode(node: JSONSchema) {
  if (typeof node !== 'object' || node === null) {
    return node;
  }

  return [
    {
      type: node.type,
      label: node.title,
      description: node.description,
    },
  ];
}

export function traverseSchema<T extends JSONSchema>(
  schema: T,
  config: ProcessSchemaConfig,
  processFn: Function
) {
  return visitNodeType(
    schema,
    {
      object: () => [],
      multiType: () => [],
      number: () => [],
      string: () => [],
      boolean: () => [],
      array: () => [],
      nullType: () => [],
      default: () => [],
    },
    config
  );
}

export function processSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig) {
  return traverseSchema(schema, config, processNode);
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
