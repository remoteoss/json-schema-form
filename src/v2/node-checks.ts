import { JSONSchema } from './types';

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
