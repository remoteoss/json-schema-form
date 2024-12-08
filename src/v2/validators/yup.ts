import { yupToFormErrors } from '../../helpers';
import { JSONSchema, JSONSchemaFormPlugin, ProcessSchemaConfig } from '../types';
import { string, number, boolean, array, object, lazy, ValidationError, Schema, mixed } from 'yup';
import { JSONSchemaType } from 'json-schema-to-ts/lib/types/definitions';
import flow from 'lodash/flow';
import pick from 'lodash/pick';

function validateDate(schema: Schema) {
  return schema.test({
    name: 'date-format',
    test(value) {
      if (typeof value !== 'string') return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
    },
    message: `does not validate against format "date"`,
  });
}

function getFormatSchema(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'object' || !node.format) return schema;
  if (node.format === 'date') return validateDate(schema);
  return schema;
}

function getStringSchema(node: JSONSchema) {
  if (typeof node !== 'object') return string();
  let schema = string().strict();
  if (node.minLength) schema = schema.min(node.minLength);
  if (node.maxLength) schema = schema.max(node.maxLength);
  if (node.pattern) schema = schema.matches(new RegExp(node.pattern));
  if (node.format) schema = getFormatSchema(schema, node);
  return schema;
}

function getNumberSchema(node: JSONSchema) {
  if (typeof node !== 'object') return number().strict();
  let schema = number().strict();

  if (node.type === 'integer') schema = schema.integer();
  if (typeof node.minimum === 'number') schema = schema.min(node.minimum);
  if (typeof node.maximum === 'number') schema = schema.max(node.maximum);
  return schema;
}

function getSpecificValueSchema(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'object') return schema;
  if (node.enum && Array.isArray(node.enum)) return schema.oneOf(node.enum);
  if (node.const) return schema.oneOf([node.const]);
  return schema;
}

function getPropertiesForType(type: JSONSchemaType, node: JSONSchema) {
  if (typeof node !== 'object') return { type };
  if (type === 'string') {
    const stringProperties = pick(node, ['minLength', 'maxLength', 'pattern', 'format']);
    return { type: 'string', ...stringProperties };
  } else if (type === 'number') {
    const numberProperties = pick(node, ['minimum', 'maximum']);
    return { type: 'number', ...numberProperties };
  }
  return { type };
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
        getYupSchema(getPropertiesForType(type, node), config)
      );
      const errors: ValidationError[] = [];

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
      const error = errors.at(-1);
      if (error && error.type === 'typeError') {
        return context.createError({
          message: `Expected ${allowedTypes.join(' or ')}, but got ${receivedType}.`,
          path: context.path,
        });
      } else if (error) {
        return context.createError({
          message: error.message,
          path: context.path,
        });
      }
    },
  });
}

function getObjectSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>): Schema {
  if (typeof node !== 'object') return object();

  const totalKeys = [...new Set([...(node.required ?? []), ...Object.keys(node.properties ?? {})])];
  const schema = object().shape(
    Object.fromEntries(
      totalKeys.map((key) => {
        if (node.properties?.[key]) {
          const schema = getYupSchema(node.properties[key] as JSONSchema, config);
          if (node.required?.includes(key)) return [key, schema.required(`Field is required`)];
          return [key, schema];
        }
        return [key, mixed().required(`Field is required`)];
      })
    )
  );

  if (node.additionalProperties === false) return schema.strict().noUnknown(true);
  return schema;
}

function getArraySchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  if (typeof node !== 'object') return mixed();
  let schema = array().strict();
  if (node.items) schema = schema.of(getYupSchema(node.items as JSONSchema, config));
  if (node.minItems) schema = schema.min(node.minItems);
  if (node.maxItems) schema = schema.max(node.maxItems);
  return schema;
}

function isNumberNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'number' || node.type === 'integer' || node.minimum || node.maximum;
}

function isObjectNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return (
    node.type === 'object' ||
    (!node.type && !node.properties && node.required) ||
    (!node.type && node.properties) ||
    isConditionalObjectNode(node)
  );
}

function isConditionalObjectNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  const isIfObjectCondition = !!(node.if && !!node.if?.properties);
  return isIfObjectCondition;
}

function isStringNode(node: JSONSchema) {
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

function isBooleanNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'boolean' || typeof node.const === 'boolean';
}

