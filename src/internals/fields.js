/* eslint-disable no-underscore-dangle */

import { getFieldDescription, pickXKey } from './helpers';

/**
 * @typedef {import('../createHeadlessForm').FieldParameters} FieldParameters
 */

/**
 * @typedef {import('../createHeadlessForm').FieldCustomization} FieldCustomization
 */

/* From https://json-schema.org/understanding-json-schema/reference/type.html */
const jsonTypes = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  OBJECT: 'object',
  ARRAY: 'array',
  BOOLEAN: 'boolean',
  NULL: 'null',
};

export const supportedTypes = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  FILE: 'file',
  RADIO: 'radio',
  GROUP_ARRAY: 'group-array',
  EMAIL: 'email',
  DATE: 'date',
  CHECKBOX: 'checkbox',
  FIELDSET: 'fieldset',
};

const jsonTypeToInputType = {
  [jsonTypes.STRING]: ({ oneOf, format }) => {
    if (format === 'email') return supportedTypes.EMAIL;
    if (format === 'date') return supportedTypes.DATE;
    if (format === 'data-url') return supportedTypes.FILE;
    if (oneOf) return supportedTypes.RADIO;
    return supportedTypes.TEXT;
  },
  [jsonTypes.NUMBER]: () => supportedTypes.NUMBER,
  [jsonTypes.INTEGER]: () => supportedTypes.NUMBER,
  [jsonTypes.OBJECT]: () => supportedTypes.FIELDSET,
  [jsonTypes.ARRAY]: ({ items }) => {
    if (items.properties) return supportedTypes.GROUP_ARRAY;
    return supportedTypes.SELECT;
  },
  [jsonTypes.BOOLEAN]: () => supportedTypes.CHECKBOX,
};

/**
 * @param {object} fieldProperties - any JSON schema field
 * @param {boolean=} strictInputType - From config.strictInputType
 * @param {name=} name - Field id (unique name)
 * @returns {keyof supportedTypes}
 */
export function getInputType(fieldProperties, strictInputType, name) {
  const presentation = pickXKey(fieldProperties, 'presentation') ?? {};
  const presentationInputType = presentation?.inputType;

  if (presentationInputType) {
    return presentationInputType;
  }

  if (strictInputType) {
    throw Error(`Strict error: Missing inputType to field "${name || fieldProperties.title}".
You can fix the json schema or skip this error by calling createHeadlessForm(schema, { strictInputType: false })`);
  }

  if (!fieldProperties.type) {
    if (fieldProperties.items?.properties) {
      return supportedTypes.GROUP_ARRAY;
    }
    if (fieldProperties.properties) {
      return supportedTypes.SELECT;
    }
    return jsonTypeToInputType[jsonTypes.STRING](fieldProperties);
  }

  return jsonTypeToInputType[fieldProperties.type]?.(fieldProperties);
}

/**
 * Return base attributes needed for a file field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {String} attrs.description - field description
 * @param {Boolean} attrs.required - field required
 * @param {String} attrs.accept - comma separated supported types
 * @return {Object}
 */
