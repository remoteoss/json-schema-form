import { createHeadlessForm } from '../createHeadlessForm';

function createSchemaWithRulesOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-requiredValidations': Object.keys(rules),
      },
      field_b: {
        type: 'number',
      },
    },
    required: ['field_a', 'field_b'],
    'x-jsf-logic': { validations: rules },
  };
}

function createSchemaWithThreePropertiesWithRuleOnFieldA(rules) {
  return {
    properties: {
      field_a: {
        type: 'number',
        'x-jsf-requiredValidations': Object.keys(rules),
      },
      field_b: {
        type: 'number',
      },
      field_c: {
        type: 'number',
      },
    },
    'x-jsf-logic': { validations: rules },
    required: ['field_a', 'field_b', 'field_c'],
  };
}

describe('cross-value validations', () => {
  describe('Does not conflict with native JSON schema', () => {
    it.todo('When a field is not required, validations should not block submitting');
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
        'x-jsf-logic': {
          validations: {
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
          allOf: [
            {
              if: {
                validations: {
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
        },
      };

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

    it('A schema with both a `x-jsf-validations` and `properties` check', () => {
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
              properties: {
                field_a: {
                  const: 10,
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
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual(undefined);
      expect(handleValidation({ field_a: 10, field_b: 3 }).formErrors).toEqual({
        field_c: 'Required field',
      });
      expect(handleValidation({ field_a: 5, field_b: 3 }).formErrors).toEqual(undefined);
    });

    it('Conditionally apply a validation on a property depending on values', () => {
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
        'x-jsf-logic': {
          validations: {
            c_must_be_large: {
              errorMessage: 'Needs more numbers',
              rule: {
                '>': [{ var: 'field_c' }, 200],
              },
            },
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
          allOf: [
            {
              if: {
                validations: {
                  require_c: {
                    const: true,
                  },
                },
              },
              then: {
                required: ['field_c'],
                properties: {
                  field_c: {
                    description: 'I am a description!',
                    'x-jsf-requiredValidations': ['c_must_be_large'],
                  },
                },
              },
              else: {
                properties: {
                  field_c: false,
                },
              },
            },
          ],
        },
      };
      const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
        'x-jsf-logic': {
          computedValues: {
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
          allOf: [
            {
              if: {
                computedValues: {
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
        },
      };
      const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
        'x-jsf-logic': {
          validations: {
            double_b: {
              errorMessage: 'Must be two times B',
              rule: {
                '>': [{ var: 'field_c' }, { '*': [{ var: 'field_b' }, 2] }],
              },
            },
          },
          computedValues: {
            a_times_two: {
              rule: {
                '*': [{ var: 'field_a' }, 2],
              },
            },
            mod_by_five: {
              rule: {
                '%': [{ var: 'field_b' }, 5],
              },
            },
          },
          allOf: [
            {
              if: {
                computedValues: {
                  a_times_two: {
                    const: 20,
                  },
                  mod_by_five: {
                    const: 3,
                  },
                },
              },
              then: {
                required: ['field_c'],
                properties: {
                  field_c: {
                    'x-jsf-requiredValidations': ['double_b'],
                    title: 'Adding a title.',
                  },
                },
              },
              else: {
                properties: {
                  field_c: false,
                },
              },
            },
          ],
        },
      };
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
        'x-jsf-logic': {
          validations: {
            greater_than_b: {
              rule: {
                '>': [{ var: 'field_a' }, { var: 'field_b' }],
              },
            },
          },
          computedValues: {
            a_times_two: {
              rule: {
                '*': [{ var: 'field_a' }, 2],
              },
            },
          },
          allOf: [
            {
              if: {
                computedValues: {
                  a_times_two: {
                    const: 20,
                  },
                },
                validations: {
                  greater_than_b: {
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
        },
      };
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
      const schema = {
        properties: {
          field_a: {
            type: 'number',
            'x-jsf-requiredValidations': ['a_bigger_than_b', 'is_even_number'],
          },
          field_b: {
            type: 'number',
          },
        },
        required: ['field_a', 'field_b'],
        'x-jsf-logic': {
          validations: {
            a_bigger_than_b: {
              errorMessage: 'A must be bigger than B',
              rule: {
                '>': [{ var: 'field_a' }, { var: 'field_b' }],
              },
            },
            is_even_number: {
              errorMessage: 'A must be even',
              rule: {
                '===': [{ '%': [{ var: 'field_a' }, 2] }, 0],
              },
            },
          },
        },
      };

      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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
      const schema = {
        properties: {
          field_a: {
            type: 'number',
            'x-jsf-requiredValidations': ['a_bigger_than_b'],
          },
          field_b: {
            type: 'number',
            'x-jsf-requiredValidations': ['is_even_number'],
          },
        },
        required: ['field_a', 'field_b'],
        'x-jsf-logic': {
          validations: {
            a_bigger_than_b: {
              errorMessage: 'A must be bigger than B',
              rule: {
                '>': [{ var: 'field_a' }, { var: 'field_b' }],
              },
            },
            is_even_number: {
              errorMessage: 'B must be even',
              rule: {
                '===': [{ '%': [{ var: 'field_b' }, 2] }, 0],
              },
            },
          },
        },
      };

      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      expect(handleValidation({ field_a: 1, field_b: 3 }).formErrors).toEqual({
        field_a: 'A must be bigger than B',
        field_b: 'B must be even',
      });
      expect(handleValidation({ field_a: 4, field_b: 2 }).formErrors).toEqual(undefined);
    });
  });

  describe('Derive values', () => {
    it('field_b is field_a * 2', () => {
      const schema = {
        properties: {
          field_a: {
            type: 'number',
          },
          field_b: {
            type: 'number',
            'x-jsf-computedAttributes': {
              title: 'This is {{a_times_two}}!',
              value: 'a_times_two',
              description:
                'This field is 2 times bigger than field_a with value of {{a_times_two}}.',
            },
          },
        },
        required: ['field_a', 'field_b'],
        'x-jsf-logic': {
          computedValues: {
            a_times_two: {
              rule: {
                '*': [{ var: 'field_a' }, 2],
              },
            },
          },
        },
      };
      const { fields } = createHeadlessForm(schema, {
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
      const schema = {
        properties: {
          field_a: {
            type: 'object',
            'x-jsf-presentation': {
              inputType: 'fieldset',
            },
            properties: {
              child: {
                type: 'number',
                'x-jsf-requiredValidations': ['child_greater_than_10'],
              },
            },
            required: ['child'],
            'x-jsf-logic': {
              validations: {
                child_greater_than_10: {
                  errorMessage: 'Must be greater than 10!',
                  rule: {
                    '>': [{ var: 'child' }, 10],
                  },
                },
              },
            },
          },
        },
        required: ['field_a'],
      };
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
      expect(handleValidation({}).formErrors).toEqual({ field_a: { child: 'Required field' } });
      expect(handleValidation({ field_a: { child: 0 } }).formErrors).toEqual({
        field_a: { child: 'Must be greater than 10!' },
      });
      expect(handleValidation({ field_a: { child: 11 } }).formErrors).toEqual(undefined);
    });

    it('Validating two nested fields together', () => {
      const schema = {
        properties: {
          field_a: {
            type: 'object',
            'x-jsf-presentation': {
              inputType: 'fieldset',
            },
            properties: {
              child: {
                type: 'number',
                'x-jsf-requiredValidations': ['child_greater_than_10'],
              },
              other_child: {
                type: 'number',
                'x-jsf-requiredValidations': ['greater_than_child'],
              },
            },
            required: ['child', 'other_child'],
            'x-jsf-logic': {
              validations: {
                child_greater_than_10: {
                  errorMessage: 'Must be greater than 10!',
                  rule: {
                    '>': [{ var: 'child' }, 10],
                  },
                },
                greater_than_child: {
                  errorMessage: 'Must be greater than child',
                  rule: {
                    '>': [{ var: 'other_child' }, { var: 'child' }],
                  },
                },
              },
            },
          },
        },
        required: ['field_a'],
      };
      const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
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

    it.todo('Validate a field and a nested field together');
    it.todo('compute a nested field attribute');
  });

  describe('Arrays', () => {
    it.todo('How will this even work?');
    it.todo('What do I need to do when i need to validate all items');
    it.todo('What do i need to do when i need to validate a specific array item');
  });
});
