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

describe('Conditional attributes - remove stale', () => {
  it('Remove stale attributes: common case with const, default, minimum', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          apply_condition: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          tabs: { type: 'number' },
        },
        allOf: [
          {
            if: {
              properties: { apply_condition: { const: 'yes' } },
              required: ['apply_condition'],
            },
            then: {
              properties: {
                tabs: {
                  const: 10,
                  default: 10,
                },
              },
            },
            else: {
              properties: {
                tabs: {
                  minimum: 5,
                },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );

    // Given "Yes" it applies "const" and "default"
    expect(handleValidation({ apply_condition: 'yes', tabs: 5 }).formErrors).toEqual({
      tabs: 'The only accepted value is 10.',
    });
    expect(fields[1]).toMatchObject({ const: 10, default: 10 });
    expect(fields[1].minimum).toBeUndefined();

    // Changing to "No", applies the "minimum" and cleans "const" and "default"
    expect(handleValidation({ apply_condition: 'no', tabs: 5 }).formErrors).toBeUndefined();
    expect(fields[1]).toMatchObject({ minimum: 5 });
    expect(fields[1].const).toBeUndefined();
    expect(fields[1].default).toBeUndefined();

    // Changing back to "Yes", it removes "minimum", and applies "const" and "default"
    expect(handleValidation({}).formErrors).toBeUndefined();
    expect(handleValidation({ apply_condition: 'yes', tabs: 10 }).formErrors).toBeUndefined();
    expect(fields[1].minimum).toBeUndefined();
    expect(fields[1]).toMatchObject({ const: 10, default: 10 });
  });

  it('Remove attributes: a new attribute (eg description)', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          apply_condition: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          tabs: {
            type: 'number',
          },
        },
        allOf: [
          {
            if: {
              properties: { apply_condition: { const: 'yes' } },
              required: ['apply_condition'],
            },
            then: {
              properties: {
                tabs: {
                  description: 'We recommend 10 tabs.',
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
    expect(handleValidation({ apply_condition: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 10 tabs.');

    // Changing to "No", removes the description
    expect(handleValidation({ apply_condition: 'no' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBeUndefined();

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ apply_condition: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 10 tabs.');
  });

  it('Remove attributes: an existing attribute (eg description)', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          apply_condition: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          tabs: {
            type: 'number',
            description: 'Any value works.',
          },
        },
        allOf: [
          {
            if: {
              properties: { apply_condition: { const: 'yes' } },
              required: ['apply_condition'],
            },
            then: {
              properties: {
                tabs: {
                  description: 'We recommend 10 tabs.',
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
    expect(handleValidation({ apply_condition: 'yes', tabs: 5 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 10 tabs.');

    // Changing to "No", it applies the base value again.
    expect(handleValidation({ apply_condition: 'no', tabs: 5 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('Any value works.');

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ apply_condition: 'yes', tabs: 10 }).formErrors).toBeUndefined();
    expect(fields[1].description).toBe('We recommend 10 tabs.');
  });

  it('Remove attributes: a nested attribute', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          apply_condition: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          tabs: {
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
              properties: { apply_condition: { const: 'yes' } },
              required: ['apply_condition'],
            },
            then: {
              properties: {
                tabs: {
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
    expect(handleValidation({ apply_condition: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('danger');

    // Changing to "No", it applies the base value again.
    expect(handleValidation({ apply_condition: 'no' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('info');

    // Changing back to "Yes", it sets the attribute again
    expect(handleValidation({ apply_condition: 'yes' }).formErrors).toBeUndefined();
    expect(fields[1].anything).toBe('danger');
  });
});
