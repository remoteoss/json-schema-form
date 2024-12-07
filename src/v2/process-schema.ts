import { JSONSchema, SchemaInstanceType } from './types';

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

type ProcessSchemaConfig<T extends JSONSchema> = {
  values: unknown;
};

export function traverseSchema<T extends JSONSchema>(
  schema: T,
  config: ProcessSchemaConfig<T>,
  processFn: (node: JSONSchema) => unknown
) {
  switch (typeof schema === 'object' ? schema.type : undefined) {
    case 'object':
      return [];
    default:
      return processFn(schema);
  }
}

export function processSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig<T>) {
  return traverseSchema(schema, config, processNode);
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
