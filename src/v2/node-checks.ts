import { flow } from 'lodash';
import { JSONSchema, JSONSchemaObject, ProcessSchemaConfig } from './types';

export function isNumberNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'number' || node.type === 'integer' || node.minimum || node.maximum;
}

export function isConditionalObjectNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  const isIfObjectCondition = !!(node.if && !!node.if?.properties);
  return isIfObjectCondition;
}

export function isObjectNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return (
    node.type === 'object' ||
    (!node.type && !node.properties && node.required) ||
    (!node.type && node.properties) ||
    isConditionalObjectNode(node)
  );
}

export function isMultiTypeValue(node: JSONSchema) {
  return typeof node === 'object' && Array.isArray(node.type);
}

export function isStringNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return (
    node.type === 'string' ||
    typeof node.const === 'string' ||
    node.minLength ||
    node.maxLength ||
    node.pattern ||
    node.format
  );
}

export function isBooleanNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'boolean' || typeof node.const === 'boolean';
}

export function isArrayNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'array' || node.items || node.minItems || node.maxItems;
}

export function isAnyOfNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'anyOf') && Array.isArray(node.anyOf);
}

export function isOneOfNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'oneOf') && Array.isArray(node.oneOf);
}

export function isEnumNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'enum') && Array.isArray(node.enum);
}

export function isConstNode(node: JSONSchema) {
  return typeof node === 'object' && node.const;
}

export function isAllOfNode(node: JSONSchema) {
  return typeof node === 'object' && node.allOf && Array.isArray(node.allOf);
}

export function isNullNode(node: JSONSchema) {
  return typeof node === 'object' && node.type === 'null';
}

type NodeTypeHandlers = {
  multiType: (node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) => any;
  object: (node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) => any;
  number: (node: JSONSchema) => any;
  string: (node: JSONSchema) => any;
  boolean: (node: JSONSchema) => any;
  array: (node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) => any;
  nullType: (node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) => any;
  default: (node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) => any;
};

export function visitNodeType(
  node: JSONSchema,
  handlers: NodeTypeHandlers,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (isMultiTypeValue(node)) return handlers.multiType(node, config);
  if (isObjectNode(node)) return handlers.object(node, config);
  if (isNumberNode(node)) return handlers.number(node);
  if (isStringNode(node)) return handlers.string(node);
  if (isBooleanNode(node)) return handlers.boolean(node);
  if (isArrayNode(node)) return handlers.array(node, config);
  if (isNullNode(node)) return handlers.nullType(node, config);
  return handlers.default(node, config);
}

export function isNotNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'not');
}

export function isConditionalNode(node: JSONSchema) {
  return typeof node === 'object' && node.if && node.then;
}

export function isUniqueItemsNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'uniqueItems');
}

export function isAdditionalItemsNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'additionalItems');
}

export function isRequiredNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'required');
}

type KeywordNodeHandlers = {
  enum: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  const: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  not: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  anyOf: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  allOf: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  oneOf: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
  conditional: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  default: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  uniqueItems: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  additionalItems: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  required: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
};

export function visitKeywordNode(
  node: JSONSchemaObject,
  handlers: KeywordNodeHandlers,
  config: ProcessSchemaConfig<JSONSchema>
) {
  return flow([
    (input) => (isRequiredNode(node) ? handlers.required(input, node, config) : input),
    (input) => (isEnumNode(node) ? handlers.enum(input, node, config) : input),
    (input) => (isConstNode(node) ? handlers.const(input, node, config) : input),
    (input) => (isNotNode(node) ? handlers.not(input, node, config) : input),
    (input) => (isAllOfNode(node) ? handlers.allOf(input, node, config) : input),
    (input) => (isAnyOfNode(node) ? handlers.anyOf(input, node, config) : input),
    (input) => (isConditionalNode(node) ? handlers.conditional(input, node, config) : input),
    (input) => (isOneOfNode(node) ? handlers.oneOf(input, node, config) : input),
    (input) => (isUniqueItemsNode(node) ? handlers.uniqueItems(input, node, config) : input),
    (input) =>
      isAdditionalItemsNode(node) ? handlers.additionalItems(input, node, config) : input,
    (input) => handlers.default(input, node, config),
  ]);
}
