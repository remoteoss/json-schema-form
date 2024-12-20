import { yupToFormErrors } from '../../helpers';
import { JSONSchema, JSONSchemaFormPlugin, JSONSchemaObject, ProcessSchemaConfig } from '../types';
import { string, number, boolean, array, object, lazy, ValidationError, Schema, mixed } from 'yup';
import { JSONSchemaType } from 'json-schema-to-ts/lib/types/definitions';
import flow from 'lodash/flow';
import pick from 'lodash/pick';
import { visitNodeType, visitKeywordNode } from '../node-checks';
import { canonicalize, getGraphemeLength, validDate, validDateTime } from '../utils';

function getStringSchema(node: JSONSchemaObject) {
  return string().strict();
}

function getNumberSchema(node: JSONSchemaObject) {
  if (typeof node !== 'object') return number().strict();
  let schema = number().strict();

  if (node.type === 'integer') schema = schema.integer();
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
        if (Object.hasOwn(node.properties, key)) {
          if (node.properties[key] === false) {
            return [
              key,
              mixed().test('never-valid-when-value-present', (value) => {
                if (value === undefined) return true;
                return false;
              }),
            ];
          }
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
  schema = handleKeyword(schema, node, config);
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
  const thenSchema = node.then ? getYupSchema(node.then, config) : null;
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
      // edge case handling for boolean schema
      if (value === false || value === null) return !node.not;
      if (!value) return true;

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
  schema = schema.test({
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
  return schema;
}

function processBoolean(schema: Schema, node: JSONSchema) {
  if (typeof node !== 'boolean') return schema;
  return schema
    .test({
      name: 'boolean',
      test(value) {
        if (value === undefined) return true;
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
      let errors: ValidationError[] = [];
      const knownProps = Object.keys(node.properties || {});
      const patternProps = Object.keys(node.patternProperties || {});
      const additionalProps = Object.keys(value).filter((key) => {
        const matchesPattern = patternProps.some((pattern) => new RegExp(pattern).test(key));
        return !knownProps.includes(key) && !matchesPattern;
      });
      const additionalSchema = getYupSchema(node.additionalProperties as JSONSchema, config);
      for (const key of additionalProps) {
        try {
          additionalSchema.validateSync(value[key]);
        } catch (e) {
          errors.push({
            ...(e as ValidationError),
            path: context.path ? `${context.path}.${key}` : key,
          });
        }
      }
      let error = errors.at(-1);
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

function processPattern(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'pattern',
    test(value, context) {
      if (typeof value !== 'string') return true;
      const match = new RegExp(node.pattern).test(value);
      if (!match) {
        return context.createError({
          message: `this must match the following: "/${node.pattern}/"`,
          path: context.path,
        });
      }
      return true;
    },
  });
}

function processMinLength(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'min-length',
    test(value, context) {
      if (typeof value !== 'string') return true;
      const length = getGraphemeLength(value);
      const valid = length >= node.minLength;
      if (!valid) {
        return context.createError({
          message: `this must be at least ${node.minLength} characters`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processMaxLength(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'max-length',
    test(value, context) {
      if (typeof value !== 'string') return true;
      const length = getGraphemeLength(value);
      const valid = length <= node.maxLength;
      if (!valid) {
        return context.createError({
          message: `this must be at most ${node.maxLength} characters`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processMultipleOf(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'multiple-of',
    test(value, context) {
      if (typeof value !== 'number') return true;
      // Handle floating point precision by rounding to a safe number of decimal places
      const remainder = (value / node.multipleOf) % 1;
      const isMultiple =
        Math.abs(remainder) < Number.EPSILON || Math.abs(1 - remainder) < Number.EPSILON;

      if (!isMultiple) {
        return context.createError({
          message: `this must be a multiple of ${node.multipleOf}`,
          path: context.path,
        });
      }
      return true;
    },
  });
}

function processMinimum(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'minimum',
    test(value, context) {
      if (typeof value !== 'number') return true;
      const valid = value >= node.minimum;
      if (!valid) {
        return context.createError({
          message: `this must be greater than or equal to ${node.minimum}`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processMaximum(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'maximum',
    test(value, context) {
      if (typeof value !== 'number') return true;
      const valid = value <= node.maximum;
      if (!valid) {
        return context.createError({
          message: `this must be less than or equal to ${node.maximum}`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processMinItems(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'min-items',
    test(value, context) {
      if (!Array.isArray(value)) return true;
      const valid = value.length >= node.minItems;
      if (!valid) {
        return context.createError({
          message: `this field must have at least ${node.minItems} items`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processMaxItems(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'max-items',
    test(value, context) {
      if (!Array.isArray(value)) return true;
      const valid = value.length <= node.maxItems;
      if (!valid) {
        return context.createError({
          message: `this field must have less than or equal to ${node.maxItems} items`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processItems(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'items',
    test(value, context) {
      if (!Array.isArray(value)) return true;

      // Handle array of schemas case
      if (Array.isArray(node.items)) {
        let errors: ValidationError[] = [];
        node.items.forEach((itemSchema, index) => {
          const item = value[index];
          try {
            const schema = getYupSchema(itemSchema as JSONSchema, config);
            schema.validateSync(item);
          } catch (e) {
            errors.push({
              ...(e as ValidationError),
              path: context.path ? `${context.path}.${index}` : String(index),
            });
          }
        });
        if (errors.length > 0) {
          return context.createError({
            message: errors.at(-1)?.message,
            path: errors.at(-1)?.path,
          });
        }
        return true;
      }

      // Handle single schema case
      const itemsSchema = getYupSchema(node.items as JSONSchema, config);
      for (let index = 0; index < value.length; index++) {
        const item = value[index];
        try {
          itemsSchema.validateSync(item);
        } catch (e) {
          return context.createError({
            message: (e as ValidationError).message.replace(/^this/, `[${index}]`),
            path: context.path ? `${context.path}.${index}` : String(index),
          });
        }
      }
      return true;
    },
  });
}

function processExclusiveMaximum(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'exclusive-maximum',
    test(value, context) {
      if (typeof value !== 'number') return true;
      const valid = value < node.exclusiveMaximum;
      if (!valid) {
        return context.createError({
          message: `this must be less than ${node.exclusiveMaximum}`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function processExclusiveMinimum(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'exclusive-minimum',
    test(value, context) {
      if (typeof value !== 'number') return true;
      const valid = value > node.exclusiveMinimum;
      if (!valid) {
        return context.createError({
          message: `this must be greater than ${node.exclusiveMinimum}`,
          path: context.path,
        });
      }
      return valid;
    },
  });
}

function handleDateFormat(value: any, context: any) {
  const valid = validDate(value);
  if (!valid) {
    return context.createError({
      message: `this must be a valid date`,
      path: context.path,
    });
  }
  return valid;
}

function handleDateTimeFormat(value: any, context: any) {
  const valid = validDateTime(value);
  if (!valid) {
    return context.createError({
      message: `this must be a valid date-time`,
      path: context.path,
    });
  }
  return valid;
}

function handleEmailFormat(value: any, context: any) {
  try {
    string().email().validateSync(value);
    return true;
  } catch (e) {
    return context.createError({
      message: `this must be a valid email`,
      path: context.path,
    });
  }
}

function processFormat(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'format',
    test(value, context) {
      if (typeof value !== 'string') return true;
      if (node.format === 'date') {
        return handleDateFormat(value, context);
      } else if (node.format === 'date-time') {
        return handleDateTimeFormat(value, context);
      } else if (node.format === 'email') {
        return handleEmailFormat(value, context);
      }
    },
  });
}

function processEnum(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'enum',
    test(value, context) {
      if (value === undefined) return true;

      const hasValue = node.enum.findIndex(
        (v: unknown) => JSON.stringify(v) === JSON.stringify(value)
      );

      if (hasValue === -1) {
        return context.createError({
          message: `this must be one of the following values: ${node.enum.join(', ')}`,
          path: context.path,
        });
      }
      return true;
    },
  });
}

function processDependencies(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  if (!node.dependencies) return schema;

  return schema.test({
    name: 'dependencies',
    test(value, context) {
      if (typeof value !== 'object' || value === null) return true;

      for (const [prop, dependency] of Object.entries(node.dependencies)) {
        // Skip if the property that triggers the dependency isn't present
        if (!Object.hasOwn(value, prop)) continue;

        // Handle boolean dependencies
        if (typeof dependency === 'boolean') {
          if (!dependency) {
            return context.createError({
              message: `Property ${prop} is not allowed`,
              path: context.path,
            });
          }
          continue;
        }

        // Handle property dependencies (array of required properties)
        if (Array.isArray(dependency)) {
          const missing = dependency.filter((dep) => !Object.hasOwn(value, dep));
          if (missing.length > 0) {
            return context.createError({
              message: `Property ${prop} requires properties ${missing.join(', ')}`,
              path: context.path,
            });
          }
        }
        // Handle schema dependencies
        else if (typeof dependency === 'object') {
          try {
            const dependencySchema = getYupSchema(dependency as JSONSchema, config);
            dependencySchema.validateSync(value);
          } catch (e) {
            return context.createError({
              message: (e as ValidationError).message,
              path: (e as ValidationError).path,
            });
          }
        }
      }
      return true;
    },
  });
}

function processContains(
  schema: Schema,
  node: JSONSchemaObject,
  config: ProcessSchemaConfig<JSONSchemaObject>
) {
  if (!node.contains) return schema;

  return schema.test({
    name: 'contains',
    test(value, context) {
      if (!Array.isArray(value)) return true;

      const containsSchema = getYupSchema(node.contains as JSONSchema, config);
      const hasMatch = value.some((item) => {
        try {
          containsSchema.validateSync(item);
          return true;
        } catch {
          return false;
        }
      });

      if (!hasMatch) {
        return context.createError({
          message: 'array must contain at least one matching item',
          path: context.path,
        });
      }

      return true;
    },
  });
}

function processConst(
  schema: Schema,
  node: JSONSchemaObject,
  _config: ProcessSchemaConfig<JSONSchemaObject>
) {
  return schema.test({
    name: 'const',
    test(value, context) {
      // Skip validation if value is undefined
      if (value === undefined) return true;

      const isEqual =
        JSON.stringify(canonicalize(value)) === JSON.stringify(canonicalize(node.const));

      if (!isEqual) {
        return context.createError({
          message: `this must be equal to constant: ${JSON.stringify(node.const)}`,
          path: context.path,
        });
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
      contains: (schema, node) => processContains(schema, node, config),
      required: (schema, node) => processRequired(schema, node, config),
      patternProperties: (schema, node) => processPatternProperties(schema, node, config),
      pattern: (schema, node) => processPattern(schema, node, config),
      minLength: (schema, node) => processMinLength(schema, node, config),
      maxLength: (schema, node) => processMaxLength(schema, node, config),
      minimum: (schema, node) => processMinimum(schema, node, config),
      maximum: (schema, node) => processMaximum(schema, node, config),
      exclusiveMaximum: (schema, node) => processExclusiveMaximum(schema, node, config),
      exclusiveMinimum: (schema, node) => processExclusiveMinimum(schema, node, config),
      additionalProperties: (schema, node) => processAdditionalProperties(schema, node, config),
      enum: (schema, node) => processEnum(schema, node, config),
      const: (schema, node) => processConst(schema, node, config),
      not: (schema, node) => handleNotKeyword(schema, node, config),
      anyOf: (schema, node) => processAnyOfConditions(schema, node, config),
      multipleOf: (schema, node) => processMultipleOf(schema, node, config),
      items: (schema, node) => processItems(schema, node, config),
      allOf: (schema, node) => processAllOfConditions(schema, node, config),
      if: (schema, node) => processConditionalSchema(schema, node, config),
      oneOf: (schema, node) => processOneOfSchema(schema, node, config),
      uniqueItems: (schema, node) => processUniqueItems(schema, node, config),
      additionalItems: (schema, node) => processAdditionalItems(schema, node, config),
      minItems: (schema, node) => processMinItems(schema, node, config),
      maxItems: (schema, node) => processMaxItems(schema, node, config),
      format: (schema, node) => processFormat(schema, node, config),
      dependencies: (schema, node) => processDependencies(schema, node, config),
      default: (schema) => schema,
    },
    config
  )(schema);
}

function getBaseSchema(node: JSONSchema, config: ProcessSchemaConfig<JSONSchema>) {
  const schema = mixed();
  return visitNodeType(
    node,
    {
      multiType: () => getMultiTypeSchema(mixed(), node, config),
      object: () => getObjectSchema(node, config),
      number: () => getNumberSchema(node),
      string: () => getStringSchema(node),
      boolean: () => boolean().strict(),
      array: () => getArraySchema(node, config),
      nullType: () => getNullValueSchema(schema),
      default: () => schema.nullable(),
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