function isArrayNode(node: JSONSchema) {
  if (typeof node !== 'object') return false;
  return node.type === 'array' || node.items || node.minItems || node.maxItems;
}

function getBaseSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  if (typeof node !== 'object' || !node) return mixed();
  if (Array.isArray(node.type)) return getMultiTypeSchema(mixed(), node, config);
  if (isObjectNode(node)) return getObjectSchema(node, config);
  if (isNumberNode(node)) return getNumberSchema(node);
  if (isStringNode(node)) return getStringSchema(node);
  if (isBooleanNode(node)) return boolean().strict();
  if (isArrayNode(node)) return getArraySchema(node, config);
  return mixed();
}

function getNullValueSchema(schema: Schema) {
  return schema.nullable().test('typeError', 'Value must be null', (value: unknown) => {
    return value === null;
  });
}

function getNullableSchema(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'object' || !node) return schema;
  if (Array.isArray(node.type) && node.type.includes('null')) return schema.nullable();
  if (node.const === null) return getNullValueSchema(schema);
  if (node.type === 'null') return getNullValueSchema(schema);
  return schema;
}

function processConditional(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  if (isConditionalObjectNode(node)) return node;
  if (typeof node !== 'object' || !node.if || !node.then) return node;
  const { if: ifNode, then: thenNode, else: elseNode, ...restNode } = node;
  const ifSchema = getYupSchema(ifNode, config);

  try {
    ifSchema.validateSync(config.values);
    if (typeof thenNode === 'object') return { ...thenNode, ...restNode };
  } catch {
    if (typeof elseNode === 'object') return { ...elseNode, ...restNode };
    return { ...restNode };
  }
}

function processConditionalSchema(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.if || !node.then) return schema;
  const ifSchema = getYupSchema(node.if, config);
  const thenSchema = getYupSchema(node.then, config);
  const elseSchema = node.else ? getYupSchema(node.else, config) : null;

  return schema.when('.', {
    is() {
      try {
        ifSchema.validateSync(config.values);
        return true;
      } catch {
        return false;
      }
    },
    then(schema) {
      return schema.concat(thenSchema);
    },
    otherwise(schema) {
      return elseSchema ? schema.concat(elseSchema) : schema;
    },
  });
}

function processAllOfConditions(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.allOf || !Array.isArray(node.allOf)) return schema;

  return node.allOf.reduce((acc, condition) => {
    const conditionSchema = lazy(() => getYupSchema(condition as JSONSchema, config));
    return acc.when('$', {
      is() {
        try {
          conditionSchema.validateSync(config.values);
          return true;
        } catch (e) {
          throw e;
        }
      },
      then(schema: Schema) {
        return schema;
      },
    });
  }, schema);
}

function handleNotKeyword(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.not) return schema;
  const notSchema = getYupSchema(node.not, config);
  return schema.test({
    name: 'not',
    test(value, context) {
      try {
        notSchema.validateSync(value);
        return context.createError({
          message: `does not match not schema`,
          path: context.path,
        });
      } catch {
        return true;
      }
    },
  });
}

function processAnyOfConditions(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.anyOf || !Array.isArray(node.anyOf)) return schema;
  return schema.test({
    name: 'any-of',
    test(value, context) {
      const schemas = node.anyOf.map((subSchema) => getYupSchema(subSchema as JSONSchema, config));
      const errors: ValidationError[] = [];

      // Check if value matches any of the schemas
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

      return context.createError({
        message: errors.map((error) => error.message).join(', '),
        errors: errors.map((error) => ({
          path: error.path,
          message: error.message,
          inner: error.inner,
        })),
      });
    },
  });
}

function getYupSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  const nodeWithConditions = processConditional(node, config);
  const baseSchema = getBaseSchema(nodeWithConditions, config);
  return flow([
    (schema) => getNullableSchema(schema, node),
    (schema) => getSpecificValueSchema(schema, node),
    (schema) => handleNotKeyword(schema, node, config),
    (schema) => processAnyOfConditions(schema, node, config),
    (schema) => processAllOfConditions(schema, node, config),
    (schema) => processConditionalSchema(schema, node, config),
  ])(baseSchema);
}

export const yupValidatorPlugin: JSONSchemaFormPlugin = {
  name: 'yup',
  type: 'validator',
  validate(values, schema) {
    let errors;

    const yupSchema = lazy(() => getYupSchema(schema, { values }));

    try {
      yupSchema.validateSync(values, { abortEarly: false });
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
