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
  config: ProcessSchemaConfig<T>,
  processFn: Function
) {
  switch (typeof schema === 'object' ? schema.type : undefined) {
    case 'object':
      return [];
    default:
      return processFn(schema, config);
  }
}

export function processSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig<T>) {
  return traverseSchema(schema, config, processNode);
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
