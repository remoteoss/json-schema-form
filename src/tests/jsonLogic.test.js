import { createHeadlessForm } from '../createHeadlessForm';

function createSchemaWithRuleOnFieldA(rule) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-validations': [rule],
      },
      field_b: {
        type: 'number',
      },
    },
    required: ['field_a', 'field_b'],
  };
}

describe('cross-value validations', () => {
  describe('Relative: <, >, =', () => {
    it('bigger: field_a > field_b', () => {
      const { handleValidation } = createHeadlessForm(
        createSchemaWithRuleOnFieldA({
          errorMessage: 'Field A must be bigger than field B',
          rule: { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
        }),
        { strictInputType: false }
      );
      const { formErrors } = handleValidation({ field_a: 1, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must be bigger than field B');
      expect(handleValidation({ field_a: 2, field_b: 0 }).formErrors).toEqual(undefined);
    });

    it('smaller: field_a < field_b', () => {
      const { handleValidation } = createHeadlessForm(
        createSchemaWithRuleOnFieldA({
          errorMessage: 'Field A must be smaller than field B',
          rule: { '<': [{ var: 'field_a' }, { var: 'field_b' }] },
        }),
        { strictInputType: false }
      );
      const { formErrors } = handleValidation({ field_a: 2, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must be smaller than field B');
      expect(handleValidation({ field_a: 0, field_b: 2 }).formErrors).toEqual(undefined);
    });

    it('equal: field_a = field_b', () => {
      const { handleValidation } = createHeadlessForm(
        createSchemaWithRuleOnFieldA({
          errorMessage: 'Field A must equal field B',
          rule: { '==': [{ var: 'field_a' }, { var: 'field_b' }] },
        }),
        { strictInputType: false }
      );
      const { formErrors } = handleValidation({ field_a: 3, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must equal field B');
      expect(handleValidation({ field_a: 2, field_b: 2 }).formErrors).toEqual(undefined);
    });
  });

  describe('Arithmetic: +, -, *, /', () => {
    it.todo('multiple: field_a > field_b * 2');
    it.todo('divide: field_a > field_b / 2');
    it.todo('sum: field_a > field_b + field_c'); // eg salary is bigger than X and Y together.
  });

  describe('Logical: ||, &&', () => {
    it.todo('AND: field_a > (field_b AND field_c)');
    it.todo('OR: field_a > (field_b OR field_c)');
  });

  describe('Conditionals', () => {
    it.todo('when field_a > field_b, show field_c');
  });

  describe('Multiple validations', () => {
    it.todo('2 rules where A must be bigger than B and not an even number in another rule');
    it.todo('2 seperate fields with rules failing');
  });

  describe('Derive values', () => {
    it.todo('field_b is field_a * 2');
  });
});
