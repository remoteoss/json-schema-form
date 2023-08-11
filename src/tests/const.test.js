import { createHeadlessForm } from '../createHeadlessForm';

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
  expect(handleValidation({ ten_only: 10 }).formErrors).toEqual(undefined);
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
        amount: { description: 'If you select yes, this needs to be exactly 10.', type: 'number' },
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