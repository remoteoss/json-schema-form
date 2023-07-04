import flow from 'lodash/flow';
import noop from 'lodash/noop';
import { randexp } from 'randexp';
import { string, number, boolean, object, array } from 'yup';

import { supportedTypes } from './internals/fields';
import { convertDiskSizeFromTo } from './utils';

/**
 * @typedef {import('./createHeadlessForm').FieldParameters} FieldParameters
 * @typedef {import('../createHeadlessForm').JsfConfig} JsfConfig
 */

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const baseString = string().trim();

const todayDateHint = new Date().toISOString().substring(0, 10);
const convertBytesToKB = convertDiskSizeFromTo('Bytes', 'KB');
const convertKbBytesToMB = convertDiskSizeFromTo('KB', 'MB');

const validateOnlyStrings = string()
  .trim()
  .nullable()
  .test(
    'is-string',
    '${path} must be a `string` type, but the final value was: `${value}`.',
    (value, context) => {
      if (context.originalValue !== null && context.originalValue !== undefined) {
        return typeof context.originalValue === 'string';
      }
      return true;
    }
  );

const yupSchemas = {
  text: validateOnlyStrings,
  radioOrSelect: (options) =>
    string()
      .nullable()
      .transform((value) => {
        if (value === '') {
          return undefined; // [1]
        }
        if (options?.includes(null)) {
          return value;
        }
        return value === null
          ? undefined // [2]
          : value;

        /*
          [1] @BUG RMT-518 - explanation from PR#18
          The "" (empty string) is to keep retrocompatibily with previous version.
          The "" does NOT match the JSON Schema specs. In the specs the `oneOf` keyword does not allow "" value by default.

          Disallowing "" would be a major BREAKING CHANGE
          because previously any string was allowed but now only the options[].value are,
          which means we'd need to also exclude "" from being accepted.   
          This would be a dangerous change as it can disrupt existing UI Form integrations
          that might handle empty fields differently ("" vs null vs undefined).

          [2] The null also needs to be always allowed for the same reason.
              Some consumers (eg Remote) expect empty optional fields to be sent as "null"
              even when their JSON Schemas are not created correctly (missing an option with const: null).
              This will allow the JSF to still mark the field as valid (false positive)
              and let the JSON Schema validator fail.

          We'd need to implement a feature_flag/transition deprecation warning
          to give devs the time to adapt their integrations before we fix this behavior.
          Check the PR#18 and tests for more details.
        */
      })
      .oneOf(options, ({ value }) => {
        return `The option ${JSON.stringify(value)} is not valid.`;
      }),
  date: string()
    .nullable()
    .trim()
    .matches(
      /(?:\d){4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9]|3[0-1])/,
      `Must be a valid date in ${DEFAULT_DATE_FORMAT.toLocaleLowerCase()} format. e.g. ${todayDateHint}`
    ),
  number: number().typeError('The value must be a number').nullable(),
  file: array().nullable(),
  email: string().trim().email('Please enter a valid email address').nullable(),
  fieldset: object().nullable(),
  checkbox: string().trim().nullable(),
  checkboxBool: boolean(),
  multiple: {
    select: array().nullable(),
    'group-array': array().nullable(),
  },
};

const yupSchemasToJsonTypes = {
  string: yupSchemas.text,
  number: yupSchemas.number,
  integer: yupSchemas.number,
  object: yupSchemas.fieldset,
  array: yupSchemas.multiple.select,
  boolean: yupSchemas.checkboxBool,
  null: noop,
};

function getRequiredErrorMessage(inputType, { inlineError, configError }) {
  if (inlineError) return inlineError;
  if (configError) return configError;
  if (inputType === supportedTypes.CHECKBOX) return 'Please acknowledge this field';
  return 'Required field';
}

const getJsonTypeInArray = (jsonType) =>
  Array.isArray(jsonType)
    ? jsonType.find((val) => val !== 'null') // eg ["string", "null"] // optional fields - get the head type.
    : jsonType; // eg "string"

