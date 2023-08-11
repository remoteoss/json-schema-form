import { createHeadlessForm } from '../createHeadlessForm';

import {
  aConditionallyAppliedComputedAttributeMinimum,
  aConditionallyAppliedComputedAttributeValue,
  createSchemaWithRulesOnFieldA,
  createSchemaWithThreePropertiesWithRuleOnFieldA,
  fieldsetWithAConditionalToApplyExtraValidations,
  fieldsetWithComputedAttributes,
  ifConditionWithMissingComputedValue,
  ifConditionWithMissingValidation,
  multiRuleSchema,
  nestedFieldsetWithValidationSchema,
  schemaWhereValidationAndComputedValueIsAppliedOnNormalThenStatement,
  schemaWithChecksAndThenValidationsOnThen,
  schemaWithComputedAttributeThatDoesntExist,
  schemaWithComputedAttributeThatDoesntExistDescription,
  schemaWithComputedAttributeThatDoesntExistTitle,
  schemaWithComputedAttributes,
  schemaWithComputedValueChecksInIf,
  schemaWithDeepVarThatDoesNotExist,
  schemaWithDeepVarThatDoesNotExistOnFieldset,
  schemaWithGreaterThanChecksForThreeFields,
  schemaWithIfStatementWithComputedValuesAndValidationChecks,
  schemaWithInlineMultipleRulesForComputedAttributes,
  schemaWithInlineRuleForComputedAttributeWithCopy,
  schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar,
  schemaWithMissingRule,
  schemaWithMultipleComputedValueChecks,
  schemaWithNativeAndJSONLogicChecks,
  schemaWithNonRequiredField,
  schemaWithPropertiesCheckAndValidationsInAIf,
  schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset,
  schemaWithTwoRules,
  schemaWithValidationThatDoesNotExistOnProperty,
  schemaWithVarThatDoesNotExist,
  simpleArrayValidationSchema,
  twoLevelsOfJSONLogicSchema,
  validatingASingleItemInTheArray,
  validatingTwoNestedFieldsSchema,
} from './jsonLogicFixtures';

