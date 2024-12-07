export const basicConditionalTestCases = [
  {
    title: 'Basic if/then condition',
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        otherField: { type: 'string' },
      },
      if: {
        properties: {
          field: { const: 'yes' },
        },
        required: ['field'],
      },
      then: {
        required: ['otherField'],
      },
    } as const,
    validTestCases: [{ data: { field: 'no' } }, { data: { field: 'yes', otherField: 'test' } }],
    invalidTestCases: [
      {
        data: { field: 'yes' },
        error: { otherField: 'Field is required' },
      },
    ],
  },
];
