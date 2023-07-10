import { createHeadlessForm } from '../createHeadlessForm';

import {
  createSchemaWithRulesOnFieldA,
  createSchemaWithThreePropertiesWithRuleOnFieldA,
  multiRuleSchema,
  nestedFieldsetWithValidationSchema,
  schemaWithChecksAndThenValidationsOnThen,
  schemaWithComputedAttributes,
  schemaWithComputedValueChecksInIf,
  schemaWithDeepVarThatDoesNotExist,
  schemaWithDeepVarThatDoesNotExistOnFieldset,
  schemaWithGreaterThanChecksForThreeFields,
  schemaWithIfStatementWithComputedValuesAndValidationChecks,
  schemaWithMissingRule,
  schemaWithMultipleComputedValueChecks,
  schemaWithNativeAndJSONLogicChecks,
  schemaWithNonRequiredField,
  schemaWithPropertiesCheckAndValidationsInAIf,
  schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset,
  schemaWithTwoRules,
  schemaWithVarThatDoesNotExist,
  twoLevelsOfJSONLogicSchema,
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

  describe('Badly written schemas', () => {
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

    it.todo('On a property, it should throw an error for a requiredValidation that does not exist');

    it('A top level logic keyword will not be able to reference fieldset properties', () => {
      createHeadlessForm(schemaWithPropertyThatDoesNotExistInThatLevelButDoesInFieldset, {
        strictInputType: false,
      });
      expect(console.error).toHaveBeenCalledWith(
        'JSON Schema invalid!',
        Error('"child" in rule "validation_parent" does not exist as a JSON schema property.')
      );
    });

    it.todo('Should throw when a var does not exist in an array.');
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
      expect(fieldB.value).toEqual(4);
      expect(fieldB.label).toEqual('This is 4!');
    });
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

    it.todo('compute a nested field attribute');
  });

  describe('Arrays', () => {
    it.todo('How will this even work?');
    it.todo('What do I need to do when i need to validate all items');
    it.todo('What do i need to do when i need to validate a specific array item');
  });
});
