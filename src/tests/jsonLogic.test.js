import { createHeadlessForm } from '../createHeadlessForm';

import {
  createSchemaWithRulesOnFieldA,
  createSchemaWithThreePropertiesWithRuleOnFieldA,
  multiRuleSchema,
  schemaWhereValidationAndComputedValueIsAppliedOnNormalThenStatement,
  schemaInlineComputedAttrForMaximumMinimumValues,
  schemaInlineComputedAttrForTitle,
  schemaWithBadOperation,
  schemaWithChecksAndThenValidationsOnThen,
  schemaWithComputedAttributeThatDoesntExist,
  schemaWithComputedAttributeThatDoesntExistDescription,
  schemaWithComputedAttributeThatDoesntExistTitle,
  schemaWithComputedAttributes,
  schemaWithComputedAttributesAndErrorMessages,
  schemaWithComputedValueChecksInIf,
  schemaWithDeepVarThatDoesNotExist,
  schemaWithDeepVarThatDoesNotExistOnFieldset,
  schemaWithGreaterThanChecksForThreeFields,
  schemaWithIfStatementWithComputedValuesAndValidationChecks,
  schemaWithInlineMultipleRulesForComputedAttributes,
  schemaWithInlineRuleForComputedAttributeWithCopy,
  schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar,
  schemaWithJSFLogicAndInlineRule,
  schemaWithMissingComputedValue,
  schemaWithMissingRule,
  schemaWithMultipleComputedValueChecks,
  schemaWithNativeAndJSONLogicChecks,
  schemaWithNonRequiredField,
  schemaWithPropertiesCheckAndValidationsInAIf,
  schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset,
  schemaWithTwoRules,
  schemaWithTwoValidationsWhereOneOfThemIsAppliedConditionally,
  schemaWithUnknownVariableInComputedValues,
  schemaWithUnknownVariableInValidations,
  schemaWithValidationThatDoesNotExistOnProperty,
  badSchemaThatWillNotSetAForcedValue,
} from './jsonLogic.fixtures';
import { mockConsole, restoreConsoleAndEnsureItWasNotCalled } from './testUtils';

beforeEach(mockConsole);
afterEach(restoreConsoleAndEnsureItWasNotCalled);

