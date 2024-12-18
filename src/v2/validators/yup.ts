import { yupToFormErrors } from '../../helpers';
import { JSONSchema, JSONSchemaFormPlugin, JSONSchemaObject, ProcessSchemaConfig } from '../types';
import { string, number, boolean, array, object, lazy, ValidationError, Schema, mixed } from 'yup';
import { JSONSchemaType } from 'json-schema-to-ts/lib/types/definitions';
import flow from 'lodash/flow';
import pick from 'lodash/pick';
import { visitNodeType, visitKeywordNode } from '../node-checks';
import { canonicalize, validDate } from '../utils';

function validateDate(schema: Schema) {
  return schema.test({
    name: 'date-format',
    test: validDate,
    message: `does not validate against format "date"`,
  });
}

function getFormatSchema(schema: Schema, node: JSONSchemaObject) {
  if (typeof node !== 'object' || !node.format) return schema;
  if (node.format === 'date') return validateDate(schema);
  return schema;
}

function getStringSchema(node: JSONSchemaObject) {
  let schema = string().strict();
  if (node.minLength) schema = schema.min(node.minLength);
  if (node.maxLength) schema = schema.max(node.maxLength);
  if (node.pattern) schema = schema.matches(new RegExp(node.pattern));
  if (node.format) schema = getFormatSchema(schema, node);
  return schema;
}

function getNumberSchema(node: JSONSchemaObject) {
  if (typeof node !== 'object') return number().strict();
  let schema = number().strict();

  if (node.type === 'integer') schema = schema.integer();
  if (typeof node.minimum === 'number') schema = schema.min(node.minimum);
  if (typeof node.maximum === 'number') schema = schema.max(node.maximum);
  return schema;
}

function getPropertiesForType(type: JSONSchemaType, node: JSONSchemaObject) {
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
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
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

function processProperties(node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchema>) {
  const propertyKeys = Object.keys(node.properties ?? {});
  let schema = object().shape(
    Object.fromEntries(
      propertyKeys.map((key) => {
        if (node.properties?.[key]) {
          const propertySchema = getYupSchema(node.properties[key] as JSONSchema, config);
          if (node.required?.includes(key)) {
            return [key, propertySchema.required('Field is required')];
          }
          return [key, propertySchema];
        }
        return [key, mixed()];
      })
    )
  );
  if (node.patternProperties) {
    schema = processPatternProperties(schema, node, config);
  }
  if (node.additionalProperties) {
    schema = processAdditionalProperties(schema, node, config);
  }
  return schema;
}

function getObjectSchema(node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchema>): Schema {
  return mixed().when('$', {
    is() {
      const skipObjectValidation =
        !node.type &&
        Object.hasOwn(node, 'properties') &&
        (typeof config.values !== 'object' || Array.isArray(config.values));

      if (skipObjectValidation) return false;
      return node.type === 'object' || Object.hasOwn(node, 'properties');
    },
    then() {
      return processProperties(node, config);
    },
    otherwise(schema) {
      return schema;
    },
  });
}

function getArraySchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  let schema = array().strict();
  if (typeof node === 'object' && node.items)
    schema = schema.of(getYupSchema(node.items as JSONSchema, config));
  if (typeof node === 'object' && node.minItems) schema = schema.min(node.minItems);
  if (typeof node === 'object' && node.maxItems) schema = schema.max(node.maxItems);
  return schema;
}

function getNullValueSchema(schema: Schema) {
  return schema.nullable().test('typeError', 'Value must be null', (value: unknown) => {
    return value === null;
  });
}

function getNullableSchema(schema: Schema, node: JSONSchema) {
  if (Array.isArray(node.type) && node.type.includes('null')) return schema.nullable();
  if (node.const === null) return getNullValueSchema(schema);
  return schema;
}

function processConditionalSchema(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
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
  return schema.test({
    name: 'any-of',
    test(value, context) {
      const schemas = node.anyOf.map((subSchema) => getYupSchema(subSchema as JSONSchema, config));
      const errors: ValidationError[] = [];

      if (
        schemas.some((schema) => {
          try {
            schema.validateSync(value);
            return true;
          } catch (e: unknown) {
            errors.push(e as ValidationError);
            return false;
          }
        })
      ) {
        return true;
      }

      return context.createError({
        message: 'Invalid anyOf match',
        errors: errors.map((error) => ({
          path: error.path,
          message: error.message,
          inner: error.inner,
        })),
      });
    },
  });
}

function processOneOfSchema(
  schema: Schema,
  node: JSONSchema,
  config: ProcessSchemaConfig<JSONSchema>
) {
  return schema.test({
    name: 'one-of',
    test(value, context) {
      const errors: ValidationError[] = [];
      const schemas = node.oneOf.map((subSchema) => getYupSchema(subSchema as JSONSchema, config));
      const validCount = schemas.reduce((acc, schema) => {
        try {
          schema.validateSync(value);
          return acc + 1;
        } catch (e) {
          errors.push(e as ValidationError);
          return acc;
        }
      }, 0);
      if (validCount === 1) return true;
      return context.createError({
        message: `must match exactly one schema but matched ${validCount} schemas`,
        params: { validCount },
      });
    },
  });
}