describe('cross-value validations', () => {
  describe('Does not conflict with native JSON schema', () => {
    it('When a field is not required, validations should not block submitting when its an empty value', () => {
      const { handleValidation } = createHeadlessForm(schemaWithNonRequiredField, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 0 }).formErrors).toEqual({
        field_a: 'Must be greater than 10',
      });
      expect(handleValidation({ field_a: 'incorrect value' }).formErrors).toEqual({
        field_a: 'The value must be a number',
      });
      expect(handleValidation({ field_a: 11 }).formErrors).toEqual(undefined);
    });

    it('Native validations always appear first', () => {
      const { handleValidation } = createHeadlessForm(schemaWithNativeAndJSONLogicChecks, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({ field_a: 'Required field' });
      expect(handleValidation({ field_a: 0 }).formErrors).toEqual({
        field_a: 'Must be greater or equal to 5',
      });
      expect(handleValidation({ field_a: 5 }).formErrors).toEqual({
        field_a: 'Must be greater than 10',
      });
    });
  });

  describe('Incorrectly written schemas', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    it('Should throw when theres a missing rule', () => {
      createHeadlessForm(schemaWithMissingRule, { strictInputType: false });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('Missing rule for validation with id of: "a_greater_than_ten".')
      );
    });

    it('Should throw when a var does not exist in a rule.', () => {
      createHeadlessForm(schemaWithVarThatDoesNotExist, { strictInputType: false });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('"field_b" in rule "a_greater_than_ten" does not exist as a JSON schema property.')
      );
    });

    it('Should throw when a var does not exist in a deeply nested rule', () => {
      createHeadlessForm(schemaWithDeepVarThatDoesNotExist, { strictInputType: false });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('"field_b" in rule "a_greater_than_ten" does not exist as a JSON schema property.')
      );
    });

    it('Should throw when a var does not exist in a fieldset.', () => {
      createHeadlessForm(schemaWithDeepVarThatDoesNotExistOnFieldset, { strictInputType: false });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('"field_a" in rule "a_greater_than_ten" does not exist as a JSON schema property.')
      );
    });

    it('On a property, it should throw an error for a requiredValidation that does not exist', () => {
      createHeadlessForm(schemaWithValidationThatDoesNotExistOnProperty, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`Validation "iDontExist" required for "field_a" doesn't exist.`)
      );
    });

    it('A top level logic keyword will not be able to reference fieldset properties', () => {
      createHeadlessForm(schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('"child" in rule "validation_parent" does not exist as a JSON schema property.')
      );
    });

    it('On x-jsf-logic-computedAttrs, error if theres a value that does not exist.', () => {
      createHeadlessForm(schemaWithComputedAttributeThatDoesntExist, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`"iDontExist" computedValue in field "field_a" doesn't exist.`)
      );
    });

    it('On x-jsf-logic-computedAttrs, error if theres a value that does not exist on a title.', () => {
      createHeadlessForm(schemaWithComputedAttributeThatDoesntExistTitle, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`"iDontExist" computedValue in field "field_a" doesn't exist.`)
      );
    });

    it('On x-jsf-logic-computedAttrs, error if theres a value that does not exist on a description.', () => {
      createHeadlessForm(schemaWithComputedAttributeThatDoesntExistDescription, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`"iDontExist" computedValue in field "field_a" doesn't exist.`)
      );
    });

    it('Error for a missing computed value in an if', () => {
      createHeadlessForm(ifConditionWithMissingComputedValue, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`"iDontExist" computedValue in if condition doesn't exist.`)
      );
    });

    it('Error for a missing validation in an if', () => {
      createHeadlessForm(ifConditionWithMissingValidation, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(`"iDontExist" validation in if condition doesn't exist.`)
      );
    });

    it('On an inline rule for a computedAttribute, error if theres a value referenced that does not exist', () => {
      createHeadlessForm(schemaWithInlinedRuleOnComputedAttributeThatReferencesUnknownVar, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error(
          '"IdontExist" in inline rule in property "field_a.x-jsf-logic-computedAttrs.title" does not exist as a JSON schema property.'
        )
      );
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
      const { formErrors } = handleValidation({ field_a: 2, field_b: 4 });
      expect(formErrors.field_a).toEqual('Field A must be greater than field_b / 2');
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

  describe('Conditionals', () => {
    it('when field_a > field_b, show field_c', () => {
      const { fields, handleValidation } = createHeadlessForm(
        schemaWithGreaterThanChecksForThreeFields,
        { strictInputType: false }
      );
      expect(fields.find((i) => i.name === 'field_c').isVisible).toEqual(false);

      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 1, field_b: null }).formErrors).toEqual({
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 3 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 10, field_b: 3, field_c: 0 }).formErrors).toEqual(
        undefined
      );
    });

    it('A schema with both a `x-jsf-validations` and `properties` check', () => {
      const { handleValidation } = createHeadlessForm(
        schemaWithPropertiesCheckAndValidationsInAIf,
        { strictInputType: false }
      );
      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 3 }).formErrors).toEqual({
        field_c: 'Required field',
      });
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

    it.todo(
      'When we have a required validation on a top level property and another validation is added, both should be accounted for.'
    );
  });

  describe('Multiple validations', () => {
    it('2 rules where A must be bigger than B and not an even number in another rule', () => {
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
      const { fields } = createHeadlessForm(schemaWithComputedAttributes, {
        strictInputType: false,
        initialValues: { field_a: 2 },
      });
      const fieldB = fields.find((i) => i.name === 'field_b');
      expect(fieldB.description).toEqual(
        'This field is 2 times bigger than field_a with value of 4.'
      );
      expect(fieldB.default).toEqual(4);
      expect(fieldB.value).toEqual(4);
      expect(fieldB.label).toEqual('This is 4!');
    });

    it('computedAttribute test that minimum, errorMessages.minimum is working', () => {
      const { handleValidation } = createHeadlessForm(
        aConditionallyAppliedComputedAttributeMinimum,
        {
          strictInputType: false,
        }
      );
      expect(handleValidation({ field_a: 20, field_b: 1 }).formErrors).toEqual({
        field_b: 'use 10 or more',
      });
    });

    it.todo('computedAttribute test that maximum, errorMessages.maximum is working');

    it('Apply a conditional computed Attrbute value', () => {
      const { fields, handleValidation } = createHeadlessForm(
        aConditionallyAppliedComputedAttributeValue,
        {
          strictInputType: false,
        }
      );

      expect(handleValidation({ field_a: 20, field_b: 1 }).formErrors).toEqual({
        field_b: 'The only accepted value is 10.',
      });

      const [, fieldB] = fields;
      expect(fieldB.value).toEqual(10);
      expect(handleValidation({ field_a: 10, field_b: 1 }).formErrors).toEqual();
      expect(fieldB.value).toEqual(undefined);
    });

    it('Use a self contained rule in a schema for a title attribute', () => {
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

    it.todo('Use a self contained rule in a schema for a title but it just uses the value');
    it.todo('Use a self contained rule for a minimum value');
    it.todo('Use a self contained rule for a conditionally applied schema');
    it.todo('Throw if you have multiple inline rules with no template string.');
    it.todo('Mix use of multiple inline rules and an external rule');
  });

  describe('Nested fieldsets', () => {
    it('Basic nested validation works', () => {
      const { handleValidation } = createHeadlessForm(nestedFieldsetWithValidationSchema, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({ field_a: { child: 'Required field' } });
      expect(handleValidation({ field_a: { child: 0 } }).formErrors).toEqual({
        field_a: { child: 'Must be greater than 10!' },
      });
      expect(handleValidation({ field_a: { child: 11 } }).formErrors).toEqual(undefined);
    });

    it('Validating two nested fields together', () => {
      const { handleValidation } = createHeadlessForm(validatingTwoNestedFieldsSchema, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({
        field_a: { child: 'Required field', other_child: 'Required field' },
      });
      expect(handleValidation({ field_a: { child: 0, other_child: 0 } }).formErrors).toEqual({
        field_a: { child: 'Must be greater than 10!', other_child: 'Must be greater than child' },
      });
      expect(handleValidation({ field_a: { child: 11, other_child: 12 } }).formErrors).toEqual(
        undefined
      );
    });

    it('Validate a field and a nested field together', () => {
      const { handleValidation } = createHeadlessForm(twoLevelsOfJSONLogicSchema, {
        strictInputType: false,
      });
      expect(handleValidation({}).formErrors).toEqual({
        field_a: { child: 'Required field' },
        field_b: 'Required field',
      });
      expect(handleValidation({ field_a: { child: 0 }, field_b: 0 }).formErrors).toEqual({
        field_a: { child: 'Must be greater than 10!' },
        field_b: 'Must be greater than 10!',
      });
      expect(handleValidation({ field_a: { child: 11 }, field_b: 11 }).formErrors).toEqual({
        field_b: 'child must be greater than 15!',
      });
      expect(handleValidation({ field_a: { child: 16 }, field_b: 11 }).formErrors).toEqual(
        undefined
      );
    });

    it('compute a nested field attribute', () => {
      const { fields, handleValidation } = createHeadlessForm(fieldsetWithComputedAttributes, {
        strictInputType: false,
      });
      const [fieldA] = fields;
      const [, computedField] = fieldA.fields;
      expect(handleValidation({}).formErrors).toEqual({
        field_a: { child: 'Required field' },
      });
      expect(computedField.value).toEqual(NaN);

      expect(handleValidation({ field_a: { child: 10 } }).formErrors).toEqual(undefined);
      expect(computedField.value).toEqual(100);
      expect(computedField.description).toEqual('this is 100');

      expect(handleValidation({ field_a: { child: 11 } }).formErrors).toEqual(undefined);
      expect(computedField.value).toEqual(110);
      expect(computedField.description).toEqual('this is 110');
    });

    it('Apply a conditional value in a nested field with a conditional extra validation.', () => {
      const { fields, handleValidation } = createHeadlessForm(
        fieldsetWithAConditionalToApplyExtraValidations,
        {
          strictInputType: false,
        }
      );
      const [fieldA] = fields;
      const [, , thirdChild] = fieldA.fields;
      expect(thirdChild.isVisible).toEqual(false);
      expect(thirdChild.required).toEqual(false);

      expect(handleValidation({ field_a: {} }).formErrors).toEqual({
        field_a: { child: 'Required field', other_child: 'Required field' },
      });
      expect(handleValidation({ field_a: { child: 0, other_child: 0 } }).formErrors).toEqual(
        undefined
      );
      expect(handleValidation({ field_a: { child: 10, other_child: 0 } }).formErrors).toEqual(
        undefined
      );
      expect(handleValidation({ field_a: { child: 10, other_child: 20 } }).formErrors).toEqual({
        field_a: { third_child: 'Required field' },
      });
      expect(thirdChild.isVisible).toEqual(true);
      expect(thirdChild.required).toEqual(true);

      expect(
        handleValidation({ field_a: { child: 10, other_child: 20, third_child: 10 } }).formErrors
      ).toEqual({
        field_a: { third_child: 'Must be greater than other child.' },
      });

      expect(
        handleValidation({ field_a: { child: 10, other_child: 20, third_child: 30 } }).formErrors
      ).toEqual(undefined);
    });
  });

  describe('Array validation', () => {
    it('Should apply the json logic on an individual array item', () => {
      const { handleValidation } = createHeadlessForm(simpleArrayValidationSchema, {
        strictInputType: false,
      });
      expect(handleValidation({ field_array: [] }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_array: [{}] }).formErrors).toEqual({
        field_array: [{ array_item: 'Required field' }],
      });
      expect(handleValidation({ field_array: [{ array_item: 1 }] }).formErrors).toEqual({
        field_array: [{ array_item: 'Must be divisible by two' }],
      });
      expect(handleValidation({ field_array: [{ array_item: 2 }] }).formErrors).toEqual(undefined);
      expect(
        handleValidation({ field_array: [{ array_item: 2 }, { array_item: 1 }] }).formErrors
      ).toEqual({
        field_array: [undefined, { array_item: 'Must be divisible by two' }],
      });
      expect(
        handleValidation({ field_array: [{ array_item: 2 }, { array_item: 2 }] }).formErrors
      ).toEqual(undefined);
    });

    it('Validating a single item in an array should work', () => {
      const { handleValidation } = createHeadlessForm(validatingASingleItemInTheArray, {
        strictInputType: false,
      });
      expect(handleValidation({ field_array: [] }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_array: [{ item: 0 }] }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_array: [{ item: 0 }, { item: 3 }] }).formErrors).toEqual({
        field_array: 'Second item in array must be divisible by 4',
      });
    });

    // FIXME: This doesn't work because conditionals in items are not supported.
    it.todo('Should be able to use conditionals in items');
  });
});