const getOptions = (field) => {
  const allValues = field.options?.map((option) => option.value);

  const isOptionalWithNull =
    Array.isArray(field.jsonType) &&
    // @TODO should also check the "oneOf" directly looking for "null"
    // option but we don't have direct access at this point.
    // Otherwise the JSON Schema validator will fail as explained in PR#18
    field.jsonType.includes('null');

  return isOptionalWithNull ? [...allValues, null] : allValues;
};

const getYupSchema = ({ inputType, ...field }) => {
  const jsonType = getJsonTypeInArray(field.jsonType);

  if (field.options?.length > 0) {
    const optionValues = getOptions(field);
    return yupSchemas.radioOrSelect(optionValues);
  }

  return yupSchemas[inputType] || yupSchemasToJsonTypes[jsonType];
};

/**
 * @param {FieldParameters} field Input fields
 * @returns {Function} Yup schema
 */
export function buildYupSchema(field, config) {
  const { inputType, jsonType: jsonTypeValue, errorMessage = {}, ...propertyFields } = field;
  const isCheckboxBoolean = typeof propertyFields.checkboxValue === 'boolean';
  let baseSchema;
  const errorMessageFromConfig = config?.inputTypes?.[inputType]?.errorMessage || {};

  if (propertyFields.multiple) {
    // keep inputType while non-core are being removed #RMT-439
    baseSchema = yupSchemas.multiple[inputType] || yupSchemasToJsonTypes.array;
  } else if (isCheckboxBoolean) {
    baseSchema = yupSchemas.checkboxBool;
  } else {
    baseSchema = getYupSchema(field);
  }

  if (!baseSchema) {
    return noop;
  }

  const randomPlaceholder = propertyFields.pattern && randexp(propertyFields.pattern);
  const requiredMessage = getRequiredErrorMessage(inputType, {
    inlineError: errorMessage.required,
    configError: errorMessageFromConfig.required,
  });

  function withRequired(yupSchema) {
    if (isCheckboxBoolean) {
      // note: `false` is considered a valid boolean https://github.com/jquense/yup/issues/415#issuecomment-458154168
      return yupSchema.oneOf([true], requiredMessage).required(requiredMessage);
    }
    return yupSchema.required(requiredMessage);
  }

  function withInteger(yupSchema) {
    return yupSchema.integer(
      (message) =>
        errorMessage.integer ??
        errorMessageFromConfig.integer ??
        `Must not contain decimal points. E.g. ${Math.floor(message.value)} instead of ${
          message.value
        }`
    );
  }

  function withMin(yupSchema) {
    return yupSchema.min(
      propertyFields.minimum,
      (message) =>
        errorMessage.minimum ??
        errorMessageFromConfig.minimum ??
        `Must be greater or equal to ${message.min}`
    );
  }

  function withMinLength(yupSchema) {
    return yupSchema.min(
      propertyFields.minLength,
      (message) =>
        errorMessage.minLength ??
        errorMessageFromConfig.minLength ??
        `Please insert at least ${message.min} characters`
    );
  }

  function withMax(yupSchema) {
    return yupSchema.max(
      propertyFields.maximum,
      (message) =>
        errorMessage.maximum ??
        errorMessageFromConfig.maximum ??
        `Must be smaller or equal to ${message.max}`
    );
  }

  function withMaxLength(yupSchema) {
    return yupSchema.max(
      propertyFields.maxLength,
      (message) =>
        errorMessage.maxLength ??
        errorMessageFromConfig.maxLength ??
        `Please insert up to ${message.max} characters`
    );
  }

  function withMatches(yupSchema) {
    return yupSchema.matches(
      propertyFields.pattern,
      () =>
        errorMessage.pattern ??
        errorMessageFromConfig.pattern ??
        `Must have a valid format. E.g. ${randomPlaceholder}`
    );
  }

  function withMaxFileSize(yupSchema) {
    return yupSchema.test(
      'isValidFileSize',
      errorMessage.maxFileSize ??
        errorMessageFromConfig.maxFileSize ??
        `File size too large. The limit is ${convertKbBytesToMB(propertyFields.maxFileSize)} MB.`,
      (files) => !files?.some((file) => convertBytesToKB(file.size) > propertyFields.maxFileSize)
    );
  }

  function withFileFormat(yupSchema) {
    return yupSchema.test(
      'isSupportedFormat',
      errorMessage.accept ??
        errorMessageFromConfig.accept ??
        `Unsupported file format. The acceptable formats are ${propertyFields.accept}.`,
      (files) =>
        files && files?.length > 0
          ? files.some((file) => {
              const fileType = file.name.split('.').pop();
              return propertyFields.accept.includes(fileType.toLowerCase());
            })
          : true
    );
  }

  function withBaseSchema() {
    const customErrorMsg = errorMessage.type || errorMessageFromConfig.type;
    if (customErrorMsg) {
      return baseSchema.typeError(customErrorMsg);
    }
    return baseSchema;
  }

  function buildFieldSetSchema(innerFields) {
    const fieldSetShape = {};
    innerFields.forEach((fieldSetfield) => {
      if (fieldSetfield.fields) {
        fieldSetShape[fieldSetfield.name] = object().shape(
          buildFieldSetSchema(fieldSetfield.fields)
        );
      } else {
        fieldSetShape[fieldSetfield.name] = buildYupSchema(
          {
            ...fieldSetfield,
            inputType: fieldSetfield.type,
          },
          config
        )();
      }
    });
    return fieldSetShape;
  }

  function buildGroupArraySchema() {
    return object().shape(
      propertyFields.nthFieldGroup.fields().reduce(
        (schema, groupArrayField) => ({
          ...schema,
          [groupArrayField.name]: buildYupSchema(groupArrayField, config)(),
        }),
        {}
      )
    );
  }

  const validators = [withBaseSchema];

  if (inputType === supportedTypes.GROUP_ARRAY) {
    // build schema for the items of a group array
    validators[0] = () => withBaseSchema().of(buildGroupArraySchema());
  } else if (inputType === supportedTypes.FIELDSET) {
    // build schema for field of a fieldset
    validators[0] = () => withBaseSchema().shape(buildFieldSetSchema(propertyFields.fields));
  }

  if (propertyFields.required) {
    validators.push(withRequired);
  }

  if (propertyFields.type === 'integer') {
    validators.push(withInteger);
  }

  // support minimum with 0 value
  if (typeof propertyFields.minimum !== 'undefined') {
    validators.push(withMin);
  }

  // support minLength with 0 value
  if (typeof propertyFields.minLength !== 'undefined') {
    validators.push(withMinLength);
  }

  // support maximum with 0 value
  if (propertyFields.maximum !== undefined) {
    validators.push(withMax);
  }

  if (propertyFields.maxLength) {
    validators.push(withMaxLength);
  }

  if (propertyFields.pattern) {
    validators.push(withMatches);
  }

  if (propertyFields.maxFileSize) {
    validators.push(withMaxFileSize);
  }

  if (propertyFields.accept) {
    validators.push(withFileFormat);
  }
  return flow(validators);
}

