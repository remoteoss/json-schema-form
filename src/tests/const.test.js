import { createHeadlessForm } from '../createHeadlessForm';

describe('validations: const', () => {
  it('Should work for number', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          ten_only: { type: 'number', const: 10 },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ ten_only: 1 }).formErrors).toEqual({
      ten_only: 'The only accepted value is 10.',
    });
    expect(handleValidation({ ten_only: 10 }).formErrors).toBeUndefined();
    // null is also considered valid until we fix @BUG RMT-518
    // Expectation: To fail with error "The only accepted value is 10."
    expect(handleValidation({ ten_only: null }).formErrors).toBeUndefined();
  });

  it('Should work for when the number is 0', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          zero_only: { type: 'number', const: 0 },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ zero_only: 1 }).formErrors).toEqual({
      zero_only: 'The only accepted value is 0.',
    });
    expect(handleValidation({ zero_only: 0 }).formErrors).toBeUndefined();
    // null is also considered valid until we fix @BUG RMT-518
    // Expectation: To fail with error "The only accepted value is 0."
    expect(handleValidation({ zero_only: null }).formErrors).toBeUndefined();
  });

  it('Should work for text', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          hello_only: { type: 'string', const: 'hello' },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ hello_only: 'what' }).formErrors).toEqual({
      hello_only: 'The only accepted value is hello.',
    });
    expect(handleValidation({ hello_only: 'hello' }).formErrors).toEqual(undefined);
  });

  it('Should work for a conditionally applied const', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          answer: { type: 'string', oneOf: [{ const: 'yes' }, { const: 'no' }] },
          amount: {
            description: 'If you select yes, this needs to be exactly 10.',
            type: 'number',
          },
        },
        allOf: [
          {
            if: { properties: { answer: { const: 'yes' } }, required: ['answer'] },
            then: { properties: { amount: { const: 10 } }, required: ['amount'] },
          },
        ],
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ answer: 'no' }).formErrors).toEqual(undefined);
    expect(handleValidation({ answer: 'yes' }).formErrors).toEqual({ amount: 'Required field' });
    expect(handleValidation({ answer: 'yes', amount: 1 }).formErrors).toEqual({
      amount: 'The only accepted value is 10.',
    });
    expect(handleValidation({ answer: 'yes', amount: 10 }).formErrors).toEqual(undefined);
  });

  it('Should show the custom error message', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          string: {
            type: 'string',
            const: 'hello',
            'x-jsf-errorMessage': { const: 'You must say hello!!!' },
          },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ string: 'hi' }).formErrors).toEqual({
      string: 'You must say hello!!!',
    });
    expect(handleValidation({ string: 'hello' }).formErrors).toEqual(undefined);
  });

  it('Should have value attribute for when const & default is present', () => {
    const { fields } = createHeadlessForm(
      {
        properties: {
          ten_only: { type: 'number', const: 10, default: 10 },
        },
      },
      { strictInputType: false }
    );
    expect(fields[0]).toMatchObject({ forcedValue: 10, const: 10, default: 10 });
  });
});

describe('const/default with forced values', () => {
  it('Should work for when the number is 0', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          zero_only: { type: 'number', const: 0, default: 0 },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ zero_only: 1 }).formErrors).toEqual({
      zero_only: 'The only accepted value is 0.',
    });
    expect(fields[0]).toMatchObject({ forcedValue: 0, const: 0, default: 0 });
    expect(handleValidation({ zero_only: 0 }).formErrors).toBeUndefined();
    // null is also considered valid until we fix @BUG RMT-518
    // Expectation: To fail with error "The only accepted value is 0."
    expect(handleValidation({ zero_only: null }).formErrors).toBeUndefined();
  });

  it('Should work for number', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          ten_only: { type: 'number', const: 10, default: 10 },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ ten_only: 1 }).formErrors).toEqual({
      ten_only: 'The only accepted value is 10.',
    });
    expect(handleValidation({ ten_only: 10 }).formErrors).toBeUndefined();
    expect(fields[0]).toMatchObject({ forcedValue: 10, const: 10, default: 10 });
    // null is also considered valid until we fix @BUG RMT-518
    // Expectation: To fail with error "The only accepted value is 10."
    expect(handleValidation({ ten_only: null }).formErrors).toBeUndefined();
  });

  it('do not set a forced value if const and default do not equal', () => {
    const { fields } = createHeadlessForm(
      {
        properties: {
          bad_field_for_number: { type: 'number', const: 10, default: 20 },
        },
      },
      { strictInputType: false }
    );
    expect(fields[0]).not.toMatchObject({ forcedValue: expect.any(Number) });
  });

  it('Should work numbers with non-standard input types', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          number: {
            type: 'integer',
            const: 300,
            default: 300,
            'x-jsf-presentation': {
              inputType: 'money',
            },
          },
        },
        required: ['number'],
      },
      { strictInputType: true }
    );
    expect(handleValidation({ number: 0 }).formErrors).toEqual({
      number: 'The only accepted value is 300.',
    });
    expect(handleValidation({ number: 300 }).formErrors).toBeUndefined();
    expect(fields[0]).toMatchObject({ forcedValue: 300 });
  });
});

describe('OneOf const', () => {
  it('Validates numbers or strings correctly', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          number: { type: 'number', oneOf: [{ const: 0 }, { const: 1 }, { const: 2 }] },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ number: 3 }).formErrors).toEqual({
      number: 'The option 3 is not valid.',
    });
    expect(handleValidation({ number: 2 }).formErrors).toBeUndefined();
    expect(handleValidation({ number: '2' }).formErrors).toEqual({
      number: 'The option "2" is not valid.',
    });
  });

  it('Validates numbers or strings when type is an array with null', () => {
    const { handleValidation } = createHeadlessForm(
      {
        properties: {
          number: { type: ['number', 'null'], oneOf: [{ const: 0 }, { const: 1 }, { const: 2 }] },
        },
      },
      { strictInputType: false }
    );
    expect(handleValidation({}).formErrors).toEqual(undefined);
    expect(handleValidation({ number: 3 }).formErrors).toEqual({
      number: 'The option 3 is not valid.',
    });
    expect(handleValidation({ number: 2 }).formErrors).toBeUndefined();
    expect(handleValidation({ number: '2' }).formErrors).toEqual({
      number: 'The option "2" is not valid.',
    });
    expect(handleValidation({ number: null }).formErrors).toEqual(undefined);
  });
});
