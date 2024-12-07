import { yupToFormErrors } from '../../helpers';
import { traverseSchema } from '../process-schema';
import { JSONSchema, JSONSchemaFormPlugin, ProcessSchemaConfig } from '../types';
import { string, number, boolean, array, object, lazy, ValidationError, Schema, mixed } from 'yup';
import flow from 'lodash/flow';
import { JSONSchemaType } from 'json-schema-to-ts/lib/types/definitions';

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

function getMultiTypeSchema(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.type || !Array.isArray(node.type)) return schema;
  return schema.test({
    name: 'multi-type',
    test(value, context) {
      const schemas = (node.type as Array<JSONSchemaType>).map((type) =>
        getYupSchema({ ...node, type }, config)
      );
      const errors: ValidationError[] = [];

      // Check if any schema validates
      if (
        schemas.some((schema) => {
          try {
            schema.validateSync(value);
            return true;
          } catch (e) {
            errors.push(e);
            return false;
          }
        })
      ) {
        return true;
      }

      const allowedTypes = node.type as string[];
      const receivedType = typeof value;

      const nonTypeError = errors.find((err) => err.type !== 'typeError');
      if (nonTypeError) {
        return context.createError({
          message: nonTypeError.message,
          path: context.path,
        });
      }

      return context.createError({
        message: `Expected ${allowedTypes.join(' or ')}, but got ${receivedType}.`,
        path: context.path,
      });
    },
  });
}

function getBaseSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  if (typeof node !== 'object' || !node) return mixed();

  switch (node.type) {
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
    (schema) => getMultiTypeSchema(schema, node, config),
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
