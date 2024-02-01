import merge from 'lodash/fp/merge';

import { createHeadlessForm } from '../createHeadlessForm';

import { JSONSchemaBuilder, mockFieldset, mockRadioInput } from './helpers';
import { mockMoneyInput } from './helpers.custom';

function friendlyError({ formErrors }) {
  // destruct the formErrors directly
  return formErrors;
}

export const mockNumberInput = {
  title: 'Tabs',
  description: 'How many open tabs do you have?',
  'x-jsf-presentation': {
    inputType: 'number',
  },
  minimum: 5,
  maximum: 30,
  type: 'number',
};

export const mockNumberInputDeprecatedPresentation = {
  title: 'Tabs',
  description: 'How many open tabs do you have?',
  presentation: {
    inputType: 'number',
  },
  minimum: 5,
  maximum: 30,
  type: 'number',
};

const schemaBasic = ({ newProperties, allOf } = {}) =>
  JSONSchemaBuilder()
    .addInput(
      merge(
        {
          parent_age: { ...mockNumberInput, maximum: 100 },
          child_age: mockNumberInput,
        },
        newProperties
      )
    )
    .setRequiredFields(['parent_age'])
    .addAllOf(allOf || [])
    .build();

const schemaWithConditional = ({ newProperties } = {}) =>
  JSONSchemaBuilder()
    .addInput(
      merge(
        {
          is_employee: mockRadioInput,
          salary: { ...mockMoneyInput, minimum: 0 },
          bonus: { ...mockMoneyInput, minimum: 0 },
        },
        newProperties
      )
    )
    .setRequiredFields(['is_employee', 'salary'])
    .addAllOf([
      {
        if: {
          properties: {
            is_employee: {
              const: 'yes',
            },
          },
          required: ['is_employee'],
        },
        then: {
          properties: {
            salary: {
              minimum: 100000, // 1000.00€
            },
          },
          required: ['bonus'],
        },
        else: {
          properties: {
            salary: {
              minimum: 0, // 0.00€
            },
            bonus: false,
          },
        },
      },
    ])
    .build();

function validateFieldParams(fieldParams, newFieldParams) {
  expect(newFieldParams).toHaveProperty('name', fieldParams.name);
  expect(newFieldParams).toHaveProperty('label', fieldParams.title);
  expect(newFieldParams).toHaveProperty('description', fieldParams.description);

  if (fieldParams.minimum) {
    expect(newFieldParams).toHaveProperty('minimum', fieldParams.minimum);
  }
  if (fieldParams.maximum) {
    expect(newFieldParams).toHaveProperty('maximum', fieldParams.maximum);
  }
}

function validateNumberParams(fieldParams, newFieldParams) {
  validateFieldParams(fieldParams, newFieldParams);
  expect(newFieldParams).toHaveProperty('inputType', 'number');
  expect(newFieldParams).toHaveProperty('jsonType', 'number');
}

function validateMoneyParams(fieldParams, newFieldParams) {
  validateFieldParams(fieldParams, newFieldParams);
  expect(newFieldParams).toHaveProperty('inputType', 'money');
  expect(newFieldParams).toHaveProperty('jsonType', 'integer');
}

function createScenario({ schema, config }) {
  const form = createHeadlessForm(schema, config);
  const validateForm = (vals) => friendlyError(form.handleValidation(vals));

  return {
    ...form,
    validateForm,
  };
}

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // safety-check that every mocked validation is within the range
  // eslint-disable-next-line no-console
  expect(console.warn).not.toHaveBeenCalled();
});

afterAll(() => {
  // eslint-disable-next-line no-console
  console.warn.mockRestore();
});