describe('jsonLogic: cross-values validations', () => {
  describe('Does not conflict with native JSON schema', () => {
    it('Given an optional field and empty value, jsonLogic validations are ignored', () => {
      const { handleValidation } = createHeadlessForm(schemaWithNonRequiredField, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toBeUndefined();
      expect(handleValidation({ field_a: 0, field_b: 10 }).formErrors).toEqual({
        field_b: 'Must be greater than field_a',
      });
      expect(handleValidation({ field_a: 'incorrect value' }).formErrors).toEqual({
        field_a: 'The value must be a number',
      });
      expect(handleValidation({ field_a: 11 }).formErrors).toBeUndefined();
    });

    it('Native validations have higher precedence than jsonLogic validations', () => {
      const { handleValidation } = createHeadlessForm(schemaWithNativeAndJSONLogicChecks, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({ field_a: 'Required field' });
      expect(handleValidation({ field_a: 0 }).formErrors).toEqual({
        field_a: 'Must be greater or equal to 100',
      });
      expect(handleValidation({ field_a: 101 }).formErrors).toEqual({
        field_a: 'Must be a multiple of 10',
      });
      expect(handleValidation({ field_a: 110 }).formErrors).toBeUndefined();
    });
  });

  describe('Relative: <, >, =', () => {
    it('bigger: field_a > field_b', () => {
      const schema = createSchemaWithRulesOnFieldA({
        a_greater_than_b: {
          errorMessage: 'Field A must be bigger than field B',
          rule: { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      const { formErrors } = handleValidation({ field_a: 1, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must be bigger than field B');
      expect(handleValidation({ field_a: 2, field_b: 0 }).formErrors).toEqual(undefined);
    });

    it('smaller: field_a < field_b', () => {
      const schema = createSchemaWithRulesOnFieldA({
        a_less_than_b: {
          errorMessage: 'Field A must be smaller than field B',
          rule: { '<': [{ var: 'field_a' }, { var: 'field_b' }] },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      const { formErrors } = handleValidation({ field_a: 2, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must be smaller than field B');
      expect(handleValidation({ field_a: 0, field_b: 2 }).formErrors).toEqual(undefined);
    });

    it('equal: field_a = field_b', () => {
      const schema = createSchemaWithRulesOnFieldA({
        a_equals_b: {
          errorMessage: 'Field A must equal field B',
          rule: { '==': [{ var: 'field_a' }, { var: 'field_b' }] },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      const { formErrors } = handleValidation({ field_a: 3, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must equal field B');
      expect(handleValidation({ field_a: 2, field_b: 2 }).formErrors).toEqual(undefined);
    });
  });

  describe('Incorrectly written schemas', () => {
    afterEach(() => console.error.mockClear());

    const cases = [
      [
        'x-jsf-logic.validations: throw when theres a missing rule',
        schemaWithMissingRule,
        '[json-schema-form] json-logic error: Validation "a_greater_than_ten" has missing rule.',
      ],
      [
        'x-jsf-logic.validations: throw when theres a value that does not exist in a rule',
        schemaWithUnknownVariableInValidations,
        '[json-schema-form] json-logic error: rule "a_equals_ten" has no variable "field_a".',
      ],
      [
        'x-jsf-logic.computedValues: throw when theres a value that does not exist in a rule',
        schemaWithUnknownVariableInComputedValues,
        '[json-schema-form] json-logic error: rule "a_times_ten" has no variable "field_a".',
      ],
      [
        'x-jsf-logic.computedValues: throw when theres a missing computed value',
        schemaWithMissingComputedValue,
        '[json-schema-form] json-logic error: Computed value "a_plus_ten" has missing rule.',
      ],
      [
        'x-jsf-logic-computedAttrs: error if theres a value that does not exist on an attribute.',
        schemaWithComputedAttributeThatDoesntExist,
        `[json-schema-form] json-logic error: Computed value "iDontExist" doesn't exist in field "field_a".`,
      ],
      [
        'x-jsf-logic-computedAttrs: error if theres a value that does not exist on a template string (title).',
        schemaWithComputedAttributeThatDoesntExistTitle,
        `[json-schema-form] json-logic error: Computed value "iDontExist" doesn't exist in field "field_a".`,
      ],
      [
        'x-jsf-logic-computedAttrs: error if theres a value that does not exist on a template string (description).',
        schemaWithComputedAttributeThatDoesntExistDescription,
        `[json-schema-form] json-logic error: Computed value "iDontExist" doesn't exist in field "field_a".`,
      ],
      [
        'x-jsf-logic-computedAttrs:, error if theres a value referenced that does not exist on an inline rule.',
        schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar,
        `[json-schema-form] json-logic error: fieldName "IdontExist" doesn't exist in field "field_a.x-jsf-logic-computedAttrs.title".`,
      ],
      [
        'x-jsf-logic.validations: error if a field does not exist in a deeply nested rule',
        schemaWithDeepVarThatDoesNotExist,
        '[json-schema-form] json-logic error: rule "dummy_rule" has no variable "field_b".',
      ],
      [
        'x-jsf-logic.validations: error if rule does not exist on a fieldset property',
        schemaWithDeepVarThatDoesNotExistOnFieldset,
        '[json-schema-form] json-logic error: rule "dummy_rule" has no variable "field_a".',
      ],
      [
        'x-jsf-validations: error if a validation name does not exist',
        schemaWithValidationThatDoesNotExistOnProperty,
        `[json-schema-form] json-logic error: "field_a" required validation "iDontExist" doesn't exist.`,
      ],
      [
        'x-jsf-logic.validations: A top level logic keyword will not be able to reference fieldset properties',
        schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset,
        '[json-schema-form] json-logic error: rule "validation_parent" has no variable "child".',
      ],
      [
        'x-jsf-logic.validations: error if unknown operation',
        schemaWithBadOperation,
        '[json-schema-form] json-logic error: in "badOperator" rule there is an unknown operator "++".',
      ],
    ];

    test.each(cases)('%p', (_, schema, expectedErrorString) => {
      const { error } = createHeadlessForm(schema, { strictInputType: false });
      const expectedError = new Error(expectedErrorString);
      expect(console.error).toHaveBeenCalledWith('JSON Schema invalid!', expectedError);
      expect(error).toEqual(expectedError);
    });
  });

  describe('Arithmetic: +, -, *, /', () => {
    it('multiple: field_a > field_b * 2', () => {
      const schema = createSchemaWithRulesOnFieldA({
        a_greater_than_b_multiplied_by_2: {
          errorMessage: 'Field A must be at least twice as big as field b',
          rule: { '>': [{ var: 'field_a' }, { '*': [{ var: 'field_b' }, 2] }] },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });

      const { formErrors } = handleValidation({ field_a: 1, field_b: 4 });
      expect(formErrors.field_a).toEqual('Field A must be at least twice as big as field b');
      expect(handleValidation({ field_a: 3, field_b: 1 }).formErrors).toEqual(undefined);
    });

    it('divide: field_a > field_b / 2', () => {
      const { handleValidation } = createHeadlessForm(
        createSchemaWithRulesOnFieldA({
          a_greater_than_b_divided_by_2: {
            errorMessage: 'Field A must be greater than field_b / 2',
            rule: { '>': [{ var: 'field_a' }, { '/': [{ var: 'field_b' }, 2] }] },
          },
        }),
        { strictInputType: false }
      );
      expect(handleValidation({ field_a: 2, field_b: 4 }).formErrors).toEqual({
        field_a: 'Field A must be greater than field_b / 2',
      });
      expect(handleValidation({ field_a: 3, field_b: 5 }).formErrors).toEqual(undefined);
    });

    it('sum: field_a > field_b + field_c', () => {
      const schema = createSchemaWithThreePropertiesWithRuleOnFieldA({
        a_is_greater_than_b_plus_c: {
          errorMessage: 'Field A must be greater than field_b and field_b added together',
          rule: {
            '>': [{ var: 'field_a' }, { '+': [{ var: 'field_b' }, { var: 'field_c' }] }],
          },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      const { formErrors } = handleValidation({ field_a: 0, field_b: 1, field_c: 2 });
      expect(formErrors.field_a).toEqual(
        'Field A must be greater than field_b and field_b added together'
      );
      expect(handleValidation({ field_a: 4, field_b: 1, field_c: 2 }).formErrors).toEqual(
        undefined
      );
    });
  });

  describe('Logical: ||, &&', () => {
    it('AND: field_a > field_b && field_a > field_c (implicit with multiple rules in a single field)', () => {
      const schema = createSchemaWithThreePropertiesWithRuleOnFieldA({
        a_is_greater_than_b: {
          errorMessage: 'Field A must be greater than field_b',
          rule: {
            '>': [{ var: 'field_a' }, { var: 'field_b' }],
          },
        },
        a_is_greater_than_c: {
          errorMessage: 'Field A must be greater than field_c',
          rule: {
            '>': [{ var: 'field_a' }, { var: 'field_c' }],
          },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      expect(handleValidation({ field_a: 1, field_b: 10, field_c: 0 }).formErrors.field_a).toEqual(
        'Field A must be greater than field_b'
      );
      expect(handleValidation({ field_a: 1, field_b: 0, field_c: 10 }).formErrors.field_a).toEqual(
        'Field A must be greater than field_c'
      );
      expect(handleValidation({ field_a: 10, field_b: 5, field_c: 5 }).formErrors).toEqual(
        undefined
      );
    });

    it('OR: field_a > field_b or field_a > field_c', () => {
      const schema = createSchemaWithThreePropertiesWithRuleOnFieldA({
        field_a_is_greater_than_b_or_c: {
          errorMessage: 'Field A must be greater than field_b or field_c',
          rule: {
            or: [
              { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
              { '>': [{ var: 'field_a' }, { var: 'field_c' }] },
            ],
          },
        },
      });
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      expect(handleValidation({ field_a: 0, field_b: 10, field_c: 10 }).formErrors.field_a).toEqual(
        'Field A must be greater than field_b or field_c'
      );
      expect(handleValidation({ field_a: 1, field_b: 0, field_c: 10 }).formErrors).toEqual(
        undefined
      );
      expect(handleValidation({ field_a: 10, field_b: 5, field_c: 5 }).formErrors).toEqual(
        undefined
      );
    });
  });

  describe('Multiple validations', () => {
    it('two rules: A > B; A is even', () => {
      const { handleValidation } = createHeadlessForm(multiRuleSchema, { strictInputType: false });
      expect(handleValidation({ field_a: 1 }).formErrors).toEqual({
        field_a: 'A must be even',
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: 1, field_b: 2 }).formErrors).toEqual({
        field_a: 'A must be bigger than B',
      });
      expect(handleValidation({ field_a: 3, field_b: 2 }).formErrors).toEqual({
        field_a: 'A must be even',
      });
      expect(handleValidation({ field_a: 4, field_b: 2 }).formErrors).toEqual(undefined);
    });

    it('2 seperate fields with rules failing', () => {
      const { handleValidation } = createHeadlessForm(schemaWithTwoRules, {
        strictInputType: false,
      });
      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual({
        field_a: 'A must be bigger than B',
        field_b: 'B must be even',
      });
      expect(handleValidation({ field_a: 4, field_b: 2 }).formErrors).toEqual(undefined);
    });
  });

  describe('Derive values', () => {
    it('field_b is field_a * 2', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaWithComputedAttributes, {
        strictInputType: false,
        initialValues: { field_a: 2 },
      });
      const fieldB = fields.find((i) => i.name === 'field_b');
      expect(fieldB.description).toEqual(
        'This field is 2 times bigger than field_a with value of 4.'
      );
      expect(fieldB.default).toEqual(4);
      expect(fieldB.forcedValue).toEqual(4);
      handleValidation({ field_a: 4 });
      expect(fieldB.default).toEqual(8);
      expect(fieldB.label).toEqual('This is 8!');
    });

    it('A forced value will not be set when const and default are not equal', () => {
      const { fields } = createHeadlessForm(badSchemaThatWillNotSetAForcedValue, {
        strictInputType: false,
        initialValues: { field_a: 2 },
      });
      expect(fields[1]).toMatchObject({ const: 6, default: 4 });
      expect(fields[1]).not.toMatchObject({ forcedValue: expect.any(Number) });
    });

    it('Derived errorMessages and statements work', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithComputedAttributesAndErrorMessages,
        { strictInputType: false }
      );
      const fieldB = fields.find((i) => i.name === 'field_b');
      expect(handleValidation({ field_a: 2, field_b: 0 }).formErrors).toEqual({
        field_b: 'Must be bigger than 4',
      });
      expect(handleValidation({ field_a: 2, field_b: 100 }).formErrors).toEqual({
        field_b: 'Must be smaller than 8',
      });
      expect(fieldB.minimum).toEqual(4);
      expect(fieldB.maximum).toEqual(8);
      expect(fieldB.statement).toEqual({ description: 'Must be bigger than 4 and smaller than 8' });
    });

    it('Use a inline-rule in a schema for a title attribute', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithInlineRuleForComputedAttributeWithCopy,
        {
          strictInputType: false,
        }
      );
      const [, fieldB] = fields;
      expect(handleValidation({ field_a: 0, field_b: null }).formErrors).toEqual(undefined);
      expect(fieldB.label).toEqual('I need this to work using the 10.');
      expect(handleValidation({ field_a: 10 }).formErrors).toEqual(undefined);
      expect(fieldB.label).toEqual('I need this to work using the 20.');
    });

    it('Use multiple inline rules with different identifiers', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithInlineMultipleRulesForComputedAttributes,
        {
          strictInputType: false,
        }
      );
      const [, fieldB] = fields;
      expect(handleValidation({ field_a: 10, field_b: null }).formErrors).toEqual(undefined);
      expect(fieldB.description).toEqual('Must be between 5 and 20.');
    });

    it('Use an inline rule in a schema for a title but it just uses the value', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaInlineComputedAttrForTitle, {
        strictInputType: false,
      });
      const [, fieldB] = fields;
      expect(handleValidation({ field_a: 10, field_b: null }).formErrors).toEqual(undefined);
      expect(fieldB.label).toEqual('20');
    });

    it('Use an inline rule for a minimum, maximum value', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaInlineComputedAttrForMaximumMinimumValues,
        {
          strictInputType: false,
        }
      );
      const [, fieldB] = fields;

      // FIXME: We are currently setting NaN here because of how the data clean up works for json-logic
      // We should probably set this as undefined when theres no values set?
      // tracked in INF-53.
      expect(fieldB).toMatchObject({ minimum: NaN, maximum: NaN });
      expect(handleValidation({ field_a: 10, field_b: null }).formErrors).toBeUndefined();
      expect(fieldB).toMatchObject({ minimum: 0, maximum: 20 });
      expect(handleValidation({ field_a: 50, field_b: 20 }).formErrors).toEqual({
        field_b: 'Must be greater or equal to 40',
      });
      expect(fieldB).toMatchObject({ minimum: 40, maximum: 60 });
      expect(handleValidation({ field_a: 50, field_b: 70 }).formErrors).toEqual({
        field_b: 'Must be smaller or equal to 60',
      });
      expect(fieldB).toMatchObject({ minimum: 40, maximum: 60 });
      expect(handleValidation({ field_a: 50, field_b: 50 }).formErrors).toBeUndefined();
      expect(fieldB).toMatchObject({ minimum: 40, maximum: 60 });
    });

    it('Mix use of multiple inline rules and an external rule', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaWithJSFLogicAndInlineRule, {
        strictInputType: false,
      });
      handleValidation({ field_a: 10 });
      const [, fieldB] = fields;
      expect(fieldB.label).toEqual('Going to use 20 and 4');
    });
  });

  describe('Conditionals', () => {
    it('when field_a > field_b, show field_c', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithGreaterThanChecksForThreeFields,
        { strictInputType: false }
      );
      const fieldC = fields.find((i) => i.name === 'field_c');
      expect(fieldC.isVisible).toEqual(false);

      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 1 }).formErrors).toEqual({
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: 1, field_b: undefined }).formErrors).toEqual({
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 3 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(fieldC.isVisible).toEqual(true);
      expect(handleValidation({ field_a: 10, field_b: 3, field_c: 0 }).formErrors).toEqual(
        undefined
      );
    });

    it('A schema with both a `x-jsf-validations` and `properties` check', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithPropertiesCheckAndValidationsInAIf,
        { strictInputType: false }
      );
      const fieldC = fields.find((i) => i.name === 'field_c');
      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual(undefined);
      expect(fieldC.isVisible).toEqual(false);
      expect(handleValidation({ field_a: 10, field_b: 3 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(fieldC.isVisible).toEqual(true);
      expect(handleValidation({ field_a: 5, field_b: 3 }).formErrors).toEqual(undefined);
    });

    it('Conditionally apply a validation on a property depending on values', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithChecksAndThenValidationsOnThen,
        { strictInputType: false }
      );
      const cField = fields.find((i) => i.name === 'field_c');
      expect(cField.isVisible).toEqual(false);
      expect(cField.description).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 5 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 5, field_c: 0 }).formErrors).toEqual({
        field_c: 'Needs more numbers',
      });
      expect(cField.description).toBe('I am a description!');
      expect(handleValidation({ field_a: 10, field_b: 5, field_c: 201 }).formErrors).toEqual(
        undefined
      );
      expect(handleValidation({ field_a: 5, field_b: 10 }).formErrors).toBeUndefined();
      expect(cField).toMatchObject({
        isVisible: false,
        // description: null, the description will currently be `I am a description!`, how do we change it back to null from here? Needs to be fixed by RMT-58
      });
    });

    it('Should apply a conditional based on a true computedValue', () => {
      const { fields, handleValidation } = createHeadlessForm(schemaWithComputedValueChecksInIf, {
        strictInputType: false,
      });
      const cField = fields.find((i) => i.name === 'field_c');
      expect(cField.isVisible).toEqual(false);
      expect(cField.description).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 5 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 5, field_c: 201 }).formErrors).toEqual(
        undefined
      );
    });

    it('Handle multiple computedValue checks by ANDing them together', () => {
      const { handleValidation } = createHeadlessForm(schemaWithMultipleComputedValueChecks, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({
        field_a: 'Required field',
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 8 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 8, field_c: 0 }).formErrors).toEqual({
        field_c: 'Must be two times B',
      });
      expect(handleValidation({ field_a: 10, field_b: 8, field_c: 17 }).formErrors).toEqual(
        undefined
      );
    });

    it('Handle having a true condition with both validations and computedValue checks', () => {
      const { handleValidation } = createHeadlessForm(
        schemaWithIfStatementWithComputedValuesAndValidationChecks,
        { strictInputType: false }
      );
      expect(handleValidation({ field_a: 1, field_b: 1 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 20 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 9 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 9, field_c: 10 }).formErrors).toEqual(
        undefined
      );
    });

    it('Apply validations and computed values on normal if statement.', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWhereValidationAndComputedValueIsAppliedOnNormalThenStatement,
        { strictInputType: false }
      );
      expect(handleValidation({ field_a: 0, field_b: 0 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 20, field_b: 0 }).formErrors).toEqual({
        field_b: 'Must be greater than Field A + 10',
      });
      const [, fieldB] = fields;
      expect(fieldB.label).toEqual('Must be greater than 30.');
      expect(handleValidation({ field_a: 20, field_b: 31 }).formErrors).toEqual(undefined);
    });

    it('When we have a required validation on a top level property and another validation is added, both should be accounted for.', () => {
      const { handleValidation } = createHeadlessForm(
        schemaWithTwoValidationsWhereOneOfThemIsAppliedConditionally,
        { strictInputType: false }
      );
      expect(handleValidation({ field_a: 10, field_b: 0 }).formErrors).toEqual({
        field_b: 'Must be greater than A',
      });
      expect(handleValidation({ field_a: 10, field_b: 20 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 20, field_b: 10 }).formErrors).toEqual({
        field_b: 'Must be greater than A',
      });
      expect(handleValidation({ field_a: 20, field_b: 21 }).formErrors).toEqual({
        field_b: 'Must be greater than two times A',
      });
      expect(handleValidation({ field_a: 20, field_b: 41 }).formErrors).toEqual();
    });
  });
});