function processBoolean(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'boolean') return schema;
  return schema
    .test({
      name: 'boolean',
      test() {
        return node;
      },
    })
    .nullable();
}

function processUniqueItems(
  schema: Schema,
  node: JSONSchema,
  _config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || !node.uniqueItems) return schema;
  return schema.test({
    name: 'unique-items',
    test(value = []) {
      const canonicalized = value.map(canonicalize);
      return canonicalized.length === new Set(canonicalized).size;
    },
  });
}

function processAdditionalItems(
  schema: Schema,
  node: JSONSchema,
  _config: ProcessSchemaConfig<JSONSchema>
) {
  if (typeof node !== 'object' || node.additionalItems !== false || !Array.isArray(node.items)) {
    return schema;
  }

  return schema.test({
    name: 'additional-items',
    test(value, context) {
      if (!Array.isArray(value)) return true;
      if (value.length > (node.items as JSONSchema[]).length) {
        return context.createError({
          message: `array length ${value.length} is greater than allowed length ${
            (node.items as JSONSchema[]).length
          }`,
        });
      }
      return true;
    },
  });
}

function processRequired(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  if (!node.required?.length) return schema;
  node.required.forEach((key: string) => {
    schema = schema.test({
      name: 'required',
      test(value, context) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          return true;
        }
        if (Object.hasOwn(value, key)) {
          return true;
        }
        return context.createError({
          message: 'Field is required',
          path: `${context.path ? context.path + '.' : ''}${key}`,
        });
      },
    });
  });
  return schema;
}

function processPatternProperties(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'pattern-properties',
    test(value, context) {
      let errors: ValidationError[] = [];

      Object.entries(value).forEach(([key, propValue]) => {
        Object.entries(node.patternProperties).forEach(([pattern, patternNode]) => {
          const isMatch = new RegExp(pattern).test(key);
          if (isMatch) {
            const patternSchema = getYupSchema(patternNode as JSONSchema, config);
            try {
              patternSchema.validateSync(propValue);
            } catch (e) {
              errors.push({
                ...(e as ValidationError),
                path: context.path ? `${context.path}.${key}` : key,
              });
            }
          }
        });
      });

      const error = errors.at(-1);
      if (error) {
        return context.createError({
          message: error.message,
          path: error.path,
        });
      }

      return true;
    },
  });
}

function processAdditionalProperties(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  // If additionalProperties is false, make the object strict
  if (node.additionalProperties === false) {
    return schema.strict().noUnknown(true);
  }

  return schema.test({
    name: 'additional-properties',
    test(value, context) {
      const knownProps = Object.keys(node.properties || {});
      const patternProps = Object.keys(node.patternProperties || {});
      const additionalProps = Object.keys(value).filter((key) => {
        const matchesPattern = patternProps.some((pattern) => new RegExp(pattern).test(key));
        return !knownProps.includes(key) && !matchesPattern;
      });
      const additionalSchema = getYupSchema(node.additionalProperties as JSONSchema, config);
      for (const key of additionalProps) {
        additionalSchema.validateSync(value[key]);
      }
      return true;
    },
  });
}

function handleKeyword(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchema>
) {
  return visitKeywordNode(
    node,
    {
      required: (schema, node) => processRequired(schema, node, config),
      patternProperties: (schema, node) => processPatternProperties(schema, node, config),
      additionalProperties: (schema, node) => processAdditionalProperties(schema, node, config),
      enum: (schema, node) => schema.oneOf(node.enum),
      const: (schema, node) => schema.oneOf([node.const]),
      not: (schema, node) => handleNotKeyword(schema, node, config),
      anyOf: (schema, node) => processAnyOfConditions(schema, node, config),
      allOf: (schema, node) => processAllOfConditions(schema, node, config),
      conditional: (schema, node) => processConditionalSchema(schema, node, config),
      oneOf: (schema, node) => processOneOfSchema(schema, node, config),
      uniqueItems: (schema, node) => processUniqueItems(schema, node, config),
      additionalItems: (schema, node) => processAdditionalItems(schema, node, config),
      default: (schema) => schema,
    },
    config
  )(schema);
}

function getBaseSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  return visitNodeType(
    node,
    {
      multiType: () => getMultiTypeSchema(mixed(), node, config),
      object: () => getObjectSchema(node, config),
      number: () => getNumberSchema(node),
      string: () => getStringSchema(node),
      boolean: () => boolean().strict(),
      array: () => getArraySchema(node, config),
      nullType: () => getNullValueSchema(mixed()),
      default: () => mixed().nullable(),
    },
    config
  );
}

function getYupSchema(node: JSONSchemaObject, config: ProcessSchemaConfig<JSONSchema>) {
  return flow([
    () => getBaseSchema(node, config),
    (schema) => handleKeyword(schema, node, config),
    (schema) => getNullableSchema(schema, node),
    (schema) => processBoolean(schema, node),
  ])();
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

//   if (node.additionalProperties === false) return schema.strict().noUnknown(true);