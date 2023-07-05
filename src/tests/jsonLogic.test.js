import { createHeadlessForm } from '../createHeadlessForm';

function createSchemaWithRulesOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-validations': rules,
      },
      field_b: {
        type: 'number',
      },
    },
    required: ['field_a', 'field_b'],
  };
}

function createSchemaWithThreePropertiesWithRuleOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-validations': rules,
      },
      field_b: {
        type: 'number',
      },
      field_c: {
        type: 'number',
      },
    },
    required: ['field_a', 'field_b', 'field_c'],
  };
}

describe('cross-value validations', () => {
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
    const schema = {
      properties: {
        field_a: {
          type: 'number',
        },
        field_b: {
          type: 'number',
        },
        field_c: {
          type: 'number',
        },
      },
      required: ['field_a', 'field_b'],
      allOf: [
        {
          if: {
            'x-jsf-validations': {
              require_c: {
                const: true,
              },
            },
          },
          then: {
            required: ['field_c'],
          },
          else: {
            properties: {
              field_c: false,
            },
          },
        },
      ],
      'x-jsf-validations': {
        require_c: {
          rule: {
            and: [
              { '!==': [{ var: 'field_b' }, null] },
              { '!==': [{ var: 'field_a' }, null] },
              { '>': [{ var: 'field_a' }, { var: 'field_b' }] },
            ],
          },
        },
      },
    };

    it('when field_a > field_b, show field_c', () => {
      const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
  });

  describe('Multiple validations', () => {
    it.todo('2 rules where A must be bigger than B and not an even number in another rule');
    it.todo('2 seperate fields with rules failing');
  });

  describe('Derive values', () => {
    it.todo('field_b is field_a * 2');
  });

  describe('Nested fieldsets', () => {
    it.todo('Does everything above work when the field is nested');
    it.todo('Validate a field and a nested field together');
    it.todo('compute a nested field attribute');
  });

  describe('Arrays', () => {
    it.todo('How will this even work?');
    it.todo('What do I need to do when i need to validate all items');
    it.todo('What do i need to do when i need to validate a specific array item');
  });
});
