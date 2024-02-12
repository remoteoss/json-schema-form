import { createHeadlessForm } from '../createHeadlessForm';

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

describe('Conditional attributes updated', () => {
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
