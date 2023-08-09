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
              oneOf: [
                {
                  const: 'yes',
                },
                { const: 'no' },
              ],
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
