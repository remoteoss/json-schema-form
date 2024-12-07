import { yupToFormErrors } from '../../helpers';
import { traverseSchema } from '../process-schema';
import { JSONSchema, JSONSchemaFormPlugin, ProcessSchemaConfig } from '../types';
import { string, number, boolean, array, object, lazy, ValidationError, Schema, mixed } from 'yup';
import flow from 'lodash/flow';

function getStringSchema(node: JSONSchema) {
  if (typeof node !== 'object') return string();
  let schema = string().strict();
  if (node.minLength) schema = schema.min(node.minLength);
  if (node.maxLength) schema = schema.max(node.maxLength);
  if (node.pattern) schema = schema.matches(new RegExp(node.pattern));
  return schema;
}

function getNumberSchema(node: JSONSchema) {
  if (typeof node !== 'object') return number().strict();
  let schema = number().strict();

  if (node.type === 'integer') schema = schema.integer();
  if (node.minimum) schema = schema.min(node.minimum);
  if (node.maximum) schema = schema.max(node.maximum);
  return schema;
}

function getSpecificValueSchema(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'object') return schema;
  if (node.enum && Array.isArray(node.enum)) return schema.oneOf(node.enum);
  if (node.const) return schema.oneOf([node.const]);
  return schema;
}

function getBaseSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  if (typeof node !== 'object' || !node) return mixed();

  const typesToCheck = Array.isArray(node.type) ? node.type : [node.type];

  const schemas = typesToCheck
    .map((type) => {
      switch (type) {
        case 'string':
          return getStringSchema(node);
        case 'number':
        case 'integer':
          return getNumberSchema(node);
        case 'boolean':
          return boolean().strict();
        case 'array':
          return array().strict();
        case 'object':
          return object().strict();
        case 'null':
          return mixed().nullable();
        default:
          return mixed();
      }
    })
    .map((schema) => getNullableSchema(schema, node));

  return mixed().test({
    name: 'multi-type',
    test(value, context) {
      const errors: ValidationError[] = [];

      for (const schema of schemas) {
        try {
          schema.validateSync(value);
          return true;
        } catch (err) {
          if (err instanceof ValidationError) {
            errors.push(err);
          }
        }
      }

      // If we get here, all validations failed
      const error = errors[0]; // Use first error
      return context.createError({
        message: error.message,
        path: error.path,
      });
    },
  });
}

function getNullValueSchema(schema: Schema) {
  return schema.nullable().test('is-null', 'Value must be null', (value: unknown) => {
    return value === null;
  });
}

function getNullableSchema(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'object' || !node) return schema;
  if (node.const === null) return getNullValueSchema(schema);
  if (node.type === 'null') return schema.nullable();
  return schema;
}

function getYupSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  const baseSchema = getBaseSchema(node, config);
  return flow([
    (schema) => getNullableSchema(schema, node),
    (schema) => getSpecificValueSchema(schema, node),
  ])(baseSchema);
}

function buildYupSchema(values: unknown, schema: JSONSchema) {
  return traverseSchema(schema, { values }, getYupSchema);
}

export const yupValidatorPlugin: JSONSchemaFormPlugin = {
  name: 'yup',
  type: 'validator',
  validate(values, schema) {
    let errors;

    const yupSchema = lazy(() => buildYupSchema(values, schema));

    try {
      yupSchema.validateSync(values);
    } catch (e: unknown) {
      if (e instanceof ValidationError) {
        errors = e;
      } else {
        console.warn(`Warning: An unhandled error was caught during validationSchema`, e);
      }
    }

    return {
      yupError: errors,
      formErrors: yupToFormErrors(errors),
    };
  },
};
