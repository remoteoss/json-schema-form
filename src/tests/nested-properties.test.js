import { createHeadlessForm } from '../createHeadlessForm';

describe('nested properties', () => {
  it('works', () => {
    const { fields, handleValidation } = createHeadlessForm(
      {
        properties: {
          parent: {
            type: 'object',
            properties: {
              child: { type: 'string' },
            },
          },
          has_child: { type: 'boolean' },
        },
        allOf: [
          {
            if: { properties: { has_child: { const: true } } },
            then: {
              properties: {
                parent: { properties: { child: { title: 'Child name?' } }, required: ['child'] },
              },
            },
          },
        ],
      },
      { strictInputType: false }
    );
    expect(handleValidation({ has_child: true }).formErrors).toEqual({
      parent: { child: 'Required field' },
    });
    expect(fields[0]).toEqual({});
  });
});
