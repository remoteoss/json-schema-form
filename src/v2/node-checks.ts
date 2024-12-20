import { flow } from 'lodash';
import { JSONSchema, JSONSchemaObject, ProcessSchemaConfig } from './types';

export function isNumberNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'number' || node.type === 'integer';
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
  return node.type === 'string';
}

export function isBooleanNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'boolean' || typeof node.const === 'boolean';
}

export function isArrayNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'array';
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

export function isPatternPropertiesNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'patternProperties');
}

export function isAdditionalPropertiesNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'additionalProperties');
}

export function isPatternNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'pattern');
}

export function isMinLengthNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'minLength');
}

export function isMaxLengthNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'maxLength');
}

export function isMultipleOfNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'multipleOf');
}

export function isMinimumNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'minimum');
}

export function isMaximumNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'maximum');
}

export function isMinItemsNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'minItems');
}

export function isMaxItemsNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'maxItems');
}

export function isItemsNode(node: JSONSchema) {
  return typeof node === 'object' && Object.hasOwn(node, 'items');
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
  patternProperties: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  additionalProperties: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  pattern: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  minLength: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  maxLength: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  multipleOf: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  minimum: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  maximum: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  minItems: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  maxItems: (
    input: any,
    node: JSONSchemaObject,
    config: ProcessSchemaConfig<JSONSchemaObject>
  ) => any;
  items: (input: any, node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchemaObject>) => any;
};

export function visitKeywordNode(
  node: JSONSchemaObject,
  handlers: KeywordNodeHandlers,
  config: ProcessSchemaConfig<JSONSchema>
) {
  return flow([
    (input) => (isRequiredNode(node) ? handlers.required(input, node, config) : input),
    (input) =>
      isPatternPropertiesNode(node) ? handlers.patternProperties(input, node, config) : input,
    (input) =>
      isAdditionalPropertiesNode(node) ? handlers.additionalProperties(input, node, config) : input,
    (input) => (isPatternNode(node) ? handlers.pattern(input, node, config) : input),
    (input) => (isMinLengthNode(node) ? handlers.minLength(input, node, config) : input),
    (input) => (isMaxLengthNode(node) ? handlers.maxLength(input, node, config) : input),
    (input) => (isMinimumNode(node) ? handlers.minimum(input, node, config) : input),
    (input) => (isMaximumNode(node) ? handlers.maximum(input, node, config) : input),
    (input) => (isEnumNode(node) ? handlers.enum(input, node, config) : input),
    (input) => (isItemsNode(node) ? handlers.items(input, node, config) : input),
    (input) => (isConstNode(node) ? handlers.const(input, node, config) : input),
    (input) => (isNotNode(node) ? handlers.not(input, node, config) : input),
    (input) => (isMultipleOfNode(node) ? handlers.multipleOf(input, node, config) : input),
    (input) => (isAllOfNode(node) ? handlers.allOf(input, node, config) : input),
    (input) => (isAnyOfNode(node) ? handlers.anyOf(input, node, config) : input),
    (input) => (isConditionalNode(node) ? handlers.conditional(input, node, config) : input),
    (input) => (isOneOfNode(node) ? handlers.oneOf(input, node, config) : input),
    (input) => (isUniqueItemsNode(node) ? handlers.uniqueItems(input, node, config) : input),
    (input) =>
      isAdditionalItemsNode(node) ? handlers.additionalItems(input, node, config) : input,
    (input) => (isMinItemsNode(node) ? handlers.minItems(input, node, config) : input),
    (input) => (isMaxItemsNode(node) ? handlers.maxItems(input, node, config) : input),
    (input) => handlers.default(input, node, config),
  ]);
}