export function _composeFieldFile({ name, label, description, accept, required = true, ...attrs }) {
  return {
    type: supportedTypes.FILE,
    name,
    label,
    description,
    required,
    accept,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a text field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {String} attrs.description - field description
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldText({ name, label, description, required = true, ...attrs }) {
  return {
    type: supportedTypes.TEXT,
    name,
    label,
    description,
    required,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a email field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldEmail({ name, label, required = true, ...attrs }) {
  return {
    type: supportedTypes.EMAIL,
    name,
    label,
    required,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a number field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {Boolean} attrs.percentage - field percentage
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldNumber({
  name,
  label,
  percentage = false,
  required = true,
  minimum,
  maximum,
  ...attrs
}) {
  let minValue = minimum;
  let maxValue = maximum;

  if (percentage) {
    minValue = minValue ?? 0;
    maxValue = maxValue ?? 100;
  }

  return {
    type: supportedTypes.NUMBER,
    name,
    label,
    percentage,
    required,
    minimum: minValue,
    maximum: maxValue,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a date field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldDate({ name, label, required = true, ...attrs }) {
  return {
    type: supportedTypes.DATE,
    name,
    label,
    required,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a radio field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {Object[]} attrs.options - radio options
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldRadio({ name, label, options, required = true, ...attrs }) {
  return {
    type: supportedTypes.RADIO,
    name,
    label,
    options,
    required,
    ...attrs,
  };
}

/**
 * Return base attributes needed for a select field.
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {{ label: String, value: String }[]} attrs.options - select options - array of objects
 * @param {Boolean} attrs.required - field required
 * @return {Object}
 */
export function _composeFieldSelect({ name, label, options, required = true, ...attrs }) {
  return {
    type: supportedTypes.SELECT,
    name,
    label,
    options,
    required,
    ...attrs,
  };
}

/**
 * Return attributes needed for a group array field.
 * @param {Object} attributes
 * @param {String} attributes.name                   Field's name
 * @param {Boolean} attributes.required              Field required
 * @param {String} attributes.addFieldText    Label to be used on the add field button
 * @param {Object} attributes.nthFieldGroup
 * @param {String} attributes.nthFieldGroup.name     Field group's name
 * @param {String} attributes.nthFieldGroup.label    Field group's label
 * @param {Function} attributes.nthFieldGroup.fields Function that returns an array of dynamicForm fields.
 * @return {Array}
 */
export function _composeNthFieldGroup({ name, label, required, nthFieldGroup, ...attrs }) {
  return [
    {
      ...nthFieldGroup,
      type: supportedTypes.GROUP_ARRAY,
      name,
      label,
      required,
      ...attrs,
    },
  ];
}

/**
 * Return base attributes needed for an ack field
 * @param {Object} attrs
 * @param {String} attrs.name - field name
 * @param {String} attrs.label - field label
 * @param {String} attrs.description - field description
 * @param {String} attrs.default - specifies a default value for the checkbox
 * @param {String} attrs.checkboxValue - value that's set to the form when the input is checked
 * @return {Object}
 */
export function _composeFieldCheckbox({
  required = true,
  name,
  label,
  description,
  default: defaultValue,
  checkboxValue,
  ...attrs
}) {
  return {
    type: supportedTypes.CHECKBOX,
    required,
    name,
    label,
    description,
    checkboxValue,
    ...(defaultValue && { default: defaultValue }),
    ...attrs,
  };
}

/**
 * Return attributes needed for a fieldset.
 * @param {Object} attributes
 * @param {String} attributes.name
 * @param {String} attributes.label
 * @param {Array} attributes.fields
 * @param {"default" | "focused"} [attributes.variant]
 * @return {Array}
 */
export function _composeFieldset({ name, label, fields, variant, ...attrs }) {
  return {
    type: supportedTypes.FIELDSET,
    name,
    label,
    fields,
    variant,
    ...attrs,
  };
}

/**
 * Return attributes needed for an arbitrary field.
 * @param {Object} attrs
 * @param {String} attrs.name
 * @param {String} attrs.label
 * @return {Array}
 */
export const _composeFieldArbitraryClosure = (inputType) => (attrs) => ({
  type: inputType,
  ...attrs,
});

export const inputTypeMap = {
  text: _composeFieldText,
  select: _composeFieldSelect,
  radio: _composeFieldRadio,
  date: _composeFieldDate,
  number: _composeFieldNumber,
  'group-array': _composeNthFieldGroup,
  fieldset: _composeFieldset,
  file: _composeFieldFile,
  email: _composeFieldEmail,
  checkbox: _composeFieldCheckbox,
};

/**
 * Returns an input compose function for a customized field
 * @param {String} type - inputType
 */
export function _composeFieldCustomClosure(defaultComposeFn) {
  /**
   * @param {FieldParameters & {fieldCustomization: FieldCustomization}} params - attributes
   * @returns {Object}
   */
  return ({ fieldCustomization, ...attrs }) => {
    const { description, ...restFieldCustomization } = fieldCustomization;
    const fieldDescription = getFieldDescription(attrs, fieldCustomization);
    const { nthFieldGroup, ...restAttrs } = attrs;
    const commonAttrs = {
      ...restAttrs,
      ...restFieldCustomization,
      ...fieldDescription,
    };

    if (attrs.inputType === supportedTypes.GROUP_ARRAY) {
      return [
        {
          ...nthFieldGroup,
          ...commonAttrs,
        },
      ];
    }

    return {
      ...defaultComposeFn(attrs),
      ...commonAttrs,
    };
  };
}
