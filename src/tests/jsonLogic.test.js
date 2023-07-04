import { createHeadlessForm } from '../createHeadlessForm';

const schema = {
  properties: {
    field_a: {
      type: 'number',
      'x-jsf-validations': [
        {
          errorMessage: 'Field A must be bigger than field B',
          rule: { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
        },
      ],
    },
    field_b: {
      type: 'number',
    },
  },
  required: ['field_a', 'field_b'],
};

describe('cross-value validations', () => {
  describe('Relative: <, >, =', () => {
    it('bigger: field_a > field_b', () => {
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      const { formErrors } = handleValidation({ field_a: 1, field_b: 2 });
      expect(formErrors.field_a).toEqual('Field A must be bigger than field B');
    });

    it.todo('smaller: field_a < field_b');
    it.todo('equal: field_a = field_b');
  });

  describe('Arithmetic: +, -, *, /', () => {
    it.todo('multiple: field_a > field_b * 2'); // eg bonus is at least the double of salary
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
});
