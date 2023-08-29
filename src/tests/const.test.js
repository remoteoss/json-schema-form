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
});
