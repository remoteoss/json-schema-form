import flow from 'lodash/flow';
import { visitKeywordNode, visitNodeType } from './node-checks';
import { JSONSchema, JSONSchemaObject, ProcessSchemaConfig, SchemaInstanceType } from './types';
import { reach } from 'yup';

function processNode(contents: any, schema: JSONSchema, config: ProcessSchemaConfig) {
  return visitKeywordNode(
    schema,
    {
      title: (input, node, config) => {
        return { ...input, label: node.title };
      },
      description: (input, node, config) => {
        return { ...input, description: node.description };
      },
      default: (input, node, config) => {
        return input;
      },
      required: (input, node, config) => {
        return input;
      },
      enum: (input, node, config) => {
        return input;
      },
      const: (input, node, config) => {
        return input;
      },
      not: (input, node, config) => {
        return input;
      },
      anyOf: (input, node, config) => {
        return input;
      },
      allOf: (input, node, config) => {
        return input;
      },
      oneOf: (input, node, config) => {
        return { ...input, options: node.oneOf?.map((i) => ({ label: i.title, value: i.const })) };
      },
      uniqueItems: (input, node, config) => {
        return input;
      },
      additionalItems: (input, node, config) => {
        return input;
      },
      additionalProperties: (input, node, config) => {
        return input;
      },
      items: (input, node, config) => {
        return input;
      },
      patternProperties: (input, node, config) => {
        return input;
      },
      pattern: (input, node, config) => {
        return input;
      },
      minLength: (input, node, config) => {
        return input;
      },
      maxLength: (input, node, config) => {
        return input;
      },
      minimum: (input, node, config) => {
        return input;
      },
      maximum: (input, node, config) => {
        return input;
      },
      multipleOf: (input, node, config) => {
        return input;
      },
      exclusiveMaximum: (input, node, config) => {
        return input;
      },
      exclusiveMinimum: (input, node, config) => {
        return input;
      },
      format: (input, node, config) => {
        return input;
      },
      dependencies: (input, node, config) => {
        return input;
      },
      contains: (input, node, config) => {
        return input;
      },
      minItems: (input, node, config) => {
        return input;
      },
      maxItems: (input, node, config) => {
        return input;
      },
      if: function (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig) {
        return input;
      },
    },
    config
  )(contents);
}

function handlePresentation(contents: any, node: JSONSchema, config: ProcessSchemaConfig) {
  if (
    typeof node === 'object' &&
    Object.hasOwn(node, 'x-jsf-presentation') &&
    Object.hasOwn(node['x-jsf-presentation'], 'inputType')
  ) {
    return {
      ...contents,
      inputType: node['x-jsf-presentation'].inputType,
      type: node['x-jsf-presentation'].inputType,
    };
  }
  return contents;
}

function processObject(contents: any, schema: JSONSchema, config: ProcessSchemaConfig) {
  return [
    ...Object.entries(schema.properties ?? {}).map(([key, property]) => ({
      ...processSchema(property, {
        ...config,
        parentPath: config.parentPath ? `${config.parentPath}.${key}` : key,
      }),
      name: key,
    })),
  ];
}

export function traverseSchema<T extends JSONSchema>(
  contents: any,
  schema: T,
  config: ProcessSchemaConfig
) {
  return visitNodeType(
    schema,
    {
      object: () => {
        if (config.parentPath) {
          return { type: 'object', fields: processObject(contents, schema, config) };
        }
        return processObject(contents, schema, config);
      },
      multiType: () => [],
      number: () => [],
      string: () => ({ jsonType: 'string', inputType: 'text', name: '' }),
      boolean: () => [],
      array: () => [],
      nullType: () => [],
      default: () => [],
    },
    config
  );
}

function addSchemaToNode(contents: any, yupSchema: SchemaInstanceType<JSONSchema>) {
  if (Array.isArray(contents)) {
    return contents;
  }
  return {
    ...contents,
    schema: reach(yupSchema, contents.name),
  };
}

export function processSchema<T extends JSONSchema>(schema: T, config: ProcessSchemaConfig) {
  const yupSchema = config.schemaValidator.validate(config.values, schema).yupSchema.resolve({});
  const output = [];
  return flow([
    (contents) => traverseSchema(contents, schema, config),
    (contents) => processNode(contents, schema, config),
    (contents) => handlePresentation(contents, schema, config),
    (contents) => addSchemaToNode(contents, yupSchema),
  ])(output);
}

export type ProcessSchemaReturnType = ReturnType<typeof processSchema>;
