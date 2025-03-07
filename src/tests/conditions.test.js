import { createHeadlessForm } from '@/createHeadlessForm';

describe('Conditional attributes updated', () => {
  it('Should allow check of a nested property in a conditional', () => {
    const { handleValidation } = createHeadlessForm(
      {
        additionalProperties: false,
        allOf: [
          {
            if: {
              properties: {
                parent: {
                  properties: {
                    child: {
                      const: 'yes',
                    },
                  },
                  required: ['child'],
                },
              },
              required: ['parent'],
            },
            then: { required: ['parent_sibling'] },
          },
        ],
        properties: {
          parent: {
            additionalProperties: false,
            properties: {
              child: {
                oneOf: [{ const: 'yes' }, { const: 'no' }],
                type: 'string',
              },
            },
            required: ['child'],
            type: 'object',
          },
          parent_sibling: {
            type: 'integer',
          },
        },
        required: ['parent'],
        type: 'object',
      },
      { strictInputType: false }
    );
    expect(handleValidation({ parent: { child: 'no' } }).formErrors).toEqual(undefined);
    expect(handleValidation({ parent: { child: 'yes' } }).formErrors).toEqual({
      parent_sibling: 'Required field',
    });
    expect(handleValidation({ parent: { child: 'yes' }, parent_sibling: 1 }).formErrors).toEqual(
      undefined
    );
  });

  it('Update basic case with const, default, maximum', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          hours: { type: 'number' },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                hours: {
                  const: 8,
                  default: 8,
                },
              },
            },
            else: {
              properties: {
                hours: {
                  maximum: 4,
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // Given "Yes" it applies "const" and "default"
    expect(handleValidation({ is_full_time: 'yes', hours: 4 }).formErrors).toEqual({
      hours: 'The only accepted value is 8.',
    });
    expect(fields[1]).toMatchObject({ const: 8, default: 8 });
    expect(fields[1].maximum).toBeUndefined();

    // Changing to "No", applies the "maximum" and cleans "const" and "default"
    expect(handleValidation({ is_full_time: 'no', hours: 4 }).formErrors).toBeUndefined();
    expect(fields[1]).toMatchObject({ maximum: 4 });
    expect(fields[1].const).toBeUndefined();
    expect(fields[1].default).toBeUndefined();

    // Changing back to "Yes", it removes "maximum", and applies "const" and "default"
    expect(handleValidation({}).formErrors).toBeUndefined();
    expect(handleValidation({ is_full_time: 'yes', hours: 8 }).formErrors).toBeUndefined();
    expect(fields[1].maximum).toBeUndefined();
    expect(fields[1]).toMatchObject({ const: 8, default: 8 });
  });

  it('Update a new attribute (eg description)', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          hours: {
            type: 'number',
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                hours: {
                  description: 'We recommend 8 hours.',
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // By default the attribute is not set.
    expect(fields[1].description).toBeUndefined();

    // Given "Yes" it applies the conditional attribute
    expect(handleValidation({ is_full_time: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 8 hours.');

    // Changing to "No", removes the description
    expect(handleValidation({ is_full_time: 'no' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBeUndefined();

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ is_full_time: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 8 hours.');
  });

  it('Update an existing attribute (eg description)', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          hours: {
            type: 'number',
            description: 'Any value works.',
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                hours: {
                  description: 'We recommend 8 hours.',
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // By default the attribute is set the base value.
    expect(fields[1].description).toBe('Any value works.');

    // Given "Yes" it applies the conditional attribute
    expect(handleValidation({ is_full_time: 'yes', hours: 4 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 8 hours.');

    // Changing to "No", it applies the base value again.
    expect(handleValidation({ is_full_time: 'no', hours: 4 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('Any value works.');

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ is_full_time: 'yes', hours: 8 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 8 hours.');
  });

  it('Update a nested attribute', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          hours: {
            type: 'number',
            presentation: {
              inputType: 'number',
              anything: 'info',
            },
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                hours: {
                  presentation: {
                    anything: 'danger',
                  },
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // By default the attribute is set the base value.
    expect(fields[1].anything).toBe('info');

    // Given "Yes" it applies the conditional attribute
    expect(handleValidation({ is_full_time: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('danger');

    // Changing to "No", it applies the base value again.
    expect(handleValidation({ is_full_time: 'no' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('info');

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ is_full_time: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('danger');
  });

  it('Keeps existing attributes in matches that dont change the attr', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          hours: {
            type: 'number',
            description: 'Any value works.',
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              required: ['hours'],
            },
            else: {
              properties: {
                hours: false,
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // By default the attribute is set the base value, even though the field is invisible.
    expect(fields[1].description).toBe('Any value works.');
    expect(fields[1].isVisible).toBe(false);

    // Given "Yes" it keeps the base value
    expect(handleValidation({ is_full_time: 'yes' }).formErrors).toEqual({
      hours: 'Required field',
    });
    expect(fields[1].description).toBe('Any value works.');
    expect(fields[1].isVisible).toBe(true);

    // Changing to "No" it keeps the base value
    expect(handleValidation({ is_full_time: 'no' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('Any value works.');
    expect(fields[1].isVisible).toBe(false);
  });

  it('Keeps internal attributes (dynamicInternalJsfAttrs)', () => {
    // This is necessary while we keep supporting "type", even if deprecated
    // otherwise our Remote app will break because it didn't migrate
    // from "type" to "inputType" yet.
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          salary_period: {
            type: 'string',
            title: 'Salary period',
            oneOf: [
              { title: 'Weekly', const: 'weekly' },
              { title: 'Monthly', const: 'monthly' },
            ],
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                salary_period: {
                  description: 'We recommend montlhy.',
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // Given "Yes" it keeps the "type"
    handleValidation({ is_full_time: 'yes' });

    // All the following attrs are never removed
    // during conditionals because they are core.
    expect(fields[1]).toMatchObject({
      name: 'salary_period',
      label: 'Salary period',
      required: false,
      type: 'radio',
      inputType: 'radio',
      jsonType: 'string',
      computedAttributes: {},
      calculateConditionalProperties: expect.any(Function),
      schema: expect.any(Object),
      scopedJsonSchema: expect.any(Object),
      isVisible: true,
      options: [
        {
          label: 'Weekly',
          value: 'weekly',
        },
        {
          label: 'Monthly',
          value: 'monthly',
        },
      ],
    });
  });

  it('Keeps custom attributes (dynamicInternalJsfAttrs) (hotfix temporary)', () => {
    // This is necessary as hotfix because we (Remote) use it internally.
    // Not cool, we'll need a better solution asap.
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          is_full_time: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          salary_period: {
            type: 'string',
            title: 'Salary period',
            oneOf: [
              { title: 'Weekly', const: 'weekly' },
              { title: 'Monthly', const: 'monthly' },
            ],
          },
        },
        allOf: [
          {
            if: {
              properties: { is_full_time: { const: 'yes' } },
              required: ['is_full_time'],
            },
            then: {
              properties: {
                salary_period: {
                  description: 'We recommend montlhy.',
                },
              },
            },
          },
        ],
      },
      {
        strictInputType: false,
        customProperties: {
          salary_period: {
            Component: '<A React Component>',
            calculateDynamicProperties: () => true,
          },
        },
      }
    );

    // It's there by default
    expect(fields[1].Component).toBe('<A React Component>');
    expect(fields[1].calculateDynamicProperties).toEqual(expect.any(Function));

    // Given "Yes", it stays there too.
    handleValidation({ is_full_time: 'yes' });
    expect(fields[1].Component).toBe('<A React Component>');
    expect(fields[1].calculateDynamicProperties).toEqual(expect.any(Function));

    // Given "No", it stays there too.
    handleValidation({ is_full_time: 'no' });
    expect(fields[1].Component).toBe('<A React Component>');
    expect(fields[1].calculateDynamicProperties).toEqual(expect.any(Function));

    expect(fields[1].visibilityCondition).toEqual(undefined);
    // visibilityCondition can be externally changed/updated/added, it stays there too;
    fields[1].visibilityCondition = () => false;
    handleValidation({ is_full_time: 'no' });
    expect(fields[1].visibilityCondition).toEqual(expect.any(Function));
  });
});

describe('Conditional with a minimum value check', () => {
  it('Should handle a maximum as a property field check', () => {
    const schema = {
      additionalProperties: false,
      allOf: [
        {
          if: {
            properties: {
              salary: {
                maximum: 119999,
              },
            },
            required: ['salary'],
          },
          then: {
            required: ['reason'],
          },
          else: {
            properties: {
              reason: false,
            },
          },
        },
      ],
      properties: {
        salary: {
          type: 'number',
          'x-jsf-presentation': {
            inputType: 'money',
          },
        },
        reason: {
          oneOf: [
            {
              const: 'reason_one',
            },
            {
              const: 'reason_two',
            },
          ],
          type: 'string',
        },
      },
      required: ['salary'],
      type: 'object',
    };

    const { handleValidation } = createHeadlessForm(schema, { strictInputType: false });
    expect(handleValidation({ salary: 120000 }).formErrors).toEqual(undefined);
    expect(handleValidation({ salary: 1000 }).formErrors).toEqual({
      reason: 'Required field',
    });
    expect(handleValidation({ salary: 1000, reason: 'reason_one' }).formErrors).toEqual(undefined);
  });
});

describe('Conditional with literal booleans', () => {
  it('handles true case', () => {
    const schema = {
      properties: {
        is_full_time: {
          type: 'boolean',
        },
        salary: {
          type: 'number',
        },
      },
      required: [],
      if: true,
      then: {
        required: ['is_full_time'],
      },
      else: {
        required: ['salary'],
      },
    };
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    handleValidation({});

    expect(fields[0]).toMatchObject({
      name: 'is_full_time',
      required: true,
    });
    expect(fields[1]).toMatchObject({
      name: 'salary',
      required: false,
    });
  });

  it('handles false case', () => {
    const schema = {
      properties: {
        is_full_time: {
          type: 'boolean',
        },
        salary: {
          type: 'number',
        },
      },
      required: [],
      if: false,
      then: {
        required: ['is_full_time'],
      },
      else: {
        required: ['salary'],
      },
    };
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    handleValidation({});

    expect(fields[0]).toMatchObject({
      name: 'is_full_time',
      required: false,
    });
    expect(fields[1]).toMatchObject({
      name: 'salary',
      required: true,
    });
  });
});

describe('Conditional with anyOf', () => {
  const schema = {
    additionalProperties: false,
    type: 'object',
    properties: {
      field_a: { type: 'string' },
      field_b: { type: 'string' },
      field_c: { type: 'string' },
    },
    allOf: [
      {
        if: {
          anyOf: [
            { properties: { field_a: { const: '1' } }, required: ['field_a'] },
            { properties: { field_b: { const: '2' } }, required: ['field_b'] },
          ],
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
  };

  it('handles true case', () => {
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    expect(fields[2].isVisible).toBe(false);
    expect(handleValidation({ field_a: 'x', field_b: '2' }).formErrors).toEqual({
      field_c: 'Required field',
    });
    expect(fields[2].isVisible).toBe(true);
  });

  it('handles false case', () => {
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    expect(fields[2].isVisible).toBe(false);
    expect(handleValidation({ field_a: 'x', field_b: 'x' }).formErrors).toBeUndefined();
    expect(fields[2].isVisible).toBe(false);
  });
});

describe('Conditional with fieldsets', () => {
  const schema = {
    additionalProperties: false,
    type: 'object',
    properties: {
      field_a: {
        type: 'object',
        properties: {
          min: { type: 'number' },
          max: { type: 'number' },
        },
      },
      field_b: { type: 'string' },
    },
    allOf: [
      {
        if: {
          properties: {
            field_a: {
              properties: {
                min: {
                  minimum: 10,
                },
              },
              required: ['min'],
            },
          },
          required: ['field_a'],
        },
        then: {
          required: ['field_b'],
        },
        else: {
          properties: {
            field_b: false,
          },
        },
      },
    ],
  };

  it('handles true case', () => {
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    expect(fields[1].isVisible).toBe(false);
    expect(handleValidation({ field_a: { min: 100 } }).formErrors).toEqual({
      field_b: 'Required field',
    });
    expect(fields[1].isVisible).toBe(true);
  });

  it('handles false case', () => {
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    expect(fields[1].isVisible).toBe(false);
    expect(handleValidation({ field_a: { min: 1 } }).formErrors).toBeUndefined();
    expect(fields[1].isVisible).toBe(false);
  });

  it('handles undefined fieldset case', () => {
    const { fields, handleValidation } = createHeadlessForm(schema, { strictInputType: false });

    expect(fields[1].isVisible).toBe(false);
    expect(handleValidation({}).formErrors).toBeUndefined();
    expect(fields[1].isVisible).toBe(false);
  });
});

describe('Conditionals - bugs and code-smells', () => {
  // Why do we have these bugs?
  // To be honest we never realized it much later later.
  // We will fix them in the next major version.

  const schemaHasPet = {
    type: 'object',
    additionalProperties: false,
    properties: {
      has_pet: {
        title: 'Has Pet',
        description: 'Do you have a pet?',
        oneOf: [
          { title: 'Yes', const: 'yes' },
          { title: 'No', const: 'no' },
        ],
        type: 'string',
      },
      pet_name: {
        title: "Pet's name",
        type: 'string',
      },
    },
    required: ['has_pet'],
    allOf: [
      {
        if: {
          properties: {
            has_pet: { const: 'yes' },
          },
          required: ['has_pet'],
        },
        then: {
          required: ['pet_name'],
        },
        else: {
          properties: {
            pet_name: false,
          },
        },
      },
    ],
  };

  it('Given values from hidden fields, it does not thrown an error (@bug)', () => {
    const { fields, handleValidation } = createHeadlessForm(schemaHasPet, {
      strictInputType: false,
    });

    const petNameField = fields[1];

    const validation = handleValidation({ has_pet: 'no', pet_name: 'Max' });
    expect(petNameField.isVisible).toBe(false);

    // Bug: 🐛 It does not thrown an error,
    // but it should to be compliant with JSON Schema specs.
    expect(validation.formErrors).toBeUndefined();
    // The error should be something like:
    // expect(validation.formErrors).toEqual({ pet_name: 'Not allowed.'});
  });

  it('Given values from hidden fields, it mutates the values (@bug)', () => {
    const { handleValidation } = createHeadlessForm(schemaHasPet, {
      strictInputType: false,
    });

    const newValues = { has_pet: 'no', pet_name: 'Max' };

    const validation = handleValidation(newValues);

    expect(newValues).toEqual({
      has_pet: 'no',
      pet_name: null, // BUG! 🐛 Should still be "Max", should not be mutated.
    });

    // Same bug as explained in the previous test.
    expect(validation.formErrors).toBeUndefined();
  });

  it('Given multiple conditionals to the same field, it only applies the last one (@bug) - case 1', () => {
    const { handleValidation } = createHeadlessForm(
      {
        additionalProperties: false,
        properties: {
          field_a: { type: 'string' },
          field_b: { type: 'string' },
          field_c: { type: 'number' },
        },
        allOf: [
          {
            if: {
              properties: { field_a: { const: 'yes' } },
              required: ['field_a'],
            },
            then: { properties: { field_c: { minimum: 30 } } },
          },
          {
            if: {
              properties: { field_b: { const: 'yes' } },
              required: ['field_b'],
            },
            then: { properties: { field_c: { minimum: 10 } } },
          },
        ],
      },
      {
        strictInputType: false,
      }
    );

    const validation = handleValidation({ field_a: 'yes', field_b: 'yes', field_c: 5 });
    expect(validation.formErrors).toEqual({
      // BUG: 🐛 it should be "Must be greater or equal to 30"
      field_c: 'Must be greater or equal to 10',
    });
  });

  it('Given multiple conditionals to the same field, it only applies the last one (@bug) - case 2', () => {
    const { handleValidation } = createHeadlessForm(
      {
        additionalProperties: false,
        properties: {
          field_a: { type: 'string' },
          field_b: { type: 'string' },
          field_c: { type: 'number' },
        },
        allOf: [
          {
            if: {
              properties: { field_a: { const: 'yes' } },
              required: ['field_a'],
            },
            then: { properties: { field_c: { minimum: 5 } } },
          },
          {
            if: {
              properties: { field_b: { const: 'yes' } },
              required: ['field_b'],
            },
            then: { properties: { field_c: { maximum: 10 } } },
          },
        ],
      },
      {
        strictInputType: false,
      }
    );

    const validation1 = handleValidation({ field_a: 'yes', field_b: 'yes', field_c: 12 });
    expect(validation1.formErrors).toEqual({
      field_c: 'Must be smaller or equal to 10',
    });

    const validation2 = handleValidation({ field_a: 'yes', field_b: 'yes', field_c: 3 });
    // BUG: 🐛 it should be "Must be greater or equal to 5"
    expect(validation2.formErrors).toBeUndefined();
    // expect(validation1.formErrors).toEqual({
    //   field_c: 'Must be greater or equal to 5',
    // });
  });
});
