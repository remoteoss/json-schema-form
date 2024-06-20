import isNil from 'lodash/isNil';
import omitBy from 'lodash/omitBy';
import { object } from 'yup';

import { createHeadlessForm } from '../createHeadlessForm';

import {
  JSONSchemaBuilder,
  schemaInputTypeText,
  schemaInputTypeRadioDeprecated,
  schemaInputTypeRadio,
  schemaInputTypeRadioRequiredAndOptional,
  schemaInputRadioOptionalNull,
  schemaInputRadioOptionalConventional,
  schemaInputTypeRadioOptionsWithDetails,
  schemaInputTypeRadioWithoutOptions,
  schemaInputTypeSelectSoloDeprecated,
  schemaInputTypeSelectSolo,
  schemaInputTypeSelectMultipleDeprecated,
  schemaInputTypeSelectMultiple,
  schemaInputTypeSelectMultipleOptional,
  schemaInputTypeFieldset,
  schemaInputTypeNumber,
  schemaInputTypeNumberZeroMaximum,
  schemaInputTypeDate,
  schemaInputTypeEmail,
  schemaInputWithStatement,
  schemaInputTypeCheckbox,
  schemaInputTypeCheckboxBooleans,
  schemaWithOrderKeyword,
  schemaWithPositionDeprecated,
  schemaDynamicValidationConst,
  schemaDynamicValidationMinimumMaximum,
  schemaDynamicValidationMinLengthMaxLength,
  schemaDynamicValidationContains,
  schemaAnyOfValidation,
  schemaWithoutInputTypes,
  schemaWithoutTypes,
  mockFileInput,
  mockRadioCardInput,
  mockRadioCardExpandableInput,
  mockTelWithPattern,
  mockTextInput,
  mockTextInputDeprecated,
  mockNumberInput,
  mockNumberInputWithPercentageAndCustomRange,
  schemaInputTypeIntegerNumber,
  mockTextPatternInput,
  mockTextMaxLengthInput,
  mockFieldset,
  mockNestedFieldset,
  mockGroupArrayInput,
  schemaFieldsetScopedCondition,
  schemaWithConditionalToFieldset,
  schemaWithConditionalPresentationProperties,
  schemaWithConditionalReadOnlyProperty,
  schemaWithWrongConditional,
  schemaWithConditionalAcknowledgementProperty,
  schemaInputTypeNumberWithPercentage,
  schemaForErrorMessageSpecificity,
  jsfConfigForErrorMessageSpecificity,
} from './helpers';
import { mockConsole, restoreConsoleAndEnsureItWasNotCalled } from './testUtils';

function buildJSONSchemaInput({ presentationFields, inputFields = {}, required }) {
  return {
    type: 'object',
    properties: {
      test: {
        description: 'Test description',
        presentation: {
          ...presentationFields,
        },
        title: 'Test title',
        type: 'number',
        ...inputFields,
      },
    },
    required: required ? ['test'] : [],
  };
}

function friendlyError({ formErrors }) {
  // destruct the formErrors directly
  return formErrors;
}

// Get a field by name recursively
// eg getField(demo, "age") -> returns "age" field
// eg getField(demo, child, name) -> returns "child.name" subfield
const getField = (fields, name, ...subNames) => {
  const field = fields.find((f) => f.name === name);
  if (subNames.length > 0) {
    return getField(field.fields, ...subNames);
  }
  return field;
};

beforeEach(mockConsole);
afterEach(restoreConsoleAndEnsureItWasNotCalled);