// noSortEdges is the second parameter of shape() and ignores the order of the specified field names
// so that the field order does not matter when a field relies on another one via when()
// Docs https://github.com/jquense/yup#objectshapefields-object-nosortedges-arraystring-string-schema
// Explanation https://gitmemory.com/issue/jquense/yup/720/564591045
export function getNoSortEdges(fields = []) {
  return fields.reduce((list, field) => {
    if (field.noSortEdges) {
      list.push(field.name);
    }
    return list;
  }, []);
}

function getSchema(fields = [], config) {
  const newSchema = {};

  fields.forEach((field) => {
    if (field.schema) {
      if (field.name) {
        if (field.inputType === supportedTypes.FIELDSET) {
          // Fieldset validation schemas depend on the inner schemas of their fields,
          // so we need to rebuild it to take into account any of those updates.
          const fieldsetSchema = buildYupSchema(field, config)();
          newSchema[field.name] = fieldsetSchema;
        } else {
          newSchema[field.name] = field.schema;
        }
      } else {
        Object.assign(newSchema, getSchema(field.fields, config));
      }
    }
  });

  return newSchema;
}

/**
 * Returns the Yup schema structure of given fields.
 * These fields must be the same from
 * const { fields } = createHeadlessForm()
 * @param {Fields[]} fields - List of fields
 * @param {JsfConfig} config - Config
 * @returns
 */
export function buildCompleteYupSchema(fields, config) {
  return object().shape(getSchema(fields, config), getNoSortEdges(fields));
}