describe('createHeadlessForm() - custom validations', () => {
  describe('simple validation (eg maximum)', () => {
    it('works as a number', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            child_age: {
              maximum: 14,
            },
          },
        },
      });

      validateNumberParams({ ...mockNumberInput, name: 'child_age', maximum: 14 }, fields[1]);

      expect(validateForm({})).toEqual({
        parent_age: 'Required field',
      });

      expect(validateForm({ parent_age: 30, child_age: 15 })).toEqual({
        child_age: 'Must be smaller or equal to 14',
      });

      expect(validateForm({ parent_age: 30, child_age: 10 })).toBeUndefined();
    });

    it('works as a function', () => {
      // Friendly Scenario: child_age must be smaller than parent_age.
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            child_age: {
              maximum: (values, { maximum }) => values.parent_age || maximum,
            },
          },
        },
      });

      validateNumberParams(
        { ...mockNumberInput, name: 'child_age', maximum: undefined },
        fields[1]
      );

      expect(validateForm({})).toEqual({
        parent_age: 'Required field',
      });

      expect(validateForm({ parent_age: 25, child_age: 26 })).toEqual({
        child_age: 'Must be smaller or equal to 25',
      });
      expect(validateForm({ parent_age: 25, child_age: 20 })).toBeUndefined();
    });

    it('works with minimum and maximum together', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            child_age: {
              // dumb example: parents that are less than double the child age,
              // the child must be between 20 and 29yo.
              minimum: (values, { minimum }) =>
                values.parent_age < values.child_age * 3 ? 20 : minimum,
              maximum: (values, { maximum }) =>
                values.parent_age < values.child_age * 3 ? 29 : maximum,
            },
          },
        },
      });

      validateNumberParams(
        { ...mockNumberInput, name: 'child_age', minimum: 5, maximum: 30 },
        fields[1]
      );

      // Test the default validations
      expect(validateForm({ parent_age: 50, child_age: 1 })).toEqual({
        child_age: 'Must be greater or equal to 5',
      });
      expect(validateForm({ parent_age: 100, child_age: 31 })).toEqual({
        child_age: 'Must be smaller or equal to 30',
      });

      // Test the custom validations
      expect(validateForm({ parent_age: 35, child_age: 19 })).toEqual({
        child_age: 'Must be greater or equal to 20',
      });
      expect(validateForm({ parent_age: 40, child_age: 31 })).toEqual({
        child_age: 'Must be smaller or equal to 29',
      });
    });

    it('works with negative values', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic({
          newProperties: {
            parent_age: {
              minimum: -20,
              maximum: -1,
            },
          },
        }),
        config: {
          customProperties: {
            parent_age: {
              minimum: -15,
              maximum: -5,
            },
          },
        },
      });

      validateNumberParams(
        { ...mockNumberInput, name: 'parent_age', minimum: -15, maximum: -5 },
        fields[0]
      );

      expect(validateForm({})).toEqual({
        parent_age: 'Required field',
      });

      expect(validateForm({ parent_age: -20 })).toEqual({
        parent_age: 'Must be greater or equal to -15',
      });

      expect(validateForm({ parent_age: -4 })).toEqual({
        parent_age: 'Must be smaller or equal to -5',
      });

      expect(validateForm({ parent_age: -10 })).toBeUndefined();
    });

    it('keeps original validation, given an empty validation', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            parent_age: {},
          },
        },
      });

      validateNumberParams({ ...mockNumberInput, name: 'parent_age', maximum: 100 }, fields[0]);

      expect(validateForm({})).toEqual({
        parent_age: 'Required field',
      });

      expect(validateForm({ parent_age: 0 })).toEqual({
        parent_age: 'Must be greater or equal to 5',
      });
    });

    it('applies validation, when original does not exist', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic({
          newProperties: {
            parent_age: { minimum: null, maximum: null },
          },
        }),
        config: {
          customProperties: {
            parent_age: {
              minimum: 1,
              maximum: 20,
            },
          },
        },
      });

      validateNumberParams(
        { ...mockNumberInput, minimum: 1, maximum: 20, name: 'parent_age' },
        fields[0]
      );

      expect(validateForm({})).toEqual({
        parent_age: 'Required field',
      });

      expect(validateForm({ parent_age: 0 })).toEqual({
        parent_age: 'Must be greater or equal to 1',
      });

      expect(validateForm({ parent_age: 21 })).toEqual({
        parent_age: 'Must be smaller or equal to 20',
      });
    });
  });

  describe('in fieldsets', () => {
    it('applies custom validation in nested fields', () => {
      const { fields, validateForm } = createScenario({
        schema: JSONSchemaBuilder()
          .addInput({
            animal_age: mockNumberInput,
            second_gen: {
              ...mockFieldset,
              properties: {
                cub_age: mockNumberInput,
                third_gen: {
                  ...mockFieldset,
                  properties: {
                    grandcub_age: mockNumberInput,
                  },
                },
              },
            },
          })
          .build(),
        config: {
          customProperties: {
            animal_age: {
              minimum: 24,
              maximum: 28,
            },
            second_gen: {
              customProperties: {
                cub_age: {
                  minimum: 18,
                  maximum: 21,
                },
                third_gen: {
                  customProperties: {
                    grandcub_age: {
                      minimum: 10,
                      maximum: 15,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const [animalField, secondGenField] = fields;

      // Assert custom validations
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'animal_age',
          minimum: 24,
          maximum: 28,
          required: false,
        },
        animalField
      );
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'cub_age',
          minimum: 18,
          maximum: 21,
          required: false,
        },
        secondGenField.fields[0]
      );
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'grandcub_age',
          minimum: 10,
          maximum: 15,
          required: false,
        },
        secondGenField.fields[1].fields[0]
      );

      // Assert minimum values
      expect(
        validateForm({
          animal_age: 1,
          second_gen: {
            cub_age: 1,
            third_gen: {
              grandcub_age: 1,
            },
          },
        })
      ).toEqual({
        animal_age: 'Must be greater or equal to 24',
        second_gen: {
          cub_age: 'Must be greater or equal to 18',
          third_gen: {
            grandcub_age: 'Must be greater or equal to 10',
          },
        },
      });

      // Assert maximum values
      expect(
        validateForm({
          animal_age: 100,
          second_gen: {
            cub_age: 100,
            third_gen: {
              grandcub_age: 100,
            },
          },
        })
      ).toEqual({
        animal_age: 'Must be smaller or equal to 28',
        second_gen: {
          cub_age: 'Must be smaller or equal to 21',
          third_gen: {
            grandcub_age: 'Must be smaller or equal to 15',
          },
        },
      });
    });
  });

  describe('in conditional fields', () => {
    const { fields, validateForm } = createScenario({
      schema: schemaWithConditional(),
      config: {
        customProperties: {
          bonus: {
            maximum: (values, { maximum }) => ({
              maximum: values.salary ? values.salary * 2 : maximum,
              'x-jsf-errorMessage': {
                maximum: `The bonus cannot be twice of the salary ${values.salary}.`,
              },
            }),
          },
        },
      },
    });

    it('validates conditional visible field', () => {
      // bonus fieldResult
      validateMoneyParams(
        {
          ...mockMoneyInput,
          name: 'bonus',
          minimum: 0,
          maximum: 500000,
          required: false,
        },
        fields[2]
      );

      // Basic path — the custom validation is triggered
      expect(
        validateForm({
          is_employee: 'yes',
          salary: 150000,
          bonus: 310000,
        })
      ).toEqual({ bonus: 'The bonus cannot be twice of the salary 150000.' });

      // The values are valid:
      expect(
        validateForm({
          is_employee: 'yes',
          salary: 150000,
          bonus: 20000,
        })
      ).toBeUndefined();

      expect(validateForm({ is_employee: 'yes', salary: 150000 })).toEqual({
        bonus: 'Required field',
      });
    });

    it('ignores validation to conditional hidden field', () => {
      expect(
        validateForm({
          is_employee: 'no',
          salary: 150000,
          bonus: 310000,
          // NOTE/Unrelated-bug: Should it throw an error saying this
          // "bonus" value is not expected? the native json schema spec throw an error...
        })
      ).toBeUndefined();
    });

    it('given an out-of-range validation, logs warning', () => {
      expect(
        validateForm({
          is_employee: 'yes',
          salary: 300000,
          bonus: 500100,
        })
      ).toEqual({
        bonus: 'No more than €5000.00',
      });

      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        'Custom validation for bonus is not allowed because maximum:600000 is less strict than the original range: 0 to 500000'
      );
      // eslint-disable-next-line no-console
      console.warn.mockClear();
    });
  });

  // TODO: delete after migration to x-jsf-errorMessage is completed
  describe('with errorMessage (deprecated)', () => {
    /* NOTE: We have 3 type of errors:
      - original error: (created by json-schema-form)
      - errorMessage: (declared on JSON Schema)
      - customValidation.errorMessage: (declared on config)
    */
    it('overrides original error conditionally', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            child_age: {
              maximum: (values, { maximum }) => ({
                maximum: values.parent_age || maximum,
                errorMessage: {
                  maximum: `The child cannot be older than the parent of ${values.parent_age} yo.`,
                },
              }),
            },
          },
        },
      });
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'child_age',
          minimum: 5,
          maximum: 30,
        },
        fields[1]
      );

      expect(validateForm({ parent_age: 18, child_age: 4 })).toEqual({
        child_age: 'Must be greater or equal to 5', // applies the original error message
      });
      expect(validateForm({ parent_age: 18, child_age: 19 })).toEqual({
        child_age: 'The child cannot be older than the parent of 18 yo.', // applies the config.errorMessage
      });
    });

    it('overrides errorMessage conditionally', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic({
          newProperties: {
            parent_age: {
              maximum: 100,
            },
            child_age: {
              maximum: 40,
              errorMessage: {
                maximum: 'The child cannot be older than 40yo.',
              },
            },
          },
        }),
        config: {
          customProperties: {
            child_age: {
              minimum: (values, { maximum }) => {
                const minimumAge = values.parent_age / 2;
                if (
                  maximum > minimumAge && // prevent invalid out-of-range maximum
                  values.parent_age > values.child_age * 2 // parent is 2x as big as child age
                ) {
                  return {
                    minimum: minimumAge,
                    errorMessage: {
                      minimum: `The child cannot be younger than half of the parent. Must be at least ${minimumAge}yo.`,
                    },
                  };
                }

                return null;
              },
            },
          },
        },
      });
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'child_age',
          minimum: 5,
          maximum: 40,
        },
        fields[1]
      );

      // applies the errorMessage by default
      expect(validateForm({ parent_age: 50, child_age: 45 })).toEqual({
        child_age: 'The child cannot be older than 40yo.',
      });
      // applies the config.errorMessage if it's triggered
      expect(validateForm({ parent_age: 50, child_age: 10 })).toEqual({
        child_age: `The child cannot be younger than half of the parent. Must be at least 25yo.`,
      });
    });
  });

  describe('with x-jsf-errorMessage', () => {
    /* NOTE: We have 3 type of errors:
      - original error: (created by json-schema-form)
      - x-jsf-errorMessage: (declared on JSON Schema)
      - customValidation['x-jsf-errorMessage']: (declared on options)
    */
    it('overrides original error conditionally', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            child_age: {
              maximum: (values, { maximum }) => ({
                maximum: values.parent_age || maximum,
                'x-jsf-errorMessage': {
                  maximum: `The child cannot be older than the parent of ${values.parent_age} yo.`,
                },
              }),
            },
          },
        },
      });
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'child_age',
          minimum: 5,
          maximum: 30,
        },
        fields[1]
      );

      expect(validateForm({ parent_age: 18, child_age: 4 })).toEqual({
        child_age: 'Must be greater or equal to 5', // applies the original error message
      });
      expect(validateForm({ parent_age: 18, child_age: 19 })).toEqual({
        child_age: 'The child cannot be older than the parent of 18 yo.', // applies the config.errorMessage
      });
    });

    it('overrides errorMessage conditionally', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic({
          newProperties: {
            parent_age: {
              maximum: 100,
            },
            child_age: {
              maximum: 40,
              'x-jsf-errorMessage': {
                maximum: 'The child cannot be older than 40yo.',
              },
            },
          },
        }),
        config: {
          customProperties: {
            child_age: {
              minimum: (values, { maximum }) => {
                const minimumAge = values.parent_age / 2;
                if (
                  maximum > minimumAge && // prevent invalid out-of-range maximum
                  values.parent_age > values.child_age * 2 // parent is 2x as big as child age
                ) {
                  return {
                    minimum: minimumAge,
                    'x-jsf-errorMessage': {
                      minimum: `The child cannot be younger than half of the parent. Must be at least ${minimumAge}yo.`,
                    },
                  };
                }

                return null;
              },
            },
          },
        },
      });
      validateNumberParams(
        {
          ...mockNumberInput,
          name: 'child_age',
          minimum: 5,
          maximum: 40,
        },
        fields[1]
      );

      // applies the errorMessage by default
      expect(validateForm({ parent_age: 50, child_age: 45 })).toEqual({
        child_age: 'The child cannot be older than 40yo.',
      });
      // applies the config.errorMessage if it's triggered
      expect(validateForm({ parent_age: 50, child_age: 10 })).toEqual({
        child_age: `The child cannot be younger than half of the parent. Must be at least 25yo.`,
      });
    });
  });

  describe('invalid validations', () => {
    it('outside the schema range logs warning', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            parent_age: {
              minimum: 0,
            },
          },
        },
      });

      validateNumberParams(
        { ...mockNumberInput, minimum: 5, maximum: 100, name: 'parent_age' },
        fields[0]
      );

      // Keeps the default validation
      expect(validateForm({ parent_age: 0 })).toEqual({
        parent_age: 'Must be greater or equal to 5',
      });

      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        'Custom validation for parent_age is not allowed because minimum:0 is less strict than the original range: 5 to 100'
      );
      // eslint-disable-next-line no-console
      console.warn.mockClear();
    });

    it('null or undefined ignores validation', () => {
      const { fields, validateForm } = createScenario({
        schema: schemaBasic(),
        config: {
          customProperties: {
            parent_age: {
              minimum: undefined,
              maximum: null,
            },
          },
        },
      });

      // The original validation is kept
      validateNumberParams(
        { ...mockNumberInput, minimum: 5, maximum: 100, name: 'parent_age' },
        fields[0]
      );

      expect(validateForm({ parent_age: 0 })).toEqual({
        parent_age: 'Must be greater or equal to 5',
      });

      expect(validateForm({ parent_age: 200 })).toEqual({
        parent_age: 'Must be smaller or equal to 100',
      });
    });
  });
});