describe('createHeadlessForm', () => {
  it('returns empty result given no schema', () => {
    const result = createHeadlessForm();

    expect(result).toMatchObject({
      fields: [],
    });
    expect(result.isError).toBe(false);
    expect(result.error).toBeFalsy();
  });

  it('returns an error given invalid schema', () => {
    const result = createHeadlessForm({ foo: 1 });

    expect(result.fields).toHaveLength(0);
    expect(result.isError).toBe(true);

    expect(console.error).toHaveBeenCalledWith(`JSON Schema invalid!`, expect.any(Error));
    console.error.mockClear();

    expect(result.error.message).toBe(`Cannot convert undefined or null to object`);
  });

  describe('field support fallback', () => {
    it('sets type from presentation.inputType', () => {
      const { fields } = createHeadlessForm({
        properties: {
          age: {
            title: 'Age',
            presentation: { inputType: 'number' },
            type: 'number',
          },
          starting_time: {
            title: 'Starting time',
            presentation: {
              inputType: 'hour', // Arbitrary types are accepted
              set: 'AM', // And even any arbitrary presentation keys
            },
            type: 'string',
          },
        },
      });

      const { schema: yupSchema1, ...fieldAge } = omitBy(fields[0], isNil);
      const { schema: yupSchema2, ...fieldTime } = omitBy(fields[1], isNil);

      expect(yupSchema1).toEqual(expect.any(Object));
      expect(fieldAge).toMatchObject({
        inputType: 'number',
        jsonType: 'number',
        type: 'number',
      });

      expect(yupSchema1).toEqual(expect.any(Object));
      expect(fieldTime).toMatchObject({
        inputType: 'hour',
        jsonType: 'string',
        name: 'starting_time',
        type: 'hour',
        set: 'AM',
      });
    });

    it('fails given a json schema without inputType', () => {
      const { fields, error } = createHeadlessForm({
        properties: {
          test: { type: 'string' },
        },
      });

      expect(fields).toHaveLength(0);
      expect(error.message).toContain('Strict error: Missing inputType to field "test"');

      expect(console.error).toHaveBeenCalledWith(`JSON Schema invalid!`, expect.any(Error));
      console.error.mockClear();
    });

    function extractTypeOnly(listOfFields) {
      const list = Array.isArray(listOfFields) ? listOfFields : listOfFields?.(); // handle fieldset + group-array
      return list?.map(
        ({ name, type, inputType, jsonType, label, options, fields: nestedFields }) => {
          return omitBy(
            {
              name,
              type, // @deprecated
              inputType,
              jsonType,
              label,
              options,
              fields: extractTypeOnly(nestedFields),
            },
            isNil
          );
        }
      );
    }

    it('given a json schema without inputType, sets type based on json type (when strictInputType:false)', () => {
      const { fields } = createHeadlessForm(schemaWithoutInputTypes, {
        strictInputType: false,
      });

      const fieldsByNameAndType = extractTypeOnly(fields);
      expect(fieldsByNameAndType).toMatchInlineSnapshot(`
        [
          {
            "inputType": "text",
            "jsonType": "string",
            "label": "A string -> text",
            "name": "a_string",
            "type": "text",
          },
          {
            "inputType": "radio",
            "jsonType": "string",
            "label": "A string with oneOf -> radio",
            "name": "a_string_oneOf",
            "options": [
              {
                "label": "Yes",
                "value": "yes",
              },
              {
                "label": "No",
                "value": "no",
              },
            ],
            "type": "radio",
          },
          {
            "inputType": "email",
            "jsonType": "string",
            "label": "A string with format:email -> email",
            "name": "a_string_email",
            "type": "email",
          },
          {
            "inputType": "date",
            "jsonType": "string",
            "label": "A string with format:email -> date",
            "name": "a_string_date",
            "type": "date",
          },
          {
            "inputType": "file",
            "jsonType": "string",
            "label": "A string with format:data-url -> file",
            "name": "a_string_file",
            "type": "file",
          },
          {
            "inputType": "number",
            "jsonType": "number",
            "label": "A number -> number",
            "name": "a_number",
            "type": "number",
          },
          {
            "inputType": "number",
            "jsonType": "integer",
            "label": "A integer -> number",
            "name": "a_integer",
            "type": "number",
          },
          {
            "inputType": "checkbox",
            "jsonType": "boolean",
            "label": "A boolean -> checkbox",
            "name": "a_boolean",
            "type": "checkbox",
          },
          {
            "fields": [
              {
                "inputType": "text",
                "jsonType": "string",
                "name": "foo",
                "type": "text",
              },
              {
                "inputType": "text",
                "jsonType": "string",
                "name": "bar",
                "type": "text",
              },
            ],
            "inputType": "fieldset",
            "jsonType": "object",
            "label": "An object -> fieldset",
            "name": "a_object",
            "type": "fieldset",
          },
          {
            "inputType": "select",
            "jsonType": "array",
            "label": "An array items.anyOf -> select",
            "name": "a_array_items",
            "options": [
              {
                "label": "Chrome",
                "value": "chr",
              },
              {
                "label": "Firefox",
                "value": "ff",
              },
              {
                "label": "Internet Explorer",
                "value": "ie",
              },
            ],
            "type": "select",
          },
          {
            "fields": [
              {
                "inputType": "text",
                "jsonType": "string",
                "label": "Role",
                "name": "role",
                "type": "text",
              },
              {
                "inputType": "number",
                "jsonType": "number",
                "label": "Years",
                "name": "years",
                "type": "number",
              },
            ],
            "inputType": "group-array",
            "jsonType": "array",
            "label": "An array items.properties -> group-array",
            "name": "a_array_properties",
            "type": "group-array",
          },
          {
            "inputType": "text",
            "label": "A void -> text",
            "name": "a_void",
            "type": "text",
          },
        ]
      `);
    });

    it('given a json schema without json type, sets type based on structure (when strictInputType:false)', () => {
      const { fields } = createHeadlessForm(schemaWithoutTypes, {
        strictInputType: false,
      });

      const fieldsByNameAndType = extractTypeOnly(fields);
      expect(fieldsByNameAndType).toMatchInlineSnapshot(`
        [
          {
            "inputType": "text",
            "label": "Default -> text",
            "name": "default",
            "type": "text",
          },
          {
            "inputType": "radio",
            "label": "With oneOf -> radio",
            "name": "with_oneOf",
            "options": [
              {
                "label": "Yes",
                "value": "yes",
              },
              {
                "label": "No",
                "value": "no",
              },
            ],
            "type": "radio",
          },
          {
            "inputType": "email",
            "label": "With format:email -> email",
            "name": "with_email",
            "type": "email",
          },
          {
            "inputType": "select",
            "label": "With properties -> fieldset",
            "name": "with_object",
            "type": "select",
          },
          {
            "inputType": "text",
            "label": "With items.anyOf -> select",
            "name": "with_items_anyOf",
            "options": [
              {
                "label": "Chrome",
                "value": "chr",
              },
              {
                "label": "Firefox",
                "value": "ff",
              },
              {
                "label": "Internet Explorer",
                "value": "ie",
              },
            ],
            "type": "text",
          },
          {
            "fields": [
              {
                "inputType": "text",
                "label": "Role",
                "name": "role",
                "type": "text",
              },
              {
                "inputType": "text",
                "label": "Years",
                "name": "years",
                "type": "text",
              },
            ],
            "inputType": "group-array",
            "label": "With items.properties -> group-array",
            "name": "with_items_properties",
            "type": "group-array",
          },
        ]
      `);
    });
  });

  describe('field support', () => {
    function assertOptionsAllowed({ handleValidation, fieldName, validOptions }) {
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      // All allowed options are valid
      validOptions.forEach((value) => {
        expect(validateForm({ [fieldName]: value })).toBeUndefined();
      });

      // Any other arbitrary value is not valid.
      expect(validateForm({ [fieldName]: 'blah-blah' })).toEqual({
        [fieldName]: 'The option "blah-blah" is not valid.',
      });

      // Given undefined, it says it's a required field.
      expect(validateForm({})).toEqual({
        [fieldName]: 'Required field',
      });

      // As required field, empty string ("") is also considered empty. @BUG RMT-518
      // Expectation: The error to be "The option '' is not valid."
      expect(validateForm({ [fieldName]: '' })).toEqual({
        [fieldName]: 'Required field',
      });

      // As required field, null is also considered empty @BUG RMT-518
      // Expectation: The error to be "The option null is not valid."
      expect(validateForm({ [fieldName]: null })).toEqual({
        [fieldName]: 'Required field',
      });
    }

    it('support "text" field type', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeText);

      expect(fields[0]).toMatchObject({
        description: 'The number of your national identification (max 10 digits)',
        label: 'ID number',
        name: 'id_number',
        required: true,
        schema: expect.any(Object),
        inputType: 'text',
        jsonType: 'string',
        maskSecret: 2,
        maxLength: 10,
        isVisible: true,
      });

      const fieldValidator = fields[0].schema;
      expect(fieldValidator.isValidSync('CI007')).toBe(true);
      expect(fieldValidator.isValidSync(true)).toBe(false);
      expect(fieldValidator.isValidSync(1)).toBe(false);
      expect(fieldValidator.isValidSync(0)).toBe(false);

      expect(handleValidation({ id_number: 1 }).formErrors).toEqual({
        id_number: 'id_number must be a `string` type, but the final value was: `1`.',
      });

      expect(() => fieldValidator.validateSync('')).toThrowError('Required field');
    });

    it('supports both root level "description" and "x-jsf-presentation.description"', () => {
      const resultsWithRootDescription = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            id_number: mockTextInput,
          })
          .setRequiredFields(['id_number'])
          .build()
      );

      expect(resultsWithRootDescription.fields[0].description).toMatch(
        /the number of your national/i
      );

      const resultsWithPresentationDescription = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            id_number: {
              ...mockTextInput,
              'x-jsf-presentation': {
                inputType: 'text',
                maskSecret: 2,
                // should override the root level description
                description: 'a different description with <span>markup</span>',
              },
            },
          })
          .setRequiredFields(['id_number'])
          .build()
      );

      expect(resultsWithPresentationDescription.fields[0].description).toMatch(
        /a different description /i
      );
    });

    it('supports both root level "description" and "presentation.description" (deprecated)', () => {
      const resultsWithRootDescription = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            id_number: mockTextInputDeprecated,
          })
          .setRequiredFields(['id_number'])
          .build()
      );

      expect(resultsWithRootDescription.fields[0].description).toMatch(
        /the number of your national/i
      );

      const resultsWithPresentationDescription = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            id_number: {
              ...mockTextInputDeprecated,
              presentation: {
                inputType: 'text',
                maskSecret: 2,
                // should override the root level description
                description: 'a different description with <span>markup</span>',
              },
            },
          })
          .setRequiredFields(['id_number'])
          .build()
      );

      expect(resultsWithPresentationDescription.fields[0].description).toMatch(
        /a different description /i
      );
    });

    it('support "select" field type @deprecated', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeSelectSoloDeprecated);

      expect(fields).toMatchObject([
        {
          description: 'Life Insurance',
          label: 'Benefits (solo)',
          name: 'benefits',
          placeholder: 'Select...',
          type: 'select',
          options: [
            {
              label: 'Medical Insurance',
              value: 'Medical Insurance',
            },
            {
              label: 'Health Insurance',
              value: 'Health Insurance',
            },
            {
              label: 'Travel Bonus',
              value: 'Travel Bonus',
            },
          ],
        },
      ]);

      assertOptionsAllowed({
        handleValidation,
        fieldName: 'benefits',
        validOptions: ['Medical Insurance', 'Health Insurance', 'Travel Bonus'],
      });
    });

    it('support "select" field type', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeSelectSolo);

      const fieldSelect = fields[0];
      expect(fieldSelect).toMatchObject({
        name: 'browsers',
        label: 'Browsers (solo)',
        description: 'This solo select also includes a disabled option.',
        options: [
          {
            value: 'chr',
            label: 'Chrome',
          },
          {
            value: 'ff',
            label: 'Firefox',
          },
          {
            value: 'ie',
            label: 'Internet Explorer',
            disabled: true,
          },
        ],
      });

      expect(fieldSelect).not.toHaveProperty('multiple');

      assertOptionsAllowed({
        handleValidation,
        fieldName: 'browsers',
        validOptions: ['chr', 'ff', 'ie'],
      });
    });

    it('supports "select" field type with multiple options @deprecated', () => {
      const result = createHeadlessForm(schemaInputTypeSelectMultipleDeprecated);
      expect(result).toMatchObject({
        fields: [
          {
            description: 'Life Insurance',
            label: 'Benefits (multiple)',
            name: 'benefits_multi',
            placeholder: 'Select...',
            type: 'select',
            options: [
              {
                label: 'Medical Insurance',
                value: 'Medical Insurance',
              },
              {
                label: 'Health Insurance',
                value: 'Health Insurance',
              },
              {
                label: 'Travel Bonus',
                value: 'Travel Bonus',
              },
            ],
            multiple: true,
          },
        ],
      });
    });
    it('supports "select" field type with multiple options', () => {
      const result = createHeadlessForm(schemaInputTypeSelectMultiple);
      expect(result).toMatchObject({
        fields: [
          {
            name: 'browsers_multi',
            label: 'Browsers (multiple)',
            description: 'This multi-select also includes a disabled option.',
            options: [
              {
                value: 'chr',
                label: 'Chrome',
              },
              {
                value: 'ff',
                label: 'Firefox',
              },
              {
                value: 'ie',
                label: 'Internet Explorer',
                disabled: true,
              },
            ],
            multiple: true,
          },
        ],
      });
    });

    it('supports "select" field type with multiple options and optional', () => {
      const result = createHeadlessForm(schemaInputTypeSelectMultipleOptional);
      expect(result).toMatchObject({
        fields: [
          {
            name: 'browsers_multi_optional',
            label: 'Browsers (multiple) (optional)',
            description: 'This optional multi-select also includes a disabled option.',
            options: [
              {
                value: 'chr',
                label: 'Chrome',
              },
              {
                value: 'ff',
                label: 'Firefox',
              },
              {
                value: 'ie',
                label: 'Internet Explorer',
                disabled: true,
              },
            ],
            multiple: true,
          },
        ],
      });
    });

    it('support "radio" field type @deprecated', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeRadioDeprecated);

      expect(fields).toMatchObject([
        {
          description: 'Do you have any siblings?',
          label: 'Has siblings',
          name: 'has_siblings',
          options: [
            {
              label: 'Yes',
              value: 'yes',
            },
            {
              label: 'No',
              value: 'no',
            },
          ],
          required: true,
          schema: expect.any(Object),
          type: 'radio',
        },
      ]);

      assertOptionsAllowed({
        handleValidation,
        fieldName: 'has_siblings',
        validOptions: ['yes', 'no'],
      });
    });
    it('support "radio" field type', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeRadio);

      expect(fields).toMatchObject([
        {
          description: 'Do you have any siblings?',
          label: 'Has siblings',
          name: 'has_siblings',
          options: [
            {
              label: 'Yes',
              value: 'yes',
            },
            {
              label: 'No',
              value: 'no',
            },
          ],
          required: true,
          schema: expect.any(Object),
          type: 'radio',
        },
      ]);

      assertOptionsAllowed({
        handleValidation,
        fieldName: 'has_siblings',
        validOptions: ['yes', 'no'],
      });
    });

    it('support "radio" optional field', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaInputTypeRadioRequiredAndOptional
      );
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      expect(fields).toMatchObject([
        {},
        {
          name: 'has_car',
          label: 'Has car',
          description: 'Do you have a car? (optional field, check oneOf)',
          options: [
            {
              label: 'Yes',
              value: 'yes',
            },
            {
              label: 'No',
              value: 'no',
            },
          ],
          required: false,
          schema: expect.any(Object),
          type: 'radio',
        },
      ]);

      expect(
        validateForm({
          has_siblings: 'yes',
          has_car: 'yes',
        })
      ).toBeUndefined();

      expect(validateForm({})).toEqual({
        has_siblings: 'Required field',
      });
    });

    describe('support "radio" optional field - more examples @BUG RMT-518', () => {
      function assertCommonBehavior(validateForm) {
        // Note: Very similar to assertOptionsAllowed()
        // We could reuse it in a next iteration.

        // Happy path
        expect(validateForm({ has_car: 'yes' })).toBeUndefined();

        // Accepts undefined field
        expect(validateForm({})).toBeUndefined();

        // Does not accept other values
        expect(validateForm({ has_car: 'blah-blah' })).toEqual({
          has_car: 'The option "blah-blah" is not valid.',
        });

        // Does not accept "null" as string
        expect(validateForm({ has_car: 'null' })).toEqual({
          has_car: 'The option "null" is not valid.',
        });

        // Accepts empty string ("") — @BUG RMT-518
        // Expectation: Does not accept empty string ("")
        expect(validateForm({ has_car: '' })).toBeUndefined();
      }

      it('normal optional (conventional way)', () => {
        const { handleValidation } = createHeadlessForm(schemaInputRadioOptionalConventional);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        assertCommonBehavior(validateForm);

        // Accepts null, even though it shoudln't @BUG RMT-518
        // This is for cases where we (Remote) still have incorrect
        // JSON Schemas in our Platform.
        expect(validateForm({ has_car: null })).toBeUndefined();
        // Expected:
        // // Does NOT accept null value
        // expect(validateForm({ has_car: null })).toEqual({
        //   has_car: 'The option null is not valid.',
        // });
      });

      it('with null option (as Remote does)', () => {
        const { handleValidation } = createHeadlessForm(schemaInputRadioOptionalNull);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        assertCommonBehavior(validateForm);

        // Accepts null value
        expect(validateForm({ has_car: null })).toBeUndefined();
      });
    });

    it('support "radio" field type with extra info inside each option', () => {
      const result = createHeadlessForm(schemaInputTypeRadioOptionsWithDetails);

      expect(result.fields).toHaveLength(1);

      const fieldOptions = result.fields[0].options;

      // The x-jsf-presentation content was spread to the root:
      expect(fieldOptions[0]).not.toHaveProperty('x-jsf-presentation');
      expect(fieldOptions).toEqual([
        {
          label: 'Basic',
          value: 'basic',
          meta: {
            displayCost: '$30.00/mo',
          },
          // Other x-* keywords are kept as it is.
          'x-another': 'extra-thing',
        },
        {
          label: 'Standard',
          value: 'standard',
          meta: {
            displayCost: '$50.00/mo',
          },
        },
      ]);
    });

    it('support "radio" field type without oneOf options', () => {
      const result = createHeadlessForm(schemaInputTypeRadioWithoutOptions);

      expect(result.fields).toHaveLength(1);

      const fieldOptions = result.fields[0].options;
      expect(fieldOptions).toEqual([]);
    });

    it('support "number" field type', () => {
      const result = createHeadlessForm(schemaInputTypeNumber);
      expect(result).toMatchObject({
        fields: [
          {
            description: 'How many open tabs do you have?',
            label: 'Tabs',
            name: 'tabs',
            required: true,
            schema: expect.any(Object),
            type: 'number',
            minimum: 1,
            maximum: 10,
          },
        ],
      });

      const fieldValidator = result.fields[0].schema;
      expect(fieldValidator.isValidSync('0')).toBe(false);
      expect(fieldValidator.isValidSync('10')).toBe(true);
      expect(fieldValidator.isValidSync('11')).toBe(false);
      expect(fieldValidator.isValidSync('this is text with a number 1')).toBe(false);
      expect(() => fieldValidator.validateSync('some text')).toThrowError(
        'The value must be a number'
      );
      expect(() => fieldValidator.validateSync('')).toThrowError('The value must be a number');
    });

    it('support "number" field type with the percentage attribute', () => {
      const result = createHeadlessForm(schemaInputTypeNumberWithPercentage);
      expect(result).toMatchObject({
        fields: [
          {
            description: 'What % of shares do you own?',
            label: 'Shares',
            name: 'shares',
            percentage: true,
            required: true,
            schema: expect.any(Object),
            type: 'number',
            minimum: 1,
            maximum: 100,
          },
        ],
      });

      const fieldValidator = result.fields[0].schema;
      const { percentage } = result.fields[0];
      expect(fieldValidator.isValidSync('0')).toBe(false);
      expect(fieldValidator.isValidSync('10')).toBe(true);
      expect(fieldValidator.isValidSync('101')).toBe(false);
      expect(fieldValidator.isValidSync('this is text with a number 1')).toBe(false);
      expect(() => fieldValidator.validateSync('some text')).toThrowError(
        'The value must be a number'
      );
      expect(() => fieldValidator.validateSync('')).toThrowError('The value must be a number');
      expect(percentage).toBe(true);
    });

    it('support "number" field type with the percentage attribute and custom range values', () => {
      const result = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            shares: {
              ...mockNumberInputWithPercentageAndCustomRange,
            },
          })
          .setRequiredFields(['shares'])
          .build()
      );

      expect(result).toMatchObject({
        fields: [
          {
            description: 'What % of shares do you own?',
            label: 'Shares',
            name: 'shares',
            percentage: true,
            required: true,
            schema: expect.any(Object),
            type: 'number',
            minimum: 50,
            maximum: 70,
          },
        ],
      });

      const fieldValidatorCustom = result.fields[0].schema;
      const { percentage: percentageCustom } = result.fields[0];
      expect(fieldValidatorCustom.isValidSync('0')).toBe(false);
      expect(fieldValidatorCustom.isValidSync('49')).toBe(false);
      expect(fieldValidatorCustom.isValidSync('55')).toBe(true);
      expect(fieldValidatorCustom.isValidSync('70')).toBe(true);
      expect(fieldValidatorCustom.isValidSync('101')).toBe(false);
      expect(fieldValidatorCustom.isValidSync('this is text with a number 1')).toBe(false);
      expect(() => fieldValidatorCustom.validateSync('some text')).toThrowError(
        'The value must be a number'
      );
      expect(() => fieldValidatorCustom.validateSync('')).toThrowError(
        'The value must be a number'
      );
      expect(percentageCustom).toBe(true);
    });

    it('support "date" field type', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeDate);

      const validateForm = (vals) => friendlyError(handleValidation(vals));

      expect(fields[0]).toMatchObject({
        label: 'Birthdate',
        name: 'birthdate',
        required: true,
        schema: expect.any(Object),
        type: 'date',
        minDate: '1922-03-01',
        maxDate: '2022-03-17',
      });

      const todayDateHint = new Date().toISOString().substring(0, 10);

      expect(validateForm({})).toEqual({
        birthdate: 'Required field',
      });

      expect(validateForm({ birthdate: '2020-10-10' })).toBeUndefined();
      expect(validateForm({ birthdate: '2020-13-10' })).toEqual({
        birthdate: `Must be a valid date in yyyy-mm-dd format. e.g. ${todayDateHint}`,
      });
    });

    it('support "date" field type with a minDate', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeDate);

      const validateForm = (vals) => friendlyError(handleValidation(vals));

      expect(fields[0]).toMatchObject({
        label: 'Birthdate',
        name: 'birthdate',
        required: true,
        schema: expect.any(Object),
        type: 'date',
        minDate: '1922-03-01',
        maxDate: '2022-03-17',
      });

      expect(validateForm({})).toEqual({
        birthdate: 'Required field',
      });

      expect(validateForm({ birthdate: '' })).toEqual({
        birthdate: `Required field`,
      });

      expect(validateForm({ birthdate: '1922-02-01' })).toEqual({
        birthdate: 'The date must be 1922-03-01 or after.',
      });

      expect(validateForm({ birthdate: '1922-03-01' })).toBeUndefined();

      expect(validateForm({ birthdate: '2021-03-01' })).toBeUndefined();
    });

    it('support "date" field type with a maxDate', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInputTypeDate);

      const validateForm = (vals) => friendlyError(handleValidation(vals));

      expect(fields[0]).toMatchObject({
        label: 'Birthdate',
        name: 'birthdate',
        required: true,
        schema: expect.any(Object),
        type: 'date',
        minDate: '1922-03-01',
        maxDate: '2022-03-17',
      });

      expect(validateForm({ birthdate: '' })).toEqual({
        birthdate: `Required field`,
      });

      expect(validateForm({ birthdate: '2022-02-01' })).toBeUndefined();
      expect(validateForm({ birthdate: '2022-03-01' })).toBeUndefined();
      expect(validateForm({ birthdate: '2022-04-01' })).toEqual({
        birthdate: 'The date must be 2022-03-17 or before.',
      });
    });

    it('support format date with minDate and maxDate', () => {
      const schemaFormatDate = {
        properties: {
          birthdate: {
            title: 'Birthdate',
            type: 'string',
            format: 'date',
            'x-jsf-presentation': {
              inputType: 'myDateType',
              maxDate: '2022-03-01',
              minDate: '1922-03-01',
            },
          },
        },
      };

      const { handleValidation } = createHeadlessForm(schemaFormatDate);
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      expect(validateForm({ birthdate: '1922-02-01' })).toEqual({
        birthdate: 'The date must be 1922-03-01 or after.',
      });
    });

    it('supports "file" field type', () => {
      const result = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            fileInput: mockFileInput,
          })
          .build()
      );

      expect(result).toMatchObject({
        fields: [
          {
            type: 'file',
            fileDownload: 'http://some.domain.com/file-name.pdf',
            description: 'File Input Description',
            fileName: 'My File',
            label: 'File Input',
            name: 'fileInput',
            required: false,
            accept: '.png,.jpg,.jpeg,.pdf',
          },
        ],
      });
    });

    describe('supports "group-array" field type', () => {
      it('basic test', () => {
        const result = createHeadlessForm(
          JSONSchemaBuilder()
            .addInput({
              dependent_details: mockGroupArrayInput,
            })
            .build()
        );

        expect(result).toMatchObject({
          fields: [
            {
              type: 'group-array',
              description: 'Add the dependents you claim below',
              label: 'Child details',
              name: 'dependent_details',
              required: false,
              fields: expect.any(Function),
              addFieldText: 'Add new field',
            },
          ],
        });

        // Validations
        const fieldValidator = result.fields[0].schema;
        // nthfields are required
        expect(
          fieldValidator.isValidSync([
            {
              birthdate: '',
              full_name: '',
              sex: '',
            },
          ])
        ).toBe(false);
        // date is invalid
        expect(
          fieldValidator.isValidSync([
            {
              birthdate: 'invalidate date',
              full_name: 'John Doe',
              sex: 'male',
            },
          ])
        ).toBe(false);
        // all good
        expect(
          fieldValidator.isValidSync([
            {
              birthdate: '2021-12-04',
              full_name: 'John Doe',
              sex: 'male',
            },
          ])
        ).toBe(true);

        const nestedFieldsFromResult = result.fields[0].fields();
        expect(nestedFieldsFromResult).toMatchObject([
          {
            type: 'text',
            description: 'Enter your child’s full name',
            maxLength: 255,
            nameKey: 'full_name',
            label: 'Child Full Name',
            name: 'full_name',
            required: true,
          },
          {
            type: 'date',
            name: 'birthdate',
            label: 'Child Birthdate',
            required: true,
            description: 'Enter your child’s date of birth',
            maxLength: 255,
            nameKey: 'birthdate',
          },
          {
            type: 'radio',
            name: 'sex',
            label: 'Child Sex',
            options: [
              {
                label: 'Male',
                value: 'male',
              },
              {
                label: 'Female',
                value: 'female',
              },
            ],
            required: true,
            description:
              'We know sex is non-binary but for insurance and payroll purposes, we need to collect this information.',
            nameKey: 'sex',
          },
        ]);
      });

      it('nested fields (native, core and custom) has correct validations', () => {
        const { handleValidation } = createHeadlessForm({
          properties: {
            break_schedule: {
              title: 'Work schedule',
              type: 'array',
              presentation: {
                inputType: 'group-array',
              },
              items: {
                properties: {
                  minutes_native: {
                    title: 'Minutes of break (native)',
                    type: 'integer',
                    minimum: 60,
                    // without presentation.inputType
                  },
                  minutes_core: {
                    title: 'Minutes of break (core)',
                    type: 'integer',
                    minimum: 60,
                    presentation: {
                      inputType: 'number', // a core inputType
                    },
                  },
                  minutes_custom: {
                    title: 'Minutes of break (custom)',
                    type: 'integer',
                    minimum: 60,
                    presentation: {
                      inputType: 'hour', // a custom inputType
                    },
                  },
                },
                required: ['weekday', 'minutes_native', 'minutes_core', 'minutes_custom'],
              },
            },
          },
          required: ['break_schedule'],
        });
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        // Given empty, it says it's required
        expect(validateForm({})).toEqual({
          break_schedule: 'Required field',
        });

        // Given empty fields, it mentions nested required fields
        expect(
          validateForm({
            break_schedule: [{}],
          })
        ).toEqual({
          break_schedule: [
            {
              minutes_native: 'Required field',
              minutes_core: 'Required field',
              minutes_custom: 'Required field',
            },
          ],
        });

        // Given correct values, it's all valid.
        expect(
          validateForm({
            break_schedule: [
              {
                minutes_native: 60,
                minutes_core: 60,
                minutes_custom: 60,
              },
            ],
          })
        ).toBeUndefined();

        // Given invalid values, the validation is triggered.
        expect(
          validateForm({
            break_schedule: [
              {
                minutes_native: 50,
                minutes_core: 50,
                minutes_custom: 50,
              },
            ],
          })
        ).toEqual({
          break_schedule: [
            {
              minutes_core: 'Must be greater or equal to 60',
              minutes_native: 'Must be greater or equal to 60',
              minutes_custom: 'Must be greater or equal to 60',
            },
          ],
        });
      });

      it('can pass custom field attributes', () => {
        const result = createHeadlessForm(
          {
            properties: {
              children_basic: mockGroupArrayInput,
              children_custom: mockGroupArrayInput,
            },
          },
          {
            customProperties: {
              children_custom: {
                'data-foo': 'baz',
              },
            },
          }
        );

        expect(result).toMatchObject({
          fields: [
            {
              label: 'Child details',
              name: 'children_basic',
              required: false,
              type: 'group-array',
              inputType: 'group-array',
              jsonType: 'array',
              fields: expect.any(Function), // This is what makes the field work
            },
            {
              label: 'Child details',
              name: 'children_custom',
              type: 'group-array',
              inputType: 'group-array',
              jsonType: 'array',
              required: false,
              'data-foo': 'baz', // check that custom property is properly propagated
              fields: expect.any(Function), // This is what makes the field work
            },
          ],
        });
      });

      it('can be a conditional field', () => {
        const { fields, handleValidation } = createHeadlessForm({
          properties: {
            yes_or_no: {
              title: 'Show the dependents or not?',
              oneOf: [{ const: 'yes' }, { const: 'no' }],
              'x-jsf-presentation': { inputType: 'radio' },
            },
            dependent_details: mockGroupArrayInput,
          },
          allOf: [
            {
              if: {
                properties: {
                  yes_or_no: { const: 'yes' },
                },
                required: ['yes_or_no'],
              },
              then: {
                required: ['dependent_details'],
              },
              else: {
                properties: {
                  dependent_details: false,
                },
              },
            },
          ],
        });

        // By default is hidden but the fields are accessible
        expect(getField(fields, 'dependent_details').isVisible).toBe(false);
        expect(getField(fields, 'dependent_details').fields).toEqual(expect.any(Function));

        // When the condition matches...
        const { formErrors } = handleValidation({ yes_or_no: 'yes' });
        expect(formErrors).toEqual({
          dependent_details: 'Required field',
        });
        // it gets visible with its inner fields.
        expect(getField(fields, 'dependent_details').isVisible).toBe(true);
        expect(getField(fields, 'dependent_details').fields).toEqual(expect.any(Function));
      });
    });

    it('supports "radio" field type with its "card" and "card-expandable" variants', () => {
      const result = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            experience_level: mockRadioCardExpandableInput,
            payment_method: mockRadioCardInput,
          })
          .build()
      );

      expect(result).toMatchObject({
        fields: [
          {
            description:
              'Please select the experience level that aligns with this role based on the job description (not the employees overall experience)',
            label: 'Experience level',
            name: 'experience_level',
            type: 'radio',
            required: false,
            variant: 'card-expandable',
            options: [
              {
                label: 'Junior level',
                value: 'junior',
                description:
                  'Entry level employees who perform tasks under the supervision of a more experienced employee.',
              },
              {
                label: 'Mid level',
                value: 'mid',
                description:
                  'Employees who perform tasks with a good degree of autonomy and/or with coordination and control functions.',
              },
              {
                label: 'Senior level',
                value: 'senior',
                description:
                  'Employees who perform tasks with a high degree of autonomy and/or with coordination and control functions.',
              },
            ],
          },
          {
            description: 'Chose how you want to be paid',
            label: 'Payment method',
            name: 'payment_method',
            type: 'radio',
            variant: 'card',
            required: false,
            options: [
              {
                label: 'Credit Card',
                value: 'cc',
                description: 'Plastic money, which is still money',
              },
              {
                label: 'Cash',
                value: 'cash',
                description: 'Rules Everything Around Me',
              },
            ],
          },
        ],
      });
    });

    it('supports oneOf pattern validation', () => {
      const result = createHeadlessForm(mockTelWithPattern);

      expect(result).toMatchObject({
        fields: [
          {
            label: 'Phone number',
            name: 'phone_number',
            type: 'tel',
            required: false,
            options: [
              {
                label: 'Portugal',
                pattern: '^(\\+351)[0-9]{9,}$',
              },
              {
                label: 'United Kingdom (UK)',
                pattern: '^(\\+44)[0-9]{1,}$',
              },
              {
                label: 'Bolivia',
                pattern: '^(\\+591)[0-9]{9,}$',
              },
              {
                label: 'Canada',
                pattern: '^(\\+1)(206|224)[0-9]{1,}$',
              },
              {
                label: 'United States',
                pattern: '^(\\+1)[0-9]{1,}$',
              },
            ],
          },
        ],
      });

      const fieldValidator = result.fields[0].schema;

      expect(fieldValidator.isValidSync('+351123123123')).toBe(true);
      expect(() => fieldValidator.validateSync('+35100')).toThrowError(
        'The option "+35100" is not valid.'
      );
      expect(fieldValidator.isValidSync(undefined)).toBe(true);
    });

    describe('supports "fieldset" field type', () => {
      it('supports basic case', () => {
        const result = createHeadlessForm({
          properties: {
            fieldset: mockFieldset,
          },
        });

        expect(result).toMatchObject({
          fields: [
            {
              description: 'Fieldset description',
              label: 'Fieldset title',
              name: 'fieldset',
              type: 'fieldset',
              required: false,
              fields: [
                {
                  description: 'The number of your national identification (max 10 digits)',
                  label: 'ID number',
                  name: 'id_number',
                  type: 'text',
                  required: true,
                },
                {
                  description: 'How many open tabs do you have?',
                  label: 'Tabs',
                  maximum: 10,
                  minimum: 1,
                  name: 'tabs',
                  type: 'number',
                  required: false,
                },
              ],
            },
          ],
        });
      });

      it('supports nested fieldset (fieldset inside fieldset)', () => {
        const result = createHeadlessForm(
          JSONSchemaBuilder()
            .addInput({
              nestedFieldset: mockNestedFieldset,
            })
            .build()
        );

        expect(result).toMatchObject({
          fields: [
            {
              label: 'Nested fieldset title',
              description: 'Nested fieldset description',
              name: 'nestedFieldset',
              type: 'fieldset',
              required: false,
              fields: [
                {
                  description: 'Fieldset description',
                  label: 'Fieldset title',
                  name: 'innerFieldset',
                  type: 'fieldset',
                  required: false,
                  fields: [
                    {
                      description: 'The number of your national identification (max 10 digits)',
                      label: 'ID number',
                      name: 'id_number',
                      type: 'text',
                      required: true,
                    },
                    {
                      description: 'How many open tabs do you have?',
                      label: 'Tabs',
                      maximum: 10,
                      minimum: 1,
                      name: 'tabs',
                      type: 'number',
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('supported "fieldset" with scoped conditionals', () => {
        const { handleValidation } = createHeadlessForm(schemaFieldsetScopedCondition, {});
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        // The "child.has_child" is required
        expect(validateForm({})).toEqual({
          child: {
            has_child: 'Required field',
          },
        });

        // The "child.no" is valid
        expect(
          validateForm({
            child: {
              has_child: 'no',
            },
          })
        ).toBeUndefined();

        // Invalid because it expect child.age too
        expect(
          validateForm({
            child: {
              has_child: 'yes',
            },
          })
        ).toEqual({
          child: {
            age: 'Required field',
          },
        });

        // Valid without optional child.passport_id
        expect(
          validateForm({
            child: {
              has_child: 'yes',
              age: 15,
            },
          })
        ).toBeUndefined();

        // Valid with optional child.passport_id
        expect(
          validateForm({
            child: {
              has_child: 'yes',
              age: 15,
              passport_id: 'asdf',
            },
          })
        ).toBeUndefined();
      });

      it('should set any nested "fieldset" form values to null when they are invisible', async () => {
        const { handleValidation } = createHeadlessForm(schemaFieldsetScopedCondition, {});
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        const formValues = {
          child: {
            has_child: 'yes',
            age: 15,
          },
        };

        await expect(validateForm(formValues)).toBeUndefined();
        expect(formValues.child.age).toBe(15);

        formValues.child.has_child = 'no';
        // form value updates re-validate; see computeYupSchema()
        await expect(validateForm(formValues)).toBeUndefined();

        // when child.has_child is 'no' child.age is invisible
        expect(formValues.child.age).toBe(null);
      });

      describe('supports conditionals to fieldsets', () => {
        // To not mix the concepts:
        // - Scoped conditionals: Conditionals written inside a fieldset
        // - Conditionals to fieldsets: Root conditionals that affect a fieldset

        // This describe has sequential tests, covering the following:
        // If the working_hours > 30,
        // Then the fieldset perks.food changes (the "no" option gets removed)

        // Setup (arrange)
        const { fields, handleValidation } = createHeadlessForm(schemaWithConditionalToFieldset);

        const validateForm = (vals) => friendlyError(handleValidation(vals));
        const originalFood = getField(fields, 'perks', 'food');

        const perksForLowWorkHours = {
          food: 'no', // this option will be removed when the condition happens.
          retirement: 'basic',
        };

        it('by default, the Perks.food has 4 options', () => {
          expect(originalFood.options).toHaveLength(4);
          expect(originalFood.description).toBeUndefined();

          // Ensure the perks are required
          expect(validateForm({})).toEqual({
            work_hours_per_week: 'Required field',
            perks: {
              food: 'Required field',
              retirement: 'Required field',
            },
          });

          // Given low work hours, the form is valid.
          expect(
            validateForm({
              work_hours_per_week: 5,
              perks: perksForLowWorkHours,
            })
          ).toBeUndefined();
        });

        it('Given a lot work hours, the perks.food options change', () => {
          expect(
            validateForm({
              work_hours_per_week: 35,
            })
          ).toEqual({
            pto: 'Required field', // Sanity-check - this field gets required too.
            perks: {
              food: 'Required field',
              retirement: 'Required field',
            },
          });

          // The fieldset changed!
          const foodField = getField(fields, 'perks', 'food');
          // perks.food options changed ("No" was removed)
          expect(foodField.options).toHaveLength(3);

          // Ensure the "no" option is no longer accepted:
          // This is a very important test in case the UI fails for some reason.
          expect(
            validateForm({
              work_hours_per_week: 35,
              pto: 20,
              perks: perksForLowWorkHours,
            })
          ).toEqual({
            perks: {
              food: 'The option "no" is not valid.',
            },
          });

          // perks.food has a new description
          expect(foodField.description).toBe("Above 30 hours, the 'no' option disappears.");
          // pto has a new description
          expect(getField(fields, 'pto').description).toBe(
            'Above 30 hours, the PTO needs to be at least 20 days.'
          );

          // Sanity-check: Now the PTO also has a minimum value
          expect(
            validateForm({
              work_hours_per_week: 35,
              pto: 5, // too low
              perks: { food: 'lunch', retirement: 'basic' },
            })
          ).toEqual({
            pto: 'Must be greater or equal to 20',
          });
        });

        it('When changing back to low work hours, the perks.food goes back to the original state', () => {
          expect(
            validateForm({
              work_hours_per_week: 10,
              pto: 5,
            })
          ).toEqual({
            perks: {
              food: 'Required field',
              retirement: 'Required field',
            },
            // ...pto is minimum error is gone! (sanity-check)
          });

          const foodField = getField(fields, 'perks', 'food');
          // ...Number of perks.food options was back to the original (4)
          expect(foodField.options).toHaveLength(4);
          // ...Food description was back to the original
          expect(foodField.description).toBeUndefined();
          // ...PTO Description is removed too.
          expect(getField(fields, 'pto').description).toBeUndefined();

          // Given again "low perks", the form valid.
          expect(
            validateForm({
              work_hours_per_week: 10,
              perks: perksForLowWorkHours,
            })
          ).toBeUndefined();
        });
      });
    });

    it('support "email" field type', () => {
      const result = createHeadlessForm(schemaInputTypeEmail);

      expect(result).toMatchObject({
        fields: [
          {
            description: 'Enter your email address',
            label: 'Email address',
            name: 'email_address',
            required: true,
            schema: expect.any(Object),
            type: 'email',
            maxLength: 255,
          },
        ],
      });

      const fieldValidator = result.fields[0].schema;
      expect(fieldValidator.isValidSync('test@gmail.com')).toBe(true);
      expect(() => fieldValidator.validateSync('ffsdf')).toThrowError(
        'Please enter a valid email address'
      );
      expect(() => fieldValidator.validateSync(undefined)).toThrowError('Required field');
    });

    describe('supports "checkbox" field type', () => {
      describe('checkbox as string', () => {
        it('required: only accept the value in "checkboxValue"', () => {
          const result = createHeadlessForm(schemaInputTypeCheckbox);
          const checkboxField = result.fields.find((field) => field.name === 'contract_duration');

          expect(checkboxField).toMatchObject({
            description:
              'I acknowledge that all employees in France will be hired on indefinite contracts.',
            label: 'Contract duration',
            name: 'contract_duration',
            type: 'checkbox',
            checkboxValue: 'Permanent',
          });
          expect(checkboxField).not.toHaveProperty('default'); // ensure it's not checked by default.

          const fieldValidator = checkboxField.schema;
          expect(fieldValidator.isValidSync('Permanent')).toBe(true);
          expect(() => fieldValidator.validateSync(undefined)).toThrowError(
            'Please acknowledge this field'
          );
        });

        it('required checked: returns a default value', () => {
          const result = createHeadlessForm(schemaInputTypeCheckbox);
          const checkboxField = result.fields.find(
            (field) => field.name === 'contract_duration_checked'
          );

          expect(checkboxField).toMatchObject({
            default: 'Permanent',
            checkboxValue: 'Permanent',
          });
        });
      });

      describe('checkbox as boolean', () => {
        it('optional: Accepts true or false', () => {
          const result = createHeadlessForm(schemaInputTypeCheckboxBooleans);
          const checkboxField = result.fields.find((field) => field.name === 'boolean_empty');

          expect(checkboxField).toMatchObject({
            checkboxValue: true,
          });
          expect(checkboxField).not.toHaveProperty('default'); // ensure it's not checked by default.

          const fieldValidator = checkboxField.schema;
          expect(fieldValidator.isValidSync(true)).toBe(true);
          expect(fieldValidator.isValidSync(false)).toBe(true);
          expect(fieldValidator.isValidSync(undefined)).toBe(true);
          expect(() => fieldValidator.validateSync('foo')).toThrowError(
            'this must be a `boolean` type, but the final value was: `"foo"`.'
          );
        });

        it('required: Only accepts true', () => {
          const result = createHeadlessForm(schemaInputTypeCheckboxBooleans);
          const checkboxField = result.fields.find((field) => field.name === 'boolean_required');

          expect(checkboxField).toMatchObject({
            checkboxValue: true,
          });

          const fieldValidator = checkboxField.schema;
          expect(fieldValidator.isValidSync(true)).toBe(true);
          expect(() => fieldValidator.validateSync(false)).toThrowError(
            'Please acknowledge this field'
          );
        });

        it('checked: returns default: true', () => {
          const result = createHeadlessForm(schemaInputTypeCheckboxBooleans);
          const checkboxField = result.fields.find((field) => field.name === 'boolean_checked');

          expect(checkboxField).toMatchObject({
            checkboxValue: true,
            default: true,
          });
        });
      });
    });

    describe('supports custom inputType (eg "hour")', () => {
      it('as required, optional, and mixed types', () => {
        const { fields, handleValidation } = createHeadlessForm(
          {
            properties: {
              start_time: {
                title: 'Starting time',
                type: 'string',
                presentation: {
                  inputType: 'hour',
                },
              },
              pause: {
                title: 'Pause time (optional)',
                type: 'string',
                presentation: {
                  inputType: 'hour',
                },
              },
              end_time: {
                title: 'Finishing time (optional)',
                type: ['null', 'string'], // ensure it supports mix types (array) (optional/null)
                presentation: {
                  inputType: 'hour',
                },
              },
            },
            required: ['start_time'],
          },
          {
            strictInputType: false,
          }
        );
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        const commonAttrs = {
          type: 'hour',
          inputType: 'hour',
          jsonType: 'string',
          schema: expect.any(Object),
        };
        expect(fields).toMatchObject([
          {
            name: 'start_time',
            label: 'Starting time',
            ...commonAttrs,
          },
          {
            name: 'pause',
            label: 'Pause time (optional)',
            ...commonAttrs,
          },
          {
            name: 'end_time',
            label: 'Finishing time (optional)',
            ...commonAttrs,
            jsonType: ['null', 'string'],
          },
        ]);

        expect(validateForm({})).toEqual({
          start_time: 'Required field',
        });

        expect(validateForm({ start_time: '08:30' })).toBeUndefined();
      });
    });
  });

  describe('validation options', () => {
    it('given invalid values it returns both yupError and formErrors', () => {
      const { handleValidation } = createHeadlessForm(schemaInputTypeText);

      const { formErrors, yupError } = handleValidation({});

      // Assert the yupError shape is really a YupError
      expect(yupError).toEqual(expect.any(Error));
      expect(yupError.inner[0].path).toBe('id_number');
      expect(yupError.inner[0].message).toBe('Required field');

      // Assert the converted YupError to formErrors
      expect(formErrors).toEqual({
        id_number: 'Required field',
      });
    });
  });

  it('supports oneOf number const', () => {
    const result = createHeadlessForm({
      type: 'object',
      additionalProperties: false,
      properties: {
        pets: {
          title: 'How many pets?',
          oneOf: [
            {
              title: 'One',
              const: 0,
            },
            {
              title: 'Two',
              const: 2,
            },
            {
              title: 'null',
              const: 1,
            },
          ],
          'x-jsf-presentation': {
            inputType: 'select',
          },
          type: ['number', 'null'],
        },
      },
      required: [],
      'x-jsf-order': ['pets'],
    });

    const fieldValidator = result.fields[0].schema;

    expect(fieldValidator.isValidSync(0)).toBe(true);
    expect(fieldValidator.isValidSync(1)).toBe(true);
    expect(() => fieldValidator.validateSync('2')).toThrowError('The option "2" is not valid.');
    expect(fieldValidator.isValidSync(null)).toBe(true);
  });

  describe('x-jsf-presentation attribute', () => {
    it('support field with "x-jsf-presentation.statement"', () => {
      const result = createHeadlessForm(schemaInputWithStatement);

      expect(result).toMatchObject({
        fields: [
          {
            name: 'bonus',
            label: 'Bonus',
            type: 'text',
            statement: {
              description: 'This is a custom statement message.',
              inputType: 'statement',
              severity: 'info',
            },
          },
          {
            name: 'role',
            label: 'Role',
            type: 'text',
            statement: {
              description: 'This is another statement message, but more severe.',
              inputType: 'statement',
              severity: 'warning',
            },
          },
        ],
      });
    });
  });

  describe('property misc attributes', () => {
    it('pass readOnly to field', () => {
      const result = createHeadlessForm({
        properties: {
          secret: {
            title: 'Secret code',
            readOnly: true,
            type: 'string',
            presentation: {
              inputType: 'text',
            },
          },
        },
      });

      expect(result).toMatchObject({
        fields: [
          {
            name: 'secret',
            label: 'Secret code',
            schema: expect.any(Object),
            readOnly: true,
          },
        ],
      });
    });

    it('pass "deprecated" attributes to field', () => {
      const result = createHeadlessForm({
        properties: {
          secret: {
            title: 'Age',
            type: 'number',
            deprecated: true,
            presentation: {
              inputType: 'number',
              deprecated: {
                description: 'Deprecated in favor of "birthdate".',
              },
            },
          },
        },
      });

      expect(result).toMatchObject({
        fields: [
          {
            type: 'number',
            name: 'secret',
            label: 'Age',
            schema: expect.any(Object),
            deprecated: {
              description: 'Deprecated in favor of "birthdate".',
            },
          },
        ],
      });
    });

    it('pass "description" to field', () => {
      const result = createHeadlessForm({
        properties: {
          plain: {
            title: 'Regular',
            description: 'I am regular',
            presentation: { inputType: 'text' },
          },
          html: {
            title: 'Name',
            description: 'I am regular',
            presentation: {
              description: 'I am <b>bold</b>.',
              inputType: 'text',
            },
          },
        },
      });

      expect(result).toMatchObject({
        fields: [{ description: 'I am regular' }, { description: 'I am <b>bold</b>.' }],
      });
    });

    it('passes scopedJsonSchema to each field', () => {
      const { fields } = createHeadlessForm(schemaWithoutInputTypes, {
        strictInputType: false,
      });

      const aFieldInRoot = getField(fields, 'a_string');
      // It's the entire json schema
      expect(aFieldInRoot.scopedJsonSchema).toEqual(schemaWithoutInputTypes);

      const aFieldset = getField(fields, 'a_object');
      const aFieldInTheFieldset = getField(aFieldset.fields, 'foo');

      // It's only the json schema of that fieldset
      expect(aFieldInTheFieldset.scopedJsonSchema).toEqual(
        schemaWithoutInputTypes.properties.a_object
      );
    });

    describe('Order of fields', () => {
      it('sorts fields based on presentation.position keyword (deprecated)', () => {
        const { fields } = createHeadlessForm(schemaWithPositionDeprecated);

        // Assert the order from the original schema object
        expect(Object.keys(schemaWithPositionDeprecated.properties)).toEqual([
          'age',
          'street',
          'username',
        ]);
        expect(Object.keys(schemaWithPositionDeprecated.properties.street.properties)).toEqual([
          'line_one',
          'postal_code',
          'number',
        ]);

        // Assert the Fields order
        const fieldsByName = fields.map((f) => f.name);
        expect(fieldsByName).toEqual(['username', 'age', 'street']);

        const fieldsetByName = fields[2].fields.map((f) => f.name);
        expect(fieldsetByName).toEqual(['line_one', 'number', 'postal_code']);
      });

      it('sorts fields based on x-jsf-order keyword', () => {
        const { fields } = createHeadlessForm(schemaWithOrderKeyword);

        // Assert the order from the original schema object
        expect(Object.keys(schemaWithOrderKeyword.properties)).toEqual([
          'age',
          'street',
          'username',
        ]);
        expect(Object.keys(schemaWithOrderKeyword.properties.street.properties)).toEqual([
          'line_one',
          'postal_code',
          'number',
        ]);

        // Assert the Fields order
        const fieldsByName = fields.map((f) => f.name);
        expect(fieldsByName).toEqual(['username', 'age', 'street']);

        const fieldsetByName = fields[2].fields.map((f) => f.name);
        expect(fieldsetByName).toEqual(['line_one', 'number', 'postal_code']);
      });

      it('sorts fields based on original properties (wihout x-jsf-order)', () => {
        // Assert the sample schema has x-jsf-order
        expect(schemaWithOrderKeyword['x-jsf-order']).toBeDefined();

        const schemaWithoutOrder = {
          ...schemaWithOrderKeyword,
          'x-jsf-order': undefined,
        };
        const { fields } = createHeadlessForm(schemaWithoutOrder);

        const originalOrder = ['age', 'street', 'username'];
        // Assert the order from the original schema object
        expect(Object.keys(schemaWithoutOrder.properties)).toEqual(originalOrder);

        // Assert the order of fields is the same as the original object
        const fieldsByName = fields.map((f) => f.name);
        expect(fieldsByName).toEqual(originalOrder);
      });
    });
  });

  describe('when a field is required', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({ presentationFields: { inputType: 'text' }, required: true })
      );
      fields = result.fields;
    });
    describe('and value is empty', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: '' })
        ).rejects.toMatchObject({ errors: ['Required field'] }));
    });
    describe('and value is defined', () => {
      it('should validate field', async () => {
        const assertObj = { test: 'Hello' };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field is number', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({ presentationFields: { inputType: 'number' } })
      );
      fields = result.fields;
    });
    describe('and value is a string', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: 'Hello' })
        ).rejects.toThrow());
    });
    describe('and value is a number', () => {
      it('should validate field', async () => {
        const assertObj = { test: 3 };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
    describe('and maximum is set to zero', () => {
      it('shows the correct validation', () => {
        const { handleValidation } = createHeadlessForm(schemaInputTypeNumberZeroMaximum);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(validateForm({ tabs: '0' })).toBeUndefined();
        expect(validateForm({ tabs: '-10' })).toBeUndefined();

        expect(validateForm({ tabs: 1 })).toEqual({
          tabs: 'Must be smaller or equal to 0',
        });
      });
    });
    describe('and type is integer', () => {
      it('should validate field', () => {
        const { handleValidation } = createHeadlessForm(schemaInputTypeIntegerNumber);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(validateForm({ tabs: '10' })).toBeUndefined();
        expect(validateForm({ tabs: '1.0' })).toBeUndefined();

        expect(validateForm({ tabs: '0' })).toEqual({
          tabs: 'Must be greater or equal to 1',
        });
        expect(validateForm({ tabs: '11' })).toEqual({
          tabs: 'Must be smaller or equal to 10',
        });
        expect(validateForm({ tabs: '5.5' })).toEqual({
          tabs: 'Must not contain decimal points. E.g. 5 instead of 5.5',
        });
        expect(validateForm({ tabs: 'this is text with a number 1' })).toEqual({
          tabs: 'The value must be a number',
        });
        expect(validateForm({ tabs: 'some text' })).toEqual({
          tabs: 'The value must be a number',
        });
        expect(validateForm({ tabs: '' })).toEqual({
          tabs: 'The value must be a number',
        });
      });
    });
  });

  describe('when a field has a maxLength of 10', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({
          presentationFields: { inputType: 'text' },
          inputFields: { maxLength: 10 },
        })
      );
      fields = result.fields;
    });
    describe('and value is greater than that', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: 'Hello Mr John Doe' })
        ).rejects.toMatchObject({ errors: ['Please insert up to 10 characters'] }));
    });
    describe('and value is less than that', () => {
      it('should validate field', async () => {
        const assertObj = { test: 'Hello John' };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field has a minLength of 2', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({
          presentationFields: { inputType: 'text' },
          inputFields: { minLength: 2 },
        })
      );
      fields = result.fields;
    });
    describe('and value is smaller than that', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: 'H' })
        ).rejects.toMatchObject({ errors: ['Please insert at least 2 characters'] }));
    });
    describe('and value is greater than that', () => {
      it('should validate field', async () => {
        const assertObj = { test: 'Hello John' };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field has a minimum of 0', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({
          presentationFields: { inputType: 'number' },
          inputFields: { minimum: 0 },
        })
      );
      fields = result.fields;
    });

    describe('and value is less than that', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: -1 })
        ).rejects.toMatchObject({ errors: ['Must be greater or equal to 0'] }));
    });

    describe('and value is greater than that', () => {
      it('should validate field', async () => {
        const assertObj = { test: 4 };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field has a maximum of 10', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({
          presentationFields: { inputType: 'number' },
          inputFields: { maximum: 10 },
        })
      );
      fields = result.fields;
    });

    describe('and value is greater than that', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: 11 })
        ).rejects.toMatchObject({ errors: ['Must be smaller or equal to 10'] }));
    });

    describe('and value is greater than that', () => {
      it('should validate field', async () => {
        const assertObj = { test: 4 };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field has a pattern', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        buildJSONSchemaInput({
          presentationFields: { inputType: 'text' },
          inputFields: { pattern: '^[0-9]{3}-[0-9]{2}-(?!0{4})[0-9]{4}$' },
        })
      );
      fields = result.fields;
    });
    describe('and value does not match the pattern', () => {
      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate({ test: 'Hello' })
        ).rejects.toMatchObject({ errors: [expect.any(String)] }));
    });
    describe('and value matches the pattern', () => {
      it('should validate field', async () => {
        const assertObj = { test: '401-85-1950' };
        return expect(
          object()
            .shape({
              test: fields[0].schema,
            })
            .validate(assertObj)
        ).resolves.toEqual(assertObj);
      });
    });
  });

  describe('when a field has max file size', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        JSONSchemaBuilder().addInput({ fileInput: mockFileInput }).build()
      );
      fields = result.fields;
    });
    describe('and file is greater than that', () => {
      const file = new File([''], 'file.png');
      Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1024 });

      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              fileInput: fields[0].schema,
            })
            .validate({ fileInput: [file] })
        ).rejects.toMatchObject({ errors: ['File size too large. The limit is 20 MB.'] }));
    });
    describe('and file is smaller than that', () => {
      const file = new File([''], 'file.png');
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const assertObj = { fileInput: [file] };
      it('should validate field', async () =>
        expect(
          object()
            .shape({
              fileInput: fields[0].schema,
            })
            .validate({ fileInput: [file] })
        ).resolves.toEqual(assertObj));
    });
  });

  describe('when a field file is optional', () => {
    it('it accepts an empty array', () => {
      const result = createHeadlessForm(
        JSONSchemaBuilder().addInput({ fileInput: mockFileInput }).build()
      );
      const emptyFile = { fileInput: [] };
      expect(
        object()
          .shape({
            fileInput: result.fields[0].schema,
          })
          .validate(emptyFile)
      ).resolves.toEqual(emptyFile);
    });
  });

  describe('when a field has accepted extensions', () => {
    let fields;
    beforeEach(() => {
      const result = createHeadlessForm(
        JSONSchemaBuilder().addInput({ fileInput: mockFileInput }).build()
      );
      fields = result.fields;
    });
    describe('and file is of inccorrect format', () => {
      const file = new File(['foo'], 'file.txt', {
        type: 'text/plain',
      });

      it('should throw an error', async () =>
        expect(
          object()
            .shape({
              fileInput: fields[0].schema,
            })
            .validate({ fileInput: [file] })
        ).rejects.toMatchObject({
          errors: ['Unsupported file format. The acceptable formats are .png,.jpg,.jpeg,.pdf.'],
        }));
    });
    describe('and file is of correct format', () => {
      const file = new File(['foo'], 'file.png', {
        type: 'image/png',
      });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const assertObj = { fileInput: [file] };
      it('should validate field', async () =>
        expect(
          object()
            .shape({
              fileInput: fields[0].schema,
            })
            .validate({ fileInput: [file] })
        ).resolves.toEqual(assertObj));
    });

    describe('and file is of correct but uppercase format ', () => {
      const file = new File(['foo'], 'file.PNG', {
        type: 'image/png',
      });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });

      const assertObj = { fileInput: [file] };
      it('should validate field', async () =>
        expect(
          object()
            .shape({
              fileInput: fields[0].schema,
            })
            .validate({ fileInput: [file] })
        ).resolves.toEqual(assertObj));
    });
  });

  describe('when a field has conditional presentation properties', () => {
    it('returns the nested properties when the conditional matches', () => {
      const { fields } = createHeadlessForm(schemaWithConditionalPresentationProperties, {
        initialValues: {
          // show the hidden statement
          mock_radio: 'no',
        },
      });

      expect(fields[0].statement.description).toBe(`<a href="">conditional statement markup</a>`);
    });
  });

  describe('when a JSON Schema is provided', () => {
    describe('and all fields are optional', () => {
      let handleValidation;
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      beforeEach(() => {
        const result = JSONSchemaBuilder()
          .addInput({ textInput: mockTextInput })
          .addInput({ numberInput: mockNumberInput })
          .build();
        const { handleValidation: handleValidationEach } = createHeadlessForm(result);
        handleValidation = handleValidationEach;
      });

      it.each([
        [
          'validation should return true when the object has empty values',
          { textInput: '' },
          undefined,
        ],
        [
          'validation should return true when object is valid',
          { textInput: 'abcde', numberInput: 9 },
          undefined,
        ],
      ])('%s', (_, value, errors) => {
        const testValue = validateForm(value);
        if (errors) {
          expect(testValue).toEqual(errors);
        } else {
          expect(testValue).toBeUndefined();
        }
      });
    });

    describe('and all fields are mandatory', () => {
      let handleValidation;
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      beforeEach(() => {
        const result = JSONSchemaBuilder()
          .addInput({ textInput: mockTextInput })
          .addInput({ numberInput: mockNumberInput })
          .setRequiredFields(['numberInput', 'textInput'])
          .build();
        const { handleValidation: handleValidationEach } = createHeadlessForm(result);
        handleValidation = handleValidationEach;
      });

      it.each([
        [
          'validation should return false when value is an empty object',
          {},
          {
            numberInput: 'Required field',
            textInput: 'Required field',
          },
        ],
        [
          'validation should return false when value is an object with null values',
          { textInput: null, numberInput: null },
          { numberInput: 'Required field', textInput: 'Required field' },
        ],
        [
          'validation should return false when value is an object with empty values',
          { textInput: '', numberInput: '' },
          { numberInput: 'The value must be a number', textInput: 'Required field' },
        ],
        [
          'validation should return false when one value is empty',
          { textInput: '986-39-076', numberInput: '' },
          { numberInput: 'The value must be a number' },
        ],
        [
          'validation should return false a numeric field is not a number',
          { textInput: '986-39-076', numberInput: 'not a number' },
          { numberInput: 'The value must be a number' },
        ],
        [
          'validation should return true when object is valid',
          { textInput: 'abc-xy-asd', numberInput: 9 },
          undefined,
        ],
      ])('%s', (_, values, errors) => {
        const testValue = validateForm(values);
        if (errors) {
          expect(testValue).toEqual(errors);
        } else {
          expect(testValue).toBeUndefined();
        }
      });

      describe('and one field has pattern validation', () => {
        beforeEach(() => {
          const result = JSONSchemaBuilder()
            .addInput({ patternTextInput: mockTextPatternInput })
            .setRequiredFields(['patternTextInput'])
            .build();
          const { handleValidation: handleValidationEach } = createHeadlessForm(result);
          handleValidation = handleValidationEach;
        });

        it.each([
          [
            'validation should return false when a value does not match a pattern',
            { patternTextInput: 'abc-xy-asd' },
            { patternTextInput: expect.stringMatching(/Must have a valid format. E.g./i) },
          ],
          [
            'validation should return true when value matches the pattern',
            { patternTextInput: '986-39-0716' },
            undefined,
          ],
        ])('%s', (_, values, errors) => {
          const testValue = validateForm(values);
          if (errors) {
            expect(testValue).toEqual(errors);
          } else {
            expect(testValue).toBeUndefined();
          }
        });
      });

      describe('and one field has max length validation', () => {
        beforeEach(() => {
          const result = JSONSchemaBuilder()
            .addInput({ maxLengthTextInput: mockTextMaxLengthInput })
            .setRequiredFields(['maxLengthTextInput'])
            .build();
          const { handleValidation: handleValidationEach } = createHeadlessForm(result);
          handleValidation = handleValidationEach;
        });

        it.each([
          [
            'validation should return false when a value is greater than the limit',
            { maxLengthTextInput: 'Hello John Dow' },
            { maxLengthTextInput: 'Please insert up to 10 characters' },
          ],
          [
            'validation should return true when value is within the limit',
            { maxLengthTextInput: 'Hello John' },
            undefined,
          ],
        ])('%s', (_, values, errors) => {
          const testValue = validateForm(values);
          if (errors) {
            expect(testValue).toEqual(errors);
          } else {
            expect(testValue).toBeUndefined();
          }
        });
      });
    });

    describe('and fields are dynamically required/optional', () => {
      it('applies correct validation for single-value based conditionals', async () => {
        const { fields, handleValidation } = createHeadlessForm(schemaDynamicValidationConst);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(
          validateForm({
            validate_tabs: 'no',
            a_fieldset: {
              id_number: '123',
            },
            mandatory_group_array: 'no',
          })
        ).toBeUndefined();

        const getTabsField = () =>
          fields.find((f) => f.name === 'a_fieldset').fields.find((f) => f.name === 'tabs');

        expect(getTabsField().required).toBeFalsy();

        expect(
          validateForm({
            validate_tabs: 'yes',
            a_fieldset: {
              id_number: '123',
            },
            mandatory_group_array: 'no',
          })
        ).toEqual({
          a_fieldset: {
            tabs: 'Required field',
          },
        });

        expect(getTabsField().required).toBeTruthy();

        expect(
          validateForm({
            validate_tabs: 'yes',
            a_fieldset: {
              id_number: '123',
            },
            mandatory_group_array: 'yes',
            a_group_array: [{ full_name: 'adfs' }],
          })
        ).toEqual({ a_fieldset: { tabs: 'Required field' } });

        expect(
          validateForm({
            validate_tabs: 'yes',
            a_fieldset: {
              id_number: '123',
              tabs: 2,
            },
            mandatory_group_array: 'no',
          })
        ).toBeUndefined();
      });

      it('applies correct validation for minimum/maximum conditionals', async () => {
        const { handleValidation } = createHeadlessForm(schemaDynamicValidationMinimumMaximum);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        // Check for minimum condition
        expect(
          validateForm({
            a_number: 0,
          })
        ).toEqual({
          a_conditional_text: 'Required field',
          a_number: 'Must be greater or equal to 1',
        });

        // Check for maximum condition
        expect(
          validateForm({
            a_number: 11,
          })
        ).toEqual({
          a_conditional_text: 'Required field',
          a_number: 'Must be smaller or equal to 10',
        });

        // Check for absence of a_number
        expect(validateForm({})).toEqual({
          a_conditional_text: 'Required field',
        });

        // Check for number within range
        expect(
          validateForm({
            a_number: 5,
          })
        ).toBeUndefined();
      });

      it('applies correct validation for minLength/maxLength conditionals', async () => {
        const { handleValidation } = createHeadlessForm(schemaDynamicValidationMinLengthMaxLength);
        const validateForm = (vals) => friendlyError(handleValidation(vals));
        const formError = {
          a_conditional_text: 'Required field',
        };
        // By default a_conditional_text is required.
        expect(validateForm({})).toEqual(formError);

        // Check for minimum length condition - a_text >= 3 chars
        expect(
          validateForm({
            a_text: 'Foo',
          })
        ).toBeUndefined();

        // Check for maximum length condition - a_text <= 5 chars
        expect(
          validateForm({
            a_text: 'Fooba',
          })
        ).toBeUndefined();

        // Check for text out of length range (7 chars)
        expect(
          validateForm({
            a_text: 'Foobaaz',
          })
        ).toEqual(formError);

        // Check for text out of length range (2 chars)
        expect(
          validateForm({
            a_text: 'Fe',
          })
        ).toEqual(formError);
      });

      it('applies correct validation for array-contain based conditionals', async () => {
        const { handleValidation } = createHeadlessForm(schemaDynamicValidationContains);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(
          validateForm({
            validate_fieldset: ['id_number'],
            a_fieldset: {
              id_number: '123',
            },
          })
        ).toBeUndefined();

        expect(
          validateForm({
            validate_fieldset: ['id_number', 'all'],
            a_fieldset: {
              id_number: '123',
            },
          })
        ).toEqual({
          a_fieldset: {
            tabs: 'Required field',
          },
        });

        expect(
          validateForm({
            validate_fieldset: ['id_number', 'all'],
            a_fieldset: {
              id_number: '123',
              tabs: 2,
            },
          })
        ).toBeUndefined();
      });

      it('applies correct validation for fieldset fields', async () => {
        const { handleValidation } = createHeadlessForm(schemaDynamicValidationContains);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(
          validateForm({
            validate_fieldset: ['id_number'],
            a_fieldset: {
              id_number: '123',
            },
          })
        ).toBeUndefined();

        expect(
          validateForm({
            validate_fieldset: ['id_number', 'all'],
            a_fieldset: {
              id_number: '123',
            },
          })
        ).toEqual({
          a_fieldset: {
            tabs: 'Required field',
          },
        });

        expect(
          validateForm({
            validate_fieldset: ['id_number', 'all'],
            a_fieldset: {
              id_number: '123',
              tabs: 2,
            },
          })
        ).toBeUndefined();
      });

      it('applies any of the validation alternatives in a anyOf branch', async () => {
        const { handleValidation } = createHeadlessForm(schemaAnyOfValidation);
        const validateForm = (vals) => friendlyError(handleValidation(vals));

        expect(
          validateForm({
            field_a: '123',
          })
        ).toBeUndefined();

        expect(
          validateForm({
            field_b: '456',
          })
        ).toEqual({ field_c: 'Required field' });

        expect(
          validateForm({
            field_b: '456',
            field_c: '789',
          })
        ).toBeUndefined();

        expect(
          validateForm({
            field_a: '123',
            field_c: '789',
          })
        ).toBeUndefined();

        expect(
          validateForm({
            field_a: '123',
            field_b: '456',
            field_c: '789',
          })
        ).toBeUndefined();
      });

      describe('nested conditionals', () => {
        it('given empty values, runs "else" (gets hidden)', () => {
          const { fields } = createHeadlessForm(schemaWithConditionalReadOnlyProperty, {
            field_a: null,
          });
          expect(getField(fields, 'field_b').isVisible).toBe(false);
        });

        it('given a match, runs "then" (turns visible and editable)', () => {
          const { fields } = createHeadlessForm(schemaWithConditionalReadOnlyProperty, {
            initialValues: { field_a: 'yes' },
          });
          expect(getField(fields, 'field_b').isVisible).toBe(true);
          expect(getField(fields, 'field_b').readOnly).toBe(false);
        });

        it('given a nested match, runs "else-then" (turns visible but readOnly)', () => {
          const { fields } = createHeadlessForm(schemaWithConditionalReadOnlyProperty, {
            initialValues: { field_a: 'no' },
          });
          expect(getField(fields, 'field_b').isVisible).toBe(true);
          expect(getField(fields, 'field_b').readOnly).toBe(true);
        });
      });

      describe('conditional fields (incorrectly done)', () => {
        // this catches the typical scenario where developers forget to set the if.required[]

        it('given empty values, the incorrect conditional runs "then" instead of "else"', () => {
          const { fields: fieldsEmpty } = createHeadlessForm(schemaWithWrongConditional, {
            initialValues: { field_a: null, field_a_wrong: null },
          });
          // The dependent correct field gets hidden, but...
          expect(getField(fieldsEmpty, 'field_b').isVisible).toBe(false);
          // ...the dependent wrong field stays visible because the
          // conditional is wrong (it's missing the if.required[])
          expect(getField(fieldsEmpty, 'field_b_wrong').isVisible).toBe(true);
        });

        it('given a match ("yes"), both runs "then" (turn visible)', () => {
          const { fields: fieldsVisible } = createHeadlessForm(schemaWithWrongConditional, {
            initialValues: { field_a: 'yes', field_a_wrong: 'yes' },
          });
          expect(getField(fieldsVisible, 'field_b').isVisible).toBe(true);
          expect(getField(fieldsVisible, 'field_b_wrong').isVisible).toBe(true);
        });

        it('not given a match ("no"), both run else (stay hidden)', () => {
          const { fields: fieldsHidden } = createHeadlessForm(schemaWithWrongConditional, {
            initialValues: { field_a: 'no', field_a_wrong: 'no' },
          });
          expect(getField(fieldsHidden, 'field_b').isVisible).toBe(false);
          expect(getField(fieldsHidden, 'field_b_wrong').isVisible).toBe(false);
        });
      });

      it('checkbox should have no initial value when its dynamically shown and invisible', () => {
        const { fields } = createHeadlessForm(schemaWithConditionalAcknowledgementProperty, {
          initialValues: {
            field_a: 'no',
          },
        });
        const dependentField = getField(fields, 'field_b');
        expect(dependentField.isVisible).toBe(false);
        expect(dependentField.value).toBe(undefined);
      });

      it('checkbox should have no initial value when its dynamically shown and visible', () => {
        const { fields } = createHeadlessForm(schemaWithConditionalAcknowledgementProperty, {
          initialValues: {
            field_a: 'yes',
          },
        });
        const dependentField = getField(fields, 'field_b');
        expect(dependentField.isVisible).toBe(true);
        expect(dependentField.value).toBe(undefined);
      });
    });
  });

  // TODO: delete after migration to x-jsf-errorMessage is completed
  describe('Throwing custom error messages using errorMessage (deprecated)', () => {
    it.each([
      [
        'type',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              errorMessage: { type: 'It has to be a number.' },
            },
          })
          .build(),
        { numberInput: 'Two' },
        {
          numberInput: 'It has to be a number.',
        },
        false,
      ],
      [
        'minimum',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              errorMessage: { minimum: 'I am a custom error message' },
            },
          })
          .build(),
        { numberInput: -1 },
        {
          numberInput: 'I am a custom error message',
        },
        false,
      ],
      [
        'required',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              errorMessage: { required: 'I am a custom error message' },
            },
          })
          .setRequiredFields(['numberInput'])
          .build(),
        {},
        {
          numberInput: 'I am a custom error message',
        },
      ],
      [
        'required (ignored because it is optional)',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              errorMessage: { required: 'I am a custom error message' },
            },
          })
          .build(),
        {},
        undefined,
      ],
      [
        'maximum',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              errorMessage: { maximum: 'I am a custom error message' },
            },
          })
          .build(),
        { numberInput: 11 },
        {
          numberInput: 'I am a custom error message',
        },
      ],
      [
        'minLength',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              minLength: 3,
              errorMessage: { minLength: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'maxLength',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              maxLength: 3,
              errorMessage: { maxLength: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aaaa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'pattern',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              pattern: '^(\\+|00)\\d*$',
              errorMessage: { pattern: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aaaa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'maxFileSize',
        JSONSchemaBuilder()
          .addInput({
            fileInput: {
              ...mockFileInput,
              'x-jsf-presentation': {
                ...mockFileInput['x-jsf-presentation'],
                maxFileSize: 1000,
              },
              errorMessage: { maxFileSize: 'I am a custom error message' },
            },
          })
          .build(),
        {
          fileInput: [
            (() => {
              const file = new File([''], 'file.png');
              Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1024 });
              return file;
            })(),
          ],
        },
        {
          fileInput: 'I am a custom error message',
        },
      ],
      [
        'accept',
        JSONSchemaBuilder()
          .addInput({
            fileInput: {
              ...mockFileInput,
              accept: '.pdf',
              errorMessage: { accept: 'I am a custom error message' },
            },
          })
          .build(),
        {
          fileInput: [new File([''], 'file.docx')],
        },
        {
          fileInput: 'I am a custom error message',
        },
      ],
    ])('error message for property "%s"', (_, schema, input, errors) => {
      const { handleValidation } = createHeadlessForm(schema);
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      if (errors) {
        expect(validateForm(input)).toEqual(errors);
      } else {
        expect(validateForm(input)).toBeUndefined();
      }
    });
  });

  describe('Custom error messages', () => {
    it.each([
      [
        'type',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              'x-jsf-errorMessage': { type: 'It has to be a number.' },
            },
          })
          .build(),
        { numberInput: 'Two' },
        {
          numberInput: 'It has to be a number.',
        },
        false,
      ],
      [
        'minimum',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              'x-jsf-errorMessage': { minimum: 'I am a custom error message' },
            },
          })
          .build(),
        { numberInput: -1 },
        {
          numberInput: 'I am a custom error message',
        },
        false,
      ],
      [
        'required',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              'x-jsf-errorMessage': { required: 'I am a custom error message' },
            },
          })
          .setRequiredFields(['numberInput'])
          .build(),
        {},
        {
          numberInput: 'I am a custom error message',
        },
      ],
      [
        'required (ignored because it is optional)',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              'x-jsf-errorMessage': { required: 'I am a custom error message' },
            },
          })
          .build(),
        {},
        undefined,
      ],
      [
        'maximum',
        JSONSchemaBuilder()
          .addInput({
            numberInput: {
              ...mockNumberInput,
              'x-jsf-errorMessage': { maximum: 'I am a custom error message' },
            },
          })
          .build(),
        { numberInput: 11 },
        {
          numberInput: 'I am a custom error message',
        },
      ],
      [
        'minLength',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              minLength: 3,
              'x-jsf-errorMessage': { minLength: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'maxLength',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              maxLength: 3,
              'x-jsf-errorMessage': { maxLength: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aaaa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'pattern',
        JSONSchemaBuilder()
          .addInput({
            stringInput: {
              ...mockTextInput,
              pattern: '^(\\+|00)\\d*$',
              'x-jsf-errorMessage': { pattern: 'I am a custom error message' },
            },
          })
          .build(),
        { stringInput: 'aaaa' },
        {
          stringInput: 'I am a custom error message',
        },
      ],
      [
        'maxFileSize',
        JSONSchemaBuilder()
          .addInput({
            fileInput: {
              ...mockFileInput,
              'x-jsf-presentation': {
                ...mockFileInput['x-jsf-presentation'],
                maxFileSize: 1000,
              },
              'x-jsf-errorMessage': { maxFileSize: 'I am a custom error message' },
            },
          })
          .build(),
        {
          fileInput: [
            (() => {
              const file = new File([''], 'file.png');
              Object.defineProperty(file, 'size', { value: 1024 * 1024 * 1024 });
              return file;
            })(),
          ],
        },
        {
          fileInput: 'I am a custom error message',
        },
      ],
      [
        'accept',
        JSONSchemaBuilder()
          .addInput({
            fileInput: {
              ...mockFileInput,
              accept: '.pdf',
              'x-jsf-errorMessage': { accept: 'I am a custom error message' },
            },
          })
          .build(),
        {
          fileInput: [new File([''], 'file.docx')],
        },
        {
          fileInput: 'I am a custom error message',
        },
      ],
    ])('error message for property "%s"', (_, schema, input, errors) => {
      const { handleValidation } = createHeadlessForm(schema);
      const validateForm = (vals) => friendlyError(handleValidation(vals));

      if (errors) {
        expect(validateForm(input)).toEqual(errors);
      } else {
        expect(validateForm(input)).toBeUndefined();
      }
    });

    it('accepts with options.inputType[].errorMessage', () => {
      // Sanity-check the default error message
      const resultDefault = createHeadlessForm(schemaForErrorMessageSpecificity);
      expect(resultDefault.handleValidation({}).formErrors).toEqual({
        weekday: 'Required field',
        day: 'Required field',
        month: 'Required field',
        year: 'The year is mandatory.', // from x-jsf-errorMessage
      });

      // Assert the custom error message
      const resultCustom = createHeadlessForm(schemaForErrorMessageSpecificity, {
        ...jsfConfigForErrorMessageSpecificity,
      });
      expect(resultCustom.handleValidation({}).formErrors).toEqual({
        weekday: 'Required field', // sanity-check that a different inputType keeps the default error msg.
        day: 'This cannot be empty.',
        month: 'This cannot be empty.',
        year: 'The year is mandatory.', // error specificity: schema's msg is higher than options' msg.
      });
    });
  });

  describe('when default values are provided', () => {
    describe('and "fieldset" has scoped conditionals', () => {
      it('should show conditionals fields when values fullfil conditions', () => {
        const result = createHeadlessForm(schemaFieldsetScopedCondition, {
          initialValues: { child: { has_child: 'yes' } },
        });

        const fieldset = result.fields[0];

        expect(fieldset).toMatchObject({
          fields: [
            {
              name: 'has_child',
              required: true,
            },
            {
              name: 'age',
              required: true,
              isVisible: true,
            },
            {
              name: 'passport_id',
              required: false,
              isVisible: true,
            },
          ],
        });
      });

      it('should hide conditionals fields when values do not fullfil conditions', () => {
        const result = createHeadlessForm(schemaFieldsetScopedCondition, {
          child: { has_child: 'no' },
        });

        const fieldset = result.fields[0];

        expect(fieldset).toMatchObject({
          fields: [
            {
              name: 'has_child',
              required: true,
            },
            {
              name: 'age',
              required: false,
              isVisible: false,
            },
            {
              name: 'passport_id',
              required: false,
              isVisible: false,
            },
          ],
        });
      });

      it('should ignore initial values that do not match the field type (eg string vs object)', () => {
        const result = createHeadlessForm(schemaInputTypeFieldset, {
          initialValues: {
            a_fieldset: 'foo', // should be an object instead of string
          },
        });

        // It returns fields without errors
        expect(result.fields).toBeDefined();
        expect(result.fields[0].fields[0].name).toBe('id_number');
        expect(result.fields[0].fields[1].name).toBe('tabs');

        // Warn about those missmatched values
        expect(console.warn).toHaveBeenCalledWith(
          `Field "a_fieldset"'s value is "foo", but should be type object.`
        );
        console.warn.mockClear();

        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('parser options', () => {
    it('should support any custom field attribute', () => {
      const customAttrs = {
        something: 'foo', // a misc attribute
        inputType: 'super', // overrides "textarea"
        falsy: false, // accepts falsy attributes
      };
      const result = createHeadlessForm(
        {
          properties: {
            feedback: {
              title: 'Your feedback',
              type: 'string',
              presentation: {
                inputType: 'textarea',
              },
            },
          },
        },
        {
          customProperties: {
            feedback: {
              ...customAttrs,
            },
          },
        }
      );

      expect(result).toMatchObject({
        fields: [
          {
            name: 'feedback',
            label: 'Your feedback',
            jsonType: 'string',
            ...customAttrs,
          },
        ],
      });
    });

    it('should support custom description (checkbox)', () => {
      const result = createHeadlessForm(
        {
          properties: {
            terms: {
              const: 'Agreed',
              title: 'Terms',
              description: 'Accept terms.',
              type: 'string',
              presentation: { inputType: 'checkbox' },
            },
          },
        },
        {
          customProperties: {
            terms: {
              description: (text) => `Extra text before. ${text}`,
            },
          },
        }
      );

      expect(result).toMatchObject({
        fields: [
          {
            label: 'Terms',
            description: 'Extra text before. Accept terms.', // ensure custom description works
            name: 'terms',
            required: false,
            inputType: 'checkbox',
            type: 'checkbox',
            jsonType: 'string',
            checkboxValue: 'Agreed', // ensure _composeFieldCheckbox(). transformations are passed.
          },
        ],
      });

      // ensure _composeFieldCheckbox() "value" destructure happens.
      expect(result.fields[0]).not.toHaveProperty('value');
    });

    it('should ignore fields that are not present in the schema', () => {
      const schemaBase = {
        properties: {
          feedback: {
            title: 'Your feedback',
            type: 'string',
            presentation: {
              inputType: 'textarea',
            },
          },
        },
      };

      const resultWithoutCustomProperties = createHeadlessForm(schemaBase);
      const resultWithInvalidCustomProperty = createHeadlessForm(schemaBase, {
        customProperties: {
          unknown: {
            'data-foo': 'baz',
          },
        },
      });

      function assertResultHasNoCustomizations(result) {
        expect(result.fields).toHaveLength(1); // The "unknown" is not present
        expect(result.fields[0].name).toBe('feedback');
        expect(result.fields[0]).not.toHaveProperty('data-foo');
      }

      assertResultHasNoCustomizations(resultWithoutCustomProperties);
      assertResultHasNoCustomizations(resultWithInvalidCustomProperty);
    });

    it('should handle custom properties when inside fieldsets', () => {
      const result = createHeadlessForm(
        JSONSchemaBuilder()
          .addInput({
            id_number: mockNumberInput,
          })
          .addInput({
            fieldset: mockFieldset,
          })
          .addInput({ nestedFieldset: mockNestedFieldset })
          .build(),
        {
          customProperties: {
            id_number: { 'data-field': 'field' },
            fieldset: {
              customProperties: {
                id_number: { 'data-fieldset': 'fieldset' },
              },
            },
            nestedFieldset: {
              customProperties: {
                innerFieldset: {
                  customProperties: {
                    id_number: { 'data-nested-fieldset': 'nested-fieldset' },
                  },
                },
              },
            },
          },
        }
      );

      expect(result).toMatchObject({
        fields: [
          {
            'data-field': 'field',
            name: 'id_number',
          },
          {
            name: 'fieldset',
            fields: [
              {
                name: 'id_number',
                'data-fieldset': 'fieldset',
              },
              {
                name: 'tabs',
              },
            ],
          },
          {
            name: 'nestedFieldset',
            fields: [
              {
                name: 'innerFieldset',
                fields: [
                  {
                    name: 'id_number',
                    'data-nested-fieldset': 'nested-fieldset',
                  },
                  {
                    name: 'tabs',
                  },
                ],
              },
            ],
          },
        ],
      });

      const [fieldResult, fildsetResult, nestedFieldsetResult] = result.fields;

      // Sanity check that custom attrs are not "leaked" into other fields
      // $.id_number
      expect(fieldResult).toHaveProperty('name', 'id_number');
      expect(fieldResult).toHaveProperty('data-field', 'field');
      expect(fieldResult).not.toHaveProperty('data-fieldset');
      expect(fieldResult).not.toHaveProperty('data-nested-fieldset');

      // $.fieldset.id_number
      expect(fildsetResult.fields[0]).toHaveProperty('name', 'id_number');
      expect(fildsetResult.fields[0]).toHaveProperty('data-fieldset', 'fieldset');
      expect(fildsetResult.fields[0]).not.toHaveProperty('data-field');
      expect(fildsetResult.fields[0]).not.toHaveProperty('data-nested-fieldset');
      expect(fildsetResult.fields[1]).not.toHaveProperty('data-field');
      expect(fildsetResult.fields[1]).not.toHaveProperty('data-nested-fieldset');

      // $.nestedFieldset.innerFieldset.id_number
      expect(nestedFieldsetResult.fields[0].fields[0]).toHaveProperty('name', 'id_number');
      expect(nestedFieldsetResult.fields[0].fields[0]).toHaveProperty(
        'data-nested-fieldset',
        'nested-fieldset'
      );
      expect(nestedFieldsetResult.fields[0].fields[0]).not.toHaveProperty('data-field');
      expect(nestedFieldsetResult.fields[0].fields[0]).not.toHaveProperty('data-fieldset');
      expect(nestedFieldsetResult.fields[0].fields[1]).not.toHaveProperty('data-field');
      expect(nestedFieldsetResult.fields[0].fields[1]).not.toHaveProperty('data-fieldset');
    });
    it('should handle custom properties when inside fieldsets for fields name clashing with reserved words', () => {
      const { fields } = createHeadlessForm(
        {
          properties: {
            dog: {
              title: 'Dog details',
              description: 'Fieldset description',
              'x-jsf-presentation': {
                inputType: 'fieldset',
              },
              properties: {
                name: {
                  // This fieldName (name) clashs with the field specs "name"
                  title: 'Dogs name',
                  'x-jsf-presentation': {
                    inputType: 'text',
                  },
                  type: 'string',
                },
                type: {
                  // This field name (type) clashs with the field specs "type"
                  title: 'Breed type',
                  'x-jsf-presentation': {
                    inputType: 'number',
                  },
                  type: 'string',
                },
              },
              required: ['name'],
              type: 'object',
            },
          },
          required: ['dog'],
        },
        {
          customProperties: {
            dog: {
              customProperties: {
                name: {
                  description: "What's your dogs name",
                },
              },
            },
          },
        }
      );

      expect(fields.length).toBe(1);
      expect(fields[0].fields.length).toBe(2);
      expect(fields[0].fields[0].name).toBe('name');
      expect(fields[0].fields[0].description).toBe("What's your dogs name");
    });
  });

  describe('presentation (deprecated in favor of x-jsf-presentation)', () => {
    it('works well with position, description, inputType, and any other arbitrary attribute', () => {
      const { fields } = createHeadlessForm({
        properties: {
          day: {
            title: 'Date',
            presentation: {
              inputType: 'date',
              position: 1,
              foo: 'bar',
              statement: {
                description: 'ss',
              },
            },
          },
          time: {
            title: 'Time',
            presentation: {
              inputType: 'clock',
              description: 'Write in <b>hh:ss</b> format',
              position: 0,
              deprecated: {
                description: 'In favor of X',
              },
            },
          },
        },
      });

      // Assert order from presentation.position
      expect(fields[0].name).toBe('time');
      expect(fields[1].name).toBe('day');

      // Assert spreaded attributes
      expect(fields).toMatchObject([
        {
          name: 'time',
          description: 'Write in <b>hh:ss</b> format', // from presentation
          inputType: 'clock', // arbitrary type from presentation
          deprecated: {
            description: 'In favor of X', // from presentation
          },
        },
        {
          name: 'day',
          inputType: 'date', // arbitrary type from presentation
          foo: 'bar', // spread from presentation
          statement: {
            // from presentation
            description: 'ss',
          },
        },
      ]);
    });
  });
});
