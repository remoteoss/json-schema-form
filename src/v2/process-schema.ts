import { JSONSchema, JSONSchemaFormConfiguration } from './types';

function processNode(node: JSONSchema) {
  if (typeof node !== 'object' || node === null) {
    return node;
  }

  return {
    type: node.type,
    label: node.title,
    description: node.description,
  };
}

export function processSchema<T>(schema: JSONSchema, config: JSONSchemaFormConfiguration) {
  switch (typeof schema === 'object' ? schema.type : undefined) {
    case 'object':
      return [];
    default:
      return [processNode(schema)];
  }
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
